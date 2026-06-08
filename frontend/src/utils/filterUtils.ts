/**
 * Pure utility functions for filtering objects by conditions.
 * Zero external dependencies.
 */

export type FilterOperator = 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Check if a single object matches a filter condition.
 * Pure function with no side effects.
 */
export function matchesFilter(obj: Record<string, unknown>, filter: Filter): boolean {
  const { field, operator, value } = filter;
  const fieldValue = obj[field];

  // Handle missing field
  if (fieldValue === undefined) {
    return false;
  }

  switch (operator) {
    case 'equals':
      return fieldValue === value;

    case 'contains': {
      // Convert both to strings and do case-insensitive comparison
      const str = String(fieldValue).toLowerCase();
      const searchStr = String(value).toLowerCase();
      return str.includes(searchStr);
    }

    case 'gte': {
      const numValue = Number(fieldValue);
      const numCompare = Number(value);
      return numValue >= numCompare;
    }

    case 'lte': {
      const numValue = Number(fieldValue);
      const numCompare = Number(value);
      return numValue <= numCompare;
    }

    case 'gt': {
      const numValue = Number(fieldValue);
      const numCompare = Number(value);
      return numValue > numCompare;
    }

    case 'lt': {
      const numValue = Number(fieldValue);
      const numCompare = Number(value);
      return numValue < numCompare;
    }

    case 'in': {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.includes(fieldValue);
    }

    default:
      return false;
  }
}

/**
 * Apply multiple filters to an array of objects using AND logic.
 * Pure function with no side effects.
 */
export function applyFilters<T extends Record<string, unknown>>(
  items: T[],
  filters: Filter[]
): T[] {
  // Empty filters means no filtering
  if (filters.length === 0) {
    return items;
  }

  return items.filter((item) => {
    // ALL filters must match (AND logic)
    return filters.every((filter) => matchesFilter(item, filter));
  });
}
