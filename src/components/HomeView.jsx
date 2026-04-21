import { useState } from 'react';

function ScoreTrend({ rounds }) {
  const withScores = rounds
    .map(r => {
      const scored = r.holes.filter(h => h.score !== null && h.score !== undefined && h.score !== '');
      if (scored.length < 18) return null;
      const total = scored.reduce((s, h) => s + Number(h.score), 0);
      return { date: r.date, total };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8);

  if (withScores.length < 2) return null;

  const scores = withScores.map(r => r.total);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;

  const W = 300;
  const H = 48;
  const PAD = 12;
  const chartW = W - PAD * 2;
  const chartH = H - 16;

  const pts = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * chartW;
    // Inverted: lower score = higher on chart
    const y = 8 + ((s - minScore) / range) * chartH;
    // Invert y so lower score is higher
    const yInv = 8 + chartH - ((s - minScore) / range) * chartH;
    return { x, y: yInv, score: s };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const bestScore = minScore;
  const latestScore = scores[scores.length - 1];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-3 pb-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Score Trend</span>
        <span className="text-xs text-gray-400">Last {scores.length} rounds</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height: 60 }}>
        <polyline points={polyline} fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1;
          return (
            <g key={i}>
              <text x={p.x} y={p.y - 5} textAnchor="middle" fontSize="5.5" fill="#374151" fontWeight="600">{p.score}</text>
              <circle cx={p.x} cy={p.y} r={isLast ? 4 : 3} fill="#15803d" stroke="white" strokeWidth="1.2" />
            </g>
          );
        })}
      </svg>
      <div className="flex gap-2 mt-2">
        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Best: {bestScore}</span>
        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Latest: {latestScore}</span>
      </div>
    </div>
  );
}

export default function HomeView({ rounds, onNewRound, onOpenRound, onDeleteRound }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sorted = [...rounds].sort((a, b) => new Date(b.date) - new Date(a.date));

  const getRoundScore = (round) => {
    const scored = round.holes.filter((h) => h.score !== null && h.score !== undefined && h.score !== '');
    if (scored.length === 0) return null;
    const total = scored.reduce((s, h) => s + Number(h.score), 0);
    return { total, holes: scored.length };
  };

  const getTeeColor = (tees) => {
    switch (tees) {
      case 'gold': return 'bg-yellow-400 text-yellow-900';
      case 'blue': return 'bg-blue-500 text-white';
      case 'grey': return 'bg-gray-400 text-white';
      case 'white': return 'bg-white text-gray-700 border border-gray-300';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-full bg-[#f8f9fb]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-6 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3 mb-1">
          {/* Pinpoint logo mark: target circles + pin */}
          <svg viewBox="0 0 32 34" className="w-8 h-8" fill="none">
            <circle cx="16" cy="14" r="12" stroke="#111827" strokeWidth="1.8"/>
            <circle cx="16" cy="14" r="7"  stroke="#111827" strokeWidth="1.4"/>
            <circle cx="16" cy="14" r="2.5" fill="#111827"/>
            <line x1="16" y1="26" x2="16" y2="33" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Pinpoint</h1>
        </div>
        <p className="text-[#6b7280] text-sm">Every shot, pinpointed.</p>
      </div>

      <div className="px-4 py-4">
        {/* New Round Button */}
        <button
          onClick={onNewRound}
          className="w-full bg-[#15803d] active:bg-[#166534] text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Start New Round
        </button>

        {/* Score Trend Sparkline */}
        <ScoreTrend rounds={sorted} />

        {/* Rounds List */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium text-gray-400">No rounds yet</p>
            <p className="text-sm text-gray-300 mt-1">Start your first round above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Recent Rounds</h2>
            {sorted.map((round) => {
              const scoreData = getRoundScore(round);
              return (
                <div
                  key={round.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => onOpenRound(round.id, 1)}
                    className="w-full text-left px-4 py-4 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${getTeeColor(round.tees)}`}>
                            {round.tees ? round.tees.charAt(0).toUpperCase() + round.tees.slice(1) : '—'}
                          </span>
                          {round.conditions && (
                            <span className="text-xs text-[#6b7280] truncate">{round.conditions}</span>
                          )}
                        </div>
                        <p className="font-bold text-[#111827] text-lg leading-tight truncate">{round.course || 'Unnamed Course'}</p>
                        <p className="text-sm text-[#6b7280] mt-0.5">{formatDate(round.date)}</p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        {scoreData ? (
                          <>
                            <div className="text-2xl font-bold text-[#15803d]">{scoreData.total}</div>
                            <div className="text-xs text-[#6b7280]">{scoreData.holes}/18 holes</div>
                          </>
                        ) : (
                          <div className="text-sm text-[#6b7280] font-medium">In progress</div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Delete confirmation */}
                  {confirmDelete === round.id ? (
                    <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-red-700 font-medium">Delete this round?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { onDeleteRound(round.id); setConfirmDelete(null); }}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-[#e5e7eb] px-4 py-2 flex justify-end">
                      <button
                        onClick={() => setConfirmDelete(round.id)}
                        className="text-xs text-gray-400 active:text-red-500 py-1 px-2"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}
