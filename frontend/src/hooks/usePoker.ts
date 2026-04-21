import { useState, useEffect, useRef, useCallback } from 'react';

export interface User {
  name: string;
  hasVoted: boolean;
  vote?: string;
}

export interface RoomState {
  type: string;
  id: string;
  users: User[];
  reveal: boolean;
}

export const usePoker = (roomID: string, userName: string) => {
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (ws.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws?room=${roomID}&name=${userName}`);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'STATE') {
        setState(data);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      ws.current = null;
      // Reconnect after a delay
      setTimeout(connect, 3000);
    };

    ws.current = socket;
  }, [roomID, userName]);

  useEffect(() => {
    if (roomID && userName) {
      connect();
    }
    return () => {
      ws.current?.close();
    };
  }, [roomID, userName, connect]);

  const sendAction = (type: string, payload: any = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, name: userName, ...payload }));
    }
  };

  return { state, connected, sendAction };
};
