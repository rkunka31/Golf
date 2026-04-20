import { useState, useRef } from 'react';
import HoleView from './HoleView';
import ShareCard from './ShareCard';

const TEE_BADGE = {
  gold: 'bg-yellow-400 text-yellow-900',
  blue: 'bg-blue-500 text-white',
  grey: 'bg-gray-400 text-white',
  white: 'bg-white text-gray-700 border border-gray-300',
};

export default function RoundView({ round, activeHole, setActiveHole, updateHole, onBack, onUpdateNotes }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(round.notes || '');
  const [showShare, setShowShare] = useState(false);
  const hole = round.holes.find((h) => h.holeNumber === activeHole);

  const totalScore = round.holes.reduce((sum, h) => {
    const s = Number(h.score);
    return isNaN(s) || h.score === null || h.score === '' ? sum : sum + s;
  }, 0);

  const totalPar = round.holes.reduce((sum, h) => sum + (h.par || 0), 0);
  const holesPlayed = round.holes.filter((h) => h.score !== null && h.score !== '' && !isNaN(Number(h.score))).length;

  const scoreDiff = totalScore - totalPar;

  return (
    <div className="min-h-full flex flex-col">
      {/* Round Header */}
      <div className="bg-green-800 text-white px-4 pt-10 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full active:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-tight truncate">{round.course || 'Round'}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TEE_BADGE[round.tees] || 'bg-gray-400 text-white'}`}>
                {round.tees}
              </span>
            </div>
            <p className="text-green-300 text-xs">{formatDate(round.date)}{round.conditions ? ` · ${round.conditions}` : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowShare(true)}
              className="p-2 rounded-full active:bg-green-700 transition-colors"
              title="Share round"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold">{holesPlayed > 0 ? totalScore : '—'}</div>
              {holesPlayed > 0 && (
                <div className={`text-xs font-semibold ${scoreDiff > 0 ? 'text-red-300' : scoreDiff < 0 ? 'text-green-300' : 'text-gray-300'}`}>
                  {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : scoreDiff}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hole Tabs - Scrollable */}
      <div className="bg-green-900 px-2 py-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {round.holes.map((h) => {
            const s = h.score !== null && h.score !== '' && !isNaN(Number(h.score)) ? Number(h.score) : null;
            const diff = s !== null ? s - h.par : null;
            return (
              <button
                key={h.holeNumber}
                onClick={() => setActiveHole(h.holeNumber)}
                className={[
                  'flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-colors',
                  activeHole === h.holeNumber
                    ? 'bg-white text-green-900 shadow'
                    : s !== null
                    ? diffColor(diff) + ' text-white'
                    : 'bg-green-700 text-green-200',
                ].join(' ')}
              >
                <span className="text-[10px] leading-none">{h.holeNumber}</span>
                {s !== null && (
                  <span className="text-[11px] font-bold leading-none">{s}</span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => { setNotesText(round.notes || ''); setShowNotes(true); }}
            className="flex-shrink-0 w-16 h-9 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-600 text-white ml-1"
          >
            Notes
          </button>
        </div>
      </div>

      {/* Hole View */}
      {hole && (
        <HoleView
          hole={hole}
          onUpdate={(updater) => updateHole(hole.holeNumber, updater)}
          onPrev={() => setActiveHole((n) => Math.max(1, n - 1))}
          onNext={() => setActiveHole((n) => Math.min(18, n + 1))}
          hasPrev={activeHole > 1}
          hasNext={activeHole < 18}
        />
      )}

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowNotes(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Round Notes</h3>
              <button onClick={() => setShowNotes(false)} className="text-gray-400 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Goals, reminders, observations..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={() => {
                onUpdateNotes && onUpdateNotes(notesText);
                setShowNotes(false);
              }}
              className="mt-3 w-full py-3 rounded-xl bg-green-700 text-white font-semibold text-sm active:bg-green-800"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowShare(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Share Round</h3>
              <button onClick={() => setShowShare(false)} className="text-gray-400 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ShareCard round={round} onClose={() => setShowShare(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function diffColor(diff) {
  if (diff === null) return 'bg-green-700';
  if (diff <= -2) return 'bg-yellow-500'; // eagle or better
  if (diff === -1) return 'bg-red-500'; // birdie
  if (diff === 0) return 'bg-green-600'; // par
  if (diff === 1) return 'bg-blue-500'; // bogey
  if (diff === 2) return 'bg-blue-700'; // double
  return 'bg-gray-700'; // worse
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
