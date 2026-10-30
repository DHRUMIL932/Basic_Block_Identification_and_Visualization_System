const Engine=(()=>{
const NUM=/^(\d+)\s*:\s*(.*)$/,LBL=/^([A-Za-z_]\w*)\s*:$/,CMP=/^[\w.]+\s*(<=|>=|==|!=|<|>)\s*[\w.]+$|^[\w.]+$/;
function classify(t,line){
 let m;const base={line,code:t};
 if(m=t.match(LBL))return{...base,type:'label',label:m[1]};
 if(m=t.match(/^if\s+(.+?)\s+goto\s+(\w+)$/i)){if(!CMP.test(m[1].trim()))return null;return{...base,type:'conditional-jump',condition:m[1].trim(),target:m[2]};}
 if(m=t.match(/^goto\s+(\w+)$/i))return{...base,type:'unconditional-jump',target:m[1]};
 if(m=t.match(/^print\s+(.+)$/i))return{...base,type:'print',operand:m[1].trim()};
 if(/^return(\s+[\w.]+)?$/i.test(t))return{...base,type:'return',operand:t.slice(6).trim()};
 if(m=t.match(/^([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/)){if(!/^[\w.\s+\-*\/%()]+$/.test(m[2]))return null;return{...base,type:'assignment',lhs:m[1],rhs:m[2].trim()};}
 return null;
}
function parse(src){
 const errors=[],statements=[],seen=new Set();let n=0;
 if(!src||!src.trim())return{statements,errors:['Please enter Three Address Code.']};
 src.split('\n').forEach(raw=>{
  let t=raw.trim();if(!t)return;n++;let line=n,m=t.match(NUM);
  if(m){line=+m[1];t=m[2].trim();}
  if(seen.has(line)){errors.push(`Duplicate line number detected: ${line}.`);return;}
  seen.add(line);
  const s=classify(t,line);
  if(!s)errors.push(`Unable to classify line ${line}.`);else statements.push(s);
 });
 return{statements,errors};
}
function resolve(statements,errors){
 const byLine=new Map(),byLabel=new Map();
 statements.forEach((s,i)=>{byLine.set(s.line,i);if(s.type==='label'){if(byLabel.has(s.label))errors.push(`Duplicate label "${s.label}" on line ${s.line}.`);byLabel.set(s.label,i);}});
 statements.forEach(s=>{
  if(!s.target)return;
  const idx=/^\d+$/.test(s.target)?byLine.get(+s.target):byLabel.get(s.target);
  if(idx===undefined)errors.push(/^\d+$/.test(s.target)?`Line ${s.line} references target ${s.target}, but target ${s.target} does not exist.`:`Line ${s.line} jumps to label "${s.target}", but that label is not defined.`);
  else{s.targetIndex=idx;s.targetLine=statements[idx].line;}
 });
}
function findLeaders(st){
 const map=new Map(),add=(i,r)=>{if(i<0||i>=st.length)return;if(!map.has(i))map.set(i,[]);if(!map.get(i).includes(r))map.get(i).push(r);};
 add(0,'First statement');
 st.forEach((s,i)=>{if(s.targetIndex!==undefined)add(s.targetIndex,'Jump target');});
 st.forEach((s,i)=>{if(s.type==='conditional-jump'||s.type==='unconditional-jump')add(i+1,'Statement following a jump');else if(s.type==='return')add(i+1,'Statement following a return');});
 const order=['First statement','Jump target','Statement following a jump','Statement following a return'];
 return[...map.keys()].sort((a,b)=>a-b).map(i=>({index:i,line:st[i].line,reasons:map.get(i).sort((a,b)=>order.indexOf(a)-order.indexOf(b)),reason:map.get(i).sort((a,b)=>order.indexOf(a)-order.indexOf(b)).join(' + ')}));
}
function buildBlocks(st,leaders){
 return leaders.map((l,k)=>{const end=k+1<leaders.length?leaders[k+1].index:st.length;const stmts=st.slice(l.index,end);
  return{id:'B'+(k+1),startIndex:l.index,endIndex:end-1,startLine:stmts[0].line,endLine:stmts[stmts.length-1].line,leaderLine:l.line,statements:stmts};});
}
function buildCFG(blocks,st){
 const edges=[],blockOf=i=>blocks.find(b=>i>=b.startIndex&&i<=b.endIndex);
 blocks.forEach((b,k)=>{const last=b.statements[b.statements.length-1],next=blocks[k+1];
  if(last.type==='conditional-jump'){edges.push({source:b.id,target:blockOf(last.targetIndex).id,type:'true'});if(next)edges.push({source:b.id,target:next.id,type:'false'});}
  else if(last.type==='unconditional-jump')edges.push({source:b.id,target:blockOf(last.targetIndex).id,type:'jump'});
  else if(last.type!=='return'&&next)edges.push({source:b.id,target:next.id,type:'next'});});
 return{nodes:blocks.map(b=>b.id),edges};
}
function reachability(cfg){
 const seen=new Set([cfg.nodes[0]]),q=[cfg.nodes[0]];
 while(q.length){const u=q.shift();cfg.edges.filter(e=>e.source===u).forEach(e=>{if(!seen.has(e.target)){seen.add(e.target);q.push(e.target);}});}
 const r={};cfg.nodes.forEach(n=>r[n]=seen.has(n));return r;
}
function components(cfg){
 const p={};cfg.nodes.forEach(n=>p[n]=n);const f=x=>p[x]===x?x:(p[x]=f(p[x]));
 cfg.edges.forEach(e=>{p[f(e.source)]=f(e.target);});return new Set(cfg.nodes.map(f)).size;
}
function complexity(cfg){const E=cfg.edges.length,N=cfg.nodes.length,P=components(cfg);return{E,N,P,M:E-N+2*P};}
function dominators(cfg,reach){
 const nodes=cfg.nodes.filter(n=>reach[n]),entry=cfg.nodes[0],dom={};
 nodes.forEach(n=>dom[n]=n===entry?new Set([entry]):new Set(nodes));
 let changed=true;
 while(changed){changed=false;
  for(const n of nodes){if(n===entry)continue;
   const preds=cfg.edges.filter(e=>e.target===n&&reach[e.source]).map(e=>dom[e.source]);
   let inter=preds.length?new Set([...preds[0]].filter(x=>preds.every(s=>s.has(x)))):new Set();
   inter.add(n);
   if(inter.size!==dom[n].size||[...inter].some(x=>!dom[n].has(x))){dom[n]=inter;changed=true;}}}
 const out={};cfg.nodes.forEach(n=>out[n]=reach[n]?cfg.nodes.filter(x=>dom[n].has(x)):null);return out;
}
function analyze(src){
 const{statements,errors}=parse(src);
 if(statements.length)resolve(statements,errors);
 if(errors.length)return{ok:false,errors};
 const leaders=findLeaders(statements),basicBlocks=buildBlocks(statements,leaders),cfg=buildCFG(basicBlocks,statements),reach=reachability(cfg);
 return{ok:true,statements,leaders,basicBlocks,cfg,reachability:reach,dominators:dominators(cfg,reach),cyclomaticComplexity:complexity(cfg)};
}
return{analyze,parse};
})();

module.exports=Engine;