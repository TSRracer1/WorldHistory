/* A whole game through the real interface, start to reckoning, played by a simple but purposeful policy:
   form every stack into an army and set it to Advance, always keep a plan and research going, build factories,
   station squadrons, form air wings, answer telegrams, and keep the clock running. Then carry the world into 1936 and play that too.
   Needs Playwright with Chromium. Usage: node test/ui-full.js [nation] [seed] [scenario] */
const {chromium}=require('playwright'),path=require('path');
const tag=process.argv[2]||'FRA',seed=process.argv[3]||'1914',scen=process.argv[4]||'1914';
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];
 p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.join(__dirname,'..','index.html'));await p.waitForTimeout(300);
 const clickIf=async sel=>{const el=p.locator(sel).first();if(await el.count()&&await el.isVisible()&&await el.isEnabled()){await el.click();return true}return false};
 async function housekeeping(){
  /* armies: every province holding loose divisions becomes an army on Advance */
  const stacks=await p.evaluate(()=>{const S=PK.UI.state(),out=new Set();for(const d of S.divs)if(d.o===S.player&&!d.army&&!d.ret)out.add(PK.MAP.provs[d.p].key);return[...out].slice(0,6)});
  for(const k of stacks){await p.evaluate(k=>{PK.UI.act('desel');PK.UI.click(k)},k);await p.evaluate(()=>{const S=PK.UI.state(),N=S.nat[S.player];if((N.armies||[]).length<12)PK.UI.act('armyNew');else PK.UI.act('armyAdd:'+N.armies[S.day%N.armies.length].id);const a=N.armies[N.armies.length-1];if(a&&!a.stance)PK.UI.act('armySet:'+a.id+':2');PK.UI.act('desel')})}
  await p.evaluate(()=>PK.UI.act('panel:plans'));await clickIf('#panel .plan.open:not([disabled])');
  await p.evaluate(()=>PK.UI.act('panel:res'));await clickIf('#panel .tech:not(.plan):not([disabled])');await clickIf('#panel .tech:not(.plan):not([disabled])');
  await p.evaluate(()=>PK.UI.act('panel:prod'));await clickIf('#panel [data-act="build:mil"]');
  await p.evaluate(()=>PK.UI.act('panel:sea'));await clickIf('#panel [data-act="wing:f"]');await clickIf('#panel [data-act="wing:b"]');
  await p.evaluate(()=>{const S=PK.UI.state(),N=S.nat[S.player];if(PK.SIM.inWar(S,S.player)&&N.pp>=PK.DATA.LAW_COST){if(N.econ<2)PK.UI.act('law:econ:'+(N.econ+1));else if(N.cons<3)PK.UI.act('law:cons:'+(N.cons+1))}PK.UI.act('closepanel')})}
 async function playToEnd(label){let last=-1,stuck=0,turns=0;
  for(;;){const st=await p.evaluate(()=>{const S=PK.UI.state(),m=document.querySelector('#modal');return{day:S.day,end:S.end,ended:S.flags.ended!==undefined,modal:m&&!m.hidden?(m.textContent.includes('The reckoning')?'end':'tele'):'',dead:S.nat[S.player].dead}});
   if(st.modal==='end')break;if(st.modal==='tele'){const n=await p.locator('#modal [data-act]').count();await p.locator('#modal [data-act]').nth(turns%n).click();turns++;continue}
   if(st.day===last){if(++stuck>40){errs.push(label+': the clock stopped at day '+st.day);break}}else stuck=0;last=st.day;
   if(turns++%6===0){await p.evaluate(()=>PK.UI.setSpeed(0));await housekeeping()}
   await p.evaluate(()=>PK.UI.setSpeed(4));await p.waitForTimeout(350);if(errs.length)break}
  return p.evaluate(()=>{const S=PK.UI.state(),N=S.nat[S.player],g=PK.SIM.goals(S,S.player);return{date:PK.SIM.date(S.day).str,scen:S.scen,aims:g.map(x=>(x.ok?'✓':'✗')+x.name).join(', '),armies:(N.armies||[]).length,plans:(N.plans||[]).length,tech:N.tech.length,wings:S.wings.filter(w=>w.o===S.player).length,lost:Math.round(N.lost/1000)+'k',dead:N.dead,rows:document.querySelectorAll('#modal table.cmp tbody tr').length}})}
 if(scen!=='1914')await p.click('[data-act="scen:'+scen+'"]');await p.fill('#seed',seed);await p.click('[data-act="new:'+tag+'"]');await p.waitForTimeout(200);await p.evaluate(()=>{PK.UI.act('closepanel');for(const k of['plans','industry','research','sea'])PK.UI.act('mgr:'+k+':0')});/* this test plays every area by hand */
 const r1=await playToEnd(scen);console.log(scen,tag,JSON.stringify(r1));
 if(!errs.length&&r1.rows<4)errs.push('the comparison table is short: '+r1.rows+' rows');
 if(!errs.length&&!r1.dead&&scen==='1914'){if(r1.rows<8)errs.push('the comparison table is short: '+r1.rows+' rows');if(await clickIf('#modal [data-act="carry"]')){await p.waitForTimeout(400);const r2=await playToEnd('carry');console.log('1936 (carried)',tag,JSON.stringify(r2));if(r2.scen!=='carry')errs.push('carry did not start a carried world');if(r2.rows<4)errs.push('carried world has no summary table')}else errs.push('no carry button on the reckoning')}
 console.log(errs.length?'FAIL '+errs.slice(0,4).join(' | '):'ok');await b.close();process.exit(errs.length?1:0)})();
