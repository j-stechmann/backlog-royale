import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
  iconSize?: number;
  className?: string;
}

const THEME_OPTIONS: { mode: ThemeMode; Icon: React.FC<{ size?: number }>; label: string }[] = [
  { mode: 'light', Icon: Sun, label: 'Light theme' },
  { mode: 'dark', Icon: Moon, label: 'Dark theme' },
  { mode: 'system', Icon: Monitor, label: 'System theme' },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onSetTheme,
  iconSize = 16,
  className,
}) => {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className={`inline-flex rounded-full bg-surface-3 p-0.5 ${className ?? ''}`}
    >
      {THEME_OPTIONS.map(({ mode, Icon, label }) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => onSetTheme(mode)}
            className={`p-1.5 rounded-full transition-colors ${active ? 'bg-surface-highlight shadow-sm' : 'hover:bg-surface-3/80'}`}
          >
            <Icon size={iconSize} />
          </button>
        );
      })}
    </div>
  );
};
