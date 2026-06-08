import { renderHook, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { useFilter } from './useFilter';
import filterReducer, { setFilters } from '@/store/slices/filterSlice';
import type { Filter } from '@/utils/filterUtils';
import type { RootState } from '@/store';

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

describe('useFilter', () => {
  describe('initial state', () => {
    it('should initialize with empty filters', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.filters).toEqual([]);
    });

    it('should initialize with filters from Redux state', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.filters).toEqual(filters);
    });
  });

  describe('addFilter', () => {
    it('should add a filter to the list', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const newFilter: Filter = { field: 'price', operator: 'lte', value: 1000 };

      act(() => {
        result.current.addFilter(newFilter);
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0]).toEqual(newFilter);
    });

    it('should append multiple filters', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const filter1: Filter = { field: 'category', operator: 'equals', value: 'Electronics' };
      const filter2: Filter = { field: 'price', operator: 'gte', value: 100 };

      act(() => {
        result.current.addFilter(filter1);
      });

      act(() => {
        result.current.addFilter(filter2);
      });

      expect(result.current.filters).toHaveLength(2);
      expect(result.current.filters).toEqual([filter1, filter2]);
    });

    it('should allow duplicate filters', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const filter: Filter = { field: 'category', operator: 'equals', value: 'Electronics' };

      act(() => {
        result.current.addFilter(filter);
      });

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.filters).toHaveLength(2);
    });

    it('should sync to Redux', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const newFilter: Filter = { field: 'price', operator: 'lte', value: 1000 };

      act(() => {
        result.current.addFilter(newFilter);
      });

      const state = store.getState() as RootState;
      expect(state.filters.filters).toContainEqual(newFilter);
    });
  });

  describe('removeFilter', () => {
    it('should remove filter at specified index', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
        { field: 'price', operator: 'lte', value: 1000 },
        { field: 'brand', operator: 'equals', value: 'Samsung' },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.removeFilter(1);
      });

      expect(result.current.filters).toHaveLength(2);
      expect(result.current.filters[0]).toEqual(filters[0]);
      expect(result.current.filters[1]).toEqual(filters[2]);
    });

    it('should remove first filter at index 0', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
        { field: 'price', operator: 'lte', value: 1000 },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.removeFilter(0);
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0]).toEqual(filters[1]);
    });

    it('should remove last filter', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
        { field: 'price', operator: 'lte', value: 1000 },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.removeFilter(1);
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0]).toEqual(filters[0]);
    });

    it('should handle out of bounds index gracefully', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.removeFilter(10);
      });

      // Should keep the original filter since index is out of bounds
      expect(result.current.filters).toHaveLength(1);
    });

    it('should sync to Redux', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
        { field: 'price', operator: 'lte', value: 1000 },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.removeFilter(0);
      });

      const state = store.getState() as RootState;
      expect(state.filters.filters).toHaveLength(1);
      expect(state.filters.filters[0]).toEqual(filters[1]);
    });
  });

  describe('setAllFilters', () => {
    it('should replace all filters', () => {
      const store = createTestStore();
      const initialFilters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(initialFilters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const newFilters: Filter[] = [
        { field: 'price', operator: 'gte', value: 100 },
        { field: 'brand', operator: 'equals', value: 'Apple' },
      ];

      act(() => {
        result.current.setAllFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should handle empty filters', () => {
      const store = createTestStore();
      const initialFilters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(initialFilters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setAllFilters([]);
      });

      expect(result.current.filters).toEqual([]);
    });

    it('should sync to Redux', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const newFilters: Filter[] = [
        { field: 'price', operator: 'gte', value: 100 },
      ];

      act(() => {
        result.current.setAllFilters(newFilters);
      });

      const state = store.getState() as RootState;
      expect(state.filters.filters).toEqual(newFilters);
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
        { field: 'price', operator: 'lte', value: 1000 },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual([]);
    });

    it('should sync cleared filters to Redux', () => {
      const store = createTestStore();
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(filters));

      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.clearFilters();
      });

      const state = store.getState() as RootState;
      expect(state.filters.filters).toEqual([]);
    });
  });

  describe('Redux integration', () => {
    it('should sync local state when Redux state changes', () => {
      const store = createTestStore();
      const { result, rerender } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.filters).toEqual([]);

      const newFilters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];

      act(() => {
        store.dispatch(setFilters(newFilters));
      });

      rerender();

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should dispatch to Redux when adding filters', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useFilter(), {
        wrapper: createWrapper(store),
      });

      const newFilter: Filter = { field: 'price', operator: 'lte', value: 1000 };

      act(() => {
        result.current.addFilter(newFilter);
      });

      const state = store.getState() as RootState;
      expect(state.filters.filters).toContainEqual(newFilter);
    });
  });
});
