# Frontend Architecture: Retailr Platform

**Version:** 1.0  
**Date:** 2026-05-29  
**Framework:** React 18 + TypeScript (strict mode)  
**State Management:** Redux Toolkit (global/server-cache) + Context API (session/theme)

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── index.tsx                    # App entry
│   ├── App.tsx                      # Root component
│   ├── setupTests.ts                # Jest configuration
│   ├── api/
│   │   ├── axiosClient.ts           # Configured Axios instance + interceptors
│   │   └── apiTypes.ts              # Shared API request/response types
│   ├── store/                       # Redux Toolkit
│   │   ├── index.ts                 # Store configuration
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── productsSlice.ts
│   │   │   ├── ordersSlice.ts
│   │   │   ├── suppliersSlice.ts
│   │   │   ├── customersSlice.ts
│   │   │   ├── stockSlice.ts
│   │   │   └── uiSlice.ts           # UI state (modals, notifications, filters)
│   │   └── selectors/
│   │       ├── productSelectors.ts
│   │       ├── orderSelectors.ts
│   │       └── ... (memoized selectors per slice)
│   ├── context/
│   │   ├── AuthContext.tsx          # Session management (user, token refresh)
│   │   ├── ThemeContext.tsx         # Light/dark mode
│   │   └── useAuthContext.ts        # Custom hook
│   ├── hooks/
│   │   ├── useAuth.ts               # Login/logout/token refresh
│   │   ├── useDebouncedValue.ts     # Debounced search input
│   │   ├── usePagination.ts         # Page, size, total tracking
│   │   ├── useStockSubscription.ts  # WebSocket subscription
│   │   ├── useOrderSubscription.ts  # WebSocket subscription
│   │   ├── usePermissions.ts        # Check user roles
│   │   ├── useQuery.ts              # Parse URL query params
│   │   └── ... (others as needed)
│   ├── routes/
│   │   ├── routes.tsx               # Route definitions
│   │   ├── ProtectedRoute.tsx       # Route guard component
│   │   ├── RoleRoute.tsx            # Role-based route guard
│   │   └── useRoleNavigation.ts     # Role-aware nav logic
│   ├── pages/
│   │   ├── Layout/
│   │   │   └── MainLayout.tsx       # App shell (sidebar, header)
│   │   ├── Auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── UnauthorizedPage.tsx
│   │   ├── Dashboard/
│   │   │   └── DashboardPage.tsx    # KPIs, charts, live data
│   │   ├── Products/
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── ProductCreatePage.tsx
│   │   │   └── ProductEditPage.tsx
│   │   ├── Orders/
│   │   │   ├── OrderListPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   ├── OrderCreatePage.tsx
│   │   │   └── OrderConfirmModal.tsx
│   │   ├── Stock/
│   │   │   ├── StockListPage.tsx
│   │   │   ├── StockAdjustModal.tsx
│   │   │   └── AlertsPage.tsx
│   │   ├── Customers/
│   │   │   ├── CustomerListPage.tsx
│   │   │   ├── CustomerDetailPage.tsx
│   │   │   └── CustomerCreatePage.tsx
│   │   └── Admin/
│   │       └── UserManagementPage.tsx
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DataTable.tsx        # Virtualized, sortable, filterable
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchInput.tsx      # Debounced search
│   │   │   ├── FilterBar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx            # Notification system
│   │   │   ├── Skeleton.tsx         # Loading placeholder
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── PermissionGate.tsx   # Show/hide based on role
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductForm.tsx      # Controlled form with validation
│   │   │   └── ProductSelect.tsx    # Dropdown/combobox
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderForm.tsx        # Multi-line form
│   │   │   ├── OrderLineRow.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   ├── stock/
│   │   │   ├── StockLevelChart.tsx
│   │   │   ├── StockAdjustForm.tsx
│   │   │   └── AlertBanner.tsx
│   │   └── ... (domain-specific components)
│   ├── types/
│   │   ├── api.ts                   # API request/response types
│   │   ├── domain.ts                # Domain model types (Product, Order, etc.)
│   │   ├── ui.ts                    # UI state types
│   │   └── errors.ts                # Error envelope types
│   ├── utils/
│   │   ├── validators.ts            # Form validation schemas (Zod)
│   │   ├── formatters.ts            # Format currency, dates, etc.
│   │   ├── localStorage.ts          # Persist auth tokens
│   │   └── websocketClient.ts       # STOMP client setup
│   ├── theme/
│   │   ├── tokens.ts                # Design tokens (colors, spacing, etc.)
│   │   └── styles.css               # Global CSS (or CSS-in-JS setup)
│   └── __tests__/
│       ├── hooks/
│       │   ├── useAuth.test.ts
│       │   ├── useDebouncedValue.test.ts
│       │   └── ...
│       ├── store/
│       │   ├── productsSlice.test.ts
│       │   ├── selectors.test.ts
│       │   └── ...
│       ├── components/
│       │   └── LoginForm.test.tsx
│       └── integration/
│           └── loginFlow.test.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## State Management Strategy

