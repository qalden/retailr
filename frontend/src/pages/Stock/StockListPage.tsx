import React, { useEffect, useState } from 'react';
import MainLayout from '@/pages/Layout/MainLayout';
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import Skeleton from '@/components/shared/Skeleton';
import AlertBanner from '@/components/stock/AlertBanner';
import StockAdjustForm from '@/components/stock/StockAdjustForm';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectAllStockItems,
  selectStockLoading,
  selectStockError,
  selectUnacknowledgedAlerts,
  fetchStock,
} from '@/store/slices/stockSlice';
import type { StockItem, Product } from '@/types/domain';
import { axiosClient } from '@/api/axiosClient';
import styles from './StockListPage.module.css';

interface StockItemWithDetails extends StockItem {
  productName?: string;
  productSku?: string;
  warehouseName?: string;
}

const StockListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectAllStockItems);
  const loading = useAppSelector(selectStockLoading);
  const error = useAppSelector(selectStockError);
  const alerts = useAppSelector(selectUnacknowledgedAlerts);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItemWithDetails | null>(null);
  const [itemsWithDetails, setItemsWithDetails] = useState<StockItemWithDetails[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchStock());
  }, [dispatch]);

  useEffect(() => {
    const enrichStockItems = async () => {
      if (items.length === 0) {
        setItemsWithDetails([]);
        return;
      }

      setDetailsLoading(true);
      try {
        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const [productRes, warehouseRes] = await Promise.all([
                axiosClient.get<Product>(`/products/${item.productId}`),
                axiosClient.get<{ name: string }>(`/warehouses/${item.warehouseId}`),
              ]);

              return {
                ...item,
                productName: productRes.data.name,
                productSku: productRes.data.sku,
                warehouseName: warehouseRes.data.name,
              };
            } catch {
              return {
                ...item,
                productName: `Product ${item.productId}`,
                productSku: '',
                warehouseName: `Warehouse ${item.warehouseId}`,
              };
            }
          })
        );
        setItemsWithDetails(enrichedItems);
      } finally {
        setDetailsLoading(false);
      }
    };

    enrichStockItems();
  }, [items]);

  const handleAdjustStock = (item: StockItemWithDetails) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };

  const handleModalClose = () => {
    setAdjustModalOpen(false);
    setSelectedItem(null);
  };

  const handleAdjustmentSuccess = () => {
    dispatch(fetchStock());
  };

  const columns: ColumnDef[] = [
    { header: 'SKU', key: 'productSku' },
    { header: 'Product', key: 'productName' },
    { header: 'Warehouse', key: 'warehouseName' },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (value) => <span className={styles.cellValue}>{value as number}</span>,
    },
    {
      header: 'Reserved',
      key: 'reservedQuantity',
      render: (value) => <span className={styles.cellValue}>{value as number}</span>,
    },
    {
      header: 'Available',
      key: 'availableQuantity',
      render: (_, row) => {
        const rowData = row as StockItemWithDetails;
        const available = rowData.quantity - rowData.reservedQuantity;
        const isLow = available <= 5;
        return <span className={isLow ? styles.cellValueLow : styles.cellValue}>{available}</span>;
      },
    },
  ];

  if (loading && items.length === 0) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Stock</h1>
          </div>
          <div className={styles.skeletonContainer}>
            <Skeleton height="400px" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        {alerts.length > 0 && <AlertBanner alertCount={alerts.length} />}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Stock</h1>
            <p className={styles.subtitle}>Manage inventory across all warehouses</p>
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className={styles.errorTitle}>Error Loading Stock</div>
              <div className={styles.errorMessage}>{error}</div>
            </div>
          </div>
        )}

        <div className={styles.tableContainer}>
          {detailsLoading && itemsWithDetails.length > 0 ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner} />
              <p>Loading details...</p>
            </div>
          ) : null}
          <DataTable
            columns={columns}
            data={itemsWithDetails}
            idField="id"
            loading={loading || detailsLoading}
            error={null}
            onEdit={(row: unknown) => handleAdjustStock(row as StockItemWithDetails)}
          />
        </div>

        <Modal open={adjustModalOpen} onClose={handleModalClose} title="Adjust Stock">
          {selectedItem && (
            <StockAdjustForm
              stockItem={{
                id: selectedItem.id,
                productId: selectedItem.productId,
                warehouseId: selectedItem.warehouseId,
                productName: selectedItem.productName,
                productSku: selectedItem.productSku,
              }}
              onSubmit={handleAdjustmentSuccess}
              onClose={handleModalClose}
            />
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default StockListPage;
