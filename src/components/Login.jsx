import { useState } from 'react';
import { login } from '../api.js';
import HaloMark from './HaloMark.jsx';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
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
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your role password"
            className="w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
          />

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
