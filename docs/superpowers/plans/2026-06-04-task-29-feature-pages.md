# Task 29: Feature Pages & Shared Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this task. Each subtask below should be dispatched to a fresh subagent with two-stage review.

**Goal:** Implement all frontend feature pages (Products, Orders, Customers, Stock) and shared UI components (DataTable, Forms, Layout) enabling full CRUD operations on all entities.

**Architecture:** Page components fetch data via Redux actions + Axios, display in DataTable/Forms, handle loading/error states, integrate with theme tokens and design system from Task 28.

**Dependencies:** Task 28 (Frontend Foundation) must be complete. All pages build on: Redux store (productsSlice, ordersSlice, etc.), Axios client with JWT auth, Auth context, React Router v6, Zod validators, theme tokens.

---

## Scope

Task 29 builds 17 new files across 5 categories:

1. **Layout & Navigation (2 files):** MainLayout wrapper, navigation structure
2. **Shared Components (8 files):** DataTable, Pagination, Forms, Modals, error/loading states
3. **Feature Pages (6 files):** 3 product pages, 2 order pages, 1 customer list, 1 stock list
4. **Domain Components (3 files):** ProductForm, OrderForm, StockAdjustForm specialized for domain logic
5. **Hooks & Utilities (2 files):** usePagination, useQuery helper hooks, websocket subscriptions setup

**Does NOT include:** Real-time WebSocket subscriptions (Task 30), Advanced search/filtering (Task 31), Dashboard/analytics (Task 32), Design polish & accessibility (Task 33).

---

## Subtasks

### Subtask 29.1: Layout & Navigation Components

**Files to create:**
- `frontend/src/pages/Layout/MainLayout.tsx`
- `frontend/src/components/shared/Header.tsx`
- `frontend/src/components/shared/Sidebar.tsx`

**Description:** MainLayout wraps all pages with Header (logo, user menu) and Sidebar (navigation links). Header shows user name, logout button. Sidebar shows links to Products, Orders, Customers, Stock, styled with theme tokens.

**Acceptance Criteria:**
- MainLayout is a functional component with `{ children }` prop
- Header renders user.name from useAuth, logout button calls auth.logout()
- Sidebar navigation links wrap in Link from react-router-dom
- All use CSS custom properties from theme/styles.css (not hardcoded colors)
- Pages render inside MainLayout outlet (child routes)
- Compiles without errors

---

### Subtask 29.2: Shared DataTable Component

**Files to create:**
- `frontend/src/components/shared/DataTable.tsx`
- `frontend/src/components/shared/Pagination.tsx`
- `frontend/src/hooks/usePagination.ts`

**Description:** Reusable DataTable accepts `columns`, `data`, `loading`, `error` props. Renders rows with actions (edit, delete). Pagination component handles page navigation. usePagination hook manages pageNumber, pageSize state.

**Acceptance Criteria:**
- DataTable renders th headers from columns array
- DataTable renders td rows from data array
- DataTable shows Skeleton loading rows when loading=true
- DataTable shows EmptyState when data is empty
- DataTable shows error message when error prop present
- Pagination component renders Next/Prev buttons, disabled when at boundary
- usePagination hook returns { pageNumber, pageSize, goToPage, nextPage, prevPage }
- Keyboard accessible (buttons can be tabbed, proper ARIA labels)
- Compiles without errors

---

### Subtask 29.3: Form Components (Shared)

**Files to create:**
- `frontend/src/components/shared/Modal.tsx`
- `frontend/src/components/shared/SearchInput.tsx`
- `frontend/src/components/shared/FilterBar.tsx`

**Description:** Modal component (generic container with title, close button, children). SearchInput is controlled input with debouncing (1s delay). FilterBar shows filters for a list (status, date range, etc.).

**Acceptance Criteria:**
- Modal accepts `open`, `onClose`, `title`, `children` props
- Modal renders Backdrop that closes on click
- Modal content centered on screen, readable text contrast
- SearchInput accepts `value`, `onChange`, `placeholder` props
- SearchInput debounces onChange calls by 1000ms
- FilterBar accepts `filters` array (label/value pairs), renders as buttons/selects
- All components use theme tokens (spacing, colors, fonts)
- Compiles without errors

---

### Subtask 29.4: Page Layout Foundation

**Files to create:**
- `frontend/src/pages/Auth/LoginPage.tsx`
- `frontend/src/pages/Auth/UnauthorizedPage.tsx`

