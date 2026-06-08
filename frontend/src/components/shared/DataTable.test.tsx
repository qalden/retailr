import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type ColumnDef } from './DataTable';

// ─── Test Setup ───────────────────────────────────────────────────────────

const mockData = [
  { id: 1, name: 'Product A', price: 100 },
  { id: 2, name: 'Product B', price: 200 },
  { id: 3, name: 'Product C', price: 150 },
];

const basicColumns: ColumnDef[] = [
  { header: 'Name', key: 'name' },
  { header: 'Price', key: 'price' },
];

const sortableColumns: ColumnDef[] = [
  { header: 'Name', key: 'name', sortable: true },
  { header: 'Price', key: 'price', sortable: true },
];

const mixedColumns: ColumnDef[] = [
  { header: 'Name', key: 'name', sortable: true },
  { header: 'Price', key: 'price', sortable: false },
];

// ─── Tests ────────────────────────────────────────────────────────────────

describe('DataTable', () => {
  describe('basic rendering', () => {
    it('should render table with data', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render all rows from data', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
        />
      );

      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Product C')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={[]}
          loading={false}
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={[]}
          loading={true}
        />
      );

      // Should render skeleton loaders (5 empty rows)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should display error message', () => {
      const errorMsg = 'Failed to load data';
      render(
        <DataTable
          columns={basicColumns}
          data={[]}
          error={errorMsg}
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  describe('sortable columns', () => {
    it('should render sortable headers as buttons', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      const priceButton = screen.getByRole('button', { name: /Sort by Price/ });

      expect(nameButton).toBeInTheDocument();
      expect(priceButton).toBeInTheDocument();
    });

    it('should render non-sortable headers as text', () => {
      render(
        <DataTable
          columns={mixedColumns}
          data={mockData}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      expect(nameButton).toBeInTheDocument();

      // Price header should exist as text, not as a button
      const priceHeaders = screen.getAllByText('Price');
      expect(priceHeaders.length).toBeGreaterThan(0);
    });

    it('should call onSort callback when sortable header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          onSort={onSort}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      await user.click(nameButton);

      expect(onSort).toHaveBeenCalledWith('name');
    });

    it('should call onSort with correct field name for multi-word headers', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      const multiWordColumns: ColumnDef[] = [
        { header: 'Product Name', key: 'productName', sortable: true },
      ];

      render(
        <DataTable
          columns={multiWordColumns}
          data={mockData}
          onSort={onSort}
        />
      );

      const button = screen.getByRole('button', { name: /Sort by Product Name/ });
      await user.click(button);

      expect(onSort).toHaveBeenCalledWith('productName');
    });

    it('should not call onSort when non-sortable header is clicked', () => {
      const onSort = vi.fn();

      // We can't directly click a text node, so we test by verifying
      // that the non-sortable column doesn't have a button
      render(
        <DataTable
          columns={mixedColumns}
          data={mockData}
          onSort={onSort}
        />
      );

      // Price is not sortable, so there should only be 1 button (Name)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });

    it('should display ascending sort indicator for current sort field', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          sortField="name"
          sortOrder="asc"
        />
      );

      const nameButton = screen.getByRole('button', { name: /ascending/ });
      expect(nameButton).toBeInTheDocument();
      expect(nameButton.textContent).toContain('▲');
    });

    it('should display descending sort indicator for current sort field', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          sortField="price"
          sortOrder="desc"
        />
      );

      const priceButton = screen.getByRole('button', { name: /descending/ });
      expect(priceButton).toBeInTheDocument();
      expect(priceButton.textContent).toContain('▼');
    });

    it('should not display sort indicator for non-sorted column', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          sortField="name"
          sortOrder="asc"
        />
      );

      const priceButton = screen.getByRole('button', { name: /Sort by Price(?!\()|^Sort by Price$/ });
      expect(priceButton).toBeInTheDocument();
      // Price button should not contain sort indicators
      expect(priceButton.textContent).not.toContain('▲');
      expect(priceButton.textContent).not.toContain('▼');
    });

    it('should handle multiple sort clicks', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          onSort={onSort}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      const priceButton = screen.getByRole('button', { name: /Sort by Price/ });

      await user.click(nameButton);
      expect(onSort).toHaveBeenCalledWith('name');

      await user.click(priceButton);
      expect(onSort).toHaveBeenCalledWith('price');

      expect(onSort).toHaveBeenCalledTimes(2);
    });
  });

  describe('action buttons', () => {
    it('should render edit button when onEdit is provided', () => {
      const onEdit = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onEdit={onEdit}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /Edit row/ });
      expect(editButtons.length).toBe(mockData.length);
    });

    it('should render delete button when onDelete is provided', () => {
      const onDelete = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /Delete row/ });
      expect(deleteButtons.length).toBe(mockData.length);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onEdit={onEdit}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /Edit row/ });
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /Delete row/ });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not render action column when no action callbacks', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={mockData}
        />
      );

      const actionHeaderButtons = screen.queryAllByRole('button');
      // Should have no buttons (no edit/delete, and columns aren't sortable)
      expect(actionHeaderButtons.length).toBe(0);
    });
  });

  describe('custom render functions', () => {
    it('should use custom render function for column', () => {
      const customRender = vi.fn((value) => `$${value}`);

      const customColumns: ColumnDef[] = [
        { header: 'Name', key: 'name' },
        { header: 'Price', key: 'price', render: customRender },
      ];

      render(
        <DataTable
          columns={customColumns}
          data={mockData}
        />
      );

      expect(customRender).toHaveBeenCalledWith(100, mockData[0]);
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should preserve existing functionality with sortable columns', () => {
      const customRender = vi.fn((value) => `$${value}`);

      const customColumns: ColumnDef[] = [
        { header: 'Name', key: 'name', sortable: true },
        { header: 'Price', key: 'price', sortable: true, render: customRender },
      ];

      render(
        <DataTable
          columns={customColumns}
          data={mockData}
        />
      );

      // Should still render custom format
      expect(screen.getByText('$100')).toBeInTheDocument();

      // Should still have sortable headers
      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      expect(nameButton).toBeInTheDocument();
    });
  });

  describe('prop variations', () => {
    it('should handle undefined onSort gracefully', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          onSort={undefined}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name/ });
      expect(nameButton).toBeInTheDocument();
    });

    it('should handle null sortField and sortOrder', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          sortField={null}
          sortOrder={null}
          onSort={vi.fn()}
        />
      );

      const nameButton = screen.getByRole('button', { name: /Sort by Name(?!\()/ });
      expect(nameButton).toBeInTheDocument();
      // Should not show indicators
      expect(nameButton.textContent).not.toContain('▲');
      expect(nameButton.textContent).not.toContain('▼');
    });

    it('should work with sortable and sortOrder but no onSort', () => {
      render(
        <DataTable
          columns={sortableColumns}
          data={mockData}
          sortField="name"
          sortOrder="asc"
        />
      );

      const nameButton = screen.getByRole('button', { name: /ascending/ });
      expect(nameButton).toBeInTheDocument();
    });
  });
});
