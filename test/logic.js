/* Logic tests. Usage: node test/logic.js [seeds] [scenario]
   Static checks on the data, command checks, determinism, save/load equivalence, and coverage over many computer-run games:
   which telegrams ever fire, which plans are ever completed, which aims are ever achieved. Anything never reached is listed. */
const path=require('path'),fs=require('fs');
const files=fs.readFileSync(path.join(__dirname,'..','build.js'),'utf8').match(/\[('[a-z0-9]+',?)+\]\.map/)[0].match(/'([a-z0-9]+)'/g).map(x=>x.slice(1,-1)).filter(f=>f!=='art'&&f!=='ui');
for(const f of files)require(path.join('..','src',f+'.js'));
const {SIM:G,DATA:D,MAP:M,EVENTS:E,PLANS:PL}=globalThis.PK;
const N=+process.argv[2]||16,scen=process.argv[3]||'1914';let bad=0;const fail=m=>{bad++;console.log('FAIL',m)},note=m=>console.log('    ',m);
const hash=S=>{let h=0;const s=G.save(S);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h};
function run(S,days,pick){for(let i=0;i<days;i++){let guard=0;while(S.pending.length&&guard++<50)G.resolve(S,0,pick?pick(S):0);G.tick(S)}return S}

/* ---- 1. static ---- */
const K=G.KEY,SC=D.SCEN[scen],pre=G.newGame('XXX',1,scen);
for(const id in PL){const p=PL[id];for(const r of p.req||[])if(!PL[r])fail('plan '+id+' requires unknown '+r);for(const x of p.x||[]){if(!PL[x])fail('plan '+id+' excludes unknown '+x);else if(!(PL[x].x||[]).includes(id))fail('plan '+id+' excludes '+x+' but not the reverse')}
  if(p.only&&!D.NATIONS[p.only])fail('plan '+id+' for unknown nation');if((p.req||[]).some(r=>(p.x||[]).includes(r)))fail('plan '+id+' requires what it excludes');
  for(const r of p.req||[])if(PL[r]&&PL[r].only&&PL[r].only!==p.only)fail('plan '+id+' requires a plan of another nation');
  /* a requirement that is itself ruled out by another requirement can never be met */
  const reqs=p.req||[];for(const a of reqs)for(const b of reqs)if(a!==b&&PL[a]&&(PL[a].x||[]).includes(b))fail('plan '+id+' requires two plans that exclude each other')}
for(const t in SC.claims||{})for(const k of SC.claims[t])if(K[k]===undefined)fail('claim '+t+' unknown province '+k);
for(const t in SC.oob||{})for(const row of SC.oob[t].slice(1))if(K[row[0]]===undefined)fail('oob '+t+' unknown province '+row[0]);else if(pre.prov[K[row[0]]].owner!==t)fail('oob '+t+' places troops in '+row[0]+' which it does not own');
for(const t in D.CORES)for(const k of D.CORES[t])if(K[k]===undefined)fail('core '+t+' unknown province '+k);
for(const t in (D.GOALS[scen]||{}))for(const g of D.GOALS[scen][t]){for(const k of g.keys||[])if(K[k]===undefined)fail('aim '+t+' unknown province '+k);if(g.tag&&!D.NATIONS[g.tag])fail('aim '+t+' unknown nation')}
for(const t of G.TAGS){if(pre.nat[t].dead)continue;const Nn=pre.nat[t];if(Nn.cap<0)fail(t+' has no capital');for(const tp of Nn.tpls)for(const b in tp.bn)if(!D.BN[b])fail(t+' template uses unknown battalion '+b);
  for(const id of Nn.tech)if(!D.TECH.find(x=>x.id===id))fail(t+' starts with unknown tech '+id);
  for(const g of G.goals(pre,t))if(!g.name||g.name==='?')fail(t+' has an aim of unknown type')}
