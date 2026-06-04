import React from 'react';
import ProductSelect from '@/components/products/ProductSelect';
import type { OrderLineFormSchema } from '@/utils/validators';
import styles from './OrderLineRow.module.css';

interface OrderLineRowProps {
  index: number;
  lineItem: OrderLineFormSchema;
  onRemove: (index: number) => void;
  onChange: (index: number, lineItem: OrderLineFormSchema) => void;
}

/**
 * OrderLineRow: Component for editing individual order line items
 * - Props: index, lineItem (product, qty, unitPrice), onRemove, onChange
 * - Shows: Product (select dropdown), Qty (input), Unit Price (input), Line Total (calculated)
 * - Line total = qty * unitPrice
 * - Recalculates on qty or price change
 * - Remove button (calls onRemove)
 * - Editable: qty and price are input fields
 * - Uses theme tokens
 */
const OrderLineRow: React.FC<OrderLineRowProps> = ({
  index,
  lineItem,
  onRemove,
  onChange,
}) => {
  const handleProductChange = (productId: number) => {
    onChange(index, { ...lineItem, productId });
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = parseInt(e.target.value, 10) || 0;
    onChange(index, { ...lineItem, quantity: qty });
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    onChange(index, { ...lineItem, unitPrice: price });
  };

  const lineTotal = lineItem.quantity * lineItem.unitPrice;

  return (
    <tr className={styles.row}>
      <td className={styles.cell}>
        <ProductSelect
          value={lineItem.productId}
          onChange={handleProductChange}
          placeholder="Select product"
        />
      </td>
      <td className={styles.cell}>
        <input
          type="number"
          value={lineItem.quantity}
          onChange={handleQtyChange}
          min="1"
          className={styles.input}
          aria-label="Quantity"
        />
      </td>
      <td className={styles.cell}>
        <input
          type="number"
          value={lineItem.unitPrice}
          onChange={handleUnitPriceChange}
          min="0"
          step="0.01"
          className={styles.input}
          aria-label="Unit price"
        />
      </td>
      <td className={`${styles.cell} ${styles.lineTotal}`}>
        ${lineTotal.toFixed(2)}
      </td>
      <td className={styles.cell}>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(index)}
          aria-label={`Remove line item ${index + 1}`}
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

export default React.memo(OrderLineRow);
