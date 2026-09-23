import React from 'react';
import type { LegalRoute } from '../hooks/useHashRoute';

interface FooterProps {
  className?: string;
}

// In-flow footer (never position:fixed): page content must never scroll
// underneath it (issue #126). App.tsx wraps every view in a flex column
// that pushes this footer to the viewport bottom on short pages.

// Origin-absolute URL without the query string: opening it in a new tab
// must never inherit ?room=, or the tab would silently auto-join the
// current room as a duplicate player (saved name + ?room= is the
// auto-join condition).
const legalHref = (route: LegalRoute) =>
  `${window.location.origin}${window.location.pathname}#/${route}`;

const LEGAL_LINKS: { route: LegalRoute; label: string }[] = [
  { route: 'imprint', label: 'Imprint' },
  { route: 'privacy', label: 'Privacy' },
];

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <div
      className={`shrink-0 w-full flex justify-end items-center gap-2 px-2 pb-1 text-xs text-muted select-none ${className ?? ''}`}
    >
      <span>v{__APP_VERSION__}</span>
      <span aria-hidden="true">·</span>
      {LEGAL_LINKS.map(({ route, label }) => (
        <a
          key={route}
          href={legalHref(route)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-mid-text focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
        >
          {label}
        </a>
      ))}
    </div>
  );
};

export default Footer;
