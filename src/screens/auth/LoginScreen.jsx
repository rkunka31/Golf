import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 pt-safe"
      style={{ background: 'linear-gradient(160deg, #1B3A2A 0%, #0F2218 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 400 500" className="absolute bottom-0 right-0 w-72 opacity-[0.07]" fill="white">
          <path d="M280 400 C280 400 260 350 255 300 C250 250 270 220 265 180 C260 140 240 120 235 100
                   C230 80 235 60 230 40 L220 40 C218 55 210 75 212 95 C214 115 230 135 232 175
                   C234 215 215 245 218 295 C221 345 240 395 240 400 Z
                   M230 40 L228 10 C228 5 232 0 237 0 C242 0 246 5 246 10 L244 40 Z"/>
          <ellipse cx="237" cy="400" rx="60" ry="8" opacity="0.5"/>
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full">
        <div className="mb-2">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke="white" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="26" cy="20" r="10" stroke="white" strokeWidth="1.5"/>
            <circle cx="26" cy="20" r="3" fill="white"/>
            <line x1="26" y1="30" x2="26" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="18" y1="44" x2="34" y2="44" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black tracking-widest text-white uppercase">Greystone</h1>
        <p className="text-white/50 text-sm tracking-wider uppercase">Member Portal</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSignIn} className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50"
            autoComplete="email"/>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/50"
            autoComplete="current-password"/>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm tracking-widest uppercase disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{ background: '#E8682A' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <button onClick={() => navigate('/register')}
          className="w-full py-4 rounded-2xl font-bold text-white/70 text-sm tracking-widest uppercase border border-white/20 active:bg-white/10">
          Create Account
        </button>
      </div>

      <p className="text-white/25 text-xs mt-8">Greystone Golf & Country Club · Milton, ON</p>
    </div>
  );
}
