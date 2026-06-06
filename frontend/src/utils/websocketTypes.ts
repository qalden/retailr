/**
 * WebSocket message types and event interfaces
 */

/**
 * Stock update message from server
 */
export interface StockUpdateMessage {
  /** Product SKU identifier */
  sku: string;
  /** Warehouse identifier */
  warehouse: string;
  /** Current quantity on hand */
  quantity: number;
  /** Reserved quantity */
  reserved: number;
  /** Alert flag for low stock */
  alert: boolean;
  /** Message timestamp (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Order update message from server
 */
export interface OrderUpdateMessage {
  /** Order number identifier */
  orderNumber: string;
  /** Current order status */
  status: string;
  /** Order total amount */
  total: number;
  /** Customer name */
  customer: string;
  /** Message timestamp (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Generic WebSocket event wrapper
 */
export interface WebSocketEvent<T> {
  /** Event data payload */
  data: T;
  /** Event timestamp (milliseconds since epoch) */
  timestamp: number;
}

/**
 * WebSocket connection status states
 */
export enum WebSocketStatus {
  /** Not connected and not attempting to connect */
  DISCONNECTED = 'DISCONNECTED',
  /** Attempting to establish connection */
  CONNECTING = 'CONNECTING',
  /** Connected and ready */
  CONNECTED = 'CONNECTED',
  /** Connection error occurred */
  ERROR = 'ERROR',
  /** Attempting to reconnect */
  RECONNECTING = 'RECONNECTING',
}

/**
 * Callback for subscription message handling
 */
export type SubscriptionCallback<T = unknown> = (message: T) => void;

/**
 * Callback for connection status changes
 */
export type ConnectionStatusCallback = (status: WebSocketStatus) => void;

/**
 * Callback for connection errors
 */
export type ErrorCallback = (error: Error) => void;
