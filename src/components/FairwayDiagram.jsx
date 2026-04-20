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
const OVL_CY = 88;
const OVL_RX = 17;
const OVL_RY = 52;

const GREEN_CY = 16;
const GREEN_R  = 9;
const TEE_Y    = 152;

// 5 colored distance arcs, y = where arc crosses vertical center from tee
const ARCS = [
  { y: 50,  label: '300', color: 'rgba(200,200,200,0.75)', lw: 0.7 },
  { y: 69,  label: '250', color: '#fde047',                lw: 0.8 },
  { y: 89,  label: '200', color: '#22d3ee',                lw: 0.8 },
  { y: 108, label: '150', color: 'rgba(255,255,255,0.85)', lw: 0.7 },
  { y: 127, label: '100', color: '#ef4444',                lw: 0.8 },
];

// For distance estimation from last shot y position
const MARKER_YS    = [50, 69, 89, 108, 127];
const MARKER_LABELS = [300, 250, 200, 150, 100];

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
        const inOval = (dx * dx) / (OVL_RX * OVL_RX) + (dy * dy) / (OVL_RY * OVL_RY) <= 1.3;
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
      {/* banner */}
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

      {/* shape selector */}
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

      {/* SVG diagram */}
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block">
        <defs>
          {/* mowing stripes — horizontal alternating bands */}
          <pattern id="mow-stripes" width={W} height="5" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width={W} height="2.5" fill="#4d8b3a"/>
            <rect x="0" y="2.5" width={W} height="2.5" fill="#3f7430"/>
          </pattern>
          <clipPath id="oval-clip">
            <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}/>
          </clipPath>
          <clipPath id="green-clip">
            <circle cx={OVL_CX} cy={GREEN_CY} r={GREEN_R}/>
          </clipPath>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.4)"/>
          </filter>
        </defs>

        {/* deep rough — darkest layer */}
        <rect x="0" y="0" width={W} height={H} fill="#152010"/>

        {/* inner rough — slightly lighter ring around fairway */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX + 14} ry={OVL_RY + 14} fill="#1e3518"/>

        {/* fairway oval with mowing stripes */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="url(#mow-stripes)" clipPath="url(#oval-clip)"/>
        {/* subtle fairway edge */}
        <ellipse cx={OVL_CX} cy={OVL_CY} rx={OVL_RX} ry={OVL_RY}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>

        {/* green at top with mowing stripes + bright ring */}
        <circle cx={OVL_CX} cy={GREEN_CY} r={GREEN_R}
          fill="url(#mow-stripes)" clipPath="url(#green-clip)"/>
        <circle cx={OVL_CX} cy={GREEN_CY} r={GREEN_R}
          fill="none" stroke="#4ade80" strokeWidth="0.8"/>
        {/* flagstick + flag */}
        <line x1={OVL_CX} y1={GREEN_CY - 1.5} x2={OVL_CX} y2={GREEN_CY - 12}
          stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
        <polygon
          points={`${OVL_CX},${GREEN_CY-12} ${OVL_CX+5},${GREEN_CY-9} ${OVL_CX},${GREEN_CY-6}`}
          fill="#ef4444"/>

        {/* red dashed center line from green to tee */}
        <line x1={OVL_CX} y1={GREEN_CY + GREEN_R} x2={OVL_CX} y2={TEE_Y}
          stroke="rgba(239,68,68,0.5)" strokeWidth="0.6" strokeDasharray="3,3"/>

        {/* distance arcs — hidden in readOnly */}
        {!readOnly && ARCS.map((arc) => {
          const R = TEE_Y - arc.y;
          const x1 = OVL_CX - R;
          const x2 = OVL_CX + R;
          // clamp arc endpoints to SVG bounds for label placement
          const clipped = x1 < 1 || x2 > W - 1;
          const cx1 = Math.max(1, x1);
          const cx2 = Math.min(W - 1, x2);
          return (
            <g key={arc.label}>
              <path
                d={`M ${cx1},${TEE_Y} A ${R},${R} 0 0,1 ${cx2},${TEE_Y}`}
                fill="none" stroke={arc.color} strokeWidth={arc.lw}
                strokeDasharray={arc.label === '300' ? '2,2' : undefined}
              />
              {/* labels on left and right of arc */}
              {clipped ? (
                <>
                  <text x="3.5" y={arc.y + 1.5} textAnchor="start"
                    fontSize="3.5" fontWeight="700" fill="white"
                    paintOrder="stroke" stroke="#000" strokeWidth="2">{arc.label}</text>
                  <text x={W - 3.5} y={arc.y + 1.5} textAnchor="end"
                    fontSize="3.5" fontWeight="700" fill="white"
                    paintOrder="stroke" stroke="#000" strokeWidth="2">{arc.label}</text>
                </>
              ) : (
                <>
                  <text x={cx1 - 1.5} y={TEE_Y + 1} textAnchor="end"
                    fontSize="3.5" fontWeight="700" fill="white"
                    paintOrder="stroke" stroke="#000" strokeWidth="2">{arc.label}</text>
                  <text x={cx2 + 1.5} y={TEE_Y + 1} textAnchor="start"
                    fontSize="3.5" fontWeight="700" fill="white"
                    paintOrder="stroke" stroke="#000" strokeWidth="2">{arc.label}</text>
                </>
              )}
            </g>
          );
        })}

        {/* dotted tee line to first shot */}
        {!readOnly && sorted.length > 0 && (
          <line x1={OVL_CX} y1={TEE_Y} x2={sorted[0].x} y2={sorted[0].y}
            stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" strokeDasharray="2.5,2"/>
        )}

        {/* connecting lines between shots */}
        {sorted.length > 1 && sorted.map((shot, i) => {
          if (i === 0) return null;
          const prev = sorted[i - 1];
          const mx = (prev.x + shot.x) / 2;
          const my = (prev.y + shot.y) / 2;
          const dyPx = Math.abs(shot.y - prev.y);
          const pxPerYd = (MARKER_YS[MARKER_YS.length - 1] - MARKER_YS[0]) / Math.abs(MARKER_LABELS[MARKER_LABELS.length - 1] - MARKER_LABELS[0]);
          const yds = Math.round(dyPx / pxPerYd);
          return (
            <g key={`conn-${shot.id}`}>
              <line x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" strokeDasharray="2.5,2"/>
              {!readOnly && (
                <text x={mx + 2} y={my} fontSize="3.5" fill="white" fontWeight="700"
                  paintOrder="stroke" stroke="#000" strokeWidth="2">{yds}y</text>
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

        {/* tee marker circle */}
        <circle cx={OVL_CX} cy={TEE_Y} r={3} fill="#c8a96e" stroke="white" strokeWidth="0.6"/>
        <circle cx={OVL_CX} cy={TEE_Y} r={1.2} fill="white" opacity={0.6}/>
      </svg>

      {/* external launcher — HTML div for reliable iOS touch */}
      {!readOnly && (
        <div
          onPointerDown={handleLauncherDown}
          style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
          className="bg-[#152010] flex items-center justify-center gap-3 py-3 border-t border-[#0a1008] active:opacity-70 transition-opacity"
        >
          <GolfBallIcon size={28}/>
          <span className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(134,239,172,0.6)' }}>Drag to place shot</span>
        </div>
      )}

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
