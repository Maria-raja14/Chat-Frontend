import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api.js';
import { saveAuth, isLoggedIn } from '../utils/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn()) {
    navigate('/chat');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      saveAuth(data);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-8 space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Premium chat</p>
          <h1 className="text-4xl font-semibold text-slate-50">Welcome back</h1>
          <p className="max-w-xl text-sm leading-7 text-slate-400">Sign in to access secure messaging, live contacts, and encrypted conversations with a premium look and feel.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>

          {error && <div className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-100">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
