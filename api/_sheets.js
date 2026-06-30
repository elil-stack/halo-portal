import { google } from 'googleapis';

// Canonical column order in the sheet. The first row of the sheet must match.
export const HEADERS = [
  'Port',
  'Depot',
  'Solution ID',
  'Solution Name',
  'Status',
  'Expected Operational Date',
  'Notes',
  'Last Updated',
];

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/**
 * Returns true when the Google Sheets backend is fully configured.
 */
export function isConfigured() {
  return Boolean(
    SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

// Be forgiving about how the private key was pasted: trim whitespace, strip a
// stray wrapping pair of quotes, and turn literal "\n" sequences into real
// newlines (Vercel stores them literally). This means it works whether or not
// the user kept the surrounding quotes from the JSON file.
function normalizePrivateKey(raw) {
  let key = (raw || '').trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

function getClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
}

/** Convert a sheet row (array) into a keyed object. */
function rowToObject(row) {
  const obj = {};
  HEADERS.forEach((h, i) => {
    obj[h] = row[i] != null ? String(row[i]) : '';
  });
  return obj;
}

/** Convert a keyed object into a sheet row (array) in canonical order. */
function objectToRow(obj) {
  return HEADERS.map((h) => (obj[h] != null ? String(obj[h]) : ''));
}

/** Read every data row from the sheet. */
export async function readRows() {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:H`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r.some((c) => c && String(c).trim() !== ''))
    .map(rowToObject);
}

/** Append a new row to the sheet. */
export async function appendRow(obj) {
  const sheets = getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [objectToRow(obj)] },
  });
  return obj;
}

/**
 * Update the existing row whose "Solution ID" matches obj['Solution ID'].
 * Returns the updated object, or null if no matching row was found.
 */
export async function updateRow(obj) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:H`,
  });
  const rows = res.data.values || [];
  const idIndex = HEADERS.indexOf('Solution ID');
  const target = String(obj['Solution ID']);

  const matchOffset = rows.findIndex(
    (r) => String(r[idIndex] || '') === target
  );
  if (matchOffset === -1) return null;

  // Sheet rows are 1-based and we started at row 2.
  const sheetRow = matchOffset + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${sheetRow}:H${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [objectToRow(obj)] },
  });
  return obj;
}

// ── Gantt tab (visual chart mirror) ───────────────────────────────────────
const GANTT_SHEET_NAME = process.env.GOOGLE_GANTT_SHEET_NAME || 'Gantt';

function colorToHex(c) {
  if (!c || (c.red == null && c.green == null && c.blue == null)) return null;
  const to = (x) => Math.round((x || 0) * 255).toString(16).padStart(2, '0');
  return '#' + to(c.red) + to(c.green) + to(c.blue);
}

/**
 * Read the "Gantt" tab as a grid of styled cells (value + background/text
 * colour + alignment) plus its merged ranges, so the app can faithfully
 * reproduce the chart exactly as it looks in the sheet.
 */
export async function readGanttGrid() {
  const sheets = getClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    ranges: [`${GANTT_SHEET_NAME}!A1:BZ200`],
    includeGridData: true,
    fields:
      'sheets(merges,data(rowData(values(formattedValue,effectiveFormat(backgroundColor,horizontalAlignment,textFormat(foregroundColor,bold))))))',
  });

  const sheet = res.data.sheets && res.data.sheets[0];
  if (!sheet) return { rows: [], merges: [], colCount: 0 };
  const grid = (sheet.data && sheet.data[0]) || {};
  const rowData = grid.rowData || [];

  let rows = rowData.map((r) =>
    (r.values || []).map((cell) => {
      const fmt = cell.effectiveFormat || {};
      const tf = fmt.textFormat || {};
      return {
        v: cell.formattedValue || '',
        bg: colorToHex(fmt.backgroundColor),
        fg: colorToHex(tf.foregroundColor),
        b: Boolean(tf.bold),
        a: fmt.horizontalAlignment || 'LEFT',
      };
    })
  );

  const isBlank = (c) => (!c || !c.v) && (!c || !c.bg || c.bg === '#ffffff');

  // Drop trailing blank rows.
  while (rows.length && rows[rows.length - 1].every(isBlank)) rows.pop();

  // Furthest non-blank column across all rows.
  let colCount = 0;
  rows.forEach((r) => {
    for (let i = r.length - 1; i >= 0; i--) {
      if (!isBlank(r[i])) {
        colCount = Math.max(colCount, i + 1);
        break;
      }
    }
  });

  // Normalise every row to colCount.
  rows = rows.map((r) => {
    const out = r.slice(0, colCount);
    while (out.length < colCount)
      out.push({ v: '', bg: null, fg: null, b: false, a: 'LEFT' });
    return out;
  });

  const merges = (sheet.merges || [])
    .map((m) => ({
      r1: m.startRowIndex || 0,
      c1: m.startColumnIndex || 0,
      r2: m.endRowIndex || 0,
      c2: m.endColumnIndex || 0,
    }))
    .filter((m) => m.r1 < rows.length && m.c1 < colCount);

  return { rows, merges, colCount };
}
