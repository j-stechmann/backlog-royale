import React from 'react';
import { Logo } from './Logo';
import { Share2, Coffee, HandHelping, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import type { ThemeMode } from '../hooks/useTheme';

interface HeaderProps {
  roomID: string;
  connected: boolean;
  isAFK: boolean;
  isDealer: boolean;
  onToggleAFK: () => void;
  onToggleRole: () => void;
  theme: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
}

const THEME_OPTIONS: { mode: ThemeMode; Icon: React.FC<{ size?: number }>; label: string }[] = [
  { mode: 'light', Icon: Sun, label: 'Light theme' },
  { mode: 'dark', Icon: Moon, label: 'Dark theme' },
  { mode: 'system', Icon: Monitor, label: 'System theme' },
];

export const Header: React.FC<HeaderProps> = ({
  roomID,
  connected,
  isAFK,
  isDealer,
  onToggleAFK,
  onToggleRole,
  theme,
  onSetTheme,
}) => {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Room link copied!');
  };

  return (
    <nav className="bg-surface border-b border-line sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-content">Backlog Royale</h1>
              <span className="text-line">|</span>
              <span className="text-muted font-medium">{roomID}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAFK}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                isAFK ? 'bg-accent-soft text-accent-strong hover:bg-accent-soft' : 'bg-surface-3 text-mid-text hover:bg-surface-3'
              }`}
              title={isAFK ? 'Return to Game' : 'Go AFK'}
            >
              <Coffee size={16} />
              <span className="hidden sm:inline">{isAFK ? 'AFK' : 'Go AFK'}</span>
            </button>
            <button
              onClick={onToggleRole}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                isDealer ? 'bg-warn-soft text-warn-strong hover:bg-warn-soft' : 'bg-surface-3 text-mid-text hover:bg-surface-3'
              }`}
              title={isDealer ? 'Switch to Player' : 'Become Dealer'}
            >
              <HandHelping size={16} />
              <span className="hidden sm:inline">{isDealer ? 'Dealer' : 'Become Dealer'}</span>
            </button>
            <div className="flex items-center px-3 py-1 bg-surface-3 rounded-full">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-ok animate-pulse' : 'bg-danger'}`}
              />
              <span className="text-xs font-semibold text-muted">{connected ? 'Live' : 'Reconnecting...'}</span>
            </div>
            <div
              role="radiogroup"
              aria-label="Color theme"
              className="inline-flex rounded-full bg-surface-3 p-0.5"
            >
              {THEME_OPTIONS.map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={theme === mode}
                  aria-label={label}
                  title={label}
                  onClick={() => onSetTheme(mode)}
                  className={`p-1.5 rounded-full transition-colors ${theme === mode ? 'bg-surface-highlight shadow-sm' : ''}`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
            <button
              onClick={copyLink}
              className="p-2 text-mid-text hover:bg-surface-3 rounded-lg transition-colors"
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