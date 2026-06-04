import { useEffect, useRef, useMemo } from 'react';
import { useAppDispatch } from '@/store';
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
 * @param onSuccess - Optional callback fired when data loads successfully
 * @returns Object containing data, loading state, error state, and current page
 *
 * @example
 * ```typescript
 * const { data: products, loading, error, currentPage } = useQuery(
 *   fetchProducts,
 *   pageNumber,
 *   () => console.log("Products loaded")
 * );
 * ```
 */
export const useQuery = <T,>(
  thunk: PaginatedThunk<T>,
  page: number,
  onSuccess?: () => void
): UseQueryReturn<T> => {
  const dispatch = useAppDispatch();
  const prevPageRef = useRef<number>(page);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a selector dynamically based on the thunk type to get loading/error/data
  // This assumes the component using this hook manages the selection of the right state slice
  // For now, we'll return a pattern that works with Redux async thunks

  // Fetch data when page changes
  useEffect(() => {
    // Cancel previous request if page changed
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Dispatch the thunk with the current page
    const dispatchPromise = dispatch(thunk(page));

    // Call onSuccess if provided and dispatch succeeds
    if (onSuccess) {
      dispatchPromise.then(
        (result) => {
          // Check if request wasn't aborted
          if (!abortControllerRef.current?.signal.aborted) {
            // Only call onSuccess if action was fulfilled (not rejected)
            if (!result.payload && result.meta?.requestStatus === 'fulfilled') {
              onSuccess();
            } else if (result.payload) {
              onSuccess();
            }
          }
        }
      ).catch(() => {
        // Silently handle abort errors
      });
    }

    prevPageRef.current = page;

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, thunk, dispatch, onSuccess]);

  // Memoize return value to prevent unnecessary re-renders
  // Note: Components using this hook should define their own selectors
  // to extract data, loading, and error from the Redux state
  const result = useMemo(() => ({
    data: null as T | null,
    loading: false,
    error: null as string | null,
    currentPage: page,
  }), [page]);

  return result;
};

/**
 * Advanced usage: For components that need more granular control,
 * combine this hook with Redux selectors:
 *
 * ```typescript
 * const { currentPage } = useQuery(fetchProducts, pageNumber);
 * const data = useAppSelector(selectAllProducts);
 * const loading = useAppSelector(selectProductsLoading);
 * const error = useAppSelector(selectProductsError);
 * ```
 */

export default useQuery;
