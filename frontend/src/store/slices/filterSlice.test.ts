import { configureStore } from '@reduxjs/toolkit';
import filterReducer, {
  setSearch,
  setFilters,
  setSort,
  setPage,
  clearFilters,
  loadFromURL,
  selectSearch,
  selectFilters,
  selectSort,
  selectPage,
  selectFilterState,
} from './filterSlice';
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

// ─── Tests ────────────────────────────────────────────────────────────────

describe('filterSlice', () => {
  describe('reducers', () => {
    it('should return the initial state', () => {
      const store = createTestStore();
      const state = store.getState().filters;

      expect(state.search).toBe('');
      expect(state.filters).toEqual([]);
      expect(state.sort).toBeNull();
      expect(state.page).toBe(1);
    });

    describe('setSearch', () => {
      it('should set the search term and reset page to 1', () => {
        const store = createTestStore();

        store.dispatch(setPage(5));
        store.dispatch(setSearch('laptop'));

        const state = store.getState().filters;
        expect(state.search).toBe('laptop');
        expect(state.page).toBe(1);
      });

      it('should handle empty search string', () => {
        const store = createTestStore();
        store.dispatch(setSearch('test'));
        store.dispatch(setSearch(''));

        const state = store.getState().filters;
        expect(state.search).toBe('');
        expect(state.page).toBe(1);
      });
    });

    describe('setFilters', () => {
      it('should set filters and reset page to 1', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];

        store.dispatch(setPage(3));
        store.dispatch(setFilters(filters));

        const state = store.getState().filters;
        expect(state.filters).toEqual(filters);
        expect(state.page).toBe(1);
      });

      it('should replace existing filters', () => {
        const store = createTestStore();
        const filters1: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];
        const filters2: Filter[] = [
          { field: 'price', operator: 'lte', value: 1000 },
        ];

        store.dispatch(setFilters(filters1));
        store.dispatch(setFilters(filters2));

        const state = store.getState().filters;
        expect(state.filters).toEqual(filters2);
      });

      it('should handle empty filters array', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];

        store.dispatch(setFilters(filters));
        store.dispatch(setFilters([]));

        const state = store.getState().filters;
        expect(state.filters).toEqual([]);
        expect(state.page).toBe(1);
      });
    });

    describe('setSort', () => {
      it('should set sort object', () => {
        const store = createTestStore();
        const sort = { field: 'price', direction: 'asc' as const };

        store.dispatch(setSort(sort));

        const state = store.getState().filters;
        expect(state.sort).toEqual(sort);
      });

      it('should set sort to null', () => {
        const store = createTestStore();
        const sort = { field: 'price', direction: 'asc' as const };

        store.dispatch(setSort(sort));
        store.dispatch(setSort(null));

        const state = store.getState().filters;
        expect(state.sort).toBeNull();
      });
    });

    describe('setPage', () => {
      it('should set page number', () => {
        const store = createTestStore();

        store.dispatch(setPage(5));

        const state = store.getState().filters;
        expect(state.page).toBe(5);
      });

      it('should handle page 1', () => {
        const store = createTestStore();
        store.dispatch(setPage(10));
        store.dispatch(setPage(1));

        const state = store.getState().filters;
        expect(state.page).toBe(1);
      });

      it('should handle large page numbers', () => {
        const store = createTestStore();
        store.dispatch(setPage(9999));

        const state = store.getState().filters;
        expect(state.page).toBe(9999);
      });
    });

    describe('clearFilters', () => {
      it('should reset all filter state to initial values', () => {
        const store = createTestStore();

        store.dispatch(setSearch('laptop'));
        store.dispatch(
          setFilters([{ field: 'category', operator: 'equals', value: 'Electronics' }])
        );
        store.dispatch(setSort({ field: 'price', direction: 'asc' }));
        store.dispatch(setPage(5));

        store.dispatch(clearFilters());

        const state = store.getState().filters;
        expect(state.search).toBe('');
        expect(state.filters).toEqual([]);
        expect(state.sort).toBeNull();
        expect(state.page).toBe(1);
      });
    });

    describe('loadFromURL', () => {
      it('should load filter state from URL params', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];

        store.dispatch(
          loadFromURL({
            search: 'laptop',
            filters,
            sort: { field: 'price', direction: 'desc' },
            page: 3,
          })
        );

        const state = store.getState().filters;
        expect(state.search).toBe('laptop');
        expect(state.filters).toEqual(filters);
        expect(state.sort).toEqual({ field: 'price', direction: 'desc' });
        expect(state.page).toBe(3);
      });

      it('should handle partial URL params', () => {
        const store = createTestStore();

        store.dispatch(
          loadFromURL({
            search: 'test',
          })
        );

        const state = store.getState().filters;
        expect(state.search).toBe('test');
        expect(state.filters).toEqual([]);
        expect(state.sort).toBeNull();
        expect(state.page).toBe(1);
      });
    });
  });

  describe('selectors', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('selectSearch should return search term', () => {
      store.dispatch(setSearch('laptop'));

      const search = selectSearch(store.getState() as RootState);
      expect(search).toBe('laptop');
    });

    it('selectFilters should return filters array', () => {
      const filters: Filter[] = [
        { field: 'category', operator: 'equals', value: 'Electronics' },
      ];
      store.dispatch(setFilters(filters));

      const result = selectFilters(store.getState() as RootState);
      expect(result).toEqual(filters);
    });

    it('selectSort should return sort object', () => {
      const sort = { field: 'price', direction: 'asc' as const };
      store.dispatch(setSort(sort));

      const result = selectSort(store.getState() as RootState);
      expect(result).toEqual(sort);
    });

    it('selectPage should return page number', () => {
      store.dispatch(setPage(4));

      const page = selectPage(store.getState() as RootState);
      expect(page).toBe(4);
    });

    it('selectFilterState should return entire filter state', () => {
      const filters: Filter[] = [
        { field: 'price', operator: 'gte', value: 100 },
      ];
      const sort = { field: 'price', direction: 'asc' as const };

      store.dispatch(setSearch('gaming'));
      store.dispatch(setFilters(filters));
      store.dispatch(setSort(sort));
      store.dispatch(setPage(2));

      const state = selectFilterState(store.getState() as RootState);
      expect(state.search).toBe('gaming');
      expect(state.filters).toEqual(filters);
      expect(state.sort).toEqual(sort);
      expect(state.page).toBe(2);
    });
  });
});
