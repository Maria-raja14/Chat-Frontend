import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendOtp } from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await sendOtp({ email });
      alert(`For testing purposes, your OTP is: ${response.code}`);
      navigate('/otp', { 
        state: { 
          registrationData: { username, email, password, displayName }
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0B0F19] flex items-center justify-center px-4 py-10 text-slate-100 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/5 bg-white/[0.02] p-10 shadow-2xl backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 mb-6 shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-sm text-slate-400">Join ChatApp to connect with your friends instantly.</p>
        </div>

        <form className="grid gap-5" onSubmit={handleRequestOtp}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                type="text"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
