import React from 'react';
import { Logo } from './Logo';
import { Share2, Coffee, HandHelping } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
  roomID: string;
  connected: boolean;
  isAFK: boolean;
  isDealer: boolean;
  onToggleAFK: () => void;
  onToggleRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomID,
  connected,
  isAFK,
  isDealer,
  onToggleAFK,
  onToggleRole,
}) => {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Room link copied!');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Backlog Royale</h1>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600 font-medium">{roomID}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAFK}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                isAFK ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isAFK ? 'Return to Game' : 'Go AFK'}
            >
              <Coffee size={16} />
              <span className="hidden sm:inline">{isAFK ? 'AFK' : 'Go AFK'}</span>
            </button>
            <button
              onClick={onToggleRole}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                isDealer ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isDealer ? 'Switch to Player' : 'Become Dealer'}
            >
              <HandHelping size={16} />
              <span className="hidden sm:inline">{isDealer ? 'Dealer' : 'Become Dealer'}</span>
            </button>
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full mr-2">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
              />
              <span className="text-xs font-semibold text-gray-600">{connected ? 'Live' : 'Reconnecting...'}</span>
            </div>
            <button
              onClick={copyLink}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy Invite Link"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
