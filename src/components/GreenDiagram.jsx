import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

const SHAPES = ['Straight', 'Draw', 'Fade', 'Hook', 'Slice'];
const SHAPE_COLORS = {
  Straight: '#6b7280', Draw: '#2563eb', Fade: '#d97706',
  Hook: '#dc2626', Slice: '#7c3aed',
};
// Right-handed: Draw/Hook curve left (positive), Fade/Slice curve right (negative)
const SHAPE_CURVE = { Straight: 0, Draw: 5, Fade: -5, Hook: 12, Slice: -12 };

const W = 100;
const H = 210;
const GRN_CX = 50;
const GRN_CY = 25;
const GRN_R  = 20;

// Approach corridor — starts at bottom of green, represents 0–250 yards from pin
const APPR_TOP_Y    = GRN_CY + GRN_R; // 45
const APPR_BOT_Y    = 195;
const APPR_PX_PER_YD = (APPR_BOT_Y - APPR_TOP_Y) / 250; // 0.6 units/yd
const APPR_TOP_LX   = GRN_CX - GRN_R; // 30
const APPR_TOP_RX   = GRN_CX + GRN_R; // 70
const APPR_BOT_LX   = 12;
const APPR_BOT_RX   = 88;
const APPR_PATH     = `M ${APPR_TOP_LX},${APPR_TOP_Y} L ${APPR_BOT_LX},${APPR_BOT_Y} Q ${GRN_CX},207 ${APPR_BOT_RX},${APPR_BOT_Y} L ${APPR_TOP_RX},${APPR_TOP_Y} Z`;

// Yardage markers at 25-yd intervals; labeled at 50-yd marks
const APPR_MARKERS = Array.from({ length: 10 }, (_, i) => {
  const yd = (i + 1) * 25;
  return { yd, y: APPR_TOP_Y + yd * APPR_PX_PER_YD, labeled: yd % 50 === 0 };
});

function corridorEdge(y) {
  const t = Math.max(0, Math.min(1, (y - APPR_TOP_Y) / (APPR_BOT_Y - APPR_TOP_Y)));
  return {
    lx: APPR_TOP_LX + (APPR_BOT_LX - APPR_TOP_LX) * t,
    rx: APPR_TOP_RX + (APPR_BOT_RX - APPR_TOP_RX) * t,
  };
}

// Use getBoundingClientRect — reliable after page scroll (getScreenCTM is not)
function getSvgCoords(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const vb   = svg.viewBox.baseVal;
  return {
    x: (clientX - rect.left) * (vb.width  / rect.width),
    y: (clientY - rect.top)  * (vb.height / rect.height),
  };
}

function curveCP(x1, y1, x2, y2, curvature) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  if (!curvature) return { cpx: mx, cpy: my };
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { cpx: mx + (dy / len) * curvature, cpy: my + (-dx / len) * curvature };
}

function getShotDistLabel(shot) {
  const dx = shot.x - GRN_CX, dy = shot.y - GRN_CY;
  const svgDist = Math.sqrt(dx * dx + dy * dy);
  if (shot.y <= APPR_TOP_Y + 5) {
    return `${Math.round(svgDist / GRN_R * 30)} ft from pin`;
  }
  return `${Math.round((shot.y - APPR_TOP_Y) / APPR_PX_PER_YD)} yds from pin`;
}

function getLastShotInfo(shots) {
  if (!shots || shots.length === 0) return { value: '—', unit: 'FT' };
  const last = [...shots].sort((a, b) => b.shotNumber - a.shotNumber)[0];
  const dx = last.x - GRN_CX, dy = last.y - GRN_CY;
  const svgDist = Math.sqrt(dx * dx + dy * dy);
  if (last.y <= APPR_TOP_Y + 5) {
    return { value: String(Math.round(svgDist / GRN_R * 30)), unit: 'FT' };
  }
  return { value: String(Math.round((last.y - APPR_TOP_Y) / APPR_PX_PER_YD)), unit: 'YDS' };
}

