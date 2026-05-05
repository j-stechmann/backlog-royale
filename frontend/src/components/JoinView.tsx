import React, { useState } from 'react';
import { Logo } from './Logo';

interface JoinViewProps {
  initialRoomID: string;
  initialName: string;
  onJoin: (roomID: string, name: string) => void;
}

export const JoinView: React.FC<JoinViewProps> = ({ initialRoomID, initialName, onJoin }) => {
  const [roomID, setRoomID] = useState(initialRoomID);
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomID && name) {
      onJoin(roomID, name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <Logo size={64} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Backlog Royale</h1>
        <p className="text-gray-500 text-center mb-8">Real-time story pointing for teams</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Room Name</label>
            <input
              type="text"
              value={roomID}
              onChange={(e) => setRoomID(e.target.value)}
              placeholder="e.g. engineering-sprint-21"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Your Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should your team see you?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
          >
            Start Voting
          </button>
        </form>
      </div>
    </div>
  );
};
