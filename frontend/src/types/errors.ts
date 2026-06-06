import type { ApiErrorResponse } from './api';

// ─── App Error ────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status?: number;
  public readonly validationErrors?: Record<string, unknown>;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: AppErrorCode,
    status?: number,
    validationErrors?: Record<string, unknown>,
    originalError?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.validationErrors = validationErrors;
    this.originalError = originalError;
  }

  static fromApiError(apiError: ApiErrorResponse): AppError {
    const code = httpStatusToCode(apiError.status);
    return new AppError(
      apiError.message,
      code,
      apiError.status,
      apiError.details,
    );
  }
}

function httpStatusToCode(status: number): AppErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
    case 400:
      return 'VALIDATION_ERROR';
    case 500:
    case 502:
    case 503:
      return 'INTERNAL_SERVER_ERROR';
    default:
      return 'UNKNOWN';
  }
}

// ─── Validation Error ─────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [field: string]: string | undefined;
}

// ─── Auth Error ───────────────────────────────────────────────────────────

export class AuthError extends AppError {
  constructor(message: string, status?: number) {
    super(message, 'UNAUTHORIZED', status);
    this.name = 'AuthError';
  }
}

// ─── Network Error ────────────────────────────────────────────────────────

export class NetworkError extends AppError {
  constructor(message = 'Network request failed. Please check your connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
