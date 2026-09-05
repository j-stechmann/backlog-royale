import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';
import { version } from '../../package.json';

beforeAll(() => {
  window.history.replaceState({}, '', '/');
});

describe('Footer', () => {
  it('renders the version number', () => {
    render(<Footer />);
    expect(screen.getByText(`v${version}`)).toBeDefined();
  });

  it('renders links for both legal pages', () => {
    render(<Footer />);
    expect(screen.getByText('Imprint')).toBeDefined();
    expect(screen.getByText('Privacy')).toBeDefined();
  });

  it('opens links in a new tab with noopener', () => {
    render(<Footer />);
    for (const label of ['Imprint', 'Privacy']) {
      const link = screen.getByText(label).closest('a');
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toContain('noopener');
    }
  });

  it('builds absolute hash URLs without the query string', () => {
    // An in-game tab sits at /?room=xyz; a bare relative "#/imprint" href
    // would resolve against the full URL and the new tab would auto-join
    // the room as a duplicate player. The href must be origin-absolute
    // and query-free.
    window.history.replaceState({}, '', '/?room=xyz');
    render(<Footer />);
    const link = screen.getByText('Imprint').closest('a');
    expect(link?.getAttribute('href')).toBe(`${window.location.origin}/#/imprint`);
  });
});
