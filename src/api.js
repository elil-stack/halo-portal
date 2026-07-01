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
// Mirrors the real sheet's managed window (rows 2-15 → 14 solutions).
const DEMO_MAX_ROWS = 14;

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
  return Promise.resolve(demoLoad().slice(0, DEMO_MAX_ROWS));
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

// Re-export for any consumer that wants the canonical lists.
export { PORTS, STATUSES };
