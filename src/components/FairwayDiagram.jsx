import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

// SVG viewBox dimensions
const W = 100;
const H = 210;

// Fairway pill: x=27 to x=73, y=8 to y=202
const FW_LEFT = 27;
const FW_RIGHT = 73;
const FW_TOP = 8;
const FW_BOTTOM = 202;
const FW_W = FW_RIGHT - FW_LEFT; // 46
const FW_RX = FW_W / 2; // 23 — corner radius for pill

// Distance marker y positions and labels
const MARKER_YS = [10, 48, 86, 124, 162, 200];
const MARKER_LABELS = [300, 250, 200, 150, 100, 50];

// Yard span and Y span for distance calculation
const Y_SPAN = FW_BOTTOM - FW_TOP; // 194
const YARD_SPAN = 250;

function getSvgCoords(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 50, y: 105 };
  return pt.matrixTransform(ctm.inverse());
}

function GolfBallIcon({ size = 32 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#d1d5db" strokeWidth="1" />
      {/* Dimples */}
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

function fairwayPillPath() {
  const rx = FW_RX;
  const x = FW_LEFT;
  const y = FW_TOP;
  const w = FW_W;
  const h = FW_BOTTOM - FW_TOP;
  return [
    `M ${x + rx} ${y}`,
    `L ${x + w - rx} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rx}`,
    `L ${x + w} ${y + h - rx}`,
    `Q ${x + w} ${y + h} ${x + w - rx} ${y + h}`,
    `L ${x + rx} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - rx}`,
    `L ${x} ${y + rx}`,
    `Q ${x} ${y} ${x + rx} ${y}`,
    `Z`,
  ].join(' ');
}

export default function FairwayDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [ghost, setGhost] = useState(null); // { x, y } in client coords

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

  const pillPath = fairwayPillPath();

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 420, display: 'block', touchAction: 'none' }}
      >
        <defs>
          {/* Fairway stripe pattern */}
          <pattern id="fw-stripes" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="8" height="4" fill="#3aaa5c" />
            <rect x="0" y="4" width="8" height="4" fill="#2d8a4e" />
          </pattern>

          {/* Drop shadow filter for fairway */}
          <filter id="fw-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>

        {/* Rough background */}
        <rect x="0" y="0" width={W} height={H} fill="#1a5c2e" data-bg="true" />

        {/* Rough texture stripes */}
        {Array.from({ length: 21 }).map((_, i) => (
          <rect key={i} data-bg="true" x={0} y={i * 10} width={W} height={10}
            fill={i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent'} />
        ))}

        {/* Fairway pill with stripe fill and shadow */}
        <path d={pillPath} fill="url(#fw-stripes)" filter="url(#fw-shadow)" data-bg="true" />
        <path d={pillPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" data-bg="true" />

        {/* Distance marker lines + labels */}
        {MARKER_YS.map((y, i) => (
          <g key={MARKER_LABELS[i]}>
            <line
              x1={FW_LEFT} y1={y} x2={FW_RIGHT} y2={y}
              stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" strokeDasharray="2,2"
              data-bg="true"
            />
            <text x={FW_LEFT - 2} y={y + 1.5} textAnchor="end" fontSize="4.5"
              fill="#a7f3d0" data-bg="true">
              {MARKER_LABELS[i]}
            </text>
            <text x={FW_RIGHT + 2} y={y + 1.5} textAnchor="start" fontSize="4.5"
              fill="#a7f3d0" data-bg="true">
              {MARKER_LABELS[i]}
            </text>
          </g>
        ))}

        {/* Zone labels */}
        <text x={32} y={107} textAnchor="middle" fontSize="5"
          fill="rgba(255,255,255,0.4)" fontWeight="700" data-bg="true">LF</text>
        <text x={50} y={107} textAnchor="middle" fontSize="5"
          fill="rgba(255,255,255,0.4)" fontWeight="700" data-bg="true">CF</text>
        <text x={68} y={107} textAnchor="middle" fontSize="5"
          fill="rgba(255,255,255,0.4)" fontWeight="700" data-bg="true">RF</text>

        {/* Orientation labels */}
        <text x={50} y={6} textAnchor="middle" fontSize="4" fill="#a7f3d0" data-bg="true">
          ▲ GREEN
        </text>
        <text x={50} y={207} textAnchor="middle" fontSize="4" fill="#a7f3d0" data-bg="true">
          TEE ▼
        </text>

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
          <ShotMarker
            key={shot.id}
            shot={shot}
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
    </div>
  );
}

function ShotMarker({ shot, isDragging, readOnly, onPointerDown, onDelete }) {
  const cx = shot.x;
  const cy = shot.y;
  const r = 5;
  const color = isDragging ? '#7c3aed' : '#1e40af';

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Drop shadow */}
      <circle cx={0.6} cy={0.6} r={r + 0.8} fill="rgba(0,0,0,0.22)" />

      {/* Main circle */}
      <circle
        cx={0} cy={0} r={r}
        fill={color}
        stroke="white"
        strokeWidth="1"
        onPointerDown={readOnly ? undefined : onPointerDown}
        style={{ cursor: readOnly ? 'default' : 'grab' }}
      />

      {/* X lines inside */}
      <line x1={-2.5} y1={-2.5} x2={2.5} y2={2.5}
        stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      <line x1={2.5} y1={-2.5} x2={-2.5} y2={2.5}
        stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

      {/* Shot number below */}
      <text x={0} y={r + 5.5} textAnchor="middle" fontSize="4.5"
        fontWeight="700" fill="white" stroke="black" strokeWidth="0.3" paintOrder="stroke"
        style={{ pointerEvents: 'none' }}>
        {shot.shotNumber}
      </text>

      {/* Delete button (top-right) */}
      {!readOnly && (
        <g
          transform={`translate(${r + 1.5},${-r - 1.5})`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={0} cy={0} r={3.5} fill="#ef4444" stroke="white" strokeWidth="0.8" />
          <line x1={-1.5} y1={-1.5} x2={1.5} y2={1.5}
            stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={1.5} y1={-1.5} x2={-1.5} y2={1.5}
            stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}
