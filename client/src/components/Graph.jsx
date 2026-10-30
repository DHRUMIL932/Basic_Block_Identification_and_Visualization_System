import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Icon } from './icons.jsx';
import { rng } from '../utils.js';

const NW = 170, GX = 42, GY = 62, OFF = 18, BLUE = '#0a2fa0', MONO = 'IBM Plex Mono,monospace';
const nh = b => 42 + 14 * b.statements.length;

export function computeLayout(A) {
  const bl = A.basicBlocks, cols = 3;
  const w = bl.map(b => Math.max(NW, Math.max(...b.statements.map(s => (s.line + ': ' + s.code).length)) * 6.6 + 24));
  const colW = [0, 1, 2].map(c => Math.max(NW, ...bl.map((_, i) => i % cols === c ? w[i] : 0)));
  const rowH = []; bl.forEach((b, i) => { const r = Math.floor(i / cols); rowH[r] = Math.max(rowH[r] || 0, nh(b)); });
  const L = {};
  bl.forEach((b, i) => { const c = i % cols, r = Math.floor(i / cols);
    L[b.id] = { x: colW.slice(0, c).reduce((a, v) => a + v + GX, 0), y: rowH.slice(0, r).reduce((a, v) => a + v + GY, 0), w: w[i], h: nh(b) }; });
  return L;
}
function path(pts, r = 6) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1, rr = Math.min(r, l1 / 2, l2 / 2);
    d += `L${b[0] + (a[0] - b[0]) / l1 * rr},${b[1] + (a[1] - b[1]) / l1 * rr}Q${b[0]},${b[1]} ${b[0] + (c[0] - b[0]) / l2 * rr},${b[1] + (c[1] - b[1]) / l2 * rr}`;
  }
  const e = pts[pts.length - 1]; return d + `L${e[0]},${e[1]}`;
}
function route(e, P) {
  const s = P[e.source], t = P[e.target], sx = s.x + s.w / 2, sy = s.y + s.h, tx = t.x + t.w / 2, ty = t.y;
  if (ty - sy > 2 * OFF) { const my = (sy + ty) / 2; return { pts: [[sx, sy], [sx, my], [tx, my], [tx, ty]], lab: [(sx + tx) / 2, my] }; }
  const vx = sx === tx ? sx + Math.max(s.w, t.w) / 2 + 30 : (sx + tx) / 2;
  return { pts: [[sx, sy], [sx, sy + OFF], [vx, sy + OFF], [vx, ty - OFF], [tx, ty - OFF], [tx, ty]], lab: [vx, (sy + OFF + ty - OFF) / 2] };
}
const WHY = { true: 'the condition is true, so control jumps to', false: 'the condition is false, so execution continues with', jump: 'an unconditional goto always transfers control to', next: 'the block ends without a jump, so control falls through to' };

