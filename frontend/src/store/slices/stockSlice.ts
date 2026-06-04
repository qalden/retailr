import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StockItem, LowStockAlert } from '@/types/domain';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

interface StockSliceState {
  items: StockItem[];
  alerts: LowStockAlert[];
  loading: boolean;
  error: string | null;
}

const initialState: StockSliceState = {
  items: [],
  alerts: [],
  loading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setStockItems(state, action: PayloadAction<StockItem[]>) {
      state.items = action.payload;
      state.error = null;
    },
    updateStockItem(state, action: PayloadAction<StockItem>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    setAlerts(state, action: PayloadAction<LowStockAlert[]>) {
      state.alerts = action.payload;
    },
    addAlert(state, action: PayloadAction<LowStockAlert>) {
      // Avoid duplicates
      const exists = state.alerts.some((a) => a.id === action.payload.id);
      if (!exists) {
        state.alerts.unshift(action.payload);
      }
    },
    acknowledgeAlert(
      state,
      action: PayloadAction<{ alertId: number; acknowledgedAt: string; acknowledgedByUserId: number }>,
    ) {
      const alert = state.alerts.find((a) => a.id === action.payload.alertId);
      if (alert) {
        alert.acknowledgedAt = action.payload.acknowledgedAt;
        alert.acknowledgedByUserId = action.payload.acknowledgedByUserId;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    clear(state) {
      state.items = [];
      state.alerts = [];
      state.error = null;
      state.loading = false;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setStockItems,
  updateStockItem,
  setAlerts,
  addAlert,
  acknowledgeAlert,
  setLoading,
  setError,
  clear,
} = stockSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectAllStockItems = (state: RootState) => state.stock.items;
export const selectStockItemById = (id: number) => (state: RootState) =>
  state.stock.items.find((s) => s.id === id);
export const selectStockByProductId = (productId: number) => (state: RootState) =>
  state.stock.items.filter((s) => s.productId === productId);
export const selectAllAlerts = (state: RootState) => state.stock.alerts;
export const selectUnacknowledgedAlerts = (state: RootState) =>
  state.stock.alerts.filter((a) => a.acknowledgedAt === null);
export const selectStockLoading = (state: RootState) => state.stock.loading;
export const selectStockError = (state: RootState) => state.stock.error;

export default stockSlice.reducer;
