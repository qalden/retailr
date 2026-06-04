import { useState, useMemo } from 'react';

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

  const canGoNext = useMemo(() => {
    return pageNumber < totalPages;
  }, [pageNumber, totalPages]);

  const canGoPrev = useMemo(() => {
    return pageNumber > 1;
  }, [pageNumber]);

  const goToPage = (page: number): void => {
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    setPageNumber(clampedPage);
  };

  const nextPage = (): void => {
    if (canGoNext) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const prevPage = (): void => {
    if (canGoPrev) {
      setPageNumber((prev) => prev - 1);
    }
  };

  return useMemo(
    () => ({
      pageNumber,
      pageSize,
      goToPage,
      nextPage,
      prevPage,
      canGoNext,
      canGoPrev,
      totalPages,
    }),
    [pageNumber, pageSize, canGoNext, canGoPrev, totalPages]
  );
};

export default usePagination;
