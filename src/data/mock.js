// Mock data for UI development — replace with Supabase queries
export const MOCK_USER = {
  id: 'user-1',
  name: 'Mike K.',
  initials: 'MK',
  handicap: 8.4,
  homeCourse: 'greystone',
  gamesPlayed: 14,
  wins: 7,
  losses: 5,
  ties: 2,
};

export const MOCK_PLAYERS = [
  { id: 'user-1', name: 'Mike K.',  initials: 'MK', handicap: 8.4  },
  { id: 'user-2', name: 'Dave R.',  initials: 'DR', handicap: 12.1 },
  { id: 'user-3', name: 'Tom S.',   initials: 'TS', handicap: 5.7  },
  { id: 'user-4', name: 'Jim B.',   initials: 'JB', handicap: 14.8 },
  { id: 'user-5', name: 'Rob M.',   initials: 'RM', handicap: 9.2  },
  { id: 'user-6', name: 'Scott D.', initials: 'SD', handicap: 18.3 },
  { id: 'user-7', name: 'Paul W.',  initials: 'PW', handicap: 11.6 },
  { id: 'user-8', name: 'Chris L.', initials: 'CL', handicap: 7.1  },
];

export const MOCK_GAMES = [
  {
    id: 'game-1',
    type: 'skins',
    date: '2025-06-21',
    course: 'Greystone',
    status: 'active',
    hole: 9,
    players: ['user-1', 'user-2', 'user-3', 'user-4'],
    pot: 45,
  },
  {
    id: 'game-2',
    type: 'nassau',
    date: '2025-06-19',
    course: 'Greystone',
    status: 'complete',
    players: ['user-1', 'user-3', 'user-5'],
    results: { 'user-1': +20, 'user-3': +10, 'user-5': -30 },
    winner: 'user-1',
  },
  {
    id: 'game-3',
    type: 'skins',
    date: '2025-06-15',
    course: 'Greystone',
    status: 'complete',
    players: ['user-1', 'user-2', 'user-4', 'user-6'],
    results: { 'user-1': -10, 'user-2': +35, 'user-4': -10, 'user-6': -15 },
    winner: 'user-2',
  },
  {
    id: 'game-4',
    type: 'wolf',
    date: '2025-06-08',
    course: 'Greystone',
    status: 'complete',
    players: ['user-1', 'user-2', 'user-3', 'user-5'],
    results: { 'user-1': +25, 'user-2': -15, 'user-3': +10, 'user-5': -20 },
    winner: 'user-1',
  },
];

export const MOCK_LEADERBOARD = [
  { player: MOCK_PLAYERS[1], games: 16, wins: 9, losses: 5, ties: 2, streak: 'hot' },
  { player: MOCK_PLAYERS[0], games: 14, wins: 7, losses: 5, ties: 2, streak: null },
  { player: MOCK_PLAYERS[2], games: 12, wins: 6, losses: 5, ties: 1, streak: null },
  { player: MOCK_PLAYERS[7], games: 10, wins: 5, losses: 4, ties: 1, streak: null },
  { player: MOCK_PLAYERS[4], games: 13, wins: 4, losses: 7, ties: 2, streak: 'cold' },
  { player: MOCK_PLAYERS[3], games: 11, wins: 4, losses: 6, ties: 1, streak: null },
  { player: MOCK_PLAYERS[6], games: 9,  wins: 3, losses: 5, ties: 1, streak: null },
  { player: MOCK_PLAYERS[5], games: 8,  wins: 2, losses: 6, ties: 0, streak: 'cold' },
];
