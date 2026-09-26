import React, { useEffect, useRef } from 'react';
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

const layerBase =
  '[grid-area:1/1] transition-[opacity,visibility] duration-300 ease-out';
const layerVisible = 'opacity-100';
const layerHidden = 'opacity-0 invisible pointer-events-none';

export const VotingPanel: React.FC<VotingPanelProps> = ({
  isAFK,
  isDealer,
  selectedVote,
  onVote,
  reveal,
  onReturnToGame,
  users,
}) => {
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const dealerHeadingRef = useRef<HTMLHeadingElement>(null);
  const voteGridHeadingRef = useRef<HTMLHeadingElement>(null);

  const showVoteGrid = !reveal && !isDealer;
  const showSummary = reveal;
  const showDealerNotice = isDealer && !reveal;

  const view = isAFK
    ? 'afk'
    : showSummary
      ? 'summary'
      : showDealerNotice
        ? 'dealer'
        : 'grid';

  const prevView = useRef<typeof view>(null);

  useEffect(() => {
    if (prevView.current === null) {
      prevView.current = view;
      return;
    }
    if (prevView.current === view) return;
    prevView.current = view;
    if (view === 'summary') summaryHeadingRef.current?.focus();
    else if (view === 'dealer') dealerHeadingRef.current?.focus();
    else if (view === 'grid') voteGridHeadingRef.current?.focus();
  }, [view]);

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

  return (
    <div className="bg-surface p-8 sm:p-12 rounded-3xl shadow-sm border border-line relative overflow-hidden grid">
      <div
        aria-hidden={!showVoteGrid}
        inert={!showVoteGrid}
        className={`${layerBase} ${showVoteGrid ? layerVisible : layerHidden}`}
      >
        <div className="text-center mb-10">
          <h2 ref={voteGridHeadingRef} tabIndex={-1} className="text-2xl font-black text-content-soft mb-2 outline-none">Cast your vote</h2>
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

      <div
        aria-hidden={!showSummary}
        inert={!showSummary}
        className={`${layerBase} ${showSummary ? layerVisible : layerHidden} flex items-center justify-center`}
      >
        <VoteSummary users={users} headingRef={summaryHeadingRef} />
      </div>

      <div
        aria-hidden={!showDealerNotice}
        inert={!showDealerNotice}
        className={`${layerBase} ${showDealerNotice ? layerVisible : layerHidden} flex flex-col items-center text-center justify-center`}
      >
        <div className="w-16 h-16 bg-warn-soft text-warn rounded-2xl flex items-center justify-center mb-4">
          <HandHelping size={32} />
        </div>
        <h2 ref={dealerHeadingRef} tabIndex={-1} className="text-xl font-bold text-warn-strong mb-1 outline-none">You are the Dealer</h2>
        <p className="text-warn-strong text-sm max-w-xs">
          You can see the voting progress and manage the rounds, but you don't participate in voting.
        </p>
        <p className="text-warn-strong text-sm max-w-xs">
          You may also switch players to AFK.
        </p>
      </div>
    </div>
  );
};
