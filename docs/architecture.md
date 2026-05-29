# Architecture: Retailr Platform

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Design Phase

## System Overview

Retailr is a production-grade retail operations platform serving store staff, warehouse managers, purchasing officers, and administrators. The system manages products, suppliers, customers, orders, and warehouse stock in real time.

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Retailr Platform                         │
├─────────────────────────────────────────────────────────────┤
│  User Roles:                                                 │
│  • Administrator      — full access, user/role mgmt         │
│  • Inventory Manager  — stock, suppliers, replenishment     │
│  • Sales Officer      — orders, customers                   │
│  • Viewer/Auditor     — read-only dashboards                │
├─────────────────────────────────────────────────────────────┤
│  Key Entities:                                               │
│  Product ↔ Category, Supplier                               │
│  Order ↔ OrderLine → Product                                │
│  Warehouse → StockItem (per-warehouse quantity)             │
│  StockMovement (audit trail)                                │
│  Customer ↔ Order                                           │
│  User ↔ Role                                                │
└─────────────────────────────────────────────────────────────┘
```

## Architecture: Spring Cloud Fabric (3-Service + Gateway)

### Container View

```
┌────────────────────────────────────────────────────────┐
│                  Frontend (React 18)                    │
│  Port 3000 — Redux store, React Router, Axios client   │
└─────────────────────┬──────────────────────────────────┘
                      │ HTTP + WebSocket
                      ↓
┌─────────────────────────────────────────────────────────┐
│           API Gateway (Spring Cloud Gateway)            │
│  Port 8080                                              │
│  • JWT validation at edge                              │
│  • Request routing to backend services                 │
│  • CORS, rate limiting                                 │
│  • Service discovery (Eureka client)                   │
└─────┬────────────┬──────────────────┬──────────────────┘
      │            │                  │
      ↓            ↓                  ↓
┌──────────┐  ┌──────────────┐  ┌───────────┐
│   Auth   │  │  Catalog &   │  │  Order    │
│ Service  │  │  Inventory   │  │ Service   │
│ Port     │  │  Service     │  │ Port      │
│ 8081     │  │  Port 8082   │  │ 8083      │
└──────────┘  └──────────────┘  └───────────┘
      │              │                 │
      └──────────────┴─────────────────┘
                      ↓
            ┌──────────────────┐
            │   PostgreSQL     │
            │   (Single DB)    │
            └──────────────────┘

