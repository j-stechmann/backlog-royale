import { useEffect, useRef } from 'react';
import { JoinView } from './components/JoinView';
import { Header } from './components/Header';
import { VotingPanel } from './components/VotingPanel';
import { PlayerList } from './components/PlayerList';
import { toast } from 'sonner';
import { useGameState } from './hooks/useGameState';
import { ACTIONS, ROLES } from './constants';

function App() {
  const {
    roomID,
    name,
    userID,
    isJoined,
    selectedVote,
    setSelectedVote,
    state,
    connected,
    sendAction,
    joinRoom
  } = useGameState();

  const currentUser = state?.users.find(u => u.id === userID);
  const isDealer = currentUser?.role === ROLES.DEALER;
  const isAFK = currentUser?.role === ROLES.AFK;

  const prevRole = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (currentUser && prevRole.current !== undefined && prevRole.current !== currentUser.role) {
      setSelectedVote(null);
      if (currentUser.role === ROLES.DEALER) {
        toast.info('You are now the Dealer');
      } else if (currentUser.role === ROLES.AFK) {
        toast.info('You are now AFK');
      } else {
        toast.info('You are now a Player');
      }
    }
    prevRole.current = currentUser?.role;
  }, [currentUser, setSelectedVote]);

  const handleVote = (value: string) => {
    if (state?.reveal) return;
    setSelectedVote(value);
    sendAction(ACTIONS.VOTE, { vote: value });
  };

  const handleReveal = () => sendAction(ACTIONS.REVEAL);
  const handleReset = () => {
    setSelectedVote(null);
    sendAction(ACTIONS.RESET);
  };

  const toggleAFK = (targetID?: string) => {
    sendAction(ACTIONS.TOGGLE_AFK, targetID ? { userId: targetID } : {});
  };

  const toggleRole = () => {
    sendAction(ACTIONS.TOGGLE_ROLE);
  };

  if (!isJoined) {
    return <JoinView initialRoomID={roomID} initialName={name} onJoin={joinRoom} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header
        roomID={roomID}
        connected={connected}
        isAFK={isAFK}
        isDealer={isDealer}
        onToggleAFK={() => toggleAFK()}
        onToggleRole={toggleRole}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-6">
          <VotingPanel
            isAFK={isAFK}
            isDealer={isDealer}
            selectedVote={selectedVote}
            onVote={handleVote}
            reveal={state?.reveal || false}
            onReturnToGame={() => toggleAFK()}
            users={state?.users || []}
          />

          <PlayerList
            users={state?.users || []}
            currentUserID={userID}
            reveal={state?.reveal || false}
            isDealer={isDealer}
            onReveal={handleReveal}
            onReset={handleReset}
            onToggleAFK={(id) => toggleAFK(id)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
