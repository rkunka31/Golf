import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/home/HomeScreen';
import GamesScreen from './screens/games/GamesScreen';
import NewGameScreen from './screens/games/NewGameScreen';
import ActiveGameScreen from './screens/games/ActiveGameScreen';
import GameResultsScreen from './screens/games/GameResultsScreen';
import StatsScreen from './screens/stats/StatsScreen';
import ProfileScreen from './screens/profile/ProfileScreen';

const HIDE_NAV = ['/login', '/register', '/games/new'];

function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV.includes(location.pathname) ||
    (location.pathname.startsWith('/games/') && location.pathname !== '/games/');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#EBEBEB]">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: hideNav ? 0 : 80 }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/games" element={<GamesScreen />} />
          <Route path="/games/new" element={<NewGameScreen />} />
          <Route path="/games/:id" element={<GameRouteSwitch />} />
          <Route path="/stats" element={<StatsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function GameRouteSwitch() {
  const location = useLocation();
  const params = location.pathname.split('/games/')[1];
  if (params === 'game-1') return <ActiveGameScreen />;
  return <GameResultsScreen />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#1B3A2A' }}>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return <AppShell />;
}
