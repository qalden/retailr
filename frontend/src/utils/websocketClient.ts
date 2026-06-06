/**
 * WebSocket Client Module
 *
 * Provides a wrapper around stompjs Client for real-time WebSocket communication
 * with JWT authentication, exponential backoff reconnection, and subscription management.
 *
 * @module websocketClient
 */

import { Client, Frame } from '@stomp/stompjs';
import {
  SubscriptionCallback,
  ConnectionStatusCallback,
  ErrorCallback,
  WebSocketStatus,
} from './websocketTypes';

/**
 * Configuration options for WebSocket connection
 */
export interface WebSocketConfig {
  /** URL to connect to */
  url: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Whether to reconnect automatically on disconnect */
  reconnect?: boolean;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Delay between reconnection attempts in milliseconds */
  reconnectDelay?: number;
}

/**
 * Message structure for WebSocket communications
 */
export interface WebSocketMessageEvent {
  /** Message type/action identifier */
  type: string;
  /** Message topic or channel */
  topic: string;
  /** Payload data */
  data?: unknown;
  /** Timestamp of message creation */
  timestamp?: number;
}

/**
 * Callback type for WebSocket message subscriptions
 */
export type WebSocketCallback = (data: unknown) => void;

/**
 * WebSocket Client wrapper around stompjs
 *
 * Provides:
 * - JWT authentication via Connect frame headers
 * - Exponential backoff reconnection (1s initial, max 30s)
 * - Topic subscription/unsubscription management
 * - Connection state callbacks
 * - Type-safe message handling
 */
class WebSocketClientImpl {
  private stompClient: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private initialReconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private subscriptions = new Map<string, string>();
  private statusCallbacks: ConnectionStatusCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private currentStatus: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private connectCallback?: () => void;
  private disconnectCallback?: () => void;
  private errorHandlerCallback?: (error: Error) => void;

  /**
   * Get the WebSocket URL from environment or use default
   */
  private getWebSocketUrl(): string {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
  }

