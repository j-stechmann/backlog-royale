import { renderHook, act } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { useBacklogRoyale } from './useBacklogRoyale';
import { MESSAGE_TYPES, ROLES } from '../constants';

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
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice', 'user-123'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });
  
  expect(lastWsInstance.url).toContain('room=test-room');
  expect(lastWsInstance.url).toContain('name=Alice');
  expect(lastWsInstance.url).toContain('id=user-123');
});

test('should handle STATE updates', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice', 'user-123'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  const mockState = {
    type: MESSAGE_TYPES.STATE,
    id: 'test-room',
    users: [{ id: '1', name: 'Alice', hasVoted: false, role: ROLES.PLAYER }],
    reveal: false,
    dealerId: ''
  };

  await act(async () => {
    lastWsInstance.onmessage({ data: JSON.stringify(mockState) });
  });

  expect(result.current.state).toEqual(mockState);
});

test('should handle role changes in state', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice', 'user-123'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  const stateAsPlayer = {
    type: MESSAGE_TYPES.STATE,
    id: 'test-room',
    users: [{ id: 'user-123', name: 'Alice', hasVoted: false, role: ROLES.PLAYER }],
    reveal: false,
    dealerId: ''
  };

  await act(async () => {
    lastWsInstance.onmessage({ data: JSON.stringify(stateAsPlayer) });
  });

  expect(result.current.state?.users[0].role).toBe(ROLES.PLAYER);

  const stateAsDealer = {
    type: MESSAGE_TYPES.STATE,
    id: 'test-room',
    users: [{ id: 'user-123', name: 'Alice', hasVoted: false, role: ROLES.DEALER }],
    reveal: false,
    dealerId: 'user-123'
  };

  await act(async () => {
    lastWsInstance.onmessage({ data: JSON.stringify(stateAsDealer) });
  });

  expect(result.current.state?.users[0].role).toBe(ROLES.DEALER);
  expect(result.current.state?.dealerId).toBe('user-123');
});
