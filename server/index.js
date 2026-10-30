const express = require('express'), cors = require('cors'), path = require('path'), fs = require('fs');
const { analyze } = require('./engine');
const examples = require('./examples');

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (_q, r) => r.json({ status: 'ok' }));
app.get('/api/examples', (_q, r) => r.json(examples));
app.post('/api/analyze', (req, res) => {
  const source = req.body && req.body.source;
  if (typeof source !== 'string') return res.status(400).json({ ok: false, errors: ['Request body must include a "source" string.'] });
  try { res.json(analyze(source)); }
  catch (e) { res.status(500).json({ ok: false, errors: ['Internal analysis error: ' + e.message] }); }
});

// In production (npm run build && npm start) the server also serves the built React app.
const dist = path.join(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_q, r) => r.sendFile(path.join(dist, 'index.html')));
}
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Basic Block Visualizer API running on http://localhost:${PORT}`));
