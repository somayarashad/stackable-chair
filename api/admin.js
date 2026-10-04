const WRITE_URL = 'https://ncartouivsajjbpivuhs.supabase.co/functions/v1/stackable-chair-secure-write';

async function edge(body) {
  return fetch(WRITE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: 'Admin password is not configured' });

  const { action, password, rows } = req.body || {};
  if (typeof password !== 'string' || password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  if (action === 'login') {
    let r = await edge({ action: 'bootstrap', username: 'admin', password });
    if (r.status === 409) r = await edge({ action: 'login', username: 'admin', password });
    if (!r.ok) return res.status(401).json({ error: 'Incorrect password' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'save' && Array.isArray(rows)) {
    const r = await edge({ action: 'save', username: 'admin', password, rows });
    const data = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : r.status).json(r.ok ? { ok: true } : { error: data.error || 'Could not save dashboard data' });
  }

  return res.status(400).json({ error: 'Invalid request' });
}
