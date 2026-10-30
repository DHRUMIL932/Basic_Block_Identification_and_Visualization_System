import { useEffect, useState } from 'react';
import Editor from './components/Editor.jsx';
import Results from './components/Results.jsx';
import Tooltip from './components/Tooltip.jsx';
import { Icon } from './components/icons.jsx';

const DEFAULT = '1: a = b + c\n2: if a < 10 goto 6\n3: d = a * 2\n4: e = d + 5\n5: goto 7\n6: d = a - 2\n7: print d';

export default function App() {
  const [src, setSrc] = useState(DEFAULT), [examples, setExamples] = useState({}), [A, setA] = useState(null), [analyzed, setAnalyzed] = useState('');
  const [errors, setErrors] = useState(null), [busy, setBusy] = useState(false), [hover, setHover] = useState(null), [toasts, setToasts] = useState([]);
  const toast = (t, m, err) => { const id = Math.random(); setToasts(x => [...x, { id, t, m, err }]); setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 3600); };
  async function run(code = src) {
    setBusy(true);
    try {
      const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: code }) });
      const d = await r.json();
      if (d.ok) { setA({ ...d, id: Date.now() }); setErrors(null); setAnalyzed(code); toast('Analysis complete', 'Leaders, blocks, and control flow are ready.'); }
      else { setA(null); setErrors(d.errors); toast('Analysis failed', d.errors[0], true); }
    } catch { setA(null); setErrors(['Cannot reach the analysis server. Run "npm run dev" from the project root.']); toast('Backend offline', 'Cannot reach the analysis server.', true); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    fetch('/api/examples').then(r => r.json()).then(setExamples).catch(() => toast('Backend offline', 'Start the API with "npm run dev" to load examples and analyze code.', true));
    run(DEFAULT);
  }, []);
  return (<>
    <header><div className="brand"><div className="logo"><Icon n="map" s={18} /></div><div><small>COMPILER DESIGN / LAB 01</small><b>Basic Block Visualizer</b></div></div>
      <div className="tag">Three Address Code <span style={{ fontSize: 8, margin: '0 5px' }}>■</span> Control Flow Analysis</div></header>
    <section className="hero"><div><div className="eyebrow">Static analysis workbench</div><h1>From TAC statements<br /><span>to control flow.</span></h1></div>
      <p>Identify leaders, form basic blocks, and inspect the paths a program can take. Built for clear compiler design demos—not opaque automation.</p></section>
    <main>
      <Editor value={src} onChange={setSrc} A={A} analyzed={analyzed} hover={hover} setHover={setHover} examples={examples} busy={busy} onRun={() => run()}
        onExample={k => { const s = examples[k]; setSrc(s); if (s) run(s); }} onClear={() => { setSrc(''); setA(null); setErrors(null); }} />
      <section aria-live="polite"><Results A={A} errors={errors} busy={busy} hover={hover} setHover={setHover} toast={toast} /></section>
    </main>
    <footer><span>Basic Block Visualizer</span><span>React + Node.js compiler analysis / Phase 1 MVP</span></footer>
    <div id="toast">{toasts.map(t => <div key={t.id} className={'toast' + (t.err ? ' e' : '')} role="status"><Icon n={t.err ? 'cno' : 'cok'} s={18} /><div><b>{t.t}</b><span>{t.m}</span></div></div>)}</div>
    <Tooltip />
  </>);
}
