// API client for the Spinframe Portal.
//
// Talks to the Vercel serverless functions in /api. When those functions are
// not available (e.g. running plain `vite` with no backend), it transparently
// falls back to a localStorage-backed "demo mode" seeded with sample data so
// the UI is fully explorable without Google credentials.

import { PORTS, STATUSES } from './constants.js';

let demoMode = false;
let editorPassword = null; // used for write auth headers

export function isDemoMode() {
  return demoMode;
}

// ── session persistence ─────────────────────────────────────────────────
// Kept in sessionStorage so a page refresh keeps the user signed in (within
// the same tab). It clears when the tab/browser closes, so edit access isn't
// left open indefinitely.
const SESSION_KEY = 'halo_session';

function persistSession(role) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ role, password: editorPassword, demo: demoMode })
    );
  } catch {
    /* storage unavailable — degrade to in-memory only */
  }
}

// Restore a previous session on app load. Returns the role, or null.
export function restoreSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.role) return null;
    demoMode = Boolean(s.demo);
    editorPassword = s.password || null;
    return s.role;
  } catch {
    return null;
  }
}

export function clearSession() {
  editorPassword = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// ── low-level fetch that detects a missing backend ────────────────────────
async function callApi(path, options = {}) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    // Network failure -> no backend reachable.
    throw { __demo: true };
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // Dev server returned the SPA index.html -> no serverless backend.
    throw { __demo: true };
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// ── auth ──────────────────────────────────────────────────────────────────
export async function login(password) {
  try {
    const { res, data } = await callApi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      demoMode = false;
      editorPassword = data.role === 'spinframe' ? password : null;
      persistSession(data.role);
      return { role: data.role };
    }
    throw new Error(data.error || 'Login failed');
  } catch (e) {
    if (e && e.__demo) {
      return demoLogin(password);
    }
    throw e;
  }
}

function demoLogin(password) {
  demoMode = true;
  if (password === 'spinframe') {
    editorPassword = password;
    persistSession('spinframe');
    return { role: 'spinframe', demo: true };
  }
  if (password === 'qube') {
    editorPassword = null;
    persistSession('qube');
    return { role: 'qube', demo: true };
  }
  throw new Error('Incorrect password');
}

// ── rows ────────────────────────────────────────────────────────────────
export async function getRows() {
  if (demoMode) return demoGetRows();
  try {
    const { res, data } = await callApi('/api/rows');
    if (res.ok) return data.rows || [];
    throw new Error(data.error || 'Failed to load data');
  } catch (e) {
    if (e && e.__demo) {
      demoMode = true;
      return demoGetRows();
    }
    throw e;
  }
}

// ── gantt (read-only mirror of the "Gantt" sheet tab) ─────────────────────
export async function getGantt() {
  if (demoMode) return demoGanttGrid();
  try {
    const { res, data } = await callApi('/api/gantt');
    if (res.ok) return data.grid;
    throw new Error(data.error || 'Failed to load Gantt');
  } catch (e) {
    if (e && e.__demo) {
      demoMode = true;
      return demoGanttGrid();
    }
    throw e;
  }
}

export async function addRow(row) {
  if (demoMode) return demoAddRow(row);
  const { res, data } = await callApi('/api/rows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-password': editorPassword || '',
    },
    body: JSON.stringify(row),
  });
  if (res.ok) return data.row;
  throw new Error(data.error || 'Failed to add solution');
}

export async function updateRow(row) {
  if (demoMode) return demoUpdateRow(row);
  const { res, data } = await callApi('/api/rows', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-portal-password': editorPassword || '',
    },
    body: JSON.stringify(row),
  });
  if (res.ok) return data.row;
  throw new Error(data.error || 'Failed to update solution');
}

// ── demo store (localStorage) ─────────────────────────────────────────────
const DEMO_KEY = 'spinframe_portal_demo_rows';

function demoSeed() {
  const today = new Date();
  const plus = (d) => {
    const x = new Date(today);
    x.setDate(x.getDate() + d);
    return x.toISOString().slice(0, 10);
  };
  return [
    row('Brisbane', 'Fisherman Islands', 'SOL-BNE-01', 'Automated Tarp Spreader', 'Operational', plus(-20), 'Live and running on berth 7.'),
    row('Brisbane', 'Pinkenba', 'SOL-BNE-02', 'Vision Inspection Rig', 'Validation', plus(25), 'Final acceptance testing under way.'),
    row('Melbourne', 'Webb Dock', 'SOL-MEL-01', 'Container Scanner', 'Placement', plus(40), 'Crane mount scheduled next week.'),
    row('Melbourne', 'Swanson Dock', 'SOL-MEL-02', 'Edge Compute Node', 'Shipment', plus(55), 'In transit from Brisbane depot.'),
    row('Port Kembla', 'Inner Harbour', 'SOL-PKL-01', 'Rail Loading Sensor', 'Testing', plus(70), 'Bench testing in progress.'),
    row('Adelaide', 'Outer Harbor', 'SOL-ADL-01', 'Quay Crane Retrofit', 'Assembly', plus(90), 'Frame fabrication started.'),
    row('Darwin', 'East Arm', 'SOL-DRW-01', 'Bulk Flow Monitor', 'Testing', plus(75), 'Calibration pending.'),
    row('Fremantle', 'North Quay', 'SOL-FRE-01', 'Gate OCR System', 'Validation', plus(15), 'Awaiting sign-off from operations.'),
    row('Fremantle', 'Rous Head', 'SOL-FRE-02', 'Yard Tracking Beacon', 'Assembly', plus(100), 'Components on order.'),
  ];

  function row(port, depot, id, name, status, date, notes) {
    return {
      Port: port,
      Depot: depot,
      'Solution ID': id,
      'Solution Name': name,
      Status: status,
      'Expected Operational Date': date,
      Notes: notes,
      'Last Updated': new Date(today.getTime() - Math.random() * 6e8).toISOString(),
    };
  }
}

