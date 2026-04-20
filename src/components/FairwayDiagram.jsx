import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

// SVG viewBox dimensions
const W = 100;
const H = 210;

// Distance marker y positions and labels
const MARKER_YS = [10, 48, 86, 124, 162, 200];
const MARKER_LABELS = [300, 250, 200, 150, 100, 50];

// Yard span and Y span for distance calculation
const FW_TOP = 10;
const FW_BOTTOM = 200;
const Y_SPAN = FW_BOTTOM - FW_TOP; // 190
const YARD_SPAN = 250;

// Organic fairway bezier path
const fairwayPath = `
  M 50 204
  C 34 195, 26 172, 27 148
  C 28 124, 29 100, 28 76
  C 27 52, 35 26, 50 10
  C 65 26, 73 52, 72 76
  C 71 100, 72 124, 73 148
  C 74 172, 66 195, 50 204
  Z
`;

function getSvgCoords(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 50, y: 105 };
  return pt.matrixTransform(ctm.inverse());
}

function getDistanceLabel(shots) {
  if (!shots || shots.length === 0) return '—';
  const lastShot = [...shots].sort((a, b) => a.shotNumber - b.shotNumber).slice(-1)[0];
  const y = lastShot.y;
  // Interpolate between marker positions
  for (let i = 0; i < MARKER_YS.length - 1; i++) {
    const y0 = MARKER_YS[i];
    const y1 = MARKER_YS[i + 1];
    if (y >= y0 && y <= y1) {
      const t = (y - y0) / (y1 - y0);
      const yds = Math.round(MARKER_LABELS[i] + t * (MARKER_LABELS[i + 1] - MARKER_LABELS[i]));
      return String(yds);
    }
  }
  if (y < MARKER_YS[0]) return String(MARKER_LABELS[0]);
  return String(MARKER_LABELS[MARKER_LABELS.length - 1]);
}

function GolfBallIcon({ size = 32 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#d1d5db" strokeWidth="1" />
      {[
        [cx - 5, cy - 5], [cx + 5, cy - 5],
        [cx - 8, cy], [cx, cy], [cx + 8, cy],
        [cx - 5, cy + 5], [cx + 5, cy + 5],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={1.5} fill="rgba(0,0,0,0.1)" />
      ))}
    </svg>
  );
}

