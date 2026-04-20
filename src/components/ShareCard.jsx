import { useRef } from 'react';

// Score color coding for SVG fill
function scoreColor(diff) {
  if (diff === null || diff === undefined) return '#e5e7eb';
  if (diff <= -2) return '#eab308'; // eagle or better — gold
  if (diff === -1) return '#ef4444'; // birdie — red
  if (diff === 0) return '#16a34a';  // par — green
  if (diff === 1) return '#3b82f6';  // bogey — blue
  if (diff === 2) return '#1d4ed8';  // double — dark blue
  return '#374151';                  // worse — dark grey
}

function scoreTextColor(diff) {
  if (diff === null || diff === undefined) return '#9ca3af';
  return 'white';
}

async function exportRoundAsPng(svgEl) {
  const svgString = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 500);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/png');
    };
    img.src = url;
  });
}

export default function ShareCard({ round, onClose }) {
  const svgRef = useRef(null);

  const holes = round.holes || [];
  const front9 = holes.slice(0, 9);
  const back9 = holes.slice(9, 18);

  const totalScore = holes.reduce((s, h) => s + (h.score ? Number(h.score) : 0), 0);
  const totalPar = holes.reduce((s, h) => s + (h.par || 0), 0);
  const totalPutts = holes.reduce((s, h) => s + (h.putts || 0), 0);

  const par45 = holes.filter((h) => h.par === 4 || h.par === 5);
  const fwHit = par45.filter((h) => h.fairwayHit === true).length;
  const fwPct = par45.length > 0 ? Math.round((fwHit / par45.length) * 100) : null;

  const scoredHoles = holes.filter((h) => h.score !== null && h.score !== '' && !isNaN(Number(h.score)));
  const girHoles = scoredHoles.filter((h) => Number(h.score) <= h.par && (h.putts || 0) <= 2);
  const girPct = scoredHoles.length > 0 ? Math.round((girHoles.length / scoredHoles.length) * 100) : null;

  const scoreDiff = totalScore > 0 ? totalScore - totalPar : null;

  const handleShare = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const blob = await exportRoundAsPng(svgEl);
    if (!blob) return;
    const fileName = `golf-${(round.course || 'round').replace(/\s+/g, '-')}-${round.date || 'unknown'}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${round.course || 'Round'} — ${round.date || ''}` });
      } catch {
        // user cancelled or share not supported
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // SVG card dimensions
  const CARD_W = 800;
  const CARD_H = 500;
  const cellW = 76;
  const cellH = 44;
  const row1Y = 160;
  const row2Y = row1Y + cellH + 6;

  function HoleCell({ hole, cx, cy }) {
    const s = hole.score !== null && hole.score !== '' && !isNaN(Number(hole.score)) ? Number(hole.score) : null;
    const diff = s !== null ? s - hole.par : null;
    const bg = scoreColor(diff);
    const tc = scoreTextColor(diff);
    return (
      <g>
        <rect x={cx} y={cy} width={cellW} height={cellH} rx="6" fill={bg} />
        <text x={cx + cellW / 2} y={cy + 14} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.7)" fontFamily="sans-serif">
          {hole.holeNumber}
        </text>
        <text x={cx + cellW / 2} y={cy + 32} textAnchor="middle" fontSize="18" fontWeight="bold" fill={s !== null ? tc : '#9ca3af'} fontFamily="sans-serif">
          {s !== null ? s : '\u2014'}
        </text>
      </g>
    );
  }

  return (
    <div>
      {/* Hidden SVG off-screen for export */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <svg
          ref={svgRef}
          id="share-card-svg"
          width={CARD_W}
          height={CARD_H}
          viewBox={`0 0 ${CARD_W} ${CARD_H}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect x="0" y="0" width={CARD_W} height={CARD_H} fill="white" />
          {/* Border */}
          <rect x="4" y="4" width={CARD_W - 8} height={CARD_H - 8} rx="16" fill="none" stroke="#15803d" strokeWidth="3" />

          {/* Top banner background */}
          <rect x="4" y="4" width={CARD_W - 8} height="130" rx="16" fill="#14532d" />
          <rect x="4" y="90" width={CARD_W - 8} height="50" fill="#14532d" />

          {/* Course name */}
          <text x="40" y="58" fontSize="30" fontWeight="bold" fill="white" fontFamily="sans-serif">
            {round.course || 'Golf Round'}
          </text>

          {/* Date + tees + conditions */}
          <text x="40" y="88" fontSize="14" fill="#86efac" fontFamily="sans-serif">
            {[
              round.date || '',
              round.tees ? `${round.tees.charAt(0).toUpperCase() + round.tees.slice(1)} tees` : '',
              round.conditions || '',
            ].filter(Boolean).join('  \u00b7  ')}
          </text>

          {/* Score display */}
          <text x={CARD_W - 40} y="58" textAnchor="end" fontSize="42" fontWeight="bold" fill="white" fontFamily="sans-serif">
            {totalScore > 0 ? totalScore : '\u2014'}
          </text>
          {scoreDiff !== null && (
            <text x={CARD_W - 40} y="88" textAnchor="end" fontSize="14" fill={scoreDiff > 0 ? '#fca5a5' : '#86efac'} fontFamily="sans-serif">
              {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff === 0 ? 'Even' : String(scoreDiff)}
            </text>
          )}

          {/* Section label */}
          <text x="40" y="148" fontSize="10" fill="#6b7280" fontFamily="sans-serif" fontWeight="600" letterSpacing="1">
            SCORECARD
          </text>

          {/* Front 9 */}
          {front9.map((hole, i) => (
            <HoleCell key={hole.holeNumber} hole={hole} cx={20 + i * (cellW + 6)} cy={row1Y} />
          ))}

          {/* Back 9 */}
          {back9.map((hole, i) => (
            <HoleCell key={hole.holeNumber} hole={hole} cx={20 + i * (cellW + 6)} cy={row2Y} />
          ))}

          {/* Stats row */}
          {[
            { label: 'Total Score', value: totalScore > 0 ? String(totalScore) : '\u2014' },
            { label: 'Putts', value: totalPutts > 0 ? String(totalPutts) : '\u2014' },
            { label: 'FIR %', value: fwPct !== null ? `${fwPct}%` : '\u2014' },
            { label: 'GIR %', value: girPct !== null ? `${girPct}%` : '\u2014' },
          ].map(({ label, value }, i) => {
            const bx = 30 + i * 190;
            const by = 410;
            return (
              <g key={label}>
                <text x={bx} y={by} fontSize="11" fill="#9ca3af" fontFamily="sans-serif">{label}</text>
                <text x={bx} y={by + 28} fontSize="24" fontWeight="bold" fill="#111827" fontFamily="sans-serif">{value}</text>
              </g>
            );
          })}

          {/* Footer */}
          <text x={CARD_W / 2} y={CARD_H - 12} textAnchor="middle" fontSize="10" fill="#d1d5db" fontFamily="sans-serif">
            Golf Tracker
          </text>
        </svg>
      </div>

      {/* Preview card visible in modal */}
      <div className="rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ background: '#14532d' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-white font-bold text-lg truncate">{round.course || 'Round'}</p>
          <p className="text-green-300 text-xs">{round.date}{round.conditions ? ` · ${round.conditions}` : ''}</p>
        </div>
        <div className="flex gap-3 px-4 py-2 flex-wrap">
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <p className="text-green-300 text-xs">Score</p>
            <p className="text-white font-bold text-xl">{totalScore > 0 ? totalScore : '—'}</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5">
            <p className="text-green-300 text-xs">Putts</p>
            <p className="text-white font-bold text-xl">{totalPutts > 0 ? totalPutts : '—'}</p>
          </div>
          {fwPct !== null && (
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <p className="text-green-300 text-xs">FIR</p>
              <p className="text-white font-bold text-xl">{fwPct}%</p>
            </div>
          )}
          {girPct !== null && (
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <p className="text-green-300 text-xs">GIR</p>
              <p className="text-white font-bold text-xl">{girPct}%</p>
            </div>
          )}
        </div>
        <div className="px-4 pb-3 text-xs text-green-400/60 font-semibold tracking-wider">GOLF TRACKER</div>
      </div>

      <button
        onClick={handleShare}
        className="w-full py-3 rounded-xl bg-green-700 text-white font-semibold text-sm active:bg-green-800 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share / Download PNG
      </button>
    </div>
  );
}
