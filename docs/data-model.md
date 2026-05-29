# Data Model: Retailr Platform

**Version:** 1.0  
**Date:** 2026-05-29

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email (U)   │
│ password    │
│ name        │
│ created_at  │
│ updated_at  │
└────┬────────┘
     │
     │ has_many
     ↓
┌──────────────────┐
│   UserRole       │
├──────────────────┤
│ user_id (FK)     │
│ role_id (FK)     │
└──────────────────┘
     ↑
     │ references
     │
┌─────────────┐
│    Role     │
├─────────────┤
│ id (PK)     │
│ name (U)    │
│ permissions │
└─────────────┘

┌──────────────┐
│   Category   │
├──────────────┤
│ id (PK)      │
│ name (U)     │
│ description  │
│ created_at   │
└──────────────┘
     ↑
     │ references
     │
┌────────────────────┐
│     Product        │
├────────────────────┤
│ id (PK)            │
│ sku (U)            │
│ name               │
│ description        │
│ category_id (FK)   │
│ unit_price         │
│ low_stock_threshold│
│ created_at         │
│ updated_at         │
└────┬───────────────┘
     │
     │ many_to_many
     ↓
┌──────────────┐
│   Supplier   │
├──────────────┤
│ id (PK)      │
│ name (U)     │
│ contact_email│
│ phone        │
│ address      │
│ created_at   │
└──────────────┘

    (join table)
┌──────────────────────┐
│  ProductSupplier     │
├──────────────────────┤
│ product_id (FK)      │
│ supplier_id (FK)     │
│ supplier_sku         │
│ lead_time_days       │
└──────────────────────┘

┌──────────────┐
│  Warehouse   │
├──────────────┤
│ id (PK)      │
│ name (U)     │
│ location     │
│ created_at   │
└──────────────┘
     ↑
     │ references
     │
┌──────────────────────┐
│    StockItem         │
├──────────────────────┤
│ id (PK)              │
│ product_id (FK)      │
│ warehouse_id (FK)    │
│ quantity             │
│ reserved_quantity    │
│ updated_at           │
└──────────────────────┘
     ↑
     │ references
     │
┌──────────────────────┐
│  StockMovement       │
├──────────────────────┤
│ id (PK)              │
│ stock_item_id (FK)   │
│ quantity_delta       │
│ movement_type        │
│ reference_type       │ (ORDER_CONFIRM, MANUAL, etc.)
│ reference_id         │ (order_id, user_id, etc.)
│ created_by (FK User) │
│ created_at           │
└──────────────────────┘

┌──────────────┐
│   Customer   │
├──────────────┤
│ id (PK)      │
│ name (U)     │
│ email (U)    │
│ phone        │
│ address      │
│ city         │
│ postal_code  │
│ created_at   │
│ updated_at   │
└──────────────┘
     ↑
     │ has_many
     ↓
┌──────────────────┐
│     Order        │
├──────────────────┤
│ id (PK)          │
│ order_number (U) │
│ customer_id (FK) │
│ status           │
│ total_amount     │
│ created_at       │
│ confirmed_at     │
│ fulfilled_at     │
│ cancelled_at     │
└────┬─────────────┘
     │
     │ has_many
     ↓
┌──────────────────┐
│   OrderLine      │
├──────────────────┤
│ id (PK)          │
│ order_id (FK)    │
│ product_id (FK)  │
│ quantity         │
│ unit_price       │
│ line_total       │
└──────────────────┘

    (internal, not exposed)
┌──────────────────────────┐
│ OrderStockReservation    │
├──────────────────────────┤
│ id (PK)                  │
│ order_id (FK)            │
│ product_id (FK)          │
│ warehouse_id (FK)        │
│ reserved_quantity        │
│ released_at              │
└──────────────────────────┘

