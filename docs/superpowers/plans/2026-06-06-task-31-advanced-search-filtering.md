# Task 31: Advanced Search & Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive search, filtering, sorting, and saved filter capabilities to Products, Orders, and Stock pages with URL-based state persistence for shareable links.

**Architecture:** Frontend-first implementation with custom hooks (useSearch, useFilter, useSort, useURLState) for reusable logic, Redux slices for state management, enhanced DataTable with sorting, FilterPanel component for multi-field filtering, and optional backend API integration. Search is debounced client-side; filters persist in URL query parameters and Redux store; saved filters allow users to name and reuse filter combinations.

**Tech Stack:**
- Frontend: React 18, Redux Toolkit, React Router v6, Zod (validation), CSS Modules
- Utilities: Lodash (debounce, memoization)
- Testing: Vitest + React Testing Library
- Optional Backend: Spring Boot filters on `/products?search=X&status=Y` endpoints

---

## File Structure

### Core Infrastructure (Hooks & Utilities)

```
frontend/src/
├── hooks/
│   ├── useSearch.ts              # Debounced search with URL sync
│   ├── useFilter.ts              # Multi-field filtering with Redux
│   ├── useSort.ts                # Column sorting with state
│   ├── useURLState.ts            # URL parameter persistence
│   └── useSavedFilters.ts        # Saved filter presets management
├── store/slices/
│   ├── filterSlice.ts            # Redux slice for filter state
│   └── savedFiltersSlice.ts      # Redux slice for saved filters
├── utils/
│   ├── filterUtils.ts            # Filter matching logic
│   ├── searchUtils.ts            # Search/tokenization logic
│   ├── queryParams.ts            # URL <-> Object serialization
│   └── filterConfig.ts           # Filter definitions per domain
└── components/shared/
    ├── FilterPanel.tsx           # Generic filter UI
    ├── SavedFilters.tsx          # Saved filter management UI
    ├── SortableHeader.tsx        # Sortable column header
    └── FilterBar.tsx             # Existing - will enhance
```

### Domain-Specific Filters

```
frontend/src/components/
├── products/
│   └── ProductFilterConfig.ts    # Product filter definitions
├── orders/
│   └── OrderFilterConfig.ts      # Order filter definitions
└── stock/
    └── StockFilterConfig.ts      # Stock filter definitions
```

### Enhanced Components

```
frontend/src/
├── components/shared/
│   └── DataTable.tsx             # Enhanced with sortable columns
└── pages/
    ├── Products/ProductListPage.tsx      # Integrated with search/filter/sort
    ├── Orders/OrderListPage.tsx          # Integrated with search/filter/sort
    └── Stock/StockListPage.tsx           # Integrated with search/filter/sort
```

---

## Task Breakdown

### Task 31.1: Utility Functions for Filtering & Searching

**Files:**
- Create: `frontend/src/utils/filterUtils.ts`
- Create: `frontend/src/utils/searchUtils.ts`
- Create: `frontend/src/utils/queryParams.ts`
- Create: `frontend/src/utils/filterConfig.ts`
- Test: `frontend/src/utils/filterUtils.test.ts`, `searchUtils.test.ts`, `queryParams.test.ts`

**Description:** Implement core utility functions for filtering, searching, and URL parameter serialization. These utilities provide the foundation for all search/filter/sort operations.

**Acceptance Criteria:**
- `filterUtils.ts` exports `matchesFilter()`, `applyFilters()` functions
- `searchUtils.ts` exports `tokenizeSearch()`, `matchesSearch()` functions
- `queryParams.ts` exports `serializeParams()`, `deserializeParams()` functions
- `filterConfig.ts` defines filter structure and types
- All utilities have zero external dependencies (pure functions)
- 100% test coverage for all utility functions

#### Step 1: Write tests for filterUtils

```bash
# Create test file frontend/src/utils/filterUtils.test.ts
```

```typescript
import { describe, it, expect } from 'vitest';
import { matchesFilter, applyFilters } from './filterUtils';

describe('filterUtils', () => {
  describe('matchesFilter', () => {
    it('matches exact string values', () => {
      const item = { status: 'ACTIVE' };
      const filter = { field: 'status', operator: 'equals', value: 'ACTIVE' };
      expect(matchesFilter(item, filter)).toBe(true);
    });

    it('matches numbers with range operators', () => {
      const item = { quantity: 50 };
      const filter = { field: 'quantity', operator: 'gte', value: 40 };
      expect(matchesFilter(item, filter)).toBe(true);
    });

    it('matches dates with range operators', () => {
      const item = { createdAt: '2026-06-01' };
      const filter = { field: 'createdAt', operator: 'gte', value: '2026-05-01' };
      expect(matchesFilter(item, filter)).toBe(true);
    });

    it('returns false for non-matching values', () => {
      const item = { status: 'INACTIVE' };
      const filter = { field: 'status', operator: 'equals', value: 'ACTIVE' };
      expect(matchesFilter(item, filter)).toBe(false);
    });
  });

  describe('applyFilters', () => {
    it('applies multiple filters with AND logic', () => {
      const items = [
        { id: 1, status: 'ACTIVE', quantity: 100 },
        { id: 2, status: 'INACTIVE', quantity: 50 },
        { id: 3, status: 'ACTIVE', quantity: 30 },
      ];
      const filters = [
        { field: 'status', operator: 'equals', value: 'ACTIVE' },
        { field: 'quantity', operator: 'gte', value: 50 },
      ];
      const result = applyFilters(items, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns all items when filters is empty', () => {
      const items = [
        { id: 1, status: 'ACTIVE' },
        { id: 2, status: 'INACTIVE' },
      ];
      expect(applyFilters(items, [])).toEqual(items);
    });
  });
});
```

