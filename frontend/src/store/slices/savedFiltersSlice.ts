import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Filter } from '@/utils/filterUtils';
import type { RootState } from '@/store';

// ─── Types ────────────────────────────────────────────────────────────────

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Filter[];
  search?: string;
  createdAt: number;
}

interface SavedFiltersSliceState {
  presets: SavedFilter[];
  activePresetId: string | null;
}

// ─── ID Generation ────────────────────────────────────────────────────────

let idCounter = 0;
function generateFilterId(): string {
  return `filter-${Date.now()}-${++idCounter}`;
}

// ─── Initial State ────────────────────────────────────────────────────────

const initialState: SavedFiltersSliceState = {
  presets: [],
  activePresetId: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────

const savedFiltersSlice = createSlice({
  name: 'savedFilters',
  initialState,
  reducers: {
    createSavedFilter(
      state,
      action: PayloadAction<{
        name: string;
        description?: string;
        filters: Filter[];
        search?: string;
      }>
    ) {
      const newPreset: SavedFilter = {
        id: generateFilterId(),
        name: action.payload.name,
        description: action.payload.description,
        filters: action.payload.filters,
        search: action.payload.search,
        createdAt: Date.now(),
      };
      state.presets.push(newPreset);
    },

    updateSavedFilter(
      state,
      action: PayloadAction<{
        id: string;
        name?: string;
        description?: string;
        filters?: Filter[];
        search?: string;
      }>
    ) {
      const preset = state.presets.find((p) => p.id === action.payload.id);
      if (preset) {
        if (action.payload.name !== undefined) {
          preset.name = action.payload.name;
        }
        if (action.payload.description !== undefined) {
          preset.description = action.payload.description;
        }
        if (action.payload.filters !== undefined) {
          preset.filters = action.payload.filters;
        }
        if (action.payload.search !== undefined) {
          preset.search = action.payload.search;
        }
      }
    },

    deleteSavedFilter(state, action: PayloadAction<string>) {
      state.presets = state.presets.filter((p) => p.id !== action.payload);

      // Clear active preset if it was deleted
      if (state.activePresetId === action.payload) {
        state.activePresetId = null;
      }
    },

    setActivePreset(state, action: PayloadAction<string | null>) {
      state.activePresetId = action.payload;
    },

    loadPresetsFromStorage(state, action: PayloadAction<SavedFilter[]>) {
      state.presets = action.payload;
    },
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────

export const {
  createSavedFilter,
  updateSavedFilter,
  deleteSavedFilter,
  setActivePreset,
  loadPresetsFromStorage,
} = savedFiltersSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────

export const selectSavedFilters = (state: RootState) => state.savedFilters.presets;

export const selectActivePresetId = (state: RootState) => state.savedFilters.activePresetId;

export const selectActivePreset = (state: RootState) => {
  const activeId = state.savedFilters.activePresetId;
  if (!activeId) {
    return undefined;
  }
  return state.savedFilters.presets.find((p) => p.id === activeId);
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export default savedFiltersSlice.reducer;
