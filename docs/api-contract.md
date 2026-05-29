# API Contract: Retailr Platform

**Version:** 1.0  
**Date:** 2026-05-29  
**Base URL:** `http://localhost:8080/api`  
**Authentication:** JWT (Bearer token in Authorization header)

## Overview

All endpoints return consistent error envelopes. Pagination, filtering, and sorting are standard across list endpoints. WebSocket endpoints for real-time updates are documented separately.

## Error Envelope

All error responses follow this format:

```json
{
  "timestamp": "2026-05-29T14:30:00Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Stock is insufficient for this order",
  "details": {
    "field": "orderLines[0].quantity",
    "constraint": "insufficient_stock"
  }
}
```

**Status codes:**
- `200` — Success (GET, some POST responses)
- `201` — Created (POST that creates a resource)
- `204` — No Content (successful DELETE, some PUT)
- `400` — Bad Request (validation, business logic error)
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (user lacks role for this operation)
- `404` — Not Found
- `409` — Conflict (e.g., order already confirmed)
- `500` — Server Error

## Pagination & Filtering

### Standard Pagination

All list endpoints support:

```
GET /api/products?page=0&size=20&sort=name,asc
```

**Query Parameters:**
- `page` (default: 0) — zero-indexed page number
- `size` (default: 20, max: 100) — items per page
- `sort` (default: id,desc) — comma-separated sort fields, optional direction (asc/desc)

**Response:**
```json
{
  "content": [ /* items */ ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

### Filtering

Filters are passed as query parameters. Multi-valued filters use comma-separated or repeated param names:

```
GET /api/orders?status=DRAFT,CONFIRMED&warehouse=1&search=shirt
GET /api/orders?status=DRAFT&status=CONFIRMED  (equivalent)
```

Specific filters per endpoint are documented below.

### Searching

Full-text search on specific endpoints uses `search` param:

```
GET /api/products?search=shirt&category=1
```

Searches `name` and `sku` fields, server-side indexed.

## Authentication Endpoints

### POST /auth/login

Request:
```json
{
  "email": "manager@retailr.local",
  "password": "Secure123!"
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "manager@retailr.local",
    "name": "John Manager",
    "roles": ["INVENTORY_MANAGER"]
  }
}
```

**Errors:**
- `400` — Invalid email or password

### POST /auth/refresh

Request (uses refreshToken from login response):
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401` — Invalid or expired refresh token

### GET /auth/me

Returns current authenticated user.

Request:
```
GET /auth/me
Authorization: Bearer <accessToken>
```

Response (200):
```json
{
  "id": 1,
  "email": "manager@retailr.local",
  "name": "John Manager",
  "roles": ["INVENTORY_MANAGER"]
}
```

**Errors:**
- `401` — Missing or invalid token

### POST /auth/logout

Clears session state (optional; frontend can just discard token).

```
POST /auth/logout
Authorization: Bearer <accessToken>
```

Response (204): No content.

## Product Endpoints

### GET /api/products

List all products with pagination, filtering, and search.

**Query Parameters:**
- Standard pagination: `page`, `size`, `sort`
- `category` — filter by category ID (e.g., `?category=1`)
- `search` — full-text search on name and SKU (e.g., `?search=shirt`)

