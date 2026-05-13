import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { register, verifyOtp } from '../api.js';
import { saveAuth } from '../utils/auth.js';

export default function OTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registrationData = location.state?.registrationData;

  useEffect(() => {
    if (!registrationData || !registrationData.email) {
      navigate('/register');
    }
  }, [registrationData, navigate]);

  async function handleVerifyAndRegister(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp({ email: registrationData.email, code: otp });
      const data = await register(registrationData);
      saveAuth(data);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification or Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!registrationData) return null;

  return (
    <div className="relative min-h-screen bg-[#0B0F19] flex items-center justify-center px-4 py-10 text-slate-100 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/5 bg-white/[0.02] p-10 shadow-2xl backdrop-blur-3xl animate-[fadeIn_0.5s_ease-out]">
        <div className="mb-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 mb-6 shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Verify your email</h1>
          <p className="text-sm text-slate-400">
            We've sent an OTP to <span className="font-medium text-cyan-400">{registrationData.email}</span>. Please enter it below.
          </p>
        </div>

        <form className="grid gap-6" onSubmit={handleVerifyAndRegister}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              One-Time Password
            </label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="Enter 6-digit code"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Complete Registration'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full text-sm font-medium text-slate-400 hover:text-white transition"
          >
            Change email address
          </button>
        </form>
      </div>
    </div>
  );
}
