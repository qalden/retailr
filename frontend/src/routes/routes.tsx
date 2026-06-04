import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import { MainLayout } from '@/pages/Layout/MainLayout';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────
// Pages are stub components until feature pages are built.

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductListPage = lazy(() => import('@/pages/Products/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/pages/Products/ProductDetailPage'));
const ProductCreatePage = lazy(() => import('@/pages/Products/ProductCreatePage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const CustomerListPage = lazy(() => import('@/pages/Customers/CustomerListPage'));
const CustomerCreatePage = lazy(() => import('@/pages/Customers/CustomerCreatePage'));
const StockPage = lazy(() => import('@/pages/StockPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));

// ─── Loading Fallback ─────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
    }}
    aria-label="Loading page"
  >
    <span>Loading…</span>
  </div>
);

// ─── Routes ───────────────────────────────────────────────────────────────

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />

      {/* Protected routes — all authenticated users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/create"
        element={
          <ProtectedRoute>
            <ProductCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MainLayout>
              <OrdersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Role-restricted routes */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SALES_OFFICER']}>
              <CustomerListPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/create"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_SALES_OFFICER']}>
              <CustomerCreatePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RoleRoute allowedRoles={['ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER']}>
                <StockPage />
              </RoleRoute>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
);
