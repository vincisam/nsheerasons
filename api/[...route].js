export default async function handler(req, res) {
  const path = req.url.split('?')[0]; // Remove query string
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  try {
    let backendUrl;
    
    if (path.includes('/ai/jewellery-design')) {
      backendUrl = 'https://nsheerasons.up.railway.app/api/ai/jewellery-design';
    } else if (path.includes('/ai/stone-suggestion')) {
      backendUrl = 'https://nsheerasons.up.railway.app/api/ai/stone-suggestion';
    } else {
      backendUrl = `https://nsheerasons.up.railway.app${path}`;
    }
    
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    console.log(`Proxying ${req.method} ${path} -> ${backendUrl}`);
    
    const response = await fetch(backendUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.message });
  }
}
