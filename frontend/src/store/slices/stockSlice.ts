import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { StockItem, LowStockAlert } from '@/types/domain';
import type { RootState } from '@/store';
import type { StockUpdateMessage } from '@/utils/websocketTypes';
import { axiosClient } from '@/api/axiosClient';

// ─── Async Thunks ─────────────────────────────────────────────────────────

export const fetchStock = createAsyncThunk<StockItem[]>(
  'stock/fetchStock',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<StockItem[]>('/stock');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchLowStockAlerts = createAsyncThunk<LowStockAlert[]>(
  'stock/fetchLowStockAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<LowStockAlert[]>('/stock/alerts');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts';
      return rejectWithValue(errorMessage);
    }
  }
);

interface AdjustStockRequest {
  stockItemId: number;
  quantityDelta: number;
  movementType: string;
}

export const adjustStock = createAsyncThunk<StockItem, AdjustStockRequest, { rejectValue: string }>(
  'stock/adjustStock',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<StockItem>('/stock/movement', {
        stockItemId: data.stockItemId,
        quantityDelta: data.quantityDelta,
        movementType: data.movementType,
      });
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';
      return rejectWithValue(errorMessage);
    }
  }
);

export const acknowledgeAlert = createAsyncThunk<LowStockAlert, number, { rejectValue: string }>(
  'stock/acknowledgeAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post<LowStockAlert>(`/stock/alerts/${alertId}/acknowledge`, {});
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge alert';
      return rejectWithValue(errorMessage);
    }
  }
);

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
    updateStockFromWebSocket(state, action: PayloadAction<StockUpdateMessage>) {
      const message = action.payload;

      // Validate message structure and required fields
      if (!message || typeof message.warehouse !== 'string' || typeof message.sku !== 'string') {
        console.warn('Invalid stock update message structure, skipping:', message);
        return;
      }

      // Validate non-empty strings
      if (!message.warehouse.trim() || !message.sku.trim()) {
        console.warn('Invalid stock update message: empty warehouse or sku, skipping:', message);
        return;
      }

      // Validate quantity values
      if (typeof message.quantity !== 'number' || message.quantity < 0) {
        console.warn('Invalid quantity in stock message:', message.quantity);
        return;
      }

      if (typeof message.reserved !== 'number' || message.reserved < 0) {
        console.warn('Invalid reserved quantity in stock message:', message.reserved);
        return;
      }

      // Parse warehouse ID and validate
      const warehouseId = parseInt(message.warehouse, 10);
      if (isNaN(warehouseId) || warehouseId <= 0) {
        console.warn('Invalid warehouse ID:', message.warehouse);
        return;
      }

      // Find stock item by matching BOTH warehouse AND sku
      const existingIndex = state.items.findIndex(
        (item) => item.warehouseId === warehouseId && item.sku === message.sku
      );

      if (existingIndex !== -1) {
        // Merge update into existing item
        state.items[existingIndex].quantity = message.quantity;
        state.items[existingIndex].reservedQuantity = message.reserved;
        state.items[existingIndex].availableQuantity = message.quantity - message.reserved;
        state.items[existingIndex].updatedAt = new Date(message.timestamp).toISOString();
      } else {
        // Create new stock item from message
        const newItem: StockItem = {
          id: 0, // Placeholder - will be assigned by backend on sync
          sku: message.sku,
          productId: 0, // Placeholder - will be looked up later
          warehouseId: warehouseId,
          quantity: message.quantity,
          reservedQuantity: message.reserved,
          availableQuantity: message.quantity - message.reserved,
          updatedAt: new Date(message.timestamp).toISOString(),
        };
        state.items.push(newItem);
      }
    },
    setAlerts(state, action: PayloadAction<LowStockAlert[]>) {
      state.alerts = action.payload;
    },
    addAlert(state, action: PayloadAction<LowStockAlert>) {
      const exists = state.alerts.some((a) => a.id === action.payload.id);
      if (!exists) {
        state.alerts.unshift(action.payload);
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
  extraReducers: (builder) => {
    // Fetch Stock
    builder
      .addCase(fetchStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch stock';
      });

    // Fetch Alerts
    builder
      .addCase(fetchLowStockAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
        state.error = null;
      })
      .addCase(fetchLowStockAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch alerts';
      });

    // Adjust Stock
    builder
      .addCase(adjustStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to adjust stock';
      });

    // Acknowledge Alert
    builder
      .addCase(acknowledgeAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(acknowledgeAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to acknowledge alert';
      });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const { setStockItems, updateStockItem, updateStockFromWebSocket, setAlerts, addAlert, setLoading, setError, clear } = stockSlice.actions;

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
