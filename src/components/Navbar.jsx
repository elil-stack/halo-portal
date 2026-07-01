import { isDemoMode } from '../api.js';
import HaloMark from './HaloMark.jsx';

export default function Navbar({ view, setView, role, onLogout, onRefresh }) {
  const isEditor = role === 'spinframe';
  return (
    <header className="sticky top-0 z-[1100] border-b border-navy-700 bg-navy-900/95 backdrop-blur">
      {/* On phones this wraps to two rows: brand + Qube + icons on top, the
          view tabs as a full-width row below. Single row from sm up. */}
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-3 lg:px-8">
        {/* Brand — the "Halo" system identity, co-branded with Qube */}
        <div className="order-1 flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <HaloMark className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
          <span className="text-sm font-semibold tracking-wide text-white sm:text-base">
            Halo
          </span>
          <span className="h-4 w-px shrink-0 bg-navy-600 sm:h-5" />
          <img
            src="/brand/qube.svg"
            alt="Qube Holdings"
            className="h-3.5 w-auto shrink-0 sm:h-4"
          />
        </div>

        {/* View tabs — own full-width row on phones, inline from sm up */}
        <nav className="order-3 flex w-full items-center gap-0.5 rounded-lg bg-navy-950 p-1 sm:order-2 sm:ml-1 sm:w-auto sm:gap-1">
          <TabButton active={view === 'table'} onClick={() => setView('table')}>
            Table
          </TabButton>
          <TabButton active={view === 'map'} onClick={() => setView('map')}>
            Map
          </TabButton>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:gap-3">
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
      className={`flex-1 rounded-md px-2.5 py-1.5 text-center text-sm font-medium transition sm:flex-none sm:px-3 ${
        active
          ? 'bg-navy-700 text-white shadow'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
