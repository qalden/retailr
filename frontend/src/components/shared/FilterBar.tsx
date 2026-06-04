import React, { useState, useCallback } from 'react';
import styles from './FilterBar.module.css';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterDefinition {
  label: string;
  value: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterDefinition[];
  onFilterChange: (selectedFilters: Record<string, string | number | null>) => void;
}

/**
 * FilterBar component for managing multiple filter controls
 * Renders filter buttons or select dropdowns based on filter configuration
 * Tracks selected values and passes them back via callback
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
}) => {
  // Track selected filter values
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string | number | null>>(
    filters.reduce((acc, filter) => ({ ...acc, [filter.value]: null }), {})
  );

  /**
   * Handle filter change
   * Updates selected filters and calls the callback
   */
  const handleFilterChange = useCallback(
    (filterValue: string, optionValue: string | number | null): void => {
      setSelectedFilters((prev) => {
        const updated = { ...prev, [filterValue]: optionValue };
        onFilterChange(updated);
        return updated;
      });
    },
    [onFilterChange]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback((): void => {
    const cleared = filters.reduce((acc, filter) => ({ ...acc, [filter.value]: null }), {});
    setSelectedFilters(cleared);
    onFilterChange(cleared);
  }, [filters, onFilterChange]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Object.values(selectedFilters).some((value) => value !== null);

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        {filters.map((filter) => (
          <div key={filter.value} className={styles.filterControl}>
            <label htmlFor={`filter-${filter.value}`} className={styles.filterLabel}>
              {filter.label}
            </label>
            <select
              id={`filter-${filter.value}`}
              value={selectedFilters[filter.value]?.toString() ?? ''}
              onChange={(event) => {
                const newValue = event.target.value === '' ? null : event.target.value;
                handleFilterChange(filter.value, newValue);
              }}
              className={styles.filterSelect}
              aria-label={`Filter by ${filter.label}`}
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className={styles.clearButton}
          aria-label="Clear all filters"
          type="button"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;
