import { useState, useMemo } from 'react';
import FairwayDiagram from './FairwayDiagram';
import GreenDiagram from './GreenDiagram';
import { calcRoundSG } from '../utils/strokesGained';

// Fairway diagram constants (mirrored from FairwayDiagram)
const FW_MARKER_YS = [10, 48, 86, 124, 162, 200];

// Green diagram constants
const GREEN_CX = 50;
const GREEN_CY = 50;

export default function AnalysisView({ rounds }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedHole, setSelectedHole] = useState('all');
  const [fairwayViewMode, setFairwayViewMode] = useState('realistic'); // 'realistic' | 'dispersion'
  const [greenViewMode, setGreenViewMode] = useState('realistic');     // 'realistic' | 'dispersion'

  // Build rounds options
  const roundOptions = [
    { value: 'all', label: 'All Rounds' },
    ...rounds.map((r) => ({
      value: r.id,
      label: `${r.course || 'Unnamed'} — ${formatDate(r.date)}`,
    })),
  ];

  // Filter holes
  const filteredHoles = useMemo(() => {
    let holes = [];
    const filtered = selectedRound === 'all' ? rounds : rounds.filter((r) => r.id === selectedRound);
    filtered.forEach((r) => {
      r.holes.forEach((h) => {
        if (selectedHole === 'all' || Number(selectedHole) === h.holeNumber) {
          holes.push({ ...h, roundId: r.id, roundCourse: r.course, roundDate: r.date });
        }
      });
    });
    return holes;
  }, [rounds, selectedRound, selectedHole]);

  // Stats
  const stats = useMemo(() => {
    const scored = filteredHoles.filter((h) => h.score !== null && h.score !== '' && !isNaN(Number(h.score)));
    const totalScore = scored.reduce((s, h) => s + Number(h.score), 0);
    const avgScore = scored.length > 0 ? (totalScore / scored.length).toFixed(1) : '—';
    const totalPutts = scored.reduce((s, h) => s + (h.putts || 0), 0);
    const avgPutts = scored.length > 0 ? (totalPutts / scored.length).toFixed(1) : '—';

    const par45 = filteredHoles.filter((h) => h.par === 4 || h.par === 5);
    const fwHit = par45.filter((h) => h.fairwayHit === true).length;
    const fwPct = par45.length > 0 ? Math.round((fwHit / par45.length) * 100) : null;

    // GIR: score <= par - approach shots (proxy: putts <= 2 and score <= par)
    const girHoles = scored.filter((h) => {
      const s = Number(h.score);
      return s <= h.par && (h.putts || 0) <= 2;
    });
    const girPct = scored.length > 0 ? Math.round((girHoles.length / scored.length) * 100) : null;

    return {
      totalScore: scored.length > 0 ? totalScore : '—',
      avgScore,
      totalPutts: scored.length > 0 ? totalPutts : '—',
      avgPutts,
      fwHit: fwPct !== null ? `${fwPct}%` : '—',
      girPct: girPct !== null ? `${girPct}%` : '—',
      holesPlayed: scored.length,
    };
  }, [filteredHoles]);

  // Strokes Gained
  const sgData = useMemo(() => calcRoundSG(filteredHoles), [filteredHoles]);

  const formatSG = (val) => {
    if (val === null || val === undefined) return '—';
    const fixed = val.toFixed(1);
    return val >= 0 ? `+${fixed}` : fixed;
  };

  const sgPuttColor = sgData.sgPutt === null ? 'gray' : sgData.sgPutt >= 0 ? 'sgPositive' : 'sgNegative';
  const sgAppColor = sgData.sgApp === null ? 'gray' : sgData.sgApp >= 0 ? 'sgPositive' : 'sgNegative';

  // Aggregate shots with hole label
  const allFairwayShots = useMemo(() => {
    let shots = [];
    filteredHoles.forEach((h) => {
      (h.fairwayShots || []).forEach((s) => {
        shots.push({ ...s, label: `H${h.holeNumber}`, shotNumber: h.holeNumber });
      });
    });
    return shots;
  }, [filteredHoles]);

  const allGreenShots = useMemo(() => {
    let shots = [];
    filteredHoles.forEach((h) => {
      (h.greenShots || []).forEach((s) => {
        shots.push({ ...s, label: `H${h.holeNumber}`, shotNumber: h.holeNumber });
      });
    });
    return shots;
  }, [filteredHoles]);

  const noop = () => {}; // read-only diagrams

  if (rounds.length === 0) {
    return (
      <div className="min-h-full">
        <div className="bg-gray-900 text-white px-4 pt-10 pb-6">
          <h1 className="text-2xl font-bold">Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">Stats &amp; shot patterns</p>
        </div>
        <div className="text-center py-20 text-gray-400 px-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium text-lg text-gray-400">No rounds to analyze</p>
          <p className="text-sm text-gray-300 mt-1">Complete some rounds first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">Stats &amp; shot patterns</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Round</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {roundOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Hole</label>
            <select
              value={selectedHole}
              onChange={(e) => setSelectedHole(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="all">All Holes</option>
              {Array.from({ length: 18 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Hole {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Summary — {stats.holesPlayed} hole{stats.holesPlayed !== 1 ? 's' : ''}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Score" value={stats.totalScore} color="green" />
            <StatCard label="Avg Score" value={stats.avgScore} color="green" />
            <StatCard label="Total Putts" value={stats.totalPutts} color="blue" />
            <StatCard label="Avg Putts" value={stats.avgPutts} color="blue" />
            <StatCard label="Fairways Hit" value={stats.fwHit} color="yellow" />
            <StatCard label="GIR %" value={stats.girPct} color="purple" />
            <StatCard label="SG: Putt" value={formatSG(sgData.sgPutt)} color={sgPuttColor} />
            <StatCard label="SG: Approach" value={formatSG(sgData.sgApp)} color={sgAppColor} />
          </div>
        </div>

        {/* Fairway shot map */}
        {allFairwayShots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Fairway Shot Map</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Numbers indicate hole. Read-only.</p>
                </div>
                <ViewToggle
                  mode={fairwayViewMode}
                  onChange={setFairwayViewMode}
                />
              </div>
            </div>
            {fairwayViewMode === 'realistic' ? (
              <FairwayDiagram shots={allFairwayShots} onShotsChange={noop} readOnly />
            ) : (
              <FairwayDispersion shots={allFairwayShots} />
            )}
          </div>
        )}

        {/* Green shot map */}
        {allGreenShots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Green Shot Map</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Numbers indicate hole. Read-only.</p>
                </div>
                <ViewToggle
                  mode={greenViewMode}
                  onChange={setGreenViewMode}
                />
              </div>
            </div>
            {greenViewMode === 'realistic' ? (
              <GreenDiagram shots={allGreenShots} onShotsChange={noop} readOnly />
            ) : (
              <GreenDispersion shots={allGreenShots} />
            )}
          </div>
        )}

        {allFairwayShots.length === 0 && allGreenShots.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm">No shot data for selected filters.</p>
            <p className="text-xs text-gray-300 mt-1">Add shots on the Hole view diagrams.</p>
          </div>
        )}

        {/* Club Frequency */}
        <ClubFrequency holes={filteredHoles} />

        {/* Club Distances */}
        <ClubDistances holes={filteredHoles} />

        {/* Scorecard */}
        {selectedRound !== 'all' && (
          <Scorecard round={rounds.find((r) => r.id === selectedRound)} />
        )}

        {/* Handicap Tracker */}
        <HandicapTracker rounds={rounds} />
      </div>
    </div>
  );
}

// ---- View toggle component ----
function ViewToggle({ mode, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-semibold">
      <button
        onClick={() => onChange('realistic')}
        className={`px-2.5 py-1 transition-colors ${mode === 'realistic' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 active:bg-gray-100'}`}
      >
        Realistic
      </button>
      <button
        onClick={() => onChange('dispersion')}
        className={`px-2.5 py-1 transition-colors border-l border-gray-200 ${mode === 'dispersion' ? 'bg-green-700 text-white' : 'bg-white text-gray-600 active:bg-gray-100'}`}
      >
        Dispersion
      </button>
    </div>
  );
}

// ---- Fairway Dispersion ----
function FairwayDispersion({ shots }) {
  function dotColor(shot) {
    const dev = Math.abs(shot.x - 50);
    if (dev <= 8) return '#4ade80';
    if (dev <= 18) return '#fb923c';
    return '#ef4444';
  }

  return (
    <div>
      <svg viewBox="0 0 100 210" className="w-full" style={{ display: 'block' }}>
        {/* Dark background */}
        <rect x="0" y="0" width="100" height="210" fill="#1c2b1c" />

        {/* Vertical center dashed line */}
        <line x1="50" y1="5" x2="50" y2="205"
          stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" strokeDasharray="3,3" />

        {/* Horizontal distance lines */}
        {FW_MARKER_YS.map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y}
            stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        ))}

        {/* Shot dots */}
        {shots.map((shot) => (
          <g key={shot.id}>
            <circle cx={shot.x} cy={shot.y} r={3.5} fill={dotColor(shot)} opacity={0.85} />
            <text x={shot.x + 5} y={shot.y + 1.5}
              fontSize="3.5" fill="white" textAnchor="start"
              stroke="black" strokeWidth="0.2" paintOrder="stroke">
              {shot.shotNumber}
            </text>
          </g>
        ))}

        {/* Title */}
        <text x="50" y="208" textAnchor="middle" fontSize="4" fill="rgba(255,255,255,0.5)">
          Fairway Dispersion
        </text>
      </svg>
    </div>
  );
}

