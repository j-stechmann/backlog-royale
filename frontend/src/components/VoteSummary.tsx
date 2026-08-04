import React from 'react';
import type { User } from '../hooks/useBacklogRoyale';
import { getTheme } from '../utils/theme';
import { ROLES } from '../constants';
import { CardFace } from './CardFace';

interface VoteSummaryProps {
  users: User[];
}

export const VoteSummary: React.FC<VoteSummaryProps> = ({ users }) => {
  const votes = users
    .filter(u => u.role === ROLES.PLAYER && u.vote)
    .reduce((acc, u) => {
      const vote = u.vote!;
      acc[vote] = (acc[vote] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);

  if (sortedVotes.length === 0) return null;

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-200 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-gray-800 mb-2">Voting Summary</h2>
        <p className="text-gray-400 text-sm font-medium">Distribution of points for this round</p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
        {sortedVotes.map(([value, count]) => {
          const theme = getTheme(value);
          return (
            <div key={value} className="flex items-center gap-3 sm:gap-4 group transition-transform duration-300 hover:-translate-y-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-3xl sm:text-5xl font-black text-gray-900 tabular-nums leading-none">
                  {count}
                </span>
                <span className="text-3xl sm:text-5xl font-black text-gray-400 leading-none">×</span>
              </div>
              <div className={`
                w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 flex items-center justify-center text-2xl sm:text-4xl font-black relative overflow-hidden
                ${theme.bg} ${theme.border} ${theme.text} shadow-xl ${theme.shadow}
              `}>
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '12px 12px' }} />
                </div>

                {/* Top-left corner */}
                <div className={`absolute top-2 left-2 flex flex-col items-center leading-none ${theme.text}`}>
                  <CardFace value={value} textClassName="text-xs sm:text-sm font-bold" iconClassName="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>

                {/* Bottom-right corner */}
                <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${theme.text}`}>
                  <CardFace value={value} textClassName="text-xs sm:text-sm font-bold" iconClassName="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>

                {/* Center value */}
                <div className={`${theme.text} drop-shadow-sm`}>
                  <CardFace value={value} textClassName="text-2xl sm:text-4xl font-black" iconClassName="w-6 h-6 sm:w-9 sm:h-9" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
