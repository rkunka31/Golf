import { useRef, useState, useCallback } from 'react';
import { generateId } from '../utils/uuid';

// Distance markers along the fairway (yards from tee)
const DISTANCE_MARKERS = [300, 250, 200, 150, 100, 50];

// The oval fairway occupies the middle ~50% horizontally
const FAIRWAY_LEFT = 0.25;
const FAIRWAY_RIGHT = 0.75;

export default function FairwayDiagram({ shots, onShotsChange }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { id, startX, startY }
  const dragMoved = useRef(false);

  const getSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  // ---- Background tap to add shot ----
  const handleBgPointerDown = useCallback((e) => {
    // Only handle direct taps on the background, not on markers
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    dragMoved.current = false;
  }, []);

  const handleBgClick = useCallback((e) => {
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    const pt = getSvgPoint(e.clientX, e.clientY);
    const newShot = {
      id: generateId(),
      x: pt.x,
      y: pt.y,
      shotNumber: shots.length + 1,
    };
    onShotsChange([...shots, newShot]);
  }, [shots, onShotsChange, getSvgPoint]);

  // ---- Drag marker ----
  const handleMarkerPointerDown = useCallback((e, shotId) => {
    e.stopPropagation();
    e.preventDefault();
    dragMoved.current = false;
    setDragging(shotId);

    const onMove = (me) => {
      dragMoved.current = true;
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

  // SVG viewBox: 0 0 100 200
  const W = 100;
  const H = 200;

  // Fairway oval path (rounded rect / pill shape)
  const fw = (FAIRWAY_RIGHT - FAIRWAY_LEFT) * W; // ~50
  const fx = FAIRWAY_LEFT * W; // ~25
  const rx = fw / 2; // x radius of rounded corners
  // Full height oval
  const fairwayPath = `M ${fx + rx} 4
    L ${fx + fw - rx} 4
    Q ${fx + fw} 4 ${fx + fw} ${4 + rx}
    L ${fx + fw} ${H - 4 - rx}
    Q ${fx + fw} ${H - 4} ${fx + fw - rx} ${H - 4}
    L ${fx + rx} ${H - 4}
    Q ${fx} ${H - 4} ${fx} ${H - 4 - rx}
    L ${fx} ${4 + rx}
    Q ${fx} 4 ${fx + rx} 4
    Z`;

  // Distance marker Y positions (evenly spaced top to bottom)
  // top of fairway = tee end (~90%), bottom = green end (~10%)
  // We'll place markers from y=15 (near green) to y=185 (near tee)
  const markerYs = DISTANCE_MARKERS.map((_, i) =>
    15 + (i / (DISTANCE_MARKERS.length - 1)) * 170
  );

  return (
    <div className="relative select-none" style={{ userSelect: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        style={{ maxHeight: 340, display: 'block' }}
        onClick={handleBgClick}
        onPointerDown={handleBgPointerDown}
      >
        {/* Sky/rough background */}
        <rect data-bg="true" x="0" y="0" width={W} height={H} fill="#d4edda" />

        {/* Rough texture stripes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <rect
            key={i}
            data-bg="true"
            x={0}
            y={i * 10}
            width={W}
            height={5}
            fill="rgba(0,80,0,0.06)"
          />
        ))}

        {/* Fairway oval */}
        <defs>
          <clipPath id="fairway-clip">
            <path d={fairwayPath} />
          </clipPath>
          <pattern id="fairway-stripes" x="0" y="0" width={fw} height="10" patternUnits="userSpaceOnUse" patternTransform={`translate(${fx}, 0)`}>
            <rect x="0" y="0" width={fw} height="5" fill="#4ade80" />
            <rect x="0" y="5" width={fw} height="5" fill="#22c55e" />
          </pattern>
        </defs>

        {/* Fairway fill with stripe pattern */}
        <path d={fairwayPath} fill="url(#fairway-stripes)" />

        {/* Fairway border */}
        <path d={fairwayPath} fill="none" stroke="#15803d" strokeWidth="0.8" />

        {/* Distance marker lines + labels */}
        {DISTANCE_MARKERS.map((dist, i) => {
          const y = markerYs[i];
          return (
            <g key={dist} data-bg="true">
              {/* Line across the fairway */}
              <line
                x1={fx}
                y1={y}
                x2={fx + fw}
                y2={y}
                stroke="#15803d"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                data-bg="true"
              />
              {/* Left label */}
              <text
                x={fx - 2}
                y={y + 1}
                textAnchor="end"
                fontSize="5"
                fill="#166534"
                fontWeight="600"
                data-bg="true"
              >
                {dist}
              </text>
              {/* Right label */}
              <text
                x={fx + fw + 2}
                y={y + 1}
                textAnchor="start"
                fontSize="5"
                fill="#166534"
                fontWeight="600"
                data-bg="true"
              >
                {dist}
              </text>
            </g>
          );
        })}

        {/* Zone labels */}
        <text x={fx + fw * 0.2} y={H / 2} textAnchor="middle" fontSize="5.5" fill="#15803d" fontWeight="700" opacity="0.7" data-bg="true">LF</text>
        <text x={fx + fw * 0.5} y={H / 2} textAnchor="middle" fontSize="5.5" fill="#15803d" fontWeight="700" opacity="0.7" data-bg="true">CF</text>
        <text x={fx + fw * 0.8} y={H / 2} textAnchor="middle" fontSize="5.5" fill="#15803d" fontWeight="700" opacity="0.7" data-bg="true">RF</text>

        {/* Green end indicator (bottom) */}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="4.5" fill="#166534" fontWeight="500" data-bg="true">▲ GREEN</text>
        {/* Tee end indicator (top) */}
        <text x={W / 2} y={7} textAnchor="middle" fontSize="4.5" fill="#166534" fontWeight="500" data-bg="true">TEE ▼</text>

        {/* Shot markers */}
        {shots.map((shot) => (
          <ShotMarker
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

function ShotMarker({ shot, isDragging, onPointerDown, onDelete }) {
  const cx = shot.x;
  const cy = shot.y;
  const r = 5;

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      style={{ cursor: 'grab' }}
    >
      {/* Shadow */}
      <circle cx={0.5} cy={0.5} r={r + 1} fill="rgba(0,0,0,0.2)" />

      {/* Main circle - draggable */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill={isDragging ? '#7c3aed' : '#1e40af'}
        stroke="white"
        strokeWidth="1"
        onPointerDown={onPointerDown}
        onTouchStart={onPointerDown}
        style={{ cursor: 'grab' }}
      />

      {/* X mark */}
      <line x1={-2.5} y1={-2.5} x2={2.5} y2={2.5} stroke="white" strokeWidth="1.5" strokeLinecap="round"
        onPointerDown={onPointerDown} style={{ pointerEvents: 'none' }} />
      <line x1={2.5} y1={-2.5} x2={-2.5} y2={2.5} stroke="white" strokeWidth="1.5" strokeLinecap="round"
        onPointerDown={onPointerDown} style={{ pointerEvents: 'none' }} />

      {/* Shot number subscript */}
      <text
        x={0}
        y={r + 5}
        textAnchor="middle"
        fontSize="4.5"
        fontWeight="700"
        fill="#1e3a8a"
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