function ShotPin({ shot, shotNumber, isDragging, readOnly, onPointerDown, onDelete }) {
  const color = isDragging ? '#7c3aed' : '#1d4ed8';
  return (
    <g transform={`translate(${shot.x}, ${shot.y})`}>
      {/* Shadow */}
      <ellipse cx={1} cy={1} rx={6} ry={2.5} fill="rgba(0,0,0,0.25)" />
      {/* Pin teardrop body */}
      <path
        d="M 0 0 C -5 -4, -7 -8, -7 -12 C -7 -17, -3.5 -21, 0 -21 C 3.5 -21, 7 -17, 7 -12 C 7 -8, 5 -4, 0 0 Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
        onPointerDown={readOnly ? undefined : onPointerDown}
        style={{ cursor: readOnly ? 'default' : 'grab' }}
      />
      {/* Inner white circle */}
      <circle cx={0} cy={-12} r={4.5} fill="white" style={{ pointerEvents: 'none' }} />
      {/* Shot number */}
      <text x={0} y={-9.5} textAnchor="middle" fontSize="4.5" fontWeight="800"
        fill={color} style={{ pointerEvents: 'none' }}>{shotNumber}</text>
      {/* Delete button */}
      {!readOnly && (
        <g transform="translate(8, -20)" onClick={onDelete} style={{ cursor: 'pointer' }}
          onPointerDown={(e) => e.stopPropagation()}>
          <circle cx={0} cy={0} r={4} fill="#ef4444" stroke="white" strokeWidth="0.8" />
          <line x1={-2} y1={-2} x2={2} y2={2} stroke="white" strokeWidth="1.3" strokeLinecap="round" />
          <line x1={2} y1={-2} x2={-2} y2={2} stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

export default function FairwayDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // Keep live ref so drag callbacks always have current shots
  const shotsRef = useRef(shots);
  useEffect(() => { shotsRef.current = shots; }, [shots]);

  // ---- Drag existing marker ----
  const handleMarkerPointerDown = useCallback((e, shotId) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging(shotId);

    const onMove = (me) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = getSvgCoords(svg, me.clientX, me.clientY);
      onShotsChange(
        shotsRef.current.map((s) => s.id === shotId ? { ...s, x: pt.x, y: pt.y } : s)
      );
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [readOnly, onShotsChange]);

  const handleDelete = useCallback((e, shotId) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    onShotsChange(shotsRef.current.filter((s) => s.id !== shotId));
  }, [readOnly, onShotsChange]);

  // ---- Undo: remove last shot ----
  const handleUndo = useCallback(() => {
    const current = shotsRef.current;
    if (current.length === 0) return;
    const maxNum = Math.max(...current.map((s) => s.shotNumber));
    onShotsChange(current.filter((s) => s.shotNumber !== maxNum));
  }, [onShotsChange]);

  // ---- Launcher drag-to-place ----
  const handleLauncherDown = useCallback((e) => {
    e.preventDefault();
    setGhost({ x: e.clientX, y: e.clientY });

    const onMove = (me) => {
      setGhost({ x: me.clientX, y: me.clientY });
    };

    const onUp = (me) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const svg = svgRef.current;
      if (svg) {
        const pt = getSvgCoords(svg, me.clientX, me.clientY);
        // Place shot only if within fairway Y bounds
        if (pt.y >= FW_TOP && pt.y <= FW_BOTTOM) {
          const current = shotsRef.current;
          const newShot = {
            id: generateId(),
            x: pt.x,
            y: pt.y,
            shotNumber: current.length + 1,
          };
          onShotsChange([...current, newShot]);
        }
      }
      setGhost(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [onShotsChange]);

  // Sort shots by shotNumber for connecting lines
  const sortedShots = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);

  const distanceLabel = getDistanceLabel(shots);

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Dark banner above SVG */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900">
          {/* Distance */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.077 3.678-5.032 3.678-8.327 0-4.97-4.026-9-9-9s-9 4.03-9 9c0 3.295 1.734 6.25 3.678 8.327a19.576 19.576 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-white font-bold text-sm">{distanceLabel}</span>
            <span className="text-gray-400 text-xs">YDS</span>
          </div>
          <div className="w-px h-4 bg-gray-600" />
          {/* Shot count */}
          <span className="text-white text-sm font-semibold">{shots.length} SHOTS</span>
          <div className="flex-1" />
          {/* Undo */}
          <button onClick={handleUndo} className="p-2 text-gray-300 active:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          {/* Summary */}
          <button onClick={() => setShowSummary(true)} className="p-2 text-gray-300 active:text-white">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 420, display: 'block', touchAction: 'none' }}
      >
        <defs>
          {/* Fairway gradient */}
          <linearGradient id="fw-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#72c44a" />
            <stop offset="100%" stopColor="#5aaa30" />
          </linearGradient>

          {/* Fairway stripe pattern */}
          <pattern id="fw-stripes" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="8" height="4" fill="#6ab840" />
            <rect x="0" y="4" width="8" height="4" fill="#5aaa30" />
          </pattern>
        </defs>

        {/* Rough background */}
        <rect x="0" y="0" width={W} height={H} fill="#3d6b2a" />

        {/* Rough diagonal texture */}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`tex-${i}`}
            x1={-20 + i * 12} y1={0}
            x2={-20 + i * 12 + H} y2={H}
            stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
        ))}

        {/* Fringe/collar (slightly larger fairway shape) */}
        <path
          d="M 50 207 C 31 197, 22 172, 23 148 C 24 124, 25 100, 24 76 C 23 52, 32 23, 50 7 C 68 23, 77 52, 76 76 C 75 100, 76 124, 77 148 C 78 172, 69 197, 50 207 Z"
          fill="#4a7832"
        />

        {/* Fairway shape with stripe pattern */}
        <path d={fairwayPath} fill="url(#fw-stripes)" />
        <path d={fairwayPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Generic bunker shapes */}
        {/* Left bunker */}
        <path
          d="M 22 100 C 18 96, 14 98, 14 102 C 14 107, 18 110, 22 109 C 26 108, 27 104, 22 100 Z"
          fill="#d4b483"
        />
        {/* Right bunker */}
        <path
          d="M 78 100 C 82 96, 86 98, 86 102 C 86 107, 82 110, 78 109 C 74 108, 73 104, 78 100 Z"
          fill="#d4b483"
        />

        {/* Distance marker lines + labels */}
        {MARKER_YS.map((y, i) => (
          <g key={MARKER_LABELS[i]}>
            <line
              x1={27} y1={y} x2={73} y2={y}
              stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2,2"
            />
            <circle cx={50} cy={y} r={1.5} fill="white" />
            <text x={22} y={y + 1.5} textAnchor="middle" fontSize="4.5"
              fill="white" opacity="0.9">
              {MARKER_LABELS[i]}
            </text>
            <text x={78} y={y + 1.5} textAnchor="middle" fontSize="4.5"
              fill="white" opacity="0.9">
              {MARKER_LABELS[i]}
            </text>
          </g>
        ))}

        {/* Zone labels: L C R */}
        <text x={31} y={107} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.35)" fontWeight="600">L</text>
        <text x={50} y={107} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.35)" fontWeight="600">C</text>
        <text x={69} y={107} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.35)" fontWeight="600">R</text>

        {/* Connecting lines between shots */}
        {sortedShots.length > 1 && sortedShots.map((shot, idx) => {
          if (idx === 0) return null;
          const prev = sortedShots[idx - 1];
          const midX = (prev.x + shot.x) / 2;
          const midY = (prev.y + shot.y) / 2;
          const dy = Math.abs(shot.y - prev.y);
          const distYards = Math.round(dy / (Y_SPAN / YARD_SPAN));
          return (
            <g key={`line-${shot.id}`}>
              <line
                x1={prev.x} y1={prev.y} x2={shot.x} y2={shot.y}
                stroke="rgba(255,255,255,0.7)" strokeWidth="0.8"
                strokeDasharray="2,2"
              />
              <text
                x={midX} y={midY - 1.5}
                textAnchor="middle" fontSize="4.5"
                fill="white"
                stroke="black" strokeWidth="0.3" paintOrder="stroke"
              >
                {distYards}y
              </text>
            </g>
          );
        })}

        {/* Shot markers */}
        {shots.map((shot) => (
          <ShotPin
            key={shot.id}
            shot={shot}
            shotNumber={shot.shotNumber}
            isDragging={dragging === shot.id}
            readOnly={readOnly}
            onPointerDown={(e) => handleMarkerPointerDown(e, shot.id)}
            onDelete={(e) => handleDelete(e, shot.id)}
          />
        ))}
      </svg>

      {/* Launcher pad */}
      {!readOnly && (
        <div className="flex flex-col items-center py-2 bg-gray-900 border-t border-gray-700">
          <div
            onPointerDown={handleLauncherDown}
            style={{ touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200"
          >
            <GolfBallIcon size={36} />
          </div>
          <span className="text-xs text-gray-400 mt-1">drag to place shot</span>
        </div>
      )}

      {/* Ghost ball following pointer */}
      {ghost && (
        <div
          style={{
            position: 'fixed',
            left: ghost.x,
            top: ghost.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <GolfBallIcon size={32} />
        </div>
      )}

      {/* Summary modal */}
      {showSummary && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
          onClick={() => setShowSummary(false)}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          {/* Sheet */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '16px 16px 0 0',
              padding: '20px 16px 32px',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>Shot Summary</span>
              <button
                onClick={() => setShowSummary(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            {sortedShots.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>No shots placed yet.</p>
            ) : (
              sortedShots.map((shot) => {
                // Calculate approx yardage from tee
                let yds = '—';
                const y = shot.y;
                for (let i = 0; i < MARKER_YS.length - 1; i++) {
                  const y0 = MARKER_YS[i];
                  const y1 = MARKER_YS[i + 1];
                  if (y >= y0 && y <= y1) {
                    const t = (y - y0) / (y1 - y0);
                    yds = Math.round(MARKER_LABELS[i] + t * (MARKER_LABELS[i + 1] - MARKER_LABELS[i]));
                    break;
                  }
                }
                return (
                  <div key={shot.id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', color: '#374151', fontSize: 15 }}>
                    Shot {shot.shotNumber} — ~{yds} yds from tee
                  </div>
                );
              })
            )}
            <button
              onClick={() => { onShotsChange([]); setShowSummary(false); }}
              style={{
                marginTop: 20,
                width: '100%',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Clear All Shots
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
