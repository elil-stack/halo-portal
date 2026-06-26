import { useMemo } from 'react';
import { PORTS } from '../constants.js';
import { formatDate, timeAgo, formatTimestamp } from '../utils.js';
import StatusBadge from './StatusBadge.jsx';

// Default view: a plain table of every solution with all sheet columns.
export default function TableView({ rows, canEdit, onEdit }) {
  // Group by port (in the canonical port order), then by solution name.
  const sorted = useMemo(() => {
    const portIndex = (p) => {
      const i = PORTS.indexOf(p);
      return i === -1 ? PORTS.length : i;
    };
    return [...rows].sort((a, b) => {
      const d = portIndex(a.Port) - portIndex(b.Port);
      if (d !== 0) return d;
      return (a['Solution Name'] || '').localeCompare(b['Solution Name'] || '');
    });
  }, [rows]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Rollout Overview</h2>
        <p className="text-sm text-slate-400">
          {rows.length} solution{rows.length === 1 ? '' : 's'} across all ports
          {canEdit ? ' · click a row to edit' : ''}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-700 bg-navy-900">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <Th>Port</Th>
                <Th>Solution ID</Th>
                <Th>Solution Name</Th>
                <Th>Status</Th>
                <Th>Expected Operational</Th>
                <Th>Notes</Th>
                <Th>Last Updated</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const clickable = canEdit;
                return (
                  <tr
                    key={row['Solution ID'] || i}
                    onClick={() => clickable && onEdit(row)}
                    className={`border-b border-navy-800 align-top last:border-b-0 ${
                      clickable ? 'cursor-pointer hover:bg-navy-800/50' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                      {row.Port}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                      {row['Solution ID'] || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {row['Solution Name'] || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.Status} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-300">
                      {formatDate(row['Expected Operational Date'])}
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-slate-400">
                      <span className="block truncate" title={row.Notes || ''}>
                        {row.Notes || '—'}
                      </span>
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-400"
                      title={formatTimestamp(row['Last Updated'])}
                    >
                      {timeAgo(row['Last Updated'])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 font-medium">{children}</th>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-navy-600 bg-navy-900 p-12 text-center">
      <p className="text-slate-300">No solutions yet.</p>
      <p className="mt-1 text-sm text-slate-500">
        Spinframe editors can add the first solution with the button above.
      </p>
    </div>
  );
}
