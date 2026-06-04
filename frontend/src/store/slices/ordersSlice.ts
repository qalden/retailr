import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Order, Pagination } from '@/types/domain';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

interface OrdersSliceState {
  items: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: OrdersSliceState = {
  items: [],
  selectedOrder: null,
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

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders(state, action: PayloadAction<Order[]>) {
      state.items = action.payload;
      state.error = null;
    },
    setSelectedOrder(state, action: PayloadAction<Order | null>) {
      state.selectedOrder = action.payload;
    },
    addOrder(state, action: PayloadAction<Order>) {
      state.items.unshift(action.payload);
    },
    updateOrder(state, action: PayloadAction<Order>) {
      const index = state.items.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedOrder?.id === action.payload.id) {
        state.selectedOrder = action.payload;
      }
    },
    removeOrder(state, action: PayloadAction<number>) {
      state.items = state.items.filter((o) => o.id !== action.payload);
      if (state.selectedOrder?.id === action.payload) {
        state.selectedOrder = null;
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
      state.selectedOrder = null;
      state.error = null;
      state.loading = false;
      state.pagination = initialState.pagination;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setOrders,
  setSelectedOrder,
  addOrder,
  updateOrder,
  removeOrder,
  setLoading,
  setError,
  setPagination,
  clear,
} = ordersSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectAllOrders = (state: RootState) => state.orders.items;
export const selectOrderById = (id: number) => (state: RootState) =>
  state.orders.items.find((o) => o.id === id);
export const selectSelectedOrder = (state: RootState) => state.orders.selectedOrder;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrdersError = (state: RootState) => state.orders.error;
export const selectOrdersPagination = (state: RootState) => state.orders.pagination;

export default ordersSlice.reducer;