for(const b in D.BN){if(D.BN[b].tech&&!D.TECH.find(x=>x.id===D.BN[b].tech))fail('battalion '+b+' gated by unknown tech');for(const e in D.BN[b].eq)if(!D.EQUIP[e])fail('battalion '+b+' needs unknown equipment '+e)}
for(const e in D.EQUIP)if(D.EQUIP[e].tech&&!D.TECH.find(x=>x.id===D.EQUIP[e].tech))fail('equipment '+e+' gated by unknown tech');
{const seen=new Set();for(const T of D.TECH){if(seen.has(T.id))fail('duplicate tech '+T.id);seen.add(T.id)}}
for(const id in E){const ev=E[id];if(!ev.title||!ev.opts)fail('event '+id+' is missing a title or options')}
/* every province can be reached from every other on its landmass or by sea link */
{const seen=new Set([0]),open=[0];while(open.length){const u=open.pop();for(const nb of G.NB[u])if(!seen.has(nb.j)){seen.add(nb.j);open.push(nb.j)}}if(seen.size!==M.provs.length)fail('map is not connected: '+(M.provs.length-seen.size)+' provinces unreachable')}
console.log('static checks done');

/* ---- 2. commands ---- */
{const tag=G.TAGS.find(t=>!pre.nat[t].dead&&D.NATIONS[t].major&&!D.NATIONS[t].regime),S=G.newGame(tag,7,scen),Nn=S.nat[tag],c=G.cmd,eq=(a,b,m)=>{if(a!==b)fail('command: '+m+' (got '+a+', wanted '+b+')')};
  Nn.pp=1000;eq(c.recruit(S,tag,0),'','recruit');eq(Nn.recruit.length,1,'recruit queued');c.cancelRecruit(S,tag,0);eq(Nn.recruit.length,0,'recruit cancelled');
  eq(c.build(S,tag,'civ'),'','build civ');eq(c.build(S,tag,'fleet'),'','build fleet');eq(c.build(S,tag,'fort',Nn.cap),'','build fort');eq(typeof c.build(S,tag,'fort'),'string','fort needs a province');
  const tech=G.techAvail(S,tag)[0];if(tech){eq(c.research(S,tag,tech.id),'','research')}
  eq(c.law(S,tag,'cons',Math.min(2,Nn.cons+1))==='',true,'law change');eq(c.law(S,tag,'econ',3)!=='',true,'war law refused in peace');
  eq(c.template(S,tag,0,{name:'T',bn:{inf:0},sup:[]})!=='',true,'empty template refused');eq(c.template(S,tag,Nn.tpls.length,{name:'T',bn:{inf:6,art:2},sup:['mg']}),'','new template');
  const ids=S.divs.filter(d=>d.o===tag).slice(0,4).map(d=>d.id);eq(c.armyNew(S,tag,ids),'','army formed');eq(S.divs.filter(d=>d.army===Nn.armies[0].id).length,ids.length,'army membership');
  eq(!!Nn.armies[0].gen,true,'army has a general');c.armySet(S,tag,Nn.armies[0].id,'stance',2);c.armyGeneral(S,tag,Nn.armies[0].id);c.armyDisband(S,tag,Nn.armies[0].id);eq(Nn.armies.length,0,'army disbanded');
  const open=G.plansFor(S,tag).filter(p=>G.planState(S,tag,p)==='open');eq(open.length>0,true,'a plan is open at the start');if(open.length){eq(c.plan(S,tag,open[0].id),'','plan started');eq(c.plan(S,tag,open[0].id)!=='',true,'second plan refused')}
  const other=G.TAGS.find(t=>t!==tag&&!S.nat[t].dead&&!G.friendly(S,tag,t)&&!D.NATIONS[t].major);
  eq(c.improve(S,tag,other),'','improve relations');eq(c.guarantee(S,tag,other),'','guarantee');eq(c.justify(S,tag,other),'','justify');
  const d0=S.divs.find(d=>d.o===tag),nb=G.NB[d0.p].find(n=>G.canEnter(S,tag,n.j)&&!n.sea);if(nb){eq(G.order(S,[d0.id],nb.j),1,'move order');G.halt(S,[d0.id]);eq(d0.path,null,'halt')}
  eq(c.declare(S,tag,other),'','declare war');eq(G.atWar(S,tag,other),true,'war exists');run(S,400);eq(isNaN(Nn.stab),false,'state sane after war');
  for(const g of G.goals(S,tag))eq(typeof g.ok,'boolean','aim evaluates');
  console.log('command checks done as',tag)}

