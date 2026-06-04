import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAppDispatch } from '@/store';
import { adjustStock } from '@/store/slices/stockSlice';
import type { StockItem } from '@/types/domain';
import { axiosClient } from '@/api/axiosClient';
import type { Warehouse } from '@/types/domain';
import styles from './StockAdjustForm.module.css';

interface StockAdjustFormProps {
  stockItem: Pick<StockItem, 'id' | 'productId' | 'warehouseId'> & {
    productName?: string;
    productSku?: string;
  };
  onSubmit?: () => void;
  onClose: () => void;
}

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Stock In' },
  { value: 'OUT', label: 'Stock Out' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'LOSS', label: 'Loss' },
];

const adjustmentFormSchema = z.object({
  warehouseId: z.number().int().positive('Warehouse is required'),
  quantityDelta: z.number().int().refine((n) => n !== 0, { message: 'Quantity delta cannot be zero' }),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'CORRECTION', 'DAMAGED', 'LOSS']),
});

type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

const StockAdjustForm: React.FC<StockAdjustFormProps> = ({ stockItem, onSubmit, onClose }) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<AdjustmentFormData>({
    warehouseId: stockItem.warehouseId,
    quantityDelta: 1,
    movementType: 'ADJUSTMENT',
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [warehousesError, setWarehousesError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await axiosClient.get<Warehouse[]>('/warehouses');
        setWarehouses(response.data);
        setWarehousesError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load warehouses';
        setWarehousesError(errorMessage);
        setWarehouses([]);
      } finally {
        setWarehousesLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'warehouseId' || name === 'quantityDelta') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    try {
      adjustmentFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await dispatch(adjustStock({ stockItemId: stockItem.id, quantityDelta: formData.quantityDelta, movementType: formData.movementType })).unwrap();
      onSubmit?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const currentWarehouse = warehouses.find((w) => w.id === formData.warehouseId);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {submitError && (
        <div className={styles.errorAlert}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className={styles.errorTitle}>Error</div>
            <div className={styles.errorMessage}>{submitError}</div>
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="warehouse">Warehouse</label>
        {warehousesLoading ? (
          <div className={styles.loadingMessage}>Loading warehouses...</div>
        ) : warehousesError ? (
          <div className={styles.errorMessage}>{warehousesError}</div>
        ) : (
          <>
            <select id="warehouse" name="warehouseId" value={formData.warehouseId} onChange={handleChange} className={errors.warehouseId ? styles.inputError : styles.select}>
              <option value="">Select a warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {currentWarehouse && <div className={styles.helpText}>{currentWarehouse.location}</div>}
          </>
        )}
        {errors.warehouseId && <div className={styles.fieldError}>{errors.warehouseId}</div>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="product">Product</label>
        <input id="product" type="text" value={stockItem.productName || `Product ${stockItem.productId}`} disabled className={styles.disabledInput} />
        {stockItem.productSku && <div className={styles.helpText}>SKU: {stockItem.productSku}</div>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="quantity">Adjustment Quantity</label>
        <input id="quantity" type="number" name="quantityDelta" value={formData.quantityDelta} onChange={handleChange} className={errors.quantityDelta ? styles.inputError : styles.input} placeholder="e.g., 5 or -3" step="1" />
        <div className={styles.helpText}>
          {formData.quantityDelta > 0 ? 'Adding' : formData.quantityDelta < 0 ? 'Removing' : ''} {Math.abs(formData.quantityDelta)} units
        </div>
        {errors.quantityDelta && <div className={styles.fieldError}>{errors.quantityDelta}</div>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="movementType">Reason / Movement Type</label>
        <select id="movementType" name="movementType" value={formData.movementType} onChange={handleChange} className={errors.movementType ? styles.inputError : styles.select}>
          {MOVEMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.movementType && <div className={styles.fieldError}>{errors.movementType}</div>}
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton} disabled={submitting || warehousesLoading}>
          {submitting ? 'Adjusting...' : 'Adjust Stock'}
        </button>
      </div>
    </form>
  );
};

export default StockAdjustForm;
