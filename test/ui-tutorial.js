/* Walks the tutorial from the menu to its last step through the real interface. Needs Playwright with Chromium. */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
 await p.goto('file://'+path.join(__dirname,'..','index.html'));await p.evaluate(()=>PK.BOARDUI&&PK.BOARDUI.campaign());await p.waitForTimeout(200);await p.waitForTimeout(300);await p.click('[data-act="tutorial"]');await p.waitForTimeout(300);
 const step=()=>p.evaluate(()=>PK.UI.state().tut),want=async n=>{await p.waitForTimeout(150);const s=await step();if(s!==n)errs.push('expected step '+n+', at '+s)};
 await want(0);await p.click('#tut [data-act="tutNext"]');await want(1);
 await p.mouse.move(700,450);await p.mouse.down();await p.mouse.move(640,420,{steps:5});await p.mouse.up();await want(2);
 await p.evaluate(()=>PK.UI.click('paris'));await want(3);await p.evaluate(()=>PK.UI.click('orleans'));await want(4);
 await p.click('.speed [data-act="speed:1"]');await want(5);await p.evaluate(()=>PK.UI.setSpeed(3));
 for(let i=0;i<80;i++){await p.waitForTimeout(100);if(await p.locator('#modal').isVisible()){await p.locator('#modal [data-act]').first().click();if(await step()===6)break}}
 await want(6);await p.evaluate(()=>PK.UI.setSpeed(0));await p.click('#side [data-act="panel:dip"]');await p.click('[data-act="dip:GER"]');await want(7);
 await p.evaluate(()=>{PK.UI.act('desel');PK.UI.click('nancy')});await p.click('#side [data-act="panel:army"]');await p.click('[data-act="armyNew"]');await want(8);
 await p.click('#side [data-act="panel:min"]');await want(9);await p.click('#side [data-act="panel:gov"]');await want(10);
 await p.screenshot({path:process.argv[2]||'/dev/null'}).catch(()=>{});
 await p.click('#tut [data-act="tutNext"]');await p.waitForTimeout(150);if(await step()!==undefined&&await step()!==null)errs.push('tutorial did not finish');
 console.log(errs.length?'FAIL '+errs.join(' | '):'ok');await b.close();process.exit(errs.length?1:0)})();
