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
  const ws = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onIDAssignedRef = useRef(onIDAssigned);
  const genRef = useRef(0);
  const prevIdRef = useRef(prevId || '');

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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${defaultHost}`;
    const prevIdParam = prevIdRef.current ? `&prevId=${encodeURIComponent(prevIdRef.current)}` : '';
    const socket = new WebSocket(`${host}/ws?room=${encodeURIComponent(roomID)}&name=${encodeURIComponent(userName)}${prevIdParam}`);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === MESSAGE_TYPES.STATE) {
        setState(data);
      } else if (data.type === MESSAGE_TYPES.WELCOME) {
        onIDAssignedRef.current?.(data.id);
      }
    };

    socket.onclose = () => {
      if (myGen !== genRef.current) return;
      setConnected(false);
      ws.current = null;
      reconnectTimeoutRef.current = window.setTimeout(() => connectRef.current(), 3000);
    };

    ws.current = socket;
  }, [roomID, userName]);

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

  return { state, connected, sendAction };
};
