export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-shopify-token, x-shopify-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const store = req.headers['x-shopify-store'];
  const token = req.headers['x-shopify-token'];

  if (!store || !token) return res.status(400).json({ error: 'Missing headers' });

  const isGraphQL = req.query.graphql === '1';

  if (isGraphQL) {
    let body = '';
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      body = JSON.stringify({
        query: `{
          abandonedCheckouts(first: 50) {
            edges {
              node {
                id
                createdAt
                totalPriceSet { shopMoney { amount currencyCode } }
                customer { firstName lastName phone email }
                lineItems(first: 10) {
                  edges {
                    node { title quantity }
                  }
                }
              }
            }
          }
        }`
      });
    }

    const url = `https://${store}/admin/api/2024-01/graphql.json`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // REST fallback
  const path = req.query.path || '';
  const url = `https://${store}/admin/api/2024-01/${path}`;
  try {
    const r = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