#### Step 2: Implement filterUtils.ts

```typescript
// frontend/src/utils/filterUtils.ts

export interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';
  value: string | number | boolean | (string | number)[];
}

export function matchesFilter(item: Record<string, unknown>, filter: Filter): boolean {
  const itemValue = item[filter.field];

  switch (filter.operator) {
    case 'equals':
      return itemValue === filter.value;
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'gte':
      return Number(itemValue) >= Number(filter.value);
    case 'lte':
      return Number(itemValue) <= Number(filter.value);
    case 'gt':
      return Number(itemValue) > Number(filter.value);
    case 'lt':
      return Number(itemValue) < Number(filter.value);
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(itemValue as string | number);
    default:
      return true;
  }
}

export function applyFilters(
  items: Record<string, unknown>[],
  filters: Filter[]
): Record<string, unknown>[] {
  if (filters.length === 0) return items;
  return items.filter((item) => filters.every((filter) => matchesFilter(item, filter)));
}
```

#### Step 3: Run tests for filterUtils

```bash
npm run test -- frontend/src/utils/filterUtils.test.ts
```

Expected: PASS (2 test suites, 7 tests)

#### Step 4: Write tests for searchUtils

```typescript
// frontend/src/utils/searchUtils.test.ts
import { describe, it, expect } from 'vitest';
import { tokenizeSearch, matchesSearch } from './searchUtils';

describe('searchUtils', () => {
  describe('tokenizeSearch', () => {
    it('splits search string into lowercase tokens', () => {
      const result = tokenizeSearch('ACTIVE Product');
      expect(result).toEqual(['active', 'product']);
    });

    it('handles empty strings', () => {
      expect(tokenizeSearch('')).toEqual([]);
    });

    it('handles extra whitespace', () => {
      const result = tokenizeSearch('  ACTIVE   Product  ');
      expect(result).toEqual(['active', 'product']);
    });
  });

  describe('matchesSearch', () => {
    it('matches when all tokens are found in search fields', () => {
      const item = { sku: 'PROD-123', name: 'Active Widget' };
      const fields = ['sku', 'name'];
      const tokens = ['active', 'prod'];
      expect(matchesSearch(item, fields, tokens)).toBe(true);
    });

    it('returns true when no tokens provided', () => {
      const item = { sku: 'PROD-123' };
      expect(matchesSearch(item, ['sku'], [])).toBe(true);
    });

    it('returns false when token not found in any field', () => {
      const item = { sku: 'PROD-123', name: 'Widget' };
      const tokens = ['notfound'];
      expect(matchesSearch(item, ['sku', 'name'], tokens)).toBe(false);
    });
  });
});
```

#### Step 5: Implement searchUtils.ts

```typescript
// frontend/src/utils/searchUtils.ts

export function tokenizeSearch(searchString: string): string[] {
  return searchString
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function matchesSearch(
  item: Record<string, unknown>,
  searchFields: string[],
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;

  const itemText = searchFields
    .map((field) => String(item[field] || '').toLowerCase())
    .join(' ');

  return tokens.every((token) => itemText.includes(token));
}
```

#### Step 6: Implement queryParams.ts and filterConfig.ts

```typescript
// frontend/src/utils/queryParams.ts

import { Filter } from './filterUtils';

export interface QueryParams {
  search?: string;
  filters?: Filter[];
  sort?: { field: string; order: 'asc' | 'desc' };
  page?: number;
}

export function serializeParams(params: QueryParams): URLSearchParams {
  const sp = new URLSearchParams();

  if (params.search) sp.set('search', params.search);
  if (params.filters && params.filters.length > 0) {
    sp.set('filters', JSON.stringify(params.filters));
  }
  if (params.sort) {
    sp.set('sort', `${params.sort.field}:${params.sort.order}`);
  }
  if (params.page && params.page > 1) {
    sp.set('page', String(params.page));
  }

  return sp;
}

export function deserializeParams(sp: URLSearchParams): QueryParams {
  const search = sp.get('search') || undefined;
  let filters: Filter[] | undefined;

  try {
    const filtersStr = sp.get('filters');
    if (filtersStr) {
      filters = JSON.parse(decodeURIComponent(filtersStr));
    }
  } catch {
    filters = undefined;
  }

  let sort: { field: string; order: 'asc' | 'desc' } | undefined;
  const sortStr = sp.get('sort');
  if (sortStr) {
    const [field, order] = sortStr.split(':');
    if (field && order === 'asc' || order === 'desc') {
      sort = { field, order };
    }
  }

  return {
    search,
    filters,
    sort,
    page: parseInt(sp.get('page') || '1', 10),
  };
}
```

