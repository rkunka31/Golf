import { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import HomeView from './components/HomeView';
import NewRound from './components/NewRound';
import RoundView from './components/RoundView';
import AnalysisView from './components/AnalysisView';

export default function App() {
  const storage = useStorage();
  const [view, setView] = useState('home'); // home | new-round | round | analysis
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [activeHole, setActiveHole] = useState(1);

  const openRound = (roundId, hole = 1) => {
    setActiveRoundId(roundId);
    setActiveHole(hole);
    setView('round');
  };

  const navTo = (v) => {
    if (v === 'round' && !activeRoundId) {
      setView('home');
    } else {
      setView(v);
    }
  };

  const activeRound = storage.data.rounds.find((r) => r.id === activeRoundId) || null;

  return (
    <div className="flex flex-col min-h-svh bg-[#f0f4f0]">
      {/* Main content */}
      <div className="flex-1 pb-16">
        {view === 'home' && (
          <HomeView
            rounds={storage.data.rounds}
            onNewRound={() => setView('new-round')}
            onOpenRound={openRound}
            onDeleteRound={storage.deleteRound}
          />
        )}
        {view === 'new-round' && (
          <NewRound
            onSave={(round) => {
              storage.addRound(round);
              openRound(round.id, 1);
            }}
            onCancel={() => setView('home')}
          />
        )}
        {view === 'round' && activeRound && (
          <RoundView
            round={activeRound}
            activeHole={activeHole}
            setActiveHole={setActiveHole}
            updateHole={(holeNumber, updater) =>
              storage.updateHole(activeRoundId, holeNumber, updater)
            }
            onBack={() => setView('home')}
          />
        )}
        {view === 'analysis' && (
          <AnalysisView rounds={storage.data.rounds} />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-200 flex z-50 shadow-lg">
        <NavBtn
          label="Home"
          icon={HomeIcon}
          active={view === 'home' || view === 'new-round'}
          onClick={() => navTo('home')}
        />
        <NavBtn
          label="Round"
          icon={FlagIcon}
          active={view === 'round'}
          onClick={() => navTo('round')}
          disabled={!activeRoundId}
        />
        <NavBtn
          label="Analysis"
          icon={ChartIcon}
          active={view === 'analysis'}
          onClick={() => navTo('analysis')}
        />
      </nav>
    </div>
  );
}

function NavBtn({ label, icon, active, onClick, disabled }) {
  const IconComponent = icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors select-none',
        active ? 'text-green-700' : disabled ? 'text-gray-300' : 'text-gray-500',
        !disabled ? 'active:bg-green-50' : '',
      ].join(' ')}
    >
      <IconComponent active={active} disabled={disabled} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function HomeIcon({ active, disabled }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-green-700' : disabled ? 'text-gray-300' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function FlagIcon({ active, disabled }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-green-700' : disabled ? 'text-gray-300' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V4m0 0l1-1h5l2 2h9l-3 5 3 5H11l-2-2H4" />
    </svg>
  );
}

function ChartIcon({ active, disabled }) {
  return (
    <svg className={`w-6 h-6 ${active ? 'text-green-700' : disabled ? 'text-gray-300' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