┌──────────────────────┐
│  LowStockAlert       │
├──────────────────────┤
│ id (PK)              │
│ stock_item_id (FK)   │
│ triggered_at         │
│ acknowledged_at      │
│ acknowledged_by (FK) │
└──────────────────────┘
```

## Entity Definitions

### User
**Table:** `users`

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- BCrypt hash
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);
```

**Constraints:**
- `email` is unique and validated
- `password` is never returned from API
- Soft delete: consider adding `deleted_at` for audit trail

### Role
**Table:** `roles`

```sql
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions TEXT -- JSON array of permission strings
);

INSERT INTO roles (name, permissions) VALUES
  ('ADMIN', '["*"]'), -- wildcard: all permissions
  ('INVENTORY_MANAGER', '["inventory.read", "inventory.write", "stock.read", "stock.write"]'),
  ('SALES_OFFICER', '["products.read", "customers.read", "customers.write", "orders.create", "orders.read"]'),
  ('VIEWER', '["products.read", "orders.read", "inventory.read"]');
```

### UserRole (join table)
**Table:** `user_roles`

```sql
CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

### Category
**Table:** `categories`

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- `name` is unique

### Product
**Table:** `products`

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  unit_price NUMERIC(12, 2) NOT NULL,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unit_price_positive CHECK (unit_price > 0),
  CONSTRAINT threshold_non_negative CHECK (low_stock_threshold >= 0)
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
```

**Constraints:**
- `sku` is unique
- `unit_price` is positive
- `low_stock_threshold` is non-negative
- Foreign key to category (cannot delete category while products exist)

### Supplier
**Table:** `suppliers`

```sql
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### ProductSupplier (join table)
**Table:** `product_suppliers`

```sql
CREATE TABLE product_suppliers (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(50),
  lead_time_days INT DEFAULT 7,
  PRIMARY KEY (product_id, supplier_id),
  CONSTRAINT lead_time_non_negative CHECK (lead_time_days >= 0)
);

CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);
```

### Warehouse
**Table:** `warehouses`

```sql
CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### StockItem
**Table:** `stock_items`

```sql
CREATE TABLE stock_items (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id),
  CONSTRAINT quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT reserved_non_negative CHECK (reserved_quantity >= 0),
  CONSTRAINT reserved_less_than_quantity CHECK (reserved_quantity <= quantity)
);

CREATE INDEX idx_stock_items_product_id ON stock_items(product_id);
CREATE INDEX idx_stock_items_warehouse_id ON stock_items(warehouse_id);
```

**Constraints:**
- Unique pair: (product_id, warehouse_id)
- `quantity` is non-negative (total available)
- `reserved_quantity` is non-negative and ≤ `quantity`

**Available quantity:** `quantity - reserved_quantity`

### StockMovement
**Table:** `stock_movements`

```sql
CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity_delta INT NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_stock_item_id ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
```

**Constraints:**
- `quantity_delta` can be positive (IN) or negative (OUT)
- `movement_type`: PURCHASE, SALE, ADJUSTMENT, ORDER_CONFIRM, ORDER_CANCEL, etc.
- `reference_type` + `reference_id` link to the source (e.g., order_id, user_id)
- Immutable: movements are never updated, only inserted

**Example:**
- Order confirmed with 5 units → `quantity_delta = -5`, `movement_type = ORDER_CONFIRM`, `reference_type = ORDER`, `reference_id = order_id`

### Customer
**Table:** `customers`

```sql
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
```

### Order
**Table:** `orders`

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  CONSTRAINT status_valid CHECK (status IN ('DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED'))
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

**Constraints:**
- `order_number` is unique (generated as `ORD-<timestamp>-<random>` or similar)
- `status` is one of DRAFT, CONFIRMED, FULFILLED, CANCELLED
- `confirmed_at`, `fulfilled_at`, `cancelled_at` are set when status transitions occur

**Status transitions:**
- DRAFT → CONFIRMED (on confirm endpoint)
- CONFIRMED → FULFILLED (on fulfill endpoint)
- DRAFT, CONFIRMED → CANCELLED (on cancel endpoint)
- No other transitions allowed