### Redux Toolkit (Server-Cache State)

**What goes in Redux:**
- Products, categories, suppliers (entity tables)
- Orders, order lines
- Customers
- Stock items, stock movements
- Low-stock alerts
- Current user (loaded once on app init, refreshed on token refresh)

**Why:** These entities come from the backend API, are shared across many components, and need memoized selectors for efficient re-renders.

**Slices:**

1. **authSlice** (user profile + token state, **not** the session context)
   ```typescript
   state: {
     user: { id, email, name, roles[] } | null,
     accessToken: string | null,
     loading: boolean,
     error: string | null
   }
   actions: setUser, clearUser, setAccessToken, setLoading, setError
   ```
   **Note:** Authentication (login/logout/refresh) is handled by the Context; Redux stores only the loaded user data.

2. **productsSlice**
   ```typescript
   state: {
     entities: { [productId]: Product },
     ids: productId[],
     ui: {
       currentPage: number,
       pageSize: number,
       totalElements: number,
       sortBy: string,
       filters: { category: number | null, search: string }
     },
     loading: boolean,
     error: string | null
   }
   ```

3. **ordersSlice**
   ```typescript
   state: {
     entities: { [orderId]: Order },
     ids: orderId[],
     ui: {
       currentPage: number,
       filters: { status, customer, dateRange },
       sortBy: string
     },
     loading: boolean,
     error: string | null
   }
   ```

4. **stockSlice**
   ```typescript
   state: {
     items: { [stockItemId]: StockItem },
     movements: { [movementId]: StockMovement },
     alerts: { [alertId]: LowStockAlert },
     loading: boolean
   }
   ```

5. **uiSlice** (application UI state, not feature-specific)
   ```typescript
   state: {
     notifications: { id, type, message, duration }[],
     modals: { isOpen, type, data }
   }
   actions: enqueueNotification, dismissNotification, openModal, closeModal
   ```

**Normalized selectors:**
```typescript
export const selectProductById = (state: RootState, id: number) =>
  state.products.entities[id];

export const selectVisibleProducts = createSelector(
  (state: RootState) => state.products.entities,
  (state: RootState) => state.products.ids,
  (state: RootState) => state.products.ui.filters,
  (entities, ids, filters) => {
    // Filter and return visible items
  }
);
```

### Context API (Session & Theme)

**What goes in Context:**
- Authentication session (login/logout/token-refresh logic, not user data)
- Theme (light/dark mode)

**AuthContext:**
```typescript
interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**ThemeContext:**
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Why Context over Redux:** These are session-scoped, not server-cache. Smaller, more transient state. Context is simpler for auth flows and theme switching.

### Boundary: Redux ↔ Context

- **Redux:** `store.auth.user` (loaded user profile)
- **Context:** `AuthContext.login()`, `AuthContext.logout()` (session methods)
- **How they connect:** `AuthContext.login()` calls the API, receives user + tokens; dispatches `setUser(user)` to Redux; stores token in localStorage/cookie.

## Axios Configuration & Interceptors

**File:** `src/api/axiosClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import store from '../store';
import { setAccessToken, clearUser } from '../store/slices/authSlice';

const axiosClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401, normalize errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('accessToken', data.accessToken);
        store.dispatch(setAccessToken(data.accessToken));

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearUser());
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Normalize error for frontend
    const errorEnvelope = error.response?.data || {
      message: error.message || 'An error occurred'
    };
    return Promise.reject(new Error(errorEnvelope.message));
  }
);

export default axiosClient;
```

## Custom Hooks

### useAuth

Handles login, logout, token refresh. Wraps AuthContext.

```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### useDebouncedValue

Debounces search input (300ms default).

```typescript
export const useDebouncedValue = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
```

### usePagination

Tracks page, size, total; used in paginated list pages.

```typescript
interface PaginationState {
  page: number;
  size: number;
  total: number;
}

export const usePagination = (
  initialSize: number = 20
): PaginationState & {
  goToPage: (page: number) => void;
  setSize: (size: number) => void;
} => {
  const [page, setPage] = useState(0);
  const [size, setSize_] = useState(initialSize);
  const [total, setTotal] = useState(0);

  return {
    page,
    size,
    total,
    goToPage: setPage,
    setSize: setSize_,
    setTotal
  };
};
```

### useStockSubscription

Subscribes to stock updates via WebSocket.

```typescript
export const useStockSubscription = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const stompClient = new StompClient({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000
    });

    stompClient.onConnect = () => {
      stompClient.subscribe('/topic/stock-updates', (message) => {
        const update = JSON.parse(message.body);
        dispatch(updateStockItem(update));
      });
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [dispatch]);
};
```

### usePermissions

Check user roles (authorization gate in components).

```typescript
export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return {
    hasRole: (role: string) => user?.roles?.includes(role) ?? false,
    hasAnyRole: (roles: string[]) => 
      roles.some(role => user?.roles?.includes(role)) ?? false,
    isAdmin: () => user?.roles?.includes('ADMIN') ?? false
  };
};
```

## Routing

**File:** `src/routes/routes.tsx`

```typescript
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../pages/Layout/MainLayout';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ProductListPage from '../pages/Products/ProductListPage';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <ProtectedRoute><DashboardPage /></ProtectedRoute>
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <ProductListPage />
              </ProtectedRoute>
            )
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'create',
            element: (
              <RoleRoute requiredRoles={['ADMIN', 'INVENTORY_MANAGER']}>
                <ProductCreatePage />
              </RoleRoute>
            )
          }
        ]
      },
      {
        path: 'orders',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <OrderListPage />
              </ProtectedRoute>
            )
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'create',
            element: (
              <RoleRoute requiredRoles={['SALES_OFFICER', 'ADMIN']}>
                <OrderCreatePage />
              </RoleRoute>
            )
          }
        ]
      },
      {
        path: 'stock',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <StockListPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'alerts',
            element: (
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'admin',
        element: (
          <RoleRoute requiredRoles={['ADMIN']}>
            <AdminLayout />
          </RoleRoute>
        ),
        children: [
          {
            path: 'users',
            element: <UserManagementPage />
          }
        ]
      }
    ]
  },
  {
    path: '/auth/login',
    element: <LoginPage />
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

export default router;
```

## Testing Strategy

### Unit Tests (Hooks, Reducers, Interceptors)

**useAuth.test.ts:**
```typescript
describe('useAuth', () => {
  it('should call login API and dispatch setUser', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });

    await act(async () => {
      await result.current.login('user@test.com', 'password');
    });

    expect(localStorage.getItem('accessToken')).toBeTruthy();
  });
});
```

