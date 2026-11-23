/* Powder Keg — the board game's screens. */
(function(PK){
const D=PK.DATA,M=PK.MAP,A=PK.ART,B=PK.BOARD,P=M.provs,$=id=>document.getElementById(id);
const SAVE='powderkeg.board.v'+B.VERSION;
let st=null,BD=null,cv,cx,dpr=1,cam={x:300,y:250,z:1},vw=800,vh=600,dirty=true;
let sel=-1,tgt=-1,lastRoll=null,moveN=0,peace=null,panel=null,summary=null,menuScen='1914',menuNat=null,menuDiff='easy',flash={};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const nm=t=>B.name(st,t),fid=t=>D.NATIONS[t].flag||t,TN=i=>BD.T[i].name;

/* ---------- map geometry ---------- */
const cellPath=M.cells.map(c=>{const p=new Path2D();for(let i=0;i<c.length;i+=2)p[i?'lineTo':'moveTo'](c[i],c[i+1]);p.closePath();return p});
const landPath=new Path2D(),seaPath=new Path2D();seaPath.rect(-300,-300,M.W+600,M.H+600);
for(const r of M.land)for(const pp of[landPath,seaPath]){for(let i=0;i<r.length;i+=2)pp[i?'lineTo':'moveTo'](r[i],r[i+1]);pp.closePath()}
const EDGES=[];M.cells.forEach((c,i)=>{const n=c.length/2;for(let k=0;k<n;k++){const x1=c[2*k],y1=c[2*k+1],x2=c[2*((k+1)%n)],y2=c[2*((k+1)%n)+1],mx=(x1+x2)/2,my=(y1+y2)/2,di=Math.hypot(mx-P[i].x,my-P[i].y);
  let bj=-1,bd=1e9;for(let j=0;j<P.length;j++){if(j===i)continue;const dj=Math.abs(Math.hypot(mx-P[j].x,my-P[j].y)-di);if(dj<bd){bd=dj;bj=j}}if(bd<1.5&&bj>i)EDGES.push([i,bj,x1,y1,x2,y2])}});
const hitC=document.createElement('canvas').getContext('2d');
function terrAt(wx,wy){let ok=hitC.isPointInPath(landPath,wx,wy);if(!ok)for(const[dx,dy]of[[7,0],[-7,0],[0,7],[0,-7]])if(hitC.isPointInPath(landPath,wx+dx,wy+dy)){ok=true;break}
  if(!ok){/* a tap on a token out at sea still counts */for(let t=0;t<BD.T.length;t++)if(Math.hypot(BD.T[t].cx-wx,BD.T[t].cy-wy)<16/cam.z)return t;return-1}
  let b=-1,bd=1e18;for(let i=0;i<P.length;i++){const d=(P[i].x-wx)**2+(P[i].y-wy)**2;if(d<bd){bd=d;b=i}}return b<0?-1:BD.ptoT[b]}

/* ---------- relations as colours ---------- */
function rel(t){if(t===st.player)return'me';const N=st.nat[t];if(!N||N.out)return'out';if(B.hostile(st,st.player,t))return'foe';if(N.team&&st.nat[st.player].team===N.team)return'ally';return'neutral'}
const REL={me:'#2D4A7A',ally:'#2E7D3A',foe:'#B02A20',neutral:'#8A7F6A',out:'#B9AE98'};
function targets(){const out=new Set();if(sel<0||!st)return out;if(st.phase==='attack'&&!st.pendingMove){for(const e of BD.adj[sel])if(!B.canAttack(st,sel,e.t))out.add(e.t)}else if(st.phase==='move'&&!st.moved)for(const t of B.reach(st,sel))out.add(t);return out}

/* ---------- drawing ---------- */
function draw(){dirty=false;const c=cx,z=cam.z,k=1/z;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#6F8FA3';c.fillRect(0,0,vw,vh);if(!st)return;
  c.setTransform(dpr*z,0,0,dpr*z,-cam.x*z*dpr,-cam.y*z*dpr);const tg=targets();
  for(let i=0;i<P.length;i++){const t=BD.ptoT[i],x=st.terr[t];c.fillStyle=D.NATIONS[x.o].color;c.fill(cellPath[i]);
    if(st.nat[x.o]&&st.nat[x.o].out){c.fillStyle='rgba(150,140,125,.55)';c.fill(cellPath[i])}
    if(t===sel){c.fillStyle='rgba(255,236,170,.6)';c.fill(cellPath[i])}else if(t===tgt){c.fillStyle=st.phase==='move'?'rgba(45,74,122,.5)':'rgba(176,42,32,.5)';c.fill(cellPath[i])}
    else if(tg.has(t)){c.fillStyle=st.phase==='move'?'rgba(45,74,122,.25)':'rgba(176,42,32,.25)';c.fill(cellPath[i])}
    if(flash[t]){c.fillStyle='rgba(255,255,255,'+(.5*flash[t])+')';c.fill(cellPath[i])}}
  c.lineCap='round';c.beginPath();for(const e of EDGES){const a=BD.ptoT[e[0]],b=BD.ptoT[e[1]];if(a!==b&&st.terr[a].o===st.terr[b].o){c.moveTo(e[2],e[3]);c.lineTo(e[4],e[5])}}c.lineWidth=1.1;c.strokeStyle='rgba(45,35,25,.45)';c.stroke();
  c.beginPath();for(const e of EDGES){const a=BD.ptoT[e[0]],b=BD.ptoT[e[1]];if(st.terr[a].o!==st.terr[b].o){c.moveTo(e[2],e[3]);c.lineTo(e[4],e[5])}}c.lineWidth=2.4;c.strokeStyle='rgba(40,30,22,.85)';c.stroke();
  if(sel>=0){c.beginPath();for(const e of EDGES){const a=BD.ptoT[e[0]],b=BD.ptoT[e[1]];if(a!==b&&(a===sel||b===sel)){c.moveTo(e[2],e[3]);c.lineTo(e[4],e[5])}}c.lineWidth=3.2;c.strokeStyle='#C89B3C';c.stroke()}
  c.fillStyle='#6F8FA3';c.fill(seaPath,'evenodd');c.lineWidth=1.1;c.strokeStyle='#4A4034';c.stroke(landPath);
  /* sea crossings */
  c.setLineDash([5*k,5*k]);c.lineWidth=1.6*k;c.strokeStyle='rgba(241,233,214,.8)';c.beginPath();BD.adj.forEach((es,a)=>{for(const e of es)if(e.sea&&e.t>a){c.moveTo(BD.T[a].cx,BD.T[a].cy);c.lineTo(BD.T[e.t].cx,BD.T[e.t].cy)}});c.stroke();c.setLineDash([]);
  /* tokens */
  const s=Math.max(.75,Math.min(1.25,k*1.1));c.textAlign='center';
  for(let t=0;t<BD.T.length;t++){const T=BD.T[t],x=st.terr[t],r=rel(x.o),w=38*s*k,h=22*s*k,X=T.cx,Y=T.cy;
    c.fillStyle=t===sel?'#FFE9A8':'rgba(255,252,243,.96)';c.strokeStyle=REL[r];c.lineWidth=(t===sel||t===tgt?3:2)*k;c.beginPath();c.roundRect(X-w/2,Y-h/2,w,h,h/2);c.fill();c.stroke();
    A.ball(c,fid(x.o),X-w/2+h/2,Y,(fid(x.o)==='GER'?6.5:7.5)*s*k,null,{plain:true});
    c.fillStyle='#1E1A14';c.font='800 '+(13.5*s*k)+'px "Alegreya Sans",sans-serif';c.fillText(x.a,X+h*.38,Y+4.6*s*k);
    if(st.nat[x.o]&&st.nat[x.o].cap===t){c.font=(12*s*k)+'px sans-serif';c.fillStyle='#C89B3C';c.fillText('★',X+w/2-2*k,Y-h/2+3*k)}
    if(z>1.15||t===sel||t===tgt){c.font=(11*k)+'px "IM Fell English SC",Georgia,serif';c.lineWidth=3*k;c.strokeStyle='rgba(241,233,214,.9)';c.strokeText(T.name,X,Y+h/2+12*k);c.fillStyle='#2A241C';c.fillText(T.name,X,Y+h/2+12*k)}}
  c.textAlign='left'}
function resize(){/* keep the same spot of the map in the middle when the screen changes size */const mx=cam.x+vw/cam.z/2,my=cam.y+vh/cam.z/2;dpr=Math.min(2,window.devicePixelRatio||1);vw=cv.clientWidth;vh=cv.clientHeight;cv.width=vw*dpr;cv.height=vh*dpr;cam.x=mx-vw/cam.z/2;cam.y=my-vh/cam.z/2;clampCam();measure();dirty=true}
const minZ=()=>Math.max(vw/M.W,vh/M.H)*.8;
function clampCam(){cam.z=Math.max(minZ(),Math.min(5,cam.z));const w=vw/cam.z,h=vh/cam.z;cam.x=Math.max(-w*.3,Math.min(M.W-w*.7,cam.x));cam.y=Math.max(-h*.3,Math.min(M.H-h*.7,cam.y))}
function centreOn(t,z){if(z)cam.z=z;cam.x=BD.T[t].cx-vw/cam.z/2;cam.y=BD.T[t].cy-vh/cam.z/2;clampCam();dirty=true}
function zoomAt(sx,sy,f){const wx=cam.x+sx/cam.z,wy=cam.y+sy/cam.z;cam.z=Math.max(minZ(),Math.min(5,cam.z*f));cam.x=wx-sx/cam.z;cam.y=wy-sy/cam.z;clampCam();dirty=true}
const ptr=new Map();let drag=null,pinch=0;
function onDown(e){cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});if(ptr.size===1)drag={x:e.offsetX,y:e.offsetY,cx:cam.x,cy:cam.y,moved:false};else if(ptr.size===2){const a=[...ptr.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(drag)drag.moved=true}}
function onMove(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});if(ptr.size===2){const a=[...ptr.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)zoomAt((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,d/pinch);pinch=d;return}
  if(!drag)return;const dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<7)return;drag.moved=true;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();dirty=true}
