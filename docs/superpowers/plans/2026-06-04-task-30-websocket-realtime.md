# Task 30: Real-time WebSocket Subscriptions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this task. Each subtask below should be dispatched to a fresh subagent with two-stage review.

**Goal:** Implement WebSocket infrastructure for real-time stock updates and order status changes, enabling live UI updates across the platform.

**Architecture:** Backend services expose STOMP WebSocket endpoints using Spring WebSocket. Frontend connects via stompjs client, subscribes to topics (/topic/stock-updates, /topic/order-updates), and Redux slices listen to real-time events. Automatic reconnection with exponential backoff, connection state managed in Redux.

**Tech Stack:** Spring WebSocket + STOMP (backend), stompjs (frontend), Redux for real-time state, TypeScript strict mode.

---

## Scope

Task 30 builds 9 new files and modifies 4 existing files:

1. **Backend WebSocket Config (2 files):** WebSocketConfig in catalog-service and order-service
2. **Backend Real-Time Services (2 files):** RealTimeService implementations
3. **Frontend WebSocket Client (2 files):** websocketClient.ts wrapper, websocketTypes.ts
4. **Frontend Subscription Hooks (3 files):** useStockSubscription, useOrderSubscription, useWebSocketConnection
5. **Frontend Real-Time Types (1 file):** realtime.ts
6. **Modifications (4 files):** RealTimeService stubs in both services, GatewayConfig for WebSocket routes, Redux store for real-time state

**Does NOT include:** WebSocket tests (covered by service tests), SSL/TLS configuration, load testing, browser offline detection (basic only).

---

## File Structure

### Backend Files

**`backend/catalog-service/src/main/java/com/retailr/catalog/config/WebSocketConfig.java`** (new)
- Configures Spring WebSocket with STOMP broker
- Registers /ws endpoint for client connections
- Sets up /topic prefix for broadcast messages
- Enables message broker with SimpleBroker

**`backend/catalog-service/src/main/java/com/retailr/catalog/service/RealTimeService.java`** (modify existing stub)
- Implements `publishStockUpdate(StockUpdateEvent event)` method
- Publishes to STOMP topic `/topic/stock-updates`
- Called by StockService after inventory changes
- Includes low stock alert messages

**`backend/order-service/src/main/java/com/retailr/order/config/WebSocketConfig.java`** (new)
- Same pattern as catalog-service WebSocketConfig
- Registers separate STOMP broker instance

**`backend/order-service/src/main/java/com/retailr/order/service/RealTimeService.java`** (new)
- Implements `publishOrderUpdate(OrderUpdateEvent event)` method
- Publishes to STOMP topic `/topic/order-updates`
- Called by OrderService after order state changes
- Includes order confirmation/cancellation messages

**`backend/gateway/src/main/resources/application.yml`** (modify)
- Add WebSocket route predicates: `Path=/ws/**`
- Map to appropriate service (catalog or order)

### Frontend Files

**`frontend/src/utils/websocketClient.ts`** (implement stub)
- Wraps stompjs Client
- Manages connection lifecycle (connect, disconnect, reconnect)
- Handles authentication headers (JWT token)
- Exponential backoff reconnection (max 30s)
- Error handling and connection state callbacks
- Exports: `connect()`, `disconnect()`, `subscribe()`, `unsubscribe()`, `isConnected()`

**`frontend/src/utils/websocketTypes.ts`** (new)
- TypeScript interfaces for WebSocket events
- `StockUpdateMessage`, `OrderUpdateMessage`
- `WebSocketEvent<T>` generic wrapper
- Error types: `ConnectionError`, `SubscriptionError`

**`frontend/src/types/realtime.ts`** (new)
- Type definitions for real-time domain objects
- `RealTimeStock` (sku, warehouse, qty, reserved, alert)
- `RealTimeOrder` (orderNumber, status, total, timestamp)
- `LowStockAlert` (product, warehouse, current, threshold)

**`frontend/src/hooks/useWebSocketConnection.ts`** (new)
- Manages global WebSocket connection
- Returns: `{ connected, error, connecting }`
- Auto-connects on mount with JWT token
- Handles token refresh (reconnect on auth change)
- Disconnect on unmount (cleanup)

**`frontend/src/hooks/useStockSubscription.ts`** (new)
- Hook for subscribing to stock updates
- Dispatches Redux action `updateStockFromWebSocket` on message
- Accepts optional filter callback (warehouse, sku)
- Auto-unsubscribe on unmount
- Returns: `{ data: Stock[], loading, error, subscribed }`

**`frontend/src/hooks/useOrderSubscription.ts`** (new)
- Hook for subscribing to order updates
- Dispatches Redux action `updateOrderFromWebSocket` on message
- Auto-unsubscribe on unmount
- Returns: `{ data: Order[], loading, error, subscribed }`

### Modifications

**`frontend/src/store/slices/stockSlice.ts`** (modify)
- Add reducer `updateStockFromWebSocket(state, action)` that updates store with real-time data
- Merge WebSocket stock with existing state

