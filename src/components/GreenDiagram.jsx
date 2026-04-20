import { useRef, useState, useEffect } from 'react';
import { generateId } from '../utils/uuid';

// Rings: from outside to inside, in feet from pin
const RINGS = [30, 20, 10];
const RING_COLORS = ['#4ade80', '#22c55e', '#16a34a'];

const W = 100;
const H = 100;
const CX = 50;
const CY = 50;
const MAX_R = 44; // outermost ring radius in SVG units

export default function GreenDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  // Keep live ref so drag callbacks see current shots
  const shotsRef = useRef(shots);
  useEffect(() => { shotsRef.current = shots; }, [shots]);

  const getSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const handleBgClick = (e) => {
    if (readOnly) return;
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    const pt = getSvgPoint(e.clientX, e.clientY);
    // Allow tapping anywhere within expanded green area
    const dx = pt.x - CX;
    const dy = pt.y - CY;
    if (Math.sqrt(dx * dx + dy * dy) > MAX_R + 5) return;
    const current = shotsRef.current;
    const newShot = {
      id: generateId(),
      x: pt.x,
      y: pt.y,
      shotNumber: current.length + 1,
    };
    onShotsChange([...current, newShot]);
  };

  const handleMarkerPointerDown = (e, shotId) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging(shotId);

    const onMove = (me) => {
      const clientX = me.touches ? me.touches[0].clientX : me.clientX;
      const clientY = me.touches ? me.touches[0].clientY : me.clientY;
      const pt = getSvgPoint(clientX, clientY);
      onShotsChange(
        shotsRef.current.map((s) => s.id === shotId ? { ...s, x: pt.x, y: pt.y } : s)
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
  };

  const handleDelete = (e, shotId) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    onShotsChange(shotsRef.current.filter((s) => s.id !== shotId));
  };

  // Ring radii proportional to MAX_R
  const ringRadii = RINGS.map((ft) => (ft / RINGS[0]) * MAX_R);

  return (
    <div className="flex justify-center" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: 320, maxHeight: 320, display: 'block', touchAction: 'none' }}
        onClick={handleBgClick}
      >
        {/* Background */}
        <rect data-bg="true" x="0" y="0" width={W} height={H} fill="#dcfce7" />

        {/* Rough texture */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} data-bg="true" x={0} y={i * 10} width={W} height={5} fill="rgba(0,100,0,0.06)" />
        ))}

        {/* Concentric rings outer → inner */}
        {RINGS.map((ft, i) => (
          <circle
            key={ft}
            cx={CX} cy={CY}
            r={ringRadii[i]}
            fill={RING_COLORS[i]}
            stroke="#15803d"
            strokeWidth="0.6"
            data-bg="true"
          />
        ))}

        {/* Center cup */}
        <circle cx={CX} cy={CY} r={4.5} fill="#052e16" data-bg="true" />
        <circle cx={CX} cy={CY} r={3} fill="#166534" data-bg="true" />

        {/* Flag pin */}
        <line x1={CX} y1={CY - 3} x2={CX} y2={CY - 19}
          stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
        <polygon
          points={`${CX},${CY - 19} ${CX + 9},${CY - 14.5} ${CX},${CY - 10}`}
          fill="#ef4444"
        />

        {/* Ring distance labels */}
        {RINGS.map((ft, i) => (
          <text key={ft}
            x={CX + ringRadii[i] - 1} y={CY + 2}
            textAnchor="end" fontSize="4"
            fill="rgba(255,255,255,0.85)" fontWeight="600"
            data-bg="true">
            {ft}ft
          </text>
        ))}

        {/* Cardinal direction labels */}
        {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([dir, deg]) => {
          const angle = (deg - 90) * (Math.PI / 180);
          const r = MAX_R + 6.5;
          return (
            <text key={dir}
              x={CX + r * Math.cos(angle)}
              y={CY + r * Math.sin(angle) + 1.5}
              textAnchor="middle" fontSize="4.5"
              fill="#166534" fontWeight="700"
              data-bg="true">
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
            readOnly={readOnly}
            onPointerDown={(e) => handleMarkerPointerDown(e, shot.id)}
            onDelete={(e) => handleDelete(e, shot.id)}
          />
        ))}
      </svg>
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
        fontWeight="700" fill="#78350f" style={{ pointerEvents: 'none' }}>
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
