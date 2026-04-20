import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

// ViewBox: wide enough to fill screen, tall for usability
const W = 100;
const H = 230;

// Oval bounds — wide (nearly full width) and tall
const OVL_CX = 50;
const OVL_CY = 113;
const OVL_RX = 42; // wide
const OVL_RY = 108;

// Distance markers: y positions top→bottom, labels = yards from tee
const MARKER_YS    = [13,  54,  92, 130, 169, 208];
const MARKER_LABELS = [300, 250, 200, 150, 100,  50];

function getSvgCoords(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: OVL_CX, y: OVL_CY };
  return pt.matrixTransform(ctm.inverse());
}

function getDistLabel(shots) {
  if (!shots || shots.length === 0) return '—';
  const last = [...shots].sort((a, b) => b.shotNumber - a.shotNumber)[0];
  const y = last.y;
  for (let i = 0; i < MARKER_YS.length - 1; i++) {
    if (y >= MARKER_YS[i] && y <= MARKER_YS[i + 1]) {
      const t = (y - MARKER_YS[i]) / (MARKER_YS[i + 1] - MARKER_YS[i]);
      return String(Math.round(MARKER_LABELS[i] + t * (MARKER_LABELS[i + 1] - MARKER_LABELS[i])));
    }
  }
  return y < MARKER_YS[0] ? String(MARKER_LABELS[0]) : String(MARKER_LABELS[MARKER_LABELS.length - 1]);
}

function GolfBallIcon({ size = 30 }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={c - 1.5} fill="white" stroke="#d1d5db" strokeWidth="1.5" />
      {[[c-4,c-4],[c+4,c-4],[c-7,c],[c,c],[c+7,c],[c-4,c+4],[c+4,c+4]].map(([dx,dy],i) => (
        <circle key={i} cx={dx} cy={dy} r={1.2} fill="rgba(0,0,0,0.09)" />
      ))}
    </svg>
  );
}

