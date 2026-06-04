import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getToken, clearToken, clearUser } from '@/utils/localStorage';
import type { ApiErrorResponse } from '@/types/api';
import { AppError } from '@/types/errors';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api/v1';

const REQUEST_TIMEOUT_MS = 10_000;

// ─── Create Instance ──────────────────────────────────────────────────────

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response Interceptor: Error Handling ────────────────────────────────

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      // Network error – no response received
      return Promise.reject(
        new AppError(
          'Network error. Please check your internet connection.',
          'NETWORK_ERROR',
          undefined,
          undefined,
          error,
        ),
      );
    }

    const { status, data } = error.response;

    if (status === 401) {
      // Clear stale credentials and redirect to login
      clearToken();
      clearUser();
      // Use window.location so we don't have a circular dependency with the router
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(
        new AppError(
          data?.message ?? 'Your session has expired. Please log in again.',
          'UNAUTHORIZED',
          status,
          data?.validationErrors,
          error,
        ),
      );
    }

    if (status === 403) {
      return Promise.reject(
        new AppError(
          data?.message ?? 'You do not have permission to perform this action.',
          'FORBIDDEN',
          status,
          data?.validationErrors,
          error,
        ),
      );
    }

    if (status >= 500) {
      return Promise.reject(
        new AppError(
          data?.message ?? 'An internal server error occurred. Please try again later.',
          'INTERNAL_SERVER_ERROR',
          status,
          data?.validationErrors,
          error,
        ),
      );
    }

    if (status === 400 || status === 422) {
      return Promise.reject(
        new AppError(
          data?.message ?? 'Validation failed.',
          'VALIDATION_ERROR',
          status,
          data?.validationErrors,
          error,
        ),
      );
    }

    if (status === 404) {
      return Promise.reject(
        new AppError(data?.message ?? 'Resource not found.', 'NOT_FOUND', status, undefined, error),
      );
    }

    if (status === 409) {
      return Promise.reject(
        new AppError(
          data?.message ?? 'A conflict occurred.',
          'CONFLICT',
          status,
          data?.validationErrors,
          error,
        ),
      );
    }

    return Promise.reject(
      new AppError(
        data?.message ?? 'An unexpected error occurred.',
        'UNKNOWN',
        status,
        data?.validationErrors,
        error,
      ),
    );
  },
);

export default axiosClient;
