import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { wsClient } from '@/utils/websocketClient';
import { WebSocketStatus } from '@/utils/websocketTypes';

vi.mock('@/utils/websocketClient');

const mockUseAuth = vi.fn();

vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useWebSocketConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockClear();

    mockUseAuth.mockReturnValue({
      token: 'test-token',
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    (wsClient.isConnected as any).mockReturnValue(false);
    (wsClient.connect as any).mockResolvedValue(undefined);
    (wsClient.disconnect as any).mockReturnValue(undefined);
    (wsClient.onStatusChange as any).mockReturnValue(() => {});
    (wsClient.onError as any).mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocketConnection());

    expect(result.current.connected).toBe(false);
    expect(result.current.connecting).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should attempt connection on mount with token', async () => {
    const connectSpy = vi.spyOn(wsClient, 'connect' as any);

    renderHook(() => useWebSocketConnection());

    await waitFor(() => {
      expect(connectSpy).toHaveBeenCalledWith('test-token');
    });
  });

  it('should not attempt connection if token is null', () => {
    mockUseAuth.mockReturnValue({
      token: null as string | null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const connectSpy = vi.spyOn(wsClient, 'connect' as any);

    const { result } = renderHook(() => useWebSocketConnection());

    expect(connectSpy).not.toHaveBeenCalled();
    expect(result.current.connecting).toBe(false);
  });

  it('should update state to connected when status changes to CONNECTED', async () => {
    const statusCallbacks: Array<(status: WebSocketStatus) => void> = [];

    (wsClient.onStatusChange as any).mockImplementation((cb: (status: WebSocketStatus) => void) => {
      statusCallbacks.push(cb);
      return () => {};
    });

    const { result } = renderHook(() => useWebSocketConnection());

    expect(statusCallbacks.length).toBeGreaterThan(0);
    const callback = statusCallbacks[0];
    callback(WebSocketStatus.CONNECTED);

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.connecting).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle ERROR status', async () => {
    const statusCallbacks: Array<(status: WebSocketStatus) => void> = [];

    (wsClient.onStatusChange as any).mockImplementation((cb: (status: WebSocketStatus) => void) => {
      statusCallbacks.push(cb);
      return () => {};
    });

    const { result } = renderHook(() => useWebSocketConnection());

    const callback = statusCallbacks[0];
    callback(WebSocketStatus.ERROR);

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(result.current.connecting).toBe(false);
    });
  });

  it('should update state when error occurs', async () => {
    const errorCallbacks: Array<(error: Error) => void> = [];

    (wsClient.onError as any).mockImplementation((cb: (error: Error) => void) => {
      errorCallbacks.push(cb);
      return () => {};
    });

    const { result } = renderHook(() => useWebSocketConnection());

    const testError = new Error('Connection failed');
    expect(errorCallbacks.length).toBeGreaterThan(0);
    const callback = errorCallbacks[0];
    callback(testError);

    await waitFor(() => {
      expect(result.current.error).toBe('Connection failed');
      expect(result.current.connected).toBe(false);
      expect(result.current.connecting).toBe(false);
    });
  });

  it('should disconnect on unmount', () => {
    const disconnectSpy = vi.spyOn(wsClient, 'disconnect' as any);

    const { unmount } = renderHook(() => useWebSocketConnection());

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
