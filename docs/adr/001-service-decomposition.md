# ADR 001: Service Decomposition — Three-Service Architecture

**Date:** 2026-05-29  
**Status:** Accepted

## Context

We are building a scalable retail operations platform with the following high-level requirements:
- User authentication and role-based access control
- Product and supplier management
- Inventory tracking across warehouses
- Order lifecycle management
- Real-time stock and order updates

The question: How many microservices should we decompose into?

## Options Considered

### Option 1: Monolith (Single Service)
- **Pros:** Simplest to develop and deploy; no inter-service communication latency; ACID transactions across all domains.
- **Cons:** Harder to scale independently; single points of failure; violates the requirement to demonstrate Spring Cloud patterns; increases cognitive load as features grow.

### Option 2: Polyglot (10+ Services)
- **Pros:** True domain isolation; independent scaling per service.
- **Cons:** Operational complexity (10+ deployments, service discovery, config); higher latency (inter-service calls); distributed transactions are hard; overkill for this domain size; violates Karpathy's "Simplicity First" principle.

### Option 3: Three-Service Decomposition (Chosen)
- **Auth Service** — User identity, JWT, roles
- **Catalog/Inventory Service** — Products, suppliers, warehouses, stock levels, movements, alerts
- **Order Service** — Orders, order lines, order lifecycle

## Decision

**Three services + API Gateway + single shared PostgreSQL database.**

This split achieves:
1. **Domain boundaries** — each service owns a clear, independent domain
2. **Operational simplicity** — few enough that one person can understand the whole topology
3. **Spring Cloud learning** — exercises service discovery, gateway routing, inter-service communication, resilience patterns
4. **Independent scaling** — Order Service can scale on order volume without scaling Auth or Catalog
5. **Single source of truth** — shared database prevents data duplication; transactions stay simple

## Rationale

**Why not two services?**  
Auth + Catalog would give us a "users & inventory" service and an "orders" service. But inventory and orders are tightly coupled (orders reserve stock). Keeping inventory separate from orders makes sense, even if it means three services.

**Why not more than three?**  
- Separate Supplier Service? Suppliers are tightly coupled to products; separate would require API calls for every product query. Not worth it.
- Separate Notification Service? Notifications are async side effects; can be handled within each service's async layer. Don't over-fragment.
- Separate Warehouse Service? Warehouse is just a location attribute; not worth a service.

**Why shared database?**  
- Simplifies transaction semantics (order confirmation is atomic across order + stock tables).
- Reduces operational complexity (one connection pool, one backup/restore).
- If we hit bottlenecks, we optimize queries/indexes first, then consider polyglot persistence.
- Schema is logically separated (Auth owns users/roles; Catalog owns products/stock; Order owns orders), so each service's code is still clean.

## Consequences

**Positive:**
- Clear ownership and boundaries
- Reasonable operational footprint
- Each service is understandable in isolation
- Can scale Order Service independently if needed

**Negative:**
- Order Service must call Catalog Service to check/reserve stock (adds latency, requires resilience patterns like circuit breakers)
- If Catalog Service goes down, new orders can't be confirmed (though GET orders still works)
- Shared database means we can't do per-service data migrations as easily (coordinate across all three)

## Alternatives If This Changes

If we discover that order throughput or inventory complexity justifies it, we can split further:
- Move Warehouse/Stock to its own service (separate data mutations from reads)
- Introduce a Notification Service if async pub/sub becomes essential

But the default is to keep it at three. More services require more discipline and introduce more failure modes.
