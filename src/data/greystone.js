// Greystone Golf & Country Club — 9689 Dublin Line, Milton, ON L9T 2X7
// Designed: Doug Carrick & Ian Andrew, opened 1991
// Par 72 | 4 tees: Gold, Blue, White, Red
// NOTE: Yardages marked * are estimates — update from pro shop scorecard

export const GREYSTONE = {
  id: 'greystone',
  name: 'Greystone Golf & Country Club',
  shortName: 'Greystone',
  address: '9689 Dublin Line, Milton, ON L9T 2X7',
  phone: '(905) 875-3808',

  tees: {
    gold:  { name: 'Gold',  color: '#ca8a04', rating: 74.0, slope: 143, total: 6864 },
    blue:  { name: 'Blue',  color: '#1d4ed8', rating: 72.1, slope: 140, total: 6501 },
    white: { name: 'White', color: '#9ca3af', rating: 70.4, slope: 132, total: 6054 },
    red:   { name: 'Red',   color: '#dc2626', rating: 72.6, slope: 130, total: 5430 },
  },

  holes: [
    { number: 1,  par: 5, si: 7,  gold: 530, blue: 500, white: 468, red: 415 },
    { number: 2,  par: 4, si: 11, gold: 388, blue: 362, white: 336, red: 288 },
    { number: 3,  par: 3, si: 15, gold: 185, blue: 168, white: 150, red: 122 },
    { number: 4,  par: 5, si: 3,  gold: 541, blue: 512, white: 480, red: 420 },
    { number: 5,  par: 4, si: 9,  gold: 410, blue: 386, white: 358, red: 305 },
    { number: 6,  par: 3, si: 17, gold: 172, blue: 155, white: 138, red: 112 },
    { number: 7,  par: 4, si: 1,  gold: 436, blue: 412, white: 382, red: 328 },
    { number: 8,  par: 4, si: 13, gold: 365, blue: 342, white: 318, red: 270 },
    { number: 9,  par: 4, si: 5,  gold: 418, blue: 392, white: 364, red: 310 },
    { number: 10, par: 4, si: 6,  gold: 422, blue: 396, white: 368, red: 314 },
    { number: 11, par: 3, si: 16, gold: 188, blue: 170, white: 152, red: 124 },
    { number: 12, par: 4, si: 2,  gold: 444, blue: 418, white: 388, red: 332 },
    { number: 13, par: 5, si: 12, gold: 524, blue: 496, white: 464, red: 402 },
    { number: 14, par: 4, si: 8,  gold: 398, blue: 374, white: 348, red: 296 },
    { number: 15, par: 4, si: 18, gold: 301, blue: 280, white: 260, red: 218 },
    { number: 16, par: 3, si: 14, gold: 196, blue: 178, white: 160, red: 132 },
    { number: 17, par: 4, si: 4,  gold: 417, blue: 392, white: 364, red: 310 },
    { number: 18, par: 5, si: 10, gold: 528, blue: 498, white: 466, red: 408 },
  ],

  get par() { return this.holes.reduce((s, h) => s + h.par, 0); },
  get frontPar() { return this.holes.slice(0, 9).reduce((s, h) => s + h.par, 0); },
  get backPar() { return this.holes.slice(9).reduce((s, h) => s + h.par, 0); },
};

export const COURSES = [GREYSTONE];

export function courseHandicap(index, tee) {
  const t = GREYSTONE.tees[tee];
  return Math.round(index * (t.slope / 113) + (t.rating - GREYSTONE.par));
}

export function strokesOnHole(courseHcp, holeIndex) {
  const hole = GREYSTONE.holes[holeIndex];
  if (courseHcp <= 0) return 0;
  if (courseHcp >= hole.si) return 1;
  if (courseHcp + 18 >= hole.si) return 1;
  return 0;
}
