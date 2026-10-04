const SUPABASE_URL = 'https://ncartouivsajjbpivuhs.supabase.co';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: 'Admin password is not configured' });
  const { action, password, rows } = req.body || {};
  if (typeof password !== 'string' || password !== adminPassword) return res.status(401).json({ error: 'Incorrect password' });
  if (action === 'login') return res.status(200).json({ ok: true });
  if (action !== 'save' || !Array.isArray(rows)) return res.status(400).json({ error: 'Invalid request' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'Database write key is not configured' });

  for (const row of rows) {
    const required = Math.trunc(Number(row.required_qty));
    const completed = Math.trunc(Number(row.completed_qty));
    if (!row.item_key || !Number.isFinite(required) || !Number.isFinite(completed) || required < 0 || completed < 0) {
      return res.status(400).json({ error: 'Invalid quantities' });
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/stackable_chair_status?item_key=eq.${encodeURIComponent(row.item_key)}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ required_qty: required, completed_qty: completed })
    });
    if (!r.ok) return res.status(500).json({ error: 'Could not save dashboard data' });
  }
  return res.status(200).json({ ok: true });
}
