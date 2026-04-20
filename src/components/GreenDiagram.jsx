import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

const W  = 100;
const H  = 100;
const CX = 50;
const CY = 50;
const MAX_R = 42; // SVG units = 30ft boundary

// ring radii → feet
const RINGS = [{ r: 42, ft: 30 }, { r: 28, ft: 20 }, { r: 14, ft: 10 }];

function getSvgCoords(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: CX, y: CY };
  return pt.matrixTransform(ctm.inverse());
}

function getDistFt(shots) {
  if (!shots || shots.length === 0) return '—';
  const last = [...shots].sort((a, b) => b.shotNumber - a.shotNumber)[0];
  const dx = last.x - CX, dy = last.y - CY;
  return String(Math.round((Math.sqrt(dx*dx + dy*dy) / MAX_R) * 30));
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
        <circle r={1.8} fill="#111827" opacity={0.72} />
      </g>
    );
  }
  const stroke = isDragging ? '#2563eb' : '#374151';
  const fill   = isDragging ? '#dbeafe' : 'white';
  return (
    <g transform={`translate(${shot.x},${shot.y})`}>
      <ellipse cx={0.4} cy={0.4} rx={2.5} ry={1.3} fill="rgba(0,0,0,0.15)"/>
      <path
        d="M 0 0 C -2.45 -2.1, -3.5 -4.2, -3.5 -6.3 C -3.5 -9.1, -1.75 -11.2, 0 -11.2 C 1.75 -11.2, 3.5 -9.1, 3.5 -6.3 C 3.5 -4.2, 2.45 -2.1, 0 0 Z"
        fill={fill} stroke={stroke} strokeWidth="1.0"
        onPointerDown={onPointerDown}
        style={{ cursor: 'grab' }}
      />
      <circle cx={0} cy={-6.3} r={2.1} fill={stroke} style={{ pointerEvents: 'none' }}/>
      <text x={0} y={-5} textAnchor="middle" fontSize="2.5" fontWeight="700"
        fill="white" style={{ pointerEvents: 'none' }}>{shot.shotNumber}</text>
      <g transform="translate(3.8,-11.5)" onClick={onDelete}
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
        if (Math.sqrt(dx*dx + dy*dy) <= MAX_R + 4) {
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

      {/* ── SVG ── */}
      <div className="flex justify-center py-4 bg-[#f8f9fb]">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
          style={{ width: '84vw', maxWidth: 340, display: 'block' }}>
          <defs>
            <filter id="green-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.1)"/>
            </filter>
          </defs>

          {/* background */}
          <rect x="0" y="0" width={W} height={H} fill="#f8f9fb"/>

          {/* outer rough / fringe */}
          <circle cx={CX} cy={CY} r={MAX_R + 5} fill="#3a5228" filter="url(#green-shadow)"/>

          {/* rings: outer→inner, alternating white/very-light-grey */}
          {RINGS.map(({ r }, i) => (
            <circle key={r} cx={CX} cy={CY} r={r}
              fill={i % 2 === 0 ? '#f8f9fb' : '#f0f1f3'}
              stroke="#c4c4cc" strokeWidth="0.6"/>
          ))}

          {/* ring distance labels — right side, inside each ring */}
          {RINGS.map(({ r, ft }) => (
            <text key={ft} x={CX + r - 3} y={CY + 1.5}
              textAnchor="end" fontSize="3.5" fill="#9ca3af" fontWeight="500">
              {ft}ft
            </text>
          ))}

          {/* subtle crosshair */}
          <line x1={CX} y1={CY - MAX_R + 2} x2={CX} y2={CY + MAX_R - 2}
            stroke="#d1d5db" strokeWidth="0.4" strokeDasharray="2,3"/>
          <line x1={CX - MAX_R + 2} y1={CY} x2={CX + MAX_R - 2} y2={CY}
            stroke="#d1d5db" strokeWidth="0.4" strokeDasharray="2,3"/>

          {/* center cup */}
          <circle cx={CX} cy={CY} r={2.5} fill="#374151" stroke="#6b7280" strokeWidth="0.5"/>

          {/* flagstick */}
          <line x1={CX} y1={CY - 2} x2={CX} y2={CY - 18}
            stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
          {/* flag */}
          <polygon points={`${CX},${CY-18} ${CX+8},${CY-13.5} ${CX},${CY-9}`} fill="#ef4444"/>

          {/* connecting lines */}
          {sorted.length > 1 && sorted.map((shot, i) => {
            if (i === 0) return null;
            const prev = sorted[i-1];
            const mx = (prev.x + shot.x) / 2, my = (prev.y + shot.y) / 2;
            const dx = shot.x - prev.x, dy = shot.y - prev.y;
            const ft = Math.round((Math.sqrt(dx*dx + dy*dy) / MAX_R) * 30);
            return (
              <g key={`c-${shot.id}`}>
                <line x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                  stroke="#6b7280" strokeWidth="0.7" strokeDasharray="2,2"/>
                <text x={mx + 1.5} y={my} fontSize="3.5" fill="#374151" fontWeight="600"
                  paintOrder="stroke" stroke="white" strokeWidth="2">{ft}ft</text>
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

      {/* ── ghost ── */}
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
                    const ft = Math.round((Math.sqrt(dx*dx+dy*dy) / MAX_R) * 30);
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