**`frontend/src/store/slices/ordersSlice.ts`** (modify)
- Add reducer `updateOrderFromWebSocket(state, action)` that updates store with real-time data
- Merge WebSocket order with existing state

**`frontend/src/store/index.ts`** (modify)
- Add `rtSlice` (real-time slice) with `connected`, `connecting`, `error` state
- Add selectors `selectRTConnected`, `selectRTError`

---

## Execution Order

1. 30.1 Backend WebSocket Config (catalog-service)
2. 30.2 Backend WebSocket Config (order-service)
3. 30.3 RealTimeService - Catalog (stock updates)
4. 30.4 RealTimeService - Order (order updates)
5. 30.5 Frontend WebSocket Client Library
6. 30.6 Frontend Subscription Hooks
7. 30.7 Redux Integration (real-time state)
8. 30.8 Component Integration (StockListPage, OrderListPage)
9. 30.9 End-to-End Testing & Documentation

---

## Subtasks

### Subtask 30.1: Catalog Service WebSocket Configuration

**Files:**
- Create: `backend/catalog-service/src/main/java/com/retailr/catalog/config/WebSocketConfig.java`
- Test: `backend/catalog-service/src/test/java/com/retailr/catalog/config/WebSocketConfigTest.java`

**Description:** Configure Spring WebSocket with STOMP broker for catalog-service. Register `/ws` endpoint, enable SimpleBroker for `/topic/**` messages.

**Acceptance Criteria:**
- WebSocketConfig is annotated with `@Configuration` and `@EnableWebSocketMessageBroker`
- StompEndpointRegistry registers `/ws` endpoint
- SimpleBroker configured for `/topic/**` prefix
- Configuration compiles without errors
- Test verifies broker is configured with correct prefixes

---

### Subtask 30.2: Order Service WebSocket Configuration

**Files:**
- Create: `backend/order-service/src/main/java/com/retailr/order/config/WebSocketConfig.java`
- Test: `backend/order-service/src/test/java/com/retailr/order/config/WebSocketConfigTest.java`

**Description:** Configure Spring WebSocket with STOMP broker for order-service. Same pattern as catalog-service.

**Acceptance Criteria:**
- WebSocketConfig is annotated with `@Configuration` and `@EnableWebSocketMessageBroker`
- StompEndpointRegistry registers `/ws` endpoint
- SimpleBroker configured for `/topic/**` prefix
- Configuration compiles without errors
- Test verifies broker is configured with correct prefixes

---

### Subtask 30.3: Catalog Service RealTimeService Implementation

**Files:**
- Modify: `backend/catalog-service/src/main/java/com/retailr/catalog/service/RealTimeService.java`
- Modify: `backend/catalog-service/src/main/java/com/retailr/catalog/service/StockService.java` (to call RealTimeService)
- Test: `backend/catalog-service/src/test/java/com/retailr/catalog/service/RealTimeServiceTest.java`

**Description:** Implement RealTimeService to publish stock update events to STOMP `/topic/stock-updates`. Integrate with StockService to publish after inventory adjustments.

**Acceptance Criteria:**
- RealTimeService is autowired with SimpMessagingTemplate
- `publishStockUpdate(StockUpdateEvent event)` publishes to `/topic/stock-updates`
- Message format includes: sku, warehouse, quantity, reserved, alert
- StockService calls `realTimeService.publishStockUpdate()` after adjustment
- Test verifies STOMP message is sent with correct payload
- Compiles without errors

---

### Subtask 30.4: Order Service RealTimeService Implementation

**Files:**
- Create: `backend/order-service/src/main/java/com/retailr/order/service/RealTimeService.java`
- Modify: `backend/order-service/src/main/java/com/retailr/order/service/OrderService.java` (to call RealTimeService)
- Test: `backend/order-service/src/test/java/com/retailr/order/service/RealTimeServiceTest.java`

**Description:** Implement RealTimeService to publish order update events to STOMP `/topic/order-updates`. Integrate with OrderService to publish after order state changes.

**Acceptance Criteria:**
- RealTimeService is autowired with SimpMessagingTemplate
- `publishOrderUpdate(OrderUpdateEvent event)` publishes to `/topic/order-updates`
- Message format includes: orderNumber, status, total, customer, timestamp
- OrderService calls `realTimeService.publishOrderUpdate()` after state change
- Test verifies STOMP message is sent with correct payload
- Compiles without errors

---

### Subtask 30.5: Frontend WebSocket Client Library

**Files:**
- Create: `frontend/src/utils/websocketClient.ts`
- Create: `frontend/src/utils/websocketTypes.ts`
- Test: `frontend/src/utils/websocketClient.test.ts`

**Description:** Implement stompjs wrapper with automatic connection management, JWT auth headers, and exponential backoff reconnection.

**Acceptance Criteria:**
- websocketClient exports: `connect(token)`, `disconnect()`, `subscribe(topic, callback)`, `unsubscribe(topic)`, `isConnected()`
- Automatically reconnects with exponential backoff (initial 1s, max 30s)
- Includes JWT token in Connect frame headers
- Connection state callbacks: `onConnect`, `onError`, `onDisconnect`
- WebSocket URL is configurable from environment (default: `ws://localhost:8080/ws`)
- TypeScript types for messages are defined in websocketTypes.ts
- No `any` types
- Compiles without errors

