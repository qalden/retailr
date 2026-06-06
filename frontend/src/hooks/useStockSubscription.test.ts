import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStockSubscription } from './useStockSubscription';
import { wsClient } from '@/utils/websocketClient';

vi.mock('@/utils/websocketClient');

const mockUseWebSocketConnection = vi.fn(() => ({
  connected: true,
  connecting: false,
  error: null,
}));

vi.mock('./useWebSocketConnection', () => ({
  useWebSocketConnection: () => mockUseWebSocketConnection(),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => vi.fn(),
    useSelector: () => [],
  };
});

describe('useStockSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (wsClient.subscribe as any).mockImplementation(() => {});
    (wsClient.unsubscribe as any).mockImplementation(() => {});

    mockUseWebSocketConnection.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty stock data when disabled', () => {
    const { result } = renderHook(() => useStockSubscription(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.subscribed).toBe(false);
  });

  it('should not subscribe when disabled', () => {
    const subscribeSpy = vi.spyOn(wsClient, 'subscribe' as any);

    renderHook(() => useStockSubscription(false));

    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('should call subscribe with correct topic when enabled', () => {
    const subscribeSpy = vi.spyOn(wsClient, 'subscribe' as any);

    renderHook(() => useStockSubscription(true));

    expect(subscribeSpy).toHaveBeenCalledWith(
      '/topic/stock-updates',
      expect.any(Function),
    );
  });

  it('should not call subscribe when not connected', () => {
    mockUseWebSocketConnection.mockReturnValue({
      connected: false,
      connecting: true,
      error: null,
    });

    const subscribeSpy = vi.spyOn(wsClient, 'subscribe' as any);

    renderHook(() => useStockSubscription(true));

    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribeSpy = vi.spyOn(wsClient, 'unsubscribe' as any);

    const { unmount } = renderHook(() => useStockSubscription(true));

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledWith('/topic/stock-updates');
  });
});
