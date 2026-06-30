import { useEffect, useState } from 'react';
import { PORTS, STATUSES } from '../constants.js';
import { toDateInput, formatTimestamp } from '../utils.js';

// Slide-over panel for adding or editing a solution. Editor (Spinframe) only.
export default function EditorPanel({ open, solution, onClose, onSave }) {
  const isNew = !solution || !solution['Solution ID'];
  const [form, setForm] = useState(blank());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm({
        Port: solution?.Port || PORTS[0],
        Depot: solution?.Depot || '',
        'Solution ID': solution?.['Solution ID'] || '',
        'Solution Name': solution?.['Solution Name'] || '',
        Status: solution?.Status || STATUSES[0],
        'Expected Operational Date': toDateInput(
          solution?.['Expected Operational Date']
        ),
        Notes: solution?.Notes || '',
        'Last Updated': solution?.['Last Updated'] || '',
      });
    }
  }, [open, solution]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setError('');
    if (!form['Solution Name'].trim()) {
      setError('Solution name is required.');
      return;
    }
    if (!PORTS.includes(form.Port)) {
      setError('Please choose a valid port.');
      return;
    }
    setBusy(true);
    try {
      await onSave(form, isNew);
      onClose();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={open ? onClose : undefined}
        className={`fixed inset-0 z-[1200] bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Add solution' : 'Edit solution'}
        className={`fixed right-0 top-0 z-[1300] flex h-full w-full max-w-md flex-col border-l border-navy-700 bg-navy-900 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isNew ? 'Add Solution' : 'Edit Solution'}
            </h2>
            {!isNew && (
              <p className="text-xs text-slate-500">{form['Solution ID']}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-navy-800 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Field label="Port">
            <select
              value={form.Port}
              onChange={(e) => set('Port', e.target.value)}
              className={inputCls}
            >
              {PORTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Depot">
            <input
              type="text"
              value={form.Depot}
              onChange={(e) => set('Depot', e.target.value)}
              placeholder="e.g. North Depot"
              className={inputCls}
            />
          </Field>

          <Field label="Solution Name">
            <input
              type="text"
              value={form['Solution Name']}
              onChange={(e) => set('Solution Name', e.target.value)}
              placeholder="e.g. Automated Tarp Spreader"
              className={inputCls}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.Status}
              onChange={(e) => set('Status', e.target.value)}
              className={inputCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Expected Operational Date">
            <input
              type="date"
              value={form['Expected Operational Date']}
              onChange={(e) => set('Expected Operational Date', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={4}
              value={form.Notes}
              onChange={(e) => set('Notes', e.target.value)}
              placeholder="Add a note about this solution…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          {!isNew && form['Last Updated'] && (
            <p className="text-xs tabular-nums text-slate-500">
              Last updated {formatTimestamp(form['Last Updated'])}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-navy-700 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-navy-950 transition hover:bg-accent-dark disabled:opacity-50"
          >
            {busy ? 'Saving…' : isNew ? 'Add Solution' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </>
  );
}

const inputCls =
  'w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function blank() {
  return {
    Port: PORTS[0],
    Depot: '',
    'Solution ID': '',
    'Solution Name': '',
    Status: STATUSES[0],
    'Expected Operational Date': '',
    Notes: '',
    'Last Updated': '',
  };
}
