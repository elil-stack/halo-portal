import { useState } from 'react';
import { login } from '../api.js';
import HaloMark from './HaloMark.jsx';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await login(password);
      onLogin(result);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <HaloMark className="h-9 w-9" />
            <span className="text-3xl font-semibold tracking-wide text-white">
              Halo
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Vehicle rollout tracking across Qube's Australian ports
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-xl"
        >
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your role password"
              className="w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2.5 pr-11 text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-200"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-navy-950 transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Spinframe sign-in can edit · Qube sign-in is read-only
          </p>
        </form>

        {/* Co-branding */}
        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] uppercase tracking-wide text-slate-500">
          <span>Built by</span>
          <img
            src="/brand/spinframe-white.png"
            alt="Spinframe"
            className="h-5 w-auto"
          />
          <span className="text-slate-600">·</span>
          <span>for</span>
          <img
            src="/brand/qube.svg"
            alt="Qube Holdings"
            className="h-4 w-auto"
          />
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.5M6.6 6.6A13.2 13.2 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 3.06-.53M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