// Pure SVG shapes (used for both the live graph and the exported SVG file).
export function Shapes({ A, P, hover, hoverEdge, setHover, setHoverEdge, animate }) {
  const preds = id => A.cfg.edges.filter(e => e.target === id).map(e => e.source), succs = id => A.cfg.edges.filter(e => e.source === id).map(e => e.target);
  return (<>
    <defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#111" /></marker></defs>
    {A.cfg.edges.map((e, i) => {
      const r = route(e, P), d = path(r.pts), on = hoverEdge === i || (hover && (e.source === hover || e.target === hover)), tw = e.type.length * 6.4 + 8;
      const tip = `${e.source} → ${e.target}  [${e.type}]\nWhy? Because ${WHY[e.type]} ${e.target}.`;
      return (<g key={i}>
        <path d={d} fill="none" stroke={on ? BLUE : '#111'} strokeWidth={on ? 2.2 : 1.5} markerEnd="url(#ar)" pathLength="1" className={animate ? 'draw' : undefined} style={animate ? { animationDelay: `${0.35 + i * 0.12}s` } : undefined} />
        {on && animate && <path d={d} fill="none" stroke={BLUE} strokeWidth="2.4" strokeDasharray="6 6" className="flow" />}
        {animate && <path d={d} fill="none" stroke="transparent" strokeWidth="14" data-tip={tip} onMouseEnter={() => setHoverEdge(i)} onMouseLeave={() => setHoverEdge(null)} />}
        <g className={animate ? 'lab' : undefined} style={animate ? { animationDelay: `${0.7 + i * 0.12}s` } : undefined}>
          <rect x={r.lab[0] - tw / 2} y={r.lab[1] - 8} width={tw} height="16" fill="#fff" />
          <text x={r.lab[0]} y={r.lab[1] + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={BLUE} fontFamily={MONO}>{e.type}</text></g>
      </g>);
    })}
    {A.basicBlocks.map((b, i) => {
      const p = P[b.id], un = !A.reachability[b.id], on = hover === b.id, dom = A.dominators[b.id];
      const tip = `${b.id} · ${rng(b)} · ${b.statements.length} statement${b.statements.length > 1 ? 's' : ''}\nPredecessors: ${preds(b.id).join(', ') || 'none'}\nSuccessors: ${succs(b.id).join(', ') || 'none (exit block)'}\nDominators: ${dom ? dom.join(', ') : '—'}\n${un ? '⚠ Unreachable from entry' : '✓ Reachable from entry'}`;
      return (<g key={b.id} data-id={b.id} data-tip={animate ? tip : undefined} className={animate ? 'node' : undefined} style={{ cursor: 'move', ...(animate ? { animationDelay: `${i * 0.09}s` } : {}) }}
        onMouseEnter={animate ? () => setHover(b.id) : undefined} onMouseLeave={animate ? () => setHover(null) : undefined}>
        <rect x={p.x + 3} y={p.y + 3} width={p.w} height={p.h} fill={un ? '#dc2626' : BLUE} />
        <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={on ? '#f3f6ff' : '#fff'} stroke={on ? BLUE : '#555'} strokeWidth={on ? 2 : 1} strokeDasharray={un ? '4 3' : undefined} />
        <rect x={p.x} y={p.y} width={p.w} height="28" fill="#f4f5f4" stroke={on ? BLUE : '#555'} strokeWidth={on ? 2 : 1} />
        <text x={p.x + 8} y={p.y + 18} fontSize="11" fontWeight="700" fill={BLUE} fontFamily={MONO}>{b.id}</text>
        <text x={p.x + p.w - 8} y={p.y + 18} textAnchor="end" fontSize="10" fill="#555" fontFamily={MONO}>{rng(b)}</text>
        {b.statements.map((s, k) => <text key={k} x={p.x + 8} y={p.y + 49 + 14 * k} fontSize="10.5" fill="#111" fontFamily={MONO}>{s.line + ': ' + s.code}</text>)}
        <rect x={p.x + p.w / 2 - 3.5} y={p.y - 3.5} width="7" height="7" fill={BLUE} /><rect x={p.x + p.w / 2 - 3.5} y={p.y + p.h - 3.5} width="7" height="7" fill={BLUE} />
      </g>);
    })}
  </>);
}
const bbox = (A, P) => { const v = A.basicBlocks.map(b => P[b.id]);
  const x0 = Math.min(...v.map(p => p.x)) - 36, y0 = Math.min(...v.map(p => p.y)) - 36, x1 = Math.max(...v.map(p => p.x + p.w + 4)) + 36, y1 = Math.max(...v.map(p => p.y + p.h + 4)) + 36;
  return { x0, y0, w: x1 - x0, h: y1 - y0 }; };

export default function Graph({ A, hover, setHover, api }) {
  const layout = useMemo(() => computeLayout(A), [A]);
  const [pos, setPos] = useState({}), [view, setView] = useState({ x: 0, y: 0, k: 1 }), [hoverEdge, setHoverEdge] = useState(null);
  const cv = useRef(null), svg = useRef(null), drag = useRef(null), viewRef = useRef(view);
  viewRef.current = view;
  const P = useMemo(() => { const o = {}; Object.keys(layout).forEach(k => o[k] = pos[k] || layout[k]); return o; }, [layout, pos]);
  const fit = () => { const c = cv.current, b = bbox(A, P), k = Math.min(1.25, (c.clientWidth - 60) / b.w, (c.clientHeight - 60) / b.h);
    setView({ k, x: (c.clientWidth - b.w * k) / 2 - b.x0 * k, y: (c.clientHeight - b.h * k) / 2 - b.y0 * k }); };
  const zoomBy = (f, cx, cy) => setView(v => { const c = cv.current; cx ??= c.clientWidth / 2; cy ??= c.clientHeight / 2;
    const k = Math.max(0.2, Math.min(3, v.k * f)); return { k, x: cx - (cx - v.x) * k / v.k, y: cy - (cy - v.y) * k / v.k }; });
  useEffect(() => { setPos({}); }, [A]);
  useEffect(() => { fit(); const f = () => fit(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, [A]);
  useEffect(() => { const el = svg.current; const w = e => { e.preventDefault(); const r = cv.current.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener('wheel', w, { passive: false }); return () => el.removeEventListener('wheel', w); }, []);
  api.current = { exportSVG: () => { const b = bbox(A, P);
    return '<?xml version="1.0" encoding="UTF-8"?>' + renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" viewBox={`${b.x0} ${b.y0} ${b.w} ${b.h}`} width={Math.round(b.w)} height={Math.round(b.h)}><rect x={b.x0} y={b.y0} width={b.w} height={b.h} fill="#fff" /><Shapes A={A} P={P} /></svg>); } };
  const down = e => { const g = e.target.closest('[data-id]'); const id = g && g.dataset.id;
    drag.current = id ? { id, sx: e.clientX, sy: e.clientY, ox: P[id].x, oy: P[id].y } : { pan: 1, sx: e.clientX, sy: e.clientY, ox: viewRef.current.x, oy: viewRef.current.y };
    svg.current.setPointerCapture(e.pointerId); };
  const move = e => { const d = drag.current; if (!d) return; const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (d.pan) setView(v => ({ ...v, x: d.ox + dx, y: d.oy + dy })); else setPos(p => ({ ...p, [d.id]: { ...layout[d.id], x: d.ox + dx / viewRef.current.k, y: d.oy + dy / viewRef.current.k } })); };
  return (
    <div className="canvas" ref={cv}>
      <svg ref={svg} xmlns="http://www.w3.org/2000/svg" onPointerDown={down} onPointerMove={move} onPointerUp={() => drag.current = null} onPointerCancel={() => drag.current = null} aria-label="Control flow graph">
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`} key={A.id}><Shapes A={A} P={P} hover={hover} hoverEdge={hoverEdge} setHover={setHover} setHoverEdge={setHoverEdge} animate /></g>
      </svg>
      <button className="fit" onClick={fit} data-tip="Re-centre and scale the graph">Fit view</button>
      <div className="zoom">
        <button onClick={() => zoomBy(1.25)} aria-label="Zoom in" data-tip="Zoom in (or use the mouse wheel)"><Icon n="pl" s={14} /></button>
        <button onClick={() => zoomBy(0.8)} aria-label="Zoom out" data-tip="Zoom out"><Icon n="mi" s={14} /></button>
        <button onClick={fit} aria-label="Fit view" data-tip="Fit view"><Icon n="fit" s={14} /></button></div>
    </div>
  );
}
