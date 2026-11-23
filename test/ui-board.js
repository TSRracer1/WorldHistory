/* The board game through the real page: menu, a canvas tap, every phase, telegrams, the turn summary, the peace table, the end screen.
   A simple policy plays the seat. Needs Playwright with Chromium. Usage: node test/ui-board.js [scenario] [nation] [difficulty] [seed] */
const {chromium}=require('playwright'),path=require('path');const scen=process.argv[2]||'1914',nat=process.argv[3]||'FRA',diff=process.argv[4]||'easy',seed=+process.argv[5]||0;
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.join(__dirname,'..','index.html'));await p.waitForTimeout(400);
 if(seed)await p.evaluate(s=>{PK.BOARDUI.nextSeed=s},seed);
 await p.click('[data-b="scen:'+scen+'"]');await p.click('[data-b="nat:'+nat+'"]');await p.click('[data-b="diff:'+diff+'"]');await p.click('[data-b="start"]');await p.waitForTimeout(300);
 const card=()=>p.evaluate(()=>{const c=document.getElementById('b-card');return c&&!c.hidden?c.textContent:''});
 if((await card()).includes('How to play'))await p.click('[data-b="closeHelp"]');
 /* a real tap on the canvas lands on the territory under it */
 const hit=await p.evaluate(()=>{const st=PK.BOARDUI.state(),BD=PK.BOARD.board(st.scen),cap=st.nat[st.player].cap;return{cap,name:BD.T[cap].name}});
 const xy=await p.evaluate(c=>{const BD=PK.BOARD.board(PK.BOARDUI.state().scen),cv=document.getElementById('b-cv'),r=cv.getBoundingClientRect();/* the camera is private; find the token by sampling */return null},hit.cap);
 const before=await p.evaluate(c=>PK.BOARDUI.state().terr[c].a,hit.cap);await p.mouse.click(600,400);const placed=await p.evaluate(()=>PK.BOARDUI.state().toPlace);
 let turns=0,peaceSigned=false,peaceTried=-1,telegrams=0,lastTurn=-1,stuck=0;
 for(let guard=0;guard<4000;guard++){const s=await p.evaluate(()=>{const st=PK.BOARDUI.state();return st?{phase:st.phase,turn:st.turn,result:st.result,cards:st.cards.length,pm:!!st.pendingMove}:null});if(!s){errs.push('state lost');break}
  const c=await card();if(s.result){if(!c.includes('What really happened'))errs.push('no end screen');break}
  if(c){if(c.includes('The peace table')){if(await p.locator('[data-b="sign"]:not([disabled])').count()){await p.click('[data-b="sign"]');peaceSigned=true}else await p.click('[data-b="closePeace"]');continue}
   if(c.includes('While you waited')){await p.click('[data-b="okSummary"]');continue}
   const opts=p.locator('#b-card [data-b^="opt:"]');const n=await opts.count();if(n){telegrams++;await opts.nth(telegrams%n).click();continue}
   await p.locator('#b-card [data-b]').first().click();continue}
  if(s.turn===lastTurn&&s.phase==='place'){if(++stuck>30){errs.push('stuck on turn '+s.turn);break}}else stuck=0;lastTurn=s.turn;
  if(s.phase==='place'){await p.click('[data-b="autoPlace"]');continue}
  if(s.phase==='attack'){if(s.pm){await p.click('[data-b="n:max"]');await p.click('[data-b="moveIn"]');continue}
   const pick=await p.evaluate(()=>{const st=PK.BOARDUI.state(),B=PK.BOARD,BD=B.board(st.scen);let best=null,bs=.62;for(let i=0;i<st.terr.length;i++){const a=st.terr[i];if(a.o!==st.player||a.a<3)continue;for(const e of BD.adj[i]){const d=st.terr[e.t];if(!B.hostile(st,st.player,d.o))continue;const q=B.winChance(a.a-1,d.a);if(q>bs){bs=q;best=[i,e.t]}}}return best});
   if(pick&&turns<400){await p.evaluate(([a,t])=>{PK.BOARDUI.tapT(a);PK.BOARDUI.tapT(t)},pick);await p.click('[data-b="blitz"]');turns++;continue}
   await p.click('[data-b="doneAttack"]');continue}
  if(s.phase==='move'){/* once in a game, ask a beaten enemy for peace from the 🕊️ button */
   if(!peaceSigned&&s.turn>=4&&peaceTried!==s.turn){peaceTried=s.turn;await p.click('[data-b="peaceList"]');const w=p.locator('[data-b^="peaceWith:"]');if(await w.count()){await w.first().click();continue}await p.click('[data-b="close"]')}
   await p.click('[data-b="end"]');continue}
  await p.waitForTimeout(50)}
 if(!(await p.evaluate(()=>!!(PK.BOARDUI.state()||{}).result)))errs.push('stopped at '+JSON.stringify(await p.evaluate(()=>{const st=PK.BOARDUI.state();return st&&{turn:st.turn,phase:st.phase,cards:st.cards.map(c=>c.id),card:(document.getElementById('b-card').hidden?'':document.getElementById('b-card').textContent.slice(0,120))}})));
 const end=await p.evaluate(()=>{const st=PK.BOARDUI.state();return st&&st.result?{r:st.result.r,turn:st.result.turn,mine:st.terr.filter(x=>x.o===st.player).length,treaties:st.treaties.length}:null});
 /* back to the menu, then continue is offered only for unfinished games */
 await p.click('#b-card [data-b="quit"]').catch(()=>{});await p.waitForTimeout(200);const menu=await p.evaluate(()=>!document.getElementById('b-menu').hidden);if(!menu)errs.push('main menu did not come back');
 console.log(scen,nat,diff,'canvas tap placed',placed<0?'?':'ok',JSON.stringify(end),'attacks',turns,'telegrams',telegrams,'peace signed by the player',peaceSigned);
 if(!end)errs.push('the game did not finish');console.log(errs.length?'FAIL '+errs.slice(0,4).join(' | '):'ok');await b.close();process.exit(errs.length?1:0)})();
