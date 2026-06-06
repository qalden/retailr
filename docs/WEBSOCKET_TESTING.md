# WebSocket End-to-End Testing Checklist

Complete this checklist to verify WebSocket real-time functionality end-to-end.

## Prerequisites

- ✅ All backend services built and ready (`mvn clean install`)
- ✅ Frontend built and ready (`npm run build`)
- ✅ PostgreSQL database running
- ✅ Network connectivity between services

## Environment Setup

### Step 1: Start Backend Services (Open 4 terminals)

**Terminal 1: Auth Service**
```bash
cd backend/auth-service
mvn spring-boot:run
```
Expected output: "Started AuthServiceApplication in X seconds"

**Terminal 2: Catalog Service**
```bash
cd backend/catalog-service
mvn spring-boot:run
```
Expected output: "Started CatalogServiceApplication in X seconds"

**Terminal 3: Order Service**
```bash
cd backend/order-service
mvn spring-boot:run
```
Expected output: "Started OrderServiceApplication in X seconds"

**Terminal 4: Gateway**
```bash
cd backend/gateway
mvn spring-boot:run
```
Expected output: "Started GatewayApplication in X seconds"

**Verification:**
- [ ] All 4 services started without errors
- [ ] Gateway logs show no errors registering routes
- [ ] Database migrations completed (check logs for Flyway messages)

### Step 2: Start Frontend Dev Server

**Terminal 5: Frontend**
```bash
cd frontend
npm run dev
```
Expected output: "Local: http://localhost:5173"

**Verification:**
- [ ] Frontend server started
- [ ] Vite dev server active and watching for changes

### Step 3: Open Application

1. Open browser to `http://localhost:5173`
2. Login with test credentials (from Task 29)
   - Email: `admin@example.com`
   - Password: `password123`

**Verification:**
- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] No console errors in DevTools

---

## WebSocket Connection Test

### Step 1: Verify Connection Indicator

1. Navigate to `/products` page
2. Look at header (top of page)
3. Observe connection status indicator

**Verification:**
- [ ] Status shows "● Live" (green)
- [ ] Status indicator visible in header
- [ ] No error messages shown

### Step 2: Verify WebSocket in DevTools

1. Open DevTools (F12 or right-click → Inspect)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Refresh the page or navigate to a new page
5. Look for WebSocket connection to `ws://localhost:8080/ws`

**Verification:**
- [ ] WebSocket connection established
- [ ] Status shows "101 Switching Protocols"
- [ ] Messages tab shows STOMP frames (CONNECT, CONNECTED, SUBSCRIBE)
- [ ] No CLOSE frames yet (connection should be open)

### Step 3: Monitor Connection Status Changes

1. In DevTools Network tab, find the WebSocket connection
2. Right-click → "Close"
3. Observe status indicator in header
4. Wait 5 seconds

**Verification:**
- [ ] Status changes to "● Connecting..." (yellow)
- [ ] After ~1-2 seconds: Status changes back to "● Live" (green)
- [ ] DevTools shows new WebSocket connection
- [ ] Automatic reconnection works (no user action needed)

---

## Stock Updates Test

### Step 1: Navigate to Stock Page

1. Click "Stock" in sidebar
2. Wait for stock list to load

**Verification:**
- [ ] Stock list displays with columns: SKU, Product, Warehouse, Qty, Reserved, Available
- [ ] "Live Updates" badge appears in header (if subscribed)
- [ ] No errors in console

### Step 2: Get JWT Token for API Testing

1. Open DevTools Console
2. Run this JavaScript to get the token:
```javascript
// Get token from localStorage
const token = localStorage.getItem('authToken');
console.log('Token:', token);
```

Copy the token value.

### Step 3: Update Stock via API

Open a new terminal and run:

```bash
WAREHOUSE_ID=1
PRODUCT_ID=1
TOKEN="<paste-token-from-console>"

curl -X POST http://localhost:8081/stock/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"warehouseId\": $WAREHOUSE_ID,
    \"productId\": $PRODUCT_ID,
    \"adjustment\": 10,
    \"movementType\": \"RESTOCK\"
  }"
```

**Expected Response:**
```json
{
  "id": 1,
  "productId": 1,
  "warehouseId": 1,
  "quantity": 60,
  "reservedQuantity": 0,
  "availableQuantity": 60,
  "updatedAt": "2026-06-06T10:30:00Z"
}
```

### Step 4: Verify Real-Time Update

1. Watch the stock list page
2. Execute the curl command above
3. Observe stock quantity update in real-time

**Verification:**
- [ ] Stock quantity updates WITHOUT page refresh
- [ ] The specific product row shows new quantity
- [ ] Update appears within 1-2 seconds of API call
- [ ] No page reload required
- [ ] Browser console shows no errors

### Step 5: Multiple Updates

1. Run the curl command 5 more times with different adjustments
2. Observe each update appears in real-time

**Verification:**
- [ ] All 5 updates appear without refresh
- [ ] No "Live Updates" badge disappears
- [ ] Quantities are accurate
- [ ] No duplicate updates or missing updates

---

## Order Updates Test

### Step 1: Navigate to Orders Page

1. Click "Orders" in sidebar
2. Wait for orders list to load

**Verification:**
- [ ] Orders list displays
- [ ] "Live Updates" badge appears in header (if subscribed)
- [ ] Columns: Order #, Customer, Status, Total, Date

### Step 2: Create Order via API

Get token (same as Stock test), then run:

