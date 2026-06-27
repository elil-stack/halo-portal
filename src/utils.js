// Small shared formatting / date helpers.

// Parse a date value into a Date. Numeric slash/dash dates are read as
// day-first (Australian DD/MM/YYYY), since JavaScript's default `new Date()`
// would otherwise misread them as US MM/DD/YYYY and swap day & month.
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const str = String(value).trim();

  // ISO (yyyy-mm-dd or a full ISO timestamp) — already unambiguous.
  if (/^\d{4}-\d{1,2}-\d{1,2}([T ]|$)/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Day-first numeric: d/m/yyyy, dd-mm-yyyy, d.m.yy, etc.
  const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let day = parseInt(m[1], 10);
    let month = parseInt(m[2], 10);
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Fallback for any other recognisable format.
  const d = new Date(str);
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

// Convert a date value to a yyyy-mm-dd string for <input type="date">.
// Uses local date parts (not toISOString) so the day can't shift by one in
// timezones ahead of UTC, e.g. Australia.
export function toDateInput(value) {
  const d = parseDate(value);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
