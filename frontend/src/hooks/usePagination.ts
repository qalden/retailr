import { useState, useCallback, useMemo } from 'react';

interface UsePaginationReturn {
  pageNumber: number;
  pageSize: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  totalPages: number;
}

/**
 * Custom hook for managing pagination state
 * @param totalItems - Total number of items to paginate
 * @param pageSize - Number of items per page (default: 10)
 * @returns Pagination state and methods
 */
export const usePagination = (
  totalItems: number,
  pageSize: number = 10
): UsePaginationReturn => {
  const [pageNumber, setPageNumber] = useState<number>(1);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const canGoNext = useMemo(
    () => pageNumber < totalPages,
    [pageNumber, totalPages]
  );

  const canGoPrev = useMemo(
    () => pageNumber > 1,
    [pageNumber]
  );

  const goToPage = useCallback((page: number): void => {
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    setPageNumber(clampedPage);
  }, [totalPages]);

  const nextPage = useCallback((): void => {
    if (canGoNext) {
      setPageNumber((prev) => prev + 1);
    }
  }, [canGoNext]);

  const prevPage = useCallback((): void => {
    if (canGoPrev) {
      setPageNumber((prev) => prev - 1);
    }
  }, [canGoPrev]);

  // Return object directly - memoized values inside are stable for dependency tracking
  return {
    pageNumber,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    totalPages,
  };
};

export default usePagination;
