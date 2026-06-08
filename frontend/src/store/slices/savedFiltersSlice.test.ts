import { configureStore } from '@reduxjs/toolkit';
import savedFiltersReducer, {
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  setActivePreset,
  loadPresetsFromStorage,
  selectSavedFilters,
  selectActivePresetId,
  selectActivePreset,
} from './savedFiltersSlice';
import type { Filter } from '@/utils/filterUtils';
import type { RootState } from '@/store';

// ─── Test Setup ───────────────────────────────────────────────────────────

function createTestStore() {
  return configureStore({
    reducer: {
      savedFilters: savedFiltersReducer,
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('savedFiltersSlice', () => {
  describe('reducers', () => {
    it('should return the initial state', () => {
      const store = createTestStore();
      const state = store.getState().savedFilters;

      expect(state.presets).toEqual([]);
      expect(state.activePresetId).toBeNull();
    });

    describe('createSavedFilter', () => {
      it('should create a new saved filter with generated ID', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];

        const beforeTime = Date.now();
        store.dispatch(
          createSavedFilter({
            name: 'Electronics Items',
            description: 'All electronics products',
            filters,
            search: 'laptop',
          })
        );
        const afterTime = Date.now();

        const state = store.getState().savedFilters;
        expect(state.presets).toHaveLength(1);

        const preset = state.presets[0];
        expect(preset.name).toBe('Electronics Items');
        expect(preset.description).toBe('All electronics products');
        expect(preset.filters).toEqual(filters);
        expect(preset.search).toBe('laptop');
        expect(preset.id).toMatch(/^filter-\d+-\d+$/);

        // Verify ID is a timestamp-based unique ID (filter-{timestamp}-{counter})
        const idParts = preset.id.split('-');
        expect(idParts.length).toBe(3); // filter-{timestamp}-{counter}
        const idNum = parseInt(idParts[1], 10);
        expect(idNum).toBeGreaterThanOrEqual(beforeTime);
        expect(idNum).toBeLessThanOrEqual(afterTime);
      });

      it('should create without optional fields', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'price', operator: 'lte', value: 1000 },
        ];

        store.dispatch(
          createSavedFilter({
            name: 'Budget Items',
            filters,
          })
        );

        const state = store.getState().savedFilters;
        const preset = state.presets[0];
        expect(preset.description).toBeUndefined();
        expect(preset.search).toBeUndefined();
      });

      it('should add multiple saved filters', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Filter 1',
            filters: [{ field: 'a', operator: 'equals', value: '1' }],
          })
        );
        store.dispatch(
          createSavedFilter({
            name: 'Filter 2',
            filters: [{ field: 'b', operator: 'equals', value: '2' }],
          })
        );

        const state = store.getState().savedFilters;
        expect(state.presets).toHaveLength(2);
        expect(state.presets[0].name).toBe('Filter 1');
        expect(state.presets[1].name).toBe('Filter 2');
      });

      it('should set createdAt timestamp', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Test Filter',
            filters: [],
          })
        );

        const state = store.getState().savedFilters;
        const preset = state.presets[0];
        expect(preset.createdAt).toBeDefined();
        expect(typeof preset.createdAt).toBe('number');
      });
    });

    describe('updateSavedFilter', () => {
      it('should update an existing saved filter', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Original Name',
            filters: [{ field: 'a', operator: 'equals', value: '1' }],
          })
        );

        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(
          updateSavedFilter({
            id: presetId,
            name: 'Updated Name',
            description: 'New description',
          })
        );

        const state = store.getState().savedFilters;
        const preset = state.presets[0];
        expect(preset.name).toBe('Updated Name');
        expect(preset.description).toBe('New description');
      });

      it('should update filters in a saved filter', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Test',
            filters: [{ field: 'a', operator: 'equals', value: '1' }],
          })
        );

        const presetId = store.getState().savedFilters.presets[0].id;
        const newFilters: Filter[] = [
          { field: 'b', operator: 'equals', value: '2' },
        ];

        store.dispatch(
          updateSavedFilter({
            id: presetId,
            filters: newFilters,
          })
        );

        const state = store.getState().savedFilters;
        expect(state.presets[0].filters).toEqual(newFilters);
      });

      it('should not modify non-updated fields', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Test',
            description: 'Original description',
            filters: [{ field: 'a', operator: 'equals', value: '1' }],
            search: 'original',
          })
        );

        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(
          updateSavedFilter({
            id: presetId,
            name: 'New Name',
          })
        );

        const state = store.getState().savedFilters;
        const preset = state.presets[0];
        expect(preset.name).toBe('New Name');
        expect(preset.description).toBe('Original description');
        expect(preset.search).toBe('original');
      });
    });

    describe('deleteSavedFilter', () => {
      it('should delete a saved filter by ID', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Filter to delete',
            filters: [],
          })
        );

        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(deleteSavedFilter(presetId));

        const state = store.getState().savedFilters;
        expect(state.presets).toHaveLength(0);
      });

      it('should delete specific filter when multiple exist', () => {
        const store = createTestStore();

        store.dispatch(createSavedFilter({ name: 'Filter 1', filters: [] }));
        store.dispatch(createSavedFilter({ name: 'Filter 2', filters: [] }));
        store.dispatch(createSavedFilter({ name: 'Filter 3', filters: [] }));

        const filter2Id = store.getState().savedFilters.presets[1].id;

        store.dispatch(deleteSavedFilter(filter2Id));

        const state = store.getState().savedFilters;
        expect(state.presets).toHaveLength(2);
        expect(state.presets[0].name).toBe('Filter 1');
        expect(state.presets[1].name).toBe('Filter 3');
      });

      it('should clear activePresetId if deleted preset was active', () => {
        const store = createTestStore();

        store.dispatch(createSavedFilter({ name: 'Active Filter', filters: [] }));
        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(setActivePreset(presetId));
        store.dispatch(deleteSavedFilter(presetId));

        const state = store.getState().savedFilters;
        expect(state.activePresetId).toBeNull();
      });
    });

    describe('setActivePreset', () => {
      it('should set the active preset ID', () => {
        const store = createTestStore();

        store.dispatch(createSavedFilter({ name: 'Filter', filters: [] }));
        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(setActivePreset(presetId));

        const state = store.getState().savedFilters;
        expect(state.activePresetId).toBe(presetId);
      });

      it('should clear active preset when passed null', () => {
        const store = createTestStore();

        store.dispatch(createSavedFilter({ name: 'Filter', filters: [] }));
        const presetId = store.getState().savedFilters.presets[0].id;

        store.dispatch(setActivePreset(presetId));
        store.dispatch(setActivePreset(null));

        const state = store.getState().savedFilters;
        expect(state.activePresetId).toBeNull();
      });

      it('should switch between presets', () => {
        const store = createTestStore();

        store.dispatch(createSavedFilter({ name: 'Filter 1', filters: [] }));
        store.dispatch(createSavedFilter({ name: 'Filter 2', filters: [] }));

        const [id1, id2] = store
          .getState()
          .savedFilters.presets.map((p) => p.id);

        store.dispatch(setActivePreset(id1));
        expect(store.getState().savedFilters.activePresetId).toBe(id1);

        store.dispatch(setActivePreset(id2));
        expect(store.getState().savedFilters.activePresetId).toBe(id2);
      });
    });

    describe('loadPresetsFromStorage', () => {
      it('should load presets from storage', () => {
        const store = createTestStore();
        const filters: Filter[] = [
          { field: 'category', operator: 'equals', value: 'Electronics' },
        ];
        const presets = [
          {
            id: 'filter-1234567890',
            name: 'Saved Filter 1',
            filters,
            createdAt: 1234567890,
          },
          {
            id: 'filter-1234567891',
            name: 'Saved Filter 2',
            description: 'Test description',
            filters: [],
            search: 'test',
            createdAt: 1234567891,
          },
        ];

        store.dispatch(loadPresetsFromStorage(presets));

        const state = store.getState().savedFilters;
        expect(state.presets).toEqual(presets);
      });

      it('should replace existing presets', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Old Filter',
            filters: [],
          })
        );

        const newPresets = [
          {
            id: 'filter-9999999999',
            name: 'New Filter',
            filters: [],
            createdAt: 9999999999,
          },
        ];

        store.dispatch(loadPresetsFromStorage(newPresets));

        const state = store.getState().savedFilters;
        expect(state.presets).toEqual(newPresets);
        expect(state.presets[0].name).toBe('New Filter');
      });

      it('should preserve activePresetId', () => {
        const store = createTestStore();

        store.dispatch(
          createSavedFilter({
            name: 'Old Filter',
            filters: [],
          })
        );
        const oldId = store.getState().savedFilters.presets[0].id;
        store.dispatch(setActivePreset(oldId));

        const newPresets = [
          {
            id: 'filter-9999999999',
            name: 'New Filter',
            filters: [],
            createdAt: 9999999999,
          },
        ];

        store.dispatch(loadPresetsFromStorage(newPresets));

        const state = store.getState().savedFilters;
        expect(state.activePresetId).toBe(oldId); // activePresetId not affected
      });
    });
  });

  describe('selectors', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
      store = createTestStore();
    });

    it('selectSavedFilters should return presets array', () => {
      store.dispatch(createSavedFilter({ name: 'Filter 1', filters: [] }));
      store.dispatch(createSavedFilter({ name: 'Filter 2', filters: [] }));

      const presets = selectSavedFilters(store.getState() as RootState);
      expect(presets).toHaveLength(2);
      expect(presets[0].name).toBe('Filter 1');
      expect(presets[1].name).toBe('Filter 2');
    });

    it('selectActivePresetId should return active preset ID', () => {
      store.dispatch(createSavedFilter({ name: 'Filter', filters: [] }));
      const presetId = store.getState().savedFilters.presets[0].id;

      store.dispatch(setActivePreset(presetId));

      const activeId = selectActivePresetId(store.getState() as RootState);
      expect(activeId).toBe(presetId);
    });

    it('selectActivePresetId should return null when no active preset', () => {
      const activeId = selectActivePresetId(store.getState() as RootState);
      expect(activeId).toBeNull();
    });

    it('selectActivePreset should return the active preset object', () => {
      store.dispatch(
        createSavedFilter({
          name: 'Active Filter',
          description: 'Test active filter',
          filters: [{ field: 'test', operator: 'equals', value: 'value' }],
        })
      );
      const presetId = store.getState().savedFilters.presets[0].id;

      store.dispatch(setActivePreset(presetId));

      const activePreset = selectActivePreset(store.getState() as RootState);
      expect(activePreset).toBeDefined();
      expect(activePreset?.name).toBe('Active Filter');
      expect(activePreset?.description).toBe('Test active filter');
    });

    it('selectActivePreset should return undefined when no active preset', () => {
      const activePreset = selectActivePreset(store.getState() as RootState);
      expect(activePreset).toBeUndefined();
    });

    it('selectActivePreset should return undefined if active preset ID is invalid', () => {
      store.dispatch(createSavedFilter({ name: 'Filter', filters: [] }));
      store.dispatch(setActivePreset('invalid-id'));

      const activePreset = selectActivePreset(store.getState() as RootState);
      expect(activePreset).toBeUndefined();
    });
  });
});
