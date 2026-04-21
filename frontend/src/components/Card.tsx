import React from 'react';

interface CardProps {
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ value, selected, onClick, disabled }) => {
  const getTheme = (val: string) => {
    if (val === '?') return {
      text: 'text-gray-400',
      bg: 'bg-gray-50',
      border: 'border-gray-400',
      ring: 'ring-gray-400/20',
      shadow: 'shadow-gray-200',
      hoverBorder: 'hover:border-gray-400'
    };
    const num = parseInt(val);
    if (num <= 3) return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-600',
      ring: 'ring-emerald-600/20',
      shadow: 'shadow-emerald-200',
      hoverBorder: 'hover:border-emerald-400'
    };
    if (num <= 8) return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-600',
      ring: 'ring-blue-600/20',
      shadow: 'shadow-blue-200',
      hoverBorder: 'hover:border-blue-400'
    };
    if (num <= 21) return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-600',
      ring: 'ring-rose-600/20',
      shadow: 'shadow-rose-200',
      hoverBorder: 'hover:border-rose-400'
    };
    return {
      text: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-600',
      ring: 'ring-gray-600/20',
      shadow: 'shadow-gray-200',
      hoverBorder: 'hover:border-gray-400'
    };
  };

  const theme = getTheme(value);

  return (
    <div className="relative group m-2">
      <button
        onClick={onClick}
        disabled={disabled}
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
          <span className="text-xs sm:text-sm font-bold">{value}</span>
        </div>

        {/* Bottom-right corner */}
        <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${theme.text}`}>
          <span className="text-xs sm:text-sm font-bold">{value}</span>
        </div>

        {/* Center value */}
        <div className={`${theme.text} drop-shadow-sm`}>
          {value}
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
