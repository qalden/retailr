import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import Skeleton from '@/components/shared/Skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectSelectedOrder,
  selectOrdersLoading,
  selectOrdersError,
} from '@/store/slices/ordersSlice';
import { fetchOrderById, confirmOrder, cancelOrder } from '@/store/slices/ordersSlice';
import styles from './OrderDetailPage.module.css';

/**
 * OrderDetailPage: Shows order details
 * - Reads params.id from React Router
 * - Fetches/shows order details
 * - Shows order number, customer, status, date, total
 * - Shows line items (table of products, quantities, prices)
 * - Shows order total (sum of line items)
 * - Confirm/Cancel buttons (if status is DRAFT)
 * - Dispatch appropriate thunks on action
 * - Wraps in MainLayout
 * - Uses theme tokens
 */
const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const order = useAppSelector(selectSelectedOrder);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);

  // Fetch order details on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(parseInt(id, 10)));
    }
  }, [id, dispatch]);

  // Handle confirm order
  const handleConfirmOrder = () => {
    if (!order) return;
    dispatch(confirmOrder(order.id));
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    if (!order) return;
    dispatch(cancelOrder(order.id));
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <Skeleton width={200} height={32} />
          </div>
          <div className={styles.content}>
            <Skeleton width="100%" height={400} />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.backButton}
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Not found state
  if (!order) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>Order not found</p>
            <button
              className={styles.backButton}
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString();
  const isDraft = order.status === 'DRAFT';

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Order #{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <button
            className={styles.backButton}
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </button>
        </div>

        {/* Order details section */}
        <div className={styles.detailsSection}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>Customer</label>
              <p className={styles.detailValue}>{order.customer.name}</p>
              <p className={styles.detailSubtext}>{order.customer.email}</p>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>Order Date</label>
              <p className={styles.detailValue}>{orderDate}</p>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>Status</label>
              <div className={styles.statusValue}>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>Total Amount</label>
              <p className={styles.detailValue}>${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Line items section */}
        <div className={styles.lineItemsSection}>
          <h2 className={styles.sectionTitle}>Line Items</h2>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.headerCell}>Product</th>
                  <th className={styles.headerCell}>Quantity</th>
                  <th className={styles.headerCell}>Unit Price</th>
                  <th className={styles.headerCell}>Line Total</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {order.lines.map((line) => (
                  <tr key={line.id} className={styles.tableRow}>
                    <td className={styles.cell}>
                      <span className={styles.productName}>Product {line.productId}</span>
                    </td>
                    <td className={styles.cell}>{line.quantity}</td>
                    <td className={styles.cell}>${line.unitPrice.toFixed(2)}</td>
                    <td className={`${styles.cell} ${styles.lineTotal}`}>
                      ${line.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order total */}
          <div className={styles.totalContainer}>
            <span className={styles.totalLabel}>Order Total:</span>
            <span className={styles.totalAmount}>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Action buttons (only show for DRAFT orders) */}
        {isDraft && (
          <div className={styles.actionsSection}>
            <h2 className={styles.sectionTitle}>Actions</h2>
            <div className={styles.buttonGroup}>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmOrder}
              >
                Confirm Order
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleCancelOrder}
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default OrderDetailPage;
