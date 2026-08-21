import React from 'react';
import { HandHelping, Coffee } from 'lucide-react';
import { getTheme } from '../utils/theme';
import { ROLES } from '../constants';
import type { Role } from '../constants';
import { CardFace } from './CardFace';

interface UserStatusProps {
  role: Role;
  hasVoted: boolean;
  vote?: string;
  reveal: boolean;
  isDealerAction: boolean;
  onToggleAFK: () => void;
}

export const UserStatus: React.FC<UserStatusProps> = ({
  role,
  hasVoted,
  vote,
  reveal,
  isDealerAction,
  onToggleAFK,
}) => {
  const renderStatus = () => {
    if (role === ROLES.DEALER) {
      return (
        <div className="w-10 h-14 flex items-center justify-center text-warn">
          <HandHelping size={24} />
        </div>
      );
    }

    if (role === ROLES.AFK) {
      return (
        <div className="w-10 h-14 flex items-center justify-center text-accent-text">
          <Coffee size={24} />
        </div>
      );
    }

    if (hasVoted) {
      if (reveal && vote) {
        const theme = getTheme(vote);
        return (
          <div className={`
            w-10 h-14 rounded-lg border-2 flex items-center justify-center font-black text-lg relative shadow-sm transition-all
            ${theme.bg} ${theme.border} ${theme.text}
          `}>
            <span className="absolute top-0.5 left-1 opacity-70 leading-none">
              <CardFace value={vote} textClassName="text-[8px] font-bold" iconClassName="w-2 h-2" />
            </span>
            <span className="absolute bottom-0.5 right-1 opacity-70 rotate-180 leading-none">
              <CardFace value={vote} textClassName="text-[8px] font-bold" iconClassName="w-2 h-2" />
            </span>
            <CardFace value={vote} textClassName="font-black text-lg" iconClassName="w-5 h-5" />
          </div>
        );
      }

      return (
        <div className="w-10 h-14 bg-ok rounded-lg flex items-center justify-center shadow-lg shadow-ok/20 dark:shadow-black/30">
          <span className="font-bold text-xl text-emerald-950">✓</span>
        </div>
      );
    }

    return (
      <div className="w-10 h-14 border-2 border-dashed border-line rounded-lg flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-surface-3" />
      </div>
    );
  };

  return (
    <div className={`relative group/status w-12 h-16 flex items-center justify-center ${role === ROLES.PLAYER && hasVoted && !reveal ? 'animate-bounce-subtle' : ''}`}>
      {isDealerAction && role !== ROLES.AFK && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAFK();
          }}
          className="absolute inset-x-1 inset-y-1 z-10 bg-surface flex items-center justify-center text-accent-text rounded-lg opacity-0 group-hover/status:opacity-100 transition-opacity border-2 border-accent-soft shadow-md cursor-pointer"
          title="Toggle AFK"
        >
          <Coffee size={20} />
        </button>
      )}
      {renderStatus()}
    </div>
  );
};