function GolfBallIcon({ size = 30 }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={c - 1.5} fill="white" stroke="#d1d5db" strokeWidth="1.5"/>
      {[[c-4,c-4],[c+4,c-4],[c-7,c],[c,c],[c+7,c],[c-4,c+4],[c+4,c+4]].map(([dx,dy],i) => (
        <circle key={i} cx={dx} cy={dy} r={1.2} fill="rgba(0,0,0,0.09)"/>
      ))}
    </svg>
  );
}

function ShotPin({ shot, isDragging, readOnly, onPointerDown, onDelete }) {
  if (readOnly) {
    return (
      <g transform={`translate(${shot.x},${shot.y})`}>
        <circle r={2} fill="#111827"/>
      </g>
    );
  }
  const fill = isDragging ? '#1d4ed8' : '#111827';
  return (
    <g transform={`translate(${shot.x},${shot.y})`}>
      <circle r={3.5} fill={fill}
        onPointerDown={onPointerDown} style={{ cursor: 'grab' }}/>
      <text x={0} y={1.3} textAnchor="middle" fontSize="3" fontWeight="700"
        fill="white" style={{ pointerEvents: 'none' }}>{shot.shotNumber}</text>
      <g transform="translate(5,-5)" onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
        <circle cx={0} cy={0} r={2.3} fill="#ef4444" stroke="white" strokeWidth="0.7"/>
        <line x1={-1.1} y1={-1.1} x2={1.1} y2={1.1} stroke="white" strokeWidth="1.0" strokeLinecap="round"/>
        <line x1={1.1} y1={-1.1} x2={-1.1} y2={1.1} stroke="white" strokeWidth="1.0" strokeLinecap="round"/>
      </g>
    </g>
  );
}

