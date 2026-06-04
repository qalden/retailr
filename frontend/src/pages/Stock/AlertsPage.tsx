import React, { useEffect, useState } from 'react';
import MainLayout from '@/pages/Layout/MainLayout';
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import Skeleton from '@/components/shared/Skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectAllAlerts,
  selectStockLoading,
  selectStockError,
  fetchLowStockAlerts,
  acknowledgeAlert,
} from '@/store/slices/stockSlice';
import type { LowStockAlert, Product } from '@/types/domain';
import { axiosClient } from '@/api/axiosClient';
import styles from './AlertsPage.module.css';

interface AlertWithDetails extends LowStockAlert {
  productName?: string;
  productSku?: string;
  warehouseName?: string;
  currentQuantity?: number;
  lowThreshold?: number;
}

const AlertsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector(selectAllAlerts);
  const loading = useAppSelector(selectStockLoading);
  const error = useAppSelector(selectStockError);

  const [alertsWithDetails, setAlertsWithDetails] = useState<AlertWithDetails[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [acknowledgeError, setAcknowledgeError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLowStockAlerts());
  }, [dispatch]);

  useEffect(() => {
    const enrichAlerts = async () => {
      if (alerts.length === 0) {
        setAlertsWithDetails([]);
        return;
      }

      setDetailsLoading(true);
      try {
        const enrichedAlerts = await Promise.all(
          alerts.map(async (alert) => {
            try {
              const stockRes = await axiosClient.get(`/stock/${alert.stockItemId}`);
              const productRes = await axiosClient.get<Product>(`/products/${stockRes.data.productId}`);
              const warehouseRes = await axiosClient.get<{ name: string }>(`/warehouses/${stockRes.data.warehouseId}`);

              return {
                ...alert,
                productName: productRes.data.name,
                productSku: productRes.data.sku,
                warehouseName: warehouseRes.data.name,
                currentQuantity: stockRes.data.quantity,
                lowThreshold: productRes.data.lowStockThreshold,
              };
            } catch {
              return {
                ...alert,
                productName: `Stock Item ${alert.stockItemId}`,
                productSku: '',
                warehouseName: 'Unknown',
                currentQuantity: 0,
                lowThreshold: 0,
              };
            }
          })
        );
        setAlertsWithDetails(enrichedAlerts);
      } finally {
        setDetailsLoading(false);
      }
    };

    enrichAlerts();
  }, [alerts]);

  const handleAcknowledge = async (alertId: number) => {
    setAcknowledgeError(null);

    try {
      await dispatch(acknowledgeAlert(alertId)).unwrap();
      dispatch(fetchLowStockAlerts());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge alert';
      setAcknowledgeError(errorMessage);
    }
  };

  const columns: ColumnDef[] = [
    { header: 'SKU', key: 'productSku' },
    { header: 'Product', key: 'productName' },
    { header: 'Warehouse', key: 'warehouseName' },
    {
      header: 'Current Qty',
      key: 'currentQuantity',
      render: (value) => <span className={styles.quantityValue}>{value as number}</span>,
    },
    {
      header: 'Threshold',
      key: 'lowThreshold',
      render: (value) => <span className={styles.thresholdValue}>{value as number}</span>,
    },
    {
      header: 'Triggered',
      key: 'triggeredAt',
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value as string);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      },
    },
  ];

  if (loading && alerts.length === 0) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Low Stock Alerts</h1>
          </div>
          <div className={styles.skeletonContainer}>
            <Skeleton height="400px" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const unacknowledgedCount = alertsWithDetails.filter((a) => a.acknowledgedAt === null).length;

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Low Stock Alerts</h1>
            <p className={styles.subtitle}>
              {unacknowledgedCount === 0 ? 'No active alerts' : `${unacknowledgedCount} alert${unacknowledgedCount !== 1 ? 's' : ''} need${unacknowledgedCount !== 1 ? '' : 's'} attention`}
            </p>
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className={styles.errorTitle}>Error Loading Alerts</div>
              <div className={styles.errorMessage}>{error}</div>
            </div>
          </div>
        )}

        {acknowledgeError && (
          <div className={styles.errorContainer}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className={styles.errorTitle}>Error</div>
              <div className={styles.errorMessage}>{acknowledgeError}</div>
            </div>
          </div>
        )}

        <div className={styles.tableContainer}>
          {detailsLoading && alertsWithDetails.length > 0 ? (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner} />
              <p>Loading details...</p>
            </div>
          ) : null}
          <DataTable
            columns={columns}
            data={alertsWithDetails}
            idField="id"
            loading={loading || detailsLoading}
            error={null}
            onEdit={(row: unknown) => {
              const alert = row as AlertWithDetails;
              if (alert.acknowledgedAt === null) {
                handleAcknowledge(alert.id);
              }
            }}
          />
        </div>

        {!loading && !detailsLoading && alertsWithDetails.length === 0 && (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className={styles.emptyTitle}>No alerts</h3>
            <p className={styles.emptyMessage}>All stock levels are above thresholds</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AlertsPage;
