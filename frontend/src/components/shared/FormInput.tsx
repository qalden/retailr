import React from 'react';
import styles from './FormInput.module.css';

/**
 * FormInput: Reusable form field component
 * - Renders label with htmlFor attribute
 * - Displays input field with various types (text, email, tel, number)
 * - Shows error message below input if provided
 * - Includes focus state with blue border
 * - Fully accessible with proper label association
 */

interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  id,
  disabled = false,
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={styles.container}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
      />
      {error && (
        <span className={styles.errorMessage}>{error}</span>
      )}
    </div>
  );
};

export default FormInput;
