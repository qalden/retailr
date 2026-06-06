# WebSocket Real-Time Integration Guide

## Overview

The Retailr platform implements real-time updates using WebSocket technology with STOMP (Simple Text Oriented Messaging Protocol) messaging. This enables live stock updates and order status changes across the platform without requiring page refreshes.

**Architecture:**
- **Backend:** Spring WebSocket + STOMP broker (catalog-service, order-service)
- **Frontend:** stompjs client with automatic reconnection and exponential backoff
- **State Management:** Redux integration for real-time data updates
- **Authentication:** JWT tokens passed in WebSocket Connect frame

---

## Backend Setup

### WebSocket Configuration

Both catalog-service and order-service have WebSocket configurations:

**File:** `backend/catalog-service/src/main/java/com/retailr/catalog/config/WebSocketConfig.java`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws").setAllowedOrigins("*");
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    config.enableSimpleBroker("/topic");
  }
}
```

**Endpoint:** `ws://localhost:8080/ws` (or service-specific port)

### Publishing Updates

Real-time services publish updates to STOMP topics after state changes:

**Stock Updates:**
- Topic: `/topic/stock-updates`
- Triggered by: `StockService.adjustStock()` → `RealTimeService.publishStockUpdate()`
- Message format:
  ```json
  {
    "sku": "PROD-123",
    "warehouse": "WH-001",
    "quantity": 50,
    "reserved": 10,
    "timestamp": "2026-06-06T10:30:00Z"
  }
  ```

**Order Updates:**
- Topic: `/topic/order-updates`
- Triggered by: `OrderService.createOrder()`, `updateStatus()`, etc.
- Message format:
  ```json
  {
    "orderNumber": "ORD-12345",
    "status": "CONFIRMED",
    "customer": "John Doe",
    "total": 299.99,
    "timestamp": "2026-06-06T10:30:00Z"
  }
  ```

---

## Frontend Setup

### Installation

WebSocket client library is bundled in the frontend application. No additional installation required.

### WebSocket Client (`frontend/src/utils/websocketClient.ts`)

Singleton wrapper around stompjs Client with automatic connection management:

```typescript
import { wsClient } from '@/utils/websocketClient';

// Connect with JWT token
await wsClient.connect(authToken);

// Subscribe to updates
wsClient.subscribe('/topic/stock-updates', (message) => {
  // Handle stock update
});

// Disconnect
wsClient.disconnect();
```

**Features:**
- Automatic reconnection with exponential backoff (1s initial, 30s max)
- JWT authentication in Connect frame
- Connection status callbacks
- Error handling and logging

### Subscription Hooks

#### useWebSocketConnection

Manages global WebSocket connection lifecycle:

```typescript
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';

function MyComponent() {
  const { connected, connecting, error } = useWebSocketConnection();

  return (
    <div>
      {connected && <span className="status-live">Live</span>}
      {connecting && <span className="status-connecting">Connecting...</span>}
      {error && <span className="status-error">Error: {error}</span>}
    </div>
  );
}
```

**Returns:**
- `connected: boolean` - WebSocket is connected
- `connecting: boolean` - Connection in progress
- `error: string | null` - Connection error message

#### useStockSubscription

Subscribes to real-time stock updates and dispatches Redux actions:

```typescript
import { useStockSubscription } from '@/hooks/useStockSubscription';

function StockListPage() {
  const { data, error, subscribed } = useStockSubscription();

  return (
    <div>
      {subscribed && <span>Live Updates</span>}
      {/* Display stock data from Redux store */}
    </div>
  );
}
```

**Returns:**
- `data: Stock[]` - Current stock items from Redux store
- `error: string | null` - Subscription error
- `subscribed: boolean` - Currently subscribed to updates

#### useOrderSubscription

Subscribes to real-time order updates and dispatches Redux actions:

```typescript
import { useOrderSubscription } from '@/hooks/useOrderSubscription';

function OrderListPage() {
  const { data, error, subscribed } = useOrderSubscription();

  return (
    <div>
      {subscribed && <span>Live Updates</span>}
      {/* Display order data from Redux store */}
    </div>
  );
}
```