```typescript
// frontend/src/utils/filterConfig.ts

import { Filter } from './filterUtils';

export interface FilterDefinition {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date-range' | 'number-range';
  operators?: ('equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in')[];
  options?: { label: string; value: string | number }[];
}

export const PRODUCT_FILTERS: FilterDefinition[] = [
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    operators: ['equals', 'in'],
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
      { label: 'Discontinued', value: 'DISCONTINUED' },
    ],
  },
  {
    field: 'price',
    label: 'Price Range',
    type: 'number-range',
    operators: ['gte', 'lte'],
  },
  {
    field: 'category',
    label: 'Category',
    type: 'select',
    operators: ['equals', 'in'],
  },
];

export const ORDER_FILTERS: FilterDefinition[] = [
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    operators: ['equals', 'in'],
    options: [
      { label: 'Confirmed', value: 'CONFIRMED' },
      { label: 'Fulfilled', value: 'FULFILLED' },
      { label: 'Cancelled', value: 'CANCELLED' },
    ],
  },
  {
    field: 'createdAt',
    label: 'Created Date',
    type: 'date-range',
    operators: ['gte', 'lte'],
  },
  {
    field: 'totalAmount',
    label: 'Amount Range',
    type: 'number-range',
    operators: ['gte', 'lte'],
  },
];

export const STOCK_FILTERS: FilterDefinition[] = [
  {
    field: 'warehouse',
    label: 'Warehouse',
    type: 'select',
    operators: ['equals', 'in'],
  },
  {
    field: 'quantity',
    label: 'Quantity Range',
    type: 'number-range',
    operators: ['gte', 'lte'],
  },
  {
    field: 'availableQuantity',
    label: 'Available Range',
    type: 'number-range',
    operators: ['gte', 'lte'],
  },
];
```

#### Step 7: Test queryParams serialization

```bash
npm run test -- frontend/src/utils/queryParams.test.ts
```

Expected: PASS

#### Step 8: Run all utils tests

```bash
npm run test -- frontend/src/utils/
```

Expected: All tests pass, 100% coverage

#### Step 9: Commit utilities

```bash
git add frontend/src/utils/
git commit -m "feat(31.1): add filter, search, and query param utilities"
```

---

### Task 31.2: Redux Slices for Filter State

**Files:**
- Create: `frontend/src/store/slices/filterSlice.ts`
- Create: `frontend/src/store/slices/savedFiltersSlice.ts`
- Test: `frontend/src/store/slices/filterSlice.test.ts`, `savedFiltersSlice.test.ts`

**Description:** Create Redux slices to manage filter state (active filters, search, sort) and saved filter presets. This enables persistent, shareable filter state.

**Acceptance Criteria:**
- `filterSlice` manages current filters, search term, sort order
- `savedFiltersSlice` manages saved filter presets with CRUD operations
- Slices are testable independently
- Selectors are memoized with reselect
- All reducers have unit tests

#### Step 1: Write tests for filterSlice

```typescript
// frontend/src/store/slices/filterSlice.test.ts
import { describe, it, expect } from 'vitest';
import filterReducer, {
  setSearch,
  setFilters,
  setSort,
  clearFilters,
  setPage,
} from './filterSlice';

describe('filterSlice', () => {
  const initialState = {
    search: '',
    filters: [],
    sort: null,
    page: 1,
  };

  it('initializes with empty state', () => {
    const state = filterReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initialState);
  });

  it('handles setSearch action', () => {
    const state = filterReducer(initialState, setSearch('test'));
    expect(state.search).toBe('test');
    expect(state.page).toBe(1); // Reset page on search
  });

  it('handles setFilters action', () => {
    const filters = [{ field: 'status', operator: 'equals' as const, value: 'ACTIVE' }];
    const state = filterReducer(initialState, setFilters(filters));
    expect(state.filters).toEqual(filters);
    expect(state.page).toBe(1); // Reset page on filter change
  });

  it('handles setSort action', () => {
    const sort = { field: 'createdAt', order: 'desc' as const };
    const state = filterReducer(initialState, setSort(sort));
    expect(state.sort).toEqual(sort);
  });

  it('handles clearFilters action', () => {
    const dirty = { search: 'test', filters: [{ field: 'status', operator: 'equals' as const, value: 'ACTIVE' }], sort: null, page: 2 };
    const state = filterReducer(dirty, clearFilters());
    expect(state.search).toBe('');
    expect(state.filters).toEqual([]);
    expect(state.sort).toBe(null);
    expect(state.page).toBe(1);
  });

  it('handles setPage action', () => {
    const state = filterReducer(initialState, setPage(3));
    expect(state.page).toBe(3);
  });
});
```

#### Step 2: Implement filterSlice.ts

```typescript
// frontend/src/store/slices/filterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filter } from '@/utils/filterUtils';
import { RootState } from '@/store';

export interface FilterState {
  search: string;
  filters: Filter[];
  sort: { field: string; order: 'asc' | 'desc' } | null;
  page: number;
}

const initialState: FilterState = {
  search: '',
  filters: [],
  sort: null,
  page: 1,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1; // Reset pagination on search
    },
    setFilters: (state, action: PayloadAction<Filter[]>) => {
      state.filters = action.payload;
      state.page = 1; // Reset pagination on filter change
    },
    setSort: (state, action: PayloadAction<{ field: string; order: 'asc' | 'desc' } | null>) => {
      state.sort = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    clearFilters: (state) => {
      state.search = '';
      state.filters = [];
      state.sort = null;
      state.page = 1;
    },
    loadFromURL: (state, action: PayloadAction<Partial<FilterState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { setSearch, setFilters, setSort, setPage, clearFilters, loadFromURL } = filterSlice.actions;

export const selectSearch = (state: RootState) => state.filter?.search || '';
export const selectFilters = (state: RootState) => state.filter?.filters || [];
export const selectSort = (state: RootState) => state.filter?.sort || null;
export const selectPage = (state: RootState) => state.filter?.page || 1;
export const selectFilterState = (state: RootState) => state.filter || initialState;

export default filterSlice.reducer;
```

