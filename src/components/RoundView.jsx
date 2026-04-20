import HoleView from './HoleView';

const TEE_BADGE = {
  gold: 'bg-yellow-400 text-yellow-900',
  blue: 'bg-blue-500 text-white',
  grey: 'bg-gray-400 text-white',
  white: 'bg-white text-gray-700 border border-gray-300',
};

export default function RoundView({ round, activeHole, setActiveHole, updateHole, onBack }) {
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
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold">{holesPlayed > 0 ? totalScore : '—'}</div>
            {holesPlayed > 0 && (
              <div className={`text-xs font-semibold ${scoreDiff > 0 ? 'text-red-300' : scoreDiff < 0 ? 'text-green-300' : 'text-gray-300'}`}>
                {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : scoreDiff}
              </div>
            )}
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
