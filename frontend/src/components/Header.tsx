import React, { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { Share2, Coffee, HandHelping, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';
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

const afkToggleClasses = (isAFK: boolean) =>
  `flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${
    isAFK
      ? 'bg-accent-soft text-accent-strong border border-accent/30 hover:bg-accent-strong hover:text-content-inverse'
      : 'bg-surface text-mid-text border border-line hover:border-accent hover:text-accent-text'
  }`;

const dealerToggleClasses = (isDealer: boolean) =>
  `flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${
    isDealer
      ? 'bg-warn-soft text-warn-strong border border-warn/30 hover:bg-warn-strong hover:text-content-inverse'
      : 'bg-surface text-mid-text border border-line hover:border-accent hover:text-accent-text'
  }`;

const shareButtonClasses =
  'flex items-center justify-center h-9 w-9 rounded-xl bg-surface text-mid-text border border-line hover:border-accent hover:text-accent-text transition-all active:scale-95 shadow-sm';

const livePillClasses = (connected: boolean) =>
  `flex items-center h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
    connected
      ? 'bg-accent-soft border border-accent/30 text-accent-strong'
      : 'bg-danger text-white'
  }`;

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = (refocusBurger = false) => {
    setMenuOpen(false);
    if (refocusBurger) burgerRef.current?.focus();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Room link copied!');
  };

  const copyLinkFromMenu = () => {
    copyLink();
    closeMenu();
  };

  const livePill = (className?: string) => (
    <div
      data-testid="connection-status"
      className={`${livePillClasses(connected)} ${className ?? ''}`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          connected ? 'bg-ok animate-pulse' : 'bg-white'
        }`}
      />
      <span>{connected ? 'Live' : 'Reconnecting...'}</span>
    </div>
  );

  const afkToggle = (className?: string) => (
    <button
      type="button"
      data-testid="toggle-afk"
      aria-pressed={isAFK}
      onClick={() => {
        onToggleAFK();
        closeMenu();
      }}
      className={`${afkToggleClasses(isAFK)} ${className ?? ''}`}
      title={isAFK ? 'Return to Game' : 'Go AFK'}
    >
      <Coffee size={16} />
      <span className={className ? '' : 'hidden sm:inline'}>
        {isAFK ? 'AFK' : 'Go AFK'}
      </span>
    </button>
  );

  const dealerToggle = (className?: string) => (
    <button
      type="button"
      data-testid="toggle-dealer"
      aria-pressed={isDealer}
      onClick={() => {
        onToggleRole();
        closeMenu();
      }}
      className={`${dealerToggleClasses(isDealer)} ${className ?? ''}`}
      title={isDealer ? 'Switch to Player' : 'Become Dealer'}
    >
      <HandHelping size={16} />
      <span className={className ? '' : 'hidden sm:inline'}>
        {isDealer ? 'Dealer' : 'Become Dealer'}
      </span>
    </button>
  );

  const themeToggle = (iconSize: number, className?: string) => (
    <ThemeToggle theme={theme} onSetTheme={onSetTheme} iconSize={iconSize} className={className} />
  );

  const shareButton = () => (
    <button
      type="button"
      data-testid="share-link"
      onClick={copyLinkFromMenu}
      className={shareButtonClasses}
      title="Copy Invite Link"
    >
      <Share2 size={16} />
    </button>
  );

  return (
    <nav className="bg-surface border-b border-line sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={28} />
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-content whitespace-nowrap">
                Backlog Royale
              </h1>
              <span className="text-line hidden sm:inline">|</span>
              <span
                data-testid="room-id"
                className="text-muted font-medium truncate min-w-0"
              >
                {roomID}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {afkToggle()}
            {dealerToggle()}
            {livePill()}
            {themeToggle(16, 'h-9')}
            {shareButton()}
          </div>

          <div className="sm:hidden shrink-0" ref={menuRef}>
            <button
              ref={burgerRef}
              type="button"
              data-testid="header-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="header-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-surface text-mid-text border border-line hover:border-accent hover:text-accent-text transition-all active:scale-95 shadow-sm"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div
              id="header-menu"
              data-testid="header-menu"
              className={`absolute right-2 top-full mt-2 w-56 bg-surface border border-line rounded-2xl shadow-lg p-2 flex flex-col gap-1 z-20 ${
                menuOpen ? 'block' : 'hidden'
              }`}
            >
              {afkToggle('w-full justify-start')}
              {dealerToggle('w-full justify-start')}
              {livePill('justify-start')}
              <div className="flex items-center justify-between h-9 px-1">
                <span className="text-xs font-bold text-muted">Theme</span>
                {themeToggle(14)}
              </div>
              <button
                type="button"
                data-testid="share-link-menu"
                onClick={copyLinkFromMenu}
                className="flex items-center gap-2 h-9 px-4 text-sm font-bold text-mid-text bg-surface border border-line rounded-xl hover:border-accent hover:text-accent-text transition-all active:scale-95"
                title="Copy Invite Link"
              >
                <Share2 size={16} /> Copy Invite Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};