import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Card (Shadow/Depth) */}
      <rect x="12" y="12" width="26" height="32" rx="3" fill="#E5E7EB" />
      <rect x="12" y="12" width="26" height="32" rx="3" stroke="#D1D5DB" strokeWidth="1" />

      {/* Main Card */}
      <rect x="10" y="8" width="26" height="32" rx="3" fill="white" stroke="#2563EB" strokeWidth="2" />
      
      {/* Crown - Centered on the card instead of a number */}
      <path 
        d="M15 28L13 16L19 20L23 12L27 20L33 16L31 28H15Z" 
        fill="#FBBF24" 
        stroke="#B45309" 
        strokeWidth="1"
        strokeLinejoin="round"
      />
      
      {/* Crown Jewels */}
      <circle cx="23" cy="15" r="1.2" fill="#EF4444" />
      <circle cx="17.5" cy="19.5" r="1" fill="#3B82F6" />
      <circle cx="28.5" cy="19.5" r="1" fill="#3B82F6" />
      
      {/* Small base for the crown to make it feel like a card emblem */}
      <rect x="18" y="28" width="10" height="2" rx="0.5" fill="#B45309" opacity="0.2" />
    </svg>
  );
};
