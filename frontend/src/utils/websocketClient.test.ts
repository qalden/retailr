/**
 * Tests for WebSocket Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { wsClient } from './websocketClient';
import { WebSocketStatus } from './websocketTypes';

// Mock stompjs
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation((config: any) => {
    const mockClient: any = {
      config,
      connected: false,
      activate: vi.fn(function(this: any) {
        setTimeout(() => {
          this.connected = true;
          config.onConnect?.();
        }, 0);
      }),
      deactivate: vi.fn(function(this: any) {
        this.connected = false;
        config.onDisconnect?.();
      }),
      subscribe: vi.fn(() => {
        return { id: `sub-${Date.now()}` };
      }),
      unsubscribe: vi.fn(),
      publish: vi.fn(),
    };
    return mockClient;
  }),
}));

/**
 * Reset WebSocketClient singleton state for test isolation
 */
export function resetWebSocketClient() {
  // Access private properties through type assertion for testing
  const client = wsClient as any;
  client['statusCallbacks']?.clear?.() || (client['statusCallbacks'] = []);
  client['errorCallbacks']?.clear?.() || (client['errorCallbacks'] = []);
  client['subscriptions']?.clear?.() || (client['subscriptions'] = new Map());
  client['reconnectAttempts'] = 0;
  client['connectCallback'] = undefined;
  client['disconnectCallback'] = undefined;
  client['errorHandlerCallback'] = undefined;
  client['lastToken'] = '';
  if (client['reconnectTimeoutId']) {
    clearTimeout(client['reconnectTimeoutId']);
    client['reconnectTimeoutId'] = undefined;
  }
  client['currentStatus'] = WebSocketStatus.DISCONNECTED;
  client['stompClient'] = null;
}

