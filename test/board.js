/* Board game tests. Usage: node test/board.js [games] */
const path=require('path');for(const f of['mapdata','data','sim','events','plans','scen1936','board'])require(path.join('..','src',f+'.js'));
const {BOARD:B,DATA:D,SIM:G}=globalThis.PK;const N=+process.argv[2]||20;let bad=0;const fail=m=>{bad++;console.log('FAIL',m)},note=m=>console.log('    ',m);
for(const scen of Object.keys(B.SCEN)){const BD=B.board(scen),SC=B.SCEN[scen];
 console.log('== '+scen+': '+BD.T.length+' territories, '+BD.tags.length+' nations');
 /* static */
 BD.T.forEach((t,i)=>{if(!BD.adj[i].length)fail(scen+' '+t.name+' has no neighbours');if(!t.provs.length)fail(scen+' '+t.name+' has no provinces')});
 {const seen=new Set([0]),q=[0];while(q.length){const u=q.pop();for(const e of BD.adj[u])if(!seen.has(e.t)){seen.add(e.t);q.push(e.t)}}if(seen.size!==BD.T.length)fail(scen+' board not connected')}
 for(const t of SC.playable)if(!BD.tags.includes(t))fail(scen+' playable nation '+t+' is not on the board');
 for(const t of BD.tags)if(BD.caps[t]===undefined)fail(scen+' '+t+' has no capital');
 const names=BD.T.map(t=>t.name);for(const n of new Set(names))if(names.filter(x=>x===n).length>1)note(scen+' two territories called '+n);
 /* dice */
 {let s=0;for(const k of['11','12','21','22','31','32']);const p=B.winChance(10,1),q=B.winChance(1,10);if(!(p>.99&&q<.01))fail('win chance looks wrong '+p+' '+q)}
 /* computer-only games */
 const res={},fired={};let turns=0;
 for(let s=1;s<=N;s++){const st=B.newGame(scen,null,'normal',s*7+1);let g=0;while(!st.result&&g++<60){B.autoTurn(st);for(const x of st.terr)if(!(x.a>=0)||isNaN(x.a))throw new Error('bad armies')}
  if(!st.result)fail(scen+' seed '+s+' never ended');const key=(st.result.winner?st.teams[st.result.winner].name:'draw')+' '+(st.result.timeUp?'at time':'turn '+st.result.turn);res[key]=(res[key]||0)+1;turns+=st.result.turn;for(const id in st.fired)if(st.fired[id])fired[id]=(fired[id]||0)+1;
  if(JSON.stringify(JSON.parse(JSON.stringify(st)))!==JSON.stringify(st))fail('state not plain JSON')}
 note('outcomes over '+N+' games: '+Object.entries(res).map(([k,v])=>k+' ×'+v).join(', ')+' · average length '+(turns/N).toFixed(1)+' turns');
 const nf=Object.keys(B.EVENTS).filter(id=>B.EVENTS[id].scen===scen&&!fired[id]&&id!=='cze_alone');if(nf.length)note('events never fired in computer games: '+nf.join(', '));
 /* every seat, with the computer playing it, can end in victory */
 for(const p of SC.playable){let win=0,games=0;for(const diff of['easy','normal'])for(let s=1;s<=6;s++){const st=B.newGame(scen,p,diff,s*13+5);let g=0;while(!st.result&&g++<60)B.autoTurn(st);games++;if(st.result&&st.result.r==='victory')win++}
  note('seat '+p+': won '+win+' of '+games+' (easy and normal, computer playing the seat)');if(!win&&!['ITA','OTT','SER','CZE','POL'].includes(p))fail(scen+' seat '+p+' never wins')}
 /* every telegram option runs */
 for(const id in B.EVENTS){const E=B.EVENTS[id];if(E.scen!==scen)continue;for(const tn of[1,Math.round(SC.turns/2)]){const st=B.newGame(scen,null,'normal',5);for(let i=1;i<tn;i++)B.autoTurn(st);if(st.result)continue;const n=E.opts(st).length;for(let oi=0;oi<n;oi++){const s2=JSON.parse(JSON.stringify(st));try{const o=E.opts(s2)[oi];if(o.fx)o.fx(s2);let g=0;while(!s2.result&&g++<3)B.autoTurn(s2)}catch(e){fail(scen+' event '+id+' option '+oi+': '+e.message)}}}}
 /* player actions */
 {const p=SC.playable[0],st=B.newGame(scen,p,'easy',3);while(st.cards.length)B.resolve(st,0,0);const mine=st.terr.findIndex(x=>x.o===p);const before=st.terr[mine].a,n=st.toPlace;if(B.place(st,mine,1))fail('place refused');if(st.terr[mine].a!==before+1)fail('place did not add');B.place(st,mine,99);if(st.phase!=='attack'||st.toPlace!==0)fail('placing all should move to attack phase');
  let from=-1,to=-1;for(let i=0;i<st.terr.length&&from<0;i++)if(st.terr[i].o===p&&st.terr[i].a>=2)for(const e of BD.adj[i])if(B.hostile(st,p,st.terr[e.t].o)){from=i;to=e.t;break}
  if(from>=0){st.terr[from].a=40;const r=B.blitz(st,from,to);if(!r.length)fail('attack did nothing');if(st.terr[to].o===p&&!st.pendingMove)fail('no move-in after conquest');if(st.pendingMove){B.moveIn(st,5)}}
  B.endAttacks(st);const own=st.terr.map((x,i)=>i).filter(i=>st.terr[i].o===p&&st.terr[i].a>1);let moved=false;for(const i of own){const r=[...B.reach(st,i)];if(r.length){if(B.fortify(st,i,r[0],1))fail('fortify refused');moved=true;break}}if(moved&&!B.fortify(st,own[0],own[0],1))fail('second move allowed');
  const t0=st.turn;B.endTurn(st);if(!st.result&&st.turn!==t0+1)fail('turn did not advance')}
}
console.log(bad?bad+' FAILURES':'no failures');process.exit(bad?1:0);
