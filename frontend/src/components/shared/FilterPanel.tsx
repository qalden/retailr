import React, { useState, useCallback } from 'react';
import type { Filter } from '../../utils/filterUtils';
import type { FilterDefinition } from '../../utils/filterConfig';
import styles from './FilterPanel.module.css';

interface FilterPanelProps {
  filters: Filter[];
  filterDefinitions: FilterDefinition[];
  onApply: (filters: Filter[]) => void;
  onCancel: () => void;
}

/**
 * FilterPanel component
 * Renders filter inputs based on FilterDefinition array
 * Supports text, select, date-range, and number-range filters with dynamic add/remove functionality
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterDefinitions,
  onApply,
  onCancel,
}) => {
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters);

  /**
   * Handle filter field change
   */
  const handleFieldChange = useCallback((index: number, field: string): void => {
    setLocalFilters((prev) => {
      const updated = [...prev];
      const newDefinition = filterDefinitions.find((def) => def.field === field);
      if (newDefinition) {
        updated[index] = {
          field,
          operator: newDefinition.operators[0] as any,
          value: '',
        };
      }
      return updated;
    });
  }, [filterDefinitions]);

  /**
   * Handle filter operator change
   */
  const handleOperatorChange = useCallback((index: number, operator: string): void => {
    setLocalFilters((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        operator: operator as any,
      };
      return updated;
    });
  }, []);

  /**
   * Handle filter value change
   */
  const handleValueChange = useCallback((index: number, value: string): void => {
    setLocalFilters((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        value,
      };
      return updated;
    });
  }, []);

  /**
   * Remove a filter row
   */
  const handleRemoveFilter = useCallback((index: number): void => {
    setLocalFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Add a new filter with first definition as default
   */
  const handleAddFilter = useCallback((): void => {
    if (filterDefinitions.length > 0) {
      const firstDef = filterDefinitions[0];
      const newFilter: Filter = {
        field: firstDef.field,
        operator: firstDef.operators[0] as any,
        value: '',
      };
      setLocalFilters((prev) => [...prev, newFilter]);
    }
  }, [filterDefinitions]);

  /**
   * Get filter definition for a field
   */
  const getFilterDefinition = useCallback(
    (field: string): FilterDefinition | undefined => {
      return filterDefinitions.find((def) => def.field === field);
    },
    [filterDefinitions]
  );

  /**
   * Render input based on filter type
   */
  const renderValueInput = (filter: Filter, index: number): React.ReactNode => {
    const definition = getFilterDefinition(filter.field);
    if (!definition) return null;

    switch (definition.type) {
      case 'select':
        return (
          <select
            value={String(filter.value || '')}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className={styles.valueSelect}
            aria-label={`Value for ${definition.label}`}
          >
            <option value="">Select option</option>
            {definition.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(filter.value || '')}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className={styles.valueInput}
            aria-label={`Value for ${definition.label}`}
          />
        );

      case 'number':
      case 'range':
        return (
          <input
            type="number"
            value={String(filter.value || '')}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className={styles.valueInput}
            placeholder="Filter value"
            aria-label={`Value for ${definition.label}`}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={String(filter.value || '')}
            onChange={(e) => handleValueChange(index, e.target.value)}
            className={styles.valueInput}
            placeholder="Filter value"
            aria-label={`Value for ${definition.label}`}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Filters</h3>

      <div className={styles.filtersContainer}>
        {localFilters.map((filter, index) => {
          const definition = getFilterDefinition(filter.field);

          return (
            <div key={`${index}-${filter.field}`} className={styles.filterRow}>
              {/* Field Select */}
              <select
                value={filter.field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                className={styles.fieldSelect}
                aria-label="Filter field"
              >
                <option value="">Select field</option>
                {filterDefinitions.map((def) => (
                  <option key={def.field} value={def.field}>
                    {def.label}
                  </option>
                ))}
              </select>

              {/* Operator Select */}
              {definition && (
                <select
                  value={filter.operator}
                  onChange={(e) => handleOperatorChange(index, e.target.value)}
                  className={styles.operatorSelect}
                  aria-label="Filter operator"
                >
                  {definition.operators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              )}

              {/* Value Input */}
              {definition && renderValueInput(filter, index)}

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFilter(index)}
                className={styles.removeButton}
                type="button"
                aria-label="✕"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Filter Button */}
      <button
        onClick={handleAddFilter}
        className={styles.addButton}
        type="button"
      >
        + Add Filter
      </button>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={() => onApply(localFilters)}
          className={styles.applyButton}
          type="button"
        >
          Apply Filters
        </button>
        <button
          onClick={onCancel}
          className={styles.cancelButton}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
