import { renderHook, act } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { useBacklogRoyale } from './useBacklogRoyale';
import { MESSAGE_TYPES, ROLES } from '../constants';

// Mock WebSocket — tracks all instances so tests can inspect both the
// old and new sockets after a room switch. close() is synchronous so
// test ordering is deterministic (see review discussion on async vs
// sync onclose).
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  onopen: () => void = () => {};
  onmessage: (event: { data: string }) => void = () => {};
  onclose: () => void = () => {};
  send = vi.fn();
  url: string;
  readyState = 1; // OPEN
  closed = false;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
    setTimeout(() => this.onopen(), 0);
  }

  close() {
    this.closed = true;
    this.readyState = 3; // CLOSED
    this.onclose();
  }
}

const wsInstances: MockWebSocket[] = [];

vi.stubGlobal('WebSocket', MockWebSocket);

const lastWsInstance = () => wsInstances[wsInstances.length - 1];

beforeEach(() => {
  wsInstances.length = 0;
  vi.clearAllMocks();
});

test('should connect to websocket', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  const ws = lastWsInstance();
  expect(ws.url).toContain('room=test-room');
  expect(ws.url).toContain('name=Alice');
  expect(ws.url).not.toContain('id=');
  expect(ws.url).not.toContain('prevId=');
});

test('should include prevId in URL when provided', async () => {
  renderHook(() => useBacklogRoyale('test-room', 'Alice', undefined, 'old-server-id'));

  await vi.waitFor(() => {
    expect(lastWsInstance()).not.toBeUndefined();
  });

  expect(lastWsInstance().url).toContain('prevId=old-server-id');
});

test('should omit prevId from URL when empty', async () => {
  renderHook(() => useBacklogRoyale('test-room', 'Alice', undefined, ''));

  await vi.waitFor(() => {
    expect(lastWsInstance()).not.toBeUndefined();
  });

  expect(lastWsInstance().url).not.toContain('prevId');
});

test('should handle WELCOME message', async () => {
  const onIDAssigned = vi.fn();
  renderHook(() => useBacklogRoyale('test-room', 'Alice', onIDAssigned));

  await vi.waitFor(() => {
    expect(lastWsInstance()).not.toBeUndefined();
  });

  const welcomeMessage = {
    type: MESSAGE_TYPES.WELCOME,
    id: 'server-assigned-id'
  };

  await act(async () => {
    lastWsInstance().onmessage({ data: JSON.stringify(welcomeMessage) });
  });

  expect(onIDAssigned).toHaveBeenCalledWith('server-assigned-id');
});

test('should handle STATE updates', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

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
    lastWsInstance().onmessage({ data: JSON.stringify(mockState) });
  });

  expect(result.current.state).toEqual(mockState);
});

test('should handle role changes in state', async () => {
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

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
    lastWsInstance().onmessage({ data: JSON.stringify(stateAsPlayer) });
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
    lastWsInstance().onmessage({ data: JSON.stringify(stateAsDealer) });
  });

  expect(result.current.state?.users[0].role).toBe(ROLES.DEALER);
  expect(result.current.state?.dealerId).toBe('user-123');
});

test('should switch rooms: close old socket and connect to new room', async () => {
  const { result, rerender } = renderHook(
    ({ roomId, name, prevId }) => useBacklogRoyale(roomId, name, undefined, prevId),
    { initialProps: { roomId: 'room-a', name: 'Alice', prevId: '' } }
  );

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  expect(wsInstances).toHaveLength(1);
  const oldSocket = wsInstances[0];
  expect(oldSocket.url).toContain('room=room-a');

  // Switch to room B with a prevId.
  rerender({ roomId: 'room-b', name: 'Alice', prevId: 'old-server-id' });

  await vi.waitFor(() => {
    expect(wsInstances).toHaveLength(2);
  });

  const newSocket = wsInstances[1];
  expect(newSocket.url).toContain('room=room-b');
  expect(newSocket.url).toContain('prevId=old-server-id');

  // Old socket should have been closed.
  expect(oldSocket.closed).toBe(true);
  // No third socket should appear (no reconnect to old room).
  expect(wsInstances).toHaveLength(2);
});

test('should not create a new socket when props are unchanged', async () => {
  const { result, rerender } = renderHook(
    ({ roomId, name, prevId }) => useBacklogRoyale(roomId, name, undefined, prevId),
    { initialProps: { roomId: 'room-a', name: 'Alice', prevId: 'old-id' } }
  );

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  expect(wsInstances).toHaveLength(1);

  // Rerender with identical props — no new socket.
  rerender({ roomId: 'room-a', name: 'Alice', prevId: 'old-id' });

  // Give it a tick to ensure no new socket is created.
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(wsInstances).toHaveLength(1);
});

