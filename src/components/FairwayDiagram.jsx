import { useRef, useState, useEffect } from 'react';
import { generateId } from '../utils/uuid';

// Distance markers along the fairway (yards from tee)
const DISTANCE_MARKERS = [300, 250, 200, 150, 100, 50];

// The oval fairway occupies the middle ~50% horizontally
const FAIRWAY_LEFT = 0.25;
const FAIRWAY_RIGHT = 0.75;

export default function FairwayDiagram({ shots, onShotsChange, readOnly }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  // Keep a live ref so drag callbacks always have current shots
  const shotsRef = useRef(shots);
  useEffect(() => { shotsRef.current = shots; }, [shots]);

  const getSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 100 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  // ---- Background tap/click to add shot ----
  const handleBgClick = (e) => {
    if (readOnly) return;
    // Only fire on background elements
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    const pt = getSvgPoint(e.clientX, e.clientY);
    const current = shotsRef.current;
    const newShot = {
      id: generateId(),
      x: pt.x,
      y: pt.y,
      shotNumber: current.length + 1,
    };
    onShotsChange([...current, newShot]);
  };

  // ---- Drag marker ----
  const handleMarkerPointerDown = (e, shotId) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging(shotId);

    const onMove = (me) => {
      const clientX = me.touches ? me.touches[0].clientX : me.clientX;
      const clientY = me.touches ? me.touches[0].clientY : me.clientY;
      const pt = getSvgPoint(clientX, clientY);
      // Use shotsRef so we always have up-to-date array
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

  // SVG viewBox: 0 0 100 200
  const W = 100;
  const H = 200;

  // Fairway oval path (pill/stadium shape)
  const fw = (FAIRWAY_RIGHT - FAIRWAY_LEFT) * W; // 50
  const fx = FAIRWAY_LEFT * W; // 25
  const rx = fw / 2; // corner radius = half width for pill shape

  const fairwayPath = [
    `M ${fx + rx} 4`,
    `L ${fx + fw - rx} 4`,
    `Q ${fx + fw} 4 ${fx + fw} ${4 + rx}`,
    `L ${fx + fw} ${H - 4 - rx}`,
    `Q ${fx + fw} ${H - 4} ${fx + fw - rx} ${H - 4}`,
    `L ${fx + rx} ${H - 4}`,
    `Q ${fx} ${H - 4} ${fx} ${H - 4 - rx}`,
    `L ${fx} ${4 + rx}`,
    `Q ${fx} 4 ${fx + rx} 4`,
    `Z`,
  ].join(' ');

  // Distance marker Y positions evenly spaced from top to bottom
  const markerYs = DISTANCE_MARKERS.map((_, i) =>
    15 + (i / (DISTANCE_MARKERS.length - 1)) * 170
  );

  return (
    <div className="relative" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 340, display: 'block', touchAction: 'none' }}
        onClick={handleBgClick}
      >
        {/* Rough/background */}
        <rect data-bg="true" x="0" y="0" width={W} height={H} fill="#bbf7d0" />

        {/* Rough texture alternating rows */}
        {Array.from({ length: 20 }).map((_, i) => (
          <rect key={i} data-bg="true" x={0} y={i * 10} width={W} height={5} fill="rgba(0,100,0,0.07)" />
        ))}

        {/* Fairway stripe pattern */}
        <defs>
          <pattern id="fw-stripes" x="0" y="0" width={fw} height="10" patternUnits="userSpaceOnUse" patternTransform={`translate(${fx},0)`}>
            <rect x="0" y="0" width={fw} height="5" fill="#4ade80" />
            <rect x="0" y="5" width={fw} height="5" fill="#22c55e" />
          </pattern>
        </defs>

        {/* Fairway fill */}
        <path d={fairwayPath} fill="url(#fw-stripes)" data-bg="true" />
        {/* Fairway outline */}
        <path d={fairwayPath} fill="none" stroke="#15803d" strokeWidth="0.8" data-bg="true" />

        {/* Distance marker lines + labels */}
        {DISTANCE_MARKERS.map((dist, i) => {
          const y = markerYs[i];
          return (
            <g key={dist}>
              <line x1={fx} y1={y} x2={fx + fw} y2={y}
                stroke="#15803d" strokeWidth="0.5" strokeDasharray="2,2" data-bg="true" />
              <text x={fx - 2} y={y + 1.5} textAnchor="end" fontSize="5"
                fill="#166534" fontWeight="600" data-bg="true">{dist}</text>
              <text x={fx + fw + 2} y={y + 1.5} textAnchor="start" fontSize="5"
                fill="#166534" fontWeight="600" data-bg="true">{dist}</text>
            </g>
          );
        })}

        {/* Zone labels in center of fairway */}
        <text x={fx + fw * 0.2} y={H / 2 + 2} textAnchor="middle" fontSize="5"
          fill="#166534" fontWeight="700" opacity="0.6" data-bg="true">LF</text>
        <text x={fx + fw * 0.5} y={H / 2 + 2} textAnchor="middle" fontSize="5"
          fill="#166534" fontWeight="700" opacity="0.6" data-bg="true">CF</text>
        <text x={fx + fw * 0.8} y={H / 2 + 2} textAnchor="middle" fontSize="5"
          fill="#166534" fontWeight="700" opacity="0.6" data-bg="true">RF</text>

        {/* Orientation labels */}
        <text x={W / 2} y={7} textAnchor="middle" fontSize="4.5"
          fill="#166534" fontWeight="500" data-bg="true">TEE ▼</text>
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="4.5"
          fill="#166534" fontWeight="500" data-bg="true">▲ GREEN</text>

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
        fontWeight="700" fill="#1e3a8a" style={{ pointerEvents: 'none' }}>
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
