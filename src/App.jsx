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
    <div className="flex flex-col min-h-svh bg-[#f8f9fb]">
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
            onUpdateNotes={(text) =>
              storage.updateRound(activeRoundId, (r) => ({ ...r, notes: text }))
            }
          />
        )}
        {view === 'analysis' && (
          <AnalysisView rounds={storage.data.rounds} />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] flex z-50">
        <NavBtn
          label="Home"
          active={view === 'home' || view === 'new-round'}
          onClick={() => navTo('home')}
        >
          {(active) => active ? <HomeIconFilled /> : <HomeIconOutline />}
        </NavBtn>
        <NavBtn
          label="Round"
          active={view === 'round'}
          onClick={() => navTo('round')}
          disabled={!activeRoundId}
        >
          {(active, disabled) => active ? <FlagIconFilled /> : <FlagIconOutline disabled={disabled} />}
        </NavBtn>
        <NavBtn
          label="Analysis"
          active={view === 'analysis'}
          onClick={() => navTo('analysis')}
        >
          {(active) => active ? <ChartIconFilled /> : <ChartIconOutline />}
        </NavBtn>
      </nav>
    </div>
  );
}

function NavBtn({ label, active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors select-none',
        disabled ? 'opacity-30' : '',
        !disabled ? 'active:bg-gray-50' : '',
      ].join(' ')}
    >
      <span className={active ? 'text-[#15803d]' : 'text-[#9ca3af]'}>
        {children(active, disabled)}
      </span>
      <span className={`text-xs font-medium ${active ? 'text-[#15803d]' : 'text-[#9ca3af]'}`}>{label}</span>
    </button>
  );
}

function HomeIconFilled() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.03-.028.061-.056.091-.086L12 5.432z" />
    </svg>
  );
}

function HomeIconOutline() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function FlagIconFilled() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.456.88 8.25 8.25 0 005.33.01l2.99-.976a.75.75 0 011.09.67v13.91a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75V5.998l-2.25.734a9.75 9.75 0 01-6.304-.01 8.25 8.25 0 00-5.44-.745L3 6.466V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
    </svg>
  );
}

function FlagIconOutline({ disabled }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 6l1.5-.5a9 9 0 016 0 9 9 0 006 0L18 5v10l-1.5.5a9 9 0 01-6 0 9 9 0 00-6 0L3 16" />
    </svg>
  );
}

function ChartIconFilled() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  );
}

function ChartIconOutline() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v6.375A1.125 1.125 0 004.125 21h.75A1.125 1.125 0 006 19.875V13.5m0 0V9a1.125 1.125 0 011.125-1.125h.75A1.125 1.125 0 019 9v10.875m0 0V4.125A1.125 1.125 0 0110.125 3h.75A1.125 1.125 0 0112 4.125v15.75m0 0h1.125A1.125 1.125 0 0014.25 18.75V8.25a1.125 1.125 0 011.125-1.125h.75A1.125 1.125 0 0117.25 8.25v10.5a1.125 1.125 0 01-1.125 1.125H3.75" />
    </svg>
  );
}
