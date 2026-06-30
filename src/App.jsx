import { useCallback, useEffect, useState } from 'react';
import { getRows, addRow, updateRow, restoreSession, clearSession } from './api.js';
import { STATUSES } from './constants.js';
import Login from './components/Login.jsx';
import Navbar from './components/Navbar.jsx';
import TableView from './components/TableView.jsx';
import GanttView from './components/GanttView.jsx';
import MapView from './components/MapView.jsx';
import EditorPanel from './components/EditorPanel.jsx';
import Footer from './components/Footer.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

export default function App() {
  // Restore a saved session so a page refresh keeps the user signed in.
  const [role, setRole] = useState(() => restoreSession()); // 'spinframe' | 'qube' | null
  const [view, setView] = useState('table');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editor panel state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Map status filter
  const [activeStatuses, setActiveStatuses] = useState(STATUSES);

  const canEdit = role === 'spinframe';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRows();
      setRows(data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role) load();
  }, [role, load]);

  function handleLogout() {
    clearSession();
    setRole(null);
    setRows([]);
    setEditorOpen(false);
  }

  function openAdd() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setEditorOpen(true);
  }

  async function handleSave(form, isNew) {
    const saved = isNew ? await addRow(form) : await updateRow(form);
    setRows((prev) => {
      const idx = prev.findIndex(
        (r) => r['Solution ID'] === saved['Solution ID']
      );
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  function toggleStatus(status) {
    setActiveStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }

  if (!role) {
    return (
      <>
        <Login onLogin={(res) => setRole(res.role)} />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar
        view={view}
        setView={setView}
        role={role}
        onLogout={handleLogout}
        onRefresh={load}
      />

      <main className="mx-auto max-w-[1800px] px-4 py-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {loading ? 'Loading…' : `${rows.length} solutions`}
          </p>
          {canEdit && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-navy-950 transition hover:bg-accent-dark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add Solution
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={load}
              className="rounded border border-red-500/40 px-2 py-1 text-xs hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {loading && rows.length === 0 ? (
          <LoadingSkeleton />
        ) : view === 'table' ? (
          <TableView rows={rows} canEdit={canEdit} onEdit={openEdit} />
        ) : view === 'gantt' ? (
          <GanttView rows={rows} canEdit={canEdit} onEdit={openEdit} />
        ) : (
          <MapView
            rows={rows}
            activeStatuses={activeStatuses}
            onToggleStatus={toggleStatus}
          />
        )}
      </main>

      <Footer />

      {canEdit && (
        <EditorPanel
          open={editorOpen}
          solution={editing}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
        />
      )}

      <InstallPrompt />
    </div>
  );
}

// Skeleton placeholder shown while the first load is in flight.
function LoadingSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading solutions"
    >
      <div className="h-6 w-48 animate-pulse rounded bg-navy-800" />
      <div className="overflow-hidden rounded-xl border border-navy-700 bg-navy-900">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-navy-800 px-4 py-4 last:border-b-0"
          >
            <div className="h-10 w-52 shrink-0 animate-pulse rounded bg-navy-800" />
            <div
              className="h-6 animate-pulse rounded bg-navy-800"
              style={{ width: `${30 + ((i * 13) % 50)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
