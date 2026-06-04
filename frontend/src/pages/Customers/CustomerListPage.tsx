import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectAllCustomers,
  selectCustomersLoading,
  selectCustomersError,
} from '@/store/slices/customersSlice';
import { fetchCustomers, deleteCustomer } from '@/store/slices/customersSlice';
import type { Customer } from '@/types/domain';
import styles from './CustomerListPage.module.css';

/**
 * CustomerListPage: Displays a list of all customers with CRUD operations
 * - Fetches customers on mount
 * - Shows loading/error states
 * - Allows delete operations
 * - Provides navigation to create customer
 */
const CustomerListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const customers = useAppSelector(selectAllCustomers);
  const loading = useAppSelector(selectCustomersLoading);
  const error = useAppSelector(selectCustomersError);

  // Fetch customers on mount
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Handle delete button click
  const handleDelete = (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      dispatch(deleteCustomer(customer.id));
    }
  };

  // DataTable columns
  const columns: ColumnDef[] = [
    {
      header: 'Name',
      key: 'name',
    },
    {
      header: 'Email',
      key: 'email',
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (value: unknown) => (value ? String(value) : '-'),
    },
    {
      header: 'City',
      key: 'city',
      render: (value: unknown) => (value ? String(value) : '-'),
    },
  ];

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customers</h1>
          <button
            className={styles.createButton}
            onClick={() => navigate('/customers/create')}
          >
            Create Customer
          </button>
        </div>

        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={customers}
            idField="id"
            loading={loading}
            error={error}
            onDelete={(row) => handleDelete(row as Customer)}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default CustomerListPage;
