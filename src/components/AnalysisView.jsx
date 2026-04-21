import { useState, useMemo } from 'react';
import FairwayDiagram from './FairwayDiagram';
import GreenDiagram from './GreenDiagram';
import { calcRoundSG } from '../utils/strokesGained';


export default function AnalysisView({ rounds }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedHole, setSelectedHole] = useState('all');
  const [fairwayViewMode, setFairwayViewMode] = useState('realistic'); // 'realistic' | 'dispersion'
  const [greenViewMode, setGreenViewMode] = useState('realistic');     // 'realistic' | 'dispersion'

  // Unique courses
  const courseOptions = useMemo(() => {
    const courses = [...new Set(rounds.map(r => r.course).filter(Boolean))].sort();
    return ['all', ...courses];
  }, [rounds]);

  // Round options filtered by selected course
  const roundOptions = useMemo(() => {
    const courseRounds = selectedCourse === 'all'
      ? rounds
      : rounds.filter(r => r.course === selectedCourse);
    return [
      { value: 'all', label: 'All Rounds' },
      ...courseRounds.map((r) => ({
        value: r.id,
        label: `${r.course || 'Unnamed'} — ${formatDate(r.date)}`,
      })),
    ];
  }, [rounds, selectedCourse]);

  // Filter holes by course → round → hole
  const filteredHoles = useMemo(() => {
    let holes = [];
    let active = selectedCourse === 'all' ? rounds : rounds.filter(r => r.course === selectedCourse);
    if (selectedRound !== 'all') active = active.filter(r => r.id === selectedRound);
    active.forEach((r) => {
      r.holes.forEach((h) => {
        if (selectedHole === 'all' || Number(selectedHole) === h.holeNumber) {
          holes.push({ ...h, roundId: r.id, roundCourse: r.course, roundDate: r.date });
        }
      });
    });
    return holes;
  }, [rounds, selectedRound, selectedCourse, selectedHole]);

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
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedRound('all'); }}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="all">All Courses</option>
              {courseOptions.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Round</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
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
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
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
              <FairwayDispersion holes={filteredHoles} />
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
// Must match FairwayDiagram constants exactly so SVG y positions interpolate correctly
const FW_MARKERS = [
  { yd: 300, y: 19 }, { yd: 250, y: 33 }, { yd: 200, y: 47 },
  { yd: 150, y: 62 }, { yd: 100, y: 76 }, { yd: 50,  y: 90 },
];
const FW_OVL_CX = 50;
const FW_OVL_RX = 17;
const FW_HALF_YDS = 20; // approx half-width of fairway in yards

function yardsFromSvgY(svgY) {
  for (let i = 0; i < FW_MARKERS.length - 1; i++) {
    const a = FW_MARKERS[i], b = FW_MARKERS[i + 1];
    if (svgY >= a.y && svgY <= b.y) {
      const t = (svgY - a.y) / (b.y - a.y);
      return a.yd + t * (b.yd - a.yd);
    }
  }
  return svgY < FW_MARKERS[0].y ? FW_MARKERS[0].yd : FW_MARKERS[FW_MARKERS.length - 1].yd;
}

function FairwayDispersion({ holes }) {
  // Build per-shot (dist_traveled, lateral) pairs
  const dots = [];
  holes.forEach(hole => {
    const shots = (hole.fairwayShots || []).sort((a, b) => a.shotNumber - b.shotNumber);
    shots.forEach((shot, i) => {
      const toYds   = yardsFromSvgY(shot.y);
      const fromYds = i === 0 ? 0 : yardsFromSvgY(shots[i - 1].y);
      const dist    = i === 0 ? toYds : Math.max(0, fromYds - toYds);
      const lateral = (shot.x - FW_OVL_CX) / FW_OVL_RX * FW_HALF_YDS;
      dots.push({ dist, lateral });
    });
  });

  // Chart layout
  const VW = 130, VH = 148;
  const pl = 36, pr = 10, pt = 18, pb = 30;
  const cW = VW - pl - pr;  // 84
  const cH = VH - pt - pb;  // 100
  const maxYds = 320, maxLat = 30;
  const cx0 = pl + cW / 2;

  const pY = d  => pt + cH - Math.min(d / maxYds, 1.05) * cH;
  const pX = lat => pl + ((lat + maxLat) / (2 * maxLat)) * cW;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block" style={{ background: '#f5f5f2' }}>
      {/* plot background */}
      <rect x={pl} y={pt} width={cW} height={cH} fill="white" stroke="#e0e0dc" strokeWidth="0.5"/>

      {/* fairway band ±10 yds shading */}
      <rect x={pX(-10)} y={pt} width={pX(10) - pX(-10)} height={cH}
        fill="#e8f0e8" opacity="0.9"/>

      {/* horizontal gridlines */}
      {[100, 150, 200, 250, 300].map(yd => (
        <g key={yd}>
          <line x1={pl} y1={pY(yd)} x2={pl + cW} y2={pY(yd)}
            stroke="#d0d0cc" strokeWidth="0.4" strokeDasharray="2,2"/>
          <text x={pl - 2} y={pY(yd) + 1.2} textAnchor="end" fontSize="4" fill="#6a6a66">{yd}</text>
        </g>
      ))}

      {/* center vertical line */}
      <line x1={cx0} y1={pt} x2={cx0} y2={pt + cH}
        stroke="#a0a09a" strokeWidth="0.5" strokeDasharray="2,2"/>

      {/* axes */}
      <line x1={pl} y1={pt + cH} x2={pl + cW} y2={pt + cH} stroke="#2a2a2a" strokeWidth="0.7"/>
      <line x1={pl} y1={pt}      x2={pl}       y2={pt + cH} stroke="#2a2a2a" strokeWidth="0.7"/>

      {/* x-axis labels */}
      <text x={pl + 2}      y={pt + cH + 9} textAnchor="start" fontSize="4" fill="#555550">← Left</text>
      <text x={cx0}         y={pt + cH + 9} textAnchor="middle" fontSize="4" fill="#555550">Center</text>
      <text x={pl + cW - 2} y={pt + cH + 9} textAnchor="end"   fontSize="4" fill="#555550">Right →</text>

      {/* y-axis title */}
      <text fontSize="4" fill="#555550" fontWeight="500"
        transform={`rotate(-90) translate(${-(pt + cH / 2)}, 9)`} textAnchor="middle">
        Yards
      </text>

      {/* dots */}
      {dots.map((d, i) => (
        <circle key={i}
          cx={Math.max(pl + 2, Math.min(pl + cW - 2, pX(d.lateral)))}
          cy={Math.max(pt + 2, Math.min(pt + cH - 2, pY(d.dist)))}
          r={2.5} fill="#111827" opacity={0.65}/>
      ))}

      {dots.length === 0 && (
        <text x={VW / 2} y={VH / 2} textAnchor="middle" fontSize="6" fill="#9ca3af">No data</text>
      )}
    </svg>
  );
}

