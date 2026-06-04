import React from 'react';
import type { OrderStatus } from '@/types/api';
import styles from './OrderStatusBadge.module.css';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

/**
 * OrderStatusBadge: Simple badge component for displaying order status
 * - Maps status to color: DRAFT (gray), CONFIRMED (blue), FULFILLED (green), CANCELLED (red)
 * - Displays status text
 * - Uses theme tokens
 */
const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusClass = (orderStatus: OrderStatus): string => {
    switch (orderStatus) {
      case 'DRAFT':
        return styles.statusDraft;
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'FULFILLED':
        return styles.statusFulfilled;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <span className={`${styles.badge} ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default OrderStatusBadge;
