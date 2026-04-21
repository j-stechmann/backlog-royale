import React from 'react';

interface CardProps {
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ value, selected, onClick, disabled }) => {
  return (
    <div className="relative group m-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-16 h-24 sm:w-20 sm:h-32 rounded-xl border-2 transition-all duration-200 flex items-center justify-center text-xl sm:text-2xl font-bold
          ${selected 
            ? 'bg-blue-500 border-blue-600 text-white transform -translate-y-2 shadow-lg shadow-blue-200' 
            : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:shadow-lg'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer'}
        `}
      >
        {value}
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
