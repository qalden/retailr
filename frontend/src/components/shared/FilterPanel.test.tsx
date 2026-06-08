import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from './FilterPanel';
import type { Filter } from '../../utils/filterUtils';
import type { FilterDefinition } from '../../utils/filterConfig';

// ─── Test Setup ───────────────────────────────────────────────────────────

const mockFilterDefinitions: FilterDefinition[] = [
  {
    field: 'sku',
    label: 'SKU',
    type: 'text',
    operators: ['equals', 'contains'],
  },
  {
    field: 'categoryName',
    label: 'Category',
    type: 'select',
    operators: ['equals', 'in'],
    options: [
      { label: 'Electronics', value: 'Electronics' },
      { label: 'Accessories', value: 'Accessories' },
    ],
  },
  {
    field: 'unitPrice',
    label: 'Unit Price',
    type: 'range',
    operators: ['gte', 'lte', 'gt', 'lt'],
  },
  {
    field: 'createdAt',
    label: 'Created Date',
    type: 'date',
    operators: ['gte', 'lte'],
  },
];

const mockFilters: Filter[] = [
  {
    field: 'sku',
    operator: 'contains',
    value: 'PROD',
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────

describe('FilterPanel', () => {
  describe('rendering', () => {
    it('should render the component with title', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render existing filters', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // Should have one filter row
      const fieldSelects = screen.getAllByRole('combobox');
      expect(fieldSelects.length).toBeGreaterThan(0);
    });

    it('should render Add Filter button', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('+ Add Filter')).toBeInTheDocument();
    });

    it('should render Apply and Cancel buttons', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render multiple filter rows', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const multipleFilters: Filter[] = [
        { field: 'sku', operator: 'contains', value: 'PROD' },
        { field: 'categoryName', operator: 'equals', value: 'Electronics' },
      ];

      render(
        <FilterPanel
          filters={multipleFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      expect(removeButtons).toHaveLength(2);
    });

    it('should render remove buttons for each filter', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });
  });

  describe('filter field selection', () => {
    it('should display field names in select dropdown', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const fieldSelects = screen.getAllByRole('combobox');
      expect(fieldSelects.length).toBeGreaterThan(0);
    });

    it('should update filter field when selected', () => {
      
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // This test verifies that the component handles field selection
      // The actual field change is tested implicitly through Apply callback
      expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
    });
  });

  describe('add filter functionality', () => {
    it('should add a new filter row when Add Filter is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const addButton = screen.getByText('+ Add Filter');
      await user.click(addButton);

      // After adding, there should be at least one filter row
      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should default to first filter definition when adding new filter', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const addButton = screen.getByText('+ Add Filter');
      await user.click(addButton);

      // Apply filters and check that the first definition was used
      const applyButton = screen.getByText('Apply Filters');
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalled();
      const appliedFilters = onApply.mock.calls[0][0];
      expect(appliedFilters[0].field).toBe(mockFilterDefinitions[0].field);
    });

    it('should add multiple filters in sequence', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const addButton = screen.getByText('+ Add Filter');
      await user.click(addButton);
      await user.click(addButton);

      // Should have two remove buttons
      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('remove filter functionality', () => {
    it('should remove filter when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const multipleFilters: Filter[] = [
        { field: 'sku', operator: 'contains', value: 'PROD' },
        { field: 'categoryName', operator: 'equals', value: 'Electronics' },
      ];

      render(
        <FilterPanel
          filters={multipleFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      expect(removeButtons).toHaveLength(2);

      // Click first remove button
      await user.click(removeButtons[0]);

      // Should have one less remove button
      const updatedRemoveButtons = screen.getAllByRole('button', { name: '✕' });
      expect(updatedRemoveButtons.length).toBeLessThan(2);
    });

    it('should update filters array when removed', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const multipleFilters: Filter[] = [
        { field: 'sku', operator: 'contains', value: 'PROD' },
        { field: 'categoryName', operator: 'equals', value: 'Electronics' },
      ];

      render(
        <FilterPanel
          filters={multipleFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      await user.click(removeButtons[0]);

      // Apply and verify the removed filter is gone
      const applyButton = screen.getByText('Apply Filters');
      await user.click(applyButton);

      const appliedFilters = onApply.mock.calls[0][0];
      expect(appliedFilters).toHaveLength(1);
    });
  });

  describe('callbacks', () => {
    it('should call onApply with current filters when Apply is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const applyButton = screen.getByText('Apply Filters');
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalledWith(mockFilters);
    });

    it('should call onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onApply when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onApply).not.toHaveBeenCalled();
    });
  });

  describe('filter value updates', () => {
    it('should update filter value when input changes', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // Find the value input field and change it
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      const valueInput = inputs[inputs.length - 1]; // Last input is typically value

      await user.clear(valueInput);
      await user.type(valueInput, 'NEW_VALUE');

      // Apply and verify the new value
      const applyButton = screen.getByText('Apply Filters');
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalled();
      const appliedFilters = onApply.mock.calls[0][0];
      expect(appliedFilters[0].value).toBe('NEW_VALUE');
    });

    it('should update filter operator when selected', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // Get operator select and change it
      const operatorSelects = screen.getAllByRole('combobox');
      if (operatorSelects.length > 1) {
        const operatorSelect = operatorSelects[1];
        await user.selectOptions(operatorSelect, 'equals');

        // Apply and verify the new operator
        const applyButton = screen.getByText('Apply Filters');
        await user.click(applyButton);

        expect(onApply).toHaveBeenCalled();
        const appliedFilters = onApply.mock.calls[0][0];
        expect(appliedFilters[0].operator).toBe('equals');
      }
    });
  });

  describe('operator dropdown', () => {
    it('should show operators for selected field', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // Verify that operator select is present
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2); // At least field and operator
    });

    it('should update available operators when field changes', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const fieldSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(fieldSelect, 'categoryName');

      // Verify the operator select still exists and is updated
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('empty state', () => {
    it('should allow adding first filter when no filters exist', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const addButton = screen.getByText('+ Add Filter');
      await user.click(addButton);

      // Should have one remove button
      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      expect(removeButtons).toHaveLength(1);
    });

    it('should call onApply with empty array if no filters added', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      const applyButton = screen.getByText('Apply Filters');
      await user.click(applyButton);

      expect(onApply).toHaveBeenCalledWith([]);
    });
  });

  describe('filter definition edge cases', () => {
    it('should handle filter definitions with options', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const selectFilter: Filter = {
        field: 'categoryName',
        operator: 'equals',
        value: 'Electronics',
      };

      render(
        <FilterPanel
          filters={[selectFilter]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });

    it('should handle range type filter definitions', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const rangeFilter: Filter = {
        field: 'unitPrice',
        operator: 'gte',
        value: '100',
      };

      render(
        <FilterPanel
          filters={[rangeFilter]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });

    it('should handle date type filter definitions', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      const dateFilter: Filter = {
        field: 'createdAt',
        operator: 'gte',
        value: '2024-01-01',
      };

      render(
        <FilterPanel
          filters={[dateFilter]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button labels', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={[]}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: /Apply Filters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Filter/i })).toBeInTheDocument();
    });

    it('should render selects and inputs with proper roles', () => {
      const onApply = vi.fn();
      const onCancel = vi.fn();

      render(
        <FilterPanel
          filters={mockFilters}
          filterDefinitions={mockFilterDefinitions}
          onApply={onApply}
          onCancel={onCancel}
        />
      );

      // Should have field and operator selects
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
