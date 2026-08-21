import React from 'react';
import { Card } from './Card';
import { Coffee, HandHelping } from 'lucide-react';
import { CARD_VALUES } from '../constants';
import { VoteSummary } from './VoteSummary';
import type { User } from '../hooks/useBacklogRoyale';

interface VotingPanelProps {
  isAFK: boolean;
  isDealer: boolean;
  selectedVote: string | null;
  onVote: (val: string) => void;
  reveal: boolean;
  onReturnToGame: () => void;
  users: User[];
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  isAFK,
  isDealer,
  selectedVote,
  onVote,
  reveal,
  onReturnToGame,
  users,
}) => {
  if (isAFK) {
    return (
      <div className="bg-accent-soft p-8 rounded-3xl border border-accent/30 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-accent-soft text-accent-text rounded-2xl flex items-center justify-center mb-4">
          <Coffee size={32} />
        </div>
        <h2 className="text-xl font-bold text-accent-strong mb-1">You are AFK</h2>
        <p className="text-accent-strong text-sm max-w-xs mb-6">
          You are currently sitting out. You won't be counted in the voting progress.
        </p>
        <button
          onClick={onReturnToGame}
          className="bg-accent text-white px-6 py-2 rounded-xl font-bold hover:bg-accent-strong transition-all active:scale-95"
        >
          Return to Game
        </button>
      </div>
    );
  }

  if (reveal) {
    return <VoteSummary users={users} />;
  }

  if (isDealer) {
    return (
      <div className="bg-warn-soft p-8 rounded-3xl border border-warn/30 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-warn-soft text-warn rounded-2xl flex items-center justify-center mb-4">
          <HandHelping size={32} />
        </div>
        <h2 className="text-xl font-bold text-warn-strong mb-1">You are the Dealer</h2>
        <p className="text-warn-strong text-sm max-w-xs">
          You can see the voting progress and manage the rounds, but you don't participate in voting.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-8 sm:p-12 rounded-3xl shadow-sm border border-line relative overflow-hidden">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-content-soft mb-2">Cast your vote</h2>
        <p className="text-muted text-sm">Select a card to point this story</p>
      </div>

      <div className="flex flex-wrap justify-center max-w-3xl mx-auto gap-2">
        {CARD_VALUES.map((val) => (
          <Card
            key={val}
            value={val}
            selected={selectedVote === val}
            onClick={() => onVote(val)}
            disabled={reveal}
          />
        ))}
      </div>
    </div>
  );
};
