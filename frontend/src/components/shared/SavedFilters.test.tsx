import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SavedFilters } from './SavedFilters';
import filterReducer from '../../store/slices/filterSlice';
import savedFiltersReducer, {
  type SavedFilter,
} from '../../store/slices/savedFiltersSlice';

// ─── Test Setup ───────────────────────────────────────────────────────────

interface MockStoreOptions {
  preloadedState?: Record<string, any>;
}

function createMockStore(options?: MockStoreOptions) {
  return configureStore({
    reducer: {
      filters: filterReducer,
      savedFilters: savedFiltersReducer,
    },
    preloadedState: options?.preloadedState,
  } as any);
}

function renderWithRedux(
  component: React.ReactElement,
  options?: MockStoreOptions
) {
  const store = createMockStore(options);
  return render(<Provider store={store}>{component}</Provider>);
}

const mockSavedFilters: SavedFilter[] = [
  {
    id: 'filter-1',
    name: 'Electronics Under $100',
    filters: [
      { field: 'categoryName', operator: 'equals', value: 'Electronics' },
      { field: 'unitPrice', operator: 'lte', value: '100' },
    ],
    search: '',
    createdAt: Date.now() - 10000,
  },
  {
    id: 'filter-2',
    name: 'Recent Products',
    filters: [{ field: 'createdAt', operator: 'gte', value: '2024-01-01' }],
    search: '',
    createdAt: Date.now() - 5000,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────

describe('SavedFilters', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render component with title', () => {
      renderWithRedux(<SavedFilters />);

      expect(screen.getByText('Saved Filters')).toBeInTheDocument();
    });

    it('should display empty state when no presets exist', () => {
      renderWithRedux(<SavedFilters />);

      expect(screen.getByText('No saved filters yet')).toBeInTheDocument();
    });

    it('should render "Save Current" button', () => {
      renderWithRedux(<SavedFilters />);

      expect(screen.getByText('+ Save Current')).toBeInTheDocument();
    });

    it('should display list of saved filter presets', () => {
      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      expect(screen.getByText('Electronics Under $100')).toBeInTheDocument();
      expect(screen.getByText('Recent Products')).toBeInTheDocument();
    });

    it('should render delete button for each preset', () => {
      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      expect(deleteButtons).toHaveLength(2);
    });

    it('should make preset name clickable', () => {
      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const presetLink = screen.getByRole('button', {
        name: 'Electronics Under $100',
      });
      expect(presetLink).toBeInTheDocument();
    });
  });

  describe('localStorage integration', () => {
    it('should load presets from localStorage on mount', async () => {
      const mockData = JSON.stringify(mockSavedFilters);
      localStorage.setItem('retailr-saved-filters', mockData);

      renderWithRedux(<SavedFilters />);

      await waitFor(() => {
        expect(screen.getByText('Electronics Under $100')).toBeInTheDocument();
      });
    });

    it('should save presets to localStorage when presets change', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: 'test',
            filters: [{ field: 'sku', operator: 'contains', value: 'PROD' }],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: [],
            activePresetId: null,
          },
        },
      });

      const saveCurrent = screen.getByText('+ Save Current');
      await user.click(saveCurrent);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Save Filter Preset')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter preset name...');
      await user.type(input, 'My Test Filter');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      // Check localStorage
      await waitFor(() => {
        const stored = localStorage.getItem('retailr-saved-filters');
        expect(stored).toBeTruthy();

        if (stored) {
          const presets = JSON.parse(stored);
          expect(presets).toHaveLength(1);
          expect(presets[0].name).toBe('My Test Filter');
        }
      });
    });

    it('should handle malformed localStorage data gracefully', () => {
      localStorage.setItem('retailr-saved-filters', 'invalid json');

      // Should not throw
      expect(() => {
        renderWithRedux(<SavedFilters />);
      }).not.toThrow();

      expect(screen.getByText('No saved filters yet')).toBeInTheDocument();
    });
  });

  describe('save current functionality', () => {
    it('should open dialog when "Save Current" is clicked', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />);

      const saveCurrent = screen.getByText('+ Save Current');
      await user.click(saveCurrent);

      expect(screen.getByText('Save Filter Preset')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter preset name...')).toBeInTheDocument();
    });

    it('should create new preset with entered name', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: 'test',
            filters: [{ field: 'sku', operator: 'contains', value: 'PROD' }],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: [],
            activePresetId: null,
          },
        },
      });

      const saveCurrent = screen.getByText('+ Save Current');
      await user.click(saveCurrent);

      const input = screen.getByPlaceholderText('Enter preset name...');
      await user.type(input, 'New Filter');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('New Filter')).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />);

      const saveCurrent = screen.getByText('+ Save Current');
      await user.click(saveCurrent);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByText('Save Filter Preset')).not.toBeInTheDocument();
    });

    it('should not create preset with empty name', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: [],
            activePresetId: null,
          },
        },
      });

      const saveCurrent = screen.getByText('+ Save Current');
      await user.click(saveCurrent);

      const input = screen.getByPlaceholderText('Enter preset name...');
      // Clear and try to save without entering name
      await user.clear(input);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      // Button should be disabled or action should not succeed
      expect(saveButton).toBeDisabled();
    });
  });

  describe('load preset functionality', () => {
    it('should load preset filters when preset name is clicked', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const presetButton = screen.getByRole('button', {
        name: 'Electronics Under $100',
      });
      await user.click(presetButton);

      // Should set active preset (class names are CSS modules)
      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: 'Electronics Under $100',
        });
        expect(button.className).toMatch(/active/);
      });
    });

    it('should call onLoad callback when preset is loaded', async () => {
      const user = userEvent.setup();
      const onLoad = vi.fn();

      renderWithRedux(<SavedFilters onLoad={onLoad} />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const presetButton = screen.getByRole('button', {
        name: 'Electronics Under $100',
      });
      await user.click(presetButton);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledWith(mockSavedFilters[0]);
      });
    });

    it('should update filters in Redux when preset is loaded', async () => {
      const user = userEvent.setup();

      const store = createMockStore({
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      render(
        <Provider store={store}>
          <SavedFilters />
        </Provider>
      );

      const presetButton = screen.getByRole('button', {
        name: 'Electronics Under $100',
      });
      await user.click(presetButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.filters.filters).toEqual(mockSavedFilters[0].filters);
        expect(state.filters.search).toBe(mockSavedFilters[0].search);
      });
    });
  });

  describe('delete preset functionality', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      // Confirmation should appear
      await waitFor(() => {
        expect(screen.getByText(/Delete Filter Preset/i)).toBeInTheDocument();
      });
    });

    it('should delete preset when confirmed', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getAllByRole('button', { name: 'Delete' });
      // Get the one in the dialog (second one since there's also a delete button for the preset)
      await user.click(confirmButton[confirmButton.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Electronics Under $100')).not.toBeInTheDocument();
      });
    });

    it('should not delete preset when cancelled', async () => {
      const user = userEvent.setup();

      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: null,
          },
        },
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
      // Get the one in the dialog (last one)
      await user.click(cancelButtons[cancelButtons.length - 1]);

      expect(screen.getByText('Electronics Under $100')).toBeInTheDocument();
    });

    it('should persist deletion to localStorage', async () => {
      const user = userEvent.setup();

      const mockData = JSON.stringify(mockSavedFilters);
      localStorage.setItem('retailr-saved-filters', mockData);

      renderWithRedux(<SavedFilters />);

      await waitFor(() => {
        expect(screen.getByText('Electronics Under $100')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      await user.click(deleteButtons[0]);

      const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
      // Get the one in the dialog (last one)
      await user.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        const stored = localStorage.getItem('retailr-saved-filters');
        expect(stored).toBeTruthy();

        if (stored) {
          const presets = JSON.parse(stored);
          expect(presets).toHaveLength(1);
          expect(presets[0].name).toBe('Recent Products');
        }
      });
    });
  });

  describe('CSS styling', () => {
    it('should apply correct CSS classes', () => {
      renderWithRedux(<SavedFilters />, {
        preloadedState: {
          filters: {
            search: '',
            filters: [],
            sort: null,
            page: 1,
          },
          savedFilters: {
            presets: mockSavedFilters,
            activePresetId: 'filter-1',
          },
        },
      });

      const title = screen.getByText('Saved Filters');
      const container = title.closest('div')?.parentElement;
      expect(container?.className).toMatch(/container/);
    });
  });
});
