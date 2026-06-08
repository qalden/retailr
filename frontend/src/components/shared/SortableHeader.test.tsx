import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortableHeader } from './SortableHeader';

describe('SortableHeader', () => {
  describe('non-sortable header', () => {
    it('should render as text when not sortable', () => {
      render(
        <SortableHeader
          label="Name"
          sortable={false}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('sortable header', () => {
    it('should render as button when sortable', () => {
      render(
        <SortableHeader
          label="Name"
          sortable={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Name');
    });

    it('should call onSort when clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <SortableHeader
          label="Name"
          sortable={true}
          onSort={onSort}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onSort).toHaveBeenCalledWith('name');
    });

    it('should derive field name from label', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();

      render(
        <SortableHeader
          label="Product Name"
          sortable={true}
          onSort={onSort}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onSort).toHaveBeenCalledWith('productName');
    });

    it('should show ascending indicator when sorted ascending', () => {
      render(
        <SortableHeader
          label="Name"
          sortable={true}
          sortField="name"
          sortOrder="asc"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('▲');
    });

    it('should show descending indicator when sorted descending', () => {
      render(
        <SortableHeader
          label="Name"
          sortable={true}
          sortField="name"
          sortOrder="desc"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('▼');
    });

    it('should not show indicator when not currently sorted', () => {
      render(
        <SortableHeader
          label="Name"
          sortable={true}
          sortField="price"
          sortOrder="asc"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Name');
      expect(button).not.toHaveTextContent('▲');
      expect(button).not.toHaveTextContent('▼');
    });
  });
});
