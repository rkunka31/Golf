// Baseline expected putts from distance (feet) — amateur golfer
const PUTT_TABLE = [
  [2, 1.02], [3, 1.08], [4, 1.18], [5, 1.32], [6, 1.44],
  [8, 1.58], [10, 1.70], [12, 1.78], [15, 1.87], [20, 1.96],
  [25, 2.03], [30, 2.10], [40, 2.20], [50, 2.30], [70, 2.45],
];

// Baseline expected strokes to hole from approach (yards), from fairway
const APPROACH_TABLE = [
  [25, 2.60], [50, 2.78], [75, 2.90], [100, 3.00],
  [125, 3.10], [150, 3.22], [175, 3.40], [200, 3.62],
  [225, 3.85], [250, 4.10], [275, 4.35], [300, 4.60],
];

/**
 * Linear interpolation between nearest rows in a lookup table.
 * Table is array of [key, value] pairs sorted ascending by key.
 * Clamps to table edges if dist is out of range.
 */
export function lerp(table, dist) {
  if (table.length === 0) return 0;
  if (dist <= table[0][0]) return table[0][1];
  if (dist >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (dist >= x0 && dist <= x1) {
      const t = (dist - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

/**
 * Compute distance in feet from pin for a green shot.
 * SVG coords in a 100×100 viewBox with center at (50,50).
 * MAX_R = 44 SVG units = 30 feet.
 */
const MAX_R = 44;
const MAX_FT = 30;

export function greenShotFeet(shot) {
  const dx = shot.x - 50;
  const dy = shot.y - 50;
  const svgDist = Math.sqrt(dx * dx + dy * dy);
  return (svgDist / MAX_R) * MAX_FT;
}

/**
 * Calculate Strokes Gained: Putting for a hole.
 * Returns null if putts is null/undefined.
 * Uses first green shot distance; defaults to 20ft if no green shots.
 */
export function calcSGPutt(hole) {
  if (hole.putts === null || hole.putts === undefined) return null;
  const putts = Number(hole.putts);

  let distFt = 20; // default
  const greenShots = hole.greenShots || [];
  if (greenShots.length > 0) {
    // Sort by shotNumber, use first
    const sorted = [...greenShots].sort((a, b) => a.shotNumber - b.shotNumber);
    distFt = greenShotFeet(sorted[0]);
  }

  const baseline = lerp(PUTT_TABLE, distFt);
  return baseline - putts;
}

/**
 * Calculate Strokes Gained: Approach for a hole.
 * approachStrokes = score - (par===3 ? 0 : 1) - putts - penalties
 * baseline = expected strokes from approach distance
 * SG:App = baseline - approachStrokes
 * Returns null if data is missing.
 */
export function calcSGApp(hole) {
  const score = hole.score !== null && hole.score !== '' ? Number(hole.score) : null;
  const putts = hole.putts !== null && hole.putts !== undefined ? Number(hole.putts) : null;
  const approachDist = hole.approachDistance !== null && hole.approachDistance !== '' && !isNaN(Number(hole.approachDistance))
    ? Number(hole.approachDistance)
    : null;

  if (score === null || putts === null || approachDist === null || !hole.par) return null;

  const penalties = Number(hole.penaltyStrokes) || 0;
  const driveStrokes = hole.par === 3 ? 0 : 1;
  const approachStrokes = score - driveStrokes - putts - penalties;

  if (approachStrokes < 0) return null;

  const baseline = lerp(APPROACH_TABLE, approachDist);
  return baseline - approachStrokes;
}

/**
 * Calculate total Strokes Gained for a round (array of holes).
 * Returns { sgPutt, sgApp } summed across holes, or null fields if no data.
 */
export function calcRoundSG(holes) {
  let sgPuttTotal = 0;
  let sgPuttCount = 0;
  let sgAppTotal = 0;
  let sgAppCount = 0;

  holes.forEach((hole) => {
    const sgP = calcSGPutt(hole);
    if (sgP !== null) {
      sgPuttTotal += sgP;
      sgPuttCount++;
    }
    const sgA = calcSGApp(hole);
    if (sgA !== null) {
      sgAppTotal += sgA;
      sgAppCount++;
    }
  });

  return {
    sgPutt: sgPuttCount > 0 ? sgPuttTotal : null,
    sgApp: sgAppCount > 0 ? sgAppTotal : null,
  };
}
