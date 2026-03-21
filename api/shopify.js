export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-shopify-token, x-shopify-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const store = req.headers['x-shopify-store'];
  const token = req.headers['x-shopify-token'];
  const path = req.query.path || '';
  if (!store || !token) return res.status(400).json({ error: 'Missing headers' });
  const url = `https://${store}/admin/api/2024-01/${path}`;
  try {
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