function onUp(e){ptr.delete(e.pointerId);if(ptr.size<2)pinch=0;if(!drag||ptr.size)return;const d=drag;drag=null;if(d.moved||!st)return;tap(terrAt(cam.x+d.x/cam.z,cam.y+d.y/cam.z))}

/* ---------- playing ---------- */
function busy(){return !st||st.result||st.cards.length||peace||summary||panel==='help'}
function tap(t){if(busy()||t<0)return;const x=st.terr[t],mine=x.o===st.player;
  if(st.phase==='place'){if(!mine){toast('Place new armies on your own territories (blue outline).');return}B.place(st,t,1);sel=t;pulse(t);if(st.phase==='attack')sel=-1;return refresh()}
  if(st.pendingMove)return;
  if(st.phase==='attack'){if(mine){sel=x.a>=2?t:-1;tgt=-1;lastRoll=null;if(x.a<2)toast('You need at least 2 armies to attack from '+TN(t)+'.');return refresh()}
    if(sel>=0){const why=B.canAttack(st,sel,t);if(!why){tgt=t;lastRoll=null;return refresh()}toast(why);return}toast('First tap one of your own territories.');return}
  if(st.phase==='move'){if(st.moved){toast('You have made your move. End your turn.');return}if(sel>=0&&mine&&t!==sel&&B.reach(st,sel).has(t)){tgt=t;moveN=Math.max(1,Math.floor((st.terr[sel].a-1)/2));return refresh()}
    if(mine){sel=x.a>=2?t:-1;tgt=-1;if(x.a<2)toast('Pick a territory with at least 2 armies to move from.');return refresh()}toast('Move between your own territories.')}}
