import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VotingPanel } from './VotingPanel';
import { ROLES } from '../constants';
import type { User } from '../hooks/useBacklogRoyale';

describe('VotingPanel', () => {
  const mockUsers: User[] = [
    { id: '1', name: 'Alice', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
    { id: '2', name: 'Bob', role: ROLES.PLAYER, hasVoted: true, vote: '8' },
    { id: '3', name: 'Charlie', role: ROLES.PLAYER, hasVoted: true, vote: '5' },
  ];

  const baseProps = {
    selectedVote: null,
    onVote: vi.fn(),
    onReturnToGame: vi.fn(),
  };

  it('shows the voting cards for a player when not revealed', () => {
    render(
      <VotingPanel
        {...baseProps}
        isAFK={false}
        isDealer={false}
        reveal={false}
        users={mockUsers}
      />
    );
    expect(screen.getByText('Cast your vote')).toBeDefined();
    expect(screen.queryByText('Voting Summary')).toBeNull();
  });

  it('shows the VoteSummary to a regular player after reveal', () => {
    render(
      <VotingPanel
        {...baseProps}
        isAFK={false}
        isDealer={false}
        reveal={true}
        users={mockUsers}
      />
    );
    expect(screen.getByText('Voting Summary')).toBeDefined();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cast your vote')).toBeNull();
  });

  it('shows the VoteSummary to the dealer after reveal', () => {
    render(
      <VotingPanel
        {...baseProps}
        isAFK={false}
        isDealer={true}
        reveal={true}
        users={mockUsers}
      />
    );
    expect(screen.getByText('Voting Summary')).toBeDefined();
    expect(screen.queryByText('You are the Dealer')).toBeNull();
  });

  it('shows the dealer panel to the dealer before reveal', () => {
    render(
      <VotingPanel
        {...baseProps}
        isAFK={false}
        isDealer={true}
        reveal={false}
        users={mockUsers}
      />
    );
    expect(screen.getByText('You are the Dealer')).toBeDefined();
    expect(screen.queryByText('Voting Summary')).toBeNull();
  });

  it('shows the AFK panel when the user is AFK, even after reveal', () => {
    render(
      <VotingPanel
        {...baseProps}
        isAFK={true}
        isDealer={false}
        reveal={true}
        users={mockUsers}
      />
    );
    expect(screen.getByText('You are AFK')).toBeDefined();
    expect(screen.queryByText('Voting Summary')).toBeNull();
  });

  it('renders an Abstain card that fires onVote("A") when clicked', () => {
    const onVote = vi.fn();
    render(
      <VotingPanel
        {...baseProps}
        onVote={onVote}
        isAFK={false}
        isDealer={false}
        reveal={false}
        users={mockUsers}
      />
    );
    const abstainCard = screen.getByRole('button', { name: 'Abstain' });
    expect(abstainCard).toBeDefined();
    fireEvent.click(abstainCard);
    expect(onVote).toHaveBeenCalledWith('A');
  });
});
