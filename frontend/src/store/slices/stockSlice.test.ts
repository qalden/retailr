import { describe, it, expect } from 'vitest';
import type { StockUpdateMessage } from '@/utils/websocketTypes';
import type { StockItem } from '@/types/domain';
import stockReducer, { updateStockFromWebSocket } from './stockSlice';

describe('stockSlice', () => {
  describe('updateStockFromWebSocket', () => {
    it('should merge stock update into existing item by warehouse and sku', () => {
      // Initial state with one stock item
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      // WebSocket message for the same warehouse and sku
      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: 150,
        reserved: 30,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(150);
      expect(result.items[0].reservedQuantity).toBe(30);
      expect(result.items[0].availableQuantity).toBe(120);
    });

    it('should create new stock item if not found', () => {
      // Initial state with no items
      const initialState = {
        items: [],
        alerts: [],
        loading: false,
        error: null,
      };

      // WebSocket message for new warehouse
      const message: StockUpdateMessage = {
        sku: 'SKU-NEW',
        warehouse: '2',
        quantity: 50,
        reserved: 10,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].sku).toBe('SKU-NEW');
      expect(result.items[0].quantity).toBe(50);
      expect(result.items[0].reservedQuantity).toBe(10);
      expect(result.items[0].warehouseId).toBe(2);
      expect(result.items[0].availableQuantity).toBe(40);
    });

    it('should update availableQuantity correctly', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: 200,
        reserved: 50,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items[0].availableQuantity).toBe(150);
    });

    it('should update timestamp from message', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const now = Date.now();
      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: 150,
        reserved: 30,
        alert: false,
        timestamp: now,
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items[0].updatedAt).toBe(new Date(now).toISOString());
    });

    it('should preserve other fields when updating', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: 150,
        reserved: 30,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items[0].id).toBe(1);
      expect(result.items[0].sku).toBe('SKU-001');
      expect(result.items[0].productId).toBe(100);
      expect(result.items[0].warehouseId).toBe(1);
    });

    it('should handle multiple stock items and update correct one', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
          {
            id: 2,
            sku: 'SKU-002',
            productId: 101,
            warehouseId: 2,
            quantity: 200,
            reservedQuantity: 40,
            availableQuantity: 160,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-002',
        warehouse: '2',
        quantity: 250,
        reserved: 50,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].quantity).toBe(100); // First item unchanged
      expect(result.items[1].quantity).toBe(250); // Second item updated
    });

    it('should add new item without affecting existing items', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-NEW',
        warehouse: '5',
        quantity: 75,
        reserved: 15,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].warehouseId).toBe(1);
      expect(result.items[1].warehouseId).toBe(5);
    });

    it('should update different stock items in same warehouse by sku', () => {
      // This test verifies the critical fix: matching by both warehouse AND sku
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
          {
            id: 2,
            sku: 'SKU-002',
            productId: 101,
            warehouseId: 1,
            quantity: 50,
            reservedQuantity: 10,
            availableQuantity: 40,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      // Update SKU-002 in warehouse 1
      const message: StockUpdateMessage = {
        sku: 'SKU-002',
        warehouse: '1',
        quantity: 75,
        reserved: 15,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      // Verify SKU-001 unchanged
      expect(result.items[0].sku).toBe('SKU-001');
      expect(result.items[0].quantity).toBe(100);

      // Verify SKU-002 updated
      expect(result.items[1].sku).toBe('SKU-002');
      expect(result.items[1].quantity).toBe(75);
      expect(result.items[1].availableQuantity).toBe(60);
    });

    it('should ignore messages with invalid warehouse', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: 'INVALID',
        quantity: 150,
        reserved: 30,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(100);
    });

    it('should ignore messages with negative quantity', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: -50,
        reserved: 10,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(100);
    });

    it('should ignore messages with negative reserved quantity', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: 'SKU-001',
        warehouse: '1',
        quantity: 100,
        reserved: -10,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].reservedQuantity).toBe(20);
    });

    it('should ignore messages with missing sku', () => {
      const initialState = {
        items: [
          {
            id: 1,
            sku: 'SKU-001',
            productId: 100,
            warehouseId: 1,
            quantity: 100,
            reservedQuantity: 20,
            availableQuantity: 80,
            updatedAt: '2024-01-01T00:00:00Z',
          } as StockItem,
        ],
        alerts: [],
        loading: false,
        error: null,
      };

      const message: StockUpdateMessage = {
        sku: '',
        warehouse: '1',
        quantity: 150,
        reserved: 30,
        alert: false,
        timestamp: Date.now(),
      };

      const action = updateStockFromWebSocket(message);
      const result = stockReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(100);
    });
  });
});
