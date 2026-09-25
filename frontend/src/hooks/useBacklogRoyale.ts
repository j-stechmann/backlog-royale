import { useState, useEffect, useRef, useCallback } from 'react';
import { MESSAGE_TYPES } from '../constants';
import type { Role } from '../constants';

export interface User {
  id: string;
  name: string;
  hasVoted: boolean;
  vote?: string;
  role: Role;
}

export interface RoomState {
  type: string;
  id: string;
  users: User[];
  reveal: boolean;
  dealerId: string;
}

export const useBacklogRoyale = (
  roomID: string,
  userName: string,
  onIDAssigned?: (id: string) => void,
  prevId?: string
) => {
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  // Surfaced after three consecutive closes without a WELCOME (failed
  // handshakes — e.g. the server rejected the upgrade with HTTP 400).
  // Keyed by the room/name it failed for, so it automatically stops
  // applying when the user joins a different room. The retry loop keeps
  // running (a failure streak is indistinguishable from a transient
  // outage); WELCOME clears the failure so the pill flips back to Live.
  const [connectionFailure, setConnectionFailure] = useState<{ key: string; message: string } | null>(null);
  // JSON-encoding avoids delimiter collisions: roomID is free-form user
  // input and may contain "|".
  const connectionKey = JSON.stringify([roomID, userName]);
  const connectionError = connectionFailure?.key === connectionKey ? connectionFailure.message : null;
  const ws = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onIDAssignedRef = useRef(onIDAssigned);
  const genRef = useRef(0);
  const prevIdRef = useRef(prevId || '');
  const handshakeFailures = useRef(0);
  const connectKeyRef = useRef('');

  useEffect(() => {
    onIDAssignedRef.current = onIDAssigned;
  }, [onIDAssigned]);

  useEffect(() => {
    prevIdRef.current = prevId || '';
  }, [prevId]);

  const connect = useCallback(() => {
    if (ws.current) return;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const myGen = ++genRef.current;

    // A new connection target resets the handshake-failure bookkeeping.
    if (connectKeyRef.current !== connectionKey) {
      connectKeyRef.current = connectionKey;
      handshakeFailures.current = 0;
      setConnectionFailure(null);
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${defaultHost}`;
    const prevIdParam = prevIdRef.current ? `&prevId=${encodeURIComponent(prevIdRef.current)}` : '';
    const socket = new WebSocket(`${host}/ws?room=${encodeURIComponent(roomID)}&name=${encodeURIComponent(userName)}${prevIdParam}`);

    // A connection that closes without ever receiving WELCOME counts as
    // a failed handshake (e.g. the server rejected the upgrade with an
    // HTTP 400 — the browser only reports a generic 1006 close, so a bad
    // room link is indistinguishable from a transient outage). After
    // three consecutive failures the pill surfaces an error, but the
    // 3-second retry loop keeps running so a server that comes back is
    // still reachable; WELCOME clears the error.
    let welcomed = false;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === MESSAGE_TYPES.STATE) {
        setState(data);
      } else if (data.type === MESSAGE_TYPES.WELCOME) {
        welcomed = true;
        handshakeFailures.current = 0;
        setConnectionFailure(null);
        onIDAssignedRef.current?.(data.id);
      }
    };

    socket.onclose = () => {
      if (myGen !== genRef.current) return;
      setConnected(false);
      ws.current = null;
      if (!welcomed) {
        handshakeFailures.current++;
        if (handshakeFailures.current >= 3) {
          setConnectionFailure({
            key: connectionKey,
            message: 'Could not reach the room — the link may be invalid or outdated.'
          });
        }
      }
      reconnectTimeoutRef.current = window.setTimeout(() => connectRef.current(), 3000);
    };

    ws.current = socket;
  }, [roomID, userName, connectionKey]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (roomID && userName) {
      connect();
    }
    return () => {
      genRef.current++;
      ws.current?.close();
      ws.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [roomID, userName, connect]);

  const sendAction = (type: string, payload: Record<string, unknown> = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, ...payload }));
    }
  };

  return { state, connected, connectionError, sendAction };
};
