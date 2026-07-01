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

// The app only manages solutions in this row window. Row 1 is the header;
// anything at or below FIRST_DATA_ROW/LAST_DATA_ROW is out of scope and left
// untouched, even if the sheet has stray content further down.
const FIRST_DATA_ROW = 2;
const LAST_DATA_ROW = 15;
const DATA_RANGE = `${SHEET_NAME}!A${FIRST_DATA_ROW}:H${LAST_DATA_ROW}`;

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

/** Read data rows from the sheet, limited to the managed row window. */
export async function readRows() {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: DATA_RANGE,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r.some((c) => c && String(c).trim() !== ''))
    .map(rowToObject);
}

/**
 * Write a new row into the first empty slot within the managed row window
 * (rows 2-15). If that window is already full, it falls through to the row
 * immediately below it (row 16) rather than appending after whatever content
 * happens to sit further down the sheet.
 */
export async function appendRow(obj) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: DATA_RANGE,
  });
  const rows = res.data.values || [];
  const isBlank = (r) => !r || r.every((c) => !c || String(c).trim() === '');

  let targetRow = LAST_DATA_ROW + 1;
  for (let i = 0; i <= LAST_DATA_ROW - FIRST_DATA_ROW; i++) {
    if (isBlank(rows[i])) {
      targetRow = FIRST_DATA_ROW + i;
      break;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${targetRow}:H${targetRow}`,
    valueInputOption: 'USER_ENTERED',
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
    range: DATA_RANGE,
  });
  const rows = res.data.values || [];
  const idIndex = HEADERS.indexOf('Solution ID');
  const target = String(obj['Solution ID']);

  const matchOffset = rows.findIndex(
    (r) => String(r[idIndex] || '') === target
  );
  if (matchOffset === -1) return null;

  const sheetRow = FIRST_DATA_ROW + matchOffset;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${sheetRow}:H${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [objectToRow(obj)] },
  });
  return obj;
}