**Description:** LoginPage forms already exist from task 28. UnauthorizedPage shows permission denied message. Both are simple pages.

**Acceptance Criteria:**
- LoginPage uses ProductForm/OrderForm/etc validators from task 28
- UnauthorizedPage renders centered message with link back to dashboard
- Both styled with theme tokens
- Compiles without errors

---

### Subtask 29.5: Product Pages

**Files to create:**
- `frontend/src/pages/Products/ProductListPage.tsx`
- `frontend/src/pages/Products/ProductDetailPage.tsx`
- `frontend/src/pages/Products/ProductCreatePage.tsx`
- `frontend/src/components/products/ProductForm.tsx`
- `frontend/src/components/products/ProductSelect.tsx`

**Description:** 
- ProductListPage: Fetches products from Redux store, displays in DataTable, has Create button
- ProductDetailPage: Shows single product details, edit button opens modal with ProductForm
- ProductCreatePage: Form to create new product, submits via Redux thunk
- ProductForm: Zod-validated form with fields (name, sku, description, price, category, threshold)
- ProductSelect: Dropdown component for selecting products in order forms

**Acceptance Criteria:**
- ProductListPage dispatches fetchProducts() thunk on mount
- ProductListPage displays loading Skeleton while fetching
- ProductListPage uses DataTable with columns: sku, name, price, actions
- ProductListPage has "Create Product" button → navigate to /products/create
- ProductDetailPage reads params.id, fetches product, shows details
- ProductDetailPage edit button opens modal, submits edit thunk
- ProductCreatePage form validates with productFormSchema from task 28
- ProductForm handles validation errors, shows error messages under fields
- ProductSelect renders `<select>` or `<AutoComplete>` with products loaded from store
- All pages show error messages from Redux state when fetch fails
- All pages use MainLayout wrapper
- All compile without errors

---

### Subtask 29.6: Order Pages

**Files to create:**
- `frontend/src/pages/Orders/OrderListPage.tsx`
- `frontend/src/pages/Orders/OrderDetailPage.tsx`
- `frontend/src/pages/Orders/OrderCreatePage.tsx`
- `frontend/src/components/orders/OrderForm.tsx`
- `frontend/src/components/orders/OrderLineRow.tsx`
- `frontend/src/components/orders/OrderStatusBadge.tsx`

**Description:**
- OrderListPage: Displays all orders in DataTable, columns: orderNumber, customer, status, total, date
- OrderDetailPage: Shows order details, status badge, line items, can cancel/confirm if DRAFT
- OrderCreatePage: Multi-step form (select customer, add line items, review, submit)
- OrderForm: Complex form with line items table, ProductSelect for each line, quantity, price
- OrderLineRow: Row component showing product, qty, unit price, line total
- OrderStatusBadge: Badge component showing order status with color (DRAFT=gray, CONFIRMED=blue, FULFILLED=green, CANCELLED=red)

**Acceptance Criteria:**
- OrderListPage dispatches fetchOrders() on mount
- OrderListPage DataTable shows order data with status badge
- OrderListPage rows have Edit/Delete actions
- OrderDetailPage shows order + line items
- OrderDetailPage Confirm/Cancel buttons dispatch appropriate thunks
- OrderCreatePage renders multi-step form
- OrderForm validates with orderFormSchema
- OrderLineRow editable: qty/price inline, recalculates line_total
- OrderStatusBadge maps status to color: DRAFT→gray, CONFIRMED→blue, FULFILLED→green, CANCELLED→red
- All pages use MainLayout
- All compile without errors

---

### Subtask 29.7: Customer Pages

**Files to create:**
- `frontend/src/pages/Customers/CustomerListPage.tsx`
- `frontend/src/pages/Customers/CustomerCreatePage.tsx`
- `frontend/src/components/shared/FormInput.tsx` (reusable form field)

**Description:**
- CustomerListPage: DataTable of customers, columns: name, email, phone, city, actions
- CustomerCreatePage: Form with fields (name, email, phone, address, city, postalCode)
- FormInput: Reusable text/email/tel input with label, validation error display

**Acceptance Criteria:**
- CustomerListPage dispatches fetchCustomers() on mount
- CustomerListPage Create button navigates to /customers/create
- CustomerCreatePage form validates with customerFormSchema
- CustomerCreatePage submit dispatches createCustomer thunk
- FormInput accepts `label`, `type`, `value`, `onChange`, `error`, `placeholder` props
- FormInput shows error message below input if error prop present
- FormInput styling matches theme tokens
- All pages use MainLayout
- All compile without errors

