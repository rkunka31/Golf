import { useRef, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/uuid';

const W = 100;
const H = 100;
const CX = 50;
const CY = 50;
const MAX_R = 44; // outermost ring radius in SVG units = 30ft

function getSvgCoords(svg, clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: CX, y: CY };
  return pt.matrixTransform(ctm.inverse());
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

export default function GreenDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [ghost, setGhost] = useState(null);

  // Keep live ref so drag callbacks see current shots
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
        const dx = pt.x - CX;
        const dy = pt.y - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Place shot only if within r=46 of center
        if (dist <= 46) {
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

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: 320, maxHeight: 320, display: 'block', touchAction: 'none', margin: '0 auto' }}
      >
        {/* Background / fringe */}
        <circle cx={CX} cy={CY} r={48} fill="#2d7a3e" data-bg="true" />

        {/* Putting surface rings: outer to inner */}
        {/* r=44: 30ft ring */}
        <circle cx={CX} cy={CY} r={44} fill="#3cb87a"
          stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" data-bg="true" />
        {/* r=29: 20ft ring */}
        <circle cx={CX} cy={CY} r={29} fill="#2ea868"
          stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" data-bg="true" />
        {/* r=15: 10ft ring */}
        <circle cx={CX} cy={CY} r={15} fill="#1e9855"
          stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" data-bg="true" />

        {/* Ring labels */}
        <text x={CX + 40} y={CY + 2} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.7)" data-bg="true">30ft</text>
        <text x={CX + 26} y={CY + 2} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.7)" data-bg="true">20ft</text>
        <text x={CX + 12} y={CY + 2} textAnchor="middle" fontSize="4"
          fill="rgba(255,255,255,0.7)" data-bg="true">10ft</text>

        {/* Center cup */}
        <circle cx={CX} cy={CY} r={3.5} fill="#0a1f14"
          stroke="#4ade80" strokeWidth="0.5" data-bg="true" />

        {/* Flag pin */}
        <line x1={CX} y1={CY - 3} x2={CX} y2={CY - 20}
          stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" data-bg="true" />
        <polygon
          points={`${CX},${CY - 20} ${CX + 9},${CY - 14} ${CX},${CY - 8}`}
          fill="#ef4444" data-bg="true"
        />

        {/* Cardinal direction labels */}
        {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([dir, deg]) => {
          const angle = (deg - 90) * (Math.PI / 180);
          const labelR = MAX_R + 6.5;
          return (
            <text key={dir}
              x={CX + labelR * Math.cos(angle)}
              y={CY + labelR * Math.sin(angle) + 1.5}
              textAnchor="middle" fontSize="4"
              fill="rgba(255,255,255,0.6)"
              data-bg="true">
              {dir}
            </text>
          );
        })}

        {/* Connecting lines between shots */}
        {sortedShots.length > 1 && sortedShots.map((shot, idx) => {
          if (idx === 0) return null;
          const prev = sortedShots[idx - 1];
          const midX = (prev.x + shot.x) / 2;
          const midY = (prev.y + shot.y) / 2;
          const dx = shot.x - prev.x;
          const dy = shot.y - prev.y;
          const svgDist = Math.sqrt(dx * dx + dy * dy);
          const distFt = Math.round((svgDist / MAX_R) * 30);
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
                {distFt}ft
              </text>
            </g>
          );
        })}

        {/* Shot markers */}
        {shots.map((shot) => (
          <GreenShotMarker
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

function GreenShotMarker({ shot, isDragging, readOnly, onPointerDown, onDelete }) {
  const cx = shot.x;
  const cy = shot.y;
  const r = 5;
  const color = isDragging ? '#7c3aed' : '#92400e';

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Drop shadow */}
      <circle cx={0.6} cy={0.6} r={r + 0.8} fill="rgba(0,0,0,0.25)" />

      {/* Main circle */}
      <circle
        cx={0} cy={0} r={r}
        fill={color}
        stroke="white"
        strokeWidth="1"
        onPointerDown={readOnly ? undefined : onPointerDown}
        style={{ cursor: readOnly ? 'default' : 'grab' }}
      />

      {/* X lines */}
      <line x1={-2.5} y1={-2.5} x2={2.5} y2={2.5}
        stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      <line x1={2.5} y1={-2.5} x2={-2.5} y2={2.5}
        stroke="white" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

      {/* Shot number */}
      <text x={0} y={r + 5.5} textAnchor="middle" fontSize="4.5"
        fontWeight="700" fill="white" stroke="black" strokeWidth="0.3" paintOrder="stroke"
        style={{ pointerEvents: 'none' }}>
        {shot.shotNumber}
      </text>

      {/* Delete button */}
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
