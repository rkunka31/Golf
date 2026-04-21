import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

const W  = 100;
const H  = 100;
const CX = 50;
const CY = 50;
const MAX_R = 42;

const RINGS = [{ r: 42, ft: 30 }, { r: 28, ft: 20 }, { r: 14, ft: 10 }];

// Use getBoundingClientRect — reliable after page scroll (getScreenCTM is not)
function getSvgCoords(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const vb   = svg.viewBox.baseVal;
  return {
    x: (clientX - rect.left) * (vb.width  / rect.width),
    y: (clientY - rect.top)  * (vb.height / rect.height),
  };
}

function getDistFt(shots) {
  if (!shots || shots.length === 0) return '—';
  const last = [...shots].sort((a, b) => b.shotNumber - a.shotNumber)[0];
  const dx = last.x - CX, dy = last.y - CY;
  return String(Math.round((Math.sqrt(dx * dx + dy * dy) / MAX_R) * 30));
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
        const dx = pt.x - CX, dy = pt.y - CY;
        if (Math.sqrt(dx * dx + dy * dy) <= MAX_R + 4) {
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
            <span className="text-white font-bold text-sm tabular-nums">{getDistFt(shots)}</span>
            <span className="text-gray-400 text-xs">FT</span>
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

      {/* SVG — max-width keeps it from being too large */}
      <div className="flex justify-center bg-[#d4d4d0]">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 300, display: 'block' }}>
        {/* outer background */}
        <rect x="0" y="0" width={W} height={H} fill="#d4d4d0"/>

        {/* rings from outside to inside */}
        <circle cx={CX} cy={CY} r={42} fill="#e4e4e0"/>
        <circle cx={CX} cy={CY} r={28} fill="#eeeeeb"/>
        <circle cx={CX} cy={CY} r={14} fill="#f5f5f2"/>

        {/* ring borders */}
        <circle cx={CX} cy={CY} r={42} fill="none" stroke="#2a2a2a" strokeWidth="0.6"/>
        <circle cx={CX} cy={CY} r={28} fill="none" stroke="#7a7a76" strokeWidth="0.4"/>
        <circle cx={CX} cy={CY} r={14} fill="none" stroke="#7a7a76" strokeWidth="0.4"/>

        {/* distance labels */}
        {RINGS.map(({ r, ft }) => (
          <text key={ft} x={CX + r - 1} y={CY + 1.5}
            textAnchor="end" fontSize="3" fill="#555550" fontWeight="500">
            {ft}ft
          </text>
        ))}

        {/* center cup */}
        <circle cx={CX} cy={CY} r={2} fill="#2a2a2a"/>

        {/* flagstick + flag */}
        <line x1={CX} y1={CY - 1.5} x2={CX} y2={CY - 12}
          stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round"/>
        <polygon points={`${CX},${CY-12} ${CX+5.5},${CY-9} ${CX},${CY-6}`} fill="#ef4444"/>

        {/* connecting lines (active mode only) */}
        {!readOnly && sorted.length > 1 && sorted.map((shot, i) => {
          if (i === 0) return null;
          const prev = sorted[i - 1];
          const mx = (prev.x + shot.x) / 2, my = (prev.y + shot.y) / 2;
          const dx = shot.x - prev.x, dy = shot.y - prev.y;
          const ft = Math.round((Math.sqrt(dx * dx + dy * dy) / MAX_R) * 30);
          return (
            <g key={`c-${shot.id}`}>
              <line x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                stroke="#111827" strokeWidth="0.5" strokeDasharray="2,2"/>
              <text x={mx + 1.5} y={my} fontSize="3" fill="#374151" fontWeight="600">{ft}ft</text>
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
      </div>

      {/* launcher */}
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
              <h3 className="font-bold text-gray-900 text-base">Green Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-gray-400 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {sorted.length === 0
              ? <p className="text-gray-400 text-sm text-center py-4">No shots placed yet.</p>
              : <div className="space-y-2">
                  {sorted.map(s => {
                    const dx = s.x - CX, dy = s.y - CY;
                    const ft = Math.round((Math.sqrt(dx * dx + dy * dy) / MAX_R) * 30);
                    return (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{s.shotNumber}</span>
                          </div>
                          <span className="text-gray-700 text-sm">Shot {s.shotNumber}</span>
                        </div>
                        <span className="text-gray-500 text-sm font-medium">{ft} ft from pin</span>
                      </div>
                    );
                  })}
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
