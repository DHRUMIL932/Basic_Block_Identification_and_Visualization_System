import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import Graph from './Graph.jsx';
import { rng, download, TYPE_TIP } from '../utils.js';

const STEPS = [['Parse statements', 'Classify each TAC line'], ['Find leaders', 'Mark control-flow entry points'], ['Create blocks', 'Partition statements by leader'], ['Generate CFG', 'Connect possible paths']];
const Sec = ({ i = 0, className = 'card', children }) => <div className={className + ' sec'} style={{ '--d': `${i * 90}ms` }}>{children}</div>;
function Count({ to }) {
  const [v, setV] = useState(0);
  useEffect(() => { let t0, id; const f = t => { t0 ??= t; const p = Math.min(1, (t - t0) / 700); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f); return () => cancelAnimationFrame(id); }, [to]);
  return v;
}

export default function Results({ A, errors, busy, hover, setHover, toast }) {
  const [step, setStep] = useState(0); const api = useRef(null);
  useEffect(() => setStep(0), [A]);
  if (errors) return (
    <div className="card sec"><div className="row"><div><div className="eyebrow" style={{ fontSize: 10.5 }}>ANALYSIS / OVERVIEW</div><h2>Analysis failed</h2></div><span className="badge e">ERROR</span></div>
      <div className="errs" style={{ marginTop: 16 }} role="alert">{errors.map((e, i) => <div key={i}>⚠ {e}</div>)}</div></div>);
  if (!A) return (
    <div className="empty sec"><div className="ic float"><Icon n="book" s={22} /></div><div><div className="eyebrow" style={{ fontSize: 10.5 }}>RESULTS / WAITING</div><h3>Your analysis will appear here.</h3>
      <p>Load an example or edit the TAC, then run Analyze code to build the graph.</p></div></div>);

  const c = A.cyclomaticComplexity, n = A.cfg.nodes.length, rc = Object.values(A.reachability).filter(Boolean).length;
  const exportJSON = () => { const { statements, leaders, basicBlocks, cfg, reachability, dominators, cyclomaticComplexity } = A;
    download('basic-block-analysis.json', JSON.stringify({ statements, leaders: leaders.map(l => ({ line: l.line, reason: l.reason })),
      basicBlocks: basicBlocks.map(b => ({ id: b.id, startLine: b.startLine, endLine: b.endLine, leaderLine: b.leaderLine, statements: b.statements })), cfg, reachability, dominators, cyclomaticComplexity }, null, 2), 'application/json');
    toast('Report exported', 'Your analysis JSON is ready to present or archive.'); };
  const exportSVG = () => { download('cfg.svg', api.current.exportSVG(), 'image/svg+xml'); toast('CFG exported', 'A presentation-ready SVG was downloaded.'); };
  const hv = id => ({ onMouseEnter: () => setHover(id), onMouseLeave: () => setHover(null) });
  const stats = [['steps', A.statements.length, 'Statements', 'Non-empty TAC instructions parsed from the input.'], ['br', A.leaders.length, 'Leaders', 'First statements of basic blocks: entry, jump targets, and statements after jumps.'],
    ['lay', n, 'Basic blocks', 'Straight-line runs of code with one entry and one exit.'], ['arr', A.cfg.edges.length, 'CFG edges', 'Possible control transfers between blocks.']];
  const rows = [
    () => A.statements.map(s => <div key={s.line} className="r rowin" data-tip={TYPE_TIP[s.type]}><span className="l">L{s.line}</span><span className="c">{s.code}</span><span className="t">{s.type}</span></div>),
    () => A.leaders.map(l => <div key={l.line} className="r rowin" data-tip={`Why is L${l.line} a leader?\n${l.reasons.map(r => '• ' + r).join('\n')}`}><span className="l">L{l.line}</span><span className="c">{A.statements[l.index].code}</span><span className="t">{l.reason}</span></div>),
    () => A.basicBlocks.map(b => <div key={b.id} className={'r rowin' + (hover === b.id ? ' hl' : '')} {...hv(b.id)} data-tip={b.statements.map(s => `${s.line}: ${s.code}`).join('\n')}><span className="l">{b.id}</span><span className="c">{b.statements.length} statement{b.statements.length > 1 ? 's' : ''}</span><span className="t">{rng(b)}</span></div>),
    () => A.cfg.edges.length ? A.cfg.edges.map((e, i) => <div key={i} className={'r rowin' + (hover === e.source ? ' hl' : '')} {...hv(e.source)} data-tip={`${e.source} → ${e.target} [${e.type}]`}><span className="l">{e.source}</span><span className="c">→ {e.target}</span><span className="t">{e.type}</span></div>) : <div className="r"><span className="c">No edges: the program is a single block.</span></div>];
  return (<>
    <Sec i={0}><div className="row" style={{ alignItems: 'flex-start' }}><div><div className="eyebrow" style={{ fontSize: 10.5 }}>ANALYSIS / OVERVIEW</div><h2>Analysis complete</h2></div>
      <div className="row"><span className="badge" data-tip="Status: analysis finished without errors">{busy ? 'ANALYZING' : 'READY'}</span><button className="btn s" onClick={exportJSON} data-tip="Download the full analysis as JSON"><Icon n="dl" />Export JSON</button></div></div>
      <div className="stats">{stats.map(s => <div key={s[2]} className="stat" data-tip={s[3]}><Icon n={s[0]} s={18} /><b><Count to={s[1]} /></b><span>{s[2]}</span></div>)}</div></Sec>
    <Sec i={1}><div className="row" style={{ alignItems: 'flex-start' }}><div><div className="eyebrow row" style={{ justifyContent: 'flex-start', gap: 6, fontSize: 10.5 }}><Icon n="steps" s={14} />GUIDED ANALYSIS</div><h2>Step-by-step view</h2></div><span className="mono" style={{ color: 'var(--blue)', fontSize: 12 }}>{step + 1} / 4</span></div>
      <div className="steps" role="tablist">{STEPS.map((s, i) => <button key={i} role="tab" aria-selected={i === step} className={'step' + (i === step ? ' on' : '')} onClick={() => setStep(i)} data-tip={`Step ${i + 1}: ${s[1]}`}>
        <span className="n">{i < step ? <Icon n="chk" s={13} /> : '0' + (i + 1)}</span><span><b>{s[0]}</b><small>{s[1]}</small></span></button>)}</div>
      <div className="sp" key={step}><div className="hd"><span className="big">0{step + 1}</span><div><b>{STEPS[step][0]}</b><small>{STEPS[step][1]}.</small></div></div><div className="rows">{rows[step]()}</div></div>
      <div className="nav"><button disabled={step === 0} onClick={() => setStep(step - 1)}><Icon n="larr" s={14} />Previous</button><button disabled={step === 3} onClick={() => setStep(step + 1)}>Next<Icon n="arr" s={14} /></button></div></Sec>
    <Sec i={2}><div className="row"><div><div className="eyebrow" style={{ fontSize: 10.5 }}>01 / LEADERS</div><h2>Entry points</h2></div><span style={{ color: 'var(--blue)' }}><Icon n="flag" s={18} /></span></div>
      <div className="list" style={{ marginTop: 16 }}>{A.leaders.map((l, i) => <div key={l.line} className="r rowin hov" style={{ animationDelay: `${i * 50}ms` }} data-tip={`L${l.line}: ${A.statements[l.index].code}\nRules matched: ${l.reasons.length}`}><span className="l">L{l.line}</span><span className="c" style={{ font: '13px var(--sans)' }}>{l.reason}</span></div>)}</div></Sec>
    <Sec i={3} className="card g"><div className="cx"><div className="ic pulse"><Icon n="pul" s={20} /></div><div className="m"><div className="eyebrow" style={{ fontSize: 10.5 }}>METRIC / PATH INDEPENDENCE</div><h3>Cyclomatic complexity</h3><p>A compact estimate of the independent paths in the generated control-flow graph.</p></div>
      <div className="v" data-tip={`M = E − N + 2P\n= ${c.E} − ${c.N} + 2·${c.P} = ${c.M}\nNumber of independent paths through the CFG.`}><b><Count to={c.M} /></b>M = E − N + 2P</div>
      <div className="k"><div data-tip="E: number of CFG edges"><b>E</b> {c.E} edges</div><div data-tip="N: number of CFG nodes (basic blocks)"><b>N</b> {c.N} nodes</div><div data-tip="P: connected components of the graph"><b>P</b> {c.P} component{c.P > 1 ? 's' : ''}</div></div></div></Sec>
    <Sec i={4}><div className="row" style={{ alignItems: 'flex-start' }}><div><div className="eyebrow row" style={{ justifyContent: 'flex-start', gap: 6, fontSize: 10.5 }}><Icon n="br" s={14} />GRAPH RELATIONSHIPS</div><h2>Dominator analysis</h2></div><span className="pill">entry: B1</span></div>
      <p className="sub">A block dominates another when every path from the entry block to it passes through that block.</p>
      <table><thead><tr><th>Block</th><th>Dominators</th><th>Reading</th></tr></thead><tbody>{A.cfg.nodes.map(b => { const d = A.dominators[b]; return (
        <tr key={b} className={hover === b ? 'hl' : ''} {...hv(b)} data-tip={d ? `Every path from B1 to ${b} passes through:\n${d.join(', ')}` : `${b} cannot be reached from B1`}>
          <td>{b}</td><td>{d ? d.join(', ') : '—'}</td><td>{!d ? 'unreachable' : b === 'B1' ? 'entry block' : d.length + ' required blocks'}</td></tr>); })}</tbody></table></Sec>
    <Sec i={5}><div className="row"><div><div className="eyebrow" style={{ fontSize: 10.5 }}>02 / PARTITION</div><h2>Basic blocks</h2></div><span style={{ color: 'var(--blue)' }}><Icon n="lay" s={18} /></span></div>
      <div className="blocks">{A.basicBlocks.map((b, i) => <div key={b.id} className={'bk rowin' + (hover === b.id ? ' hl' : '')} style={{ animationDelay: `${i * 70}ms` }} {...hv(b.id)}
        data-tip={`${b.id} starts at leader L${b.leaderLine}\nand ends at L${b.endLine} (${b.statements.length} statement${b.statements.length > 1 ? 's' : ''}).\nControl enters only at the top and leaves at the bottom.`}>
        <div className="h"><b>{b.id}</b><span>{rng(b)}</span></div><pre>{b.statements.map(s => <div key={s.line}><i>{s.line}</i>{s.code}</div>)}</pre><div className="f">{'{}'} leader: L{b.leaderLine}</div></div>)}</div></Sec>
    <Sec i={6}><div className="row" style={{ alignItems: 'flex-start' }}><div><div className="eyebrow" style={{ fontSize: 10.5 }}>03 / CONTROL FLOW GRAPH</div><h2>Generated CFG</h2></div>
      <div className="row"><span className="mono" style={{ fontSize: 12, color: 'var(--mute)' }}><span style={{ color: 'var(--blue)' }}>■</span> block node</span><button className="btn s" onClick={exportSVG} data-tip="Download the graph as an SVG image"><Icon n="dl" />Save SVG</button></div></div>
      <div className="cfg"><Graph A={A} hover={hover} setHover={setHover} api={api} />
        <aside className="reach"><div className="eyebrow row" style={{ justifyContent: 'flex-start', gap: 6, fontSize: 10.5 }}><Icon n="br" s={14} />REACHABILITY</div><h3>Can each block be reached?</h3><p>Starting at the entry block, follow every generated CFG edge.</p>
          <div className={'frac' + (rc < n ? ' bad' : '')} data-tip="Blocks found by a breadth-first search from B1"><b><Count to={rc} /></b><i>/</i> {n}<br />blocks reachable from entry<div className="bar"><span style={{ width: `${rc / n * 100}%` }} /></div></div>
          {A.cfg.nodes.map(b => { const ok = A.reachability[b]; return <div key={b} className={'r hov' + (hover === b ? ' hl' : '')} {...hv(b)} data-tip={ok ? `${b} is reachable from the entry block` : `${b} can never execute: no path from B1`}><span className={ok ? 'ok' : 'no'}><Icon n={ok ? 'cok' : 'cno'} s={18} /></span><b>{b}</b><span className="t">{ok ? 'reachable' : 'unreachable'}</span></div>; })}
          <div className={'sum' + (rc < n ? ' bad' : '')}>{rc === n ? '✓ All blocks are reachable in this CFG.' : `⚠ ${n - rc} block${n - rc > 1 ? 's are' : ' is'} unreachable from the entry block.`}</div></aside></div></Sec>
  </>);
}
