import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWebSocketConnection } from './useWebSocketConnection';
import { wsClient } from '@/utils/websocketClient';
import { selectAllStockItems } from '@/store/slices/stockSlice';
import { updateStockItem } from '@/store/slices/stockSlice';
import type { StockUpdateMessage } from '@/utils/websocketTypes';
import type { StockItem } from '@/types/domain';

/**
 * Return value for useStockSubscription hook
 */
export interface UseStockSubscriptionReturn {
  /** Current stock items from Redux store */
  data: StockItem[];
  /** Whether data is loading (always false for subscriptions) */
  loading: boolean;
  /** Error message if subscription failed, null otherwise */
  error: string | null;
  /** Whether currently subscribed to stock updates */
  subscribed: boolean;
}

/**
 * Hook for subscribing to real-time stock updates via WebSocket
 *
 * Subscribes to /topic/stock-updates when enabled=true
 * Dispatches Redux actions when messages arrive
 * Returns current stock data from Redux store
 *
 * @param enabled - Whether to enable subscription (default: true)
 * @returns Stock data and subscription status
 */
export function useStockSubscription(enabled: boolean = true): UseStockSubscriptionReturn {
  const dispatch = useDispatch();
  const { connected } = useWebSocketConnection();
  const data = useSelector(selectAllStockItems);
  const subscriptionRef = useRef<boolean>(false);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    // Only subscribe if enabled, connected, and not already subscribed
    if (!enabled || !connected || subscriptionRef.current) {
      return;
    }

    try {
      // Subscribe to stock updates topic
      wsClient.subscribe('/topic/stock-updates', (message: unknown) => {
        try {
          // Parse and validate message
          const stockUpdate = message as StockUpdateMessage;

          // Dispatch Redux action to update stock
          dispatch(
            updateStockItem({
              id: 0, // Will be determined from warehouse + sku lookup in reducer
              productId: 0, // Not available in WebSocket message
              warehouseId: 0, // Will be determined from warehouse field
              quantity: stockUpdate.quantity,
              reservedQuantity: stockUpdate.reserved,
              availableQuantity: stockUpdate.quantity - stockUpdate.reserved,
              updatedAt: new Date(stockUpdate.timestamp).toISOString(),
              // Store warehouse and sku for potential lookup
              ...(stockUpdate as unknown as Record<string, unknown>),
            } as StockItem)
          );

          errorRef.current = null;
        } catch (parseError: unknown) {
          const errorMessage =
            parseError instanceof Error
              ? parseError.message
              : 'Failed to parse stock update message';
          errorRef.current = errorMessage;
          console.error('Error parsing stock update:', parseError);
        }
      });

      subscriptionRef.current = true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe to stock updates';
      errorRef.current = errorMessage;
      subscriptionRef.current = false;
    }

    // Cleanup: unsubscribe on unmount or when enabled becomes false
    return () => {
      if (subscriptionRef.current) {
        try {
          wsClient.unsubscribe('/topic/stock-updates');
          subscriptionRef.current = false;
        } catch (unsubError: unknown) {
          console.error('Error unsubscribing from stock updates:', unsubError);
        }
      }
    };
  }, [enabled, connected, dispatch]);

  return {
    data,
    loading: false,
    error: errorRef.current,
    subscribed: subscriptionRef.current && connected,
  };
}
