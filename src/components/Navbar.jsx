import { isDemoMode } from '../api.js';
import HaloMark from './HaloMark.jsx';

export default function Navbar({ view, setView, role, onLogout, onRefresh }) {
  const isEditor = role === 'spinframe';
  return (
    <header className="sticky top-0 z-[1100] border-b border-navy-700 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        {/* Brand — the "Halo" system identity, co-branded with Qube */}
        <div className="flex items-center gap-2.5">
          <HaloMark className="h-6 w-6" />
          <span className="text-base font-semibold tracking-wide text-white">
            Halo
          </span>
          <span className="hidden h-5 w-px bg-navy-600 sm:block" />
          <img
            src="/brand/qube.svg"
            alt="Qube Holdings"
            className="hidden h-4 w-auto sm:block"
          />
        </div>

        {/* View tabs */}
        <nav className="ml-1 flex items-center gap-1 rounded-lg bg-navy-950 p-1">
          <TabButton active={view === 'table'} onClick={() => setView('table')}>
            Table
          </TabButton>
          <TabButton active={view === 'gantt'} onClick={() => setView('gantt')}>
            Gantt
          </TabButton>
          <TabButton active={view === 'map'} onClick={() => setView('map')}>
            Map
          </TabButton>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {isDemoMode() && (
            <span className="hidden rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/30 sm:inline">
              Demo mode
            </span>
          )}

          <span
            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 sm:inline-flex ${
              isEditor
                ? 'bg-accent/15 text-accent ring-accent/30'
                : 'bg-navy-700 text-slate-300 ring-navy-600'
            }`}
          >
            {isEditor ? 'Spinframe · Editor' : 'Qube · Viewer'}
          </span>

          <button
            onClick={onRefresh}
            title="Refresh data"
            aria-label="Refresh data"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-navy-600 text-slate-300 transition hover:bg-navy-800 [touch-action:manipulation]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-10 w-10 items-center justify-center whitespace-nowrap rounded-lg border border-navy-600 text-sm text-slate-300 transition hover:bg-navy-800 [touch-action:manipulation] sm:w-auto sm:px-3"
          >
            <svg className="sm:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
        active
          ? 'bg-navy-700 text-white shadow'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
