import React, { useState } from 'react';
import { orderFormSchema, type OrderFormSchema, type OrderLineFormSchema } from '@/utils/validators';
import CustomerSelect from './CustomerSelect';
import OrderLineRow from './OrderLineRow';
import styles from './OrderForm.module.css';

interface OrderFormProps {
  mode: 'create' | 'edit';
  initialValues?: OrderFormSchema;
  onSubmit: (data: OrderFormSchema) => void;
}

/**
 * OrderForm: Reusable form component for creating/editing orders
 * - Validates with orderFormSchema from validators
 * - Shows field-level validation errors
 * - Submits with mode-dependent button text
 * - Props: mode ('create' or 'edit'), initialValues?, onSubmit
 * - Fields:
 *   - Customer (select dropdown using CustomerSelect)
 *   - Line items table (using OrderLineRow component)
 *   - Add line item button (adds new empty row)
 *   - Remove line item button (removes row)
 * - Validates with orderFormSchema
 * - Shows line items with product, qty, unit price, line total
 * - Submit button text varies by mode
 * - Uses theme tokens
 */
const OrderForm: React.FC<OrderFormProps> = ({
  mode,
  initialValues,
  onSubmit,
}) => {
  // Form state
  const [formData, setFormData] = useState<OrderFormSchema>(
    initialValues || {
      customerId: 0,
      lines: [
        {
          id: crypto.randomUUID(),
          productId: 0,
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Handle customer change
  const handleCustomerChange = (customerId: number) => {
    setFormData((prev) => ({
      ...prev,
      customerId,
    }));
    // Clear customer error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.customerId;
      return newErrors;
    });
  };

  // Handle line item change
  const handleLineItemChange = (index: number, lineItem: OrderLineFormSchema) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      newLines[index] = lineItem;
      return {
        ...prev,
        lines: newLines,
      };
    });
    // Clear lines error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.lines;
      return newErrors;
    });
  };

  // Add line item
  const handleAddLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: crypto.randomUUID(),
          productId: 0,
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form data
      const result = orderFormSchema.safeParse(formData);

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          newErrors[path] = error.message;
        });
        setErrors(newErrors);
        return;
      }

      // Clear errors and submit
      setErrors({});
      onSubmit(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setErrors({ form: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = formData.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Form error message */}
      {errors.form && <div className={styles.errorMessage} aria-live="polite">{errors.form}</div>}

      {/* Customer section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Customer</h3>
        <div className={styles.formGroup}>
          <label htmlFor="customer">Customer *</label>
          <CustomerSelect
            value={formData.customerId}
            onChange={handleCustomerChange}
            placeholder="Select a customer"
          />
          {errors.customerId && (
            <span className={styles.fieldError}>{errors.customerId}</span>
          )}
        </div>
      </div>

      {/* Line items section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Line Items</h3>

        {/* Line items table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.headerCell}>Product</th>
                <th className={styles.headerCell}>Quantity</th>
                <th className={styles.headerCell}>Unit Price</th>
                <th className={styles.headerCell}>Line Total</th>
                <th className={styles.headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {formData.lines.map((lineItem, index) => (
                <OrderLineRow
                  key={lineItem.id}
                  index={index}
                  lineItem={lineItem}
                  onChange={handleLineItemChange}
                  onRemove={handleRemoveLineItem}
                />
              ))}
            </tbody>
          </table>
        </div>

        {errors.lines && <span className={styles.fieldError} aria-live="polite">{errors.lines}</span>}

        {/* Add line item button */}
        <button
          type="button"
          className={styles.addLineButton}
          onClick={handleAddLineItem}
        >
          + Add Line Item
        </button>
      </div>

      {/* Order total section */}
      <div className={styles.section}>
        <div className={styles.totalContainer}>
          <span className={styles.totalLabel}>Order Total:</span>
          <span className={styles.totalAmount}>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Form actions */}
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : mode === 'create' ? 'Create Order' : 'Save Order'}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