// ---- Green Dispersion ----
function GreenDispersion({ shots }) {
  function dotColor(shot) {
    const dx = shot.x - 50;
    const dy = shot.y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 15) return '#4ade80';
    if (dist <= 29) return '#fb923c';
    return '#ef4444';
  }

  return (
    <div>
      <svg viewBox="0 0 100 100" className="w-full" style={{ display: 'block' }}>
        {/* Dark background */}
        <rect x="0" y="0" width="100" height="100" fill="#1c2b1c" />

        {/* Crosshair */}
        <line x1="50" y1="0" x2="50" y2="100"
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50"
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Reference circles */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" />

        {/* Shot dots */}
        {shots.map((shot) => (
          <g key={shot.id}>
            <circle cx={shot.x} cy={shot.y} r={3.5} fill={dotColor(shot)} opacity={0.85} />
            <text x={shot.x + 5} y={shot.y + 1.5}
              fontSize="3.5" fill="white" textAnchor="start"
              stroke="black" strokeWidth="0.2" paintOrder="stroke">
              {shot.shotNumber}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---- Stat Card ----
function StatCard({ label, value, color }) {
  const colorMap = {
    green: 'text-green-700',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-500',
    sgPositive: 'text-green-600',
    sgNegative: 'text-red-500',
  };
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className={`text-2xl font-black ${colorMap[color] || 'text-gray-800'}`}>{value}</div>
    </div>
  );
}

function ClubFrequency({ holes }) {
  const freq = {};
  holes.forEach((h) => {
    if (h.club) freq[h.club] = (freq[h.club] || 0) + 1;
  });
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const max = entries[0][1];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Club Usage</h3>
      <div className="space-y-2">
        {entries.map(([club, count]) => (
          <div key={club} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 w-12 flex-shrink-0">{club}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Scorecard({ round }) {
  if (!round) return null;

  const front = round.holes.slice(0, 9);
  const back = round.holes.slice(9, 18);

  const frontTotal = front.reduce((s, h) => s + (h.score ? Number(h.score) : 0), 0);
  const backTotal = back.reduce((s, h) => s + (h.score ? Number(h.score) : 0), 0);
  const grandTotal = frontTotal + backTotal;
  const frontPar = front.reduce((s, h) => s + h.par, 0);
  const backPar = back.reduce((s, h) => s + h.par, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Scorecard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-green-800 text-white">
              <th className="px-2 py-1.5 text-left font-semibold">Hole</th>
              {front.map((h) => <th key={h.holeNumber} className="px-1.5 py-1.5 text-center font-semibold w-8">{h.holeNumber}</th>)}
              <th className="px-2 py-1.5 text-center font-semibold bg-green-900">OUT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50">
              <td className="px-2 py-1 font-semibold text-gray-600">Par</td>
              {front.map((h) => <td key={h.holeNumber} className="px-1.5 py-1 text-center text-gray-600">{h.par}</td>)}
              <td className="px-2 py-1 text-center font-bold text-green-800 bg-green-100">{frontPar}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 font-semibold text-gray-600">Score</td>
              {front.map((h) => {
                const s = h.score !== null && h.score !== '' ? Number(h.score) : null;
                const diff = s !== null ? s - h.par : null;
                return (
                  <td key={h.holeNumber} className="px-1.5 py-1 text-center">
                    {s !== null ? (
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${scoreStyle(diff)}`}>
                        {s}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-1 text-center font-bold text-gray-800 bg-gray-50">
                {frontTotal > 0 ? frontTotal : '—'}
              </td>
            </tr>
            <tr className="bg-green-50">
              <td className="px-2 py-1 font-semibold text-gray-600">Putts</td>
              {front.map((h) => <td key={h.holeNumber} className="px-1.5 py-1 text-center text-gray-500">{h.putts ?? '—'}</td>)}
              <td className="px-2 py-1 text-center text-gray-600 bg-green-100">
                {front.reduce((s, h) => s + (h.putts || 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full text-xs border-collapse border-t border-gray-200">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="px-2 py-1.5 text-left font-semibold">Hole</th>
              {back.map((h) => <th key={h.holeNumber} className="px-1.5 py-1.5 text-center font-semibold w-8">{h.holeNumber}</th>)}
              <th className="px-2 py-1.5 text-center font-semibold bg-green-900">IN</th>
              <th className="px-2 py-1.5 text-center font-semibold bg-green-900">TOT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-green-50">
              <td className="px-2 py-1 font-semibold text-gray-600">Par</td>
              {back.map((h) => <td key={h.holeNumber} className="px-1.5 py-1 text-center text-gray-600">{h.par}</td>)}
              <td className="px-2 py-1 text-center font-bold text-green-800 bg-green-100">{backPar}</td>
              <td className="px-2 py-1 text-center font-bold text-green-900 bg-green-200">{frontPar + backPar}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 font-semibold text-gray-600">Score</td>
              {back.map((h) => {
                const s = h.score !== null && h.score !== '' ? Number(h.score) : null;
                const diff = s !== null ? s - h.par : null;
                return (
                  <td key={h.holeNumber} className="px-1.5 py-1 text-center">
                    {s !== null ? (
                      <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${scoreStyle(diff)}`}>
                        {s}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-1 text-center font-bold text-gray-800 bg-gray-50">
                {backTotal > 0 ? backTotal : '—'}
              </td>
              <td className="px-2 py-1 text-center font-black text-green-900 bg-green-50">
                {grandTotal > 0 ? grandTotal : '—'}
              </td>
            </tr>
            <tr className="bg-green-50">
              <td className="px-2 py-1 font-semibold text-gray-600">Putts</td>
              {back.map((h) => <td key={h.holeNumber} className="px-1.5 py-1 text-center text-gray-500">{h.putts ?? '—'}</td>)}
              <td className="px-2 py-1 text-center text-gray-600 bg-green-100">
                {back.reduce((s, h) => s + (h.putts || 0), 0)}
              </td>
              <td className="px-2 py-1 text-center font-bold text-gray-700 bg-green-100">
                {round.holes.reduce((s, h) => s + (h.putts || 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClubDistances({ holes }) {
  const clubData = {};
  holes.forEach(h => {
    if (h.club && h.approachDistance && Number(h.approachDistance) > 0) {
      if (!clubData[h.club]) clubData[h.club] = [];
      clubData[h.club].push(Number(h.approachDistance));
    }
  });

  const entries = Object.entries(clubData)
    .map(([club, dists]) => ({
      club,
      avg: Math.round(dists.reduce((a, b) => a + b, 0) / dists.length),
      count: dists.length,
      min: Math.min(...dists),
      max: Math.max(...dists),
    }))
    .sort((a, b) => b.avg - a.avg);

  if (entries.length === 0) return null;
  const maxAvg = entries[0].avg;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Club Distances</h3>
      <div className="space-y-2.5">
        {entries.map(({ club, avg, count, min, max }) => (
          <div key={club}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 w-10 flex-shrink-0">{club}</span>
              <div className="flex-1 relative h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(avg / maxAvg) * 100}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-800 w-10 text-right">{avg}y</span>
              <span className="text-xs text-gray-400 w-12 text-right">({count}x)</span>
            </div>
            <div className="flex justify-end pr-[88px] mt-0.5">
              <span className="text-[10px] text-gray-400">{min}–{max}y</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandicapTracker({ rounds }) {
  const diffs = rounds
    .filter(r => r.courseRating && r.slope)
    .map(r => {
      const score = r.holes.reduce((s, h) => s + (h.score ? Number(h.score) : 0), 0);
      if (!score) return null;
      const diff = +((score - r.courseRating) * 113 / r.slope).toFixed(1);
      return { date: r.date, course: r.course, diff, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (diffs.length === 0) return null;

  const sorted = [...diffs].sort((a, b) => a.diff - b.diff);
  const best8 = sorted.slice(0, Math.min(8, sorted.length));
  const hcpIndex = best8.length >= 3
    ? +(best8.reduce((s, d) => s + d.diff, 0) / best8.length * 0.96).toFixed(1)
    : null;

  const maxAbs = Math.max(...diffs.map(d => Math.abs(d.diff)), 1);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Handicap Differential</h3>
        {hcpIndex !== null && (
          <div className="bg-green-50 px-3 py-1 rounded-full">
            <span className="text-xs text-green-700 font-bold">Est. Index: {hcpIndex}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {diffs.map((d, i) => {
          const isPositive = d.diff >= 0;
          const barH = Math.round((Math.abs(d.diff) / maxAbs) * 36);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <span className="text-[9px] text-gray-500">{d.diff > 0 ? '+' : ''}{d.diff}</span>
              <div className={`w-full rounded-sm ${isPositive ? 'bg-red-400' : 'bg-green-500'}`}
                style={{ height: Math.max(barH, 3) }} />
              <span className="text-[8px] text-gray-400 truncate w-full text-center">
                {d.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
      {hcpIndex === null && (
        <p className="text-xs text-gray-400 text-center mt-2">Need 3+ rounds with course rating/slope</p>
      )}
    </div>
  );
}

function scoreStyle(diff) {
  if (diff === null) return 'bg-gray-100 text-gray-600';
  if (diff <= -2) return 'bg-yellow-400 text-yellow-900';
  if (diff === -1) return 'bg-red-500 text-white';
  if (diff === 0) return 'bg-green-600 text-white';
  if (diff === 1) return 'bg-blue-400 text-white';
  if (diff === 2) return 'bg-blue-600 text-white';
  return 'bg-gray-600 text-white';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
