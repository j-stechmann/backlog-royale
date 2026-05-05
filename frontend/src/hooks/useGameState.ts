import { useState, useEffect, useRef } from 'react';
import { useBacklogRoyale } from './useBacklogRoyale';

export const useGameState = () => {
  const [roomID, setRoomID] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  });
  const [name, setName] = useState(() => {
    return localStorage.getItem('backlog_royale_name') || '';
  });
  const [userID] = useState(() => {
    let id = localStorage.getItem('backlog_royale_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('backlog_royale_id', id);
    }
    return id;
  });
  const [isJoined, setIsJoined] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const savedName = localStorage.getItem('backlog_royale_name');
    return !!(room && savedName);
  });
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  const { state, connected, sendAction } = useBacklogRoyale(isJoined ? roomID : '', isJoined ? name : '', userID);

  const prevVotedCount = useRef(0);
  const prevReveal = useRef(false);

  useEffect(() => {
    if (state) {
      const votedCount = state.users.filter(u => u.hasVoted).length;
      const resetHappened = (votedCount === 0 && prevVotedCount.current > 0) || 
                           (prevReveal.current && !state.reveal);
      
      if (resetHappened) {
        setSelectedVote(null);
      }
      
      prevVotedCount.current = votedCount;
      prevReveal.current = state.reveal;
    }
  }, [state]);

  const joinRoom = (newRoomID: string, newName: string) => {
    setRoomID(newRoomID);
    setName(newName);
    localStorage.setItem('backlog_royale_name', newName);
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoomID);
    window.history.pushState({}, '', url);
    setIsJoined(true);
  };

  return {
    roomID,
    name,
    userID,
    isJoined,
    selectedVote,
    setSelectedVote,
    state,
    connected,
    sendAction,
    joinRoom
  };
};
