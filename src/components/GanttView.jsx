import { useMemo } from 'react';
import { STATUS_COLORS } from '../constants.js';
import { parseDate, formatDate, timeAgo } from '../utils.js';
import StatusBadge from './StatusBadge.jsx';
import StatusLegend from './StatusLegend.jsx';

const DAY = 86400000;

export default function GanttView({ rows, canEdit, onEdit }) {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Each solution becomes a bar spanning Last Updated -> Expected Operational.
  const bars = useMemo(() => {
    return rows.map((r) => {
      let start = parseDate(r['Last Updated']) || today;
      let end = parseDate(r['Expected Operational Date']) || addDays(start, 30);
      start = startOfDay(start);
      end = startOfDay(end);
      if (end < start) end = addDays(start, 1);
      return { row: r, start, end };
    });
  }, [rows, today]);

  const { domainStart, domainEnd } = useMemo(() => {
    if (bars.length === 0) {
      return { domainStart: addDays(today, -15), domainEnd: addDays(today, 45) };
    }
    let min = bars[0].start;
    let max = bars[0].end;
    for (const b of bars) {
      if (b.start < min) min = b.start;
      if (b.end > max) max = b.end;
    }
    if (today < min) min = today;
    if (today > max) max = today;
    return { domainStart: addDays(min, -10), domainEnd: addDays(max, 10) };
  }, [bars, today]);

  const totalMs = Math.max(domainEnd - domainStart, DAY);
  const pct = (date) => ((date - domainStart) / totalMs) * 100;

  const months = useMemo(
    () => monthTicks(domainStart, domainEnd),
    [domainStart, domainEnd]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Rollout Timeline</h2>
          <p className="text-sm text-slate-400">
            {rows.length} solution{rows.length === 1 ? '' : 's'} across all ports
          </p>
        </div>
        <StatusLegend />
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-700 bg-navy-900">
          <div className="min-w-[760px]">
            {/* Month header */}
            <div className="flex border-b border-navy-700">
              <div className="w-60 shrink-0 border-r border-navy-700 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Solution
              </div>
              <div className="relative h-9 flex-1">
                {months.map((m) => (
                  <div
                    key={m.date.toISOString()}
                    className="absolute top-0 flex h-full items-center border-l border-navy-700/70 pl-2 text-[11px] tabular-nums text-slate-400"
                    style={{ left: `${pct(m.date)}%` }}
                  >
                    {m.label}
                  </div>
                ))}
                {/* TODAY marker lives in the header band so it never overlaps
                    row content; the vertical line below shares its x position. */}
                {pct(today) >= 0 && pct(today) <= 100 && (
                  <div
                    className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pct(today)}%` }}
                  >
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-navy-950">
                      TODAY
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              {/* Today line — offset past the 15rem label column, then
                  positioned by fraction across the remaining timeline area */}
              {pct(today) >= 0 && pct(today) <= 100 && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-accent/70"
                  style={{ left: `calc(15rem + (100% - 15rem) * ${pct(today) / 100})` }}
                />
              )}

              {bars.map(({ row, start, end }, i) => {
                const color = STATUS_COLORS[row.Status] || '#6b7280';
                const left = pct(start);
                const width = Math.max(pct(end) - left, 1.2);
                const clickable = canEdit;
                return (
                  <div
                    key={row['Solution ID'] || i}
                    className="flex items-stretch border-b border-navy-800 last:border-b-0 hover:bg-navy-800/40"
                  >
                    {/* Label column */}
                    <div className="w-60 shrink-0 border-r border-navy-700 px-4 py-3">
                      <div className="truncate text-sm font-medium text-white">
                        {row['Solution Name'] || 'Untitled'}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                        <span>{row.Port}</span>
                        {row['Solution ID'] && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {row['Solution ID']}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <StatusBadge status={row.Status} size="sm" />
                      </div>
                    </div>

                    {/* Timeline cell */}
                    <div className="relative flex-1 py-3">
                      <div className="relative h-7">
                        <button
                          type="button"
                          onClick={() => clickable && onEdit(row)}
                          disabled={!clickable}
                          title={
                            clickable
                              ? 'Click to edit'
                              : `${row['Solution Name']} — ${row.Status}`
                          }
                          className={`group absolute top-0 flex h-7 items-center rounded-md px-2 text-[11px] font-medium text-white shadow-sm ring-1 ring-black/20 transition ${
                            clickable ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            minWidth: 14,
                            backgroundColor: color,
                          }}
                        >
                          <span className="truncate">{row.Status}</span>
                        </button>
                        {/* Expected date label trailing the bar */}
                        <span
                          className="pointer-events-none absolute top-1 whitespace-nowrap pl-1 text-[10px] tabular-nums text-slate-400"
                          style={{ left: `calc(${left + width}% + 2px)` }}
                        >
                          {formatDate(row['Expected Operational Date'])}
                        </span>
                      </div>
                      <div className="mt-1 pl-1 text-[10px] tabular-nums text-slate-500">
                        Updated {timeAgo(row['Last Updated'])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block h-3 w-px bg-accent" />
        Vertical line marks today ({formatDate(today)}). Bars run from last update
        to expected operational date.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-navy-600 bg-navy-900 p-12 text-center">
      <p className="text-slate-300">No solutions yet.</p>
      <p className="mt-1 text-sm text-slate-500">
        Spinframe editors can add the first solution from the button above the views.
      </p>
    </div>
  );
}

// ── date helpers ────────────────────────────────────────────────────────
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  return new Date(d.getTime() + n * DAY);
}
function monthTicks(start, end) {
  const ticks = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  if (d < start) d.setMonth(d.getMonth() + 1);
  while (d <= end) {
    ticks.push({
      date: new Date(d),
      label: d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}
