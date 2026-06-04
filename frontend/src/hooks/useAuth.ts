import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';

/**
 * Access auth state and actions.
 *
 * Must be used inside <AuthProvider>.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Ensure <AuthProvider> wraps your component tree.');
  }
  return context;
}

export default useAuth;