/* ---- 3. determinism and save/load ---- */
{const a=run(G.newGame('XXX',99,scen),500),b=run(G.newGame('XXX',99,scen),500);if(hash(a)!==hash(b))fail('same seed gave two different histories');
  const c=run(G.newGame('XXX',99,scen),250),c2=G.load(G.save(c));run(c,250);run(c2,250);if(hash(c)!==hash(c2))fail('a game continued from a save diverges from the original');
  const d=run(G.newGame('XXX',100,scen),500);if(hash(a)===hash(d))fail('different seeds gave identical histories');console.log('determinism checks done')}

/* ---- 4. coverage ---- */
const fired={},planDone={},aims={},ends={},days=pre.end-pre.day0,t0=Date.now();let stale=0,warsStart=0,treaties=0;
for(let s=1;s<=N;s++){const S=run(G.newGame('XXX',s*17+3,scen),days);for(const id in S.fired)fired[id]=(fired[id]||0)+1;
  for(const t of G.TAGS){for(const p of S.nat[t].plans||[])planDone[p]=(planDone[p]||0)+1;if(S.own0.includes(t)){aims[t]=aims[t]||{};for(const g of G.goals(S,t)){aims[t][g.name]=aims[t][g.name]||0;if(g.ok)aims[t][g.name]++}}}
  if(S.flags.great_war!==undefined)warsStart++;treaties+=S.treaties.length;for(const k in S.wars)if(S.day-S.wars[k].day>365*5)stale++;
  for(const d of S.divs)if(isNaN(d.str+d.org))fail('NaN division in seed '+s)}
console.log(N+' games of '+days+' days in '+Math.round((Date.now()-t0)/1000)+'s: a war between great powers in '+warsStart+', '+treaties+' treaties, '+stale+' wars older than five years still open');
const story=Object.keys(E).filter(id=>id[0]!=='_'&&!E[id].fate&&((E[id].scen||'1914')===scen||E[id].scen==='any'));
const never=story.filter(id=>!fired[id]);if(never.length)note('telegrams that never fired: '+never.join(', '));
const plans=Object.values(PL).filter(p=>!p.scen||p.scen===scen);const pn=plans.filter(p=>!planDone[p.id]&&(!p.only||!pre.nat[p.only].dead));if(pn.length)note('plans never completed by the computer: '+pn.map(p=>p.id).join(', '));
for(const t in aims){const z=Object.keys(aims[t]).filter(k=>!aims[t][k]);if(z.length&&D.GOALS[scen]&&D.GOALS[scen][t])note('aims never achieved by a computer-run '+t+': '+z.join('; '));}
note('aims achieved (games out of '+N+'): '+Object.keys(aims).filter(t=>D.GOALS[scen]&&D.GOALS[scen][t]).map(t=>t+' '+Object.values(aims[t]).join('/')).join('  '));
/* ---- 5. can each territorial aim be reached at all? Give the nation a crushing army, set it on the owners, break the owners' will, and see whether the peace delivers. ---- */
for(const t in (D.GOALS[scen]||{})){for(const g of D.GOALS[scen][t]){if(g.t!=='own')continue;let ok=false,why='';
  for(let s=1;s<=3&&!ok;s++){const S=G.newGame('XXX',s*5,scen),Nn=S.nat[t];if(Nn.dead){why='nation absent';break}const owners=[...new Set(g.keys.map(k=>S.prov[K[k]].owner))].filter(o=>o!==t);
    for(const o of owners){if(G.friendly(S,t,o))G.leaveFaction(S,t,true);G.declareWar(S,t,o,{noAsk:true})}
    G.spawn(S,t,Nn.cap,0,120,.8);for(const d of S.divs)if(d.o===t){d.xp=.9}Nn.stock.rifles+=4e5;Nn.stock.guns+=2e4;Nn.stock.mgs+=2e4;Nn.stock.hguns+=5e3;Nn.navy+=400;G.index(S);
    for(let i=0;i<1500&&!ok;i++){Nn.ws=90;Nn.stab=90;if(i>200)for(const o of G.activeEnemies(S,t)){S.nat[o].ws=4;S.nat[o].stab=10}G.tick(S);if(i%30===0||!G.enemies(S,t).length)ok=g.keys.every(k=>S.prov[K[k]].owner===t);if(!G.enemies(S,t).length)break}
    if(!ok)why=g.keys.map(k=>k+':'+S.prov[K[k]].owner+'/'+S.prov[K[k]].ctrl).join(' ')+' wars:'+G.enemies(S,t).join(',')}
  if(!ok)fail('aim "'+(g.n||'own')+'" of '+t+' could not be reached even with overwhelming force ('+why+')')}}
