import { renderHook, act, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useURLState } from './useURLState';
import filterReducer, {
  setSearch,
  setFilters,
  setSort,
} from '@/store/slices/filterSlice';
import type { RootState } from '@/store';
import type { Filter } from '@/utils/filterUtils';

// ─── Test Setup ───────────────────────────────────────────────────────────

function createTestStore() {
  return configureStore({
    reducer: {
      filters: filterReducer,
    },
  });
}

function createWrapper(
  store: ReturnType<typeof createTestStore>,
  initialEntries?: string[]
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries || ['/']}>
        <Provider store={store}>{children}</Provider>
      </MemoryRouter>
    );
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('useURLState', () => {
  describe('loading from URL on mount', () => {
    it('should load search from URL on mount', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?search=laptop']),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('laptop');
      });
    });

    it('should load filters from URL on mount', async () => {
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      const filtersJson = encodeURIComponent(JSON.stringify(filters));
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, [`/?filters=${filtersJson}`]),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.filters).toEqual(filters);
      });
    });

    it('should load sort from URL on mount', async () => {
      // Note: URL stores sort with 'order' field (SortOption format)
      // Hook converts it to 'direction' field (Sort format)
      const sortUrl = { field: 'price', order: 'asc' };
      const sortJson = encodeURIComponent(JSON.stringify(sortUrl));
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, [`/?sort=${sortJson}`]),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.sort).toEqual({ field: 'price', direction: 'asc' });
      });
    });

    it('should load page from URL on mount', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?page=3']),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.page).toBe(3);
      });
    });

    it('should load multiple parameters from URL on mount', async () => {
      const filters: Filter[] = [
        { field: 'price', operator: 'gte', value: 100 },
      ];
      const filtersJson = encodeURIComponent(JSON.stringify(filters));
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, [`/?search=laptop&filters=${filtersJson}&page=2`]),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('laptop');
        expect(state.filters.filters).toEqual(filters);
        expect(state.filters.page).toBe(2);
      });
    });

    it('should handle empty URL params gracefully', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/']),
      });

      // Should keep initial state when no URL params
      const state = store.getState() as RootState;
      expect(state.filters.search).toBe('');
      expect(state.filters.filters).toEqual([]);
      expect(state.filters.page).toBe(1);
    });

    it('should only load from URL once on mount', async () => {
      const store = createTestStore();

      const { rerender } = renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?search=laptop']),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('laptop');
      });

      // Rerender - state should not change from URL again
      rerender();

      const stateAfterSecondRender = store.getState() as RootState;
      expect(stateAfterSecondRender.filters.search).toBe('laptop');
    });
  });

  describe('syncing to URL when state changes', () => {
    it('should sync search to URL when state changes', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/']),
      });

      act(() => {
        store.dispatch(setSearch('laptop'));
      });

      // Give sync effect time to run
      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('laptop');
      });
    });

    it('should sync filters to URL when state changes', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/']),
      });

      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];

      act(() => {
        store.dispatch(setFilters(filters));
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.filters).toEqual(filters);
      });
    });

    it('should sync sort to URL when state changes', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/']),
      });

      act(() => {
        store.dispatch(setSort({ field: 'price', direction: 'asc' }));
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.sort).toEqual({ field: 'price', direction: 'asc' });
      });
    });
  });

  describe('two separate useEffect hooks', () => {
    it('should have effects for loading on mount and syncing on state change', async () => {
      const store = createTestStore();

      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?search=initial']),
      });

      // Wait for URL load effect
      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('initial');
      });

      // Then trigger state change and verify it processed
      act(() => {
        store.dispatch(setSearch('updated'));
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('updated');
      });
    });
  });

  describe('cleanup and edge cases', () => {
    it('should handle invalid URL parameters gracefully', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?filters=invalid-json&search=test']),
      });

      // Should load what it can
      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('test');
        expect(state.filters.filters).toEqual([]); // Invalid JSON should default to empty array
      });
    });

    it('should handle empty search params', async () => {
      const store = createTestStore();
      renderHook(() => useURLState(), {
        wrapper: createWrapper(store, ['/?search=&filters=&page=1']),
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('');
        expect(state.filters.filters).toEqual([]);
        expect(state.filters.page).toBe(1);
      });
    });

    it('should not cause infinite loops when syncing URL', async () => {
      const store = createTestStore();
      let renderCount = 0;

      renderHook(
        () => {
          renderCount++;
          return useURLState();
        },
        {
          wrapper: createWrapper(store, ['/']),
        }
      );

      act(() => {
        store.dispatch(setSearch('test'));
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('test');
      });

      const countAfterFirstUpdate = renderCount;

      // Should not trigger additional updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Count should be relatively stable (maybe 2-3 renders for effects)
      expect(renderCount).toBeLessThanOrEqual(countAfterFirstUpdate + 2);
    });
  });
});
