import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import OrderForm from '@/components/orders/OrderForm';
import { useAppDispatch, useAppSelector } from '@/store';
import { createOrder, selectOrdersError } from '@/store/slices/ordersSlice';
import type { OrderFormSchema } from '@/utils/validators';
import styles from './OrderCreatePage.module.css';

/**
 * OrderCreatePage: Order creation page
 * - Multi-step form (or single form with sections):
 *   - Step 1: Select customer
 *   - Step 2: Add line items (product, quantity, unit price)
 *   - Step 3: Review and confirm
 * - Renders OrderForm component
 * - On submit: dispatches createOrder thunk
 * - Navigates to /orders on success
 * - Wraps in MainLayout
 * - Uses theme tokens
 */
const OrderCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const error = useAppSelector(selectOrdersError);

  // Local state for form submission result
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form submit
  const handleSubmit = async (data: OrderFormSchema) => {
    setSubmitError(null);

    try {
      // Dispatch create order thunk
      const result = await dispatch(createOrder(data)).unwrap();

      // Navigate to order detail page on success
      if (result?.id) {
        navigate(`/orders/${result.id}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setSubmitError(errorMessage);
    }
  };

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Order</h1>
          <p className={styles.subtitle}>Fill in the details to create a new order</p>
        </div>

        {submitError && (
          <div className={styles.errorMessage}>
            {submitError}
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.formContainer}>
          <OrderForm
            mode="create"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderCreatePage;
