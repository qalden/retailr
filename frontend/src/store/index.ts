import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import customersReducer from './slices/customersSlice';
import suppliersReducer from './slices/suppliersSlice';
import stockReducer from './slices/stockSlice';
import uiReducer from './slices/uiSlice';
import rtReducer from './slices/rtSlice';
import filterReducer from './slices/filterSlice';
import savedFiltersReducer from './slices/savedFiltersSlice';

// ─── Store ────────────────────────────────────────────────────────────────

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    orders: ordersReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    stock: stockReducer,
    ui: uiReducer,
    realtime: rtReducer,
    filters: filterReducer,
    savedFilters: savedFiltersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // AppError instances are technically non-serializable but are contained in
        // action payloads that we handle immediately — suppress warnings for them.
        ignoredActionPaths: ['payload.originalError'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// ─── Inferred Types ───────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed Hooks ──────────────────────────────────────────────────────────

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