---

### Subtask 30.6: Frontend Subscription Hooks

**Files:**
- Create: `frontend/src/hooks/useWebSocketConnection.ts`
- Create: `frontend/src/hooks/useStockSubscription.ts`
- Create: `frontend/src/hooks/useOrderSubscription.ts`
- Test: `frontend/src/hooks/*.test.ts`

**Description:** Implement hooks for managing WebSocket connection and subscribing to real-time updates.

**Acceptance Criteria:**
- `useWebSocketConnection()` returns `{ connected, connecting, error }` state
- Auto-connects on mount, disconnects on unmount
- Reconnects automatically when auth token changes
- `useStockSubscription()` dispatches Redux `updateStockFromWebSocket` action
- `useOrderSubscription()` dispatches Redux `updateOrderFromWebSocket` action
- Both subscription hooks return `{ data, loading, error, subscribed }`
- Subscriptions auto-cleanup on unmount
- TypeScript strict mode compliant, no `any` types
- Compiles without errors

---

### Subtask 30.7: Redux Integration for Real-Time State

**Files:**
- Modify: `frontend/src/store/slices/stockSlice.ts`
- Modify: `frontend/src/store/slices/ordersSlice.ts`
- Modify: `frontend/src/store/index.ts`
- Create: `frontend/src/store/slices/rtSlice.ts` (real-time connection state)

**Description:** Add Redux reducers and state for real-time updates and connection status.

**Acceptance Criteria:**
- `stockSlice` has reducer `updateStockFromWebSocket(state, payload)` that merges real-time data
- `ordersSlice` has reducer `updateOrderFromWebSocket(state, payload)` that merges real-time data
- `rtSlice` tracks connection state: `{ connected, connecting, error }`
- Selectors: `selectRTConnected`, `selectRTConnecting`, `selectRTError`
- Real-time updates merge with existing state (don't replace)
- TypeScript strict mode compliant
- Compiles without errors, `npm run build` succeeds

---

### Subtask 30.8: Component Integration (Hooks in Pages)

**Files:**
- Modify: `frontend/src/pages/Stock/StockListPage.tsx`
- Modify: `frontend/src/pages/Orders/OrderListPage.tsx`
- Modify: `frontend/src/pages/Layout/MainLayout.tsx`

**Description:** Integrate WebSocket subscription hooks into pages. Show connection status indicator in header.

**Acceptance Criteria:**
- `StockListPage` calls `useStockSubscription()`, displays real-time updates
- `OrderListPage` calls `useOrderSubscription()`, displays real-time updates
- `MainLayout` calls `useWebSocketConnection()`, shows connection indicator in header
- Connection status shown as green (connected), yellow (connecting), red (error)
- No console errors or warnings
- All pages compile without errors

---

### Subtask 30.9: End-to-End Testing & Documentation

**Files:**
- Create: `docs/WEBSOCKET.md` (WebSocket integration guide)
- Modify: `frontend/README.md` (add WebSocket section)

**Description:** Test WebSocket integration end-to-end and document usage.

**Acceptance Criteria:**
- Manual test: Start backend services, frontend, verify WebSocket connection in DevTools
- Manual test: Adjust stock → verify real-time update in StockListPage
- Manual test: Create order → verify real-time update in OrderListPage
- Manual test: Disconnect network → verify automatic reconnection
- `npm run build` succeeds (166+ modules, 0 errors)
- `npm run tsc -- --noEmit` succeeds (0 errors)
- README documents: WebSocket setup, environment variables, troubleshooting
- Documentation is committed
- All components render without errors

---

## Testing Requirements

1. **Type Checking:** `npm run tsc -- --noEmit` succeeds (zero errors)
2. **Build:** `npm run build` succeeds (zero errors, zero warnings)
3. **Backend Tests:** `mvn clean test` passes for catalog-service and order-service
4. **Manual Test:** 
   - Start all backend services
   - Start frontend dev server
   - Open browser DevTools Network tab, filter for WS
   - Verify WebSocket connection to `/ws`
   - Adjust stock in database (or via API) → observe real-time update in UI
   - Create/update order → observe real-time update in UI
5. **Connection Resilience:** Kill WebSocket connection (DevTools) → verify automatic reconnection within 5 seconds

---

## Acceptance Criteria for Task 30 Complete

✅ All 9 subtasks implemented and integrated
✅ Backend WebSocket endpoints configured (both services)
✅ Backend publishes stock and order updates to STOMP topics
✅ Frontend WebSocket client connects with JWT auth, auto-reconnects
✅ Subscription hooks dispatch Redux actions on real-time updates
✅ Redux slices merge real-time data into store
✅ Components display real-time updates without page refresh
✅ Connection status indicator in header
✅ `npm run build` succeeds, 0 errors
✅ `npm run tsc -- --noEmit` succeeds, 0 errors
✅ Manual end-to-end test passes (stock update, order update, reconnection)
✅ Documentation complete
✅ Git commits for each subtask

---
