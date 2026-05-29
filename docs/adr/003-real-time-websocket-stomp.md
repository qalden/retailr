# ADR 003: Real-Time Channel — WebSocket + STOMP

**Date:** 2026-05-29  
**Status:** Accepted

## Context

We need to push real-time updates to the frontend for:
- **Stock changes** (when inventory is adjusted or an order confirms)
- **Order status changes** (when an order is confirmed, fulfilled, or cancelled)
- **Low-stock alerts** (when a product falls below threshold)

The question: WebSocket + Server-Sent Events (SSE) or STOMP-based pub/sub?

## Options Considered

### Option 1: WebSocket + STOMP (Chosen)
- **Pros:** 
  - Bidirectional (frontend can subscribe, server can push)
  - Topic-based routing (clean separation: `/topic/stock-updates`, `/topic/order-updates`, etc.)
  - Backpressure semantics (heartbeat, acknowledgments)
  - Enterprise standard (RabbitMQ, ActiveMQ both speak STOMP)
  - Spring Cloud native support
- **Cons:** 
  - ~20KB additional dependency (stompjs)
  - Slightly more complex than SSE

### Option 2: Server-Sent Events (SSE)
- **Pros:** 
  - Built on HTTP, simpler browser API
  - Lighter weight than WebSocket
  - Good for one-way server→client
- **Cons:** 
  - One-way only (can't send subscription requests)
  - No topic-based routing (have to send all events and filter client-side)
  - Reconnection logic is manual
  - Harder to scale with load balancers (sticky sessions needed)

### Option 3: Long Polling
- **Pros:** 
  - Works in restrictive network environments
- **Cons:** 
  - High latency (poll interval adds delay)
  - High bandwidth (many HTTP requests)
  - Overkill for low-frequency updates

## Decision

**WebSocket + STOMP** via Spring Cloud Stream and stompjs on the frontend.

## Rationale

**Why STOMP over raw WebSocket:**
- Raw WebSocket is protocol-agnostic; STOMP provides a *semantic layer* on top: topics, subscriptions, message acknowledgments.
- With STOMP, we model subscriptions as topics: `subscribe('/topic/stock-updates')`. The server publishes to that topic; clients get updates.
- Without STOMP, we'd have to hand-roll message routing: frontend sends `{ type: 'subscribe', channel: 'stock-updates' }`, server tracks subscriptions per client, sends updates. More boilerplate, more bugs.

**Why WebSocket + STOMP over SSE:**
- Order confirmation needs to notify two audiences: the user who placed the order AND the inventory manager monitoring stock. With SSE, we'd send the update to all connected clients and filter client-side. With STOMP, we publish to `/topic/order-updates` and both clients receive it (no filtering waste).
- Stock reservations happen per-warehouse. We could publish to `/topic/stock-updates/warehouse/{id}` and clients subscribe selectively. SSE doesn't model this cleanly.
- We want to scale to multiple backend instances. STOMP + message broker (ActiveMQ, RabbitMQ) scales horizontally. SSE with sticky sessions is messier.

**Why not long polling:**
- Retail operations require near-real-time feedback (inventory manager sees stock drop within seconds of a sale). Long polling introduces latency and wastes bandwidth.

## Implementation Details

**Backend (Spring Cloud):**
- Embed a STOMP broker in the API Gateway (or one of the services)
- Services publish to STOMP topics when state changes:
  ```java
  @Autowired
  private SimpMessagingTemplate template;

  public void confirmOrder(Order order) {
    // ... business logic ...
    template.convertAndSend("/topic/order-updates", new OrderUpdateMessage(order));
  }
  ```

**Frontend (React + stompjs):**
- Initialize STOMP client on app load
- Subscribe to topics of interest in Redux thunks or useEffect hooks
- Dispatch Redux actions when messages arrive

## Consequences

**Positive:**
- Clean topic-based routing
- Scales horizontally with message broker
- Enterprise-standard pattern (future-proof)
- Resilience: heartbeat, reconnection built in

**Negative:**
- Slightly heavier than SSE (but negligible)
- One more thing to configure (broker vs. embedded)

## Migration Path

If we later switch to a message broker (RabbitMQ, Kafka), STOMP protocol remains the same; backend code changes minimally:
- Remove embedded broker
- Configure Spring Cloud Stream to use external broker
- Frontend code unchanged

**Decision**: Start with embedded STOMP broker in the API Gateway. If message volume or latency becomes an issue, migrate to RabbitMQ or Kafka (no protocol change needed).