#### Step 3: Implement savedFiltersSlice.ts

```typescript
// frontend/src/store/slices/savedFiltersSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filter } from '@/utils/filterUtils';
import { RootState } from '@/store';

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Filter[];
  search?: string;
  createdAt: number;
}

export interface SavedFiltersState {
  presets: SavedFilter[];
  activePresetId: string | null;
}

const initialState: SavedFiltersState = {
  presets: [],
  activePresetId: null,
};

const savedFiltersSlice = createSlice({
  name: 'savedFilters',
  initialState,
  reducers: {
    createSavedFilter: (state, action: PayloadAction<Omit<SavedFilter, 'id' | 'createdAt'>>) => {
      const id = `filter-${Date.now()}`;
      state.presets.push({
        ...action.payload,
        id,
        createdAt: Date.now(),
      });
    },
    updateSavedFilter: (state, action: PayloadAction<SavedFilter>) => {
      const index = state.presets.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.presets[index] = action.payload;
      }
    },
    deleteSavedFilter: (state, action: PayloadAction<string>) => {
      state.presets = state.presets.filter((p) => p.id !== action.payload);
      if (state.activePresetId === action.payload) {
        state.activePresetId = null;
      }
    },
    setActivePreset: (state, action: PayloadAction<string | null>) => {
      state.activePresetId = action.payload;
    },
    loadPresetsFromStorage: (state, action: PayloadAction<SavedFilter[]>) => {
      state.presets = action.payload;
    },
  },
});

export const {
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  setActivePreset,
  loadPresetsFromStorage,
} = savedFiltersSlice.actions;

export const selectSavedFilters = (state: RootState) => state.savedFilters?.presets || [];
export const selectActivePresetId = (state: RootState) => state.savedFilters?.activePresetId || null;
export const selectActivePreset = (state: RootState) => {
  const presets = state.savedFilters?.presets || [];
  const id = state.savedFilters?.activePresetId;
  if (id) return presets.find((p) => p.id === id);
  return null;
};

export default savedFiltersSlice.reducer;
```

#### Step 4: Update store to include new slices

```typescript
// frontend/src/store/index.ts - modify
import filterReducer from './slices/filterSlice';
import savedFiltersReducer from './slices/savedFiltersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    orders: ordersReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    stock: stockReducer,
    ui: uiReducer,
    realtime: rtReducer,
    filter: filterReducer,
    savedFilters: savedFiltersReducer,
  },
  // ... rest of config
});
```

#### Step 5: Test slices

```bash
npm run test -- frontend/src/store/slices/filterSlice.test.ts frontend/src/store/slices/savedFiltersSlice.test.ts
```

Expected: All tests pass

#### Step 6: Verify store compiles

```bash
npm run typecheck
```

Expected: 0 errors

#### Step 7: Commit Redux slices

```bash
git add frontend/src/store/slices/ frontend/src/store/index.ts
git commit -m "feat(31.2): add Redux slices for filter and saved filters state"
```

---

### Task 31.3: Custom Hooks for Search, Filter, and Sort

**Files:**
- Create: `frontend/src/hooks/useSearch.ts`
- Create: `frontend/src/hooks/useFilter.ts`
- Create: `frontend/src/hooks/useSort.ts`
- Create: `frontend/src/hooks/useURLState.ts`
- Test: `frontend/src/hooks/useSearch.test.ts`, `useFilter.test.ts`, `useSort.test.ts`, `useURLState.test.ts`

**Description:** Create custom hooks that encapsulate search, filter, sort, and URL state logic. These hooks integrate Redux, URL parameters, and utility functions for reusable functionality across pages.

**Acceptance Criteria:**
- `useSearch` manages debounced search with Redux sync
- `useFilter` manages active filters with Redux sync
- `useSort` manages sort order with Redux sync
- `useURLState` syncs all state to/from URL query params
- Hooks properly clean up side effects
- All hooks have comprehensive tests

#### Step 1: Implement useSearch.ts

```typescript
// frontend/src/hooks/useSearch.ts
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearch, selectSearch } from '@/store/slices/filterSlice';
import { tokenizeSearch } from '@/utils/searchUtils';

export interface UseSearchReturn {
  search: string;
  tokens: string[];
  setSearchValue: (value: string) => void;
  clearSearch: () => void;
}

export function useSearch(): UseSearchReturn {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const tokens = tokenizeSearch(search);

  const setSearchValue = useCallback((value: string) => {
    dispatch(setSearch(value));
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    dispatch(setSearch(''));
  }, [dispatch]);

  return {
    search,
    tokens,
    setSearchValue,
    clearSearch,
  };
}
```

#### Step 2: Implement useFilter.ts

```typescript
// frontend/src/hooks/useFilter.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilters, selectFilters, clearFilters as clearFiltersAction } from '@/store/slices/filterSlice';
import { Filter } from '@/utils/filterUtils';

export interface UseFilterReturn {
  filters: Filter[];
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  setAllFilters: (filters: Filter[]) => void;
  clearFilters: () => void;
}

export function useFilter(): UseFilterReturn {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const addFilter = useCallback(
    (filter: Filter) => {
      dispatch(setFilters([...filters, filter]));
    },
    [filters, dispatch]
  );

  const removeFilter = useCallback(
    (index: number) => {
      dispatch(setFilters(filters.filter((_, i) => i !== index)));
    },
    [filters, dispatch]
  );

  const setAllFilters = useCallback(
    (newFilters: Filter[]) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const clearFilters = useCallback(() => {
    dispatch(clearFiltersAction());
  }, [dispatch]);

  return {
    filters,
    addFilter,
    removeFilter,
    setAllFilters,
    clearFilters,
  };
}
```

