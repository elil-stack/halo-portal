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
          {/* Columns 1–4 always show; the rest reveal as the screen widens.
              Below tablet width the table is fixed-layout with proportional
              columns that wrap, so phones never scroll sideways. */}
          <table className="w-full table-fixed border-collapse text-[13px] md:table-auto md:text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <Th className="w-[22%] md:w-auto">Solution ID</Th>
                <Th className="w-[28%] md:w-auto">Status</Th>
                <Th className="w-[25%] md:w-auto">Solution Name</Th>
                <Th className="w-[25%] md:w-auto">Port</Th>
                <Th className="hidden md:table-cell">Expected Operational</Th>
                <Th className="hidden lg:table-cell">Notes</Th>
                <Th className="hidden lg:table-cell">Last Updated</Th>
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
                    <td
                      className="truncate px-2 py-3 font-mono text-[11px] text-slate-400 sm:px-4 sm:text-xs"
                      title={row['Solution ID'] || ''}
                    >
                      {row['Solution ID'] || '—'}
                    </td>
                    <td className="px-2 py-3 sm:px-4">
                      <StatusBadge status={row.Status} size="sm" />
                    </td>
                    <td className="break-words px-2 py-3 text-slate-200 sm:px-4">
                      {row['Solution Name'] || '—'}
                    </td>
                    <td className="break-words px-2 py-3 font-medium text-white sm:px-4">
                      {row.Port}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums text-slate-300 sm:px-4 md:table-cell">
                      {formatDate(row['Expected Operational Date'])}
                    </td>
                    <td className="hidden max-w-[280px] px-3 py-3 text-slate-400 sm:px-4 lg:table-cell">
                      <span className="block truncate" title={row.Notes || ''}>
                        {row.Notes || '—'}
                      </span>
                    </td>
                    <td
                      className="hidden whitespace-nowrap px-3 py-3 tabular-nums text-slate-400 sm:px-4 lg:table-cell"
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

function Th({ children, className = '' }) {
  return (
    <th className={`px-2 py-3 align-bottom font-medium sm:px-4 md:whitespace-nowrap ${className}`}>
      {children}
    </th>
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
