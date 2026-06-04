import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import Modal from '@/components/shared/Modal';
import ProductForm from '@/components/products/ProductForm';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectProductById,
  selectProductsLoading,
  selectProductsError,
} from '@/store/slices/productsSlice';
import { updateProduct, fetchProducts } from '@/store/slices/productsSlice';
import type { Product } from '@/types/domain';
import type { ProductFormSchema } from '@/utils/validators';
import styles from './ProductDetailPage.module.css';

/**
 * ProductDetailPage: Displays details for a single product
 * - Fetches product by ID
 * - Shows product details
 * - Allows editing via modal form
 * - Shows loading/error states
 */
const ProductDetailPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Redux state
  const productId = id ? parseInt(id, 10) : null;
  const product = useAppSelector(selectProductById(productId ?? 0));
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);

  // Local state for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch products on mount if not already loaded
  useEffect(() => {
    if (!product && productId) {
      dispatch(fetchProducts());
    }
  }, [dispatch, product, productId]);

  // Handle edit form submission
  const handleEditSubmit = async (formData: ProductFormSchema) => {
    if (!product) return;

    const updatedProduct: Product = {
      ...product,
      ...formData,
    };

    dispatch(updateProduct(updatedProduct));
    setEditModalOpen(false);
  };

  // Show error state
  if (error && !loading) {
    return (
      <MainLayout>
        <div className={styles.errorContainer}>
          <h2>Error Loading Product</h2>
          <p>{error}</p>
          <button
            className={styles.backButton}
            onClick={() => navigate('/products')}
          >
            Back to Products
          </button>
        </div>
      </MainLayout>
    );
  }

  // Show loading state
  if (loading || !product) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <p>Loading product details...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{product.name}</h1>
          <button
            className={styles.editButton}
            onClick={() => setEditModalOpen(true)}
          >
            Edit Product
          </button>
        </div>

        <div className={styles.detailsContainer}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label className={styles.label}>SKU</label>
              <p className={styles.value}>{product.sku}</p>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.label}>Category</label>
              <p className={styles.value}>{product.categoryName}</p>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.label}>Price</label>
              <p className={styles.value}>${product.unitPrice.toFixed(2)}</p>
            </div>

            <div className={styles.detailItem}>
              <label className={styles.label}>Low Stock Threshold</label>
              <p className={styles.value}>{product.lowStockThreshold}</p>
            </div>
          </div>

          {product.description && (
            <div className={styles.descriptionSection}>
              <label className={styles.label}>Description</label>
              <p className={styles.description}>{product.description}</p>
            </div>
          )}

          <div className={styles.metaSection}>
            <p className={styles.meta}>Created: {new Date(product.createdAt).toLocaleDateString()}</p>
            <p className={styles.meta}>Updated: {new Date(product.updatedAt).toLocaleDateString()}</p>
          </div>

          <button
            className={styles.backButton}
            onClick={() => navigate('/products')}
          >
            Back to Products
          </button>
        </div>

        {/* Edit Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Product"
        >
          <ProductForm
            mode="edit"
            initialValues={{
              sku: product.sku,
              name: product.name,
              description: product.description ?? '',
              categoryId: product.categoryId,
              unitPrice: product.unitPrice,
              lowStockThreshold: product.lowStockThreshold,
            }}
            onSubmit={handleEditSubmit}
          />
        </Modal>
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
