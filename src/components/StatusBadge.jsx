import { STATUS_COLORS } from '../constants.js';

// A small coloured pill showing a status label.
export default function StatusBadge({ status, size = 'md' }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {status || 'Unknown'}
    </span>
  );
}