**productsSlice.test.ts:**
```typescript
describe('productsSlice', () => {
  it('should normalize products from API response', () => {
    const action = {
      type: 'products/fetchProducts/fulfilled',
      payload: {
        content: [{ id: 1, name: 'Product A' }],
        pageable: { totalElements: 1 }
      }
    };

    const state = productsReducer(initialState, action);
    expect(state.entities[1].name).toBe('Product A');
    expect(state.ids).toContain(1);
  });
});
```

### Component Tests (Key Flows)

**LoginForm.test.tsx:**
```typescript
describe('LoginForm', () => {
  it('should submit login and redirect on success', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'user@test.com' } 
    });
    fireEvent.change(screen.getByLabelText('Password'), { 
      target: { value: 'password' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });
});
```

**OrderCreation.test.tsx:**
```typescript
describe('Order Creation Flow', () => {
  it('should create draft order and show confirmation', async () => {
    render(<OrderCreatePage />);

    // Add order lines
    fireEvent.change(screen.getByLabelText('Customer'), { 
      target: { value: '1' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /add line/i }));

    // Confirm
    fireEvent.click(screen.getByRole('button', { name: /confirm order/i }));

    await waitFor(() => {
      expect(screen.getByText(/order created/i)).toBeInTheDocument();
    });
  });
});
```

## Code Splitting & Performance Optimization

### Route-Level Lazy Loading

```typescript
const ProductListPage = lazy(() => import('../pages/Products/ProductListPage'));
const OrderListPage = lazy(() => import('../pages/Orders/OrderListPage'));

// In routes.tsx
{
  path: 'products',
  element: (
    <Suspense fallback={<Skeleton />}>
      <ProductListPage />
    </Suspense>
  )
}
```

### Component-Level Memoization

```typescript
// Memoize expensive list components
const ProductRow = memo(({ product }: { product: Product }) => (
  <tr>
    <td>{product.name}</td>
    <td>${product.unitPrice}</td>
  </tr>
), (prev, next) => prev.product.id === next.product.id);

// Virtualized table for large lists
const VirtualizedProductTable = ({
  products
}: {
  products: Product[];
}) => (
  <FixedSizeList
    height={600}
    itemCount={products.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        <ProductRow product={products[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

### Selector Memoization

All list selectors use `createSelector` to prevent unnecessary re-renders:

```typescript
export const selectVisibleProducts = createSelector(
  (state: RootState) => state.products.entities,
  (state: RootState) => state.products.ids,
  (state: RootState) => state.products.ui,
  (entities, ids, ui) => {
    return ids
      .filter(id => {
        const product = entities[id];
        // Apply filters
        return (!ui.filters.category || product.categoryId === ui.filters.category) &&
               (!ui.filters.search || product.name.includes(ui.filters.search));
      })
      .map(id => entities[id]);
  }
);
```

## Environment Variables

**.env.example:**
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_ENV=development
```

## Accessibility & WCAG AA

- Semantic HTML (`<button>`, `<input>`, `<form>`)
- ARIA labels on custom components (`aria-label`, `aria-labelledby`, `aria-live`)
- Focus management in modals (trap focus, restore on close)
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast (minimum 4.5:1 for normal text, 3:1 for large)
- Meaningful link text (no "click here")

## Error Handling

**Global Error Boundary:**
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    // Log to error tracking service
    // Show user-friendly message
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}
```

**Async Error Handling (Components):**
```typescript
const ProductListPage = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector(selectProductsUI);

  useEffect(() => {
    dispatch(fetchProducts({ page: 0, size: 20 }));
  }, [dispatch]);

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (data.length === 0) return <EmptyState />;

  return <ProductTable products={data} />;
};
```

## Next Steps

This architecture is the contract for all frontend work:
1. Set up store, slices, selectors
2. Implement Axios + auth flow
3. Build route structure + protected routes
4. Implement shared components (tables, filters, forms)
5. Build feature pages (products, orders, stock)
6. Integrate WebSocket subscriptions
7. Tests + accessibility audit