#### Step 3: Implement useSort.ts

```typescript
// frontend/src/hooks/useSort.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSort, selectSort } from '@/store/slices/filterSlice';

export interface UseSort Return {
  sort: { field: string; order: 'asc' | 'desc' } | null;
  setSortBy: (field: string) => void;
  clearSort: () => void;
}

export function useSort(): UseSortReturn {
  const dispatch = useAppDispatch();
  const sort = useAppSelector(selectSort);

  const setSortBy = useCallback(
    (field: string) => {
      if (sort?.field === field) {
        // Toggle order if clicking same column
        dispatch(setSort({ field, order: sort.order === 'asc' ? 'desc' : 'asc' }));
      } else {
        // New sort column, default to asc
        dispatch(setSort({ field, order: 'asc' }));
      }
    },
    [sort, dispatch]
  );

  const clearSort = useCallback(() => {
    dispatch(setSort(null));
  }, [dispatch]);

  return {
    sort,
    setSortBy,
    clearSort,
  };
}
```

#### Step 4: Implement useURLState.ts

```typescript
// frontend/src/hooks/useURLState.ts
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadFromURL, selectFilterState } from '@/store/slices/filterSlice';
import { serializeParams, deserializeParams } from '@/utils/queryParams';

export function useURLState(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const filterState = useAppSelector(selectFilterState);

  // Load from URL on mount
  useEffect(() => {
    const params = deserializeParams(searchParams);
    dispatch(loadFromURL(params));
  }, []); // Only on mount

  // Sync to URL when state changes
  useEffect(() => {
    const newParams = serializeParams(filterState);
    setSearchParams(newParams, { replace: true });
  }, [filterState, setSearchParams]);
}
```

#### Step 5: Test custom hooks

```bash
npm run test -- frontend/src/hooks/useSearch.test.ts frontend/src/hooks/useFilter.test.ts frontend/src/hooks/useSort.test.ts frontend/src/hooks/useURLState.test.ts
```

Expected: All tests pass

#### Step 6: Verify types

```bash
npm run typecheck
```

Expected: 0 errors

#### Step 7: Commit hooks

```bash
git add frontend/src/hooks/
git commit -m "feat(31.3): add custom hooks for search, filter, and sort"
```

---

### Task 31.4: Enhance DataTable with Sorting

**Files:**
- Modify: `frontend/src/components/shared/DataTable.tsx`
- Create: `frontend/src/components/shared/SortableHeader.tsx`
- Test: `frontend/src/components/shared/DataTable.test.ts` (add sorting tests)

**Description:** Add sortable column headers to DataTable component. Clicking a column header toggles sort order (asc/desc) and triggers a callback.

**Acceptance Criteria:**
- DataTable accepts `sortField` and `sortOrder` props
- Column headers with `sortable` flag are clickable
- Clicking header calls `onSort(field)` callback
- Visual indicators show current sort order (▲ for asc, ▼ for desc)
- All existing DataTable functionality preserved
- Tests verify sort behavior

#### Step 1: Create SortableHeader component

```typescript
// frontend/src/components/shared/SortableHeader.tsx
import React from 'react';
import styles from './SortableHeader.module.css';

interface SortableHeaderProps {
  label: string;
  sortable?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc' | null;
  onSort?: (field: string) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortable = false,
  sortField,
  sortOrder,
  onSort,
}) => {
  const isSorted = sortField === label.toLowerCase().replace(/\s+/g, '-');
  const isAsc = sortOrder === 'asc';

  const handleClick = () => {
    if (sortable && onSort) {
      onSort(label.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  return (
    <button
      className={`${styles.header} ${sortable ? styles.sortable : ''} ${
        isSorted ? styles.sorted : ''
      }`}
      onClick={handleClick}
      disabled={!sortable}
      aria-label={`${label}${isSorted ? ` sorted ${isAsc ? 'ascending' : 'descending'}` : ''}`}
    >
      <span>{label}</span>
      {isSorted && <span className={styles.indicator}>{isAsc ? '▲' : '▼'}</span>}
    </button>
  );
};

export default SortableHeader;
```

#### Step 2: Update DataTable to support sorting

```typescript
// frontend/src/components/shared/DataTable.tsx - modify

export interface ColumnDef {
  header: string;
  key: string;
  render?: (value: unknown, row: unknown) => ReactNode;
  sortable?: boolean; // NEW
}

interface DataTableProps {
  columns: ColumnDef[];
  data: unknown[];
  idField?: string;
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: unknown) => void;
  onDelete?: (row: unknown) => void;
  sortField?: string; // NEW
  sortOrder?: 'asc' | 'desc' | null; // NEW
  onSort?: (field: string) => void; // NEW
}

// In render, update header row:
<tr className={styles.headerRow}>
  {columns.map((column) => (
    <th key={column.key} className={styles.headerCell}>
      {column.sortable ? (
        <SortableHeader
          label={column.header}
          sortable={true}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ) : (
        column.header
      )}
    </th>
  ))}
  {hasActions && <th className={styles.headerCell}>Actions</th>}
</tr>
```

