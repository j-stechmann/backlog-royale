import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoteSummary } from './VoteSummary';
import { ROLES } from '../constants';
import type { User } from '../hooks/useBacklogRoyale';

describe('VoteSummary', () => {
  const mockUsers: User[] = [
    { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
    { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: true, vote: '8' },
    { id: '3', name: 'Charlie', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
    { id: '4', name: 'Dealer', role: ROLES.DEALER, hasVoted: false, vote: '13' }, // Should be ignored
    { id: '5', name: 'AFK User', role: ROLES.AFK, hasVoted: false }, // Should be ignored
  ];

  it('renders correctly and aggregates votes', () => {
    render(<VoteSummary users={mockUsers} />);
    
    // Check for title
    expect(screen.getByText('Voting Summary')).toBeDefined();
    
    // Check for counts (2 for '5', 1 for '8')
    const fives = screen.getAllByText('2');
    const eights = screen.getAllByText('1');
    
    expect(fives.length).toBeGreaterThan(0);
    expect(eights.length).toBeGreaterThan(0);
    
    // Check that dealer vote is ignored
    expect(screen.queryByText('13')).toBeNull();
  });

  it('returns null when there are no player votes', () => {
    const { container } = render(<VoteSummary users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the multiplication sign next to counts', () => {
    render(<VoteSummary users={mockUsers} />);
    const symbols = screen.getAllByText('×');
    expect(symbols.length).toBe(2); // One for '5', one for '8'
  });

  it('orders tied votes by CARD_VALUES order, not insertion order', () => {
    // Two votes for 'A' (abstain) and two for '?'. Both are ties (count 2).
    // Integer-like keys ('5','8') are auto-ordered by JS, but '?' and 'A' are
    // not, so they follow insertion order unless we sort by CARD_VALUES index.
    // '?' comes before 'A' in CARD_VALUES, so '?' should appear first.
    const tiedUsers: User[] = [
      { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: 'A' },
      { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: true, vote: 'A' },
      { id: '3', name: 'Charlie', role: ROLES.PLAYER, hasVoted: true, vote: '?' },
      { id: '4', name: 'Dave', role: ROLES.PLAYER, hasVoted: true, vote: '?' },
    ];
    render(<VoteSummary users={tiedUsers} />);

    const cards = screen.getAllByTestId('vote-card');
    expect(cards.length).toBe(2);

    // First card should be '?' (appears earlier in CARD_VALUES), second 'A'.
    expect(cards[0].textContent).toContain('?');
    expect(cards[1].textContent).not.toContain('?');
  });

  it('renders an Abstain card for players who voted A', () => {
    const abstainUsers: User[] = [
      { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
      { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: true, vote: 'A' },
      { id: '3', name: 'Charlie', role: ROLES.PLAYER, hasVoted: true, vote: 'A' },
    ];
    render(<VoteSummary users={abstainUsers} />);

    // The abstain card renders a Ban icon (lucide) rather than the letter "A".
    // The letter "A" must NOT be rendered as text for the abstain votes.
    expect(screen.queryByText('A')).toBeNull();

    // Two players abstained -> one aggregated abstain card with count "2".
    // The single "5" vote -> one card with count "1".
    expect(screen.getAllByText('2').length).toBe(1);
    expect(screen.getAllByText('1').length).toBe(1);

    // The aggregated abstain card renders three Ban icons (two corners + center).
    const banIcons = document.querySelectorAll('svg.lucide-ban');
    expect(banIcons.length).toBe(3);
  });
});
