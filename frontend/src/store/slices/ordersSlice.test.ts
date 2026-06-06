import { describe, it, expect } from 'vitest';
import type { OrderUpdateMessage } from '@/utils/websocketTypes';
import type { Order } from '@/types/domain';
import ordersReducer, { updateOrderFromWebSocket } from './ordersSlice';

describe('ordersSlice', () => {
  describe('updateOrderFromWebSocket', () => {
    it('should merge order update into existing order by orderNumber', () => {
      // Initial state with one order
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      // WebSocket message for the same order
      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        total: 150.0,
        customer: 'John Doe',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('CONFIRMED');
      expect(result.items[0].totalAmount).toBe(150.0);
    });

    it('should create new order if not found', () => {
      // Initial state with no orders
      const initialState = {
        items: [],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        },
      };

      // WebSocket message for new order
      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-NEW',
        status: 'PENDING',
        total: 50.0,
        customer: 'Jane Smith',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].orderNumber).toBe('ORD-NEW');
      expect(result.items[0].status).toBe('PENDING');
      expect(result.items[0].totalAmount).toBe(50.0);
      expect(result.items[0].customer.name).toBe('Jane Smith');
    });

    it('should update timestamp from message', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const now = Date.now();
      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        total: 150.0,
        customer: 'John Doe',
        timestamp: now,
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items[0].updatedAt).toBe(new Date(now).toISOString());
    });

    it('should preserve other fields when updating', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        total: 150.0,
        customer: 'John Doe',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items[0].id).toBe(1);
      expect(result.items[0].orderNumber).toBe('ORD-001');
      expect(result.items[0].customer.id).toBe(1);
      expect(result.items[0].customer.email).toBe('john@example.com');
    });

    it('should handle multiple orders and update correct one', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
          {
            id: 2,
            orderNumber: 'ORD-002',
            customer: {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '0987654321',
              address: '456 Oak Ave',
              city: 'Boston',
              postalCode: '02101',
              createdAt: '2024-01-02T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 200.0,
            createdAt: '2024-01-02T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-02T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-002',
        status: 'CONFIRMED',
        total: 250.0,
        customer: 'Jane Smith',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].status).toBe('DRAFT'); // First order unchanged
      expect(result.items[1].status).toBe('CONFIRMED'); // Second order updated
      expect(result.items[1].totalAmount).toBe(250.0);
    });

    it('should add new order without affecting existing orders', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-NEW',
        status: 'PENDING',
        total: 75.0,
        customer: 'Bob Johnson',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].orderNumber).toBe('ORD-001');
      expect(result.items[1].orderNumber).toBe('ORD-NEW');
    });

    it('should create order with minimal fields when new', () => {
      const initialState = {
        items: [],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-NEW',
        status: 'PENDING',
        total: 50.0,
        customer: 'Jane Smith',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      expect(result.items[0].lines).toEqual([]);
      expect(result.items[0].confirmedAt).toBeNull();
      expect(result.items[0].fulfilledAt).toBeNull();
      expect(result.items[0].cancelledAt).toBeNull();
    });

    it('should ignore messages with invalid orderNumber', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: '',
        status: 'CONFIRMED',
        total: 150.0,
        customer: 'John Doe',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('DRAFT');
    });

    it('should ignore messages with negative total', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        total: -50.0,
        customer: 'John Doe',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].totalAmount).toBe(100.0);
    });

    it('should ignore messages with missing customer name', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        total: 150.0,
        customer: '',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('DRAFT');
    });

    it('should ignore messages with invalid status', () => {
      const initialState = {
        items: [
          {
            id: 1,
            orderNumber: 'ORD-001',
            customer: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890',
              address: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              createdAt: '2024-01-01T00:00:00Z',
            },
            status: 'DRAFT' as const,
            totalAmount: 100.0,
            createdAt: '2024-01-01T00:00:00Z',
            confirmedAt: null,
            fulfilledAt: null,
            cancelledAt: null,
            updatedAt: '2024-01-01T00:00:00Z',
            lines: [],
          } as Order,
        ],
        selectedOrder: null,
        loading: false,
        error: null,
        pagination: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      };

      const message: OrderUpdateMessage = {
        orderNumber: 'ORD-001',
        status: '',
        total: 150.0,
        customer: 'John Doe',
        timestamp: Date.now(),
      };

      const action = updateOrderFromWebSocket(message);
      const result = ordersReducer(initialState, action);

      // State should remain unchanged
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('DRAFT');
    });
  });
});