// Small teardrop pin — white fill, blue border while dragging
function ShotPin({ shot, isDragging, readOnly, onPointerDown, onDelete }) {
  const stroke = isDragging ? '#2563eb' : '#374151';
  const fill   = isDragging ? '#dbeafe' : 'white';
  return (
    <g transform={`translate(${shot.x},${shot.y})`}>
      {/* soft shadow */}
      <ellipse cx={0.5} cy={0.5} rx={4} ry={1.8} fill="rgba(0,0,0,0.18)" />
      {/* teardrop body: tip at (0,0), head at (0,-10) */}
      <path
        d="M 0 0 C -3.5 -3, -5 -6, -5 -9 C -5 -13, -2.5 -16, 0 -16 C 2.5 -16, 5 -13, 5 -9 C 5 -6, 3.5 -3, 0 0 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
        onPointerDown={readOnly ? undefined : onPointerDown}
        style={{ cursor: readOnly ? 'default' : 'grab' }}
      />
      {/* inner circle */}
      <circle cx={0} cy={-9} r={3} fill={stroke} style={{ pointerEvents: 'none' }} />
      {/* shot number */}
      <text x={0} y={-7} textAnchor="middle" fontSize="3.2" fontWeight="700"
        fill="white" style={{ pointerEvents: 'none' }}>{shot.shotNumber}</text>
      {/* delete button */}
      {!readOnly && (
        <g transform="translate(5.5,-16.5)" onClick={onDelete}
          onPointerDown={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
          <circle cx={0} cy={0} r={3.2} fill="#ef4444" stroke="white" strokeWidth="0.7" />
          <line x1={-1.5} y1={-1.5} x2={1.5} y2={1.5} stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1={1.5} y1={-1.5} x2={-1.5} y2={1.5} stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
        </g>
      )}
    </g>
  );
}

export default function FairwayDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef  = useRef(null);
  const [dragging, setDragging]     = useState(null);
  const [ghost, setGhost]           = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const shotsRef = useRef(shots);
  useEffect(() => { shotsRef.current = shots; }, [shots]);

  // ── drag existing marker ──
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

  // ── launcher drag-to-place ──
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
        const dx = pt.x - OVL_CX, dy = pt.y - OVL_CY;
        const inOval = (dx * dx) / (OVL_RX * OVL_RX) + (dy * dy) / (OVL_RY * OVL_RY) <= 1.15;
        if (inOval) {
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

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* ── top banner ── */}
      {!readOnly && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900">
          <div className="flex items-center gap-1.5">
            {/* pin icon */}
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0C3.24 0 1 2.24 1 5C1 8.5 6 14 6 14C6 14 11 8.5 11 5C11 2.24 8.76 0 6 0Z" fill="#4ade80"/>
              <circle cx="6" cy="5" r="2" fill="white"/>
            </svg>
            <span className="text-white font-bold text-sm tabular-nums">{getDistLabel(shots)}</span>
            <span className="text-gray-400 text-xs">YDS</span>
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

      {/* ── SVG diagram ── */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block"
        style={{ touchAction: 'none' }}>
        <defs>
          {/* diagonal hatch pattern inside oval */}
          <pattern id="fw-hatch" patternUnits="userSpaceOnUse" width="6" height="6"
            patternTransform="rotate(45 0 0)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#d1d5db" strokeWidth="0.8"/>
          </pattern>
          <clipPath id="oval-clip">
            <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}/>
          </clipPath>
          <filter id="card-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.12)"/>
          </filter>
        </defs>

        {/* white background */}
        <rect x="0" y="0" width={W} height={H} fill="#f8f9fb"/>

        {/* oval: light grey fill */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="#f0f1f3" filter="url(#card-shadow)"/>

        {/* hatch fill inside oval */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="url(#fw-hatch)" opacity="0.7" clipPath="url(#oval-clip)"/>

        {/* oval border */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="none" stroke="#9ca3af" strokeWidth="0.7"/>

        {/* distance marker lines across oval */}
        {MARKER_YS.map((y, i) => {
          // chord half-width at this y
          const dy = y - OVL_CY;
          const chord = OVL_RX * Math.sqrt(Math.max(0, 1 - (dy * dy) / (OVL_RY * OVL_RY)));
          return (
            <g key={i}>
              <line x1={OVL_CX - chord} y1={y} x2={OVL_CX + chord} y2={y}
                stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2,2"/>
              {/* left label */}
              <text x={OVL_CX - chord - 1.5} y={y + 1.5} textAnchor="end"
                fontSize="4" fill="#6b7280" fontWeight="500">{MARKER_LABELS[i]}</text>
              {/* right label */}
              <text x={OVL_CX + chord + 1.5} y={y + 1.5} textAnchor="start"
                fontSize="4" fill="#6b7280" fontWeight="500">{MARKER_LABELS[i]}</text>
            </g>
          );
        })}

        {/* zone labels */}
        {[['L', OVL_CX - OVL_RX * 0.55], ['C', OVL_CX], ['R', OVL_CX + OVL_RX * 0.55]].map(([lbl, x]) => (
          <text key={lbl} x={x} y={OVL_CY + 2} textAnchor="middle" fontSize="5"
            fill="#9ca3af" fontWeight="600">{lbl}</text>
        ))}

        {/* subtle center line */}
        <line x1={OVL_CX} y1={OVL_CY - OVL_RY + 4} x2={OVL_CX} y2={OVL_CY + OVL_RY - 4}
          stroke="#d1d5db" strokeWidth="0.4" strokeDasharray="3,4"/>

        {/* connecting lines + distance labels between shots */}
        {sorted.length > 1 && sorted.map((shot, i) => {
          if (i === 0) return null;
          const prev = sorted[i - 1];
          const mx = (prev.x + shot.x) / 2;
          const my = (prev.y + shot.y) / 2;
          const dy = Math.abs(shot.y - prev.y);
          const yds = Math.round(dy / ((MARKER_YS[MARKER_YS.length-1] - MARKER_YS[0]) / YARD_SPAN));
          return (
            <g key={`conn-${shot.id}`}>
              <line x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                stroke="#6b7280" strokeWidth="0.7" strokeDasharray="2.5,2"/>
              <text x={mx + 2} y={my} fontSize="3.8" fill="#374151"
                fontWeight="600" paintOrder="stroke" stroke="white" strokeWidth="2.5">{yds}y</text>
            </g>
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

      {/* ── launcher ── */}
      {!readOnly && (
        <div className="flex flex-col items-center py-3 bg-gray-900 border-t border-gray-800">
          <div onPointerDown={handleLauncherDown}
            style={{ touchAction: 'none', cursor: 'grab' }}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200 active:scale-95 transition-transform">
            <GolfBallIcon size={30}/>
          </div>
          <span className="text-xs text-gray-500 mt-1.5 tracking-wide">DRAG TO PLACE</span>
        </div>
      )}

      {/* ── ghost ball ── */}
      {ghost && (
        <div style={{ position:'fixed', left: ghost.x, top: ghost.y,
          transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999 }}>
          <GolfBallIcon size={30}/>
        </div>
      )}

      {/* ── summary sheet ── */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowSummary(false)}>
          <div className="absolute inset-0 bg-black/40"/>
          <div className="relative w-full bg-white rounded-t-2xl p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Shot Summary</h3>
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
                      <span className="text-gray-500 text-sm font-medium">{getDistLabel([s])} yds</span>
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

const YARD_SPAN = MARKER_LABELS[0] - MARKER_LABELS[MARKER_LABELS.length - 1]; // 250
