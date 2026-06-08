import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectFilterState, loadFromURL } from '@/store/slices/filterSlice';
import { serializeParams, deserializeParams } from '@/utils/queryParams';
import type { Filter } from '@/utils/filterUtils';

/**
 * Custom hook for synchronizing filter state with URL query parameters.
 *
 * Features:
 * - Load filter state from URL on mount (one-time only)
 * - Sync filter state to URL when state changes
 * - Uses two separate useEffect hooks as specified
 * - Uses replace mode to prevent history duplication
 * - Handles invalid URL parameters gracefully
 *
 * URL Synchronization:
 * - First useEffect: Loads from URL on mount (dependency: [])
 * - Second useEffect: Syncs to URL when state changes (dependency: [filterState, setSearchParams])
 *
 * @example
 * // Inside a component wrapped by BrowserRouter:
 * function MyComponent() {
 *   useURLState();
 *   const { filters, addFilter } = useFilter();
 *
 *   // When filters change, URL updates automatically
 *   // On page refresh/navigation, URL parameters are restored
 * }
 */
export function useURLState(): void {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterState = useAppSelector(selectFilterState);

  // Track whether we've loaded from URL on mount
  const hasLoadedFromURLRef = useRef(false);

  // ─── Effect 1: Load from URL on mount (one-time) ────────────────────────
  useEffect(() => {
    // Only load once on mount
    if (hasLoadedFromURLRef.current) {
      return;
    }

    hasLoadedFromURLRef.current = true;

    // Convert searchParams to query string
    const queryString = searchParams.toString();

    if (queryString) {
      try {
        const params = deserializeParams(queryString);

        // Map SortOption (with 'order' field) to Sort (with 'direction' field)
        const sortState = params.sort
          ? { field: params.sort.field, direction: params.sort.order as 'asc' | 'desc' }
          : undefined;

        dispatch(
          loadFromURL({
            search: params.search || undefined,
            filters: params.filters.length > 0 ? params.filters : undefined,
            sort: sortState,
            page: params.page || undefined,
          })
        );
      } catch {
        // Silently ignore parsing errors - invalid URL params just don't load
      }
    }
  }, []); // Empty dependency array - only run on mount

  // ─── Effect 2: Sync state to URL when state changes ─────────────────────
  useEffect(() => {
    // Skip the initial mount (already handled by Effect 1)
    if (!hasLoadedFromURLRef.current) {
      return;
    }

    try {
      // Serialize current filter state to URL params
      // Map Sort (with 'direction' field) to SortOption (with 'order' field)
      const params = serializeParams({
        search: filterState.search,
        filters: filterState.filters as Filter[],
        page: filterState.page,
        size: 20, // Default page size
        ...(filterState.sort && {
          sort: {
            field: filterState.sort.field,
            order: filterState.sort.direction as 'asc' | 'desc',
          },
        }),
      });

      // Update URL with replace mode to avoid history duplication
      setSearchParams(new URLSearchParams(params), { replace: true });
    } catch {
      // Silently ignore serialization errors
    }
  }, [filterState, setSearchParams]);
}

export default useURLState;