// ---- Green Dispersion ----
const GRN_CX  = 50;
const GRN_MAX_R = 42;
const GRN_MAX_FT = 30;

function GreenDispersion({ shots }) {
  const dots = shots.map(s => ({
    dist:    Math.sqrt((s.x - GRN_CX) ** 2 + (s.y - GRN_CX) ** 2) / GRN_MAX_R * GRN_MAX_FT,
    lateral: (s.x - GRN_CX) / GRN_MAX_R * GRN_MAX_FT,
  }));

  const VW = 120, VH = 140;
  const pl = 34, pr = 10, pt = 15, pb = 28;
  const cW = VW - pl - pr;  // 76
  const cH = VH - pt - pb;  // 97
  const maxFt = 35, maxLat = 35;
  const cx0 = pl + cW / 2;

  const pY = d   => pt + cH - Math.min(d / maxFt, 1.05) * cH;
  const pX = lat => pl + ((lat + maxLat) / (2 * maxLat)) * cW;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block" style={{ background: '#f5f5f2' }}>
      <rect x={pl} y={pt} width={cW} height={cH} fill="white" stroke="#e0e0dc" strokeWidth="0.5"/>

      {[10, 20, 30].map(ft => (
        <g key={ft}>
          <line x1={pl} y1={pY(ft)} x2={pl + cW} y2={pY(ft)}
            stroke="#d0d0cc" strokeWidth="0.4" strokeDasharray="2,2"/>
          <text x={pl - 2} y={pY(ft) + 1.2} textAnchor="end" fontSize="4" fill="#6a6a66">{ft}ft</text>
        </g>
      ))}

      <line x1={cx0} y1={pt} x2={cx0} y2={pt + cH}
        stroke="#a0a09a" strokeWidth="0.5" strokeDasharray="2,2"/>

      <line x1={pl} y1={pt + cH} x2={pl + cW} y2={pt + cH} stroke="#2a2a2a" strokeWidth="0.7"/>
      <line x1={pl} y1={pt}      x2={pl}       y2={pt + cH} stroke="#2a2a2a" strokeWidth="0.7"/>

      <text x={pl + 2}      y={pt + cH + 9} textAnchor="start"  fontSize="4" fill="#555550">← Left</text>
      <text x={cx0}         y={pt + cH + 9} textAnchor="middle" fontSize="4" fill="#555550">Pin</text>
      <text x={pl + cW - 2} y={pt + cH + 9} textAnchor="end"    fontSize="4" fill="#555550">Right →</text>

      <text fontSize="4" fill="#555550" fontWeight="500"
        transform={`rotate(-90) translate(${-(pt + cH / 2)}, 9)`} textAnchor="middle">
        Feet
      </text>

      {dots.map((d, i) => (
        <circle key={i}
          cx={Math.max(pl + 2, Math.min(pl + cW - 2, pX(d.lateral)))}
          cy={Math.max(pt + 2, Math.min(pt + cH - 2, pY(d.dist)))}
          r={2.5} fill="#111827" opacity={0.65}/>
      ))}

      {dots.length === 0 && (
        <text x={VW / 2} y={VH / 2} textAnchor="middle" fontSize="6" fill="#9ca3af">No data</text>
      )}
    </svg>
  );
}

// ---- Stat Card ----
function StatCard({ label, value, color }) {
  const valueColor =
    color === 'sgPositive' ? 'text-green-600' :
    color === 'sgNegative' ? 'text-red-500'   :
    'text-gray-900';
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-400 font-medium mb-1">{label}</div>
      <div className={`text-2xl font-black ${valueColor}`}>{value}</div>
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