function pulse(t){flash[t]=1;const f=()=>{flash[t]-=.08;dirty=true;if(flash[t]>0)requestAnimationFrame(f);else delete flash[t]};requestAnimationFrame(f)}
function toast(t){const el=document.createElement('div');el.className='bt';el.textContent=t;$('b-toasts').appendChild(el);setTimeout(()=>el.remove(),2600+t.length*40)}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(st))}catch(e){}}
function attack(blitz){if(sel<0||tgt<0)return;const before=st.terr[tgt].o,n0=st.log.length;const rs=blitz?B.blitz(st,sel,tgt):[B.roll(st,sel,tgt)].filter(Boolean);
  lastRoll=rs.length?{last:rs[rs.length-1],rolls:rs.length,la:rs.reduce((s,r)=>s+r.la,0),ld:rs.reduce((s,r)=>s+r.ld,0)}:null;
  if(st.terr[tgt].o===st.player){pulse(tgt);toast('You take '+TN(tgt)+'!');moveN=st.pendingMove?st.pendingMove.max:0}
  for(const x of st.log.slice(n0))if(/declares war|joins|keeps its promise|surrender|capital/.test(x.text))toast(x.text);
  if(st.terr[sel].a<2&&!st.pendingMove)sel=-1;if(st.terr[tgt]&&st.terr[tgt].o!==before&&!st.pendingMove)tgt=-1;refresh()}
function endTurn(){sel=-1;tgt=-1;lastRoll=null;const n0=st.log.length,t0=st.turn;B.endTurn(st);const lines=st.log.slice(n0).map(x=>x.text);summary={season:B.season(st,t0),lines};save();refresh()}

