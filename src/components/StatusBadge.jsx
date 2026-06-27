import { STATUS_COLORS } from '../constants.js';

// A small coloured pill showing a status label.
export default function StatusBadge({ status, size = 'md' }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const pad =
    size === 'xs'
      ? 'gap-1 px-1.5 py-0.5 text-[10px]'
      : size === 'sm'
        ? 'gap-1.5 px-2 py-0.5 text-[11px]'
        : 'gap-1.5 px-2.5 py-1 text-xs';
  const dot = size === 'xs' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-medium ${pad}`}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      <span
        className={`inline-block shrink-0 rounded-full ${dot}`}
        style={{ backgroundColor: color }}
      />
      {status || 'Unknown'}
    </span>
  );
}
