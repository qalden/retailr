import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Supplier } from '@/types/domain';
import type { RootState } from '@/store';

// ─── State ────────────────────────────────────────────────────────────────

interface SuppliersSliceState {
  items: Supplier[];
  selectedSupplier: Supplier | null;
  loading: boolean;
  error: string | null;
}

const initialState: SuppliersSliceState = {
  items: [],
  selectedSupplier: null,
  loading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    setSuppliers(state, action: PayloadAction<Supplier[]>) {
      state.items = action.payload;
      state.error = null;
    },
    setSelectedSupplier(state, action: PayloadAction<Supplier | null>) {
      state.selectedSupplier = action.payload;
    },
    addSupplier(state, action: PayloadAction<Supplier>) {
      state.items.unshift(action.payload);
    },
    updateSupplier(state, action: PayloadAction<Supplier>) {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedSupplier?.id === action.payload.id) {
        state.selectedSupplier = action.payload;
      }
    },
    removeSupplier(state, action: PayloadAction<number>) {
      state.items = state.items.filter((s) => s.id !== action.payload);
      if (state.selectedSupplier?.id === action.payload) {
        state.selectedSupplier = null;
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
      state.selectedSupplier = null;
      state.error = null;
      state.loading = false;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  setSuppliers,
  setSelectedSupplier,
  addSupplier,
  updateSupplier,
  removeSupplier,
  setLoading,
  setError,
  clear,
} = suppliersSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectAllSuppliers = (state: RootState) => state.suppliers.items;
export const selectSupplierById = (id: number) => (state: RootState) =>
  state.suppliers.items.find((s) => s.id === id);
export const selectSelectedSupplier = (state: RootState) => state.suppliers.selectedSupplier;
export const selectSuppliersLoading = (state: RootState) => state.suppliers.loading;
export const selectSuppliersError = (state: RootState) => state.suppliers.error;

export default suppliersSlice.reducer;
