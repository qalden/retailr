import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilters, selectFilters } from '@/store/slices/filterSlice';
import type { Filter } from '@/utils/filterUtils';

/**
 * Return type for the useFilter hook
 */
interface UseFilterReturn {
  filters: Filter[];
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  setAllFilters: (filters: Filter[]) => void;
  clearFilters: () => void;
}

/**
 * Custom hook for managing filter state with Redux integration.
 *
 * Features:
 * - Add filters to the list (append mode)
 * - Remove filters by index
 * - Replace all filters at once
 * - Clear all filters
 * - Redux synchronization for global state
 *
 * @returns Object containing filter array and control methods
 *
 * @example
 * const { filters, addFilter, removeFilter, clearFilters } = useFilter();
 *
 * // Add a new filter
 * addFilter({ field: 'price', operator: 'gte', value: 100 });
 *
 * // Remove filter at index 0
 * removeFilter(0);
 *
 * // Clear all filters
 * clearFilters();
 */
export function useFilter(): UseFilterReturn {
  const dispatch = useAppDispatch();
  const reduxFilters = useAppSelector(selectFilters);

  const [filters, setLocalFilters] = useState<Filter[]>(reduxFilters);

  // Sync Redux changes to local state
  useEffect(() => {
    setLocalFilters(reduxFilters);
  }, [reduxFilters]);

  const addFilter = useCallback((filter: Filter): void => {
    setLocalFilters((prev) => {
      const updated = [...prev, filter];
      dispatch(setFilters(updated));
      return updated;
    });
  }, [dispatch]);

  const removeFilter = useCallback((index: number): void => {
    setLocalFilters((prev) => {
      // Check bounds
      if (index < 0 || index >= prev.length) {
        return prev;
      }

      const updated = prev.filter((_, i) => i !== index);
      dispatch(setFilters(updated));
      return updated;
    });
  }, [dispatch]);

  const setAllFilters = useCallback((newFilters: Filter[]): void => {
    setLocalFilters(newFilters);
    dispatch(setFilters(newFilters));
  }, [dispatch]);

  const clearFilters = useCallback((): void => {
    setLocalFilters([]);
    dispatch(setFilters([]));
  }, [dispatch]);

  return {
    filters,
    addFilter,
    removeFilter,
    setAllFilters,
    clearFilters,
  };
}

export default useFilter;
