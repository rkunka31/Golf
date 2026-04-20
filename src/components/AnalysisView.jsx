import { useState, useMemo } from 'react';
import FairwayDiagram from './FairwayDiagram';
import GreenDiagram from './GreenDiagram';

export default function AnalysisView({ rounds }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedHole, setSelectedHole] = useState('all');

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
        <div className="bg-green-800 text-white px-4 pt-10 pb-6">
          <h1 className="text-2xl font-bold">Analysis</h1>
          <p className="text-green-300 text-sm mt-1">Stats &amp; shot patterns</p>
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
      <div className="bg-green-800 text-white px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold">Analysis</h1>
        <p className="text-green-300 text-sm mt-1">Stats &amp; shot patterns</p>
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
          </div>
        </div>

        {/* Fairway shot map */}
        {allFairwayShots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Fairway Shot Map</h3>
              <p className="text-xs text-gray-400 mt-0.5">Numbers indicate hole. Read-only.</p>
            </div>
            <FairwayDiagram shots={allFairwayShots} onShotsChange={noop} readOnly />
          </div>
        )}

        {/* Green shot map */}
        {allGreenShots.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Green Shot Map</h3>
              <p className="text-xs text-gray-400 mt-0.5">Numbers indicate hole. Read-only.</p>
            </div>
            <GreenDiagram shots={allGreenShots} onShotsChange={noop} readOnly />
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

        {/* Scorecard */}
        {selectedRound !== 'all' && (
          <Scorecard round={rounds.find((r) => r.id === selectedRound)} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    green: 'text-green-700',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
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
