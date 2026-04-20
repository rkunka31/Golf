import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

const SHAPES = ['Straight', 'Draw', 'Fade', 'Hook', 'Slice'];
const SHAPE_COLORS = {
  Straight: '#6b7280',
  Draw: '#2563eb',
  Fade: '#d97706',
  Hook: '#dc2626',
  Slice: '#7c3aed',
};

const W = 100;
const H = 170;

const OVL_CX = 50;
const OVL_CY = 85;
const OVL_RX = 20;
const OVL_RY = 52;

// Green circle at top, tee ball center at bottom (inside SVG)
const GREEN_CY = 14;
const GREEN_R  = 8;
const TEE_Y    = 150;   // ball center for tee drag source

// 3 clean yardage markers inside oval
const MARKER_YS    = [55, 85, 115];
const MARKER_LABELS = [100, 200, 300];
const YARD_SPAN    = 200;

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

function ShotPin({ shot, isDragging, readOnly, onPointerDown, onDelete }) {
  if (readOnly) {
    return (
      <g transform={`translate(${shot.x},${shot.y})`}>
        <circle r={1.8} fill="#111827" opacity={0.72} />
      </g>
    );
  }
  const stroke = isDragging ? '#2563eb' : '#374151';
  const fill   = isDragging ? '#dbeafe' : 'white';
  return (
    <g transform={`translate(${shot.x},${shot.y})`}>
      <ellipse cx={0.4} cy={0.4} rx={2.5} ry={1.3} fill="rgba(0,0,0,0.18)" />
      <path
        d="M 0 0 C -2.45 -2.1, -3.5 -4.2, -3.5 -6.3 C -3.5 -9.1, -1.75 -11.2, 0 -11.2 C 1.75 -11.2, 3.5 -9.1, 3.5 -6.3 C 3.5 -4.2, 2.45 -2.1, 0 0 Z"
        fill={fill} stroke={stroke} strokeWidth="1.0"
        onPointerDown={onPointerDown} style={{ cursor: 'grab' }}
      />
      <circle cx={0} cy={-6.3} r={2.1} fill={stroke} style={{ pointerEvents: 'none' }} />
      <text x={0} y={-5} textAnchor="middle" fontSize="2.5" fontWeight="700"
        fill="white" style={{ pointerEvents: 'none' }}>{shot.shotNumber}</text>
      {shot.shape && SHAPE_COLORS[shot.shape] && (
        <circle cx={0} cy={2.5} r={1.5} fill={SHAPE_COLORS[shot.shape]} style={{ pointerEvents: 'none' }} />
      )}
      <g transform="translate(3.8,-11.5)" onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
        <circle cx={0} cy={0} r={2.3} fill="#ef4444" stroke="white" strokeWidth="0.7" />
        <line x1={-1.1} y1={-1.1} x2={1.1} y2={1.1} stroke="white" strokeWidth="1.0" strokeLinecap="round"/>
        <line x1={1.1} y1={-1.1} x2={-1.1} y2={1.1} stroke="white" strokeWidth="1.0" strokeLinecap="round"/>
      </g>
    </g>
  );
}

