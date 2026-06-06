import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { wsClient } from '@/utils/websocketClient';
import { WebSocketStatus } from '@/utils/websocketTypes';

/**
 * Return value for useWebSocketConnection hook
 */
export interface UseWebSocketConnectionReturn {
  /** Whether the WebSocket is currently connected */
  connected: boolean;
  /** Whether a connection attempt is in progress */
  connecting: boolean;
  /** Error message if connection failed, null otherwise */
  error: string | null;
}

/**
 * Hook for managing WebSocket connection lifecycle
 *
 * Auto-connects on mount with JWT token from useAuth()
 * Auto-disconnects on unmount
 * Auto-reconnects if auth token changes (token refresh scenario)
 *
 * @returns Connection status: connected, connecting, error
 */
export function useWebSocketConnection(): UseWebSocketConnectionReturn {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;

    // If no token, don't attempt connection
    if (!token) {
      setConnected(false);
      setConnecting(false);
      return;
    }

    // Unsubscribe functions for callbacks
    let unsubscribeStatus: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;

    /**
     * Handle connection status changes
     */
    const handleStatusChange = (status: WebSocketStatus): void => {
      if (!mountedRef.current) return;

      switch (status) {
        case WebSocketStatus.CONNECTED:
          setConnected(true);
          setConnecting(false);
          setError(null);
          break;
        case WebSocketStatus.CONNECTING:
        case WebSocketStatus.RECONNECTING:
          setConnecting(true);
          setError(null);
          break;
        case WebSocketStatus.DISCONNECTED:
          setConnected(false);
          setConnecting(false);
          break;
        case WebSocketStatus.ERROR:
          setConnected(false);
          setConnecting(false);
          break;
        default:
          break;
      }
    };

    /**
     * Handle connection errors
     */
    const handleError = (err: Error): void => {
      if (!mountedRef.current) return;
      setError(err.message);
      setConnected(false);
      setConnecting(false);
    };

    // Register callbacks
    unsubscribeStatus = wsClient.onStatusChange(handleStatusChange);
    unsubscribeError = wsClient.onError(handleError);

    // Attempt connection if not already connected
    if (!wsClient.isConnected()) {
      setConnecting(true);
      wsClient.connect(token).catch((err: unknown) => {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          setConnecting(false);
        }
      });
    } else {
      setConnected(true);
    }

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeError) unsubscribeError();
    };
  }, [token]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (mountedRef.current === false) {
        // Component is unmounting, disconnect
        wsClient.disconnect();
      }
    };
  }, []);

  return {
    connected,
    connecting,
    error,
  };
}
