import { renderHook, act } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { useBacklogRoyale } from './useBacklogRoyale';

// Mock WebSocket
let lastWsInstance: MockWebSocket | null = null;

class MockWebSocket {
  onopen: () => void = () => {};
  onmessage: (event: { data: string }) => void = () => {};
  onclose: () => void = () => {};
  send = vi.fn();
  close = vi.fn();
  readyState = 1; // OPEN
  url: string;

  constructor(url: string) {
    this.url = url;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastWsInstance = this;
    setTimeout(() => this.onopen(), 0);
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

beforeEach(() => {
  lastWsInstance = null;
  vi.clearAllMocks();
});

test('should connect to websocket', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });
  
  expect(lastWsInstance.url).toContain('room=test-room');
  expect(lastWsInstance.url).toContain('name=Alice');
});

test('should handle STATE updates', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  const mockState = {
    type: 'STATE',
    id: 'test-room',
    users: [{ id: '1', name: 'Alice', hasVoted: false }],
    reveal: false
  };

  await act(async () => {
    lastWsInstance.onmessage({ data: JSON.stringify(mockState) });
  });

  expect(result.current.state).toEqual(mockState);
});
