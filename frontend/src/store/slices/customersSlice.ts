import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Customer, Pagination } from '@/types/domain';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

interface CustomersSliceState {
  items: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: CustomersSliceState = {
  items: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
};

// ─── Slice ────────────────────────────────────────────────────────────────

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCustomers(state, action: PayloadAction<Customer[]>) {
      state.items = action.payload;
      state.error = null;
    },
    setSelectedCustomer(state, action: PayloadAction<Customer | null>) {
      state.selectedCustomer = action.payload;
    },
    addCustomer(state, action: PayloadAction<Customer>) {
      state.items.unshift(action.payload);
    },
    updateCustomer(state, action: PayloadAction<Customer>) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedCustomer?.id === action.payload.id) {
        state.selectedCustomer = action.payload;
      }
    },
    removeCustomer(state, action: PayloadAction<number>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
      if (state.selectedCustomer?.id === action.payload) {
        state.selectedCustomer = null;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    setPagination(state, action: PayloadAction<Pagination>) {
      state.pagination = action.payload;
    },
    clear(state) {
      state.items = [];
      state.selectedCustomer = null;
      state.error = null;
      state.loading = false;
      state.pagination = initialState.pagination;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setCustomers,
  setSelectedCustomer,
  addCustomer,
  updateCustomer,
  removeCustomer,
  setLoading,
  setError,
  setPagination,
  clear,
} = customersSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectAllCustomers = (state: RootState) => state.customers.items;
export const selectCustomerById = (id: number) => (state: RootState) =>
  state.customers.items.find((c) => c.id === id);
export const selectSelectedCustomer = (state: RootState) => state.customers.selectedCustomer;
export const selectCustomersLoading = (state: RootState) => state.customers.loading;
export const selectCustomersError = (state: RootState) => state.customers.error;
export const selectCustomersPagination = (state: RootState) => state.customers.pagination;

export default customersSlice.reducer;