  /**
   * Calculate exponential backoff delay
   */
  private getReconnectDelay(): number {
    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Update connection status and notify listeners
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusCallbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in status callback:', error);
        }
      });
    }
  }

  /**
   * Notify error listeners
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  /**
   * Connect to WebSocket server with JWT authentication
   *
   * @param token - JWT authentication token
   * @returns Promise that resolves when connected
   * @throws Error if connection fails
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      this.setStatus(WebSocketStatus.CONNECTING);

      const wsUrl = this.getWebSocketUrl();

      this.stompClient = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000, // stompjs internal reconnect delay
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.reconnectAttempts = 0;
          this.setStatus(WebSocketStatus.CONNECTED);
          try {
            this.connectCallback?.();
          } catch (error) {
            console.error('Error in onConnect callback:', error);
          }
          resolve();
        },
        onStompError: (frame: Frame) => {
          const errorMessage = frame.body || 'WebSocket STOMP error';
          const error = new Error(errorMessage);
          this.setStatus(WebSocketStatus.ERROR);
          try {
            this.errorHandlerCallback?.(error);
          } catch (cbError) {
            console.error('Error in onErrorCallback:', cbError);
          }
          this.notifyError(error);
          reject(error);
        },
        onWebSocketClose: () => {
          this.handleDisconnect();
        },
        onDisconnect: () => {
          this.handleDisconnect();
        },
        onWebSocketError: (error: Event) => {
          const wsError = new Error(
            `WebSocket error: ${error instanceof Error ? error.message : String(error)}`
          );
          this.setStatus(WebSocketStatus.ERROR);
          try {
            this.errorHandlerCallback?.(wsError);
          } catch (cbError) {
            console.error('Error in onErrorCallback:', cbError);
          }
          this.notifyError(wsError);
        },
      });

      try {
        this.stompClient.activate();
      } catch (error) {
        const connectError = new Error(
          `Failed to activate WebSocket client: ${error instanceof Error ? error.message : String(error)}`
        );
        this.setStatus(WebSocketStatus.ERROR);
        this.notifyError(connectError);
        reject(connectError);
      }
    });
  }

  /**
   * Handle disconnection with exponential backoff reconnection
   */
  private handleDisconnect(): void {
    if (this.currentStatus === WebSocketStatus.DISCONNECTED) {
      return; // Already disconnected intentionally
    }

    try {
      this.disconnectCallback?.();
    } catch (error) {
      console.error('Error in onDisconnect callback:', error);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      this.setStatus(WebSocketStatus.RECONNECTING);
      const delay = this.getReconnectDelay();
      console.log(
        `WebSocket disconnected. Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
    } else {
      this.setStatus(WebSocketStatus.DISCONNECTED);
      const error = new Error('WebSocket failed to reconnect after maximum attempts');
      this.notifyError(error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.reconnectAttempts = 0;
    this.setStatus(WebSocketStatus.DISCONNECTED);

    // Unsubscribe from all topics
    this.subscriptions.forEach((_subscriptionId, topic) => {
      this.unsubscribe(topic);
    });

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  /**
   * Subscribe to a WebSocket topic
   *
   * @param topic - Topic path (e.g., '/topic/stock-updates', '/user/queue/orders')
   * @param callback - Function to invoke when messages arrive
   * @throws Error if not connected
   */
  subscribe(topic: string, callback: SubscriptionCallback<unknown>): void {
    if (!this.isConnected() || !this.stompClient) {
      throw new Error('WebSocket is not connected. Call connect() first.');
    }

    // Check if already subscribed
    if (this.subscriptions.has(topic)) {
      console.warn(`Already subscribed to topic: ${topic}`);
      return;
    }

    try {
      const subscription = this.stompClient.subscribe(topic, (message) => {
        try {
          const body = message.body;
          const parsedData = body ? JSON.parse(body) : null;
          callback(parsedData);
        } catch (error) {
          const parseError = new Error(
            `Failed to parse message from ${topic}: ${error instanceof Error ? error.message : String(error)}`
          );
          this.notifyError(parseError);
        }
      });

      this.subscriptions.set(topic, subscription.id);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      const subscribeError = new Error(
        `Failed to subscribe to ${topic}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.notifyError(subscribeError);
      throw subscribeError;
    }
  }

  /**
   * Unsubscribe from a WebSocket topic
   *
   * @param topic - Topic path to unsubscribe from
   */
  unsubscribe(topic: string): void {
    const subscriptionId = this.subscriptions.get(topic);
    if (!subscriptionId) {
      console.warn(`Not subscribed to topic: ${topic}`);
      return;
    }

    if (this.stompClient) {
      try {
        this.stompClient.unsubscribe(subscriptionId);
        this.subscriptions.delete(topic);
        console.log(`Unsubscribed from topic: ${topic}`);
      } catch (error) {
        const unsubscribeError = new Error(
          `Failed to unsubscribe from ${topic}: ${error instanceof Error ? error.message : String(error)}`
        );
        this.notifyError(unsubscribeError);
      }
    }
  }

  /**
   * Send a message to a destination
   *
   * @param destination - Destination path (e.g., '/app/message')
   * @param body - Message body
   * @param headers - Optional STOMP headers
   * @throws Error if not connected
   */
  send(destination: string, body: WebSocketMessageEvent | Record<string, unknown>, headers?: Record<string, string>): void {
    if (!this.isConnected() || !this.stompClient) {
      throw new Error('WebSocket is not connected. Call connect() first.');
    }

    try {
      const messageBody = typeof body === 'string' ? body : JSON.stringify(body);
      this.stompClient.publish({
        destination,
        body: messageBody,
        headers,
      });
    } catch (error) {
      const sendError = new Error(
        `Failed to send message to ${destination}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.notifyError(sendError);
      throw sendError;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.currentStatus;
  }

  /**
   * Register a callback for connection status changes
   */
  onStatusChange(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for connection errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Register a callback for successful connection
   */
  onConnect(callback: () => void): void {
    this.connectCallback = callback;
  }

  /**
   * Register a callback for disconnection
   */
  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  /**
   * Register a callback for connection errors (alternative to onError for spec compliance)
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.errorHandlerCallback = callback;
  }

  /**
   * Get list of active subscriptions
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

/**
 * Singleton instance of WebSocket client
 */
export const wsClient = new WebSocketClientImpl();

/**
 * Legacy export: Initialize WebSocket connection
 * @deprecated Use wsClient.connect() instead
 */
export function initWebSocket(_url: string): void {
  // Legacy stub - new code should use wsClient.connect()
  throw new Error(
    'initWebSocket is deprecated. Use wsClient.connect(token) instead.'
  );
}

/**
 * Legacy export: Subscribe to a WebSocket topic
 * @deprecated Use wsClient.subscribe() instead
 */
export function subscribe(_topic: string, _callback: WebSocketCallback): void {
  // Legacy stub - new code should use wsClient.subscribe()
  throw new Error('subscribe is deprecated. Use wsClient.subscribe() instead.');
}

/**
 * Legacy export: Unsubscribe from a WebSocket topic
 * @deprecated Use wsClient.unsubscribe() instead
 */
export function unsubscribe(_topic: string): void {
  // Legacy stub - new code should use wsClient.unsubscribe()
  throw new Error(
    'unsubscribe is deprecated. Use wsClient.unsubscribe() instead.'
  );
}

/**
 * Legacy export: Disconnect from WebSocket server
 * @deprecated Use wsClient.disconnect() instead
 */
export function disconnect(): void {
  // Legacy stub - new code should use wsClient.disconnect()
  throw new Error(
    'disconnect is deprecated. Use wsClient.disconnect() instead.'
  );
}
