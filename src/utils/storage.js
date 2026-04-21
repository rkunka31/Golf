const STORAGE_KEY = 'golf_tracker_data';
const DATA_VERSION = 2;

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rounds: [], version: DATA_VERSION };
    const data = JSON.parse(raw);
    if (!data.version || data.version < DATA_VERSION) {
      // v2: clear greenShots — old coordinate system (100x100, green at 50,50) is incompatible
      const migrated = {
        ...data,
        version: DATA_VERSION,
        rounds: (data.rounds || []).map(round => ({
          ...round,
          holes: (round.holes || []).map(hole => ({ ...hole, greenShots: [] })),
        })),
      };
      saveData(migrated);
      return migrated;
    }
    return data;
  } catch {
    return { rounds: [], version: DATA_VERSION };
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
