import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', handicap: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name);
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 pt-safe"
      style={{ background: 'linear-gradient(160deg, #1B3A2A 0%, #0F2218 100%)' }}>
      <button onClick={() => navigate('/login')}
        className="text-white/60 text-sm mb-8 flex items-center gap-2 self-start">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-black text-white mb-1">Create Account</h1>
        <p className="text-white/50 text-sm mb-8">Join the Greystone member portal</p>
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Full Name *</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Mike K."
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50"/>
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Email *</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50"/>
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Password *</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50"/>
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Handicap Index (optional)</label>
            <input type="number" value={form.handicap} onChange={set('handicap')} placeholder="e.g. 8.4" step="0.1" min="0" max="54"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm tracking-widest uppercase mt-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{ background: '#E8682A' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
