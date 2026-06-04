import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for navigating between pages
 * Displays previous/next buttons and current page information
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevClick = (): void => {
    if (canGoPrev) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = (): void => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.paginationContainer}>
      <button
        className={styles.button}
        onClick={handlePrevClick}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        Previous
      </button>

      <span className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={styles.button}
        onClick={handleNextClick}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
