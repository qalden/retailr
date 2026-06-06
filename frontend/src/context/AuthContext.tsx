import React, { createContext, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import {
  setCredentials,
  clearAuth as clearAuthAction,
  setLoading,
  setError,
  selectCurrentUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
} from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store';
import type { User } from '@/types/domain';
import type { LoginRequest } from '@/types/api';
import { persistAuth, clearAuth as clearLocalStorage, getToken, getUser } from '@/utils/localStorage';
import axiosClient from '@/api/axiosClient';
import type { LoginResponse } from '@/types/api';

// ─── Context Shape ────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

// ─── Provider ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  // On app load, restore persisted auth from localStorage
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken && storedUser) {
      dispatch(
        setCredentials({
          user: storedUser,
          token: storedToken,
        }),
      );
    }
  }, [dispatch]);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const { data } = await axiosClient.post<LoginResponse>('/auth/login', credentials);

      // Map LoginResponse.UserDTO to domain User
      const domainUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        // Cast string[] roles from API to UserRole[] — gateway ensures valid role values
        roles: data.user.roles as User['roles'],
        createdAt: new Date().toISOString(), // not returned by login
      };

      persistAuth(data.accessToken, domainUser, data.refreshToken);

      dispatch(
        setCredentials({
          user: domainUser,
          token: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Login failed'));
      throw err;
    }
  }, [dispatch]);

  const logout = useCallback((): void => {
    clearLocalStorage();
    dispatch(clearAuthAction());
  }, [dispatch]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated, isLoading, login, logout }),
    [user, token, isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