### OrderLine
**Table:** `order_lines`

```sql
CREATE TABLE order_lines (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT line_total_correct CHECK (line_total = quantity * unit_price)
);

CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX idx_order_lines_product_id ON order_lines(product_id);
```

**Constraints:**
- `quantity` is positive
- `unit_price` is non-negative (allows $0 promos)
- `line_total` is computed (for data consistency, but stored for query performance)

**Immutability during confirmation:** Once an order is CONFIRMED, order lines cannot be modified (prevent race conditions during stock deduction).

### OrderStockReservation (Internal)
**Table:** `order_stock_reservations`

This table tracks stock reserved for an order. It is NOT exposed via API; used internally to manage stock hold during order confirmation.

```sql
CREATE TABLE order_stock_reservations (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  reserved_quantity INT NOT NULL,
  released_at TIMESTAMP,
  UNIQUE (order_id, product_id, warehouse_id)
);

CREATE INDEX idx_reservations_order_id ON order_stock_reservations(order_id);
```

### LowStockAlert
**Table:** `low_stock_alerts`

```sql
CREATE TABLE low_stock_alerts (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_stock_item_id ON low_stock_alerts(stock_item_id);
CREATE INDEX idx_alerts_triggered_at ON low_stock_alerts(triggered_at);
```

**Trigger:** When `(quantity - reserved_quantity) < low_stock_threshold` on any StockItem, a record is inserted.

## Migration Strategy

Use **Flyway** (simple, Java-based, no XML).

**File structure:**
```
backend/
  <service>/
    src/main/resources/db/migration/
      V1__initial_schema.sql
      V2__add_user_roles.sql
      V3__add_stock_movements.sql
      ...
```

**Naming:** `V<version>__<description>.sql`
- `V1__initial_schema.sql` — All base tables (User, Category, Product, Warehouse, Customer, Order, OrderLine)
- `V2__add_supplier_tables.sql` — Supplier, ProductSupplier
- `V3__add_stock_management.sql` — StockItem, StockMovement, OrderStockReservation
- `V4__add_alerts.sql` — LowStockAlert, Role, UserRole

No `spring.jpa.hibernate.ddl-auto=update` in any environment.

## Key Domain Constraints

**Enforced at the database level (constraints, triggers) and application level (business logic):**

1. **Stock non-negativity:** Quantity and reserved_quantity cannot be negative. Decrement operations check availability first.
2. **Stock reserved ≤ stock available:** `reserved_quantity <= quantity` constraint prevents overbooking.
3. **Order status transitions:** Only valid state transitions are allowed (DRAFT → CONFIRMED, etc.).
4. **Stock decrements on order confirmation:** When an order transitions to CONFIRMED, `StockItem.quantity` is decremented and a `StockMovement` record is created. Atomic transaction.
5. **Stock restored on order cancellation:** When order is CANCELLED, `StockItem.quantity` is incremented and a `StockMovement` record is created.
6. **Low-stock alerts are idempotent:** Only one active (unacknowledged) alert per StockItem at a time.

## Shared Database vs. Polyglot

**Decision:** All three backend services (Auth, Catalog, Order) share a single PostgreSQL database.

**Why:**
- Simplifies transactions (e.g., order confirmation needs to be atomic across order and stock tables).
- Reduces operational complexity for this scale.
- If bottlenecks emerge, optimize queries and indexes first; migrate to polyglot persistence later.

**Schema separation (logical, not physical):**
- Auth Service "owns" `users`, `roles`, `user_roles`
- Catalog Service "owns" `categories`, `products`, `suppliers`, `product_suppliers`, `warehouses`, `stock_items`, `stock_movements`, `low_stock_alerts`
- Order Service "owns" `customers`, `orders`, `order_lines`, `order_stock_reservations`

Each service's JPA entities map only to tables it owns; foreign key references are made via stored ID values (no JPA relationships across service boundaries).
