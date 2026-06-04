import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAllCustomers, fetchCustomers } from '@/store/slices/customersSlice';
import styles from './CustomerSelect.module.css';

interface CustomerSelectProps {
  value: number;
  onChange: (customerId: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * CustomerSelect: Dropdown component for selecting customers
 * - Loads customers from Redux store
 * - Fetches customers on mount if not already loaded
 * - Renders as <select> with customer names
 * - Supports disabled state
 * - Keyboard accessible
 */
const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a customer',
}) => {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(selectAllCustomers);

  // Fetch customers on mount if empty
  useEffect(() => {
    if (customers.length === 0) {
      dispatch(fetchCustomers());
    }
  }, [dispatch, customers.length]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={styles.select}
      aria-label="Select customer"
    >
      <option value={0}>{placeholder}</option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>
          {customer.name} ({customer.email})
        </option>
      ))}
    </select>
  );
};

export default CustomerSelect;
