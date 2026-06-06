import type { User } from '@/types/domain';
import { UserSchema } from '@/utils/validators';

// ─── Keys ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = (import.meta.env.VITE_TOKEN_KEY as string | undefined) ?? 'retailr_access_token';
const REFRESH_TOKEN_KEY = 'retailr_refresh_token';
const USER_KEY = (import.meta.env.VITE_USER_KEY as string | undefined) ?? 'retailr_user';

// ─── Access Token ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage might be full or unavailable (e.g., private browsing restrictions)
    console.error('[localStorage] Failed to set token');
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    console.error('[localStorage] Failed to set refresh token');
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

// ─── User ─────────────────────────────────────────────────────────────────

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return UserSchema.parse(parsed);
  } catch {
    clearUser();
    return null;
  }
}

export function setUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    console.error('[localStorage] Failed to set user');
  }
}

export function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore
  }
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────

/** Persist both tokens and user in one call. */
export function persistAuth(token: string, user: User, refreshToken?: string): void {
  setToken(token);
  setUser(user);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

/** Clear all auth data from localStorage. */
export function clearAuth(): void {
  clearToken();
  clearRefreshToken();
  clearUser();
}
