const CLUBS = ['Dr', '3W', '2H', '4i', '5i', '6i', '7i', '8i', '9i', 'PW', '50°', '54°'];

export default function KPIPanel({ hole, onUpdate, onPrev, onNext, hasPrev, hasNext }) {
  const set = (field, value) => onUpdate((h) => ({ ...h, [field]: value }));

  const setPar = (par) => {
    onUpdate((h) => {
      const next = { ...h, par };
      // Reset fairwayHit for par 3
      if (par === 3) next.fairwayHit = null;
      return next;
    });
  };

  const displayScore = hole.score !== null && hole.score !== '' ? hole.score : '';

  const scoreDiff = displayScore !== '' ? Number(displayScore) - hole.par : null;

  const handleClubSelect = (club) => {
    // Tapping selected club deselects it
    set('club', hole.club === club ? '' : club);
  };

  return (
    <div className="bg-[#f8f9fb] border-b border-gray-100 px-3 pt-3 pb-3">
      {/* Hole nav + number */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${hasPrev ? 'bg-green-50 text-green-700 active:bg-green-100' : 'bg-gray-50 text-gray-200'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-3xl font-black text-green-800">{hole.holeNumber}</span>
            {displayScore !== '' && (
              <span className={`text-lg font-bold px-2 py-0.5 rounded-lg ${scoreStyle(scoreDiff)}`}>
                {displayScore}
                {scoreDiff !== null && (
                  <span className="text-xs ml-1 font-normal opacity-80">
                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'E' : scoreDiff}
                  </span>
                )}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 font-medium">HOLE</span>
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${hasNext ? 'bg-green-50 text-green-700 active:bg-green-100' : 'bg-gray-50 text-gray-200'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid of KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {/* Par */}
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Par</label>
          <div className="flex gap-1.5">
            {[3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => setPar(p)}
                className={[
                  'flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors',
                  hole.par === p
                    ? 'bg-green-600 text-white shadow'
                    : 'bg-white text-gray-500 border border-gray-200 active:bg-green-50',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Score</label>
          <input
            type="number"
            min="1"
            max="15"
            value={displayScore}
            onChange={(e) => set('score', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="—"
            className="w-full text-center text-lg font-bold py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Putts */}
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Putts</label>
          <Stepper
            value={hole.putts}
            min={0}
            max={6}
            onChange={(v) => set('putts', v)}
          />
        </div>

        {/* Penalty Strokes */}
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Penalty</label>
          <Stepper
            value={hole.penaltyStrokes}
            min={0}
            max={5}
            onChange={(v) => set('penaltyStrokes', v)}
          />
        </div>

        {/* Fairway Hit - only for par 4/5 */}
        {hole.par !== 3 && (
          <div className="bg-white border border-gray-100 rounded-xl p-2.5">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Fairway Hit</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => set('fairwayHit', true)}
                className={[
                  'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  hole.fairwayHit === true
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 active:bg-green-50',
                ].join(' ')}
              >
                Yes
              </button>
              <button
                onClick={() => set('fairwayHit', false)}
                className={[
                  'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  hole.fairwayHit === false
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 active:bg-red-50',
                ].join(' ')}
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Approach Distance */}
        <div className={`bg-white border border-gray-100 rounded-xl p-2.5 ${hole.par === 3 ? 'col-span-1' : ''}`}>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Approach (yds)</label>
          <input
            type="number"
            min="0"
            max="600"
            value={hole.approachDistance}
            onChange={(e) => set('approachDistance', e.target.value)}
            placeholder="—"
            className="w-full text-center text-lg font-bold py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Club Used - horizontal scrollable button row */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-2.5">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Club Used</label>
          <div
            style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
            className="flex gap-1.5 pb-1"
          >
            {CLUBS.map((club) => (
              <button
                key={club}
                onClick={() => handleClubSelect(club)}
                className={[
                  'px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors',
                  hole.club === club
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 active:bg-green-50',
                ].join(' ')}
              >
                {club}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg active:bg-gray-100 transition-colors select-none"
      >
        −
      </button>
      <span className="flex-1 text-center text-xl font-bold text-gray-800">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg active:bg-gray-100 transition-colors select-none"
      >
        +
      </button>
    </div>
  );
}

function scoreStyle(diff) {
  if (diff === null) return 'bg-gray-100 text-gray-700';
  if (diff <= -2) return 'bg-yellow-400 text-yellow-900';
  if (diff === -1) return 'bg-red-500 text-white';
  if (diff === 0) return 'bg-green-600 text-white';
  if (diff === 1) return 'bg-blue-500 text-white';
  if (diff === 2) return 'bg-blue-700 text-white';
  return 'bg-gray-700 text-white';
}