---

### Subtask 29.8: Stock Pages

**Files to create:**
- `frontend/src/pages/Stock/StockListPage.tsx`
- `frontend/src/pages/Stock/AlertsPage.tsx`
- `frontend/src/components/stock/StockAdjustForm.tsx`
- `frontend/src/components/stock/AlertBanner.tsx`

**Description:**
- StockListPage: DataTable of stock items, columns: sku, product, warehouse, qty, reserved, available, actions
- AlertsPage: List of low-stock alerts, shows product, warehouse, current qty, threshold, acknowledges button
- StockAdjustForm: Modal form to adjust stock (warehouse, product, adjustment qty, reason/movement_type)
- AlertBanner: Inline banner at top of StockListPage showing count of active alerts, link to AlertsPage

**Acceptance Criteria:**
- StockListPage dispatches fetchStock() on mount
- StockListPage renders stock data: product sku, warehouse, quantity, reserved_quantity
- StockListPage shows available = quantity - reserved_quantity
- StockListPage Adjust button opens modal with StockAdjustForm
- StockAdjustForm validates with stockFormSchema
- StockAdjustForm submit dispatches adjustStock thunk
- AlertsPage fetches lowStockAlerts from Redux
- AlertsPage shows product, warehouse, current qty, low threshold
- AlertsPage Acknowledge button dispatches acknowledgeAlert thunk
- AlertBanner shows unacknowledged alert count (e.g., "3 Low Stock Alerts")
- AlertBanner link navigates to /stock/alerts
- All pages use MainLayout
- All compile without errors

---

### Subtask 29.9: Supporting Hooks & Utilities

**Files to create:**
- `frontend/src/hooks/usePagination.ts` (already in 29.2, verify here)
- `frontend/src/hooks/useQuery.ts`
- `frontend/src/utils/websocketClient.ts` (stub for Task 30)

**Description:**
- useQuery: Hook for fetching paginated data (takes thunk, returns { data, loading, error, currentPage })
- websocketClient: Stub file with placeholder functions for Task 30 WebSocket setup

**Acceptance Criteria:**
- useQuery accepts a Redux thunk, page number as deps
- useQuery dispatches thunk on mount/page change
- useQuery returns { data, loading, error, currentPage }
- useQuery cancels previous request if deps change
- websocketClient exports placeholder functions: initWebSocket(), subscribe(), unsubscribe()
- All compile without errors

---

## Testing Requirements

1. **Type Checking:** `npm run tsc -- --noEmit` succeeds (zero errors)
2. **Build:** `npm run build` succeeds
3. **No Console Errors:** Pages load without console.error or console.warn
4. **Navigation:** Clicking sidebar links navigates to correct page
5. **Forms:** Fill form → submit → Redux action dispatches
6. **DataTable:** Load data → display → pagination works
7. **Responsive:** Pages render on mobile (375px) and desktop (1920px)

---

## Execution Order

Execute subtasks in this order (dependencies):
1. 29.1 Layout & Navigation (no deps, foundational)
2. 29.2 DataTable & Pagination (foundation for lists)
3. 29.3 Modal, SearchInput, FilterBar (foundation for forms)
4. 29.4 Auth Pages (simple, establishes page pattern)
5. 29.5 Product Pages (medium complexity, uses DataTable + Form pattern)
6. 29.6 Order Pages (higher complexity, multi-step form)
7. 29.7 Customer Pages (simpler, reuses patterns from 29.5/29.6)
8. 29.8 Stock Pages (uses DataTable + Form, adds alerts concept)
9. 29.9 Hooks & utilities (used by all pages, finalize after pages are done)

---

## Acceptance Criteria for Task 29 Complete

✅ All 17 files created with correct TypeScript types and no `any` types
✅ All pages wrap in MainLayout (Header + Sidebar)
✅ All pages styled with theme tokens, no hardcoded colors
✅ All forms validate with Zod schemas from task 28
✅ All pages fetch data from Redux store, dispatch thunks
✅ All pages handle loading (Skeleton), error (error message), empty states
✅ All pages display data in DataTable or detail views
✅ Navigation links work (react-router v6)
✅ `npm run build` succeeds, 0 errors
✅ `npm run tsc -- --noEmit` succeeds, 0 errors
✅ No console.error or console.warn in browser
✅ Git commits with clear messages for each subtask
