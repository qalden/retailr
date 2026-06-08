# Search, Filter & Sort Integration Guide

Comprehensive documentation for the Retailr platform's advanced search, filtering, and sorting system. This guide covers architecture, implementation, usage patterns, and best practices.

**Table of Contents**
- [Overview](#overview)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Utilities](#utilities)
- [Redux State Management](#redux-state-management)
- [Custom Hooks](#custom-hooks)
- [Components](#components)
- [Integration Guide](#integration-guide)
- [Configuration](#configuration)
- [Examples](#examples)
- [Performance Considerations](#performance-considerations)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The Retailr platform provides a complete search, filter, and sort system with:

- **Search:** Tokenized, multi-field search with AND logic for tokens and OR logic for fields
- **Filtering:** Flexible multi-condition filtering with various operators (equals, contains, range, etc.)
- **Sorting:** Column-based sorting with ascending/descending toggle
- **URL State Persistence:** All filter state serialized to URL for browser back/forward support
- **Saved Filters:** Save filter presets to localStorage with quick load functionality
- **Redux Integration:** Global state management for seamless data flow
- **Custom Hooks:** React hooks for easy integration into any component

### Key Features

1. **Pure Utility Functions** - Zero external dependencies, testable pure functions
2. **Redux-Backed State** - Global state management with Redux Toolkit
3. **Custom React Hooks** - Easy-to-use hooks for filter, search, and sort logic
4. **URL Synchronization** - Persistent URLs with back/forward browser support
5. **Component Library** - Pre-built FilterPanel, SavedFilters, and DataTable components
6. **Type Safe** - Full TypeScript support with zero implicit any

## Architecture

### High-Level Data Flow

```
User Input (Search, Filter, Sort)
    ↓
Custom Hooks (useSearch, useFilter, useSort)
    ↓
Redux Slices (filterSlice, savedFiltersSlice)
    ↓
Utility Functions (applyFilters, matchesSearch, sortData)
    ↓
Filtered/Sorted Results
    ↓
Rendered via DataTable or custom list component
```

### Component Structure

```
ProductListPage / OrderListPage / StockListPage
├── SearchInput
│   └── useSearch hook
├── FilterPanel
│   └── useFilter hook
├── SavedFilters
│   └── useFilter hook
├── SortableHeader (in DataTable)
│   └── useSort hook
└── DataTable
    └── Displays filtered/sorted results
```

### State Flow

```
                Filter UI Components
                (SearchInput, FilterPanel, SavedFilters)
                        ↑ ↓
                  Redux Slices
                (filterSlice, savedFiltersSlice)
                        ↑ ↓
              Browser URL Parameters
              ← Serialized by useURLState →
```

## Core Concepts

### Tokens and Tokenization

Search works by breaking input into tokens. This enables multi-word searches:

```
Input:  "laptop pro"
Tokens: ["laptop", "pro"]

Match Logic: ALL tokens must be found (AND logic)
Field Logic: Token can match ANY field (OR logic)

So "laptop pro" matches:
- "MacBook Pro Laptop"     ✓ (both tokens found in different fields)
- "Pro Gaming Laptop"      ✓ (both tokens found)
- "Laptop Only"            ✗ (missing "pro")
- "Samsung Galaxy"         ✗ (missing both)
```

### Filter Operators

Filters use operators to match conditions:

```typescript
type FilterOperator = 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';

// Examples:
{ field: 'name', operator: 'contains', value: 'laptop' }      // Text contains
{ field: 'price', operator: 'gte', value: 100 }              // Price >= 100
{ field: 'status', operator: 'equals', value: 'PENDING' }    // Exact match
{ field: 'category', operator: 'in', value: ['A', 'B'] }     // In array
```

### AND Logic for Multiple Filters

All filters must match (AND logic):

```
Filters: [
  { field: 'price', operator: 'gte', value: 100 },
  { field: 'category', operator: 'equals', value: 'Electronics' }
]

Match Logic: price >= 100 AND category = Electronics
Result: Only items matching BOTH conditions
```

### Sort Toggle Behavior

Sorting intelligently toggles between directions:

```
Initial:        No sort
Click 'price':  Sort ascending
Click 'price':  Sort descending
Click 'price':  Back to no sort
Click 'name':   Sort 'name' ascending (new field)
```

## Utilities

All utilities are pure functions with zero external dependencies. Located in `src/utils/`.

### filterUtils.ts

Provides filtering logic with multiple operators.

#### Type Definitions

```typescript
type FilterOperator = 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';

interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}
```

#### Functions

**matchesFilter(obj: any, filter: Filter): boolean**

Check if a single object matches a filter condition.

```typescript
import { matchesFilter } from '@/utils/filterUtils';

const product = { name: 'Laptop', price: 1200 };

// Contains operator
matchesFilter(product, { field: 'name', operator: 'contains', value: 'apt' });
// → true

// GTE operator
matchesFilter(product, { field: 'price', operator: 'gte', value: 1000 });
// → true

// Exact match
matchesFilter(product, { field: 'price', operator: 'equals', value: 1200 });
// → true
```

**applyFilters<T>(items: T[], filters: Filter[]): T[]**

Apply multiple filters to an array using AND logic.

```typescript
import { applyFilters } from '@/utils/filterUtils';

const products = [
  { name: 'Laptop', price: 1200, category: 'Electronics' },
  { name: 'Mouse', price: 25, category: 'Accessories' },
  { name: 'Monitor', price: 350, category: 'Electronics' },
];

const filters = [
  { field: 'category', operator: 'equals', value: 'Electronics' },
  { field: 'price', operator: 'gte', value: 100 },
];

const results = applyFilters(products, filters);
// → [Laptop, Monitor] (both match category AND price)
```

### searchUtils.ts

Provides tokenized search across multiple fields.

#### Functions

**tokenizeSearch(searchString: string): string[]**

Convert search string into lowercase tokens.

```typescript
import { tokenizeSearch } from '@/utils/searchUtils';

tokenizeSearch('Laptop Pro');
// → ['laptop', 'pro']

tokenizeSearch('  multiple   spaces  ');
// → ['multiple', 'spaces']

tokenizeSearch('');
// → []
```

**matchesSearch(obj: any, tokens: string[], searchFields: string[]): boolean**

Check if object matches all search tokens in any of the specified fields.

```typescript
import { matchesSearch } from '@/utils/searchUtils';

const product = { sku: 'PROD-123', name: 'MacBook Pro', category: 'Laptops' };

// Search for both 'macbook' AND 'pro'
matchesSearch(product, ['macbook', 'pro'], ['sku', 'name', 'category']);
// → true (both tokens found)

matchesSearch(product, ['samsung'], ['sku', 'name', 'category']);
// → false (token not found in any field)

// Single token search
matchesSearch(product, ['pro'], ['name']);
// → true
```

### queryParams.ts

Serialize and deserialize filter state to/from URL query strings.

#### Type Definitions

```typescript
interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

interface QueryParams {
  search: string;
  filters: Filter[];
  page: number;
  size: number;
  sort?: SortOption;
}
```

#### Functions

**serializeParams(params: QueryParams): string**

Convert filter state to URL query string.

```typescript
import { serializeParams } from '@/utils/queryParams';

const params = {
  search: 'laptop pro',
  filters: [
    { field: 'price', operator: 'gte', value: 500 },
  ],
  page: 1,
  size: 20,
  sort: { field: 'name', order: 'asc' },
};

const queryString = serializeParams(params);
// → "search=laptop+pro&filters=%5B%7B%22field%22%3A%22price%22...&page=1&size=20&sort=..."
```

**deserializeParams(queryString: string): QueryParams**

Convert URL query string to filter state.

```typescript
import { deserializeParams } from '@/utils/queryParams';

const queryString = "search=laptop&filters=%5B%7B%22field%22%3A%22price%22%2C%22operator%22%3A%22gte%22%2C%22value%22%3A500%7D%5D&page=1&size=20";

const params = deserializeParams(queryString);
// → {
//     search: 'laptop',
//     filters: [{ field: 'price', operator: 'gte', value: 500 }],
//     page: 1,
//     size: 20,
//     sort: undefined
//   }
```

### filterConfig.ts

Domain-specific filter definitions for Products, Orders, and Stock.

#### Type Definitions

```typescript
interface FilterDefinition {
  field: string;           // The object property to filter
  label: string;           // UI display label
  type: 'text' | 'number' | 'select' | 'date' | 'range';
  operators: string[];     // Allowed operators for this field
  options?: Array<{ label: string; value: unknown }>; // For select/in operators
}
```

#### Pre-Defined Filters

**Product Filters (PRODUCT_FILTERS)**

```typescript
[
  { field: 'sku', label: 'SKU', type: 'text', operators: ['equals', 'contains'] },
  { field: 'name', label: 'Product Name', type: 'text', operators: ['equals', 'contains'] },
  { field: 'categoryName', label: 'Category', type: 'select', operators: ['equals', 'in'],
    options: [
      { label: 'Electronics', value: 'Electronics' },
      { label: 'Accessories', value: 'Accessories' },
    ]
  },
  { field: 'unitPrice', label: 'Unit Price', type: 'range', operators: ['gte', 'lte', 'gt', 'lt'] },
  { field: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number', operators: ['gte', 'lte', 'gt', 'lt'] },
]
```

**Order Filters (ORDER_FILTERS)**

```typescript
[
  { field: 'orderNumber', label: 'Order Number', type: 'text', operators: ['equals', 'contains'] },
  { field: 'status', label: 'Status', type: 'select', operators: ['equals', 'in'],
    options: [
      { label: 'PENDING', value: 'PENDING' },
      { label: 'CONFIRMED', value: 'CONFIRMED' },
      { label: 'FULFILLED', value: 'FULFILLED' },
    ]
  },
  { field: 'totalAmount', label: 'Total Amount', type: 'range', operators: ['gte', 'lte', 'gt', 'lt'] },
  { field: 'createdAt', label: 'Created Date', type: 'date', operators: ['gte', 'lte'] },
]
```

**Stock Filters (STOCK_FILTERS)**

```typescript
[
  { field: 'sku', label: 'SKU', type: 'text', operators: ['equals', 'contains'] },
  { field: 'quantity', label: 'Quantity', type: 'number', operators: ['equals', 'gte', 'lte', 'gt', 'lt'] },
  { field: 'availableQuantity', label: 'Available Quantity', type: 'number', operators: ['gte', 'lte', 'gt', 'lt'] },
  { field: 'reservedQuantity', label: 'Reserved Quantity', type: 'number', operators: ['gte', 'lte', 'gt', 'lt'] },
]
```

#### Helper Functions

**getFiltersByDomain(domain: 'product' | 'order' | 'stock'): FilterDefinition[]**

Get all filter definitions for a domain.

```typescript
import { getFiltersByDomain } from '@/utils/filterConfig';

const productFilters = getFiltersByDomain('product');
```

**isValidField(domain: string, field: string): boolean**

Check if a field is valid for a domain.

```typescript
import { isValidField } from '@/utils/filterConfig';

isValidField('product', 'sku');      // true
isValidField('product', 'invalidField'); // false
```

**getFilterDefinition(domain: string, field: string): FilterDefinition | undefined**

Get specific filter definition.

```typescript
import { getFilterDefinition } from '@/utils/filterConfig';

const def = getFilterDefinition('product', 'unitPrice');
// → { field: 'unitPrice', label: 'Unit Price', type: 'range', ... }
```

## Redux State Management

Redux Toolkit slices manage global filter state.

### filterSlice

Manages search, filters, sort, and pagination.

#### State Type

```typescript
interface FilterSliceState {
  search: string;
  filters: Filter[];
  sort: Sort | null;
  page: number;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}
```

#### Actions

```typescript
// Set search query
dispatch(setSearch('laptop pro'));

// Set active filters
dispatch(setFilters([
  { field: 'price', operator: 'gte', value: 500 },
]));

// Set sort
dispatch(setSort({ field: 'name', direction: 'asc' }));
dispatch(setSort(null)); // Clear sort

// Set page
dispatch(setPage(2));

// Clear all filters
dispatch(clearFilters()); // Resets search, filters, sort, page to defaults

// Load from URL
dispatch(loadFromURL({
  search: 'laptop',
  filters: [...],
  sort: { field: 'price', direction: 'asc' },
  page: 1,
}));
```

#### Selectors

```typescript
import { useAppSelector } from '@/store';
import {
  selectSearch,
  selectFilters,
  selectSort,
  selectPage,
  selectFilterState, // Returns entire filter state as object
} from '@/store/slices/filterSlice';

// In a component:
const search = useAppSelector(selectSearch);
const filters = useAppSelector(selectFilters);
const sort = useAppSelector(selectSort);
const page = useAppSelector(selectPage);

// Get entire state at once
const filterState = useAppSelector(selectFilterState);
// → { search, filters, sort, page }
```

### savedFiltersSlice

Manages saved filter presets.

#### State Type

```typescript
export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Filter[];
  search?: string;
  createdAt: number;
}

interface SavedFiltersSliceState {
  presets: SavedFilter[];
  activePresetId: string | null;
}
```

#### Actions

```typescript
// Create new saved filter
dispatch(createSavedFilter({
  name: 'High-Value Electronics',
  description: 'Electronics with price > $500',
  filters: [
    { field: 'category', operator: 'equals', value: 'Electronics' },
    { field: 'price', operator: 'gte', value: 500 },
  ],
  search: 'laptop', // Optional
}));

// Update saved filter
dispatch(updateSavedFilter({
  id: 'filter-123',
  name: 'Updated Name',
  filters: [...],
}));

// Delete saved filter
dispatch(deleteSavedFilter('filter-123'));

// Set active preset
dispatch(setActivePreset('filter-123'));
dispatch(setActivePreset(null)); // Deactivate

// Load presets from localStorage (handled by SavedFilters component)
dispatch(loadPresetsFromStorage([...presets]));
```

#### Selectors

```typescript
import {
  selectSavedFilters,
  selectActivePresetId,
  selectActivePreset,
} from '@/store/slices/savedFiltersSlice';

// Get all presets
const presets = useAppSelector(selectSavedFilters);

// Get active preset ID
const activeId = useAppSelector(selectActivePresetId);

// Get active preset object
const activePreset = useAppSelector(selectActivePreset);
// → SavedFilter | undefined
```

## Custom Hooks

Custom React hooks provide easy access to filter state and operations.

### useSearch

Manages debounced search with automatic tokenization.

#### Return Type

```typescript
interface UseSearchReturn {
  search: string;           // Current search string
  tokens: string[];         // Computed tokens from search
  setSearchValue: (value: string) => void;  // Update search (debounced to Redux)
  clearSearch: () => void;  // Clear search immediately
}
```

#### Usage

```typescript
import { useSearch } from '@/hooks/useSearch';

function MyComponent() {
  const { search, tokens, setSearchValue, clearSearch } = useSearch();

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search..."
      />
      {tokens.length > 0 && <span>Searching for: {tokens.join(', ')}</span>}
      <button onClick={clearSearch}>Clear</button>
    </div>
  );
}
```

#### Debounce Behavior

- Local state updates immediately (for responsive UI)
- Tokens computed immediately
- Redux dispatch delayed by 500ms (debounce)
- Prevents excessive Redux updates

### useFilter

Manages filter conditions (AND logic).

#### Return Type

```typescript
interface UseFilterReturn {
  filters: Filter[];                      // Current filters
  addFilter: (filter: Filter) => void;    // Append a filter
  removeFilter: (index: number) => void;  // Remove filter by index
  setAllFilters: (filters: Filter[]) => void; // Replace all filters
  clearFilters: () => void;               // Remove all filters
}
```

#### Usage

```typescript
import { useFilter } from '@/hooks/useFilter';

function FilterComponent() {
  const { filters, addFilter, removeFilter, clearFilters } = useFilter();

  return (
    <div>
      <button onClick={() => addFilter({
        field: 'price',
        operator: 'gte',
        value: 100
      })}>
        Add Price Filter
      </button>

      {filters.map((filter, index) => (
        <div key={index}>
          {filter.field} {filter.operator} {filter.value}
          <button onClick={() => removeFilter(index)}>Remove</button>
        </div>
      ))}

      <button onClick={clearFilters}>Clear All</button>
    </div>
  );
}
```

### useSort

Manages sort state with toggle logic.

#### Return Type

```typescript
interface UseSortReturn {
  sort: Sort | null;              // Current sort or null
  setSortBy: (field: string) => void;  // Toggle sort on field
  clearSort: () => void;          // Clear sort
}
```

#### Usage

```typescript
import { useSort } from '@/hooks/useSort';

function SortableHeader() {
  const { sort, setSortBy, clearSort } = useSort();

  const isActive = (field: string) => sort?.field === field;
  const direction = sort?.direction;

  return (
    <div>
      <button
        onClick={() => setSortBy('price')}
        className={isActive('price') ? 'active' : ''}
      >
        Price {isActive('price') && (direction === 'asc' ? '↑' : '↓')}
      </button>

      <button
        onClick={() => setSortBy('name')}
        className={isActive('name') ? 'active' : ''}
      >
        Name {isActive('name') && (direction === 'asc' ? '↑' : '↓')}
      </button>

      {sort && <button onClick={clearSort}>Clear Sort</button>}
    </div>
  );
}
```

#### Toggle Logic

- First click: Sort ascending
- Second click (same field): Sort descending
- Third click (same field): Clear sort
- Different field: Sort ascending on new field

### useURLState

Synchronizes filter state to/from URL query parameters.

#### Usage

```typescript
import { useURLState } from '@/hooks/useURLState';

function MyPage() {
  // Call once per component (typically at top level)
  useURLState();

  const { filters, search } = useAppSelector(selectFilterState);

  // URL automatically syncs when filters/search change
  // URL is restored when page loads/navigates back
  // Supported in browsers (back/forward buttons)
}
```

#### Behavior

**Load from URL (on mount)**
- One-time operation on component mount
- Reads URL query parameters
- Populates Redux state if URL has parameters
- Supports browser back/forward navigation

**Sync to URL (on state change)**
- After mount, state changes trigger URL updates
- Uses replace mode (prevents history duplication)
- Debounced to prevent excessive updates
- Survives page refresh

#### URL Format

```
/products?search=laptop&filters=%5B%7B%22field%22%3A%22price%22%2C%22operator%22%3A%22gte%22%2C%22value%22%3A500%7D%5D&sort=%7B%22field%22%3A%22name%22%2C%22order%22%3A%22asc%22%7D&page=1
```

Decoded:
```
search=laptop
filters=[{"field":"price","operator":"gte","value":500}]
sort={"field":"name","order":"asc"}
page=1
```

## Components

Pre-built components for common filter UI patterns.

### FilterPanel

Modal panel for configuring filters with dynamic add/remove.

#### Props

```typescript
interface FilterPanelProps {
  filters: Filter[];
  filterDefinitions: FilterDefinition[];
  onApply: (filters: Filter[]) => void;
  onCancel: () => void;
}
```

#### Usage

```typescript
import FilterPanel from '@/components/shared/FilterPanel';
import { PRODUCT_FILTERS } from '@/utils/filterConfig';
import { useFilter } from '@/hooks/useFilter';

function ProductList() {
  const [showFilters, setShowFilters] = useState(false);
  const { filters, setAllFilters } = useFilter();

  return (
    <>
      <button onClick={() => setShowFilters(true)}>Configure Filters</button>

      {showFilters && (
        <FilterPanel
          filters={filters}
          filterDefinitions={PRODUCT_FILTERS}
          onApply={(newFilters) => {
            setAllFilters(newFilters);
            setShowFilters(false);
          }}
          onCancel={() => setShowFilters(false)}
        />
      )}
    </>
  );
}
```

#### Features

- Dynamic filter addition/removal
- Field and operator selection
- Type-aware value input (text, number, select, date range)
- Apply/Cancel buttons
- Validation

### SavedFilters

Component for managing saved filter presets with localStorage persistence.

#### Props

```typescript
interface SavedFiltersProps {
  onLoad?: (preset: SavedFilter) => void;  // Optional callback on preset load
}
```

#### Usage

```typescript
import SavedFilters from '@/components/shared/SavedFilters';

function ProductList() {
  return (
    <div>
      <SavedFilters onLoad={(preset) => {
        console.log(`Loaded preset: ${preset.name}`);
      }} />
      {/* Rest of component */}
    </div>
  );
}
```

#### Features

- Display list of saved filter presets
- Save current filters as new preset (dialog)
- Load preset filters into Redux
- Delete presets with confirmation
- Automatic localStorage persistence
- Active preset highlighting

### DataTable with SortableHeader

Enhanced data table with sortable columns.

#### Props

```typescript
interface ColumnDef<T> {
  header: string;
  accessor: keyof T;
  sortable?: boolean;  // Enable sorting for this column
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}
```

#### Usage

```typescript
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import { useSort } from '@/hooks/useSort';

function ProductList() {
  const { sort, setSortBy } = useSort();
  const products = useAppSelector(selectAllProducts);

  const columns: ColumnDef<Product>[] = [
    { header: 'SKU', accessor: 'sku', sortable: true },
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Price', accessor: 'unitPrice', sortable: true },
    { header: 'Actions', accessor: 'id' },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
```

#### SortableHeader Behavior

- Click to sort ascending
- Click again to sort descending
- Click again to clear sort
- Visual indicator (↑/↓) shows current sort direction

## Integration Guide

### Step 1: Ensure Redux Setup

Verify slices are added to store:

```typescript
// src/store/index.ts
import filterReducer from './slices/filterSlice';
import savedFiltersReducer from './slices/savedFiltersSlice';

const store = configureStore({
  reducer: {
    filters: filterReducer,
    savedFilters: savedFiltersReducer,
    // ... other slices
  },
});
```

### Step 2: Add Hooks to Page Component

```typescript
import { useSearch } from '@/hooks/useSearch';
import { useFilter } from '@/hooks/useFilter';
import { useSort } from '@/hooks/useSort';
import { useURLState } from '@/hooks/useURLState';

export function MyListPage() {
  const { search, tokens, setSearchValue } = useSearch();
  const { filters, setAllFilters } = useFilter();
  const { sort, setSortBy } = useSort();
  useURLState();  // Call once per page

  // ... component logic
}
```

### Step 3: Apply Filters and Search

```typescript
import { applyFilters } from '@/utils/filterUtils';
import { matchesSearch } from '@/utils/searchUtils';
import { sortData } from '@/utils/sortData';

export function MyListPage() {
  // ... hooks setup

  // Get data from Redux or API
  let displayData = allItems;

  // Apply in order: filters → search → sort
  displayData = applyFilters(displayData, filters);
  displayData = displayData.filter((item) =>
    matchesSearch(item, tokens, ['field1', 'field2'])
  );

  if (sort) {
    displayData = sortData(displayData, sort.field, sort.direction);
  }

  return (
    <div>
      {/* Render displayData */}
    </div>
  );
}
```

### Step 4: Add UI Components

```typescript
export function MyListPage() {
  // ... hooks setup

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div>
      <SearchInput
        value={search}
        onChange={setSearchValue}
      />

      <button onClick={() => setShowFilters(true)}>
        Filters
      </button>

      {showFilters && (
        <FilterPanel
          filters={filters}
          filterDefinitions={PRODUCT_FILTERS}
          onApply={(newFilters) => {
            setAllFilters(newFilters);
            setShowFilters(false);
          }}
          onCancel={() => setShowFilters(false)}
        />
      )}

      <SavedFilters />

      <DataTable
        columns={columns}
        data={displayData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

## Configuration

### Add Custom Domain Filters

```typescript
// src/utils/filterConfig.ts
export const CUSTOM_FILTERS: FilterDefinition[] = [
  {
    field: 'myField',
    label: 'My Field',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  // ... more definitions
];

export function getFiltersByDomain(domain) {
  switch (domain) {
    case 'custom':
      return CUSTOM_FILTERS;
    // ... existing cases
  }
}
```

### Customize Debounce Delay

Edit in `src/hooks/useSearch.ts`:

```typescript
const DEBOUNCE_DELAY = 500; // milliseconds
```

Lower values = more responsive but more Redux updates
Higher values = fewer updates but less responsive

### Customize Search Fields

In page components, modify the search fields array:

```typescript
// Search in multiple fields
displayData = displayData.filter((item) =>
  matchesSearch(item, tokens, ['sku', 'name', 'description'])
);
```

### Customize Storage Key

Edit in `src/components/shared/SavedFilters.tsx`:

```typescript
const STORAGE_KEY = 'retailr-saved-filters';
```

Change this to have separate storage per page or app instance.

## Examples

### Example 1: Search for Products by Name and SKU

```typescript
const { search, tokens, setSearchValue } = useSearch();

// User types: "laptop pro"
setSearchValue('laptop pro');

// Tokens: ['laptop', 'pro']
// Display all products where name OR sku contains BOTH 'laptop' AND 'pro'

const results = products.filter((p) =>
  matchesSearch(p, tokens, ['name', 'sku'])
);
```

### Example 2: Filter Products by Price Range

```typescript
const { filters, addFilter, setAllFilters } = useFilter();

// User adds filter: price >= 500 AND price <= 1500
const filters = [
  { field: 'unitPrice', operator: 'gte', value: 500 },
  { field: 'unitPrice', operator: 'lte', value: 1500 },
];

setAllFilters(filters);

const results = applyFilters(products, filters);
```

### Example 3: Complex Multi-Filter Search

```typescript
// Filter by category AND price range, then search by name
const categories = ['Electronics', 'Accessories'];
const filters = [
  { field: 'categoryName', operator: 'in', value: categories },
  { field: 'unitPrice', operator: 'gte', value: 100 },
];

const results = applyFilters(products, filters)
  .filter((p) => matchesSearch(p, tokens, ['name']))
  .sort((a, b) => a.unitPrice - b.unitPrice);
```

### Example 4: Save Filter Preset

```typescript
import { useAppDispatch } from '@/store';
import { createSavedFilter } from '@/store/slices/savedFiltersSlice';

const dispatch = useAppDispatch();

dispatch(createSavedFilter({
  name: 'Budget Electronics',
  description: 'Electronics under $200',
  filters: [
    { field: 'categoryName', operator: 'equals', value: 'Electronics' },
    { field: 'unitPrice', operator: 'lte', value: 200 },
  ],
  search: 'laptop',
}));
```

### Example 5: URL State with Browser Back/Forward

```typescript
function ProductListPage() {
  const { search, filters, sort } = useAppSelector(selectFilterState);
  useURLState();  // Handles URL sync automatically

  // URL updates automatically:
  // /products?search=laptop&filters=[...]&sort=...

  // Browser back/forward restores exact state
  // Page refresh preserves filters
}
```

### Example 6: Sort Products by Price, Descending

```typescript
const { sort, setSortBy } = useSort();

// User clicks 'Price' column header twice
setSortBy('unitPrice');  // First click: asc
setSortBy('unitPrice');  // Second click: desc

const results = sortData(products, 'unitPrice', 'desc');
```

### Example 7: Integration in OrderListPage

```typescript
export function OrderListPage() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAllOrders);

  const { search, tokens, setSearchValue } = useSearch();
  const { filters, setAllFilters } = useFilter();
  const { sort, setSortBy } = useSort();
  useURLState();

  // Display data with transformations
  let displayData = orders;
  displayData = applyFilters(displayData, filters);
  displayData = displayData.filter((item) =>
    matchesSearch(item, tokens, ['orderNumber', 'customerName'])
  );

  if (sort) {
    displayData = sortData(displayData, sort.field, sort.direction);
  }

  return (
    <div>
      <SearchInput value={search} onChange={setSearchValue} />
      <SavedFilters />
      <FilterPanel
        filters={filters}
        filterDefinitions={ORDER_FILTERS}
        onApply={setAllFilters}
        onCancel={() => {}}
      />
      <DataTable columns={columns} data={displayData} />
    </div>
  );
}
```

## Performance Considerations

### 1. Search Debouncing

Search uses 500ms debounce to prevent excessive Redux updates:

```typescript
// Local state updates immediately (responsive)
setSearchValue('laptop');  // → state updates instantly

// Redux update delayed (prevents overhead)
dispatch(setSearch('laptop'));  // → happens after 500ms
```

Adjust `DEBOUNCE_DELAY` in `useSearch.ts` if needed.

### 2. Filter Application Order

Apply transformations in optimized order:

```typescript
// ✓ Optimal order
let data = applyFilters(items, filters);      // Reduces dataset first
data = data.filter(/* search */);             // Search on smaller set
data = sortData(data, field, direction);      // Sort final results
```

### 3. Memoization

Use `useMemo` for expensive operations:

```typescript
const displayData = useMemo(() => {
  let data = applyFilters(items, filters);
  data = data.filter(/* search */);
  return data;
}, [items, filters, tokens]);
```

### 4. Large Datasets

For 10,000+ items consider:

1. **Pagination** - Display 20-50 items per page
2. **Virtual Scrolling** - Render only visible items
3. **Backend Filtering** - Push filters to API (see Task 31.8)
4. **Indexed Search** - Use full-text search engine

### 5. Redux Selector Optimization

Selectors are memoized with reselect:

```typescript
// Good - selector memoized automatically
const filters = useAppSelector(selectFilters);

// Better - use composed selector
const displayData = useAppSelector(selectFilterState);
```

## API Reference

### Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `matchesFilter` | filterUtils.ts | Check single filter match |
| `applyFilters` | filterUtils.ts | Apply multiple filters (AND) |
| `tokenizeSearch` | searchUtils.ts | Convert string to tokens |
| `matchesSearch` | searchUtils.ts | Check token match |
| `serializeParams` | queryParams.ts | State → URL string |
| `deserializeParams` | queryParams.ts | URL string → state |
| `sortData` | sortData.ts | Sort array by field |

### Redux Actions

| Action | Reducer | Purpose |
|--------|---------|---------|
| `setSearch` | filterSlice | Update search query |
| `setFilters` | filterSlice | Update active filters |
| `setSort` | filterSlice | Update sort state |
| `setPage` | filterSlice | Update page number |
| `clearFilters` | filterSlice | Reset all to defaults |
| `loadFromURL` | filterSlice | Hydrate from URL |
| `createSavedFilter` | savedFiltersSlice | Create preset |
| `updateSavedFilter` | savedFiltersSlice | Update preset |
| `deleteSavedFilter` | savedFiltersSlice | Delete preset |
| `setActivePreset` | savedFiltersSlice | Activate preset |
| `loadPresetsFromStorage` | savedFiltersSlice | Load from localStorage |

### Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useSearch` | Search state & debounce | search, tokens, setSearchValue, clearSearch |
| `useFilter` | Filter management | filters, addFilter, removeFilter, setAllFilters, clearFilters |
| `useSort` | Sort toggle logic | sort, setSortBy, clearSort |
| `useURLState` | URL synchronization | (void) |

### Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `FilterPanel` | filters, filterDefinitions, onApply, onCancel | Configure filters UI |
| `SavedFilters` | onLoad? | Manage presets UI |
| `DataTable` | columns, data, onEdit?, onDelete? | Display data with sorting |

## Troubleshooting

### Issue: Filters not applying

**Symptom:** Applied filters don't change displayed data.

**Solutions:**
1. Verify Redux is properly configured in `src/store/index.ts`
2. Check that `applyFilters` is called: `displayData = applyFilters(items, filters)`
3. Verify filter fields match object properties
4. Check browser Redux DevTools to see filter state

```typescript
// Debug in component
const filters = useAppSelector(selectFilters);
console.log('Active filters:', filters);
console.log('Filtered results:', applyFilters(items, filters));
```

### Issue: URL not updating

**Symptom:** Changing filters doesn't update URL.

**Solutions:**
1. Ensure `useURLState()` is called in component
2. Check that component is wrapped in `BrowserRouter`
3. Verify Redux slices are properly initialized
4. Look for console errors

### Issue: Search not debouncing

**Symptom:** Excessive Redux updates when typing.

**Solutions:**
1. Verify `useSearch` is being used
2. Check `DEBOUNCE_DELAY` value in useSearch.ts
3. Use browser Redux DevTools to see dispatch frequency

### Issue: Saved filters not persisting

**Symptom:** Saved filters disappear on page refresh.

**Solutions:**
1. Check browser localStorage is enabled
2. Verify `SavedFilters` component is rendered
3. Check browser DevTools Application → LocalStorage
4. Look for localStorage write errors in console

```typescript
// Debug localStorage
const stored = localStorage.getItem('retailr-saved-filters');
console.log('Stored filters:', JSON.parse(stored || '[]'));
```

### Issue: Sort not working

**Symptom:** Clicking sort columns doesn't change order.

**Solutions:**
1. Verify `sortData` is called after filtering
2. Check sort field matches object property name
3. Verify column is marked as `sortable: true`
4. Test with simple data first

```typescript
// Debug sort
const sorted = sortData(items, 'price', 'asc');
console.log('Sorted results:', sorted);
```

### Issue: Search matches wrong items

**Symptom:** Search returns unexpected results.

**Solutions:**
1. Verify search fields are correct in `matchesSearch` call
2. Remember search uses AND for tokens, OR for fields
3. Check token case-insensitivity
4. Test tokenization separately

```typescript
// Debug search
const tokens = tokenizeSearch('laptop pro');
console.log('Tokens:', tokens);

items.forEach(item => {
  const matches = matchesSearch(item, tokens, ['name', 'sku']);
  console.log(`Item ${item.id} matches: ${matches}`);
});
```

### Issue: Browser back/forward not working

**Symptom:** Browser back button doesn't restore filter state.

**Solutions:**
1. Ensure URL is being updated (check address bar)
2. Verify `useURLState` is called
3. Check that Redux state is being loaded from URL on mount
4. Test in different browser

### Issue: Performance degradation with large datasets

**Symptom:** UI becomes sluggish with thousands of items.

**Solutions:**
1. Add pagination (display 20-50 items per page)
2. Use virtual scrolling for very large lists
3. Implement backend filtering (Task 31.8)
4. Optimize search to run on fewer items
5. Use `useMemo` to prevent unnecessary recalculations

```typescript
const displayData = useMemo(() => {
  let data = applyFilters(items, filters);
  return data.filter((item) =>
    matchesSearch(item, tokens, ['name', 'sku'])
  );
}, [items, filters, tokens]);
```

---

**Last Updated:** June 2026
**Version:** 1.0.0
**Maintained By:** Platform Team
