const { analyze } = require('../server/engine');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, errors: ['Method not allowed. Use POST.'] });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  const source = body && body.source;
  if (typeof source !== 'string') {
    return res.status(400).json({ ok: false, errors: ['Request body must include a "source" string.'] });
  }

  try {
    return res.status(200).json(analyze(source));
  } catch (e) {
    return res.status(500).json({ ok: false, errors: ['Internal analysis error: ' + e.message] });
  }
};