┌─────────────────────────────────────────────────┐
│  Eureka Service Registry (Port 8761)            │
│  Internal service discovery — not exposed to    │
│  frontend, used only by Gateway & services      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Spring Cloud Config Server (Port 8888)         │
│  Centralized config for all services            │
└─────────────────────────────────────────────────┘
```

## Service Responsibilities

### API Gateway (Spring Cloud Gateway)
- **Responsibility:** Single entry point for all frontend requests.
- **Routes:** Paths `/auth/*` → Auth Service, `/catalog/*` → Catalog Service, `/orders/*` → Order Service.
- **Security:** Validates JWT at gateway (no token = 401). Tokens attached to downstream requests via header.
- **Real-time:** Routes WebSocket upgrade requests to a STOMP broker endpoint (embedded in one of the services, or standalone).
- **CORS, Rate Limiting:** Configured here for all services uniformly.

### Auth Service (Port 8081)
- **Responsibility:** User identity, authentication, role-based access control.
- **Endpoints:**
  - `POST /auth/register` — register new user (admin only in production)
  - `POST /auth/login` — issue JWT + refresh token
  - `POST /auth/refresh` — silent token refresh
  - `GET /auth/me` — current user profile
  - `GET /auth/users` — list users (admin)
  - `POST /auth/users` — create user (admin)
  - `DELETE /auth/users/{id}` — deactivate user (admin)
- **Database:** Users, Roles, RolePermissions tables.
- **Security:** Passwords hashed with BCrypt; refresh tokens stored as long-lived JWTs or in Redis; no secrets in code.

### Catalog & Inventory Service (Port 8082)
- **Responsibility:** Product management, supplier relationships, warehouse stock, stock movements, low-stock alerts.
- **Endpoints:**
  - Products: GET, POST, PUT, DELETE (CRUD + filtering/search)
  - Categories: CRUD
  - Suppliers: CRUD
  - Stock: GET stock levels per warehouse, POST stock adjustments
  - Movements: GET audit trail, POST manual adjustments
  - Alerts: GET low-stock alerts
- **Database:** Products, Categories, Suppliers, Warehouses, StockItems, StockMovements, LowStockAlerts tables.
- **Real-time:** Publishes stock-change events (via STOMP topic `/topic/stock-updates`) when inventory changes.
- **Dependencies:** Calls out to Auth Service only for validation (via gateway). Inventory levels are authoritative for order confirmation.

### Order Service (Port 8083)
- **Responsibility:** Order lifecycle, order lines, stock reservation, order-to-fulfillment workflow.
- **Endpoints:**
  - Orders: GET, POST (create draft), PUT (update), DELETE (cancel), GET (list + filters/pagination)
  - OrderLines: POST, PUT, DELETE (within an order)
  - Confirm: POST `/orders/{id}/confirm` — reserve stock, transition to CONFIRMED
  - Fulfill: POST `/orders/{id}/fulfill` — mark as FULFILLED (stock already decremented on confirm)
  - Cancel: POST `/orders/{id}/cancel` — release reserved stock, transition to CANCELLED
- **Database:** Orders, OrderLines, OrderStockReservations tables.
- **Inter-service:** On confirm, calls Catalog Service to reserve stock; on cancel, calls to release. Stock movements are logged by Catalog Service (Order Service notifies, Catalog Service records).
- **Real-time:** Publishes order status changes to `/topic/order-updates`.
- **Idempotency:** Confirm endpoint is idempotent (same requestId = same result, no duplicate reservations).

## Data Flow: Order Placement

```
User Action: Create Order
            ↓
Frontend: POST /api/orders
           (create draft with lines)
            ↓
API Gateway: Route to Order Service
            ↓
Order Service: POST /orders
  • Create Order (status=DRAFT)
  • Create OrderLines
  • Persist, return 201
            ↓
Frontend: Order created, show in Redux store
           User can edit lines or confirm
            ↓
User Action: Confirm Order
            ↓
Frontend: POST /api/orders/{id}/confirm
           (with requestId for idempotency)
            ↓
API Gateway: Route to Order Service
            ↓
Order Service: POST /orders/{id}/confirm
  • Check if order is DRAFT
  • Call Catalog Service: reserveStock(order)
    ├─ Catalog validates: sum(orderLines.qty) ≤ available stock
    └─ If fail → return 400, Order Service rolls back
  • Update Order status → CONFIRMED
  • Create StockMovement records (via Catalog Service callback)
  • Publish to /topic/order-updates
            ↓
Frontend: Listen on /topic/order-updates
         (via WebSocket/STOMP)
           Update order in Redux, UI refreshes
            ↓
Catalog Service: Publish stock-level change
                 Frontend listens on /topic/stock-updates
                 Updates Redux store, dashboard re-renders

```

## Data Flow: Stock Update (Real-Time)

```
Catalog Service: Stock adjustment triggered
                 (manual adjustment or order confirm)
            ↓
Catalog Service: Create StockMovement record
                 Update StockItem quantity
                 Publish STOMP message to /topic/stock-updates
            ↓
API Gateway: Routes WebSocket traffic to STOMP broker
            ↓
Frontend (WebSocket client): 
           Subscribe to /topic/stock-updates on mount
           Receive stock changes
           Update Redux store (normalized entities)
           Dashboard/inventory views re-render
            ↓
On unmount: Unsubscribe from topic, close subscription
```

## Real-Time Architecture: WebSocket + STOMP

### Why WebSocket + STOMP

- **Bidirectional:** Frontend can request subscriptions (e.g., "send me stock updates for warehouse 1"), server responds with updates. SSE is one-way.
- **Topic-based routing:** STOMP lets us cleanly model topics like `/topic/stock-updates/{warehouseId}`, `/topic/order-updates/{customerId}` without application code managing subscriptions.
- **Backpressure & reliability:** STOMP has heartbeat, nacking, and acknowledgment semantics. Robust for production.
- **Enterprise-standard:** If we later migrate to RabbitMQ or ActiveMQ, the STOMP protocol carries over.

### Implementation

- **Embedded STOMP Broker:** Each service (or the gateway) embeds a Spring Cloud Stream STOMP broker.
- **Topic subscriptions:**
  - `/topic/stock-updates` — all stock changes (filtered by warehouse in frontend Redux selector if needed)
  - `/topic/order-updates` — all order status changes (filtered by customer in frontend Redux selector)
  - `/topic/alerts` — low-stock alerts, order warnings
- **Frontend WebSocket client:** Uses `stompjs` library; connects on app init, subscribes to topics, handles reconnection automatically.
- **Cleanup:** Unsubscribe and close connection on logout or app unmount.

## Authentication & Authorization

### JWT Flow

```
1. User logs in
   POST /auth/login (username, password)
   ↓
2. Auth Service validates, returns:
   {
     accessToken: "eyJ..." (expires 15 min),
     refreshToken: "eyJ..." (expires 7 days),
     user: { id, email, roles: [...] }
   }
   ↓
3. Frontend stores tokens in memory (accessToken) + secure httpOnly cookie (refreshToken)
   Redux store: user profile, roles
   ↓
4. Every request includes Authorization: Bearer <accessToken>
   Axios request interceptor attaches it
   ↓
5. If 401 (token expired):
   Axios response interceptor silently calls POST /auth/refresh
   Returns new accessToken
   Retries original request
   ↓
6. If refresh fails (refresh token expired):
   Clear Redux state, redirect to login
```

### Role-Based Access Control (RBAC)

**Roles:** Admin, InventoryManager, SalesOfficer, Viewer

**Backend enforcement (Spring Security method security):**
```java
@PostMapping("/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'SALES_OFFICER')")
public ResponseEntity<OrderDTO> createOrder(...) { ... }

@GetMapping("/products")
@PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SALES_OFFICER', 'VIEWER')")
public ResponseEntity<Page<ProductDTO>> getProducts(...) { ... }
```

**Frontend enforcement (React Router & UI gating):**
- Protected routes check `user.roles` before rendering
- UI components (buttons, fields) are hidden based on roles
- If user lacks permission, 403 redirect to unauthorized page
- Backend always validates; frontend gating is UX only

## Error Handling & Resilience

### Global Exception Handler (Backend)

All endpoints return consistent error envelope:

```json
{
  "timestamp": "2026-05-29T14:30:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Stock is insufficient for this order",
  "details": {
    "field": "orderLines[0].quantity",
    "value": 50,
    "constraint": "stock_available is 30"
  }
}
```

Status codes:
- `400` — Validation error (bad input, insufficient stock, etc.)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (user lacks role for this operation)
- `404` — Not found
- `409` — Conflict (e.g., order already confirmed)
- `500` — Server error

### Axios Interceptor (Frontend)

```javascript
// Response interceptor
- If 401: silently refresh, retry
- If 403: redirect to /unauthorized
- If 4xx / 5xx: extract error message, enqueue toast notification
- User sees: "Stock is insufficient for this order" (not raw JSON)
```

### Circuit Breaker (Inter-service calls)

Order Service → Catalog Service: Resilience4j circuit breaker configured
- On repeated failures, circuit opens, fail-fast with sensible default
- If Catalog Service is down, Order Service can still serve GET requests (already-confirmed orders)

## Pagination, Filtering, Searching

### Backend (Repository/Query Layer)

All list endpoints support:
- `?page=0&size=20` — pagination
- `?sort=createdAt,desc` — sorting
- `?status=CONFIRMED&warehouse=1` — filtering (multi-valued)
- `?search=shirt` — full-text search (on products.name, products.sku)

Implemented via Spring Data Specifications or custom query methods (indexed on frequently-searched columns).

### Frontend (Redux + Axios)

- User types in search field → debounced (300ms) Axios GET with search param
- Redux dispatches async thunk: `fetchProducts({ search: "shirt", filters: {...} })`
- Thunk makes paginated request, updates Redux `products.entities` and `products.ui` (currentPage, total, etc.)
- Component selects from Redux and renders results
- No client-side filtering; all work done on backend

## Testing Strategy

### Backend (TDD)

- **Unit tests (services):** Mock repositories, test business logic (stock validation, order confirmation).
- **Slice tests (@DataJpaTest, @WebMvcTest):** Test a single layer in isolation with real DB (Testcontainers PostgreSQL).
- **Integration tests:** Full Spring context, real DB, test API contract (POST /orders, confirm, cancel).

### Frontend

- **Unit tests (hooks, reducers, interceptors):** Jest + React Testing Library.
  - `useAuth` hook: login flow, token refresh, logout.
  - Redux reducers: entities normalized, selectors memoized.
  - Axios interceptor: 401 refresh-and-retry.
- **Component tests (key flows):** RTL, user interactions.
  - Login form: enter credentials, submit, JWT stored, redirect to dashboard.
  - Order creation: create order, add lines, confirm (mock API), see stock update via WebSocket.

## Observability

- **Structured logging:** All services log in JSON format (Spring Cloud Sleuth + Logback, or direct JSON logging).
- **Health/Readiness:** Spring Boot Actuator at `/actuator/health`, `/actuator/ready`.
- **Tracing hooks:** Spring Cloud Sleuth assigns correlation IDs; useful for debugging distributed requests.
- **Metrics:** Micrometer (built-in to Spring Boot 3.x) exposes `application.*` metrics. Not exposed publicly; for ops dashboards.

## Deployment & Configuration

### Environment Variables

Each service reads from Spring Cloud Config (centralized) or environment:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/retailr
SPRING_DATASOURCE_USERNAME=retailr
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=<base64-encoded-key>
REFRESH_TOKEN_EXPIRY=604800  # 7 days in seconds
AUTH_SERVICE_URL=http://auth-service:8081
CATALOG_SERVICE_URL=http://catalog-service:8082
```

### Local Development (Docker Compose)

Single `docker-compose.yml`:
- PostgreSQL 15
- API Gateway
- Auth Service
- Catalog Service
- Order Service
- Eureka Registry
- Config Server (optional; can use local application.yml)

One command: `docker compose up` brings up the entire backend stack.
Frontend: `npm run dev` in `/frontend` directory (separate terminal, connects to gateway at http://localhost:8080).

## Security Checklist

- [ ] Passwords hashed with BCrypt (never stored plaintext)
- [ ] JWT secret is > 256 bits, not in code
- [ ] Refresh tokens are HTTP-only, Secure, SameSite cookies (if applicable)
- [ ] CORS at gateway: restrict to known origins
- [ ] All endpoints validate request body and return 400 on invalid input
- [ ] No SQL injection: use parameterized queries (Spring Data JPA)
- [ ] No secrets in Docker images; use env vars
- [ ] HTTPS in production (handled by reverse proxy / load balancer in front of gateway)

## Next Steps

This architecture is the contract between frontend and backend. All feature work follows from this design:
1. Data model (schema, entities, migrations)
2. API contract (OpenAPI spec, endpoint signatures)
3. Backend services (TDD, layer by layer)
4. Frontend infrastructure (Axios, Redux, Router, Auth context)
5. Feature work (UI components, forms, dashboards)
6. Real-time integration (WebSocket subscriptions)
7. Polish & testing
