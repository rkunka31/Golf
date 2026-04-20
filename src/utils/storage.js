const STORAGE_KEY = 'golf_tracker_data';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rounds: [] };
    return JSON.parse(raw);
  } catch {
    return { rounds: [] };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function createEmptyHoles() {
  return Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    fairwayHit: null,
    approachDistance: '',
    club: '',
    penaltyStrokes: 0,
    putts: 2,
    score: null,
    fairwayShots: [],
    greenShots: [],
  }));
}
