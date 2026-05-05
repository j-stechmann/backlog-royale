import React from 'react';
import { HandHelping, Coffee } from 'lucide-react';

interface UserStatusProps {
  role: 'player' | 'dealer' | 'afk';
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
    if (role === 'dealer') {
      return (
        <div className="w-10 h-14 flex items-center justify-center text-amber-500">
          <HandHelping size={24} />
        </div>
      );
    }

    if (role === 'afk') {
      return (
        <div className="w-10 h-14 flex items-center justify-center text-blue-500">
          <Coffee size={24} />
        </div>
      );
    }

    if (hasVoted) {
      if (reveal && vote) {
        return (
          <div className={`
            w-10 h-14 rounded-lg border-2 flex items-center justify-center font-black text-lg relative shadow-sm transition-all
            ${vote === '?' ? 'bg-gray-50 border-gray-200 text-gray-400' : 
              parseInt(vote) <= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
              parseInt(vote) <= 8 ? 'bg-blue-50 border-blue-200 text-blue-600' :
              'bg-rose-50 border-rose-200 text-rose-600'}
          `}>
            <span className="absolute top-0.5 left-1 text-[8px] opacity-70">{vote}</span>
            <span className="absolute bottom-0.5 right-1 text-[8px] opacity-70 rotate-180">{vote}</span>
            {vote}
          </div>
        );
      }

      return (
        <div className="w-10 h-14 bg-green-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-100 animate-bounce-subtle">
          <span className="font-bold text-xl">✓</span>
        </div>
      );
    }

    return (
      <div className="w-10 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
      </div>
    );
  };

  return (
    <div className="relative group/status w-12 h-16 flex items-center justify-center">
      {isDealerAction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAFK();
          }}
          className="absolute inset-x-1 inset-y-1 z-10 bg-white/95 backdrop-blur-[2px] flex items-center justify-center text-blue-600 rounded-xl opacity-0 group-hover/status:opacity-100 transition-opacity border-2 border-blue-100 shadow-md cursor-pointer"
          title="Toggle AFK"
        >
          <Coffee size={20} />
        </button>
      )}
      {renderStatus()}
    </div>
  );
};