**Response (200):**
```json
{
  "content": [
    {
      "id": 1,
      "sku": "SKU-001",
      "name": "Blue T-Shirt",
      "description": "Cotton blue t-shirt",
      "categoryId": 5,
      "unitPrice": 19.99,
      "lowStockThreshold": 10,
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

**Roles required:** Any (PUBLIC read)

### GET /api/products/{id}

Get a single product with full details and supplier list.

**Response (200):**
```json
{
  "id": 1,
  "sku": "SKU-001",
  "name": "Blue T-Shirt",
  "description": "Cotton blue t-shirt",
  "categoryId": 5,
  "unitPrice": 19.99,
  "lowStockThreshold": 10,
  "suppliers": [
    {
      "id": 10,
      "name": "Textile Co",
      "supplierSku": "SUPPLIER-SKU-001",
      "leadTimeDays": 7
    }
  ],
  "createdAt": "2026-05-29T10:00:00Z",
  "updatedAt": "2026-05-29T11:00:00Z"
}
```

**Roles required:** Any

### POST /api/products

Create a new product.

**Request (201):**
```json
{
  "sku": "SKU-002",
  "name": "Red T-Shirt",
  "description": "Cotton red t-shirt",
  "categoryId": 5,
  "unitPrice": 21.99,
  "lowStockThreshold": 15
}
```

**Response (201):**
```json
{
  "id": 2,
  "sku": "SKU-002",
  "name": "Red T-Shirt",
  "description": "Cotton red t-shirt",
  "categoryId": 5,
  "unitPrice": 21.99,
  "lowStockThreshold": 15,
  "createdAt": "2026-05-29T12:00:00Z",
  "updatedAt": "2026-05-29T12:00:00Z"
}
```

**Validation:**
- `sku` is required and unique
- `name` is required
- `categoryId` must exist
- `unitPrice` must be positive
- `lowStockThreshold` must be non-negative

**Roles required:** ADMIN, INVENTORY_MANAGER

**Errors:**
- `400` — Validation error
- `409` — SKU already exists

### PUT /api/products/{id}

Update an existing product.

**Request:**
```json
{
  "name": "Red T-Shirt (Updated)",
  "unitPrice": 22.99,
  "lowStockThreshold": 12
}
```

**Response (200):** Updated product object.

**Roles required:** ADMIN, INVENTORY_MANAGER

**Errors:**
- `404` — Product not found
- `400` — Validation error

### DELETE /api/products/{id}

Delete a product (hard delete; prevents orders from referencing it via constraint).

**Response (204):** No content.

**Roles required:** ADMIN

**Errors:**
- `404` — Product not found
- `409` — Product has associated orders or stock items

## Supplier Endpoints

### GET /api/suppliers

List all suppliers.

**Response (200):**
```json
{
  "content": [
    {
      "id": 10,
      "name": "Textile Co",
      "contactEmail": "contact@textile.co",
      "phone": "+1-555-0100",
      "address": "123 Industrial Ave",
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** ADMIN, INVENTORY_MANAGER, SALES_OFFICER, VIEWER

### POST /api/suppliers

Create a new supplier.

**Request:**
```json
{
  "name": "Apparel Suppliers Inc",
  "contactEmail": "sales@apparelsup.com",
  "phone": "+1-555-0200",
  "address": "456 Supply St"
}
```

**Response (201):** Created supplier object.

**Roles required:** ADMIN, INVENTORY_MANAGER

### PUT /api/suppliers/{id}

Update a supplier.

**Roles required:** ADMIN, INVENTORY_MANAGER

### DELETE /api/suppliers/{id}

Delete a supplier (and all product-supplier relationships).

**Roles required:** ADMIN

## Category Endpoints

### GET /api/categories

List all categories.

**Response (200):**
```json
{
  "content": [
    {
      "id": 5,
      "name": "Apparel",
      "description": "Clothing and accessories",
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** Any

### POST /api/categories

Create a category.

**Roles required:** ADMIN

### PUT /api/categories/{id}

Update a category.

**Roles required:** ADMIN

### DELETE /api/categories/{id}

Delete a category (and all associated products).

**Roles required:** ADMIN

## Stock Endpoints

### GET /api/stock/levels

List stock levels across all warehouses (with filtering by warehouse, product, low-stock status).

**Query Parameters:**
- Standard pagination
- `warehouse` — filter by warehouse ID
- `product` — filter by product ID
- `lowStock` (boolean) — show only items below threshold

**Response (200):**
```json
{
  "content": [
    {
      "id": 100,
      "productId": 1,
      "productName": "Blue T-Shirt",
      "warehouseId": 20,
      "warehouseName": "Main Warehouse",
      "quantity": 50,
      "reservedQuantity": 5,
      "availableQuantity": 45,
      "lowStockThreshold": 10,
      "isLowStock": false,
      "updatedAt": "2026-05-29T14:00:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** INVENTORY_MANAGER, VIEWER (read-only)

### GET /api/stock/movements

Audit trail of stock movements (filterable by product, warehouse, date range).

**Query Parameters:**
- Standard pagination
- `product` — filter by product ID
- `warehouse` — filter by warehouse ID
- `movementType` — filter by type (PURCHASE, SALE, ADJUSTMENT, ORDER_CONFIRM, etc.)
- `startDate` / `endDate` — date range filter

**Response (200):**
```json
{
  "content": [
    {
      "id": 1001,
      "productId": 1,
      "productName": "Blue T-Shirt",
      "warehouseId": 20,
      "quantityDelta": -5,
      "movementType": "ORDER_CONFIRM",
      "referenceType": "ORDER",
      "referenceId": 500,
      "createdBy": {
        "id": 1,
        "name": "John Manager"
      },
      "createdAt": "2026-05-29T14:30:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** INVENTORY_MANAGER, VIEWER

### POST /api/stock/adjust

Manually adjust stock for a product in a warehouse.

**Request:**
```json
{
  "productId": 1,
  "warehouseId": 20,
  "quantityDelta": 10,
  "reason": "Physical count correction"
}
```

**Response (201):**
```json
{
  "id": 1002,
  "productId": 1,
  "warehouseId": 20,
  "quantityAfter": 60,
  "movementType": "ADJUSTMENT",
  "createdAt": "2026-05-29T14:35:00Z"
}
```

**Validation:**
- `quantityDelta` can be positive or negative
- Resulting `quantity` must be non-negative
- `reason` is required for audit trail

**Roles required:** ADMIN, INVENTORY_MANAGER

**Errors:**
- `400` — Invalid delta, would result in negative quantity
- `404` — Product or warehouse not found

### GET /api/stock/alerts

List low-stock alerts (acknowledged and unacknowledged).

**Query Parameters:**
- `acknowledged` (boolean) — filter by acknowledgment status

**Response (200):**
```json
{
  "content": [
    {
      "id": 2001,
      "productId": 1,
      "productName": "Blue T-Shirt",
      "warehouseId": 20,
      "currentQuantity": 8,
      "lowStockThreshold": 10,
      "triggeredAt": "2026-05-29T14:00:00Z",
      "acknowledgedAt": null,
      "acknowledgedBy": null
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** INVENTORY_MANAGER, VIEWER

### POST /api/stock/alerts/{id}/acknowledge

Acknowledge a low-stock alert (mark as reviewed).

**Request:** (empty body)

**Response (200):**
```json
{
  "id": 2001,
  "acknowledgedAt": "2026-05-29T14:45:00Z",
  "acknowledgedBy": {
    "id": 1,
    "name": "John Manager"
  }
}
```

**Roles required:** INVENTORY_MANAGER

## Customer Endpoints

### GET /api/customers

List customers.

**Query Parameters:**
- Standard pagination
- `search` — search by name or email

**Response (200):**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Acme Store",
      "email": "orders@acmestore.com",
      "phone": "+1-555-1000",
      "address": "789 Main St",
      "city": "Springfield",
      "postalCode": "12345",
      "createdAt": "2026-05-29T09:00:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** SALES_OFFICER, VIEWER

### POST /api/customers

Create a new customer.

**Request:**
```json
{
  "name": "Best Buy Local",
  "email": "orders@bestbuylocal.com",
  "phone": "+1-555-1001",
  "address": "100 Commercial Blvd",
  "city": "Townsville",
  "postalCode": "54321"
}
```

**Response (201):** Created customer object.

**Roles required:** SALES_OFFICER, ADMIN

### GET /api/customers/{id}

Get customer details and order history.

**Response (200):**
```json
{
  "id": 1,
  "name": "Acme Store",
  "email": "orders@acmestore.com",
  "phone": "+1-555-1000",
  "address": "789 Main St",
  "city": "Springfield",
  "postalCode": "12345",
  "orders": [
    {
      "id": 500,
      "orderNumber": "ORD-20260529-001",
      "status": "CONFIRMED",
      "totalAmount": 500.00,
      "createdAt": "2026-05-29T10:00:00Z"
    }
  ]
}
```

**Roles required:** SALES_OFFICER, VIEWER

### PUT /api/customers/{id}

Update customer details.

**Roles required:** SALES_OFFICER, ADMIN

## Order Endpoints

### POST /api/orders

Create a new order (in DRAFT status).

**Request:**
```json
{
  "customerId": 1,
  "lines": [
    {
      "productId": 1,
      "quantity": 5
    },
    {
      "productId": 2,
      "quantity": 10
    }
  ]
}
```

**Response (201):**
```json
{
  "id": 500,
  "orderNumber": "ORD-20260529-001",
  "customerId": 1,
  "status": "DRAFT",
  "totalAmount": 309.95,
  "lines": [
    {
      "id": 5001,
      "productId": 1,
      "productName": "Blue T-Shirt",
      "quantity": 5,
      "unitPrice": 19.99,
      "lineTotal": 99.95
    },
    {
      "id": 5002,
      "productId": 2,
      "productName": "Red T-Shirt",
      "quantity": 10,
      "unitPrice": 21.00,
      "lineTotal": 210.00
    }
  ],
  "createdAt": "2026-05-29T14:00:00Z"
}
```

**Validation:**
- `customerId` must exist
- Each `productId` must exist
- Each `quantity` must be positive

**Roles required:** SALES_OFFICER, ADMIN

**Errors:**
- `400` — Validation error, invalid product
- `404` — Customer not found

### GET /api/orders

List all orders with filtering and pagination.

**Query Parameters:**
- Standard pagination
- `status` — filter by status (DRAFT, CONFIRMED, FULFILLED, CANCELLED)
- `customerId` — filter by customer
- `search` — search by order number
- `dateRange.from` / `dateRange.to` — date range filter

**Response (200):**
```json
{
  "content": [
    {
      "id": 500,
      "orderNumber": "ORD-20260529-001",
      "customerId": 1,
      "customerName": "Acme Store",
      "status": "CONFIRMED",
      "totalAmount": 309.95,
      "createdAt": "2026-05-29T14:00:00Z",
      "confirmedAt": "2026-05-29T14:15:00Z"
    }
  ],
  "pageable": { ... }
}
```

**Roles required:** SALES_OFFICER, ADMIN, VIEWER

### GET /api/orders/{id}

Get full order details with all lines.

**Response (200):**
```json
{
  "id": 500,
  "orderNumber": "ORD-20260529-001",
  "customerId": 1,
  "customerName": "Acme Store",
  "status": "CONFIRMED",
  "totalAmount": 309.95,
  "lines": [ ... ],
  "createdAt": "2026-05-29T14:00:00Z",
  "confirmedAt": "2026-05-29T14:15:00Z"
}
```

**Roles required:** SALES_OFFICER, ADMIN, VIEWER

### PUT /api/orders/{id}

Update an order (only when in DRAFT status; update lines, customer, etc.).

**Request:**
```json
{
  "customerId": 2,
  "lines": [
    {
      "id": 5001,
      "quantity": 3
    },
    {
      "productId": 3,
      "quantity": 2
    }
  ]
}
```

**Response (200):** Updated order object.

**Validation:**
- Order must be in DRAFT status (400 if not)
- Cannot update an order that is CONFIRMED or later

**Roles required:** SALES_OFFICER, ADMIN

**Errors:**
- `400` — Order is not in DRAFT status
- `409` — Cannot modify a confirmed order

### POST /api/orders/{id}/confirm

Confirm an order (reserve stock, transition to CONFIRMED).

**Request:**
```json
{
  "requestId": "unique-idempotency-key-123"
}
```

**Response (200):**
```json
{
  "id": 500,
  "orderNumber": "ORD-20260529-001",
  "status": "CONFIRMED",
  "totalAmount": 309.95,
  "confirmedAt": "2026-05-29T14:15:00Z"
}
```

**Behavior:**
- Calls Catalog Service to check and reserve stock
- If insufficient stock, returns 400 with details
- If successful, updates Order status to CONFIRMED
- Publishes to `/topic/order-updates` (WebSocket)
- Idempotent: same `requestId` returns same result without double-reserving

**Validation:**
- Order must be in DRAFT status
- All order lines must have product with sufficient available stock

**Roles required:** SALES_OFFICER, ADMIN

**Errors:**
- `400` — Insufficient stock, order details in error response
- `409` — Order is not in DRAFT status

### POST /api/orders/{id}/fulfill

Mark an order as FULFILLED (stock already decremented on confirm).

**Request:** (empty body)

**Response (200):** Updated order object.

**Validation:**
- Order must be in CONFIRMED status

**Roles required:** ADMIN, INVENTORY_MANAGER

**Errors:**
- `409` — Order is not in CONFIRMED status

### POST /api/orders/{id}/cancel

Cancel an order and release reserved stock.

**Request:** (empty body)

**Response (200):**
```json
{
  "id": 500,
  "status": "CANCELLED",
  "cancelledAt": "2026-05-29T15:00:00Z"
}
```

**Behavior:**
- If order is DRAFT, simply mark as CANCELLED (no stock release needed)
- If order is CONFIRMED, release reserved stock from Catalog Service
- Creates StockMovement records (via Catalog)
- Publishes to `/topic/order-updates`

**Roles required:** SALES_OFFICER, ADMIN

**Errors:**
- `409` — Order is already FULFILLED or CANCELLED

## WebSocket (STOMP) Real-Time Endpoints

### Connect

```javascript
// Frontend code (using stompjs library)
const client = new StompClient({
  brokerURL: 'ws://localhost:8080/ws',
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000
});

client.onConnect = () => {
  // Subscribe to topics
  client.subscribe('/topic/stock-updates', (message) => {
    const update = JSON.parse(message.body);
    // Handle stock update in Redux
  });
  
  client.subscribe('/topic/order-updates', (message) => {
    const update = JSON.parse(message.body);
    // Handle order update in Redux
  });
};

client.activate();
```

### Topic: /topic/stock-updates

Published when stock quantity changes (order confirm, manual adjustment, etc.).

**Message format:**
```json
{
  "type": "STOCK_UPDATE",
  "stockItemId": 100,
  "productId": 1,
  "warehouseId": 20,
  "quantity": 45,
  "reservedQuantity": 5,
  "availableQuantity": 40,
  "lowStockThreshold": 10,
  "isLowStock": false,
  "updatedAt": "2026-05-29T14:30:00Z"
}
```

**Frontend action:** Dispatch Redux action to update `stock.entities[stockItemId]`.

### Topic: /topic/order-updates

Published when order status changes.

**Message format:**
```json
{
  "type": "ORDER_UPDATE",
  "orderId": 500,
  "orderNumber": "ORD-20260529-001",
  "customerId": 1,
  "status": "CONFIRMED",
  "totalAmount": 309.95,
  "confirmedAt": "2026-05-29T14:15:00Z"
}
```

**Frontend action:** Dispatch Redux action to update `orders.entities[orderId]`.

### Topic: /topic/alerts

Published when low-stock alert is triggered.

**Message format:**
```json
{
  "type": "LOW_STOCK_ALERT",
  "alertId": 2001,
  "productId": 1,
  "productName": "Blue T-Shirt",
  "warehouseId": 20,
  "currentQuantity": 8,
  "lowStockThreshold": 10,
  "triggeredAt": "2026-05-29T14:00:00Z"
}
```

## User Management Endpoints (Admin Only)

### GET /api/admin/users

List all users.

**Roles required:** ADMIN

### POST /api/admin/users

Create a new user.

**Request:**
```json
{
  "email": "newuser@retailr.local",
  "name": "New User",
  "password": "SecurePassword123!",
  "roles": ["SALES_OFFICER"]
}
```

**Roles required:** ADMIN

### PUT /api/admin/users/{id}

Update user details and roles.

**Roles required:** ADMIN

### DELETE /api/admin/users/{id}

Deactivate a user (soft delete).

**Roles required:** ADMIN
