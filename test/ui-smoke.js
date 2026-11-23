/* Browser test. Needs Playwright with Chromium (not a project dependency).
   1. A scripted pass through every panel and the end screen.
   2. A seeded "monkey": random clicks on anything clickable, random map clicks, time running, telegrams answered at random.
   Fails on any page error or broken state. Usage: node test/ui-smoke.js [steps] [scenario,...] */
const {chromium}=require('playwright'),path=require('path');
const steps=+process.argv[2]||300,scens=(process.argv[3]||'1914').split(',');
let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
const CHECK=()=>{const S=PK.UI.state();if(!S)return'no state';for(const d of S.divs)if(!(d.str>=0&&d.str<=1.001&&d.org>=0&&d.org<=1.001))return'bad division '+JSON.stringify(d);
  for(const t of PK.SIM.TAGS){const N=S.nat[t];for(const k of['pp','stab','ws','lost','mil','civ','navy'])if(typeof N[k]!=='number'||isNaN(N[k]))return'NaN '+t+'.'+k}return''};
(async()=>{const b=await chromium.launch();let fail=0;
for(const scen of scens){const tags=await (async()=>{const p=await b.newPage();await p.goto('file://'+path.join(__dirname,'..','index.html'));if(scen!=='1914')await p.click('[data-act="scen:'+scen+'"]');const t=await p.evaluate(()=>[...document.querySelectorAll('[data-act^="new:"]')].map(e=>e.dataset.act.slice(4)));await p.close();return t})();
 const seats=[tags[0],tags[Math.floor(tags.length/3)],tags[tags.length-1]];
 for(const tag of seats){const p=await b.newPage({viewport:{width:1100,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+path.join(__dirname,'..','index.html'));await p.waitForTimeout(300);
  if(scen!=='1914')await p.click('[data-act="scen:'+scen+'"]');
  await p.click('[data-act="new:'+tag+'"]');await p.waitForTimeout(200);
  /* scripted: every panel renders */
  for(const k of['help','gov','plans','dip','army','prod','res','chron','menu']){await p.evaluate(k=>PK.UI.act('panel:'+k),k);await p.waitForTimeout(30)}
  await p.evaluate(()=>PK.UI.act('closepanel'));
  /* monkey */
  let last='';for(let i=0;i<steps&&!errs.length;i++){const r=rnd();
   if(await p.locator('#modal').isVisible()){const n=await p.locator('#modal [data-act]').count();if(n){const el=p.locator('#modal [data-act]').nth(Math.floor(rnd()*n));const a=await el.getAttribute('data-act');if(a==='quit'||a==='carry')await p.evaluate(()=>PK.UI.act('endKeep'));else await el.click()}continue}
   if(r<.25){await p.evaluate(v=>PK.UI.setSpeed(v),3);await p.waitForTimeout(120+rnd()*250);await p.evaluate(()=>PK.UI.setSpeed(0))}
   else if(r<.45){const x=120+rnd()*900,y=90+rnd()*560,right=rnd()<.2;if(await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e&&e.id==='cv'},[x,y]))await p.mouse.click(x,y,{button:right?'right':'left'})}
   else{const els=p.locator('#hud [data-act]:not([disabled]):visible');const n=await els.count();if(!n)continue;const el=els.nth(Math.floor(rnd()*n));const a=await el.getAttribute('data-act');if(!a||a==='quit'||a.startsWith('speed'))continue;last=a;try{await p.evaluate(a=>PK.UI.act(a),a)}catch(e){errs.push('act '+a+': '+e.message.split('\n')[0])}}
   if(!(await p.evaluate(()=>!!PK.UI.state()))){errs.push('state lost after step '+i+', last act '+last);break}
   if(i%25===0){const c=await p.evaluate(CHECK);if(c)errs.push(c)}}
  /* the end screen */
  if(!errs.length){await p.evaluate(()=>{const S=PK.UI.state();S.end=S.day+3;PK.UI.act('closepanel');PK.UI.setSpeed(3)});
   for(let i=0;i<60;i++){await p.waitForTimeout(100);const t=await p.evaluate(()=>{const m=document.querySelector('#modal');return m&&!m.hidden?(m.textContent.includes('The reckoning')?'end':'tele'):''});if(t==='end')break;if(t==='tele')await p.locator('#modal [data-act]').first().click()}
   const ok=await p.evaluate(()=>document.querySelector('#modal').textContent.includes('The reckoning'));if(!ok)errs.push('end screen did not appear');
   else{await p.evaluate(()=>PK.UI.act('endKeep'));await p.evaluate(()=>{PK.UI.act('save');PK.UI.act('quit')});await p.waitForTimeout(100);await p.click('[data-act="continue"]');await p.waitForTimeout(150);const c=await p.evaluate(CHECK);if(c)errs.push('after reload: '+c)}}
  const info=await p.evaluate(()=>{const S=PK.UI.state();return S?PK.SIM.date(S.day).str:'-'});
  console.log(scen,tag,errs.length?'FAIL '+errs.slice(0,3).join(' | '):'ok',info);fail+=errs.length?1:0;await p.close()}}
await b.close();process.exit(fail?1:0)})();
