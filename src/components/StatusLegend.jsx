import { STATUSES, STATUS_COLORS } from '../constants.js';

// Horizontal legend of status -> colour. Optionally interactive (toggle).
export default function StatusLegend({ active, onToggle }) {
  const interactive = typeof onToggle === 'function';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {STATUSES.map((s) => {
        const on = !interactive || active?.includes(s);
        return (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onToggle(s)}
            className={`flex items-center gap-1.5 text-xs transition ${
              interactive ? 'cursor-pointer' : 'cursor-default'
            } ${on ? 'opacity-100' : 'opacity-35'}`}
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: STATUS_COLORS[s] }}
            />
            <span className="text-slate-300">{s}</span>
          </button>
        );
      })}
    </div>
  );
}
