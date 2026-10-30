import { useMemo, useState } from 'react';
import { Icon } from './icons.jsx';

// TAC editor: numbered gutter, ruled lines, and (after analysis) leader / block markers per line.
export default function Editor({ value, onChange, A, analyzed, hover, setHover, examples, onExample, onClear, onRun, busy }) {
  const [sc, setSc] = useState(0);
  const rows = value.split('\n');
  const info = useMemo(() => {
    if (!A || analyzed !== value) return {};
    const m = {}; let k = 0;
    rows.forEach((r, i) => {
      if (!r.trim()) return;
      const s = A.statements[k++]; if (!s) return;
      const b = A.basicBlocks.find(x => x.statements.some(t => t.line === s.line));
      const l = A.leaders.find(x => x.line === s.line);
      m[i] = { b: b.id, line: s.line, leader: !!l, reason: l && l.reason, first: b.startLine === s.line };
    });
    return m;
  }, [A, analyzed, value]);
  return (
    <section className="left" aria-label="Input">
      <div className="eyebrow row" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 10.5 }}><Icon n="code" s={14} />INPUT / TAC PROGRAM</div>
      <div className="row" style={{ marginTop: 22, alignItems: 'flex-start' }}><h2 style={{ margin: 0 }}>Three Address Code</h2><span className="pill" data-tip={'TAC / v1\nOne instruction per line, optional "N:" line prefix,\nlabels like L1:, and jumps by line number or label.'}>TAC / v1</span></div>
      <p className="sub">One instruction per line. Numbered lines make control flow explicit.</p>
      <div className="ed">
        <div className="gut2"><div style={{ transform: `translateY(${-sc}px)` }}>
          {rows.map((_, i) => { const f = info[i]; return (
            <div key={i} className={'gl' + (f && hover === f.b ? ' hl' : '') + (f && f.leader ? ' lead' : '')}
              data-tip={f ? `${f.b} · statement L${f.line}\n${f.reason ? 'Leader: ' + f.reason : 'Inside block ' + f.b}` : undefined}
              onMouseEnter={() => f && setHover(f.b)} onMouseLeave={() => setHover(null)}>{i + 1}</div>); })}
        </div></div>
        <div className="body">
          <div className="ov" style={{ transform: `translateY(${-sc}px)` }} aria-hidden="true">
            {rows.map((_, i) => { const f = info[i]; return (
              <div key={i} className={'ol' + (f ? ' has' : '') + (f && f.leader ? ' lead' : '') + (f && hover === f.b ? ' hl' : '')}>
                {f && f.first && <span className="btag" data-tip={`${f.b} starts here\n${f.reason}`} onMouseEnter={() => setHover(f.b)} onMouseLeave={() => setHover(null)}>{f.b}{f.leader ? ' · leader' : ''}</span>}
              </div>); })}
          </div>
          <textarea id="src" value={value} spellCheck="false" aria-label="Three Address Code editor"
            onChange={e => onChange(e.target.value)} onScroll={e => setSc(e.target.scrollTop)} />
        </div>
      </div>
      <div className="ctl">
        <div><label htmlFor="ex">Load example</label>
          <select id="ex" defaultValue="Sequential" onChange={e => onExample(e.target.value)}>{Object.keys(examples).length ? Object.keys(examples).map(k => <option key={k}>{k}</option>) : <option>Sequential</option>}</select></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button id="btn-clear" className="btn" onClick={onClear} data-tip="Clear the editor and results"><Icon n="rot" />Clear</button>
          <button id="btn-analyze" className="btn p" onClick={onRun} disabled={busy} data-tip="Send the TAC to the analysis server"><span className={busy ? 'spin' : ''}><Icon n="spark" /></span>{busy ? 'Analyzing…' : 'Analyze code'}</button>
        </div>
      </div>
      <div className="note">Supports assignment, conditional jump, goto, labels, print, and return.</div>
    </section>
  );
}
