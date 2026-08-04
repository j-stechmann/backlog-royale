import React from 'react';
import { getTheme } from '../utils/theme';
import { CardFace } from './CardFace';

interface CardProps {
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ value, selected, onClick, disabled }) => {
  const theme = getTheme(value);

  return (
    <div className="relative group m-2">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={value === 'A' ? 'Abstain' : value}
        className={`
          w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-2xl sm:text-4xl font-black relative overflow-hidden
          ${selected 
            ? `${theme.bg} ${theme.border} ${theme.text} transform -translate-y-4 shadow-2xl ${theme.shadow} ring-4 ${theme.ring}` 
            : `bg-white border-gray-200 text-gray-800 ${theme.hoverBorder} hover:shadow-xl hover:-translate-y-1`
          }
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer'}
        `}
      >
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
      </button>
      
      {disabled && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl border border-white/10">
          Voting is locked
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};