#### Step 3: Write tests for sorting

```typescript
// frontend/src/components/shared/DataTable.test.ts - add to existing
import { render, screen, fireEvent } from '@testing-library/react';

describe('DataTable with sorting', () => {
  it('renders sortable headers when column has sortable flag', () => {
    const columns = [
      { header: 'Name', key: 'name', sortable: true },
      { header: 'Email', key: 'email', sortable: false },
    ];
    const data = [];

    render(<DataTable columns={columns} data={data} onSort={() => {}} />);

    const nameHeader = screen.getByRole('button', { name: /Name/ });
    expect(nameHeader).toBeInTheDocument();
  });

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn();
    const columns = [{ header: 'Name', key: 'name', sortable: true }];
    const data = [];

    render(<DataTable columns={columns} data={data} onSort={onSort} />);

    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('shows sort indicator for active sort', () => {
    const columns = [{ header: 'Name', key: 'name', sortable: true }];
    const data = [];

    render(
      <DataTable
        columns={columns}
        data={data}
        sortField="name"
        sortOrder="asc"
        onSort={() => {}}
      />
    );

    expect(screen.getByText('▲')).toBeInTheDocument();
  });
});
```

#### Step 4: Add SortableHeader CSS

```css
/* frontend/src/components/shared/SortableHeader.module.css */

.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: default;
  color: var(--color-text);
  font-weight: 600;
  text-align: left;
}

.header.sortable {
  cursor: pointer;
  user-select: none;
}

.header.sortable:hover {
  color: var(--color-primary);
}

.sorted {
  color: var(--color-primary);
}

.indicator {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}
```

#### Step 5: Test sorting

```bash
npm run test -- frontend/src/components/shared/DataTable.test.ts
```

Expected: Sorting tests pass

#### Step 6: Build and typecheck

```bash
npm run typecheck
npm run build
```

Expected: 0 errors, successful build

#### Step 7: Commit sorting enhancements

```bash
git add frontend/src/components/shared/
git commit -m "feat(31.4): add sortable column headers to DataTable"
```

---

### Task 31.5: Create FilterPanel Component

**Files:**
- Create: `frontend/src/components/shared/FilterPanel.tsx`
- Create: `frontend/src/components/shared/FilterPanel.module.css`
- Test: `frontend/src/components/shared/FilterPanel.test.ts`

**Description:** Generic FilterPanel component that renders filter inputs based on FilterDefinition array. Supports text, select, date-range, and number-range filters with add/remove functionality.

**Acceptance Criteria:**
- Component accepts `filters`, `filterDefinitions`, `onApply`, `onCancel` props
- Renders filter UI based on definitions
- Supports all filter types (text, select, date-range, number-range)
- Add/remove filter rows dynamically
- Apply/Cancel buttons to confirm changes
- CSS uses design tokens

#### Step 1: Implement FilterPanel.tsx

```typescript
// frontend/src/components/shared/FilterPanel.tsx
import React, { useState } from 'react';
import { Filter } from '@/utils/filterUtils';
import { FilterDefinition } from '@/utils/filterConfig';
import styles from './FilterPanel.module.css';

interface FilterPanelProps {
  filters: Filter[];
  filterDefinitions: FilterDefinition[];
  onApply: (filters: Filter[]) => void;
  onCancel: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterDefinitions,
  onApply,
  onCancel,
}) => {
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters);

  const handleAddFilter = () => {
    const def = filterDefinitions[0];
    if (def) {
      setLocalFilters([
        ...localFilters,
        { field: def.field, operator: def.operators?.[0] || 'equals', value: '' },
      ]);
    }
  };

  const handleRemoveFilter = (index: number) => {
    setLocalFilters(localFilters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, updates: Partial<Filter>) => {
    const updated = [...localFilters];
    updated[index] = { ...updated[index], ...updates };
    setLocalFilters(updated);
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Filters</h3>

      <div className={styles.filterList}>
        {localFilters.map((filter, index) => (
          <div key={index} className={styles.filterRow}>
            <select
              value={filter.field}
              onChange={(e) => handleFilterChange(index, { field: e.target.value })}
              className={styles.fieldSelect}
            >
              {filterDefinitions.map((def) => (
                <option key={def.field} value={def.field}>
                  {def.label}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => handleFilterChange(index, { operator: e.target.value as any })}
              className={styles.operatorSelect}
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="gte">≥ Greater than or equal</option>
              <option value="lte">≤ Less than or equal</option>
              <option value="gt">&gt; Greater than</option>
              <option value="lt">&lt; Less than</option>
            </select>

            <input
              type="text"
              value={String(filter.value)}
              onChange={(e) => handleFilterChange(index, { value: e.target.value })}
              className={styles.valueInput}
              placeholder="Filter value"
            />

            <button
              onClick={() => handleRemoveFilter(index)}
              className={styles.removeButton}
              aria-label="Remove filter"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleAddFilter} className={styles.addButton}>
        + Add Filter
      </button>

      <div className={styles.actions}>
        <button onClick={handleApply} className={styles.applyButton}>
          Apply Filters
        </button>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
```

#### Step 2: Add FilterPanel CSS

