import { renderHook, act, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { useSearch } from './useSearch';
import filterReducer, { setSearch } from '@/store/slices/filterSlice';
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

describe('useSearch', () => {
  describe('initial state', () => {
    it('should initialize with empty search and tokens', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.search).toBe('');
      expect(result.current.tokens).toEqual([]);
    });

    it('should initialize with search from Redux state', () => {
      const store = createTestStore();
      store.dispatch(setSearch('laptop'));

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.search).toBe('laptop');
      expect(result.current.tokens).toEqual(['laptop']);
    });

    it('should tokenize multi-word search from initial state', () => {
      const store = createTestStore();
      store.dispatch(setSearch('gaming laptop red'));

      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.search).toBe('gaming laptop red');
      expect(result.current.tokens).toEqual(['gaming', 'laptop', 'red']);
    });
  });

  describe('setSearchValue', () => {
    it('should update search and tokens', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.search).toBe('');
      expect(result.current.tokens).toEqual([]);

      act(() => {
        result.current.setSearchValue('laptop');
      });

      await waitFor(() => {
        expect(result.current.search).toBe('laptop');
        expect(result.current.tokens).toEqual(['laptop']);
      });
    });

    it('should debounce search updates', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('l');
      });

      act(() => {
        result.current.setSearchValue('la');
      });

      act(() => {
        result.current.setSearchValue('lap');
      });

      // After debounce time, only the last value should be in Redux
      await waitFor(
        () => {
          expect(result.current.search).toBe('lap');
        },
        { timeout: 600 }
      );
    });

    it('should handle multi-word search', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('gaming laptop 15 inch');
      });

      await waitFor(() => {
        expect(result.current.tokens).toEqual(['gaming', 'laptop', '15', 'inch']);
      });
    });

    it('should handle empty string', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('test');
      });

      await waitFor(() => {
        expect(result.current.search).toBe('test');
      });

      act(() => {
        result.current.setSearchValue('');
      });

      await waitFor(() => {
        expect(result.current.search).toBe('');
        expect(result.current.tokens).toEqual([]);
      });
    });

    it('should convert to lowercase tokens', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('GAMING LAPTOP Pro');
      });

      await waitFor(() => {
        expect(result.current.tokens).toEqual(['gaming', 'laptop', 'pro']);
      });
    });

    it('should trim whitespace', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('  laptop   gaming  ');
      });

      await waitFor(() => {
        expect(result.current.tokens).toEqual(['laptop', 'gaming']);
      });
    });
  });

  describe('clearSearch', () => {
    it('should clear search and tokens', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('laptop');
      });

      await waitFor(() => {
        expect(result.current.search).toBe('laptop');
      });

      act(() => {
        result.current.clearSearch();
      });

      await waitFor(() => {
        expect(result.current.search).toBe('');
        expect(result.current.tokens).toEqual([]);
      });
    });

    it('should sync cleared search to Redux', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('test');
      });

      await waitFor(() => {
        expect(result.current.search).toBe('test');
      });

      act(() => {
        result.current.clearSearch();
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('');
      });
    });
  });

  describe('Redux integration', () => {
    it('should sync local state when Redux state changes', () => {
      const store = createTestStore();
      const { result, rerender } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.search).toBe('');

      act(() => {
        store.dispatch(setSearch('external update'));
      });

      rerender();

      expect(result.current.search).toBe('external update');
      expect(result.current.tokens).toEqual(['external', 'update']);
    });

    it('should dispatch to Redux on setSearchValue', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.setSearchValue('new search');
      });

      await waitFor(() => {
        const state = store.getState() as RootState;
        expect(state.filters.search).toBe('new search');
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up debounce timeout on unmount', async () => {
      const store = createTestStore();
      const { unmount } = renderHook(() => useSearch(), {
        wrapper: createWrapper(store),
      });

      // No error should occur when unmounting with pending debounce
      expect(() => unmount()).not.toThrow();
    });
  });
});
