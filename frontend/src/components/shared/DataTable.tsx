import React, { ReactNode } from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import SortableHeader from './SortableHeader';
import styles from './DataTable.module.css';

export interface ColumnDef {
  header: string;
  key: string;
  sortable?: boolean;
  render?: (value: unknown, row: unknown) => ReactNode;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: unknown[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: unknown) => void;
  onDelete?: (row: unknown) => void;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  onSort?: (fieldName: string) => void;
}

/**
 * DataTable component for displaying tabular data
 * Supports loading states, error handling, action buttons, and sortable columns
 */
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  sortField = null,
  sortOrder = null,
  onSort,
}) => {
  // Show error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return <EmptyState title="No data" description="No records found." />;
  }

  const hasActions = onEdit || onDelete;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {columns.map((column) => (
              <th key={column.key} className={styles.headerCell}>
                <SortableHeader
                  label={column.header}
                  sortable={column.sortable}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
            ))}
            {hasActions && (
              <th className={styles.headerCell} aria-label="Actions">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Show skeleton loading rows
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className={styles.bodyRow}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className={styles.bodyCell}>
                    <Skeleton height={24} />
                  </td>
                ))}
                {hasActions && (
                  <td className={styles.bodyCell}>
                    <Skeleton height={24} width={80} />
                  </td>
                )}
              </tr>
            ))
          ) : (
            // Show actual data rows
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.bodyRow}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className={styles.bodyCell}>
                    {column.render
                      ? column.render(
                          (row as Record<string, unknown>)[column.key],
                          row
                        )
                      : ((row as Record<string, unknown>)[column.key] as ReactNode)}
                  </td>
                ))}
                {hasActions && (
                  <td className={styles.bodyCell}>
                    <div className={styles.actionButtons}>
                      {onEdit && (
                        <button
                          className={styles.editButton}
                          onClick={() => onEdit(row)}
                          aria-label="Edit row"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className={styles.deleteButton}
                          onClick={() => onDelete(row)}
                          aria-label="Delete row"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