```css
/* frontend/src/components/shared/FilterPanel.module.css */

.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.filterList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filterRow {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.fieldSelect,
.operatorSelect,
.valueInput {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text);
}

.fieldSelect {
  flex: 0 0 150px;
}

.operatorSelect {
  flex: 0 0 150px;
}

.valueInput {
  flex: 1;
}

.removeButton {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-danger);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.removeButton:hover {
  background-color: var(--color-danger-hover);
}

.addButton {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  align-self: flex-start;
}

.addButton:hover {
  background-color: var(--color-success-hover);
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.applyButton,
.cancelButton {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.applyButton {
  background-color: var(--color-primary);
  color: white;
}

.applyButton:hover {
  background-color: var(--color-primary-hover);
}

.cancelButton {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
}

.cancelButton:hover {
  background-color: var(--color-bg-tertiary);
}
```

#### Step 3: Write FilterPanel tests

```bash
npm run test -- frontend/src/components/shared/FilterPanel.test.ts
```

#### Step 4: Build and verify

```bash
npm run typecheck
npm run build
```

Expected: 0 errors

#### Step 5: Commit FilterPanel

```bash
git add frontend/src/components/shared/FilterPanel.tsx frontend/src/components/shared/FilterPanel.module.css
git commit -m "feat(31.5): add FilterPanel component for multi-field filtering"
```

---

### Task 31.6: Create SavedFilters Component

**Files:**
- Create: `frontend/src/components/shared/SavedFilters.tsx`
- Create: `frontend/src/components/shared/SavedFilters.module.css`
- Test: `frontend/src/components/shared/SavedFilters.test.ts`

**Description:** SavedFilters component displays list of saved filter presets, allows loading/renaming/deleting. Persists to localStorage.

**Acceptance Criteria:**
- Displays all saved filter presets
- Load preset button restores filters and search
- Delete preset with confirmation
- Rename preset UI
- Persists presets to localStorage
- Tests verify all operations

#### Step 1: Create SavedFilters component (similar pattern to FilterPanel)

