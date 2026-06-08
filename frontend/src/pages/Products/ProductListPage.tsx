import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/pages/Layout/MainLayout';
import DataTable, { type ColumnDef } from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import SearchInput from '@/components/shared/SearchInput';
import FilterPanel from '@/components/shared/FilterPanel';
import SavedFilters from '@/components/shared/SavedFilters';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError,
} from '@/store/slices/productsSlice';
import { fetchProducts, deleteProduct, updateProduct } from '@/store/slices/productsSlice';
import { useSearch } from '@/hooks/useSearch';
import { useFilter } from '@/hooks/useFilter';
import { useSort } from '@/hooks/useSort';
import { useURLState } from '@/hooks/useURLState';
import { applyFilters } from '@/utils/filterUtils';
import { matchesSearch } from '@/utils/searchUtils';
import { sortData } from '@/utils/sortData';
import { PRODUCT_FILTERS } from '@/utils/filterConfig';
import type { Product } from '@/types/domain';
import styles from './ProductListPage.module.css';

/**
 * ProductListPage: Displays a list of all products with CRUD operations
 * - Fetches products on mount
 * - Shows loading/error states
 * - Allows edit/delete operations
 * - Provides navigation to create product
 * - Integrates search, filter, and sort functionality
 */
const ProductListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux state
  const products = useAppSelector(selectAllProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);

  // Search, filter, sort hooks
  const { search, tokens, setSearchValue } = useSearch();
  const { filters, setAllFilters } = useFilter();
  const { sort, setSortBy } = useSort();
  useURLState(); // Sync to URL

  // Local state for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<string>('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Handle edit button click
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditPrice(product.unitPrice.toString());
    setEditThreshold(product.lowStockThreshold.toString());
    setEditModalOpen(true);
  };

  // Handle save edited product
  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    const updatedProduct: Product = {
      ...selectedProduct,
      unitPrice: parseFloat(editPrice),
      lowStockThreshold: parseInt(editThreshold, 10),
    };

    dispatch(updateProduct(updatedProduct));
    setEditModalOpen(false);
    setSelectedProduct(null);
  };

  // Handle delete button click
  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      dispatch(deleteProduct(product.id));
    }
  };

  // Apply transformations in order: filters → search → sort
  let displayData = products;
  displayData = applyFilters(displayData, filters);
  displayData = displayData.filter((item) =>
    matchesSearch(item, tokens, ['sku', 'name'])
  );
  if (sort) {
    displayData = sortData(displayData, sort.field, sort.direction);
  }

  // DataTable columns (all sortable)
  const columns: ColumnDef[] = [
    {
      header: 'SKU',
      key: 'sku',
      sortable: true,
    },
    {
      header: 'Name',
      key: 'name',
      sortable: true,
    },
    {
      header: 'Price',
      key: 'unitPrice',
      sortable: true,
      render: (value) => `$${(value as number).toFixed(2)}`,
    },
    {
      header: 'Category',
      key: 'categoryName',
      sortable: true,
    },
    {
      header: 'Threshold',
      key: 'lowStockThreshold',
      sortable: true,
    },
  ];

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Products</h1>
          <button
            className={styles.createButton}
            onClick={() => navigate('/products/create')}
          >
            Create Product
          </button>
        </div>

        {/* Search Input */}
        <SearchInput value={search} onChange={setSearchValue} placeholder="Search by SKU or Name..." />

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
            filterDefinitions={PRODUCT_FILTERS}
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
            onEdit={(row) => handleEdit(row as Product)}
            onDelete={(row) => handleDelete(row as Product)}
            onSort={(field) => setSortBy(field)}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Product"
        >
          <div className={styles.editForm}>
            {selectedProduct && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-name">Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={selectedProduct.name}
                    disabled
                    className={styles.disabledInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="edit-sku">SKU</label>
                  <input
                    id="edit-sku"
                    type="text"
                    value={selectedProduct.sku}
                    disabled
                    className={styles.disabledInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="edit-price">Price</label>
                  <input
                    id="edit-price"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="edit-threshold">Low Stock Threshold</label>
                  <input
                    id="edit-threshold"
                    type="number"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(e.target.value)}
                    step="1"
                    min="0"
                    className={styles.input}
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveEdit}
                  >
                    Save Changes
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

export default ProductListPage;