/* ---------- screens ---------- */
const chip=(n,on,done)=>'<span class="bchip'+(on?' on':'')+(done?' done':'')+'">'+n+'</span>';
function top(){const N=st.nat[st.player],team=N.team?st.teams[N.team].name:'Neutral',SC=B.SCEN[st.scen];
  $('b-top').innerHTML='<span class="bwho" id="b-whoball"></span><b class="bname">'+esc(nm(st.player))+'</b><span class="bdate">'+B.season(st)+'</span><span class="bturn">Turn '+Math.min(st.turn,SC.turns)+' of '+SC.turns+'</span>'+
   '<button class="bpill" data-b="sides">'+(N.team?'Side: '+esc(team):'Neutral')+'</button><button class="bpill" data-b="peaceList">🕊️ Peace</button><button class="btb" data-b="menu" aria-label="Menu">☰</button>';
  $('b-whoball').appendChild(A.icon(fid(st.player),30,'happy'))}
function bottom(){const el=$('b-bot');if(st.result){el.innerHTML='';return}const ph=st.phase;let steps='<div class="bsteps">'+chip('1 Place',ph==='place',ph!=='place')+chip('2 Attack',ph==='attack',ph==='move')+chip('3 Move',ph==='move',false)+'</div>',body='',btn='';
  if(ph==='place'){const r=B.reinforcements(st,st.player);body='<b>Place '+st.toPlace+' new '+(st.toPlace===1?'army':'armies')+'.</b> Tap your territories to add one at a time.<small>'+r.parts.map(p=>esc(p[0])+' '+(p[1]>0?'+':'')+p[1]).join(' · ')+'</small>';
    btn=(sel>=0&&st.terr[sel].o===st.player?'<button data-b="placeAll">All '+st.toPlace+' on '+esc(TN(sel))+'</button>':'')+'<button class="ghost" data-b="autoPlace">Place them for me</button>'}
  else if(ph==='attack'){if(st.pendingMove){const m=st.pendingMove;body='<b>You took '+esc(TN(m.to))+'.</b> How many armies march in from '+esc(TN(m.from))+'?';btn=stepper(moveN,0,m.max)+'<button data-b="moveIn">Move in</button>'}
    else if(sel>=0&&tgt>=0){const a=st.terr[sel],d=st.terr[tgt],p=B.winChance(a.a-1,d.a),w=B.warning(st,sel,tgt);
      body='<b>'+esc(TN(sel))+' ('+a.a+') attacks '+esc(TN(tgt))+' ('+d.a+', '+esc(nm(d.o))+')</b><span class="bodds" style="--p:'+Math.round(p*100)+'%">Chance to take it: <b>'+Math.round(p*100)+'%</b></span>'+(w?'<small class="bwarn">'+esc(w)+'</small>':'')+rollLine();
      btn='<button data-b="roll">Roll once</button><button data-b="blitz">Attack until it falls</button><button class="ghost" data-b="cancel">Cancel</button>'}
    else if(sel>=0){body='<b>Attack from '+esc(TN(sel))+'.</b> Tap a territory next to it that is shaded red.'+rollLine();btn='<button class="ghost" data-b="cancel">Cancel</button><button data-b="doneAttack">Done attacking</button>'}
    else{body='<b>Attack, if you want to.</b> Tap your territory with 2 or more armies, then an enemy next to it. Red outlines are enemies.'+rollLine();btn='<button data-b="doneAttack">Done attacking</button>'}}
  else if(ph==='move'){if(st.moved){body='<b>Your move is made.</b>';btn='<button data-b="end">End turn</button>'}
    else if(sel>=0&&tgt>=0){body='<b>Move armies from '+esc(TN(sel))+' to '+esc(TN(tgt))+'.</b>';btn=stepper(moveN,1,st.terr[sel].a-1)+'<button data-b="fortify">Move</button><button class="ghost" data-b="cancel">Cancel</button>'}
    else{body='<b>One move.</b> You may move armies once, between territories joined by your own land. Or just end your turn.';btn='<button data-b="end">End turn</button>'}}
  el.innerHTML=steps+'<div class="bbody">'+body+'</div><div class="bbtns">'+btn+'</div>'}