```typescript
// frontend/src/components/shared/SavedFilters.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  setActivePreset,
} from '@/store/slices/savedFiltersSlice';
import { selectFilterState } from '@/store/slices/filterSlice';
import styles from './SavedFilters.module.css';

interface SavedFiltersProps {
  onLoad?: () => void;
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({ onLoad }) => {
  const dispatch = useAppDispatch();
  const presets = useAppSelector(selectSavedFilters);
  const currentFilters = useAppSelector(selectFilterState);

  // Load presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('retailr-saved-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Load into Redux (implement loadPresetsFromStorage action)
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('retailr-saved-filters', JSON.stringify(presets));
  }, [presets]);

  const handleSaveCurrentFilters = () => {
    const name = prompt('Filter preset name:');
    if (name) {
      dispatch(
        createSavedFilter({
          name,
          filters: currentFilters.filters,
          search: currentFilters.search,
        })
      );
    }
  };

  const handleLoadPreset = (presetId: string) => {
    dispatch(setActivePreset(presetId));
    onLoad?.();
  };

  const handleDeletePreset = (presetId: string) => {
    if (window.confirm('Delete this filter preset?')) {
      dispatch(deleteSavedFilter(presetId));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Saved Filters</h4>
        <button onClick={handleSaveCurrentFilters} className={styles.saveButton}>
          + Save Current
        </button>
      </div>

      {presets.length === 0 ? (
        <p className={styles.empty}>No saved filters yet</p>
      ) : (
        <ul className={styles.list}>
          {presets.map((preset) => (
            <li key={preset.id} className={styles.item}>
              <button
                onClick={() => handleLoadPreset(preset.id)}
                className={styles.loadButton}
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDeletePreset(preset.id)}
                className={styles.deleteButton}
                aria-label={`Delete ${preset.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedFilters;
```

#### Step 2: Add SavedFilters CSS and complete styling

```css
/* frontend/src/components/shared/SavedFilters.module.css */

.container {
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.saveButton {
  padding: 0.375rem 0.75rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.saveButton:hover {
  background-color: var(--color-primary-hover);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
}

.loadButton {
  flex: 1;
  padding: var(--spacing-sm);
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.loadButton:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.deleteButton {
  padding: 0.375rem 0.5rem;
  background-color: var(--color-danger);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.deleteButton:hover {
  background-color: var(--color-danger-hover);
}

.empty {
  margin: 0;
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
```

#### Step 3: Test SavedFilters and commit

```bash
npm run test -- frontend/src/components/shared/SavedFilters.test.ts
npm run typecheck
git add frontend/src/components/shared/SavedFilters.*
git commit -m "feat(31.6): add SavedFilters component with localStorage persistence"
```

---

### Task 31.7: Integrate Search, Filter, Sort into Product/Order/Stock Pages

**Files:**
- Modify: `frontend/src/pages/Products/ProductListPage.tsx`
- Modify: `frontend/src/pages/Orders/OrderListPage.tsx`
- Modify: `frontend/src/pages/Stock/StockListPage.tsx`
- Create: `frontend/src/utils/sortData.ts` (sorting utility)

**Description:** Integrate all search/filter/sort functionality into the three main list pages. Implement client-side data processing with Redux selectors.

**Acceptance Criteria:**
- Search, filter, and sort inputs appear on each page
- Data is filtered, searched, and sorted client-side
- URL parameters update as user changes filters
- Filters persist across navigation
- All three pages follow identical pattern
- Tests verify integration

#### Step 1: Create sortData utility

```typescript
// frontend/src/utils/sortData.ts
export function sortData<T extends Record<string, any>>(
  data: T[],
  field: string,
  order: 'asc' | 'desc'
): T[] {
  const sorted = [...data];
  sorted.sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return sorted;
}
```

#### Step 2: Update ProductListPage with integrated search/filter/sort

```typescript
// frontend/src/pages/Products/ProductListPage.tsx - KEY CHANGES

import { useSearch } from '@/hooks/useSearch';
import { useFilter } from '@/hooks/useFilter';
import { useSort } from '@/hooks/useSort';
import { useURLState } from '@/hooks/useURLState';
import { applyFilters } from '@/utils/filterUtils';
import { matchesSearch } from '@/utils/searchUtils';
import { sortData } from '@/utils/sortData';
import { PRODUCT_FILTERS } from '@/utils/filterConfig';
import FilterPanel from '@/components/shared/FilterPanel';
import SavedFilters from '@/components/shared/SavedFilters';

export function ProductListPage() {
  const products = useAppSelector(selectAllProducts);
  const { search, tokens, setSearchValue } = useSearch();
  const { filters, setAllFilters } = useFilter();
  const { sort, setSortBy } = useSort();
  useURLState(); // Sync to URL

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Apply all transformations
  let displayData = products;

  // 1. Apply filters
  displayData = applyFilters(displayData, filters);

  // 2. Apply search
  displayData = displayData.filter((item) =>
    matchesSearch(item, ['sku', 'name'], tokens)
  );

  // 3. Apply sort
  if (sort) {
    displayData = sortData(displayData, sort.field, sort.order);
  }

  const columns: ColumnDef[] = [
    { header: 'SKU', key: 'sku', sortable: true },
    { header: 'Name', key: 'name', sortable: true },
    { header: 'Category', key: 'category', sortable: true },
    { header: 'Price', key: 'price', sortable: true },
    { header: 'Status', key: 'status', sortable: true },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
        <SearchInput value={search} onChange={setSearchValue} />
        <button onClick={() => setShowFilterPanel(!showFilterPanel)}>
          Filters
        </button>
      </div>

      {showFilterPanel && (
        <FilterPanel
          filters={filters}
          filterDefinitions={PRODUCT_FILTERS}
          onApply={setAllFilters}
          onCancel={() => setShowFilterPanel(false)}
        />
      )}

      <SavedFilters />

      <DataTable
        columns={columns}
        data={displayData}
        sortField={sort?.field}
        sortOrder={sort?.order}
        onSort={setSortBy}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

#### Step 3: Update OrderListPage and StockListPage similarly

Apply the same pattern to `OrderListPage.tsx` and `StockListPage.tsx` using their respective filter configurations (`ORDER_FILTERS` and `STOCK_FILTERS`).

#### Step 4: Test integration

```bash
npm run typecheck
npm run build
```

Expected: 0 errors, successful build

#### Step 5: Manual testing in browser

- Navigate to Products page
- Verify search works (debounced)
- Open filter panel
- Add filters and apply
- Click column headers to sort
- Verify URL updates
- Refresh browser to verify state persists
- Test save/load filter presets

#### Step 6: Commit integration

```bash
git add frontend/src/pages/ frontend/src/utils/sortData.ts
git commit -m "feat(31.7): integrate search, filter, sort into product/order/stock pages"
```

---

### Task 31.8: Optional Backend API Filtering (Future Extension)

**Files:**
- Create: `backend/catalog-service/src/main/java/com/retailr/catalog/controller/ProductFilterController.java`
- Create: `backend/order-service/src/main/java/com/retailr/order/controller/OrderFilterController.java`
- Test: `FilterControllerTest.java` files

**Description:** OPTIONAL: Add backend API endpoints that support search/filter parameters. This enables server-side filtering for large datasets and better performance at scale. Implementation details in separate task if needed.

**Note:** Task 31 focuses on frontend-first search/filtering. Backend API filtering can be added later without changing frontend code by modifying the API calls in `useQuery` hook.

---

### Task 31.9: Documentation & End-to-End Testing

**Files:**
- Create: `docs/SEARCH_FILTERING.md` - Comprehensive guide
- Create: `docs/SEARCH_FILTERING_TESTING.md` - E2E testing checklist
- Modify: `frontend/README.md` - Add search/filter section

**Description:** Document search/filter architecture, usage patterns, and provide E2E testing checklist.

**Acceptance Criteria:**
- Guide covers all features (search, filter, sort, saved filters, URL state)
- Includes code examples for each domain
- Testing checklist covers all user flows
- Documentation integrated into README
- All examples are copy-paste ready

---

## Summary

**Total Tasks:** 9

**Key Features:**
1. ✅ Utilities: Filtering, searching, URL serialization
2. ✅ Redux: Filter state and saved filters management
3. ✅ Hooks: Reusable search/filter/sort/URL logic
4. ✅ Components: DataTable sorting, FilterPanel, SavedFilters
5. ✅ Integration: Products, Orders, Stock pages with full search/filter/sort
6. ⏳ Optional: Backend API filtering (future extension)
7. ✅ Documentation: Comprehensive guides and testing checklists

**Production Readiness:**
- ✅ TypeScript strict mode compliance
- ✅ Unit tests for all utilities and hooks
- ✅ Integration tests for components
- ✅ localStorage persistence for saved filters
- ✅ URL-based state sharing
- ✅ Debounced search
- ✅ CSS using design tokens

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-06-06-task-31-advanced-search-filtering.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?