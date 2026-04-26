import { NavLink } from 'react-router-dom';

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const GamesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);
const StatsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const tabs = [
  { to: '/',        label: 'Home',    Icon: HomeIcon    },
  { to: '/games',   label: 'Games',   Icon: GamesIcon   },
  { to: '/stats',   label: 'Stats',   Icon: StatsIcon   },
  { to: '/profile', label: 'Profile', Icon: ProfileIcon },
];

export default function BottomNav({ onNew }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {tabs.map(({ to, label, Icon }, i) => {
          const isMiddle = i === 2;
          return (
            <div key={to} className={`flex flex-col items-center ${isMiddle ? 'relative -top-5' : ''}`}>
              {isMiddle && (
                <button
                  onClick={onNew}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg mb-1 active:scale-95 transition-transform"
                  style={{ background: '#1B3A2A' }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" stroke="none" fill="white" opacity="0.15"/>
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              )}
              <NavLink to={to} end={to === '/'} className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-[52px] ${isActive ? 'text-[#1B3A2A]' : 'text-gray-400'}`
              }>
                {({ isActive }) => (
                  <>
                    <Icon />
                    <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-[#1B3A2A]' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