function stepper(n,min,max){moveN=Math.max(min,Math.min(max,n));return'<span class="bstep"><button class="ghost" data-b="n:-1">−</button><b>'+moveN+'</b><button class="ghost" data-b="n:1">+</button><button class="ghost" data-b="n:max">All</button></span>'}
const DIE='⚀⚁⚂⚃⚄⚅';
function rollLine(){if(!lastRoll)return'';const r=lastRoll.last;return'<small class="broll">Your dice <span class="dice me">'+r.A.map(v=>DIE[v-1]).join('')+'</span> their dice <span class="dice them">'+r.D.map(v=>DIE[v-1]).join('')+'</span>'+(lastRoll.rolls>1?' · '+lastRoll.rolls+' rolls':'')+' · you lost '+lastRoll.la+', they lost '+lastRoll.ld+'</small>'}
function modal(){const el=$('b-card');let h='';
  if(st.result)h=resultCard();
  else if(peace)h=peaceCard();
  else if(summary&&summary.lines.length)h='<div class="bcard"><p class="beye">While you waited · '+esc(summary.season)+'</p><h2>The other nations moved</h2><ul class="bnews">'+summary.lines.slice(-14).map(l=>'<li>'+esc(l)+'</li>').join('')+'</ul><div class="bchoices"><button data-b="okSummary">Your turn: '+B.season(st)+'</button></div></div>';
  else if(st.cards.length){const c=st.cards[0],E=B.card(c),txt=typeof E.text==='function'?E.text(st,c.data):E.text;h='<div class="bcard"><p class="beye">Telegram · '+B.season(st)+'</p><h2>'+esc(E.title)+'</h2><p>'+esc(txt)+'</p><div class="bchoices">'+E.opts(st,c.data).map((o,i)=>'<button data-b="opt:'+i+'">'+esc(o.label)+(o.tip?'<small>'+esc(o.tip)+'</small>':'')+'</button>').join('')+'</div></div>'}
  else if(panel==='sides')h=sidesCard();else if(panel==='menu')h=menuCard();else if(panel==='help')h=helpCard();else if(panel==='peaceList')h=peaceListCard();
  el.hidden=!h;el.innerHTML=h;el.querySelectorAll('[data-ball]').forEach(e=>e.appendChild(A.icon(fid(e.dataset.ball),28,'neutral')))}
function sidesCard(){const ks=Object.keys(st.teams),list=ts=>ts.map(t=>'<span class="bnat"><span data-ball="'+t+'"></span>'+esc(nm(t))+'</span>').join('')||'<i>nobody yet</i>';
  const neutral=BD.tags.filter(t=>B.active(st,t)&&!st.nat[t].team),out=BD.tags.filter(t=>st.nat[t].out);
  return'<div class="bcard"><h2>The sides</h2>'+ks.map(k=>'<h3>'+esc(st.teams[k].name)+'</h3><div class="bnats">'+list(B.members(st,k))+'</div>').join('')+'<h3>Not at war</h3><div class="bnats">'+list(neutral)+'</div>'+(out.length?'<h3>Gone from the map</h3><div class="bnats">'+list(out)+'</div>':'')+
   '<p class="bsub">Attacking a neutral country brings it into the war against you.</p><div class="bchoices"><button data-b="close">Back to the map</button></div></div>'}
