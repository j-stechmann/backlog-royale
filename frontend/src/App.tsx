import { useState, useEffect, useRef } from 'react';
import { usePoker } from './hooks/usePoker';
import { Card } from './components/Card';
import { Users, Eye, RotateCcw, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const CARD_VALUES = ['1', '2', '3', '5', '8', '13', '21', '?'];

function App() {
  const [roomID, setRoomID] = useState('');
  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const savedName = localStorage.getItem('poker_name');

    if (room) setRoomID(room);
    if (savedName) setName(savedName);

    if (room && savedName) {
      setIsJoined(true);
    }
  }, []);

  const { state, connected, sendAction } = usePoker(isJoined ? roomID : '', isJoined ? name : '');

  const prevVotedCount = useRef(0);
  const prevReveal = useRef(false);

  useEffect(() => {
    if (state) {
      const votedCount = state.users.filter(u => u.hasVoted).length;
      // Clear selection if votes were reset (voted count dropped to 0) 
      // or if transitioning from reveal to hidden state (next round)
      const resetHappened = (votedCount === 0 && prevVotedCount.current > 0) || 
                           (prevReveal.current && !state.reveal);
      
      if (resetHappened) {
        setSelectedVote(null);
      }
      
      prevVotedCount.current = votedCount;
      prevReveal.current = state.reveal;
    }
  }, [state]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomID && name) {
      localStorage.setItem('poker_name', name);
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomID);
      window.history.pushState({}, '', url);
      setIsJoined(true);
    }
  };

  const handleVote = (value: string) => {
    if (state?.reveal) return;
    setSelectedVote(value);
    sendAction('VOTE', { vote: value });
  };

  const handleReveal = () => sendAction('REVEAL');
  const handleReset = () => {
    setSelectedVote(null);
    sendAction('RESET');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Room link copied!');
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
              <Users size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 text-center tracking-tight">Scrum Poker</h1>
          <p className="text-gray-500 text-center mb-8">Real-time story pointing for teams</p>
          
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Room Name</label>
              <input
                type="text"
                value={roomID}
                onChange={(e) => setRoomID(e.target.value)}
                placeholder="e.g. engineering-sprint-21"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Your Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should your team see you?"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
            >
              Start Voting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Users size={20} className="text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  Scrum Poker
                </h1>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600 font-medium">{roomID}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full mr-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold text-gray-600">{connected ? 'Live' : 'Reconnecting...'}</span>
              </div>
              <button
                onClick={copyLink}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy Invite Link"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-6">
          {/* Selection Area */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-200 relative overflow-hidden">
            
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 mb-2">Cast your vote</h2>
              <p className="text-gray-400 text-sm">Select a card to point this story</p>
            </div>
            
            <div className="flex flex-wrap justify-center max-w-3xl mx-auto gap-2">
              {CARD_VALUES.map((val) => (
                <Card
                  key={val}
                  value={val}
                  selected={selectedVote === val}
                  onClick={() => handleVote(val)}
                  disabled={state?.reveal}
                />
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  <h2 className="font-bold text-gray-900 text-sm">Participants</h2>
                </div>
                <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="text-xs font-bold text-blue-700">
                    {state?.users.filter(u => u.hasVoted).length} / {state?.users.length} Voted
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReveal}
                  disabled={state?.reveal || !state?.users.some(u => u.hasVoted)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all text-sm font-bold disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <Eye size={18} /> Reveal Results
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all text-sm font-bold active:scale-95 shadow-lg shadow-blue-100"
                >
                  <RotateCcw size={18} /> Next Round
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
              {state?.users.map((user) => (
                <div key={user.name} className="p-4 flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      user.name === name ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium truncate max-w-[120px] ${user.name === name ? 'text-blue-600' : 'text-gray-900'}`}>
                      {user.name} {user.name === name && <span className="text-[10px] text-gray-400">(You)</span>}
                    </span>
                  </div>
                  <div>
                    {user.hasVoted ? (
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-all ${
                        state.reveal 
                          ? 'bg-blue-100 text-blue-700 scale-110 shadow-sm' 
                          : 'bg-green-500 text-white animate-bounce-subtle'
                      }`}>
                        {state.reveal ? user.vote : '✓'}
                      </div>
                    ) : (
                      <div className="w-10 h-10 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