**Returns:**
- `data: Order[]` - Current orders from Redux store
- `error: string | null` - Subscription error
- `subscribed: boolean` - Currently subscribed to updates

### Redux Integration

Real-time state is managed through Redux slices:

**Real-Time Connection State** (`rtSlice`):
```typescript
import { useAppSelector } from '@/store';
import { selectRTConnected, selectRTError } from '@/store/slices/rtSlice';

const connected = useAppSelector(selectRTConnected);
const error = useAppSelector(selectRTError);
```

**Stock Updates** (stockSlice):
- Reducer: `updateStockFromWebSocket(state, action)`
- Merges incoming updates with existing state by `warehouseId` + `sku`
- Input validation: warehouse/sku non-empty, quantities non-negative

**Order Updates** (ordersSlice):
- Reducer: `updateOrderFromWebSocket(state, action)`
- Merges incoming updates with existing state by `orderNumber`
- Input validation: orderNumber/status non-empty, total non-negative

---

## Configuration

### Environment Variables

**Frontend** (`.env` or `.env.local`):
```
VITE_WS_URL=ws://localhost:8080/ws
```

Default: `ws://localhost:8080/ws`

### Reconnection Strategy

**Exponential Backoff:**
- Initial delay: 1 second
- Max delay: 30 seconds
- Backoff multiplier: 1.5x per attempt
- Jitter: ±10% random variation

**Example:**
- Attempt 1: 1.0s
- Attempt 2: 1.5s
- Attempt 3: 2.25s
- Attempt 4: 3.375s
- ... up to 30s max

### Connection Timeout

STOMP frame timeout: 10 seconds (configurable in `websocketClient.ts`)

---

## Testing

### Manual End-to-End Testing

#### 1. Start Backend Services

```bash
# Terminal 1: Gateway
cd backend/gateway
mvn spring-boot:run

# Terminal 2: Catalog Service
cd backend/catalog-service
mvn spring-boot:run

# Terminal 3: Order Service
cd backend/order-service
mvn spring-boot:run

# Terminal 4: Auth Service
cd backend/auth-service
mvn spring-boot:run
```

#### 2. Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

#### 3. Verify WebSocket Connection

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Navigate to `/products` or `/orders` page
4. Observe WebSocket connection to `ws://localhost:8080/ws`
5. Check status indicator in header (should show "Live" in green)

#### 4. Test Stock Updates

**In another terminal:**
```bash
curl -X POST http://localhost:8081/stock/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "warehouseId": 1,
    "productId": 1,
    "adjustment": 10,
    "movementType": "RESTOCK"
  }'
```

**Expected:** StockListPage updates in real-time without page refresh

#### 5. Test Order Updates

1. Create new order via `/orders/create` in UI
2. Navigate to `/orders` page
3. Observe new order appears in real-time

#### 6. Test Reconnection

1. Open DevTools Network tab
2. Find WebSocket connection → Right-click → Close
3. Observe automatic reconnection within 5 seconds
4. Status indicator transitions: "Live" → "Connecting..." → "Live"

---

## Troubleshooting

### WebSocket Connection Fails

**Symptoms:** Status shows "Error" or "Offline"

**Check:**
1. Backend services running and accessible
2. WebSocket endpoint configured correctly (`/ws`)
3. CORS settings allow frontend origin
4. Network not blocking WebSocket protocol
5. JWT token valid and passed in Connect frame

**Debug:**
```typescript
// In browser console
wsClient.isConnected() // Returns connection status
```

### Updates Not Appearing in Real-Time

**Symptoms:** Data updates but requires page refresh

**Check:**
1. Subscription hook called at component level
2. Redux actions dispatched correctly
3. Browser console shows no errors
4. Network tab shows WebSocket messages arriving

**Common Issues:**
- Hook called conditionally (hooks must be at top level)
- Subscription disabled via `enabled={false}` parameter
- Redux selector not connected to component