function menuCard(){return'<div class="bcard"><h2>Powder Keg</h2><p class="bsub">'+esc(B.SCEN[st.scen].name)+' · '+esc(st.diff)+' · seed '+st.seed+'. The game is saved at the start of every turn.</p><div class="bchoices"><button data-b="help">How to play</button><button data-b="close">Back to the game</button><button class="ghost" data-b="quit">Main menu</button></div></div>'}
const HELP='<div class="bcard"><h2>How to play</h2><ol class="bhelp"><li><b>Each turn has three steps:</b> place, attack, move.</li><li><b>Place.</b> You get new armies every turn: more for more territories, extra for holding a whole region and for holding your capital (★).</li><li><b>Attack.</b> Tap your territory with 2 or more armies, then an enemy next to it. You roll up to three dice, they roll up to two. The highest dice are compared and the loser of each pair loses an army. Ties go to the defender. You see your chance before you roll.</li><li><b>Move.</b> Once a turn, move armies between your territories that join up.</li><li><b>Dashed lines</b> are sea crossings. You can attack along them.</li><li><b>Peace.</b> A beaten enemy asks for peace, and you choose what to take. You can ask for peace yourself with the 🕊️ button. The better the war has gone for you, the more you can demand.</li><li><b>The end.</b> The war ends when one side has no great powers left fighting, or on the last turn.</li></ol><div class="bchoices"><button data-b="closeHelp">Got it</button></div></div>';
const helpCard=()=>HELP;
function peaceListCard(){const foes=BD.tags.filter(t=>B.hostile(st,st.player,t));return'<div class="bcard"><h2>Ask for peace</h2>'+(foes.length?'<p>Choose who to talk to. You will see what they will accept before you sign.</p><div class="bchoices">'+foes.map(t=>{const sc=B.score(st,st.player,t);return'<button data-b="peaceWith:'+t+'"><span data-ball="'+t+'"></span> '+esc(nm(t))+'<small>'+(sc>2?'You are winning against them.':sc<-2?'You are losing against them.':'Neither side is ahead.')+'</small></button>'}).join('')+'</div>':'<p>You are not at war with anyone.</p>')+'<div class="bchoices"><button class="ghost" data-b="close">Back</button></div></div>'}
function peaceCard(){const b=peace.with,items=B.peaceItems(st,st.player,b),deal=peace.deal,price=B.price(st,st.player,b,deal),lim=B.limit(st,st.player,b),ok=B.accepts(st,st.player,b,deal),sc=B.score(st,st.player,b);
  const row=(i,dir)=>{const on=(dir>0?deal.take:deal.give).includes(i),x=st.terr[i],c=B.cost(st,st.player,b,i,dir);return'<label class="bitem'+(on?' on':'')+'"><input type="checkbox" data-bpeace="'+(dir>0?'take':'give')+':'+i+'"'+(on?' checked':'')+'><span><b>'+esc(TN(i))+'</b><small>'+(x.o===st.player?'you hold it now':'they hold it now')+(x.o0!==x.o?', it was '+esc(nm(x.o0))+'\'s':'')+'</small></span><span class="bcost">'+(c>0?'+':'')+c+'</span></label>'};
  return'<div class="bcard wide"><p class="beye">The peace table</p><h2>Peace with '+esc(nm(b))+'</h2><p>'+(sc>2?'The war has gone your way.':sc<-2?'The war has gone against you. You may have to give something up.':'Neither side is clearly ahead.')+' Tick what changes hands. Capitals are never traded.</p>'+
   '<h3>'+esc(nm(b))+' hands over</h3>'+(items.take.map(i=>row(i,1)).join('')||'<p class="bsub">Nothing within reach.</p>')+'<h3>You hand over</h3>'+(items.give.map(i=>row(i,-1)).join('')||'<p class="bsub">Nothing they want.</p>')+
   '<div class="bmeter '+(ok?'ok':'no')+'"><span>Your demands cost <b>'+price+'</b>. They will accept up to <b>'+lim+'</b>.</span><b>'+(ok?'They will sign.':'Too much. Ask for less, or offer something.')+'</b></div>'+
   '<p class="bsub">After the peace you cannot attack each other for four turns.'+(st.nat[st.player].team&&sc<0?' Because you are the weaker side, you will also leave your alliance.':'')+'</p><div class="bchoices"><button data-b="sign"'+(ok?'':' disabled')+'>Sign the peace</button><button class="ghost" data-b="closePeace">Back to the war</button></div></div>'}
function resultCard(){const r=st.result,SC=B.SCEN[st.scen],mine0=st.terr.filter(x=>x.o0===st.player).length,mine=st.terr.filter(x=>x.o===st.player).length,head={victory:'Victory',defeat:'Defeat',draw:'A draw',neutral:'You stayed out',watch:'The war is over'}[r.r],
  why={victory:'Your side has won the war.',defeat:'Your side has lost the war.',draw:'Neither side was beaten.',neutral:'You ended the war at peace.',watch:''}[r.r],mine2=st.treaties.filter(t=>t.a===st.player||t.b===st.player);
  return'<div class="bcard wide"><p class="beye">'+B.season(st,Math.min(r.turn,SC.turns))+'</p><h2>'+head+'</h2><p class="center"><b>'+why+'</b>'+(r.winner?' The '+esc(st.teams[r.winner].name)+' won.':'')+'</p>'+
   '<p>You began with <b>'+mine0+'</b> territories and ended with <b>'+mine+'</b>.</p>'+(mine2.length?'<h3>Your peace treaties</h3><ul class="bnews">'+mine2.map(t=>'<li>'+esc(B.season(st,t.turn))+': with '+esc(nm(t.a===st.player?t.b:t.a))+(t.take.length?'. '+esc(nm(t.b))+' handed over '+t.take.map(TN).map(esc).join(', '):'')+(t.give.length?'. '+esc(nm(t.a))+' handed over '+t.give.map(TN).map(esc).join(', '):'')+'.</li>').join('')+'</ul>':'')+
   '<h3>What really happened</h3><p>'+esc(SC.real)+'</p><div class="bchoices"><button data-b="again">Play again</button><button class="ghost" data-b="quit">Main menu</button></div></div>'}

