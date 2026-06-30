import { useEffect, useMemo, useState } from 'react';
import { getGantt, isDemoMode } from '../api.js';

// Read-only mirror of the "Gantt" tab in the Google Sheet — reproduces the
// chart's cells, colours and merged bars exactly as they appear in the sheet.
export default function GanttView() {
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getGantt()
      .then((g) => active && setGrid(g))
      .catch((e) => active && setError(e.message || 'Failed to load Gantt'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Rollout Gantt</h2>
        <p className="text-sm text-slate-400">
          Live mirror of the “Gantt” tab in the Google Sheet
          {isDemoMode() ? ' · demo data' : ''}
        </p>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-navy-700 bg-navy-900" />
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : !grid || !grid.rows || grid.rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-navy-600 bg-navy-900 p-12 text-center">
          <p className="text-slate-300">The Gantt tab looks empty.</p>
          <p className="mt-1 text-sm text-slate-500">
            Add rows to the “Gantt” sheet and they’ll appear here.
          </p>
        </div>
      ) : (
        <GanttGrid grid={grid} />
      )}
    </div>
  );
}

function GanttGrid({ grid }) {
  const { rows, merges, colCount } = grid;

  // Map merges to anchor spans + the set of cells they cover (to skip).
  const { covered, spanAt } = useMemo(() => {
    const covered = new Set();
    const spanAt = new Map();
    for (const m of merges || []) {
      spanAt.set(`${m.r1}:${m.c1}`, { cols: m.c2 - m.c1, rows: m.r2 - m.r1 });
      for (let r = m.r1; r < m.r2; r++) {
        for (let c = m.c1; c < m.c2; c++) {
          if (!(r === m.r1 && c === m.c1)) covered.add(`${r}:${c}`);
        }
      }
    }
    return { covered, spanAt };
  }, [merges]);

  // First three columns (Unit ID / Depot / Assigned Site) stay frozen.
  const STICKY = 3;
  const colW = (c) => (c === 0 ? 132 : c === 1 ? 96 : c === 2 ? 116 : 34);
  const leftOffset = (c) => {
    let x = 0;
    for (let i = 0; i < c; i++) x += colW(i);
    return x;
  };

  return (
    <div
      className="overflow-auto rounded-xl border border-navy-700 bg-white"
      style={{ maxHeight: '76vh' }}
    >
      <table
        className="border-collapse text-[11px] text-slate-800"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          {Array.from({ length: colCount }).map((_, c) => (
            <col key={c} style={{ width: colW(c) }} />
          ))}
        </colgroup>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                if (covered.has(`${r}:${c}`)) return null;
                const span = spanAt.get(`${r}:${c}`);
                const sticky = c < STICKY;
                return (
                  <td
                    key={c}
                    colSpan={span?.cols}
                    rowSpan={span?.rows}
                    title={cell.v || undefined}
                    style={{
                      background: cell.bg || '#ffffff',
                      color: cell.fg || '#1f2937',
                      fontWeight: cell.b ? 700 : 400,
                      textAlign:
                        cell.a === 'CENTER'
                          ? 'center'
                          : cell.a === 'RIGHT'
                            ? 'right'
                            : 'left',
                      border: '1px solid #e2e8f0',
                      padding: '3px 6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      position: sticky ? 'sticky' : undefined,
                      left: sticky ? leftOffset(c) : undefined,
                      zIndex: sticky ? 2 : undefined,
                    }}
                  >
                    {cell.v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
