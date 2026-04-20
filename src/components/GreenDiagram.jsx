import { useRef, useState, useCallback } from 'react';
import { generateId } from '../utils/uuid';

// Rings: outer to inner, in feet from pin
const RINGS = [30, 20, 10];
const RING_COLORS = ['#4ade80', '#22c55e', '#16a34a'];

export default function GreenDiagram({ shots, onShotsChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const W = 100;
  const H = 100;
  const CX = 50;
  const CY = 50;
  // Outermost ring radius in SVG units
  const MAX_R = 44;

  const getSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }, []);

  const handleBgClick = useCallback((e) => {
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    const pt = getSvgPoint(e.clientX, e.clientY);
    // Only add if within the outermost ring
    const dx = pt.x - CX;
    const dy = pt.y - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_R + 4) return; // allow a bit outside
    const newShot = {
      id: generateId(),
      x: pt.x,
      y: pt.y,
      shotNumber: shots.length + 1,
    };
    onShotsChange([...shots, newShot]);
  }, [shots, onShotsChange, getSvgPoint]);

  const handleMarkerPointerDown = useCallback((e, shotId) => {
    e.stopPropagation();
    e.preventDefault();

    setDragging(shotId);

    const onMove = (me) => {
      const clientX = me.touches ? me.touches[0].clientX : me.clientX;
      const clientY = me.touches ? me.touches[0].clientY : me.clientY;
      const pt = getSvgPoint(clientX, clientY);
      onShotsChange(
        shots.map((s) => s.id === shotId ? { ...s, x: pt.x, y: pt.y } : s)
      );
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [shots, onShotsChange, getSvgPoint]);

  const handleDelete = useCallback((e, shotId) => {
    e.stopPropagation();
    e.preventDefault();
    onShotsChange(shots.filter((s) => s.id !== shotId));
  }, [shots, onShotsChange]);

  // Ring radii in SVG units (proportional)
  const ringRadii = RINGS.map((ft) => (ft / RINGS[0]) * MAX_R);

  return (
    <div className="relative select-none flex justify-center" style={{ userSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        style={{ maxWidth: 320, maxHeight: 320, display: 'block' }}
        onClick={handleBgClick}
      >
        {/* Background */}
        <rect data-bg="true" x="0" y="0" width={W} height={H} fill="#dcfce7" />

        {/* Rough texture */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} data-bg="true" x={0} y={i * 10} width={W} height={5} fill="rgba(0,80,0,0.05)" />
        ))}

        {/* Concentric rings (outer to inner) */}
        {RINGS.map((ft, i) => (
          <circle
            key={ft}
            cx={CX}
            cy={CY}
            r={ringRadii[i]}
            fill={RING_COLORS[i]}
            stroke="#15803d"
            strokeWidth="0.5"
            data-bg="true"
          />
        ))}

        {/* Inner highlight */}
        <circle cx={CX} cy={CY} r={4} fill="#052e16" data-bg="true" />
        <circle cx={CX} cy={CY} r={2.5} fill="#166534" data-bg="true" />

        {/* Flag pin */}
        <line x1={CX} y1={CY - 2} x2={CX} y2={CY - 18} stroke="#4b5563" strokeWidth="1" strokeLinecap="round" />
        <polygon
          points={`${CX},${CY - 18} ${CX + 8},${CY - 14} ${CX},${CY - 10}`}
          fill="#ef4444"
        />

        {/* Ring distance labels */}
        {RINGS.map((ft, i) => (
          <text
            key={ft}
            x={CX + ringRadii[i] - 1}
            y={CY + 2}
            textAnchor="end"
            fontSize="4"
            fill="rgba(255,255,255,0.9)"
            fontWeight="600"
            data-bg="true"
          >
            {ft}ft
          </text>
        ))}

        {/* Compass dots */}
        {['N', 'S', 'E', 'W'].map((dir, i) => {
          const angle = (i * 90 - 90) * (Math.PI / 180);
          const r = MAX_R + 6;
          return (
            <text
              key={dir}
              x={CX + r * Math.cos(angle)}
              y={CY + r * Math.sin(angle) + 1.5}
              textAnchor="middle"
              fontSize="4.5"
              fill="#166534"
              fontWeight="700"
              data-bg="true"
            >
              {dir}
            </text>
          );
        })}

        {/* Shot markers */}
        {shots.map((shot) => (
          <GreenShotMarker
            key={shot.id}
            shot={shot}
            isDragging={dragging === shot.id}
            onPointerDown={(e) => handleMarkerPointerDown(e, shot.id)}
            onDelete={(e) => handleDelete(e, shot.id)}
          />
        ))}
      </svg>
    </div>
  );
}

function GreenShotMarker({ shot, isDragging, onPointerDown, onDelete }) {
  const cx = shot.x;
  const cy = shot.y;
  const r = 5;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Shadow */}
      <circle cx={0.5} cy={0.5} r={r + 1} fill="rgba(0,0,0,0.25)" />

      {/* Main circle */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill={isDragging ? '#7c3aed' : '#92400e'}
        stroke="white"
        strokeWidth="1"
        onPointerDown={onPointerDown}
        onTouchStart={onPointerDown}
        style={{ cursor: 'grab' }}
      />

      {/* X mark */}
      <line x1={-2.5} y1={-2.5} x2={2.5} y2={2.5} stroke="white" strokeWidth="1.5" strokeLinecap="round"
        style={{ pointerEvents: 'none' }} />
      <line x1={2.5} y1={-2.5} x2={-2.5} y2={2.5} stroke="white" strokeWidth="1.5" strokeLinecap="round"
        style={{ pointerEvents: 'none' }} />

      {/* Shot number */}
      <text
        x={0}
        y={r + 5}
        textAnchor="middle"
        fontSize="4.5"
        fontWeight="700"
        fill="#78350f"
        style={{ pointerEvents: 'none' }}
      >
        {shot.shotNumber}
      </text>

      {/* Delete button */}
      <g
        transform={`translate(${r + 1}, ${-r - 1})`}
        onClick={onDelete}
        onTouchEnd={onDelete}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={0} cy={0} r={3.5} fill="#ef4444" stroke="white" strokeWidth="0.8" />
        <line x1={-1.5} y1={-1.5} x2={1.5} y2={1.5} stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1={1.5} y1={-1.5} x2={-1.5} y2={1.5} stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </g>
  );
}
