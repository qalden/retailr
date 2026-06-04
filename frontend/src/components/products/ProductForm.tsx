import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { productFormSchema, type ProductFormSchema } from '@/utils/validators';
import { axiosClient } from '@/api/axiosClient';
import type { Category } from '@/types/domain';
import styles from './ProductForm.module.css';

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialValues?: ProductFormSchema;
  onSubmit: (data: ProductFormSchema) => void;
}

/**
 * ProductForm: Reusable form component for creating/editing products
 * - Validates with productFormSchema from validators
 * - Shows field-level validation errors
 * - Submits with mode-dependent button text
 * - Loads categories from API
 */
const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  initialValues,
  onSubmit,
}) => {
  // Form state
  const [formData, setFormData] = useState<ProductFormSchema>(
    initialValues || {
      sku: '',
      name: '',
      description: '',
      categoryId: 0,
      unitPrice: 0,
      lowStockThreshold: 1,
    }
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get<Category[]>('/categories');
        setCategories(response.data);
        setCategoriesError(null);

        // Set default category if creating new product
        if (mode === 'create' && response.data.length > 0 && formData.categoryId === 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId: response.data[0].id,
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
        setCategoriesError(errorMessage);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [mode]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Parse numbers
    if (name === 'categoryId') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else if (name === 'unitPrice') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value),
      }));
    } else if (name === 'lowStockThreshold') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    try {
      productFormSchema.parse(formData);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* SKU Field */}
      <div className={styles.formGroup}>
        <label htmlFor="sku" className={styles.label}>
          SKU
          <span className={styles.required}>*</span>
        </label>
        <input
          id="sku"
          type="text"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          disabled={mode === 'edit'}
          className={`${styles.input} ${errors.sku ? styles.inputError : ''}`}
          placeholder="e.g., PROD-001"
        />
        {errors.sku && <span className={styles.errorMessage}>{errors.sku}</span>}
      </div>

      {/* Name Field */}
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Product Name
          <span className={styles.required}>*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          placeholder="Enter product name"
        />
        {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
      </div>

      {/* Category Field */}
      <div className={styles.formGroup}>
        <label htmlFor="categoryId" className={styles.label}>
          Category
          <span className={styles.required}>*</span>
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          disabled={categoriesLoading || categoriesError !== null}
          className={`${styles.select} ${errors.categoryId ? styles.inputError : ''}`}
        >
          <option value={0}>
            {categoriesLoading ? 'Loading categories...' : 'Select a category'}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categoriesError && <span className={styles.errorMessage}>{categoriesError}</span>}
        {errors.categoryId && <span className={styles.errorMessage}>{errors.categoryId}</span>}
      </div>

      {/* Description Field */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="Enter product description (optional)"
          rows={4}
        />
        {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
      </div>

      {/* Price Field */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="unitPrice" className={styles.label}>
            Unit Price ($)
            <span className={styles.required}>*</span>
          </label>
          <input
            id="unitPrice"
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`${styles.input} ${errors.unitPrice ? styles.inputError : ''}`}
            placeholder="0.00"
          />
          {errors.unitPrice && <span className={styles.errorMessage}>{errors.unitPrice}</span>}
        </div>

        {/* Threshold Field */}
        <div className={styles.formGroup}>
          <label htmlFor="lowStockThreshold" className={styles.label}>
            Low Stock Threshold
            <span className={styles.required}>*</span>
          </label>
          <input
            id="lowStockThreshold"
            type="number"
            name="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            step="1"
            min="1"
            className={`${styles.input} ${errors.lowStockThreshold ? styles.inputError : ''}`}
            placeholder="0"
          />
          {errors.lowStockThreshold && (
            <span className={styles.errorMessage}>{errors.lowStockThreshold}</span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          disabled={submitting || categoriesLoading}
          className={styles.submitButton}
        >
          {submitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
