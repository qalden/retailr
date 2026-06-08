import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import SearchInput from '@/components/shared/SearchInput';
import FilterPanel from '@/components/shared/FilterPanel';
import SavedFilters from '@/components/shared/SavedFilters';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectAllOrders,
  selectOrdersLoading,
  selectOrdersError,
} from '@/store/slices/ordersSlice';
import { fetchOrders, deleteOrder } from '@/store/slices/ordersSlice';
import { useSearch } from '@/hooks/useSearch';
import { useFilter } from '@/hooks/useFilter';
import { useSort } from '@/hooks/useSort';
import { useURLState } from '@/hooks/useURLState';
import { applyFilters } from '@/utils/filterUtils';
import { matchesSearch } from '@/utils/searchUtils';
import { sortData } from '@/utils/sortData';
import { ORDER_FILTERS } from '@/utils/filterConfig';
import type { Order } from '@/types/domain';
import styles from './OrderListPage.module.css';

/**
 * OrderListPage: Displays a list of all orders with CRUD operations
 * - Dispatches fetchOrders() thunk on mount
 * - Displays orders in DataTable
 * - Columns: orderNumber, customer, status (with badge), total, date
 * - Edit/Delete actions
 * - Shows Skeleton while loading
 * - Shows error message on fail
 * - Wraps in MainLayout
 * - Uses theme tokens
 * - Integrates search, filter, and sort functionality
 */
const OrderListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const orders = useAppSelector(selectAllOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const { subscribed: wsSubscribed } = useOrderSubscription();

  // Search, filter, sort hooks
  const { search, tokens, setSearchValue } = useSearch();
  const { filters, setAllFilters } = useFilter();
  const { sort, setSortBy } = useSort();
  useURLState(); // Sync to URL

  // Local state for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Handle edit button click
  const handleEdit = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  // Handle delete button click
  const handleDelete = (order: Order) => {
    setSelectedOrder(order);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!selectedOrder) return;
    dispatch(deleteOrder(selectedOrder.id));
    setDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  // Apply transformations in order: filters → search → sort
  let displayData = orders;
  displayData = applyFilters(displayData, filters);
  displayData = displayData.filter((item) =>
    matchesSearch(item, tokens, ['orderNumber', 'status'])
  );
  if (sort) {
    displayData = sortData(displayData, sort.field, sort.direction);
  }

  // DataTable columns (all sortable)
  const columns: ColumnDef[] = [
    {
      header: 'Order #',
      key: 'orderNumber',
      sortable: true,
      render: (value) => `#${value}`,
    },
    {
      header: 'Customer',
      key: 'customer.name',
      sortable: true,
      render: (_, row) => (row as Order).customer.name,
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (value) => <OrderStatusBadge status={value as Order['status']} />,
    },
    {
      header: 'Total',
      key: 'totalAmount',
      sortable: true,
      render: (value) => `$${(value as number).toFixed(2)}`,
    },
    {
      header: 'Date',
      key: 'createdAt',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Orders</h1>
          <div className={styles.headerRight}>
            {wsSubscribed && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                <span className={styles.liveText}>Live Updates</span>
              </div>
            )}
            <button
              className={styles.createButton}
              onClick={() => navigate('/orders/create')}
            >
              Create Order
            </button>
          </div>
        </div>

        {/* Search Input */}
        <SearchInput value={search} onChange={setSearchValue} placeholder="Search by Order # or Status..." />

        {/* Filter Controls */}
        <div className={styles.filterControls}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            Filters {filters.length > 0 && `(${filters.length})`}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <FilterPanel
            filters={filters}
            filterDefinitions={ORDER_FILTERS}
            onApply={(newFilters) => {
              setAllFilters(newFilters);
              setShowFilterPanel(false);
            }}
            onCancel={() => setShowFilterPanel(false)}
          />
        )}

        {/* Saved Filters */}
        <SavedFilters />

        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={displayData}
            loading={loading}
            error={error}
            onEdit={(row) => handleEdit(row as Order)}
            onDelete={(row) => handleDelete(row as Order)}
            onSort={(field) => setSortBy(field)}
          />
        </div>

        {/* Delete confirmation modal */}
        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Delete"
        >
          <div className={styles.deleteForm}>
            {selectedOrder && (
              <>
                <p className={styles.deleteMessage}>
                  Are you sure you want to delete order <strong>#{selectedOrder.orderNumber}</strong>?
                </p>
                <div className={styles.buttonGroup}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default OrderListPage;