function demoLoad() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const seeded = demoSeed();
  demoSave(seeded);
  return seeded;
}

function demoSave(rows) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

function demoGetRows() {
  return Promise.resolve(demoLoad());
}

function demoAddRow(row) {
  const rows = demoLoad();
  const newRow = {
    ...row,
    'Solution ID': row['Solution ID'] || 'SOL-' + Date.now().toString(36).toUpperCase(),
    'Last Updated': new Date().toISOString(),
  };
  rows.push(newRow);
  demoSave(rows);
  return Promise.resolve(newRow);
}

function demoUpdateRow(row) {
  const rows = demoLoad();
  const i = rows.findIndex((r) => r['Solution ID'] === row['Solution ID']);
  if (i === -1) return Promise.reject(new Error('Solution ID not found'));
  rows[i] = { ...rows[i], ...row, 'Last Updated': new Date().toISOString() };
  demoSave(rows);
  return Promise.resolve(rows[i]);
}

// A small synthetic Gantt grid for demo mode (mirrors the structure of a real
// "Gantt" sheet tab so the chart renders without a connected sheet).
function demoGanttGrid() {
  const phase = {
    Assembly: '#4a86e8',
    Testing: '#c1447e',
    Shipment: '#e69138',
    Placement: '#f6b26b',
    Validation: '#b07aa1',
    Operational: '#6aa84f',
    Training: '#f1c232',
  };
  const DAYS = 16;
  const today = new Date();
  const blank = () => ({ v: '', bg: '#ffffff', fg: null, b: false, a: 'LEFT' });
  const head = (v) => ({ v, bg: '#13213f', fg: '#ffffff', b: true, a: 'LEFT' });
  const text = (v) => ({ v, bg: '#ffffff', fg: '#1f2937', b: false, a: 'LEFT' });
  const bar = (v) => ({ v, bg: phase[v] || '#9ca3af', fg: '#ffffff', b: true, a: 'CENTER' });
  const dayCell = (i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      v: `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('en-AU', { weekday: 'short' })}`,
      bg: '#eef2f7',
      fg: '#334155',
      b: false,
      a: 'CENTER',
    };
  };

  const rows = [];
  const merges = [{ r1: 0, c1: 3, r2: 1, c2: 3 + DAYS }];

  // Row 0: column headers + month banner.
  const r0 = [head('Unit ID'), head('Depot'), head('Assigned Site'), { v: 'Demo Month 2026', bg: '#3b6fb5', fg: '#ffffff', b: true, a: 'CENTER' }];
  for (let i = 1; i < DAYS; i++) r0.push(blank());
  rows.push(r0);

  // Row 1: day headers.
  const r1 = [blank(), blank(), blank()];
  for (let i = 0; i < DAYS; i++) r1.push(dayCell(i));
  rows.push(r1);

  const units = [
    { id: 'KSBU0203538', depot: 'Brisbane', site: 'Brisbane', bars: [['Assembly', 0, 4], ['Testing', 4, 6], ['Operational', 6, 9], ['Training', 9, 10]] },
    { id: 'KSBU0203564', depot: 'Brisbane', site: 'Port Kembla', bars: [['Assembly', 2, 5], ['Testing', 5, 7], ['Shipment', 7, 9], ['Placement', 9, 12], ['Validation', 12, 14], ['Operational', 14, 16]] },
    { id: 'KSBU0203477', depot: 'Melbourne', site: 'Melbourne', bars: [['Assembly', 0, 4], ['Testing', 4, 6], ['Operational', 6, 9], ['Training', 9, 10]] },
    { id: 'KSBU0203501', depot: 'Melbourne', site: 'Fremantle', bars: [['Assembly', 5, 9], ['Testing', 9, 11], ['Shipment', 11, 14], ['Validation', 14, 16]] },
    { id: 'CXIC6682597', depot: 'Port Kembla', site: 'Port Kembla', bars: [['Operational', 0, 15]] },
  ];

  units.forEach((u, ui) => {
    const r = 2 + ui;
    const cells = [text(u.id), text(u.depot), text(u.site)];
    for (let i = 0; i < DAYS; i++) cells.push(blank());
    u.bars.forEach(([t, s, e]) => {
      cells[3 + s] = bar(t);
      merges.push({ r1: r, c1: 3 + s, r2: r + 1, c2: 3 + e });
    });
    rows.push(cells);
  });

  return Promise.resolve({ rows, merges, colCount: 3 + DAYS });
}

// Re-export for any consumer that wants the canonical lists.
export { PORTS, STATUSES };
