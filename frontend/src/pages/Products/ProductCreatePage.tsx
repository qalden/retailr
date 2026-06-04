import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import ProductForm from '@/components/products/ProductForm';
import { useAppDispatch } from '@/store';
import { createProduct } from '@/store/slices/productsSlice';
import type { ProductFormSchema } from '@/utils/validators';
import styles from './ProductCreatePage.module.css';

/**
 * ProductCreatePage: Form for creating a new product
 * - Uses ProductForm component
 * - Validates with productFormSchema
 * - Dispatches createProduct thunk on submit
 * - Navigates back to /products on success
 */
const ProductCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = (formData: ProductFormSchema) => {
    dispatch(createProduct(formData));
    // Navigate back to products list after a short delay to allow state update
    setTimeout(() => {
      navigate('/products');
    }, 500);
  };

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Product</h1>
          <p className={styles.subtitle}>Fill in the form below to add a new product to the catalog</p>
        </div>

        <div className={styles.formContainer}>
          <ProductForm
            mode="create"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductCreatePage;
