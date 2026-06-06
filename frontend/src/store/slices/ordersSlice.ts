import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Order, Pagination } from '@/types/domain';
import type { RootState } from '@/store';
import { axiosClient } from '@/api/axiosClient';
import type { CreateOrderRequest } from '@/types/api';

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

// ─── Async Thunks ─────────────────────────────────────────────────────────

export const fetchOrders = createAsyncThunk<Order[]>(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<Order[]>('/orders');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOrderById = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('orders/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.get<Order>(`/orders/${id}`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
    return rejectWithValue(errorMessage);
  }
});

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderRequest,
  { rejectValue: string }
>('orders/createOrder', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post<Order>('/orders', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return rejectWithValue(errorMessage);
  }
});

export const updateOrder = createAsyncThunk<
  Order,
  Order,
  { rejectValue: string }
>('orders/updateOrder', async (order, { rejectWithValue }) => {
  try {
    const { id, ...updateData } = order;
    const response = await axiosClient.put<Order>(`/orders/${id}`, updateData);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
    return rejectWithValue(errorMessage);
  }
});

export const confirmOrder = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('orders/confirmOrder', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.put<Order>(`/orders/${id}/confirm`, {
      status: 'CONFIRMED',
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm order';
    return rejectWithValue(errorMessage);
  }
});

export const cancelOrder = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('orders/cancelOrder', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosClient.put<Order>(`/orders/${id}/cancel`, {
      status: 'CANCELLED',
    });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
    return rejectWithValue(errorMessage);
  }
});

export const deleteOrder = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('orders/deleteOrder', async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/orders/${id}`);
    return id;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order';
    return rejectWithValue(errorMessage);
  }
});

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
    replaceOrder(state, action: PayloadAction<Order>) {
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
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Confirm Order
    builder
      .addCase(confirmOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(confirmOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((o) => o.id !== action.payload);
        if (state.selectedOrder?.id === action.payload) {
          state.selectedOrder = null;
        }
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setOrders,
  setSelectedOrder,
  addOrder,
  replaceOrder,
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
