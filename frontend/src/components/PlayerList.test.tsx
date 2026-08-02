import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerList } from './PlayerList';
import { ROLES } from '../constants';
import type { User } from '../hooks/useBacklogRoyale';

describe('PlayerList', () => {
  const votedPlayers: User[] = [
    { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
    { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: true, vote: '8' },
  ];

  const baseProps = {
    currentUserID: '1',
    reveal: false,
    onReveal: vi.fn(),
    onReset: vi.fn(),
    onToggleAFK: vi.fn(),
  };

  it('shows Reveal Results and Next Round buttons when the viewer is the dealer', () => {
    render(
      <PlayerList
        {...baseProps}
        users={votedPlayers}
        isDealer={true}
        canManageRound={true}
      />
    );
    expect(screen.getByText('Reveal Results')).toBeDefined();
    expect(screen.getByText('Next Round')).toBeDefined();
  });

  it('hides Reveal Results and Next Round buttons for a non-dealer when a dealer is present', () => {
    render(
      <PlayerList
        {...baseProps}
        users={votedPlayers}
        isDealer={false}
        canManageRound={false}
      />
    );
    expect(screen.queryByText('Reveal Results')).toBeNull();
    expect(screen.queryByText('Next Round')).toBeNull();
  });

  it('shows Reveal Results and Next Round buttons for a player when no dealer is present', () => {
    render(
      <PlayerList
        {...baseProps}
        users={votedPlayers}
        isDealer={false}
        canManageRound={true}
      />
    );
    expect(screen.getByText('Reveal Results')).toBeDefined();
    expect(screen.getByText('Next Round')).toBeDefined();
  });

  it('disables Reveal Results until all players have voted', () => {
    const players: User[] = [
      { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
      { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: false },
    ];
    render(
      <PlayerList
        {...baseProps}
        users={players}
        isDealer={false}
        canManageRound={true}
      />
    );
    expect(screen.getByText('Reveal Results')).toHaveProperty('disabled', true);
  });

  it('invokes onReveal and onReset when buttons are clicked (no dealer present)', () => {
    const onReveal = vi.fn();
    const onReset = vi.fn();
    render(
      <PlayerList
        {...baseProps}
        users={votedPlayers}
        onReveal={onReveal}
        onReset={onReset}
        isDealer={false}
        canManageRound={true}
      />
    );
    fireEvent.click(screen.getByText('Reveal Results'));
    expect(onReveal).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Next Round'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});