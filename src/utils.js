// Small shared formatting / date helpers.

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Format an ISO date (or date string) as e.g. "12 Mar 2026".
export function formatDate(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format a full timestamp as e.g. "12 Mar 2026, 3:42 pm".
export function formatTimestamp(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Relative "x days ago" style string for Last Updated chips.
export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return '—';
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

// Convert an ISO datetime to a yyyy-mm-dd string for <input type="date">.
export function toDateInput(value) {
  const d = parseDate(value);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}
