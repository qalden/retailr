import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, Pagination } from '@/types/domain';
import type { RootState } from '@/store';
import { axiosClient } from '@/api/axiosClient';
import type { CreateProductRequest } from '@/types/api';

// ─── State ────────────────────────────────────────────────────────────────

interface ProductsSliceState {
  items: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
}

const initialState: ProductsSliceState = {
  items: [],
  selectedProduct: null,
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

export const fetchProducts = createAsyncThunk<Product[]>(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<Product[]>('/products');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createProduct = createAsyncThunk<
  Product,
  CreateProductRequest,
  { rejectValue: string }
>('products/createProduct', async (data, { rejectWithValue }) => {
  try {
    const response = await axiosClient.post<Product>('/products', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    return rejectWithValue(errorMessage);
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  Product,
  { rejectValue: string }
>('products/updateProduct', async (product, { rejectWithValue }) => {
  try {
    const { id, ...updateData } = product;
    const response = await axiosClient.put<Product>(`/products/${id}`, updateData);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
    return rejectWithValue(errorMessage);
  }
});

export const deleteProduct = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('products/deleteProduct', async (id, { rejectWithValue }) => {
  try {
    await axiosClient.delete(`/products/${id}`);
    return id;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
    return rejectWithValue(errorMessage);
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
    },
    clear(state) {
      state.items = [];
      state.selectedProduct = null;
      state.error = null;
      state.loading = false;
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch products';
      });

    // Create Product
    builder
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to create product';
      });

    // Update Product (reducer action, not async)
    builder
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to update product';
      });

    // Delete Product
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((p) => p.id !== action.payload);
        if (state.selectedProduct?.id === action.payload) {
          state.selectedProduct = null;
        }
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to delete product';
      });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setSelectedProduct,
  clear,
} = productsSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectAllProducts = (state: RootState) => state.products.items;
export const selectProductById = (id: number) => (state: RootState) =>
  state.products.items.find((p) => p.id === id);
export const selectSelectedProduct = (state: RootState) => state.products.selectedProduct;
export const selectProductsLoading = (state: RootState) => state.products.loading;
export const selectProductsError = (state: RootState) => state.products.error;
export const selectProductsPagination = (state: RootState) => state.products.pagination;

export default productsSlice.reducer;
