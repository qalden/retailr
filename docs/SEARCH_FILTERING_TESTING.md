# Search, Filter & Sort: End-to-End Testing Guide

Comprehensive testing procedures for the Retailr search, filter, and sort system. This guide covers manual test scenarios, test cases, cross-browser testing, and performance verification.

**Table of Contents**
- [Prerequisites](#prerequisites)
- [Test Environment Setup](#test-environment-setup)
- [Manual Test Scenarios](#manual-test-scenarios)
- [Test Procedures](#test-procedures)
- [Cross-Browser Testing](#cross-browser-testing)
- [Performance Testing](#performance-testing)
- [Build Verification](#build-verification)
- [Test Results Checklist](#test-results-checklist)

## Prerequisites

### System Requirements

- **Node.js:** 18 or higher
- **npm:** 9 or higher
- **Browsers:** Chrome, Firefox, Safari, or Edge (latest versions)
- **Backend:** Running services for Products, Orders, Stock
- **Network:** Stable internet connection for API calls

### Required Services

Ensure these backend services are running:

```bash
# Check API connectivity
curl http://localhost:8080/api/health

# Check WebSocket connectivity
# (WebSocket endpoint should be available at ws://localhost:8080)
```

### Test Data

The test scenarios assume you have sample data:

- **Products:** At least 10 products with various SKUs, names, categories, and prices
- **Orders:** At least 10 orders with various statuses, amounts, and dates
- **Stock:** At least 10 stock items with various quantities

## Test Environment Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### 3. Start Development Server

```bash
npm run dev
```

Application runs at `http://localhost:5173`

### 4. Start Backend Services

From the root directory:

```bash
# Start all backend services
docker-compose up

# Or individually:
java -jar catalog-service.jar
java -jar order-service.jar
java -jar stock-service.jar
```

### 5. Verify Connectivity

Check browser console for these indicators:

- **Green checkmark** next to WebSocket indicator in header
- **No connection errors** in browser console
- **Data loads** in Product/Order/Stock list pages
- **Network tab** shows successful API calls

## Manual Test Scenarios

### Scenario 1: Basic Search Functionality

**Objective:** Verify search finds items by multiple fields

**Test Cases:**

#### TC1.1: Single Word Search

```
Setup:
- Navigate to Products page
- Products loaded (confirm via data in table)

Test Steps:
1. Click search input field
2. Type: "laptop"
3. Wait 500ms for debounce
4. Observe table refresh

Expected Results:
✓ Only products with "laptop" in name or SKU appear
✓ Product count decreases (unless all products match)
✓ URL contains: search=laptop
✓ Search field shows "laptop"

Pass/Fail: ___
```

#### TC1.2: Multi-Word Search (Tokenization)

```
Setup:
- Navigate to Products page
- At least 1 product with both words in different fields

Test Steps:
1. Click search input field
2. Type: "laptop pro"
3. Wait 500ms for debounce
4. Observe results

Expected Results:
✓ Only products with BOTH "laptop" AND "pro" appear
✓ Example match: name="MacBook Pro", sku="PROD-123"
✓ URL contains: search=laptop+pro or search=laptop%20pro
✓ Products missing either word filtered out

Pass/Fail: ___
```

#### TC1.3: Case Insensitive Search

```
Setup:
- Navigate to Products page
- Know a product name (e.g., "Laptop")

Test Steps:
1. Search: "LAPTOP" (uppercase)
2. Observe results
3. Search: "laptop" (lowercase)
4. Observe results
5. Search: "LaPtOp" (mixed case)
6. Observe results

Expected Results:
✓ All three searches return same results
✓ Case doesn't matter
✓ Results identical

Pass/Fail: ___
```

#### TC1.4: Clear Search

```
Setup:
- Navigate to Products page
- Have active search: "laptop"

Test Steps:
1. Observe filtered results
2. Click "Clear" button next to search (if available)
   OR select all text and delete
3. Observe results

Expected Results:
✓ Search field becomes empty
✓ All products reappear
✓ URL no longer contains search parameter
✓ Product count returns to full amount

Pass/Fail: ___
```

### Scenario 2: Filtering Functionality

**Objective:** Verify filters with multiple operators and AND logic

#### TC2.1: Single Filter (Text)

```
Setup:
- Navigate to Products page
- Click "Filters" button to open FilterPanel

Test Steps:
1. In FilterPanel:
   - Field: "Product Name"
   - Operator: "contains"
   - Value: "pro"
2. Click "Apply"
3. Observe results

Expected Results:
✓ FilterPanel closes
✓ Products with "pro" in name appear
✓ Others filtered out
✓ URL contains filter parameter
✓ FilterPanel button shows active state (e.g., blue badge)

Pass/Fail: ___
```

#### TC2.2: Single Filter (Range)

```
Setup:
- Navigate to Products page
- Open FilterPanel

Test Steps:
1. In FilterPanel:
   - Field: "Unit Price"
   - Operator: "gte" (greater than or equal)
   - Value: "500"
2. Click "Apply"
3. Observe results

Expected Results:
✓ Only products with price >= $500 appear
✓ Lower priced products filtered out
✓ URL contains filter: filters=[{"field":"unitPrice","operator":"gte","value":500}]
✓ Results update immediately

Pass/Fail: ___
```

#### TC2.3: Multiple Filters (AND Logic)

```
Setup:
- Navigate to Products page
- Open FilterPanel

Test Steps:
1. Add first filter:
   - Field: "Category"
   - Operator: "equals"
   - Value: "Electronics"
2. Click "Add Filter" button
3. Add second filter:
   - Field: "Unit Price"
   - Operator: "gte"
   - Value: "200"
4. Click "Apply"
5. Observe results

Expected Results:
✓ Only items matching BOTH filters appear
✓ Results are subset of either single filter
✓ Example: Electronics items with price >= $200
✓ Non-Electronics items filtered out (even if price qualifies)
✓ Cheap Electronics filtered out
✓ URL contains both filters

Pass/Fail: ___
```

#### TC2.4: Filter Removal

```
Setup:
- Navigate to Products page
- Have 2 active filters applied
- Open FilterPanel

Test Steps:
1. Observe both filters listed
2. Click "Remove" button next to first filter
3. Verify filter row removed
4. Click "Apply"
5. Observe results change

Expected Results:
✓ First filter row removed from panel
✓ Only second filter applied
✓ Results update to match only remaining filter
✓ Product count likely increases
✓ URL updated with only remaining filter

Pass/Fail: ___
```

#### TC2.5: Select Operator Filter

```
Setup:
- Navigate to Orders page
- Open FilterPanel

Test Steps:
1. In FilterPanel:
   - Field: "Status"
   - Operator: "in" or "equals"
   - Value: "CONFIRMED"
2. Click "Apply"
3. Observe results

Expected Results:
✓ Only confirmed orders appear
✓ Pending, fulfilled, cancelled orders filtered out
✓ Status values display as dropdown/multi-select
✓ Correct selection works as expected

Pass/Fail: ___
```

#### TC2.6: Clear All Filters

```
Setup:
- Navigate to Products page
- Have 2+ filters applied

Test Steps:
1. Observe filtered results
2. Click "Clear Filters" button (usually in UI or FilterPanel)
3. Observe results

Expected Results:
✓ All filters removed
✓ All products reappear
✓ URL parameters cleared
✓ Filter state resets
✓ FilterPanel shows no active filters

Pass/Fail: ___
```

### Scenario 3: Sorting Functionality

**Objective:** Verify sort toggle and direction management

#### TC3.1: Sort Ascending

```
Setup:
- Navigate to Products page
- Verify "Price" column header is clickable

Test Steps:
1. Click "Price" column header
2. Observe table re-render

Expected Results:
✓ Table sorted by price ascending (lowest to highest)
✓ Price column header shows ↑ indicator or highlight
✓ URL contains: sort={"field":"unitPrice","order":"asc"}
✓ First row has lowest price
✓ Last row has highest price

Pass/Fail: ___
```

#### TC3.2: Sort Descending (Toggle)

```
Setup:
- Table sorted ascending by Price
- Price column shows ↑ indicator

Test Steps:
1. Click "Price" column header again
2. Observe table re-render

Expected Results:
✓ Table sorted by price descending (highest to lowest)
✓ Price column header now shows ↓ indicator
✓ URL updated: sort={"field":"unitPrice","order":"desc"}
✓ First row has highest price
✓ Last row has lowest price

Pass/Fail: ___
```

#### TC3.3: Clear Sort (Third Click)

```
Setup:
- Table sorted by Price (asc or desc)
- Sort indicator visible

Test Steps:
1. Click "Price" column header again
2. Observe table

Expected Results:
✓ Sort removed/cleared
✓ Table returns to original order (or by ID)
✓ Sort indicator disappears
✓ URL no longer contains sort parameter
✓ All rows visible unsorted (or default order)

Pass/Fail: ___
```

#### TC3.4: Change Sort Column

```
Setup:
- Table sorted by Price ascending
- Price column shows indicator

Test Steps:
1. Click "Name" column header
2. Observe table

Expected Results:
✓ Table now sorted by Name ascending
✓ Price column indicator removed
✓ Name column shows ↑ indicator
✓ URL updated: sort={"field":"name","order":"asc"}
✓ Rows sorted alphabetically by product name

Pass/Fail: ___
```

#### TC3.5: Multi-Column Sort (Simulated)

```
Setup:
- Table with sortable columns (Name, Price, Category)

Test Steps:
1. Sort by Name ascending
2. Observe sort indicator
3. Click Price column
4. Observe sort changes

Expected Results:
✓ Previous sort cleared
✓ New sort applied
✓ Only one column sorted at a time
✓ Sort direction properly indicated
✓ URL reflects latest sort only

Pass/Fail: ___
```

### Scenario 4: Saved Filters

**Objective:** Verify save, load, update, and delete operations

#### TC4.1: Save Current Filter

```
Setup:
- Navigate to Products page
- Apply filters and/or search

Test Steps:
1. Click "Save Filter" button
2. Dialog appears with name input
3. Enter name: "Expensive Electronics"
4. Click "Save"
5. Dialog closes

Expected Results:
✓ Dialog appears with text input
✓ Input field focused
✓ "Save" button enabled when name provided
✓ Dialog closes on save
✓ New preset appears in "Saved Filters" list
✓ localStorage updated (check DevTools)

Pass/Fail: ___
```

#### TC4.2: Load Saved Filter

```
Setup:
- Have saved filter "Expensive Electronics" with filters applied
- Navigate away from Products
- Come back to Products
- Apply different filters

Test Steps:
1. In SavedFilters component, find "Expensive Electronics"
2. Click to load it
3. Observe filters and results

Expected Results:
✓ Previous filters/search cleared
✓ "Expensive Electronics" filters loaded
✓ Results match saved filter criteria
✓ URL updated to reflect loaded filters
✓ Active preset highlighted/marked
✓ "Expensive Electronics" marked as active

Pass/Fail: ___
```

#### TC4.3: Delete Saved Filter

```
Setup:
- Have saved filter in list
- Know another saved filter also exists

Test Steps:
1. Find saved filter to delete
2. Click "Delete" button next to it
3. Confirm deletion in dialog
4. Observe filter removed

Expected Results:
✓ Confirmation dialog appears
✓ Filter removed from list after confirmation
✓ Other presets remain
✓ localStorage updated
✓ Active preset cleared if deleted filter was active

Pass/Fail: ___
```

#### TC4.4: Persistent Saved Filters

```
Setup:
- Have 2+ saved filters
- Have active filter

Test Steps:
1. Note saved filters list
2. Refresh page (F5)
3. Wait for page load
4. Check SavedFilters component

Expected Results:
✓ All saved filters still present
✓ Active filter still marked as active
✓ localStorage contains saved filters
✓ Filters survived page refresh
✓ Can load any saved filter

Pass/Fail: ___
```

### Scenario 5: URL State Persistence

**Objective:** Verify browser back/forward and direct URL entry

#### TC5.1: URL Updates on Filter Change

```
Setup:
- Navigate to Products page (/products)
- Current URL: http://localhost:5173/products
- Address bar visible

Test Steps:
1. Apply search: "laptop"
2. Observe address bar

Expected Results:
✓ URL changes to include search parameter
✓ Example: /products?search=laptop
✓ URL is human-readable encoded
✓ URL updates within 1 second

Pass/Fail: ___
```

#### TC5.2: URL with Multiple Parameters

```
Setup:
- Navigate to Products page
- Apply search: "pro"
- Apply filter: price >= 500
- Apply sort: name ascending

Test Steps:
1. Observe full URL in address bar
2. Count parameters

Expected Results:
✓ URL contains all parameters: search, filters, sort, page
✓ Example: /products?search=pro&filters=[...]&sort=[...]&page=1
✓ All parameters present
✓ URL reflects exact state

Pass/Fail: ___
```

#### TC5.3: Direct URL Entry

```
Setup:
- Navigate to base Products page (/products)
- Note a complex filter state

Test Steps:
1. Copy current complex URL from address bar
2. Open new tab
3. Paste URL into address bar
4. Press Enter

Expected Results:
✓ Page loads with correct filters applied
✓ Same products displayed as original page
✓ Search query loaded
✓ Filters applied
✓ Sort active
✓ Page number correct

Pass/Fail: ___
```

#### TC5.4: Browser Back Button

```
Setup:
- Navigate to Products page
- Apply filter 1: category = Electronics
- Apply filter 2: price >= 200
- Note URL: /products?filters=[...]&search=&page=1
- Change search: "laptop"
- Note new URL

Test Steps:
1. Click browser Back button
2. Observe page

Expected Results:
✓ URL changes back to previous
✓ Filters reload (category=Electronics, price>=200)
✓ Search clears
✓ Results match previous state exactly
✓ Product list matches what was shown before search change

Pass/Fail: ___
```

#### TC5.5: Browser Forward Button

```
Setup:
- Have performed back button navigation
- Previous state active (see TC5.4)

Test Steps:
1. Click browser Forward button
2. Observe page

Expected Results:
✓ URL changes to forward state
✓ Search "laptop" reloads
✓ Results match forward state
✓ Filters from previous navigation gone
✓ History navigation works correctly

Pass/Fail: ___
```

#### TC5.6: Refresh Preserves State

```
Setup:
- Apply complex filter state on Products
- Search: "laptop"
- Filters: category=Electronics, price>=500
- Sort: price descending

Test Steps:
1. Press F5 to refresh page
2. Wait for page load
3. Check state

Expected Results:
✓ All filters still applied
✓ Search still active
✓ Sort still active
✓ Results match pre-refresh state
✓ URL unchanged
✓ All state persisted through refresh

Pass/Fail: ___
```

### Scenario 6: Search and Filter Combination

**Objective:** Verify correct application order and AND logic

#### TC6.1: Search AND Filters

```
Setup:
- Navigate to Products page
- Products have varied categories and prices

Test Steps:
1. Apply filter: category = Electronics
2. Apply search: "laptop"
3. Observe results

Expected Results:
✓ Only Electronics items appear
✓ Of those, only items with "laptop" in name/SKU shown
✓ Results are strict AND of both conditions
✓ Non-Electronics filtered (even if match search)
✓ Electronics without "laptop" filtered
✓ Count reduced as expected

Pass/Fail: ___
```

#### TC6.2: Multiple Filters AND Search

```
Setup:
- Have 3 different filter conditions
- Plan a search

Test Steps:
1. Apply filter 1: category = Electronics
2. Apply filter 2: price >= 300
3. Apply filter 3: lowStockThreshold <= 50
4. Apply search: "pro"
5. Observe results

Expected Results:
✓ ALL conditions must match (strict AND)
✓ Results subset of each individual condition
✓ Very specific/narrow results
✓ URL contains all parameters
✓ Each change updates results immediately

Pass/Fail: ___
```

#### TC6.3: Empty Results Handling

```
Setup:
- Apply very specific filters
- Plan search that doesn't match

Test Steps:
1. Apply filter: category = Electronics
2. Apply filter: price >= 10000 (very high)
3. Apply search: "nonexistent"
4. Observe result

Expected Results:
✓ No products displayed (empty result set)
✓ Helpful empty state message appears
✓ No JavaScript errors in console
✓ Filters and search still active/shown
✓ User can clear filters to see results

Pass/Fail: ___
```

### Scenario 7: Error Handling

**Objective:** Verify graceful error handling

#### TC7.1: Invalid Filter Values

```
Setup:
- Navigate to Products page with FilterPanel open

Test Steps:
1. Try to set numeric filter with non-numeric value
   - Field: "Unit Price"
   - Value: "abc"
2. Click Apply

Expected Results:
✓ No crash/error
✓ Either: rejects invalid input with message
   OR: converts to 0 or shows warning
✓ App remains responsive
✓ Console has no JavaScript errors

Pass/Fail: ___
```

#### TC7.2: Malformed URL Parameters

```
Setup:
- Have working Products page

Test Steps:
1. Manually type invalid URL:
   /products?filters=invalid&search=test&sort=malformed
2. Press Enter

Expected Results:
✓ Page loads (no crash)
✓ Invalid parameters ignored gracefully
✓ Valid parameters applied
✓ No console errors
✓ Search "test" applies if valid
✓ Invalid filters/sort ignored

Pass/Fail: ___
```

#### TC7.3: localStorage Corruption

```
Setup:
- Have saved filters in localStorage

Test Steps:
1. Open DevTools
2. Go to Application → localStorage
3. Find "retailr-saved-filters"
4. Edit value to: {invalid json}
5. Close DevTools
6. Refresh page

Expected Results:
✓ Page loads without crashing
✓ SavedFilters shows empty or handles gracefully
✓ Error logged to console (not blocking)
✓ localStorage cleared/reset
✓ User can continue using filters
✓ Old corrupted data doesn't prevent functionality

Pass/Fail: ___
```

#### TC7.4: Missing API Data

```
Setup:
- Ensure backend is running
- Have Products page open

Test Steps:
1. Stop backend services
2. Click to apply a filter or search
3. Observe behavior

Expected Results:
✓ No JavaScript errors
✓ Filters/search still apply to empty dataset
✓ Empty results shown
✓ User notified of connection issue (if applicable)
✓ Can recover by restarting backend

Pass/Fail: ___
```

## Test Procedures

### Product List Page Testing

**Test Domain:** Products

**Data Requirements:**
- 5+ products with different categories
- Price range: $10 - $5000
- Mix of stock levels

**Complete Test Procedure:**

1. **Load Products Page**
   - Navigate to `/products`
   - Wait for data to load
   - Verify 5+ items in table
   - **Pass/Fail:** ___

2. **Test Search**
   - Search for "laptop"
   - Verify results filtered
   - **Pass/Fail:** ___

3. **Test Category Filter**
   - Apply filter: category = Electronics
   - Verify only Electronics shown
   - **Pass/Fail:** ___

4. **Test Price Range Filter**
   - Apply filter: price >= 500
   - Verify only products >= $500 shown
   - **Pass/Fail:** ___

5. **Test Combined**
   - Keep price filter
   - Add search: "pro"
   - Verify results match both conditions
   - **Pass/Fail:** ___

6. **Test Sort**
   - Sort by Price ascending
   - Verify low to high order
   - Sort descending
   - Verify high to low order
   - **Pass/Fail:** ___

7. **Test Save Filter**
   - Current state: category=Electronics, price>=500
   - Save as "High-Value Electronics"
   - Verify in SavedFilters list
   - **Pass/Fail:** ___

8. **Test URL Persistence**
   - Copy current URL
   - Paste in new tab
   - Verify state matches
   - **Pass/Fail:** ___

### Order List Page Testing

**Test Domain:** Orders

**Data Requirements:**
- 5+ orders with different statuses
- Status mix: PENDING, CONFIRMED, FULFILLED, CANCELLED
- Amount range: $50 - $5000

**Complete Test Procedure:**

1. **Load Orders Page**
   - Navigate to `/orders`
   - Wait for data load
   - Verify 5+ items
   - **Pass/Fail:** ___

2. **Test Status Filter**
   - Apply filter: status = CONFIRMED
   - Verify only CONFIRMED orders shown
   - **Pass/Fail:** ___

3. **Test Amount Range Filter**
   - Apply filter: totalAmount >= 1000
   - Verify only orders >= $1000 shown
   - **Pass/Fail:** ___

4. **Test Search**
   - Search for "ORD-" prefix (order numbers)
   - Verify order numbers filtered
   - **Pass/Fail:** ___

5. **Test Combined**
   - Status = PENDING AND Amount >= 500
   - Apply search: specific order number
   - Verify strict AND logic
   - **Pass/Fail:** ___

6. **Test Sort by Amount**
   - Sort by Total Amount ascending
   - Verify low to high
   - Toggle to descending
   - Verify high to low
   - **Pass/Fail:** ___

7. **Test Saved Filter**
   - Save: "High-Value Pending Orders"
   - Load preset
   - Verify state matches
   - **Pass/Fail:** ___

8. **Test Browser Back/Forward**
   - Change filters multiple times
   - Use back button
   - Verify each state
   - Use forward button
   - Verify navigation works
   - **Pass/Fail:** ___

### Stock List Page Testing

**Test Domain:** Stock

**Data Requirements:**
- 5+ stock items
- Quantity range: 0 - 500
- Various warehouse locations

**Complete Test Procedure:**

1. **Load Stock Page**
   - Navigate to `/stock`
   - Wait for data load
   - Verify items displayed
   - **Pass/Fail:** ___

2. **Test Quantity Filter**
   - Apply filter: quantity < 50 (low stock)
   - Verify only low-stock items shown
   - **Pass/Fail:** ___

3. **Test Available Quantity Range**
   - Apply filter: availableQuantity >= 100
   - Verify only well-stocked items shown
   - **Pass/Fail:** ___

4. **Test SKU Search**
   - Search for partial SKU
   - Verify matching items shown
   - **Pass/Fail:** ___

5. **Test Combined Filters**
   - Quantity < 50 AND availableQuantity >= 10
   - Verify subset matches both
   - **Pass/Fail:** ___

6. **Test Sort by Quantity**
   - Sort ascending (lowest quantity first)
   - Verify order correct
   - Toggle descending
   - Verify order correct
   - **Pass/Fail:** ___

7. **Test Alert Threshold**
   - Save filter: "Alert Low Stock"
   - Delete and reload
   - Verify persistence
   - **Pass/Fail:** ___

8. **Test URL Refresh**
   - Apply complex filters
   - Refresh page
   - Verify state maintained
   - **Pass/Fail:** ___

## Cross-Browser Testing

Test the search/filter/sort system across different browsers to ensure compatibility.

### Browser Test Matrix

| Browser | Version | Search | Filter | Sort | URL | Saved | Status |
|---------|---------|--------|--------|------|-----|-------|--------|
| Chrome | Latest | ✓ | ✓ | ✓ | ✓ | ✓ | ___ |
| Firefox | Latest | ✓ | ✓ | ✓ | ✓ | ✓ | ___ |
| Safari | Latest | ✓ | ✓ | ✓ | ✓ | ✓ | ___ |
| Edge | Latest | ✓ | ✓ | ✓ | ✓ | ✓ | ___ |

### Chrome Testing Procedure

```
1. Open Chrome (latest version)
2. Navigate to http://localhost:5173/products
3. Wait for page load
4. Perform all test scenarios:
   ✓ Search "laptop" - verify results
   ✓ Apply filter - verify applied
   ✓ Sort column - verify sorted
   ✓ Save filter - verify saved
   ✓ Copy URL - verify parameters
   ✓ Refresh page - verify state preserved
5. Check DevTools Console:
   ✓ No JavaScript errors
   ✓ No warnings
6. Result: PASS / FAIL

Notes: ____________________
```

### Firefox Testing Procedure

```
1. Open Firefox (latest version)
2. Navigate to http://localhost:5173/products
3. Repeat Chrome steps above
4. Check Developer Tools Console
5. Verify localStorage in Storage tab:
   ✓ retailr-saved-filters exists
   ✓ Data is valid JSON
6. Result: PASS / FAIL

Notes: ____________________
```

### Safari Testing Procedure

```
1. Open Safari (latest version)
2. Navigate to http://localhost:5173/products
3. Repeat Chrome steps above
4. Check Safari Developer Tools (Develop menu)
5. Test localStorage with Storage tab
6. Test URL parameters
7. Result: PASS / FAIL

Notes: ____________________
```

### Edge Testing Procedure

```
1. Open Edge (latest version)
2. Navigate to http://localhost:5173/products
3. Repeat Chrome steps above
4. Verify compatibility with Edge-specific features
5. Check DevTools console for errors
6. Result: PASS / FAIL

Notes: ____________________
```

### Mobile Browser Testing

Test on mobile browsers (if applicable):

#### iOS Safari

```
Test on iPhone/iPad:
1. Navigate to http://localhost:5173/products
2. Test touch interactions:
   ✓ Search input responsive to typing
   ✓ Filter panel opens/closes
   ✓ Sort columns clickable
   ✓ Saved filters accessible
3. Test URL on mobile:
   ✓ URL persistence works
   ✓ Back button navigates correctly
4. Result: PASS / FAIL

Notes: ____________________
```

#### Chrome Mobile

```
Test on Android device:
1. Navigate to http://localhost:5173/products
2. Repeat iOS Safari tests
3. Test with various screen sizes
4. Result: PASS / FAIL

Notes: ____________________
```

## Performance Testing

Verify system performance with realistic data volumes.

### Load Time Testing

**Test 1: Initial Page Load (10 items)**

```
Setup:
- 10 products in database
- Fresh page load (no cache)

Steps:
1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Measure metrics:
   - DOMContentLoaded: _____ ms
   - Page Load Complete: _____ ms
   - XHR requests: _____ ms
4. Check Performance tab for bottlenecks

Expected: < 2 seconds total
Acceptable: < 3 seconds
Result: PASS / FAIL
```

**Test 2: Initial Page Load (1000 items)**

```
Setup:
- 1000+ products in database
- Fresh page load

Steps:
1. Similar to Test 1
2. Measure metrics
3. Note if virtualization needed

Expected: < 2 seconds
Acceptable: < 4 seconds
Result: PASS / FAIL
```

### Search Responsiveness Testing

**Test: Debounce Verification**

```
Setup:
- Products page loaded
- DevTools Network tab open
- Redux DevTools installed

Steps:
1. Click search input
2. Type: "l" (1 character)
3. Wait 100ms, type: "a"
4. Wait 100ms, type: "p"
5. Wait 600ms
6. Observe:
   - Network: setSearch dispatches only ONCE
   - Redux DevTools: only 1 action after debounce
   - No excessive API calls

Expected: Single debounced update
Result: PASS / FAIL
```

### Filter Application Performance

**Test: Large Dataset Filtering**

```
Setup:
- 1000 products loaded
- FilterPanel open

Steps:
1. Apply filter: price >= 500
2. Measure result:
   - Time to filter: _____ ms
   - Results count: _____
3. Open Redux DevTools
4. Verify: setFilters action batched

Expected: < 100ms
Result: PASS / FAIL
```

### Sort Performance Testing

**Test: Large Dataset Sorting**

```
Setup:
- 1000 products displayed
- Results currently filtered

Steps:
1. Click "Price" column header
2. Measure:
   - Time to sort: _____ ms
   - Visual feedback immediate
3. Toggle sort direction
4. Measure again

Expected: < 100ms
Result: PASS / FAIL
```

### Combined Operations Performance

**Test: Complex Filter + Search + Sort**

```
Setup:
- 1000 products
- All features active

Steps:
1. Apply filter: category = Electronics
2. Apply filter: price >= 500
3. Apply search: "laptop"
4. Apply sort: name ascending
5. Measure total time
6. Measure UI responsiveness

Expected: All operations < 500ms total
Result: PASS / FAIL
```

### Memory Usage Testing

**Test: Long Session Memory**

```
Setup:
- Products page loaded
- DevTools Performance tab open

Steps:
1. Take memory snapshot (Shift+Ctrl+M)
2. Perform 20 filter/search changes
3. Take second memory snapshot
4. Compare memory increase

Expected: < 10MB increase
Acceptable: < 20MB increase
Result: PASS / FAIL
```

## Build Verification

Verify production build works correctly.

### Build Test Procedure

```
1. Build production bundle:
   npm run build
   
2. Verify build output:
   ✓ No TypeScript errors
   ✓ dist/ folder contains files
   ✓ Bundle size reasonable
   ✓ Source maps generated (optional)

3. Preview production build:
   npm run preview
   
4. Test in production preview:
   ✓ Navigate to http://localhost:4173
   ✓ All pages load
   ✓ Search works
   ✓ Filters work
   ✓ Sort works
   ✓ URL persistence works
   ✓ Saved filters work
   ✓ No console errors

5. Build result: PASS / FAIL
```

### TypeScript Verification

```
Run type checker:
npm run typecheck

Expected: Zero errors
Result: PASS / FAIL

Any errors found:
_______________________________
```

### Lint Verification

```
Run linter:
npm run lint

Expected: Zero critical errors
Result: PASS / FAIL

Any errors found:
_______________________________
```

## Test Results Checklist

### Functionality Checklist

- [ ] **Search**
  - [ ] Single word search works
  - [ ] Multi-word tokenization works
  - [ ] Case insensitive
  - [ ] Clear search works
  - [ ] Search debouncing works

- [ ] **Filtering**
  - [ ] Single filter works
  - [ ] Multiple filters apply (AND)
  - [ ] Text operators (contains, equals)
  - [ ] Range operators (gte, lte)
  - [ ] Select operators (equals, in)
  - [ ] Filter removal works
  - [ ] Clear all filters works

- [ ] **Sorting**
  - [ ] Sort ascending works
  - [ ] Sort descending works
  - [ ] Sort toggle works
  - [ ] Change sort column works
  - [ ] Sort indicator visible

- [ ] **Saved Filters**
  - [ ] Save filter works
  - [ ] Load filter works
  - [ ] Delete filter works
  - [ ] Filters persist on refresh
  - [ ] Multiple presets work

- [ ] **URL State**
  - [ ] URL updates on change
  - [ ] Direct URL entry loads state
  - [ ] Browser back button works
  - [ ] Browser forward button works
  - [ ] Page refresh preserves state

- [ ] **Error Handling**
  - [ ] Invalid filters handled
  - [ ] Malformed URLs handled
  - [ ] Corrupted localStorage handled
  - [ ] Missing API data handled
  - [ ] No JavaScript errors

### Performance Checklist

- [ ] **Load Time**
  - [ ] Initial load < 2 seconds (10 items)
  - [ ] Initial load < 4 seconds (1000 items)
  - [ ] Search debounces correctly
  - [ ] No excessive API calls

- [ ] **Responsiveness**
  - [ ] Filter application < 100ms
  - [ ] Sort operation < 100ms
  - [ ] UI remains responsive
  - [ ] No janky animations

- [ ] **Memory**
  - [ ] No memory leaks detected
  - [ ] Long sessions don't degrade
  - [ ] localStorage works correctly

### Browser Compatibility Checklist

- [ ] **Chrome**
  - [ ] All features work
  - [ ] No console errors
  - [ ] localStorage functional

- [ ] **Firefox**
  - [ ] All features work
  - [ ] No console errors
  - [ ] localStorage functional

- [ ] **Safari**
  - [ ] All features work
  - [ ] No console errors
  - [ ] localStorage functional

- [ ] **Edge**
  - [ ] All features work
  - [ ] No console errors
  - [ ] localStorage functional

### Build Verification Checklist

- [ ] **TypeScript**
  - [ ] npm run typecheck succeeds
  - [ ] Zero type errors
  - [ ] Strict mode compliance

- [ ] **Lint**
  - [ ] npm run lint succeeds
  - [ ] Zero critical errors
  - [ ] Code style compliant

- [ ] **Build**
  - [ ] npm run build succeeds
  - [ ] No build errors
  - [ ] dist/ folder generated

- [ ] **Production**
  - [ ] npm run preview loads
  - [ ] All features work in preview
  - [ ] No console errors
  - [ ] Performance acceptable

### Overall Test Summary

**Total Tests Executed:** _____
**Passed:** _____
**Failed:** _____
**Skipped:** _____

**Critical Issues:** _______________
**Minor Issues:** __________________
**Blockers:** ______________________

**Overall Result:** PASS / FAIL

**Tested By:** _____________________
**Date:** __________________________
**Duration:** ______________________

---

**Notes & Observations:**

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________

---

**Sign-Off:**

- Developer: _______________________ Date: __________
- QA Lead: ________________________ Date: __________
- Product Owner: ____________________ Date: __________

---

**Last Updated:** June 2026
**Version:** 1.0.0
**Maintained By:** QA Team
