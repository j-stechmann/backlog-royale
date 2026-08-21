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
  canManageRound: boolean;
  onReveal: () => void;
  onReset: () => void;
  onToggleAFK: (userId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  users,
  currentUserID,
  reveal,
  isDealer,
  canManageRound,
  onReveal,
  onReset,
  onToggleAFK,
}) => {
  const players = users.filter((u) => u.role === ROLES.PLAYER);
  const votedPlayersCount = players.filter((u) => u.hasVoted).length;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
      <div className="p-4 border-b border-line bg-surface-2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-accent-text" />
            <h2 className="font-bold text-content text-sm">Players</h2>
          </div>
          <div className="px-3 py-1 bg-accent-soft border border-accent-soft rounded-lg">
            <span className="text-xs font-bold text-accent-strong">
              {votedPlayersCount} / {players.length} Voted
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageRound && (
            <>
              <button
                onClick={onReveal}
                disabled={reveal || players.length === 0 || !players.every((u) => u.hasVoted)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface text-mid-text border border-line px-4 py-2.5 rounded-xl hover:border-accent hover:text-accent-text transition-all text-sm font-bold disabled:opacity-50 active:scale-95 shadow-sm"
              >
                <Eye size={18} /> Reveal Results
              </button>
              <button
                onClick={onReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl hover:bg-accent-strong transition-all text-sm font-bold active:scale-95 shadow-lg shadow-accent/20 dark:shadow-black/30"
              >
                <RotateCcw size={18} /> Next Round
              </button>
            </>
          )}
        </div>
      </div>
      <div className="divide-y divide-line">
        {users.map((user) => (
          <div key={user.id} className="p-4 flex justify-between items-center group">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  user.id === currentUserID ? 'bg-accent text-white' : 'bg-surface-3 text-mid-text'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={`font-medium truncate ${user.id === currentUserID ? 'text-accent-text' : 'text-content'}`}>
                {user.name} {user.id === currentUserID && <span className="text-[10px] text-subtle">(You)</span>}
                {user.role === ROLES.DEALER && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-warn-soft text-warn-strong">
                    DEALER
                  </span>
                )}
                {user.role === ROLES.AFK && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent-strong">
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
