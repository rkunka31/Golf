import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_GAMES, MOCK_LEADERBOARD, MOCK_PLAYERS } from '../../data/mock';

function Avatar({ initials, size = 'md', color = '#1B3A2A' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}>
      {initials}
    </div>
  );
}

function GameTypeChip({ type }) {
  const map = {
    skins:  { label: 'Skins',   bg: '#E8682A' },
    nassau: { label: 'Nassau',  bg: '#1B3A2A' },
    wolf:   { label: 'Wolf',    bg: '#7C3AED' },
    bestball: { label: 'Best Ball', bg: '#0891B2' },
  };
  const { label, bg } = map[type] || { label: type, bg: '#6B7280' };
  return (
    <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: bg }}>{label}</span>
  );
}

function ActiveGameCard({ game, onClick }) {
  const playerNames = game.players
    .map(id => MOCK_PLAYERS.find(p => p.id === id)?.name || id)
    .join(' · ');
  return (
    <button onClick={onClick}
      className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform">
      <div className="px-4 py-3" style={{ background: '#1B3A2A' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"/>
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Live · Hole {game.hole}</span>
          </div>
          <GameTypeChip type={game.type}/>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="font-bold text-[#0D1B14] text-base">{game.course}</p>
        <p className="text-[#6B7280] text-sm mt-0.5">{playerNames}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#6B7280]">Pot</span>
          <span className="font-black text-lg" style={{ color: '#E8682A' }}>${game.pot}</span>
        </div>
      </div>
    </button>
  );
}

function CompletedGameRow({ game }) {
  const myResult = game.results?.['user-1'] ?? 0;
  const won = myResult > 0;
  const tied = myResult === 0;
  const date = new Date(game.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: won ? '#dcfce7' : tied ? '#f3f4f6' : '#fee2e2' }}>
            <span className="text-lg">{won ? '🏆' : tied ? '🤝' : '📉'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <GameTypeChip type={game.type}/>
              <span className="text-[#6B7280] text-xs">{date}</span>
            </div>
            <p className="text-[#0D1B14] text-sm font-semibold mt-0.5">{game.course} · {game.players.length} players</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6B7280]">{won ? 'You won' : tied ? 'Tied' : 'You lost'}</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardMini({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-[#0D1B14] text-sm">2025 Season</span>
        <span className="text-[#6B7280] text-xs">Greystone</span>
      </div>
      {data.slice(0, 5).map((entry, i) => (
        <div key={entry.player.id} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
          <span className="text-sm font-bold text-[#6B7280] w-5 text-center">{i + 1}</span>
          <Avatar initials={entry.player.initials} size="sm"
            color={i === 0 ? '#ca8a04' : i === 1 ? '#6B7280' : i === 2 ? '#a16207' : '#1B3A2A'}/>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0D1B14] text-sm">{entry.player.name}</p>
            <p className="text-[#6B7280] text-xs">{entry.wins}W–{entry.losses}L{entry.ties > 0 ? `–${entry.ties}T` : ''}</p>
          </div>
          <div className="text-right flex items-center gap-1.5">
            {entry.streak === 'hot' && <span className="text-sm">🔥</span>}
            {entry.streak === 'cold' && <span className="text-sm">🥶</span>}
            <span className="text-sm font-bold text-[#0D1B14]">{entry.games}</span>
            <span className="text-xs text-[#6B7280]">gms</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomeScreen({ onNewGame }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeGame = MOCK_GAMES.find(g => g.status === 'active');
  const recentGames = MOCK_GAMES.filter(g => g.status === 'complete').slice(0, 3);
  const firstName = user?.name?.split(' ')[0] || 'Golfer';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-12 pb-5" style={{ background: '#1B3A2A' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Greystone</p>
            <h1 className="text-white text-xl font-black mt-0.5">{greeting}, {firstName}</h1>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{user?.initials || 'MK'}</span>
          </button>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <p className="text-white text-lg font-black">{user?.handicap ?? '8.4'}</p>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Handicap</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <p className="text-white text-lg font-black">{user?.gamesPlayed ?? 14}</p>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Games</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-center">
            <p className="text-white text-lg font-black">{user?.wins ?? 7}–{user?.losses ?? 5}</p>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Record</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5" style={{ background: '#EBEBEB' }}>
        {activeGame && (
          <section>
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2">Active Game</h2>
            <ActiveGameCard game={activeGame} onClick={() => navigate(`/games/${activeGame.id}`)}/>
          </section>
        )}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Season Standings</h2>
            <button onClick={() => navigate('/games?tab=leaderboard')}
              className="text-xs font-semibold" style={{ color: '#E8682A' }}>See all →</button>
          </div>
          <LeaderboardMini data={MOCK_LEADERBOARD}/>
        </section>
        {recentGames.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Recent Games</h2>
              <button onClick={() => navigate('/games')}
                className="text-xs font-semibold" style={{ color: '#E8682A' }}>See all →</button>
            </div>
            <div className="space-y-2">
              {recentGames.map(g => <CompletedGameRow key={g.id} game={g}/>)}
            </div>
          </section>
        )}
        <div className="h-20"/>
      </div>
    </div>
  );
}
