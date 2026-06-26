// /api/rows
//   GET    -> { rows: [...] }            (any authenticated client)
//   POST   -> add a new solution row     (Spinframe / editor only)
//   PUT    -> update an existing row      (Spinframe / editor only)
//
// Writes require the editor password supplied in the `x-portal-password`
// header, validated server-side against SPINFRAME_PASSWORD.

import {
  isConfigured,
  readRows,
  appendRow,
  updateRow,
} from './_sheets.js';

export default async function handler(req, res) {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        error:
          'Google Sheets backend is not configured. Set GOOGLE_SHEET_ID, ' +
          'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.',
      });
    }

    if (req.method === 'GET') {
      const rows = await readRows();
      return res.status(200).json({ rows });
    }

    // --- everything below is a write: require editor auth ---
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!isEditor(req)) {
        return res.status(403).json({ error: 'Editor access required' });
      }

      const body =
        typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

      if (req.method === 'POST') {
        const row = normalize(body);
        if (!row['Solution ID']) row['Solution ID'] = genId();
        row['Last Updated'] = new Date().toISOString();
        await appendRow(row);
        return res.status(201).json({ row });
      }

      if (req.method === 'PUT') {
        if (!body['Solution ID']) {
          return res
            .status(400)
            .json({ error: 'Solution ID is required to update a row' });
        }
        const row = normalize(body);
        row['Last Updated'] = new Date().toISOString();
        const updated = await updateRow(row);
        if (!updated) {
          return res.status(404).json({ error: 'Solution ID not found' });
        }
        return res.status(200).json({ row: updated });
      }
    }

    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('rows handler error:', err);
    return res
      .status(500)
      .json({ error: err.message || 'Internal server error' });
  }
}

function isEditor(req) {
  const supplied = req.headers['x-portal-password'];
  return Boolean(supplied) && supplied === process.env.SPINFRAME_PASSWORD;
}

function normalize(body) {
  return {
    Port: (body.Port || '').toString(),
    'Solution ID': (body['Solution ID'] || '').toString(),
    'Solution Name': (body['Solution Name'] || '').toString(),
    Status: (body.Status || '').toString(),
    'Expected Operational Date': (body['Expected Operational Date'] || '').toString(),
    Notes: (body.Notes || '').toString(),
    'Last Updated': (body['Last Updated'] || '').toString(),
  };
}

function genId() {
  return 'SOL-' + Date.now().toString(36).toUpperCase();
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
