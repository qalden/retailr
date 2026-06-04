import React, { useCallback, useRef } from 'react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * SearchInput component with debounced onChange callback
 * Controlled input component - value prop controls the input
 * Debounces onChange calls by 1000ms to reduce API calls
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  // Track debounce timeout
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Handle input change with debouncing
   * Cancels previous timeout and sets a new one before calling onChange
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = event.target.value;

      // Cancel previous debounce timeout
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timeout
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, 1000);
    },
    [onChange]
  );

  /**
   * Cleanup timeout on unmount
   */
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <label htmlFor="search-input" className={styles.label}>
        <span className="visually-hidden">Search</span>
      </label>
      <div className={styles.inputWrapper}>
        <input
          id="search-input"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.input}
          aria-label="Search input"
        />
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
    </div>
  );
};

export default SearchInput;
