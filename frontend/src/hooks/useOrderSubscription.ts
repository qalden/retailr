import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWebSocketConnection } from './useWebSocketConnection';
import { wsClient } from '@/utils/websocketClient';
import { selectAllOrders, replaceOrder } from '@/store/slices/ordersSlice';
import type { OrderUpdateMessage } from '@/utils/websocketTypes';
import type { Order } from '@/types/domain';

/**
 * Return value for useOrderSubscription hook
 */
export interface UseOrderSubscriptionReturn {
  /** Current orders from Redux store */
  data: Order[];
  /** Whether data is loading (always false for subscriptions) */
  loading: boolean;
  /** Error message if subscription failed, null otherwise */
  error: string | null;
  /** Whether currently subscribed to order updates */
  subscribed: boolean;
}

/**
 * Hook for subscribing to real-time order updates via WebSocket
 *
 * Subscribes to /topic/order-updates when enabled=true
 * Dispatches Redux actions when messages arrive
 * Returns current order data from Redux store
 *
 * @param enabled - Whether to enable subscription (default: true)
 * @returns Order data and subscription status
 */
export function useOrderSubscription(enabled: boolean = true): UseOrderSubscriptionReturn {
  const dispatch = useDispatch();
  const { connected } = useWebSocketConnection();
  const data = useSelector(selectAllOrders);
  const subscriptionRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only subscribe if enabled, connected, and not already subscribed
    if (!enabled || !connected || subscriptionRef.current) {
      return;
    }

    try {
      // Subscribe to order updates topic
      wsClient.subscribe('/topic/order-updates', (message: unknown) => {
        try {
          // Parse and validate message
          const orderUpdate = message as OrderUpdateMessage;

          // Dispatch Redux action to update order
          // Since we don't have full order details from WebSocket, create a minimal update
          dispatch(
            replaceOrder({
              id: 0, // Will be determined from orderNumber lookup
              orderNumber: orderUpdate.orderNumber,
              customer: {
                id: 0,
                name: orderUpdate.customer,
                email: '',
                phone: null,
                address: null,
                city: null,
                postalCode: null,
                createdAt: new Date().toISOString(),
              },
              status: orderUpdate.status as Order['status'],
              totalAmount: orderUpdate.total,
              createdAt: new Date().toISOString(),
              confirmedAt: null,
              fulfilledAt: null,
              cancelledAt: null,
              updatedAt: new Date(orderUpdate.timestamp).toISOString(),
              lines: [],
              // Store original message for potential extended processing
              ...(orderUpdate as unknown as Record<string, unknown>),
            } as Order)
          );

          setError(null);
        } catch (parseError: unknown) {
          const errorMessage =
            parseError instanceof Error
              ? parseError.message
              : 'Failed to parse order update message';
          setError(errorMessage);
          console.error('Error parsing order update:', parseError);
        }
      });

      subscriptionRef.current = true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe to order updates';
      setError(errorMessage);
      subscriptionRef.current = false;
    }

    // Cleanup: unsubscribe on unmount or when enabled becomes false
    return () => {
      if (subscriptionRef.current) {
        try {
          wsClient.unsubscribe('/topic/order-updates');
          subscriptionRef.current = false;
        } catch (unsubError: unknown) {
          console.error('Error unsubscribing from order updates:', unsubError);
        }
      }
    };
  }, [enabled, connected, dispatch]);

  return {
    data,
    loading: false,
    error,
    subscribed: subscriptionRef.current && connected,
  };
}
