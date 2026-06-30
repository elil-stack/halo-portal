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
          {/* Portrait phones (< 640px): fixed layout — the first 4 columns fit
              the screen and the rest are reached by scrolling right. Larger
              widths (landscape, tablet, desktop) show all 8 columns at once. */}
          <table className="w-[780px] table-fixed border-collapse text-[13px] sm:w-full sm:table-auto sm:text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left text-[10px] uppercase tracking-normal text-slate-500 sm:text-xs sm:tracking-wide">
                <Th className="w-[9.5%] sm:w-auto">ID</Th>
                <Th className="w-[13%] sm:w-auto">Status</Th>
                <Th className="w-[10%] sm:w-auto">Name</Th>
                <Th className="w-[11%] sm:w-auto">Port</Th>
                <Th className="w-[12%] sm:w-auto">Depot</Th>
                <Th className="w-[16%] sm:w-auto">Expected Operational Date</Th>
                <Th className="w-[14%] sm:w-auto">Notes</Th>
                <Th className="w-[14.5%] sm:w-auto">Last Updated</Th>
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
                      className="truncate px-2 py-3 font-mono text-[11px] text-slate-400 lg:px-4 sm:text-xs"
                      title={row['Solution ID'] || ''}
                    >
                      {row['Solution ID'] || '—'}
                    </td>
                    <td className="px-2 py-3 lg:px-4">
                      <StatusBadge status={row.Status} size="xs" />
                    </td>
                    <td className="break-words px-2 py-3 text-slate-200 lg:px-4">
                      {row['Solution Name'] || '—'}
                    </td>
                    <td className="break-words px-2 py-3 font-medium text-white lg:px-4">
                      {row.Port}
                    </td>
                    <td className="break-words px-2 py-3 text-slate-300 lg:px-4">
                      {row.Depot || '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 tabular-nums text-slate-300 lg:px-4">
                      {formatDate(row['Expected Operational Date'])}
                    </td>
                    <td className="max-w-[150px] px-2 py-3 text-slate-400 lg:max-w-[720px] lg:px-4">
                      <span
                        className="block truncate lg:whitespace-normal lg:break-words"
                        title={row.Notes || ''}
                      >
                        {row.Notes || '—'}
                      </span>
                    </td>
                    <td
                      className="whitespace-nowrap px-2 py-3 tabular-nums text-slate-400 lg:px-4"
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
    <th className={`px-2 py-3 align-bottom font-medium lg:whitespace-nowrap lg:px-4 ${className}`}>
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