test('should reconnect after an unintentional close', async () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await act(async () => {
    vi.runAllTimers();
  });

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  expect(wsInstances).toHaveLength(1);

  // Simulate a server-side disconnect (not an intentional close via cleanup).
  const socket = wsInstances[0];
  await act(async () => {
    socket.onclose();
  });

  // After the 3s reconnect timer, a new socket should be created.
  await act(async () => {
    vi.advanceTimersByTime(3000);
  });

  expect(wsInstances).toHaveLength(2);
  expect(wsInstances[1].url).toContain('room=test-room');

  vi.useRealTimers();
});

test('should surface the connection error after three consecutive failed handshakes but keep retrying', async () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await act(async () => {
    vi.runAllTimers();
  });

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  // Three sockets, each closed before any WELCOME arrived (e.g. the
  // server rejected the upgrade with HTTP 400).
  for (let i = 0; i < 3; i++) {
    await vi.waitFor(() => {
      expect(wsInstances).toHaveLength(i + 1);
    });
    await act(async () => {
      wsInstances[i].onclose();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
  }

  expect(result.current.connectionError).toBe(
    'Could not reach the room — the link may be invalid or outdated.'
  );
  expect(result.current.connected).toBe(false);

  // The retry loop keeps running: a failed-handshake streak is
  // indistinguishable from a transient outage, so a fourth socket
  // appears and a later WELCOME recovers the connection.
  await act(async () => {
    vi.advanceTimersByTime(3000);
  });
  await vi.waitFor(() => {
    expect(wsInstances).toHaveLength(4);
  });
  await act(async () => {
    wsInstances[3].onmessage({ data: JSON.stringify({ type: MESSAGE_TYPES.WELCOME, id: 'id-recovered' }) });
  });

  expect(result.current.connectionError).toBeNull();
  expect(result.current.connected).toBe(true);

  vi.useRealTimers();
});

test('should reset the handshake-failure counter after a WELCOME', async () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useBacklogRoyale('test-room', 'Alice'));

  await act(async () => {
    vi.runAllTimers();
  });

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  // Two failed handshakes...
  for (let i = 0; i < 2; i++) {
    await vi.waitFor(() => {
      expect(wsInstances).toHaveLength(i + 1);
    });
    await act(async () => {
      wsInstances[i].onclose();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
  }

  // ...then a successful connection: WELCOME arrives before close.
  await vi.waitFor(() => {
    expect(wsInstances).toHaveLength(3);
  });
  await act(async () => {
    wsInstances[2].onmessage({ data: JSON.stringify({ type: MESSAGE_TYPES.WELCOME, id: 'id-1' }) });
    wsInstances[2].onclose();
  });
  await act(async () => {
    vi.advanceTimersByTime(3000);
  });

  await vi.waitFor(() => {
    expect(wsInstances).toHaveLength(4);
  });
  await act(async () => {
    wsInstances[3].onmessage({ data: JSON.stringify({ type: MESSAGE_TYPES.WELCOME, id: 'id-2' }) });
  });

  // A subsequent failure reconnects again instead of erroring.
  await act(async () => {
    wsInstances[3].onclose();
  });
  await act(async () => {
    vi.advanceTimersByTime(3000);
  });
  expect(wsInstances).toHaveLength(5);
  expect(result.current.connectionError).toBeNull();

  vi.useRealTimers();
});

test('sendAction should target the new socket after a room switch', async () => {
  const { result, rerender } = renderHook(
    ({ roomId, name, prevId }) => useBacklogRoyale(roomId, name, undefined, prevId),
    { initialProps: { roomId: 'room-a', name: 'Alice', prevId: '' } }
  );

  await vi.waitFor(() => {
    expect(result.current.connected).toBe(true);
  });

  const oldSocket = wsInstances[0];

  rerender({ roomId: 'room-b', name: 'Alice', prevId: 'old-id' });

  // Wait for the new socket to be created.
  await vi.waitFor(() => {
    expect(wsInstances).toHaveLength(2);
  });

  const newSocket = wsInstances[1];

  // Manually fire onopen for the new socket and wait for state to settle.
  await act(async () => {
    newSocket.onopen();
  });

  // Verify the hook is connected and ws.current points to the new socket.
  expect(result.current.connected).toBe(true);

  oldSocket.send.mockClear();
  newSocket.send.mockClear();

  act(() => {
    result.current.sendAction('VOTE', { vote: '5' });
  });

  expect(oldSocket.send).not.toHaveBeenCalled();
  expect(newSocket.send).toHaveBeenCalledTimes(1);
  expect(newSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'VOTE', vote: '5' }));
});
