import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Filter } from '@/utils/filterUtils';
import type { RootState } from '@/store';

// ─── Types ────────────────────────────────────────────────────────────────

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterSliceState {
  search: string;
  filters: Filter[];
  sort: Sort | null;
  page: number;
}

// ─── Initial State ────────────────────────────────────────────────────────

const initialState: FilterSliceState = {
  search: '',
  filters: [],
  sort: null,
  page: 1,
};

// ─── Slice ────────────────────────────────────────────────────────────────

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1; // Reset page when search changes
    },

    setFilters(state, action: PayloadAction<Filter[]>) {
      state.filters = action.payload;
      state.page = 1; // Reset page when filters change
    },

    setSort(state, action: PayloadAction<Sort | null>) {
      state.sort = action.payload;
    },

    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },

    clearFilters(state) {
      state.search = '';
      state.filters = [];
      state.sort = null;
      state.page = 1;
    },

    loadFromURL(
      state,
      action: PayloadAction<{
        search?: string;
        filters?: Filter[];
        sort?: Sort;
        page?: number;
      }>
    ) {
      if (action.payload.search !== undefined) {
        state.search = action.payload.search;
      }
      if (action.payload.filters !== undefined) {
        state.filters = action.payload.filters;
      }
      if (action.payload.sort !== undefined) {
        state.sort = action.payload.sort;
      }
      if (action.payload.page !== undefined) {
        state.page = action.payload.page;
      }
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const { setSearch, setFilters, setSort, setPage, clearFilters, loadFromURL } =
  filterSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectSearch = (state: RootState) => state.filters.search;
export const selectFilters = (state: RootState) => state.filters.filters;
export const selectSort = (state: RootState) => state.filters.sort;
export const selectPage = (state: RootState) => state.filters.page;

export const selectFilterState = (state: RootState) => ({
  search: state.filters.search,
  filters: state.filters.filters,
  sort: state.filters.sort,
  page: state.filters.page,
});

// ─── Reducer ───────────────────────────────────────────────────────────────

export default filterSlice.reducer;
