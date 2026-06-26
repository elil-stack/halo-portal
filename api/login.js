// POST /api/login  { password }  ->  { role: 'spinframe' | 'qube' }
//
// Passwords live only in server-side environment variables, so the actual
// secrets are never shipped in the browser bundle.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body =
    typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const password = (body.password || '').toString();

  const spinframe = process.env.SPINFRAME_PASSWORD;
  const qube = process.env.QUBE_PASSWORD;

  if (!spinframe && !qube) {
    return res
      .status(500)
      .json({ error: 'Server is missing role passwords. Check env vars.' });
  }

  if (password && password === spinframe) {
    return res.status(200).json({ role: 'spinframe' });
  }
  if (password && password === qube) {
    return res.status(200).json({ role: 'qube' });
  }

  return res.status(401).json({ error: 'Incorrect password' });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
