import { renderHook, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { useSort } from './useSort';
import filterReducer, { setSort } from '@/store/slices/filterSlice';
import type { RootState } from '@/store';
import type { Sort } from '@/store/slices/filterSlice';

// ─── Test Setup ───────────────────────────────────────────────────────────

function createTestStore() {
  return configureStore({
    reducer: {
      filters: filterReducer,
    },
  });
}

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('useSort', () => {
  describe('initial state', () => {
    it('should initialize with null sort', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.sort).toBeNull();
    });

    it('should initialize with sort from Redux state', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'price', direction: 'asc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.sort).toEqual(sort);
    });
  });

  describe('setSortBy', () => {
    it('should set initial sort with asc direction', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('price');
      });

      expect(result.current.sort).toEqual({ field: 'price', direction: 'asc' });
    });

    it('should set sort with asc for new field', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'name', direction: 'desc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('price');
      });

      expect(result.current.sort).toEqual({ field: 'price', direction: 'asc' });
    });

    it('should toggle direction when clicking same field', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'price', direction: 'asc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      // First click on same field should toggle to desc
      act(() => {
        result.current.setSortBy('price');
      });

      expect(result.current.sort).toEqual({ field: 'price', direction: 'desc' });

      // Second click on same field should toggle back to asc
      act(() => {
        result.current.setSortBy('price');
      });

      expect(result.current.sort).toEqual({ field: 'price', direction: 'asc' });
    });

    it('should toggle from desc to asc', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'name', direction: 'desc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sort).toEqual({ field: 'name', direction: 'asc' });
    });

    it('should reset to asc when switching fields', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'price', direction: 'desc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sort).toEqual({ field: 'name', direction: 'asc' });
    });

    it('should handle multiple field switches', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('name');
      });
      expect(result.current.sort).toEqual({ field: 'name', direction: 'asc' });

      act(() => {
        result.current.setSortBy('price');
      });
      expect(result.current.sort).toEqual({ field: 'price', direction: 'asc' });

      act(() => {
        result.current.setSortBy('price');
      });
      expect(result.current.sort).toEqual({ field: 'price', direction: 'desc' });

      act(() => {
        result.current.setSortBy('name');
      });
      expect(result.current.sort).toEqual({ field: 'name', direction: 'asc' });
    });

    it('should sync to Redux', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('price');
      });

      const state = store.getState() as RootState;
      expect(state.filters.sort).toEqual({ field: 'price', direction: 'asc' });
    });
  });

  describe('clearSort', () => {
    it('should clear sort to null', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'price', direction: 'asc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.sort).toBeNull();
    });

    it('should sync cleared sort to Redux', () => {
      const store = createTestStore();
      const sort: Sort = { field: 'price', direction: 'asc' };
      store.dispatch(setSort(sort));

      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.clearSort();
      });

      const state = store.getState() as RootState;
      expect(state.filters.sort).toBeNull();
    });

    it('should be idempotent', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.clearSort();
      });

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.sort).toBeNull();
    });
  });

  describe('Redux integration', () => {
    it('should sync local state when Redux state changes', () => {
      const store = createTestStore();
      const { result, rerender } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.sort).toBeNull();

      const newSort: Sort = { field: 'name', direction: 'desc' };

      act(() => {
        store.dispatch(setSort(newSort));
      });

      rerender();

      expect(result.current.sort).toEqual(newSort);
    });

    it('should dispatch to Redux on setSortBy', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSort(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSortBy('price');
      });

      const state = store.getState() as RootState;
      expect(state.filters.sort).toEqual({ field: 'price', direction: 'asc' });
    });
  });
});
