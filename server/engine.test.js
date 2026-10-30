const E=require('./engine');const assert=require('assert');
const ex={
cond:'1: a = b + c\n2: if a < 10 goto 6\n3: d = a * 2\n4: e = d + 5\n5: goto 7\n6: d = a - 2\n7: print d',
seq:'1: a = b + c\n2: d = a * 2\n3: print d',
loop:'1: i = 0\n2: if i >= 10 goto 6\n3: print i\n4: i = i + 1\n5: goto 2\n6: return',
lbl:'x = 0\nL1:\nx = x + 1\nif x < 5 goto L1\nreturn x',
unreach:'1: goto 3\n2: a = 1\n3: return'};
let r=E.analyze(ex.cond);
assert.deepStrictEqual(r.leaders.map(l=>l.line),[1,3,6,7]);
assert.deepStrictEqual(r.basicBlocks.map(b=>b.startLine+'-'+b.endLine),['1-2','3-5','6-6','7-7']);
assert.deepStrictEqual(r.cfg.edges.map(e=>e.source+e.target+e.type),['B1B3true','B1B2false','B2B4jump','B3B4next']);
console.log(r.leaders.map(l=>l.reason),r.dominators,r.cyclomaticComplexity);
r=E.analyze(ex.seq);assert(r.leaders.length==1&&r.cfg.edges.length==0);
r=E.analyze(ex.loop);console.log(r.cfg.edges.map(e=>e.source+'>'+e.target+':'+e.type).join(' '),r.dominators);
r=E.analyze(ex.lbl);console.log(r.ok,r.leaders.map(l=>l.line),r.cfg.edges.map(e=>e.source+'>'+e.target+':'+e.type).join(' '));
r=E.analyze(ex.unreach);console.log(r.reachability,r.dominators);
console.log(E.analyze('1: a = 1\n2: goto 20').errors,E.analyze('').errors,E.analyze('1: a = 1\n2: ???').errors,E.analyze('1: a=1\n1: b=2').errors,E.analyze('goto NOPE').errors);
for(const k of ['x = a + b\nif x > 10 goto 5\ny = 1\ngoto 6\ny = 2\nz = y\nprint z']){const q=E.analyze(k);console.log(q.ok,q.errors)}
console.log(E.analyze('1: a = 0\n2: if a == 0 goto 6\n3: if a > 5 goto 8\n4: b = a + 1\n5: goto 9\n6: b = 1\n7: goto 9\n8: b = 2\n9: print b').cfg.edges.length);
console.log('ALL OK');
