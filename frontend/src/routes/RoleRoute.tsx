import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/domain';

interface RoleRouteProps {
  children: ReactNode;
  /** Roles that are permitted to access this route. Any match grants access. */
  allowedRoles: UserRole[];
}

/**
 * Wraps a route and redirects users without the required role to /unauthorized.
 * Must be nested inside <ProtectedRoute> to guarantee `user` is non-null.
 */
const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Should not happen when nested correctly, but guard defensively
    return <Navigate to="/login" replace />;
  }

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
