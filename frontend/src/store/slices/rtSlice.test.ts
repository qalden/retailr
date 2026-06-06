import { describe, it, expect } from 'vitest';
import rtReducer, { setConnectionState, selectRTConnected, selectRTConnecting, selectRTError } from './rtSlice';
import type { RootState } from '@/store';

describe('rtSlice', () => {
  describe('setConnectionState', () => {
    it('should set connected state', () => {
      const initialState = {
        connected: false,
        connecting: false,
        error: null,
      };

      const action = setConnectionState({
        connected: true,
        connecting: false,
        error: null,
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(true);
      expect(result.connecting).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should set connecting state', () => {
      const initialState = {
        connected: false,
        connecting: false,
        error: null,
      };

      const action = setConnectionState({
        connected: false,
        connecting: true,
        error: null,
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(false);
      expect(result.connecting).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should set error state', () => {
      const initialState = {
        connected: false,
        connecting: false,
        error: null,
      };

      const testError = 'Connection failed';
      const action = setConnectionState({
        connected: false,
        connecting: false,
        error: testError,
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(false);
      expect(result.connecting).toBe(false);
      expect(result.error).toBe(testError);
    });

    it('should update from connecting to connected', () => {
      const initialState = {
        connected: false,
        connecting: true,
        error: null,
      };

      const action = setConnectionState({
        connected: true,
        connecting: false,
        error: null,
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(true);
      expect(result.connecting).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should clear error on reconnect', () => {
      const initialState = {
        connected: false,
        connecting: false,
        error: 'Previous error',
      };

      const action = setConnectionState({
        connected: true,
        connecting: false,
        error: null,
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle error during reconnection attempt', () => {
      const initialState = {
        connected: false,
        connecting: true,
        error: null,
      };

      const action = setConnectionState({
        connected: false,
        connecting: false,
        error: 'Reconnection failed',
      });

      const result = rtReducer(initialState, action);

      expect(result.connected).toBe(false);
      expect(result.connecting).toBe(false);
      expect(result.error).toBe('Reconnection failed');
    });
  });

  describe('selectors', () => {
    it('selectRTConnected should return connected state', () => {
      const state: RootState = {
        auth: {} as any,
        products: {} as any,
        orders: {} as any,
        customers: {} as any,
        suppliers: {} as any,
        stock: {} as any,
        ui: {} as any,
        realtime: {
          connected: true,
          connecting: false,
          error: null,
        },
      };

      expect(selectRTConnected(state)).toBe(true);
    });

    it('selectRTConnecting should return connecting state', () => {
      const state: RootState = {
        auth: {} as any,
        products: {} as any,
        orders: {} as any,
        customers: {} as any,
        suppliers: {} as any,
        stock: {} as any,
        ui: {} as any,
        realtime: {
          connected: false,
          connecting: true,
          error: null,
        },
      };

      expect(selectRTConnecting(state)).toBe(true);
    });

    it('selectRTError should return error state', () => {
      const errorMessage = 'Connection error';
      const state: RootState = {
        auth: {} as any,
        products: {} as any,
        orders: {} as any,
        customers: {} as any,
        suppliers: {} as any,
        stock: {} as any,
        ui: {} as any,
        realtime: {
          connected: false,
          connecting: false,
          error: errorMessage,
        },
      };

      expect(selectRTError(state)).toBe(errorMessage);
    });
  });
});