export default function GreenDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging]       = useState(null);
  const [ghost, setGhost]             = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const shotsRef = useRef(shots);
  useEffect(() => { shotsRef.current = shots; }, [shots]);

  const setLastShotShape = useCallback((shape) => {
    const cur = shotsRef.current;
    if (!cur.length) return;
    const maxNum = Math.max(...cur.map(s => s.shotNumber));
    onShotsChange(cur.map(s => s.shotNumber === maxNum ? { ...s, shape } : s));
  }, [onShotsChange]);

  const lastShot = shots.length > 0
    ? [...shots].sort((a, b) => b.shotNumber - a.shotNumber)[0]
    : null;

  const handleMarkerDown = useCallback((e, id) => {
    if (readOnly) return;
    e.stopPropagation(); e.preventDefault();
    setDragging(id);
    const onMove = (me) => {
      const pt = getSvgCoords(svgRef.current, me.clientX, me.clientY);
      onShotsChange(shotsRef.current.map(s => s.id === id ? { ...s, x: pt.x, y: pt.y } : s));
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [readOnly, onShotsChange]);

  const handleDelete = useCallback((e, id) => {
    if (readOnly) return;
    e.stopPropagation(); e.preventDefault();
    onShotsChange(shotsRef.current.filter(s => s.id !== id));
  }, [readOnly, onShotsChange]);

  const handleLauncherDown = useCallback((e) => {
    e.preventDefault();
    setGhost({ x: e.clientX, y: e.clientY });
    const onMove = (me) => setGhost({ x: me.clientX, y: me.clientY });
    const onUp = (me) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const svg = svgRef.current;
      if (svg) {
        const pt = getSvgCoords(svg, me.clientX, me.clientY);
        if (pt.x >= 0 && pt.x <= W && pt.y >= 0 && pt.y <= H) {
          const cur = shotsRef.current;
          onShotsChange([...cur, { id: generateId(), x: pt.x, y: pt.y, shotNumber: cur.length + 1 }]);
        }
      }
      setGhost(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [onShotsChange]);

  const handleUndo = () => {
    const cur = shotsRef.current;
    if (!cur.length) return;
    const maxNum = Math.max(...cur.map(s => s.shotNumber));
    onShotsChange(cur.filter(s => s.shotNumber !== maxNum));
  };

  const sorted = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);
  const distInfo = getLastShotInfo(shots);

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* banner */}
      {!readOnly && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0C3.24 0 1 2.24 1 5C1 8.5 6 14 6 14C6 14 11 8.5 11 5C11 2.24 8.76 0 6 0Z" fill="#4ade80"/>
              <circle cx="6" cy="5" r="2" fill="white"/>
            </svg>
            <span className="text-white font-bold text-sm tabular-nums">{distInfo.value}</span>
            <span className="text-gray-400 text-xs">{distInfo.unit}</span>
          </div>
          <div className="w-px h-4 bg-gray-600"/>
          <span className="text-gray-300 text-sm">{shots.length} SHOTS</span>
          <div className="flex-1"/>
          <button onClick={handleUndo} disabled={!shots.length}
            className="p-1.5 text-gray-400 disabled:opacity-30 active:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
            </svg>
          </button>
          <button onClick={() => setShowSummary(true)}
            className="p-1.5 text-gray-400 active:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>
      )}

      {/* shape selector */}
      {!readOnly && shots.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 overflow-x-auto">
          <span className="text-gray-400 text-xs flex-shrink-0">Shape:</span>
          {SHAPES.map(shape => (
            <button key={shape} onClick={() => setLastShotShape(shape)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-colors
                ${lastShot?.shape === shape ? 'text-white' : 'bg-gray-700 text-gray-400'}`}
              style={lastShot?.shape === shape ? { backgroundColor: SHAPE_COLORS[shape] } : {}}>
              {shape}
            </button>
          ))}
        </div>
      )}

      {/* SVG — max-width keeps it from being too large */}
      <div className="flex justify-center bg-[#e8e0d0]">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: 320, display: 'block' }}>
          <defs>
            <pattern id="grn-hatch" patternUnits="userSpaceOnUse" width="4" height="4"
              patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#c4c4c0" strokeWidth="0.7"/>
            </pattern>
            <clipPath id="grn-appr-clip">
              <path d={APPR_PATH}/>
            </clipPath>
          </defs>

          {/* rough background */}
          <rect x="0" y="0" width={W} height={H} fill="#e8e0d0"/>

          {/* approach corridor */}
          <path d={APPR_PATH} fill="white"/>
          <path d={APPR_PATH} fill="url(#grn-hatch)" clipPath="url(#grn-appr-clip)"/>
          <path d={APPR_PATH} fill="none" stroke="#2a2a2a" strokeWidth="0.5"/>

          {/* yardage markers */}
          {APPR_MARKERS.map(({ yd, y, labeled }) => {
            const { lx, rx } = corridorEdge(y);
            return (
              <g key={yd}>
                <line x1={lx} y1={y} x2={rx} y2={y}
                  stroke={labeled ? '#8a8a86' : '#c0c0bc'}
                  strokeWidth={labeled ? 0.5 : 0.35}
                  strokeDasharray="1.5,2"/>
                {labeled && (
                  <text x={rx + 1.5} y={y + 1.3}
                    fontSize="3" fill="#4a4a46" fontWeight="500">{yd}</text>
                )}
              </g>
            );
          })}

          {/* bunkers flanking green — rendered before green so green covers overlap */}
          <ellipse cx="30" cy="44" rx="11" ry="5" fill="#e8d5a3" stroke="#c8b870" strokeWidth="0.5" transform="rotate(-30 30 44)"/>
          <ellipse cx="70" cy="44" rx="11" ry="5" fill="#e8d5a3" stroke="#c8b870" strokeWidth="0.5" transform="rotate(30 70 44)"/>

          {/* green rings — outer to inner */}
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R}           fill="#d4d4d0"/>
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R * 2 / 3}   fill="#eeeeeb"/>
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R / 3}       fill="#f5f5f2"/>
          {/* ring borders */}
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R}           fill="none" stroke="#2a2a2a" strokeWidth="0.6"/>
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R * 2 / 3}   fill="none" stroke="#7a7a76" strokeWidth="0.4"/>
          <circle cx={GRN_CX} cy={GRN_CY} r={GRN_R / 3}       fill="none" stroke="#7a7a76" strokeWidth="0.4"/>
          {/* ring distance labels */}
          <text x={GRN_CX + GRN_R - 1}       y={GRN_CY - 1} textAnchor="end" fontSize="2.8" fill="#555550" fontWeight="500">30ft</text>
          <text x={GRN_CX + GRN_R * 2/3 - 1} y={GRN_CY - 1} textAnchor="end" fontSize="2.8" fill="#555550" fontWeight="500">20ft</text>
          <text x={GRN_CX + GRN_R / 3 - 0.5} y={GRN_CY - 1} textAnchor="end" fontSize="2.8" fill="#555550" fontWeight="500">10ft</text>

          {/* center cup + flagstick + flag */}
          <circle cx={GRN_CX} cy={GRN_CY} r={1.5} fill="#2a2a2a"/>
          <line x1={GRN_CX} y1={GRN_CY - 1.2} x2={GRN_CX} y2={GRN_CY - 9}
            stroke="#1a1a1a" strokeWidth="0.7" strokeLinecap="round"/>
          <polygon points={`${GRN_CX},${GRN_CY-9} ${GRN_CX+4},${GRN_CY-6.5} ${GRN_CX},${GRN_CY-4}`}
            fill="#ef4444"/>

          {/* connecting lines with shot shape curves */}
          {!readOnly && sorted.length > 1 && sorted.map((shot, i) => {
            if (i === 0) return null;
            const prev = sorted[i - 1];
            const curvature = SHAPE_CURVE[shot.shape] || 0;
            const { cpx, cpy } = curveCP(prev.x, prev.y, shot.x, shot.y, curvature);
            return (
              <path key={`conn-${shot.id}`}
                d={`M ${prev.x},${prev.y} Q ${cpx},${cpy} ${shot.x},${shot.y}`}
                stroke="#111827" fill="none" strokeWidth="0.5" strokeDasharray="2,2"/>
            );
          })}

          {/* shot markers */}
          {shots.map(shot => (
            <ShotPin key={shot.id} shot={shot} isDragging={dragging === shot.id}
              readOnly={readOnly}
              onPointerDown={(e) => handleMarkerDown(e, shot.id)}
              onDelete={(e) => handleDelete(e, shot.id)}/>
          ))}
        </svg>
      </div>

      {/* launcher — HTML div for reliable iOS touch */}
      {!readOnly && (
        <div
          onPointerDown={handleLauncherDown}
          style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
          className="bg-gray-900 flex items-center justify-center gap-3 py-3 border-t border-gray-800 active:opacity-70 transition-opacity"
        >
          <GolfBallIcon size={28}/>
          <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
            Drag to place shot
          </span>
        </div>
      )}

      {/* ghost ball */}
      {ghost && (
        <div style={{ position: 'fixed', left: ghost.x, top: ghost.y,
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 9999 }}>
          <GolfBallIcon size={30}/>
        </div>
      )}

      {/* summary sheet */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowSummary(false)}>
          <div className="absolute inset-0 bg-black/40"/>
          <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Green &amp; Approach Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {sorted.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">No shots placed yet.</p>
              : <div className="space-y-2">
                  {sorted.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{s.shotNumber}</span>
                        </div>
                        <span className="text-gray-700 text-sm">Shot {s.shotNumber}</span>
                      </div>
                      <span className="text-gray-500 text-sm font-medium">{getShotDistLabel(s)}</span>
                    </div>
                  ))}
                </div>
            }
            {shots.length > 0 && (
              <button onClick={() => { onShotsChange([]); setShowSummary(false); }}
                className="mt-4 w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm active:bg-red-100">
                Clear All Shots
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