console.log('aim reachability done');
/* ---- 6. seat trials: each nation with written aims is played from its own seat, armies and economy on automatic, telegrams answered at random.
   An aim nobody ever reaches this way is suspect; a nation that reaches none of its aims in any trial is a failure. ---- */
{let z=777;const r=()=>{z=(z*1103515245+12345)&0x7fffffff;return z/0x7fffffff},trials=Math.max(6,Math.round(N/2));
 for(const t in (D.GOALS[scen]||{})){if(pre.nat[t].dead)continue;const got={};let any=0;
  for(let s=1;s<=trials;s++){const S=G.newGame(t,s*13+1,scen);S.nat[t].auto=true;run(S,days,S=>{const pe=S.pending[0];return Math.floor(r()*E[pe.id].opts(S,pe.tag,pe.data).length)});
   for(const g of G.goals(S,t)){got[g.name]=(got[g.name]||0)+(g.ok?1:0);if(g.ok)any++}}
  const zero=Object.keys(got).filter(k=>!got[k]);note('seat '+t+' ('+trials+' trials): '+Object.keys(got).map(k=>k+' '+got[k]).join(', '));
  if(!any)fail('no aim of '+t+' was reached in any seat trial');else if(zero.length)note('  never reached from the '+t+' seat: '+zero.join('; '))}
 console.log('seat trials done')}
/* ---- 7. carrying a finished world into 1936 ---- */
if(scen==='1914'&&G.carry){let wars=0;for(const seed of [1914,42,99,7,23]){for(const tag of ['XXX','FRA']){const S0=run(G.newGame(tag,seed,'1914'),days);if(tag!=='XXX'&&S0.nat[tag].dead)continue;const S2=G.carry(S0);
   if(!S2){if(tag==='XXX')fail('carry returned nothing for seed '+seed);continue}if(S2.scen!=='carry'||S2.day!==D.DAY(1936,1,1))fail('carried world has the wrong scenario or date');
   for(let i=0;i<M.provs.length;i++)if(S2.nat[S2.prov[i].owner].dead)fail('carried world: '+M.provs[i].key+' is owned by a dead nation');
   if(tag!=='XXX')S2.nat[tag].auto=true;run(S2,S2.end-S2.day);for(const d of S2.divs)if(isNaN(d.str+d.org))fail('NaN in carried world');wars+=S2.treaties.length;const S3=G.load(G.save(S2));if(!S3||S3.scen!=='carry')fail('carried world does not survive a save');
   if(tag!=='XXX')for(const g of G.goals(S2,tag))if(typeof g.ok!=='boolean')fail('aim in carried world does not evaluate')}}
 console.log('carry checks done ('+wars+' treaties across the carried worlds)')}
console.log(bad?bad+' FAILURES':'no failures');process.exit(bad?1:0);
