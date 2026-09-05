import React, { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import type { ThemeMode } from '../hooks/useTheme';

interface JoinViewProps {
  initialRoomID: string;
  initialName: string;
  onJoin: (roomID: string, name: string) => void;
  theme: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
}

export const JoinView: React.FC<JoinViewProps> = ({ initialRoomID, initialName, onJoin, theme, onSetTheme }) => {
  const [roomID, setRoomID] = useState(initialRoomID);
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomID && name) {
      onJoin(roomID, name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base to-accent-soft flex items-center justify-center p-4 pb-16">
      <div className="bg-surface p-8 rounded-3xl shadow-2xl w-full max-w-md border border-glass backdrop-blur-sm relative">
        <ThemeToggle
          theme={theme}
          onSetTheme={onSetTheme}
          iconSize={14}
          className="absolute top-4 right-4"
        />
        <div className="flex justify-center mb-6">
          <Logo size={64} />
        </div>
        <h1 className="text-3xl font-black text-content mb-2 text-center tracking-tight">Backlog Royale</h1>
        <p className="text-mid-text text-center mb-8">Real-time story pointing for teams</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-mid-text mb-2 px-1">Room Name</label>
            <input
              type="text"
              value={roomID}
              onChange={(e) => setRoomID(e.target.value)}
              placeholder="e.g. engineering-sprint-21"
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-muted"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-mid-text mb-2 px-1">Your Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should your team see you?"
              className="w-full px-4 py-3 bg-surface-2 border border-line rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-muted"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent-strong transition-all shadow-xl hover:shadow-accent-strong/30 active:scale-[0.98]"
          >
            Start Voting
          </button>
        </form>
      </div>
    </div>
  );
};
