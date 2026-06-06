import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWebSocketConnection } from './useWebSocketConnection';
import { wsClient } from '@/utils/websocketClient';
import type { RootState } from '@/store';

/**
 * Options for generic subscription hook
 */
export interface UseSubscriptionOptions<T> {
  /** WebSocket topic to subscribe to */
  topic: string;
  /** Whether to enable subscription (default: true) */
  enabled?: boolean;
  /** Callback to transform message and create Redux action */
  onMessage: (message: unknown) => { type: string; payload: T };
}

/**
 * Return value for generic subscription hook
 */
export interface UseSubscriptionReturn<T> {
  /** Current data from Redux store */
  data: T[];
  /** Whether data is loading (always false for subscriptions) */
  loading: boolean;
  /** Error message if subscription failed, null otherwise */
  error: string | null;
  /** Whether currently subscribed to topic */
  subscribed: boolean;
}

/**
 * Generic hook for subscribing to real-time WebSocket updates
 *
 * Handles subscription lifecycle, message parsing, Redux dispatch, and cleanup
 * Eliminates code duplication between useStockSubscription and useOrderSubscription
 *
 * @param topic - WebSocket topic to subscribe to
 * @param selector - Redux selector to get data from store
 * @param onMessage - Callback to transform message and create Redux action
 * @param enabled - Whether to enable subscription (default: true)
 * @returns Subscription data and status
 */
export function useSubscription<T>(
  topic: string,
  selector: (state: RootState) => T[],
  onMessage: (message: unknown) => { type: string; payload: T },
  enabled: boolean = true
): UseSubscriptionReturn<T> {
  const dispatch = useDispatch();
  const { connected } = useWebSocketConnection();
  const data = useSelector(selector);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<boolean>(false);

  useEffect(() => {
    // Only subscribe if enabled, connected, and not already subscribed
    if (!enabled || !connected || subscriptionRef.current) {
      return;
    }

    try {
      // Subscribe to topic
      wsClient.subscribe(topic, (message: unknown) => {
        try {
          // Transform message and dispatch action
          const action = onMessage(message);
          dispatch(action);
          setError(null);
        } catch (parseError: unknown) {
          const errorMessage =
            parseError instanceof Error ? parseError.message : `Failed to parse message from ${topic}`;
          setError(errorMessage);
          if (import.meta.env.DEV) {
            console.error(`Error processing message from ${topic}:`, parseError);
          }
        }
      });

      subscriptionRef.current = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to subscribe to ${topic}`;
      setError(errorMessage);
      subscriptionRef.current = false;
    }

    // Cleanup: unsubscribe on unmount or when enabled becomes false
    return () => {
      if (subscriptionRef.current) {
        try {
          wsClient.unsubscribe(topic);
          subscriptionRef.current = false;
        } catch (unsubError: unknown) {
          if (import.meta.env.DEV) {
            console.error(`Error unsubscribing from ${topic}:`, unsubError);
          }
        }
      }
    };
  }, [topic, enabled, connected, dispatch, onMessage]);

  return {
    data,
    loading: false,
    error,
    subscribed: subscriptionRef.current && connected,
  };
}