### High Latency / Slow Updates

**Symptoms:** Real-time updates delayed by several seconds

**Check:**
1. Network latency: DevTools → Network tab → WebSocket frames
2. Message size: Check payload in WebSocket messages
3. Server-side: Check RealTimeService publishing frequency

**Optimization:**
- Batch updates if publishing too frequently
- Implement client-side debouncing for high-frequency updates
- Monitor message size and compress if needed

### Reconnection Loop

**Symptoms:** Status constantly shows "Connecting..."

**Check:**
1. Server logs for connection rejections
2. JWT token not expired
3. Network stability
4. STOMP broker configuration

**Fix:**
- Check auth token validity
- Verify network connectivity
- Check server capacity and resource usage

---

## Performance Considerations

### Message Volume

Optimal: 1-10 messages/second per topic

If higher:
- Batch updates on backend
- Implement client-side debouncing
- Consider message compression

### Payload Size

Optimal: < 1KB per message

Large payloads:
- Send only changed fields, not entire entities
- Consider separate detail endpoint for full data

### Scaling

For multiple instances:
- Use shared message broker (Redis, RabbitMQ)
- Configure Spring Cloud Bus for inter-service messaging
- Monitor connection count and adjust timeout values

---

## Security

### JWT Authentication

WebSocket connection authenticated via JWT token in Connect frame:

```
CONNECT
accept-version:1.0,1.1,1.2
authorization:Bearer <JWT_TOKEN>
```

**Token validation:** Performed by Spring Security filter

### Message Validation

Both backend and frontend validate messages:

**Backend:**
- Entity ID matches authenticated user's scope
- Input constraints enforced
- Rate limiting applied

**Frontend:**
- Redux reducers validate input (non-negative numbers, non-empty strings)
- Type checking via TypeScript
- Malformed messages logged and ignored

### CORS Configuration

WebSocket endpoint requires explicit CORS configuration:

```java
registry.addEndpoint("/ws").setAllowedOrigins("http://localhost:5173");
```

---

## API Reference

### wsClient Methods

```typescript
// Connect with JWT token
await wsClient.connect(token: string): Promise<void>

// Disconnect cleanly
wsClient.disconnect(): Promise<void>

// Subscribe to topic
wsClient.subscribe(topic: string, callback: (message: any) => void): string

// Unsubscribe from topic
wsClient.unsubscribe(topic: string): void

// Check connection status
wsClient.isConnected(): boolean

// Register connection status callback
wsClient.onStatusChange(callback: (status: WebSocketStatus) => void): () => void

// Register error callback
wsClient.onError(callback: (error: string) => void): () => void

// Register disconnect callback
wsClient.onDisconnect(callback: () => void): () => void
```

---

## Examples

### Complete Example: Real-Time Stock Monitor

```typescript
import React from 'react';
import { useWebSocketConnection } from '@/hooks/useWebSocketConnection';
import { useStockSubscription } from '@/hooks/useStockSubscription';
import { useAppSelector } from '@/store';
import { selectAllStockItems } from '@/store/slices/stockSlice';

export function StockMonitor() {
  const { connected, error } = useWebSocketConnection();
  const { subscribed } = useStockSubscription();
  const stocks = useAppSelector(selectAllStockItems);

  if (error) {
    return <div className="error">Connection error: {error}</div>;
  }

  return (
    <div className="stock-monitor">
      <div className="status-bar">
        <span className={connected ? 'live' : 'offline'}>
          {connected ? '● Live' : '● Offline'}
        </span>
      </div>
      <div className="stock-list">
        {stocks.map((item) => (
          <div key={item.id} className="stock-item">
            <span>{item.sku}</span>
            <span>{item.quantity - item.reservedQuantity} available</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Related Documentation

- [Architecture](./architecture.md) - System design overview
- [Frontend Architecture](./frontend-architecture.md) - React/Redux patterns
- [API Contract](./api-contract.md) - REST API endpoints

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review browser console logs
3. Check server logs: `backend/{service}/logs/`
4. Contact platform team
