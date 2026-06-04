import React, { ReactNode } from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import styles from './DataTable.module.css';

export interface ColumnDef {
  header: string;
  key: string;
  render?: (value: unknown, row: unknown) => ReactNode;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: unknown[];
  /**
   * Field name used to identify each row uniquely.
   * Defaults to 'id'. Falls back to rowIndex if the field is missing.
   */
  idField?: string;
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: unknown) => void;
  onDelete?: (row: unknown) => void;
}

/**
 * DataTable component for displaying tabular data
 * Supports loading states, error handling, and action buttons
 */
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  idField = 'id',
  loading = false,
  error = null,
  onEdit,
  onDelete,
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
                {column.header}
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
            data.map((row, rowIndex) => {
              // Use stable unique identifier from row, fallback to rowIndex
              const rowId = (row as Record<string, unknown>)[idField]?.toString() ?? rowIndex;
              return (
              <tr key={rowId} className={styles.bodyRow}>
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
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
