import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, Pagination } from '@/types/domain';
import type { RootState } from '@/store';

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

// ─── Slice ────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
      state.error = null;
    },
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.items.unshift(action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    },
    removeProduct(state, action: PayloadAction<number>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
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
      state.selectedProduct = null;
      state.error = null;
      state.loading = false;
      state.pagination = initialState.pagination;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setProducts,
  setSelectedProduct,
  addProduct,
  updateProduct,
  removeProduct,
  setLoading,
  setError,
  setPagination,
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
