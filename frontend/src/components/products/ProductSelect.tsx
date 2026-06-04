import React from 'react';
import { useAppSelector } from '@/store';
import { selectAllProducts } from '@/store/slices/productsSlice';
import styles from './ProductSelect.module.css';

interface ProductSelectProps {
  value: number;
  onChange: (productId: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ProductSelect: Dropdown component for selecting products
 * - Loads products from Redux store
 * - Renders as <select> with product names
 * - Supports disabled state
 * - Keyboard accessible
 */
const ProductSelect: React.FC<ProductSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a product',
}) => {
  const products = useAppSelector(selectAllProducts);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={styles.select}
      aria-label="Select product"
    >
      <option value={0}>{placeholder}</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} ({product.sku})
        </option>
      ))}
    </select>
  );
};

export default ProductSelect;
