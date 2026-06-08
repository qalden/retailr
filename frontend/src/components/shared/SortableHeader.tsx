import React, { useCallback } from 'react';
import styles from './SortableHeader.module.css';

export interface SortableHeaderProps {
  label: string;
  sortable?: boolean;
  sortField?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  onSort?: (fieldName: string) => void;
}

/**
 * SortableHeader component for table column headers
 * Renders as a button when sortable, plain text otherwise
 *
 * @param label - Display text for the header
 * @param sortable - Whether this column is sortable (default: false)
 * @param sortField - Currently sorted field name
 * @param sortOrder - Current sort direction ('asc' or 'desc')
 * @param onSort - Callback when sort is requested, receives field name
 *
 * @example
 * <SortableHeader
 *   label="Price"
 *   sortable={true}
 *   sortField="price"
 *   sortOrder="asc"
 *   onSort={(field) => setSortBy(field)}
 * />
 */
export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortable = false,
  sortField = null,
  sortOrder = null,
  onSort,
}) => {
  // Derive field name from label (e.g., "Product Name" -> "productName")
  const deriveFieldName = (text: string): string => {
    return text
      .trim()
      .split(/\s+/)
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  };

  const fieldName = deriveFieldName(label);
  const isCurrentlySorted = sortField === fieldName;

  const handleClick = useCallback(() => {
    if (sortable && onSort) {
      onSort(fieldName);
    }
  }, [sortable, onSort, fieldName]);

  if (!sortable) {
    return <span className={styles.label}>{label}</span>;
  }

  const sortIndicator = isCurrentlySorted
    ? sortOrder === 'asc'
      ? '▲'
      : '▼'
    : '';

  return (
    <button
      className={`${styles.button} ${isCurrentlySorted ? styles.active : ''}`}
      onClick={handleClick}
      type="button"
      aria-label={`Sort by ${label}${isCurrentlySorted ? ` (${sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      <span className={styles.label}>{label}</span>
      {sortIndicator && (
        <span className={`${styles.indicator} ${styles[sortOrder || '']}`}>
          {sortIndicator}
        </span>
      )}
    </button>
  );
};

export default SortableHeader;
