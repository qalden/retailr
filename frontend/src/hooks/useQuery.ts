import { useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import type { RootState, AppDispatch } from '@/store';
import type { AsyncThunkAction } from '@reduxjs/toolkit';

/**
 * Return type for the useQuery hook
 */
interface UseQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

/**
 * Redux async thunk with specific typing for pagination support
 * Accepts a page number parameter
 */
type PaginatedThunk<T> = (
  pageNumber: number
) => AsyncThunkAction<T, number, { state: RootState; dispatch: AppDispatch }>;

/**
 * Custom hook for fetching paginated data from Redux async thunks
 *
 * @template T - The type of data being fetched
 * @param thunk - Redux async thunk function that accepts a page number
 * @param page - Current page number (1-based)
 * @param dataSelector - Redux selector function to extract data from state
 * @param loadingSelector - Redux selector function to extract loading state
 * @param errorSelector - Redux selector function to extract error state
 * @param onSuccess - Optional callback fired when data loads successfully with the loaded data
 * @returns Object containing data, loading state, error state, and current page
 *
 * @example
 * ```typescript
 * const { data: products, loading, error, currentPage } = useQuery(
 *   fetchProducts,
 *   pageNumber,
 *   selectAllProducts,
 *   selectProductsLoading,
 *   selectProductsError,
 *   (data) => console.log("Products loaded:", data)
 * );
 * ```
 */
export const useQuery = <T,>(
  thunk: PaginatedThunk<T>,
  page: number,
  dataSelector: (state: RootState) => T | null,
  loadingSelector: (state: RootState) => boolean,
  errorSelector: (state: RootState) => string | null,
  onSuccess?: (data: T) => void
): UseQueryReturn<T> => {
  const dispatch = useAppDispatch();
  const onSuccessRef = useRef<((data: T) => void) | undefined>(onSuccess);

  // Select data, loading, and error from Redux state
  const data = useAppSelector(dataSelector);
  const loading = useAppSelector(loadingSelector);
  const error = useAppSelector(errorSelector);

  // Update the ref when onSuccess changes to avoid stale closure
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // Fetch data when page changes
  useEffect(() => {
    // Dispatch the thunk with the current page
    const dispatchPromise = dispatch(thunk(page));

    // Call onSuccess if provided and dispatch succeeds
    dispatchPromise.then(
      (result) => {
        // Only call onSuccess if action was fulfilled with payload
        if (result.meta?.requestStatus === 'fulfilled' && result.payload && onSuccessRef.current) {
          onSuccessRef.current(result.payload as T);
        }
      }
    ).catch(() => {
      // Silently handle errors - they're already in Redux state
    });
  }, [page, thunk, dispatch]);

  // Memoize return value to prevent unnecessary re-renders
  const result = useMemo(() => ({
    data: data ?? null,
    loading,
    error,
    currentPage: page,
  }), [data, loading, error, page]);

  return result;
};

/**
 * Basic usage: Combine this hook with Redux selectors:
 *
 * ```typescript
 * const { data: products, loading, error, currentPage } = useQuery(
 *   fetchProducts,
 *   pageNumber,
 *   selectAllProducts,
 *   selectProductsLoading,
 *   selectProductsError,
 *   (data) => console.log("Products loaded:", data)
 * );
 * ```
 */

export default useQuery;
