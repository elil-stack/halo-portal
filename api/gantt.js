// GET /api/gantt -> { grid: { rows, merges, colCount } }
// Returns the "Gantt" tab of the spreadsheet as a styled cell grid so the app
// can mirror the chart. Read-only.

import { isConfigured, readGanttGrid } from './_sheets.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Google Sheets backend is not configured.',
      });
    }
    const grid = await readGanttGrid();
    return res.status(200).json({ grid });
  } catch (err) {
    console.error('gantt handler error:', err);
    return res
      .status(500)
      .json({ error: err.message || 'Internal server error' });
  }
}
