import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Customer, Pagination } from '@/types/domain';
import type { RootState } from '@/store';
import { axiosClient } from '@/api/axiosClient';

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

// ─── Async Thunks ─────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk<Customer[]>(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<Customer[]>('/customers');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customers';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createCustomer = createAsyncThunk<
  Customer,
  Omit<Customer, 'id' | 'createdAt'>,
  { rejectValue: string }
>('customers/createCustomer', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post<Customer>('/customers', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    return rejectWithValue(errorMessage);
  }
});

export const updateCustomerAsync = createAsyncThunk<
  Customer,
  Customer,
  { rejectValue: string }
>('customers/updateCustomerAsync', async (customer, { rejectWithValue }) => {
  try {
    const { id, ...updateData } = customer;
    const response = await axiosClient.put<Customer>(`/customers/${id}`, updateData);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
    return rejectWithValue(errorMessage);
  }
});

export const deleteCustomer = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('customers/deleteCustomer', async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/customers/${id}`);
    return id;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
    return rejectWithValue(errorMessage);
  }
});

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
  extraReducers: (builder) => {
    // Fetch Customers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Customer
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Customer
    builder
      .addCase(updateCustomerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(updateCustomerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Customer
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((c) => c.id !== action.payload);
        if (state.selectedCustomer?.id === action.payload) {
          state.selectedCustomer = null;
        }
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
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
