import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearch, selectSearch } from '@/store/slices/filterSlice';
import { tokenizeSearch } from '@/utils/searchUtils';

/**
 * Return type for the useSearch hook
 */
interface UseSearchReturn {
  search: string;
  tokens: string[];
  setSearchValue: (value: string) => void;
  clearSearch: () => void;
}

const DEBOUNCE_DELAY = 500; // milliseconds

/**
 * Custom hook for managing debounced search state with Redux integration.
 *
 * Features:
 * - Debounced search updates (500ms delay to avoid excessive Redux dispatches)
 * - Automatic tokenization of search strings
 * - Redux synchronization for global state
 * - Clear method to reset search
 *
 * @returns Object containing search value, tokens, and control methods
 *
 * @example
 * const { search, tokens, setSearchValue, clearSearch } = useSearch();
 *
 * // When search changes:
 * // 1. Local state updates immediately
 * // 2. Tokens are computed immediately
 * // 3. Redux syncs after debounce delay
 */
export function useSearch(): UseSearchReturn {
  const dispatch = useAppDispatch();
  const reduxSearch = useAppSelector(selectSearch);

  const [search, setLocalSearch] = useState<string>(reduxSearch);
  const [tokens, setTokens] = useState<string[]>(() => tokenizeSearch(reduxSearch));

  // Track debounce timeout for cleanup
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute tokens whenever search changes
  useEffect(() => {
    setTokens(tokenizeSearch(search));
  }, [search]);

  // Sync Redux changes to local state
  useEffect(() => {
    setLocalSearch(reduxSearch);
  }, [reduxSearch]);

  // Debounced Redux sync
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce
    debounceTimeoutRef.current = setTimeout(() => {
      dispatch(setSearch(search));
      debounceTimeoutRef.current = null;
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when search changes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [search, dispatch]);

  const setSearchValue = useCallback((value: string): void => {
    setLocalSearch(value);
  }, []);

  const clearSearch = useCallback((): void => {
    setLocalSearch('');
    // Clear pending debounce and dispatch immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    dispatch(setSearch(''));
  }, [dispatch]);

  return {
    search,
    tokens,
    setSearchValue,
    clearSearch,
  };
}

export default useSearch;