```bash
TOKEN="<paste-token-from-console>"

curl -X POST http://localhost:8082/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": 1,
    "status": "CONFIRMED",
    "totalAmount": 299.99,
    "lines": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 99.99
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "orderNumber": "ORD-1234567890",
  "customerId": 1,
  "status": "CONFIRMED",
  "totalAmount": 299.99,
  "createdAt": "2026-06-06T10:30:00Z",
  "updatedAt": "2026-06-06T10:30:00Z",
  "lines": [ ... ]
}
```

### Step 3: Verify Order Appears in Real-Time

1. Watch the orders list page
2. Execute the curl command above
3. Observe new order appears in list

**Verification:**
- [ ] New order appears WITHOUT page refresh
- [ ] Order displays in table with correct data
- [ ] Order appears within 1-2 seconds of API call
- [ ] Status badge shows correct status (blue for CONFIRMED)
- [ ] No page reload required

### Step 4: Update Order Status

1. Get the order ID from the list (check browser console or inspect element)
2. Run update:

```bash
ORDER_ID=1
TOKEN="<paste-token-from-console>"

curl -X PATCH http://localhost:8082/orders/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "FULFILLED"}'
```

### Step 5: Verify Status Update in Real-Time

1. Watch the orders list page
2. Execute the status update curl command
3. Observe order status changes in real-time

**Verification:**
- [ ] Order status updates WITHOUT page refresh
- [ ] Status badge changes color (green for FULFILLED)
- [ ] Status text displays "FULFILLED"
- [ ] No page reload required

---

## Error Handling Test

### Step 1: Simulate Network Disconnection

1. Open DevTools Network tab
2. Find WebSocket connection
3. Right-click → "Block" or "Close"

**Verification:**
- [ ] Connection indicator changes to "● Error" (red)
- [ ] Page still functional (no crashes)
- [ ] Updates don't appear (expected - connection lost)

### Step 2: Verify Automatic Reconnection

1. Keep DevTools open after blocking connection
2. Wait 5 seconds
3. Observe connection status

**Verification:**
- [ ] Status changes from "● Error" to "● Connecting..." (yellow)
- [ ] Within 1-2 seconds: Status changes to "● Live" (green)
- [ ] New WebSocket connection appears in Network tab
- [ ] Updates resume working (test with API calls)

### Step 3: Simulate Invalid Token

1. Open browser DevTools Console
2. Clear the auth token:
```javascript
localStorage.removeItem('authToken');
```

3. Refresh the page
4. Observe WebSocket behavior

**Verification:**
- [ ] Redirected to login page (authentication check)
- [ ] Can log in again
- [ ] WebSocket reconnects with new token
- [ ] Status shows "● Live" again

---

## Performance Test

### Step 1: Monitor Message Flow

1. Open DevTools Network tab
2. Filter by "WS"
3. Find WebSocket connection
4. Click "Messages" tab
5. Leave open while testing

### Step 2: Rapid Stock Updates

Execute 10 rapid stock updates:

```bash
TOKEN="<paste-token>"
for i in {1..10}; do
  curl -X POST http://localhost:8081/stock/adjust \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"warehouseId\": 1,
      \"productId\": 1,
      \"adjustment\": 1,
      \"movementType\": \"RESTOCK\"
    }" &
done
wait
```

**Verification:**
- [ ] All 10 updates received in DevTools (check Messages count)
- [ ] Page remains responsive
- [ ] No lag or freezing observed
- [ ] All messages processed (final quantity is correct)
- [ ] Browser memory usage reasonable (check Task Manager)

### Step 3: Monitor Payload Sizes

In DevTools Network tab Messages:
1. Click on individual messages
2. Check "Data" size

**Verification:**
- [ ] Each message is < 1KB
- [ ] Payloads are concise (only changed fields)
- [ ] No duplicate or redundant data

---

## Browser Compatibility Test

Test on multiple browsers:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (if available)
- [ ] Mobile Chrome (if available)

For each browser:

1. Complete Steps 1-3 of WebSocket Connection Test
2. Complete Steps 1-4 of Stock Updates Test
3. Complete Steps 1-3 of Order Updates Test

**Verification (for each browser):**
- [ ] WebSocket connection successful
- [ ] Real-time updates work
- [ ] Automatic reconnection works
- [ ] No console errors

---

## Cleanup & Verification

### Step 1: Stop Services

1. Stop all 5 running services (Ctrl+C in each terminal)
2. Verify all processes stopped cleanly

**Verification:**
- [ ] No services still running
- [ ] No "Address already in use" errors if you restart

### Step 2: Verify Build Quality

Run final checks:

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Linting
npm run lint
```

**Verification:**
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run build` → 0 errors, successful build
- [ ] `npm run lint` → no critical issues

### Step 3: Commit Test Results

If all tests pass, create a record:

```bash
git log --oneline -5
```

**Verification:**
- [ ] Latest commits include Task 30.8 and 30.9
- [ ] All documentation committed
- [ ] Clean working directory

---

## Summary Checklist

- [ ] All 4 backend services running
- [ ] Frontend dev server running
- [ ] WebSocket connection successful
- [ ] Connection status indicator working
- [ ] Stock updates appear in real-time
- [ ] Order updates appear in real-time
- [ ] Error handling (disconnect/reconnect) works
- [ ] Performance acceptable (no lag, reasonable memory)
- [ ] Cross-browser compatible
- [ ] Build/typecheck/lint pass
- [ ] Documentation complete

**Result: PASS / FAIL**

If any checks fail, review troubleshooting in [WEBSOCKET.md](./WEBSOCKET.md#troubleshooting) or contact the platform team.