/* ---------- main menu ---------- */
function menu(){const m=$('b-menu');m.hidden=false;const SC=B.SCEN[menuScen];if(!SC.playable.includes(menuNat))menuNat=SC.playable[0];let sv=null;try{const o=JSON.parse(localStorage.getItem(SAVE)||'null');if(o&&o.v===B.VERSION&&!o.result)sv=o}catch(e){}
  const cards=Object.values(B.SCEN).map(s=>'<button class="bscen'+(s.id===menuScen?' on':'')+'" data-b="scen:'+s.id+'"><b>'+esc(s.name)+'</b><span>'+esc(s.blurb)+'</span></button>').join('');
  B.board(menuScen);PK.SIM.applyScen({scen:SC.sim,natOv:{}});
  m.innerHTML='<div class="bmenu-in"><p class="beye">A game of the world wars</p><h1>Powder Keg</h1><p class="blede">Pick a war and a country. Each turn you place armies, attack with dice, and make one move. Beat your enemies, then decide the peace.</p>'+
   (sv?'<button class="big" data-b="continue">Continue your game<small>'+esc(B.SCEN[sv.scen].name)+' · '+esc(B.SCEN[sv.scen].short&&B.SCEN[sv.scen].short[sv.player]||({GER:'Germany',FRA:'France',RUS:'Russia',AUS:'Austria-Hungary',ENG:'Britain',ITA:'Italy',OTT:'Ottoman Empire',SER:'Serbia',POL:'Poland',CZE:'Czechoslovakia'})[sv.player]||sv.player)+'</small></button>':'')+
   '<h3>Which war?</h3><div class="bscens">'+cards+'</div><h3>Which country?</h3><div class="bnatpick">'+SC.playable.map(t=>'<button class="'+(t===menuNat?'on':'')+'" data-b="nat:'+t+'"><span data-ball="'+t+'"></span>'+esc(((SC.short||{})[t])||({GER:'Germany',FRA:'France',RUS:'Russia',AUS:'Austria-Hungary',ENG:'Britain',ITA:'Italy',OTT:'Ottoman Empire',SER:'Serbia',POL:'Poland',CZE:'Czechoslovakia'})[t])+'</button>').join('')+'</div>'+
   '<h3>How hard?</h3><div class="bseg">'+['easy','normal','hard'].map(d=>'<button class="'+(d===menuDiff?'on':'')+'" data-b="diff:'+d+'">'+d[0].toUpperCase()+d.slice(1)+'</button>').join('')+'</div><p class="bsub">'+({easy:'You get half as many armies again each turn, and your enemies are more careful.',normal:'An even fight.',hard:'Your enemies get more armies and attack more.'})[menuDiff]+'</p>'+
   '<button class="big go" data-b="start">Start</button><button class="ghost" data-b="helpMenu">How to play</button><p class="bfine">Want every detail: divisions, factories, fleets and research? <button class="blink" data-b="campaign">Play the Grand Campaign instead</button></p></div>';
  m.querySelectorAll('[data-ball]').forEach(e=>e.appendChild(A.icon(PK.DATA.NATIONS[e.dataset.ball].flag||e.dataset.ball,e.parentNode.classList.contains('bnatpick')?40:40,'neutral')))}
function begin(state){st=state;BD=B.board(st.scen);PK.SIM.applyScen({scen:B.SCEN[st.scen].sim,natOv:{}});$('b-menu').hidden=true;$('b-hud').hidden=false;sel=-1;tgt=-1;peace=null;panel=null;summary=null;lastRoll=null;resize();
  const cap=st.nat[st.player].cap;centreOn(cap!==undefined?cap:0,Math.max(minZ(),Math.min(1.35,vw/1000)));let first=false;try{first=!localStorage.getItem('powderkeg.board.help');localStorage.setItem('powderkeg.board.help','1')}catch(e){}if(first&&st.turn===1)panel='help';save();refresh()}

