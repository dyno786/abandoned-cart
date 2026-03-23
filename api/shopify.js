export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-shopify-token, x-shopify-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const store = req.headers['x-shopify-store'];
  const token = req.headers['x-shopify-token'];

  // Image proxy - no auth needed, just proxy the CDN image
  if (req.query.imgurl) {
    try {
      const r = await fetch(decodeURIComponent(req.query.imgurl));
      const buf = await r.arrayBuffer();
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buf));
    } catch(e) {
      return res.status(404).end();
    }
  }

  if (!store || !token) return res.status(400).json({ error: 'Missing headers' });

  const headers = {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
  };

  if (req.query.graphql === '1') {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    try {
      const r = await fetch(`https://${store}/admin/api/2024-01/graphql.json`, {
        method: 'POST', headers, body
      });
      return res.status(r.status).json(await r.json());
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const path = req.query.path || '';
  try {
    const r = await fetch(`https://${store}/admin/api/2024-01/${path}`, { headers });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
