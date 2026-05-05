import React from 'react';
import { Users, Eye, RotateCcw } from 'lucide-react';
import { UserStatus } from './UserStatus';
import type { User } from '../hooks/useBacklogRoyale';
import { ROLES } from '../constants';

interface PlayerListProps {
  users: User[];
  currentUserID: string;
  reveal: boolean;
  isDealer: boolean;
  onReveal: () => void;
  onReset: () => void;
  onToggleAFK: (userId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  users,
  currentUserID,
  reveal,
  isDealer,
  onReveal,
  onReset,
  onToggleAFK,
}) => {
  const players = users.filter((u) => u.role === ROLES.PLAYER);
  const votedPlayersCount = players.filter((u) => u.hasVoted).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-900 text-sm">Players</h2>
          </div>
          <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
            <span className="text-xs font-bold text-blue-700">
              {votedPlayersCount} / {players.length} Voted
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDealer && (
            <>
              <button
                onClick={onReveal}
                disabled={reveal || players.length === 0 || !players.every((u) => u.hasVoted)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all text-sm font-bold disabled:opacity-50 active:scale-95 shadow-sm"
              >
                <Eye size={18} /> Reveal Results
              </button>
              <button
                onClick={onReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold active:scale-95 shadow-lg shadow-blue-100"
              >
                <RotateCcw size={18} /> Next Round
              </button>
            </>
          )}
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {users.map((user) => (
          <div key={user.id} className="p-4 flex justify-between items-center group">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  user.id === currentUserID ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={`font-medium truncate ${user.id === currentUserID ? 'text-blue-600' : 'text-gray-900'}`}>
                {user.name} {user.id === currentUserID && <span className="text-[10px] text-gray-400">(You)</span>}
                {user.role === ROLES.DEALER && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                    DEALER
                  </span>
                )}
                {user.role === ROLES.AFK && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    AFK
                  </span>
                )}
              </span>
            </div>
            <UserStatus
              role={user.role}
              hasVoted={user.hasVoted}
              vote={user.vote}
              reveal={reveal}
              isDealerAction={isDealer && user.id !== currentUserID}
              onToggleAFK={() => onToggleAFK(user.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