/* ---------- actions ---------- */
function act(a){const[k,x]=a.split(':');switch(k){
  case'scen':menuScen=x;menu();break;case'nat':menuNat=x;menu();break;case'diff':menuDiff=x;menu();break;
  case'start':begin(B.newGame(menuScen,menuNat,menuDiff,PK.BOARDUI.nextSeed||1000+Math.floor(Math.random()*9000)));break;
  case'continue':try{begin(JSON.parse(localStorage.getItem(SAVE)))}catch(e){toast('That game could not be loaded.')}break;
  case'helpMenu':st=null;$('b-card').hidden=false;$('b-card').innerHTML=HELP.replace('data-b="closeHelp"','data-b="closeMenuHelp"');break;case'closeMenuHelp':$('b-card').hidden=true;break;
  case'campaign':PK.BOARDUI.campaign();break;
  case'placeAll':if(sel>=0)B.place(st,sel,st.toPlace);sel=-1;refresh();break;case'autoPlace':B.autoPlace(st);sel=-1;refresh();break;
  case'roll':attack(false);break;case'blitz':attack(true);break;case'cancel':sel=-1;tgt=-1;refresh();break;
  case'n':{const max=st.pendingMove?st.pendingMove.max:sel>=0?st.terr[sel].a-1:0;moveN=x==='max'?max:moveN+(+x);refresh();break}
  case'moveIn':B.moveIn(st,moveN);sel=-1;tgt=-1;refresh();break;
  case'doneAttack':B.endAttacks(st);sel=-1;tgt=-1;lastRoll=null;refresh();break;
  case'fortify':{const e=B.fortify(st,sel,tgt,moveN);if(e)toast(e);sel=-1;tgt=-1;refresh();break}
  case'end':endTurn();break;
  case'okSummary':summary=null;refresh();break;
  case'opt':{const c=st.cards[0],E=B.card(c),o=E.opts(st,c.data)[+x];B.resolve(st,0,+x);if(o&&o.table&&st.table){openPeace(st.table.with);st.table=null}save();refresh();break}
  case'sides':case'menu':case'peaceList':panel=panel===k?null:k;refresh();break;case'help':panel='help';refresh();break;case'close':panel=null;refresh();break;case'closeHelp':panel=null;refresh();break;
  case'peaceWith':panel=null;openPeace(x);refresh();break;
  case'sign':{if(!peace)break;const e=B.propose(st,peace.with,peace.deal);if(e)toast(e);else{toast('Peace signed with '+nm(peace.with)+'.');peace=null;save()}refresh();break}
  case'closePeace':peace=null;refresh();break;
  case'again':begin(B.newGame(st.scen,st.player,st.diff,1000+Math.floor(Math.random()*9000)));break;
  case'quit':save();st=null;panel=null;peace=null;summary=null;$('b-hud').hidden=true;$('b-card').hidden=true;menu();dirty=true;break}}
function openPeace(b){const items=B.peaceItems(st,st.player,b),deal={take:items.take.filter(i=>st.terr[i].o===st.player||st.terr[i].o0===st.player),give:[]};if(!B.accepts(st,st.player,b,deal)){deal.take=items.take.filter(i=>st.terr[i].o===st.player);if(!B.accepts(st,st.player,b,deal))deal.take=[]}peace={with:b,deal}}
function measure(){const h=$('b-hud');if(!h)return;h.style.setProperty('--btop',$('b-top').offsetHeight+'px');h.style.setProperty('--bbot',$('b-bot').offsetHeight+'px')}
function refresh(){if(!st)return;top();bottom();modal();measure();dirty=true}

function init(){const root=$('board');root.innerHTML='<canvas id="b-cv" aria-label="Map of Europe"></canvas><div id="b-hud" hidden><div id="b-top"></div><div id="b-toasts"></div><div id="b-bot"></div></div><div id="b-menu"></div><div id="b-card" hidden></div>';
  cv=$('b-cv');cx=cv.getContext('2d');
  root.addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(b&&!b.disabled){e.preventDefault();act(b.dataset.b)}});
  root.addEventListener('change',e=>{const t=e.target;if(t.dataset.bpeace&&peace){const[k,i]=t.dataset.bpeace.split(':'),arr=peace.deal[k],n=+i,j=arr.indexOf(n);if(t.checked&&j<0)arr.push(n);if(!t.checked&&j>=0)arr.splice(j,1);refresh()}});
  cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);drag=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.offsetX,e.offsetY,Math.exp(-e.deltaY*.0015))},{passive:false});cv.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('resize',()=>{if(!document.body.classList.contains('mode-campaign'))resize()});resize();menu();
  const loop=()=>{if(dirty&&!document.body.classList.contains('mode-campaign'))draw();requestAnimationFrame(loop)};requestAnimationFrame(loop);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{dirty=true})}
PK.BOARDUI={init,state:()=>st,act,tap:k=>{const i=PK.SIM.KEY[k];tap(i===undefined?-1:BD.ptoT[i])},tapT:tap,
  /* the detailed game shares the page; switch to it and back */
  campaign(){document.body.classList.add('mode-campaign');if(!PK.UI.booted){PK.UI.booted=true;PK.UI.boot()}else PK.UI.act('quit')},
  show(){document.body.classList.remove('mode-campaign');resize();if(!st)menu();dirty=true}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(globalThis.PK=globalThis.PK||{});
