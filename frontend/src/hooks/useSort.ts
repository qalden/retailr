import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSort, selectSort } from '@/store/slices/filterSlice';
import type { Sort } from '@/store/slices/filterSlice';

/**
 * Return type for the useSort hook
 */
interface UseSortReturn {
  sort: Sort | null;
  setSortBy: (field: string) => void;
  clearSort: () => void;
}

/**
 * Custom hook for managing sort state with toggle logic.
 *
 * Features:
 * - Toggle sort direction when clicking the same field
 * - Default to 'asc' when selecting a new field
 * - Clear sort to reset to null state
 * - Redux synchronization for global state
 *
 * Toggle Logic:
 * - Clicking a new field: sets sort to { field, direction: 'asc' }
 * - Clicking the same field: toggles between 'asc' and 'desc'
 *
 * @returns Object containing sort state and control methods
 *
 * @example
 * const { sort, setSortBy, clearSort } = useSort();
 *
 * // First click on 'price' - sets asc
 * setSortBy('price'); // { field: 'price', direction: 'asc' }
 *
 * // Second click on 'price' - toggles to desc
 * setSortBy('price'); // { field: 'price', direction: 'desc' }
 *
 * // Click on 'name' - new field, resets to asc
 * setSortBy('name'); // { field: 'name', direction: 'asc' }
 */
export function useSort(): UseSortReturn {
  const dispatch = useAppDispatch();
  const reduxSort = useAppSelector(selectSort);

  const [sort, setLocalSort] = useState<Sort | null>(reduxSort);

  // Sync Redux changes to local state
  useEffect(() => {
    setLocalSort(reduxSort);
  }, [reduxSort]);

  const setSortBy = useCallback((field: string): void => {
    setLocalSort((prev) => {
      let newSort: Sort;

      if (prev && prev.field === field) {
        // Same field: toggle direction
        newSort = {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      } else {
        // Different field: default to asc
        newSort = {
          field,
          direction: 'asc',
        };
      }

      dispatch(setSort(newSort));
      return newSort;
    });
  }, [dispatch]);

  const clearSort = useCallback((): void => {
    setLocalSort(null);
    dispatch(setSort(null));
  }, [dispatch]);

  return {
    sort,
    setSortBy,
    clearSort,
  };
}

export default useSort;