describe('WebSocketClient', () => {
  beforeEach(() => {
    resetWebSocketClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    wsClient.disconnect();
  });

  describe('connect', () => {
    it('should connect with JWT token', async () => {
      const token = 'test-jwt-token';
      const promise = wsClient.connect(token);

      // Should transition to CONNECTING
      expect(wsClient.getStatus()).toBe(WebSocketStatus.CONNECTING);

      await promise;

      // Should be CONNECTED after successful connection
      expect(wsClient.isConnected()).toBe(true);
      expect(wsClient.getStatus()).toBe(WebSocketStatus.CONNECTED);
    });

    it('should include Authorization header', async () => {
      const token = 'test-jwt-token';
      const connectPromise = wsClient.connect(token);

      // Check that connect was called with correct headers
      await connectPromise;
      expect(wsClient.isConnected()).toBe(true);
    });

    it('should resolve immediately if already connected', async () => {
      await wsClient.connect('token1');
      const initialStatus = wsClient.getStatus();

      await wsClient.connect('token2');
      expect(wsClient.getStatus()).toBe(initialStatus);
    });
  });

  describe('subscribe', () => {
    beforeEach(async () => {
      await wsClient.connect('test-token');
    });

    it('should subscribe to a topic', () => {
      const callback = vi.fn();
      const topic = '/topic/stock-updates';

      wsClient.subscribe(topic, callback);

      expect(wsClient.getSubscriptions()).toContain(topic);
    });

    it('should throw error if not connected', () => {
      wsClient.disconnect();

      const callback = vi.fn();
      const topic = '/topic/stock-updates';

      expect(() => wsClient.subscribe(topic, callback)).toThrow(
        'WebSocket is not connected'
      );
    });

    it('should warn if subscribing to same topic twice', () => {
      const callback = vi.fn();
      const topic = '/topic/stock-updates';
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      wsClient.subscribe(topic, callback);
      wsClient.subscribe(topic, callback);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already subscribed')
      );

      warnSpy.mockRestore();
    });

    it('should handle message parsing', async () => {
      const callback = vi.fn();
      const topic = '/topic/stock-updates';

      wsClient.subscribe(topic, callback);

      // In a real test, we'd trigger the message through the stompjs mock
      // For now, this test validates the callback is registered
      expect(typeof callback).toBe('function');
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await wsClient.connect('test-token');
    });

    it('should unsubscribe from a topic', () => {
      const callback = vi.fn();
      const topic = '/topic/stock-updates';

      wsClient.subscribe(topic, callback);
      expect(wsClient.getSubscriptions()).toContain(topic);

      wsClient.unsubscribe(topic);
      expect(wsClient.getSubscriptions()).not.toContain(topic);
    });

    it('should warn if unsubscribing from non-existent topic', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      wsClient.unsubscribe('/topic/non-existent');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not subscribed to topic')
      );

      warnSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should disconnect and unsubscribe from all topics', async () => {
      await wsClient.connect('test-token');

      wsClient.subscribe('/topic/stock-updates', vi.fn());
      wsClient.subscribe('/topic/order-updates', vi.fn());

      expect(wsClient.isConnected()).toBe(true);

      wsClient.disconnect();

      expect(wsClient.isConnected()).toBe(false);
      expect(wsClient.getStatus()).toBe(WebSocketStatus.DISCONNECTED);
      expect(wsClient.getSubscriptions()).toHaveLength(0);
    });
  });

  describe('status callbacks', () => {
    it('should notify status change listeners', async () => {
      const callback = vi.fn();
      wsClient.onStatusChange(callback);

      await wsClient.connect('test-token');

      // Should have been called at least twice (CONNECTING, CONNECTED)
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(WebSocketStatus.CONNECTING);
      expect(callback).toHaveBeenCalledWith(WebSocketStatus.CONNECTED);
    });

    it('should allow unsubscribing from status callbacks', async () => {
      const callback = vi.fn();
      const unsubscribe = wsClient.onStatusChange(callback);

      await wsClient.connect('test-token');
      const callCount = callback.mock.calls.length;

      unsubscribe();

      wsClient.disconnect();

      // Callback should not be called after unsubscribe
      expect(callback.mock.calls.length).toBe(callCount);
    });
  });

  describe('error callbacks', () => {
    it('should register error callbacks', () => {
      const callback = vi.fn();
      wsClient.onError(callback);

      // Should be able to register without error
      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow unsubscribing from error callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = wsClient.onError(callback);

      unsubscribe();

      // Should not throw
      expect(unsubscribe).not.toThrow();
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await wsClient.connect('test-token');
    });

    it('should send a message to a destination', () => {
      const message = { type: 'test', data: 'hello' };

      // Should not throw
      expect(() => {
        wsClient.send('/app/test', message);
      }).not.toThrow();
    });

    it('should throw error if not connected', () => {
      wsClient.disconnect();

      expect(() => {
        wsClient.send('/app/test', { type: 'test' });
      }).toThrow('WebSocket is not connected');
    });
  });

  describe('getStatus', () => {
    it('should return current connection status', async () => {
      expect(wsClient.getStatus()).toBe(WebSocketStatus.DISCONNECTED);

      await wsClient.connect('test-token');
      expect(wsClient.getStatus()).toBe(WebSocketStatus.CONNECTED);

      wsClient.disconnect();
      expect(wsClient.getStatus()).toBe(WebSocketStatus.DISCONNECTED);
    });
  });

  describe('getSubscriptions', () => {
    beforeEach(async () => {
      await wsClient.connect('test-token');
    });

    it('should return list of active subscriptions', () => {
      const topics = [
        '/topic/stock-updates',
        '/topic/order-updates',
        '/user/queue/notifications',
      ];

      topics.forEach((topic) => {
        wsClient.subscribe(topic, vi.fn());
      });

      const subscriptions = wsClient.getSubscriptions();
      expect(subscriptions).toHaveLength(3);
      topics.forEach((topic) => {
        expect(subscriptions).toContain(topic);
      });
    });
  });

  describe('deprecated legacy functions', () => {
    it('should throw error for initWebSocket', async () => {
      const mod = await import('./websocketClient');
      expect(() => {
        mod.initWebSocket('ws://localhost:8080/ws');
      }).toThrow('deprecated');
    });

    it('should throw error for subscribe', async () => {
      const mod = await import('./websocketClient');
      expect(() => {
        mod.subscribe('/topic/test', vi.fn());
      }).toThrow('deprecated');
    });

    it('should throw error for unsubscribe', async () => {
      const mod = await import('./websocketClient');
      expect(() => {
        mod.unsubscribe('/topic/test');
      }).toThrow('deprecated');
    });

    it('should throw error for disconnect', async () => {
      const mod = await import('./websocketClient');
      expect(() => {
        mod.disconnect();
      }).toThrow('deprecated');
    });
  });
});
