import { describe, it, expect } from 'vitest';
import {
  PRODUCT_FILTERS,
  ORDER_FILTERS,
  STOCK_FILTERS,
  getFiltersByDomain,
  isValidField,
  getFilterDefinition,
} from './filterConfig';

describe('filterConfig', () => {
  describe('PRODUCT_FILTERS', () => {
    it('should define product filters', () => {
      expect(PRODUCT_FILTERS.length).toBeGreaterThan(0);
    });

    it('should have SKU filter', () => {
      const skuFilter = PRODUCT_FILTERS.find((f) => f.field === 'sku');
      expect(skuFilter).toBeDefined();
      expect(skuFilter?.label).toBe('SKU');
      expect(skuFilter?.type).toBe('text');
    });

    it('should have name filter', () => {
      const nameFilter = PRODUCT_FILTERS.find((f) => f.field === 'name');
      expect(nameFilter).toBeDefined();
      expect(nameFilter?.label).toBe('Product Name');
    });

    it('should have category filter with options', () => {
      const categoryFilter = PRODUCT_FILTERS.find((f) => f.field === 'categoryName');
      expect(categoryFilter).toBeDefined();
      expect(categoryFilter?.type).toBe('select');
      expect(categoryFilter?.options).toBeDefined();
      expect(categoryFilter!.options!.length).toBeGreaterThan(0);
    });

    it('should have price filter', () => {
      const priceFilter = PRODUCT_FILTERS.find((f) => f.field === 'unitPrice');
      expect(priceFilter).toBeDefined();
      expect(priceFilter?.type).toBe('range');
      expect(priceFilter?.operators).toContain('gte');
      expect(priceFilter?.operators).toContain('lte');
    });
  });

  describe('ORDER_FILTERS', () => {
    it('should define order filters', () => {
      expect(ORDER_FILTERS.length).toBeGreaterThan(0);
    });

    it('should have order number filter', () => {
      const orderNumberFilter = ORDER_FILTERS.find((f) => f.field === 'orderNumber');
      expect(orderNumberFilter).toBeDefined();
      expect(orderNumberFilter?.label).toBe('Order Number');
    });

    it('should have status filter with options', () => {
      const statusFilter = ORDER_FILTERS.find((f) => f.field === 'status');
      expect(statusFilter).toBeDefined();
      expect(statusFilter?.type).toBe('select');
      expect(statusFilter?.options).toBeDefined();
      expect(statusFilter!.options!.length).toBeGreaterThan(0);
    });

    it('should have total amount filter', () => {
      const amountFilter = ORDER_FILTERS.find((f) => f.field === 'totalAmount');
      expect(amountFilter).toBeDefined();
      expect(amountFilter?.type).toBe('range');
    });

    it('should have date filter', () => {
      const dateFilter = ORDER_FILTERS.find((f) => f.field === 'createdAt');
      expect(dateFilter).toBeDefined();
      expect(dateFilter?.type).toBe('date');
    });
  });

  describe('STOCK_FILTERS', () => {
    it('should define stock filters', () => {
      expect(STOCK_FILTERS.length).toBeGreaterThan(0);
    });

    it('should have SKU filter', () => {
      const skuFilter = STOCK_FILTERS.find((f) => f.field === 'sku');
      expect(skuFilter).toBeDefined();
    });

    it('should have quantity filters', () => {
      const quantityFilter = STOCK_FILTERS.find((f) => f.field === 'quantity');
      expect(quantityFilter).toBeDefined();
      expect(quantityFilter?.type).toBe('number');
    });

    it('should have available quantity filter', () => {
      const availableFilter = STOCK_FILTERS.find((f) => f.field === 'availableQuantity');
      expect(availableFilter).toBeDefined();
    });

    it('should have reserved quantity filter', () => {
      const reservedFilter = STOCK_FILTERS.find((f) => f.field === 'reservedQuantity');
      expect(reservedFilter).toBeDefined();
    });
  });

  describe('getFiltersByDomain', () => {
    it('should return product filters for product domain', () => {
      const filters = getFiltersByDomain('product');
      expect(filters).toEqual(PRODUCT_FILTERS);
    });

    it('should return order filters for order domain', () => {
      const filters = getFiltersByDomain('order');
      expect(filters).toEqual(ORDER_FILTERS);
    });

    it('should return stock filters for stock domain', () => {
      const filters = getFiltersByDomain('stock');
      expect(filters).toEqual(STOCK_FILTERS);
    });

    it('should return empty array for unknown domain', () => {
      const filters = getFiltersByDomain('unknown' as any);
      expect(filters).toEqual([]);
    });
  });

  describe('isValidField', () => {
    it('should validate product fields', () => {
      expect(isValidField('product', 'sku')).toBe(true);
      expect(isValidField('product', 'name')).toBe(true);
      expect(isValidField('product', 'invalidField')).toBe(false);
    });

    it('should validate order fields', () => {
      expect(isValidField('order', 'orderNumber')).toBe(true);
      expect(isValidField('order', 'status')).toBe(true);
      expect(isValidField('order', 'invalidField')).toBe(false);
    });

    it('should validate stock fields', () => {
      expect(isValidField('stock', 'sku')).toBe(true);
      expect(isValidField('stock', 'quantity')).toBe(true);
      expect(isValidField('stock', 'invalidField')).toBe(false);
    });
  });

  describe('getFilterDefinition', () => {
    it('should get product filter definition', () => {
      const def = getFilterDefinition('product', 'sku');
      expect(def).toBeDefined();
      expect(def?.field).toBe('sku');
      expect(def?.label).toBe('SKU');
    });

    it('should get order filter definition', () => {
      const def = getFilterDefinition('order', 'status');
      expect(def).toBeDefined();
      expect(def?.field).toBe('status');
      expect(def?.options).toBeDefined();
    });

    it('should get stock filter definition', () => {
      const def = getFilterDefinition('stock', 'quantity');
      expect(def).toBeDefined();
      expect(def?.field).toBe('quantity');
    });

    it('should return undefined for invalid field', () => {
      const def = getFilterDefinition('product', 'invalidField');
      expect(def).toBeUndefined();
    });
  });
});