export default function FairwayDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef  = useRef(null);
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
      {/* ── banner ── */}
      {!readOnly && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900">
          <div className="flex items-center gap-1.5">
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

      {/* ── shape selector ── */}
      {!readOnly && shots.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 overflow-x-auto">
          <span className="text-gray-400 text-xs flex-shrink-0">Shape:</span>
          {SHAPES.map(shape => (
            <button key={shape} onClick={() => setLastShotShape(shape)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-colors
                ${lastShot?.shape === shape ? 'text-white' : 'bg-gray-700 text-gray-400'}`}
              style={lastShot?.shape === shape ? { backgroundColor: SHAPE_COLORS[shape] } : {}}
            >{shape}</button>
          ))}
        </div>
      )}

      {/* ── SVG diagram — rough background fills all, oval centered ── */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block">
        <defs>
          <pattern id="fw-hatch" patternUnits="userSpaceOnUse" width="5" height="5"
            patternTransform="rotate(45 0 0)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#c8cbc8" strokeWidth="0.7"/>
          </pattern>
          <clipPath id="oval-clip">
            <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}/>
          </clipPath>
        </defs>

        {/* rough fills everything */}
        <rect x="0" y="0" width={W} height={H} fill="#3a5228"/>

        {/* ── GREEN at top ── */}
        <circle cx={OVL_CX} cy={GREEN_CY} r={GREEN_R} fill="#1e7a1e" stroke="#4ade80" strokeWidth="0.7"/>
        <line x1={OVL_CX} y1={GREEN_CY - 2} x2={OVL_CX} y2={GREEN_CY - 11}
          stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
        <polygon
          points={`${OVL_CX},${GREEN_CY-11} ${OVL_CX+4.5},${GREEN_CY-8.5} ${OVL_CX},${GREEN_CY-6}`}
          fill="#ef4444"/>

        {/* ── fairway oval ── */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY} fill="#e8ebe8"/>
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="url(#fw-hatch)" opacity="0.5" clipPath="url(#oval-clip)"/>
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>

        {/* distance markers — hidden in readOnly (Analysis) */}
        {!readOnly && MARKER_YS.map((y, i) => {
          const dy = y - OVL_CY;
          const chord = OVL_RX * Math.sqrt(Math.max(0, 1 - dy * dy / (OVL_RY * OVL_RY)));
          return (
            <g key={i}>
              <line x1={OVL_CX - chord} y1={y} x2={OVL_CX + chord} y2={y}
                stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeDasharray="2,2"/>
              <text x={OVL_CX - chord - 1.5} y={y + 1.5} textAnchor="end"
                fontSize="3.5" fill="#4b5563" fontWeight="500">{MARKER_LABELS[i]}</text>
              <text x={OVL_CX + chord + 1.5} y={y + 1.5} textAnchor="start"
                fontSize="3.5" fill="#4b5563" fontWeight="500">{MARKER_LABELS[i]}</text>
            </g>
          );
        })}

        {/* subtle center line — hidden in readOnly */}
        {!readOnly && (
          <line x1={OVL_CX} y1={OVL_CY - OVL_RY + 3} x2={OVL_CX} y2={OVL_CY + OVL_RY - 3}
            stroke="rgba(0,0,0,0.12)" strokeWidth="0.4" strokeDasharray="3,4"/>
        )}

        {/* dotted tee line to first shot — only in active mode */}
        {!readOnly && sorted.length > 0 && (
          <line x1={OVL_CX} y1={TEE_Y} x2={sorted[0].x} y2={sorted[0].y}
            stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" strokeDasharray="2.5,2"/>
        )}

        {/* connecting lines between shots */}
        {sorted.length > 1 && sorted.map((shot, i) => {
          if (i === 0) return null;
          const prev = sorted[i - 1];
          const mx = (prev.x + shot.x) / 2;
          const my = (prev.y + shot.y) / 2;
          const dy = Math.abs(shot.y - prev.y);
          const yds = Math.round(dy / ((MARKER_YS[MARKER_YS.length - 1] - MARKER_YS[0]) / YARD_SPAN));
          return (
            <g key={`conn-${shot.id}`}>
              <line x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" strokeDasharray="2.5,2"/>
              {!readOnly && (
                <text x={mx + 2} y={my} fontSize="3.5" fill="white" fontWeight="600"
                  paintOrder="stroke" stroke="rgba(0,0,0,0.4)" strokeWidth="2">{yds}y</text>
              )}
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

        {/* ── TEE area — drag source inside SVG ── */}
        {!readOnly && (
          <g>
            {/* tee peg */}
            <rect x={OVL_CX - 1.5} y={TEE_Y + 4} width={3} height={7} rx="0.8" fill="#c8a96e"/>
            <ellipse cx={OVL_CX} cy={TEE_Y + 4} rx={3.5} ry={1.5} fill="#c8a96e"/>
            {/* tee ground */}
            <rect x={OVL_CX - 9} y={TEE_Y + 10} width={18} height={5} rx="1.5"
              fill="#4a6f35" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4"/>
            {/* golf ball — drag source */}
            <circle cx={OVL_CX} cy={TEE_Y - 1} r={5}
              fill="white" stroke="#d1d5db" strokeWidth="0.5"
              onPointerDown={handleLauncherDown}
              style={{ touchAction: 'none', cursor: 'grab' }}/>
            {/* dimples */}
            {[[-2,-3],[2,-3],[-3.5,0],[0,0],[3.5,0],[-2,3],[2,3]].map(([dx, dy], i) => (
              <circle key={i} cx={OVL_CX + dx} cy={TEE_Y - 1 + dy} r={0.9}
                fill="rgba(0,0,0,0.08)" style={{ pointerEvents: 'none' }}/>
            ))}
            <text x={OVL_CX} y={TEE_Y + 22} textAnchor="middle"
              fontSize="3" fill="rgba(255,255,255,0.45)">DRAG TO PLACE</text>
          </g>
        )}

        {/* readOnly: show small tee box without drag affordance */}
        {readOnly && (
          <rect x={OVL_CX - 7} y={TEE_Y + 6} width={14} height={4} rx="1.5"
            fill="#4a6f35" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
        )}
      </svg>

      {/* ghost ball while dragging */}
      {ghost && (
        <div style={{ position:'fixed', left: ghost.x, top: ghost.y,
          transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:9999 }}>
          <GolfBallIcon size={34}/>
        </div>
      )}

      {/* summary sheet */}
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
