/* Powder Keg — interface: map canvas, HUD, panels, telegrams. */
(function(PK){
const D=PK.DATA,G=PK.SIM,M=PK.MAP,A=PK.ART,P=M.provs,$=id=>document.getElementById(id);
const SAVE_KEY='powderkeg.save.v'+D.VERSION,SPEED=[0,900,320,70,1];/* the fifth speed is for tests only */
let S=null,cv,cx,dpr=1,cam={x:300,y:250,z:1},vw=800,vh=600,speed=0,acc=0,last=0,dirty=true;
let selProv=-1,sel=new Set(),panel=null,dipTag=null,edit=null,recP=-1,chronK='all',menuScen='1914',endOpen=false,sound=true,seenWar=0,seenPend=0;
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const fmt=n=>n>=1e6?(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.round(n));
const pct=v=>Math.round(v)+'%';
const fid=t=>D.NATIONS[t].flag||t;
const nm=t=>G.name(S,t),me=()=>S.nat[S.player];

/* ---------- map geometry, built once ---------- */
const cellPath=M.cells.map(c=>{const p=new Path2D();for(let i=0;i<c.length;i+=2)p[i?'lineTo':'moveTo'](c[i],c[i+1]);p.closePath();return p});
const landPath=new Path2D(),seaPath=new Path2D();seaPath.rect(-200,-200,M.W+400,M.H+400);
for(const r of M.land){for(const pp of[landPath,seaPath]){for(let i=0;i<r.length;i+=2)pp[i?'lineTo':'moveTo'](r[i],r[i+1]);pp.closePath()}}
const EDGES=[];M.cells.forEach((c,i)=>{const n=c.length/2;for(let k=0;k<n;k++){const x1=c[2*k],y1=c[2*k+1],x2=c[2*((k+1)%n)],y2=c[2*((k+1)%n)+1],mx=(x1+x2)/2,my=(y1+y2)/2,di=Math.hypot(mx-P[i].x,my-P[i].y);
  let bj=-1,bd=1e9;for(let j=0;j<P.length;j++){if(j===i)continue;const dj=Math.abs(Math.hypot(mx-P[j].x,my-P[j].y)-di);if(dj<bd){bd=dj;bj=j}}if(bd<1.5&&bj>i)EDGES.push([i,bj,x1,y1,x2,y2])}});
const hatch={};function hatchOf(col){if(hatch[col])return hatch[col];const t=document.createElement('canvas');t.width=t.height=8;const c=t.getContext('2d');c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(-2,6);c.lineTo(6,-2);c.moveTo(2,10);c.lineTo(10,2);c.stroke();return hatch[col]=cx.createPattern(t,'repeat')}
/* isPointInPath uses the current transform, so test in an identity-space helper */
const hitC=document.createElement('canvas').getContext('2d');function onLand(wx,wy){return hitC.isPointInPath(landPath,wx,wy)}
function provAtW(wx,wy){if(!onLand(wx,wy)){/* small islands and coasts: accept a near miss */let ok=false;for(const[dx,dy]of[[6,0],[-6,0],[0,6],[0,-6]])if(onLand(wx+dx,wy+dy)){ok=true;break}if(!ok)return -1}
  let b=-1,bd=1e9;for(let i=0;i<P.length;i++){const d=(P[i].x-wx)**2+(P[i].y-wy)**2;if(d<bd){bd=d;b=i}}return b}

/* ---------- drawing ---------- */
function mood(t){const N=S.nat[t];if(N.capit)return'sleep';if(t===S.player)return N.stab>55?'happy':N.stab<30?'worried':'neutral';if(G.atWar(S,S.player,t))return'angry';if(G.friendly(S,S.player,t))return'happy';
  const o=G.opinion(S,t,S.player);return o<=-35?'angry':o<0?'worried':o>=45?'happy':'neutral'}
function visible(p){const c=S.prov[p].ctrl;if(G.friendly(S,S.player,c))return true;for(const nb of G.NB[p])if(G.friendly(S,S.player,S.prov[nb.j].ctrl))return true;return !G.atWar(S,S.player,c)}
function draw(){dirty=false;const c=cx,z=cam.z;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#6F8FA3';c.fillRect(0,0,vw,vh);if(!S)return;
  c.setTransform(dpr*z,0,0,dpr*z,-cam.x*z*dpr,-cam.y*z*dpr);
  for(let i=0;i<P.length;i++){const pr=S.prov[i];c.fillStyle=D.NATIONS[pr.owner].color;c.fill(cellPath[i]);if(pr.ctrl!==pr.owner){c.fillStyle=hatchOf(D.NATIONS[pr.ctrl].color);c.fill(cellPath[i]);c.fillStyle='rgba(60,30,20,.12)';c.fill(cellPath[i])}}
  c.lineWidth=.5;c.strokeStyle='rgba(60,48,36,.28)';for(let i=0;i<P.length;i++)c.stroke(cellPath[i]);
  c.lineCap='round';c.beginPath();for(const e of EDGES)if(S.prov[e[0]].owner!==S.prov[e[1]].owner){c.moveTo(e[2],e[3]);c.lineTo(e[4],e[5])}c.lineWidth=1.9;c.strokeStyle='rgba(50,38,28,.75)';c.stroke();
  c.beginPath();for(const e of EDGES){const a=S.prov[e[0]].ctrl,b=S.prov[e[1]].ctrl;if(a!==b&&G.atWar(S,a,b)){c.moveTo(e[2],e[3]);c.lineTo(e[4],e[5])}}c.lineWidth=3.2;c.strokeStyle='rgba(176,42,32,.85)';c.setLineDash([6,5]);c.stroke();c.setLineDash([]);
  if(selProv>=0){c.lineWidth=3;c.strokeStyle='#C89B3C';c.stroke(cellPath[selProv])}
  if(S.tut!==undefined&&TUT[S.tut]&&TUT[S.tut].ring){const q=P[TUT[S.tut].ring()];c.lineWidth=4/z;c.strokeStyle='#E0B23A';c.setLineDash([8/z,6/z]);c.beginPath();c.arc(q.cx,q.cy,34/z,0,7);c.stroke();c.setLineDash([])}
  c.fillStyle='#6F8FA3';c.fill(seaPath,'evenodd');c.lineWidth=1.1;c.strokeStyle='#4A4034';c.stroke(landPath);
  /* sea crossings */
  if(z>.9){c.setLineDash([3,4]);c.lineWidth=.9;c.strokeStyle='rgba(241,233,214,.6)';c.beginPath();for(const[a,b]of M.sea){c.moveTo(P[a].cx,P[a].cy);c.lineTo(P[b].cx,P[b].cy)}c.stroke();c.setLineDash([])}
  const k=1/z;c.textAlign='center';
  /* province furniture */
  for(let i=0;i<P.length;i++){const p=P[i],pr=S.prov[i];if(pr.fort>0&&z>1.1){c.fillStyle='#3B3228';c.font=(9*k)+'px sans-serif';c.fillText('▲'.repeat(Math.min(3,pr.fort)),p.cx,p.cy+18*k)}
    if(z>1.5){c.font=(10.5*k)+'px "IM Fell English SC",Georgia,serif';c.lineWidth=2.4*k;c.strokeStyle='rgba(241,233,214,.75)';c.strokeText(p.name,p.cx,p.cy+29*k);c.fillStyle='#2A241C';c.fillText(p.name,p.cx,p.cy+29*k)}}
  /* orders for the selection */
  if(sel.size){c.lineWidth=2.5*k;c.strokeStyle='#2D4A7A';c.fillStyle='#2D4A7A';const seen=new Set();for(const id of sel){const d=G.div(S,id);if(!d||!d.path)continue;const key=d.p+'>'+d.path.join(',');if(seen.has(key))continue;seen.add(key);
    c.beginPath();c.moveTo(P[d.p].cx,P[d.p].cy);for(const q of d.path)c.lineTo(P[q].cx,P[q].cy);c.stroke();const e=P[d.path[d.path.length-1]];c.beginPath();c.arc(e.cx,e.cy,4*k,0,7);c.fill()}}
  /* battles */
  for(const b in S.battles){const p=P[b];if(!visible(+b))continue;c.font=(20*k)+'px sans-serif';c.fillText('💥',p.cx,p.cy-4*k)}
  /* armies: one counter per nation per province */
  const r=8.5*k;for(let i=0;i<P.length;i++){const list=S._at[i];if(!list.length||!visible(i))continue;const by={};for(const d of list){(by[d.o]=by[d.o]||[]).push(d)}const tags=Object.keys(by),p=P[i];
    tags.forEach((t,j)=>{const ds=by[t],x=p.cx+(j-(tags.length-1)/2)*30*k,y=p.cy+3*k,mine=t===S.player,anySel=mine&&ds.some(d=>sel.has(d.id));let org=0,str=0;for(const d of ds){org+=d.org;str+=d.str}org/=ds.length;str/=ds.length;
      c.fillStyle=anySel?'#FFE9A8':'rgba(241,233,214,.94)';c.strokeStyle=anySel?'#C89B3C':mine?'#2D4A7A':G.atWar(S,S.player,t)?'#9C3328':'#6B6050';c.lineWidth=(anySel?2.2:1.3)*k;
      c.beginPath();c.roundRect(x-13*k,y-9*k,26*k,18*k,4*k);c.fill();c.stroke();A.ball(c,fid(t),x-5.5*k,y-.5*k,(fid(t)==='GER'?5:6)*k,null,{plain:true});
      c.fillStyle='#2A241C';c.font='700 '+(10*k)+'px "Alegreya Sans",sans-serif';c.fillText(ds.length,x+6.5*k,y+3.2*k);
      c.fillStyle='#C9BA98';c.fillRect(x-11*k,y+5.2*k,22*k,2*k);c.fillStyle=org>.6?'#2E7D3A':org>.3?'#9A5B00':'#B02A20';c.fillRect(x-11*k,y+5.2*k,22*k*org*str,2*k);
      if(ds.some(d=>d.path)){c.fillStyle='#2D4A7A';c.font=(9*k)+'px sans-serif';c.fillText('➤',x+13*k,y-7*k)}})}
  /* air bases */
  if(S.wings&&S.wings.length){const ab={};for(const w of S.wings)if(visible(w.p)){const key=w.p+'|'+w.o;ab[key]=(ab[key]||0)+1}c.font='700 '+(9*k)+'px "Alegreya Sans",sans-serif';for(const key in ab){const[pi,o]=key.split('|'),p=P[pi];c.fillStyle=o===S.player?'#2D4A7A':G.atWar(S,S.player,o)?'#9C3328':'#6B6050';c.fillText('✈'+ab[key],p.cx-20*k,p.cy-9*k)}}
  /* the nations themselves */
  for(const t of G.TAGS){const N=S.nat[t];if(N.dead||N.cap<0)continue;const C=D.NATIONS[t],p=P[N.cap],rr=(C.major?17:10)*Math.max(.55,Math.min(1.2,k*1.05)),x=p.cx,y=p.cy-(C.major?30:21)*Math.max(.6,k);
    if(!C.major&&z<.75)continue;A.ball(c,fid(t),x,y,rr,mood(t),{you:t===S.player});
    if(C.major&&z<1.5){c.font=(12*Math.max(.7,k))+'px "IM Fell English SC",Georgia,serif';c.lineWidth=3*k;c.strokeStyle='rgba(241,233,214,.85)';const ly=y-(t==='GER'?rr*1.3:rr)-(t==='ENG'||t==='GER'?rr*.95:rr*.55);c.strokeText(nm(t),x,ly);c.fillStyle='#2A241C';c.fillText(nm(t),x,ly)}}
  for(const s of S.says){const N=S.nat[s.tag];if(N.dead||N.cap<0)continue;const p=P[N.cap],C=D.NATIONS[s.tag],y0=p.cy-(C.major?30:21)*Math.max(.6,k);c.font='700 '+(12*k)+'px "Alegreya Sans",sans-serif';const tw=c.measureText(s.text).width+14*k,x=p.cx+16*k,y=y0-8*k;
    c.fillStyle='#fff';c.strokeStyle='#1B1B1B';c.lineWidth=1.3*k;c.beginPath();c.roundRect(x,y-10*k,tw,20*k,7*k);c.fill();c.stroke();c.fillStyle='#1B1B1B';c.textAlign='left';c.fillText(s.text,x+7*k,y+4*k);c.textAlign='center'}
  c.textAlign='left'}
function resize(){if(S)measure();dpr=Math.min(2,window.devicePixelRatio||1);vw=cv.clientWidth;vh=cv.clientHeight;cv.width=vw*dpr;cv.height=vh*dpr;clampCam();dirty=true}
function minZ(){return Math.max(vw/M.W,vh/M.H)*.8}
function clampCam(){cam.z=Math.max(minZ(),Math.min(5,cam.z));const w=vw/cam.z,h=vh/cam.z;cam.x=Math.max(-w*.3,Math.min(M.W-w*.7,cam.x));cam.y=Math.max(-h*.3,Math.min(M.H-h*.7,cam.y))}
function centreOn(p,z){if(z)cam.z=z;cam.x=P[p].cx-vw/cam.z/2;cam.y=P[p].cy-vh/cam.z/2;clampCam();dirty=true}
function zoomAt(sx,sy,f){const wx=cam.x+sx/cam.z,wy=cam.y+sy/cam.z;cam.z=Math.max(minZ(),Math.min(5,cam.z*f));cam.x=wx-sx/cam.z;cam.y=wy-sy/cam.z;clampCam();dirty=true;if(S&&S.tut===1){tutMoved=true;tutCheck()}}

/* ---------- input ---------- */
const ptr=new Map();let drag=null,pinch=0;
function onDown(e){cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});if(ptr.size===1)drag={x:e.offsetX,y:e.offsetY,cx:cam.x,cy:cam.y,moved:false,btn:e.button,shift:e.shiftKey};else if(ptr.size===2){const a=[...ptr.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(drag)drag.moved=true}}
function onMove(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(ptr.size===2){const a=[...ptr.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)zoomAt((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,d/pinch);pinch=d;return}
  if(!drag)return;const dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;drag.moved=true;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();dirty=true;if(S&&S.tut===1){tutMoved=true;tutCheck()}}
function onUp(e){ptr.delete(e.pointerId);if(ptr.size<2)pinch=0;if(!drag||ptr.size)return;const d=drag;drag=null;if(d.moved||!S)return;click(provAtW(cam.x+d.x/cam.z,cam.y+d.y/cam.z),d.btn===2,d.shift)}
function mine(p){return p<0?[]:S._at[p].filter(d=>d.o===S.player&&!d.ret)}
function click(p,right,shift){if(S.pending.length)return;
  if(right){if(sel.size&&p>=0)moveTo(p);return}
  if(sel.size&&p>=0&&!shift){const here=new Set([...sel].map(id=>G.div(S,id)).filter(Boolean).map(d=>d.p));if(!(here.size===1&&here.has(p))){moveTo(p);return}}
  if(p<0||(!shift&&p===selProv&&sel.size)){sel.clear();selProv=-1}else{if(!shift)sel.clear();selProv=p;for(const d of mine(p))sel.add(d.id)}
  refresh()}
function moveTo(p){const ids=[...sel],n=G.order(S,ids,p);if(n)toast(n+(n===1?' division':' divisions')+' ordered to '+P[p].name+'.');else toast(G.canEnter(S,S.player,p)?'No route to '+P[p].name+'.':P[p].name+' is neutral ground. Your troops cannot enter.');refresh()}

/* ---------- HUD ---------- */
function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=cap1(t);$('toasts').appendChild(el);setTimeout(()=>el.remove(),3200+t.length*45)}
function top(){const N=me(),mp=N._mp||G.manpower(S,S.player),war=G.inWar(S,S.player);
  $('top').innerHTML='<button class="who" data-act="panel:gov">'+'<span id="whoball"></span><b>'+esc(nm(S.player))+'</b></button><span class="date">'+G.date(S.day).str+'</span>'+
   '<span class="st" title="Political power">⭐ <b>'+Math.floor(N.pp)+'</b></span><span class="st'+(N.stab<30?' bad':'')+'" title="Stability">🏠 <b>'+pct(N.stab)+'</b></span><span class="st'+(war&&N.ws<25?' bad':'')+'" title="War support">📣 <b>'+pct(N.ws)+'</b></span>'+
   '<span class="st" title="Manpower available">👥 <b>'+fmt(mp.free)+'</b></span><span class="st" title="Civilian / military factories">🏭 <b>'+N.civ+' / '+N.mil+'</b></span>'+
   '<span class="tens" title="World tension">🔥 <span class="bar"><i style="width:'+S.tension+'%"></i></span></span>'+
   '<span class="speed">'+['❚❚','▶','▶▶','▶▶▶'].map((s,i)=>'<button data-act="speed:'+i+'" class="'+(speed===i?'on':'')+'">'+s+'</button>').join('')+'</span><button class="tb" data-act="panel:menu" title="Menu">☰</button>';
  $('whoball').appendChild(A.icon(fid(S.player),30,mood(S.player)))}
const RAIL=[['gov','🏛️','State'],['dip','🤝','Diplomacy'],['army','⚔️','Army'],['min','👔','Ministers'],['chron','📰','Chronicle']];
const AREA={plans:['plans','Plans','Chooses the next national plan when one finishes.'],industry:['prod','Industry','Sets the production lines, builds factories and changes the economy laws in wartime.'],research:['res','Research','Keeps every research team busy.'],sea:['sea','Sea and Air','Stations the fleet, forms air wings and sends them where the fighting is.'],armies:['army','The generals','Raise new divisions and run every front themselves. Turn this on to watch the war instead of fighting it.']};
function mgrNote(k){return me().mgr&&me().mgr[k]?'<p class="mgr">Your minister is running this. Anything you change here may be changed back. <button data-act="mgr:'+k+':0">Take over</button></p>':'<p class="mgr off">You are running this yourself. <button class="ghost" data-act="mgr:'+k+':1">Hand it to a minister</button></p>'}
function side(){$('side').innerHTML=RAIL.map(r=>'<button data-act="panel:'+r[0]+'" class="'+(panel===r[0]?'on':'')+'">'+r[1]+'<small>'+r[2]+'</small></button>').join('')}
function bottom(){const n=S.chron.length,last=S.chron.slice(Math.max(0,n-2)).reverse();let h='<div class="chron"><b>The Chronicle</b>'+last.map(x=>'<p><i>'+G.date(x.day).str+'</i> '+esc(x.text)+'</p>').join('')+'</div>';
  if(sel.size){const ds=[...sel].map(id=>G.div(S,id)).filter(Boolean);h+='<div class="selbar"><b>'+ds.length+(ds.length===1?' division':' divisions')+' selected</b><span>Click a province to send them there.</span><span class="row"><button data-act="halt">Halt</button><button class="ghost" data-act="desel">Deselect</button></span></div>'}
  else if(me().capit)h+='<div class="selbar"><span class="bad">Your armies have laid down their arms. The war goes on without you until the peace is made.</span></div>';
  else h+='<div class="selbar dim"><span>Click a province to inspect it and select your divisions there. Drag to move the map, scroll to zoom.</span></div>';
  $('bottom').innerHTML=h}
function bar(v,cls){return'<span class="mbar '+(cls||'')+'"><i style="width:'+Math.round(Math.max(0,Math.min(1,v))*100)+'%"></i></span>'}
function armyOf(d){const a=d.army&&(me().armies||[]).find(x=>x.id===d.army);return a?' · '+esc(a.name):''}
const STANCE=['Manual','Hold','Advance','Assault'];
function divStatus(d){if(d.ret)return'Retreating to '+P[d.path?d.path[0]:d.p].name;if(d.b!=null)return'Attacking '+P[d.b].name;if(S.battles[d.p])return'Defending';if(d.path)return'Marching to '+P[d.path[d.path.length-1]].name;if(d.oos>3)return'Cut off from supply';return d.dig>.05?'Dug in '+Math.round(d.dig*100)+'%':'Idle'}
function info(){const el=$('info');if(selProv<0){el.hidden=true;return}el.hidden=false;const p=P[selProv],pr=S.prov[selProv],T=D.TERRAIN[p.terr],own=pr.ctrl===S.player;
  let h='<button class="x" data-act="desel" aria-label="Close">✕</button><h3>'+esc(p.name)+'</h3><p class="sub">'+esc(nm(pr.owner))+(pr.ctrl!==pr.owner?' · occupied by '+esc(nm(pr.ctrl)):'')+'</p>'+
   '<p>'+T.n+(T.def!==1?' (defence ×'+T.def+')':'')+(pr.fort?' · Fort '+pr.fort:'')+(p.port?' · Port':'')+'<br>Industry '+p.ind+' · Victory points '+p.vp+(pr.rail?' · Rail '+pr.rail:'')+'</p>';
  const B=S.battles[selProv];if(B){const at=B.att.length,df=S._at[selProv].filter(d=>!d.ret).length;h+='<p class="battle">💥 <b>Battle</b>, day '+(S.day-B.day0+1)+'. '+at+' attacking, '+df+' defending.<br>Losses: attackers '+fmt(B.ca)+', defenders '+fmt(B.cd)+'.'+(B.air===1?'<br>The attackers hold the sky.':B.air===-1?'<br>The defenders hold the sky.':B.air===0?'<br>The sky is contested.':'')+'</p>'}
  const by={};for(const d of S._at[selProv])(by[d.o]=by[d.o]||[]).push(d);
  if(visible(selProv))for(const t in by)if(t!==S.player)h+='<p><b>'+by[t].length+'</b> '+esc(G.adj(S,t))+(by[t].length===1?' division':' divisions')+(G.atWar(S,S.player,t)?' <span class="bad">(enemy)</span>':'')+'</p>';
  const ds=by[S.player]||[];if(ds.length){h+='<div class="dlist">'+ds.map(d=>'<label class="drow"><input type="checkbox" data-div="'+d.id+'"'+(sel.has(d.id)?' checked':'')+'><span><b>'+esc(d.name)+'</b><small>'+divStatus(d)+armyOf(d)+'</small></span><span class="bars">'+bar(d.str,'s')+bar(d.org,'o')+'</span></label>').join('')+'</div><p class="sub">Top bar strength, bottom bar organisation.</p>'}
  if(own)h+='<div class="row"><button data-act="build:fort:'+selProv+'">Build fort</button><button data-act="build:rail:'+selProv+'">Improve rail</button><button class="ghost" data-act="recruitHere">Recruit here</button></div>';
  el.innerHTML=h}

/* ---------- panels ---------- */
function tplLine(t){const parts=[];for(const b in t.bn)if(t.bn[b])parts.push(t.bn[b]+' '+D.BN[b].n.toLowerCase());return parts.join(', ')+((t.sup||[]).length?' + '+t.sup.map(s=>D.SUP[s].n.toLowerCase()).join(', '):'')}
function statRow(st){return'<span class="stats">Attack <b>'+st.att.toFixed(0)+'</b> · Defence <b>'+st.def.toFixed(0)+'</b> · Breakthrough <b>'+st.brk.toFixed(0)+'</b> · Org <b>'+st.org.toFixed(0)+'</b> · Width <b>'+st.w+'</b> · Speed <b>'+st.spd.toFixed(1)+'</b> · Men <b>'+fmt(st.mp)+'</b></span>'}
function aims(){const gs=G.goals(S,S.player),left=S.end-S.day;return'<h3>Aims <small>'+(left>0?'judged on '+G.date(S.end).str:'judged')+'</small></h3>'+gs.map(g=>'<div class="aim '+(g.ok?'ok':'')+'"><b>'+(g.ok?'✓':'○')+' '+esc(g.name)+'</b><small>'+esc(g.desc)+'</small></div>').join('')+'<p class="sub">Strength rank among all nations: '+G.rank(S,S.player)+'.</p>'}
const PAN={
 gov(){const N=me(),mp=G.manpower(S,S.player),war=G.activeEnemies(S,S.player),f=N.faction&&S.factions[N.faction];
  let h='<h2>'+esc(nm(S.player))+'</h2><p class="sub">'+esc(D.NATIONS[S.player].head||'')+'</p>'+
   aims()+'<h3>The home front</h3><table class="kv"><tr><td>Stability</td><td>'+bar(N.stab/100)+' '+pct(N.stab)+'</td></tr><tr><td>War support</td><td>'+bar(N.ws/100)+' '+pct(N.ws)+'</td></tr>'+
   '<tr><td>Manpower</td><td>'+fmt(mp.free)+' free of '+fmt(mp.total)+'</td></tr><tr><td>Lost in war</td><td>'+fmt(N.lost)+'</td></tr></table>'+
   '<p class="sub">Stability falls in long wars, under blockade and when war support is low. Below 18% the government will be forced to ask for terms. War support falls with casualties and occupied land.</p>'+
   '<h3>Alliances and wars</h3><p>'+(f?'Member of the <b>'+esc(f.name)+'</b> with '+G.members(S,N.faction).filter(t=>t!==S.player).map(t=>esc(nm(t))).join(', ')+'.':'No alliance.')+'</p><p>'+(war.length?'At war with '+war.map(t=>esc(nm(t))).join(', ')+'.':'At peace.')+'</p>';
  h+='<h3>Conscription</h3><div class="laws">'+D.CONS.map((L,i)=>'<button data-act="law:cons:'+i+'" class="'+(N.cons===i?'on':'')+'"'+(L.war&&!war.length?' disabled':'')+'>'+L.n+'<small>'+(L.pct*100).toFixed(1)+'% of the population'+(L.war?' · wartime only':'')+'</small></button>').join('')+'</div>';
  h+='<h3>Economy</h3><div class="laws">'+D.ECON.map((L,i)=>'<button data-act="law:econ:'+i+'" class="'+(N.econ===i?'on':'')+'"'+(L.war&&!war.length?' disabled':'')+'>'+L.n+'<small>Output ×'+L.out+' · '+Math.round(L.goods*100)+'% of civilian factories on consumer goods'+(L.war?' · wartime only':'')+'</small></button>').join('')+'</div><p class="sub">Changing a law costs '+D.LAW_COST+' political power.</p>';
  return h},
 plans(){const N=me(),all=G.plansFor(S,S.player),groups=[];for(const p of all)if(!groups.includes(p.group))groups.push(p.group);groups.sort((a,b)=>(['Industry','Army','Politics'].includes(a)-['Industry','Army','Politics'].includes(b)));
  let h='<h2>Plans</h2>'+mgrNote('plans')+'<p class="sub">One plan at a time. Some rule each other out, so the order you choose shapes what kind of country this becomes.</p>';
  if(N.plan){const p=PK.PLANS[N.plan.id];h+='<div class="tpl"><b>'+esc(p.name)+'</b> <small>'+N.plan.left+' days left</small><p>'+esc(p.desc)+'</p>'+bar(1-N.plan.left/p.days)+' <button class="ghost" data-act="cancelPlan">Abandon</button></div>'}
  else h+='<p class="bad">No plan under way.</p>';
  const nmOf=id=>PK.PLANS[id].name;
  for(const g of groups){h+='<h3>'+(['Industry','Army','Politics','Small state'].includes(g)?g:esc(nm(S.player)))+'</h3>';for(const p of all.filter(x=>x.group===g)){const stt=G.planState(S,S.player,p);
    h+='<button class="tech plan '+stt+'" data-act="plan:'+p.id+'"'+(stt!=='open'||N.plan?' disabled':'')+'><b>'+(stt==='done'?'✓ ':'')+esc(p.name)+'</b> <i>'+(stt==='done'?'done':stt==='active'?'under way':stt==='closed'?'ruled out':stt==='locked'?(p.war&&!G.inWar(S,S.player)?'wartime only':'needs '+(p.req||[]).filter(r=>!(N.plans||[]).includes(r)).map(nmOf).join(', ')):p.days+' days')+'</i><small>'+esc(p.desc)+((p.x||[]).length&&stt==='open'?' Rules out: '+p.x.map(nmOf).join(', ')+'.':'')+'</small></button>'}}
  return h},
 dip(){if(dipTag&&S.nat[dipTag]&&!S.nat[dipTag].dead)return PAN.dipOne(dipTag);
  const rows=G.TAGS.filter(t=>t!==S.player&&!S.nat[t].dead).sort((a,b)=>(D.NATIONS[b].major-D.NATIONS[a].major)||nm(a).localeCompare(nm(b)));
  return'<h2>Diplomacy</h2><p class="sub">World tension '+Math.round(S.tension)+'. High tension makes every power bolder.</p><div class="nlist">'+rows.map(t=>{const N=S.nat[t],st=G.atWar(S,S.player,t)?'<span class="bad">At war</span>':G.friendly(S,S.player,t)?'<span class="yes">Ally</span>':N.capit?'Occupied':'';
    return'<button data-act="dip:'+t+'"><span class="ic" data-ball="'+t+'"></span><span><b>'+esc(nm(t))+'</b><small>'+(N.faction?esc(S.factions[N.faction].name):'Unaligned')+'</small></span><span class="op">'+st+' '+op(G.opinion(S,t,S.player))+'</span></button>'}).join('')+'</div>'},
 dipOne(t){const N=S.nat[t],p=S.player,war=G.atWar(S,p,t),ally=G.friendly(S,p,t),cb=S.cb[p+'>'+t],C=D.NATIONS[t];
  let h='<button class="link" data-act="dip:">‹ All nations</button><div class="dhead"><span class="ic big" data-ball="'+t+'"></span><div><h2>'+esc(nm(t))+'</h2><p class="sub">'+(C.head?esc(C.head)+' · ':'')+(N.faction?esc(S.factions[N.faction].name):'Unaligned')+(N.capit?' · occupied':'')+'</p></div></div>'+
   '<table class="kv"><tr><td>Their opinion of us</td><td>'+op(G.opinion(S,t,p))+'</td></tr><tr><td>Our opinion of them</td><td>'+op(G.opinion(S,p,t))+'</td></tr><tr><td>Divisions</td><td>'+S.divs.filter(d=>d.o===t).length+'</td></tr><tr><td>Fleet strength</td><td>'+N.navy+'</td></tr>'+
   '<tr><td>Temperament</td><td>'+(C.dials.amb>.6?'Ambitious':C.dials.amb<.25?'Content':'Watchful')+', '+(C.dials.cau>.7?'cautious':C.dials.cau<.35?'reckless':'calculating')+', '+(C.dials.gru>.7?'never forgets':'forgives in time')+'</td></tr></table>';
  const en=G.activeEnemies(S,t);if(en.length)h+='<p>At war with '+en.map(x=>esc(nm(x))).join(', ')+'.</p>';const gs=S.guar.filter(g=>g[1]===t).map(g=>esc(nm(g[0])));if(gs.length)h+='<p>Guaranteed by '+gs.join(', ')+'.</p>';
  const cl=G.claims(S,t).filter(k=>S.prov[G.KEY[k]].owner!==t).map(k=>P[G.KEY[k]].name);if(cl.length)h+='<p class="sub">Claims: '+cl.join(', ')+'.</p>';
  h+='<div class="acts">';
  if(war)h+='<button data-act="do:peace:'+t+'">Offer peace<small>30 ⭐ · They accept if their will is breaking, or if you hold a fifth of their country and they hold none of yours. You keep the provinces you claim</small></button>';
  else{h+='<button data-act="do:improve:'+t+'">Improve relations<small>25 ⭐ · Their opinion +12</small></button>';
   if(!ally){h+='<button data-act="do:alliance:'+t+'">Propose an alliance<small>50 ⭐ · Needs good opinion, or fair opinion and a tense world</small></button>';
    if(!S.guar.some(g=>g[0]===p&&g[1]===t))h+='<button data-act="do:guarantee:'+t+'">Guarantee independence<small>40 ⭐ · You will be called on if they are attacked</small></button>';
    if(G.claims(S,p).some(k=>S.prov[G.KEY[k]].owner===t&&S.nat[t].cap!==G.KEY[k]))h+='<button data-act="do:demand:'+t+'">Demand our claims<small>40 ⭐ · They yield only if they stand alone and are far weaker. A refusal gives a case for war</small></button>';
    if(cb===undefined)h+='<button data-act="do:justify:'+t+'">Prepare a case for war<small>'+(G.claims(S,p).some(k=>S.prov[G.KEY[k]].owner===t)?35:60)+' ⭐ · Ready in 45 days · Raises tension</small></button>';
    else if(cb>S.day)h+='<button disabled>Case for war ready in '+(cb-S.day)+' days</button>';
    h+='<button class="danger" data-act="do:declare:'+t+'">Declare war<small>'+(cb!==undefined&&cb<=S.day?'You have a case for war':'Without a case: stability −8, every nation thinks less of you')+'</small></button>'}}
  if(ally&&me().faction)h+='<button class="ghost" data-act="do:leave:'+t+'">Leave the alliance<small>Stability −6</small></button>';
  return h+'</div>'},
 army(){if(edit)return PAN.design();const N=me(),mine=S.divs.filter(d=>d.o===S.player),mp=G.manpower(S,S.player);let str=0;for(const d of mine)str+=d.str;
  let h='<h2>The Army</h2><p>'+mine.length+' divisions at '+pct(mine.length?str/mine.length*100:0)+' average strength. '+fmt(mp.free)+' men available.</p>'+(me().mgr&&me().mgr.armies?mgrNote('armies'):'')+'<h3>Armies</h3>';
  const foes=G.activeEnemies(S,S.player);
  for(const a of N.armies||[]){const ds=mine.filter(d=>d.army===a.id);h+='<div class="tpl"><b>'+esc(a.name)+'</b> <small>'+ds.length+(ds.length===1?' division':' divisions')+'</small>'+
    (a.gen?'<p>General '+esc(a.gen.name)+' <small>'+D.TRAITS[a.gen.trait].n+' '+'★'.repeat(a.gen.skill)+' · '+D.TRAITS[a.gen.trait].d+' +'+(a.gen.trait==='org'?12:4)*a.gen.skill+'%</small> <button class="link" data-act="armyGen:'+a.id+'">replace (25 ⭐)</button></p>':'')+
    '<div class="seg">'+STANCE.map((n,i)=>'<button data-act="armySet:'+a.id+':'+i+'" class="'+(a.stance===i?'on':'')+'">'+n+'</button>').join('')+'</div>'+
    (a.stance?'<p class="sub">'+['','Spreads along the front and digs in. Never attacks.','Holds the front and attacks where the odds are good.','Attacks wherever it has any edge. Expect heavy losses.'][a.stance]+'</p><div class="q"><span>Front</span><button class="ghost" data-act="armyFoe:'+a.id+'">'+(a.foe&&foes.includes(a.foe)?'Against '+esc(nm(a.foe)):'All enemies')+' ⟳</button></div>':'<p class="sub">You give every order yourself.</p>')+
    '<div class="row"><button class="ghost" data-act="armySel:'+a.id+'">Select</button>'+(sel.size?'<button class="ghost" data-act="armyAdd:'+a.id+'">Add selected ('+sel.size+')</button>':'')+'<button class="ghost" data-act="armyDel:'+a.id+'">Disband</button></div></div>'}
  h+=sel.size?'<button data-act="armyNew">Form a new army from the '+sel.size+' selected</button>':'<p class="sub">Select divisions on the map, then form them into an army here. An army set to Hold, Advance or Assault runs its own stretch of front, so you only move by hand where it matters.</p>';
  h+='<h3>Division designs</h3>';
  N.tpls.forEach((t,i)=>{const st=G.tplStats(S,S.player,t),n=mine.filter(d=>d.t===i).length;h+='<div class="tpl"><b>'+esc(t.name)+'</b> <small>'+n+' in the field</small><p>'+tplLine(t)+'</p>'+statRow(st)+'<div class="row"><button data-act="recruit:'+i+'">Recruit<small>'+fmt(st.mp)+' men · 60 days</small></button><button class="ghost" data-act="design:'+i+'">Edit design</button></div></div>'});
  if(N.tpls.length<8)h+='<button class="ghost" data-act="design:'+N.tpls.length+'">New design</button>';
  h+='<p class="sub">New divisions muster at '+(recP>=0&&S.prov[recP].ctrl===S.player?P[recP].name:N.cap>=0?P[N.cap].name:'the capital')+'. Select one of your provinces and press "Recruit here" to change that.</p>';
  h+='<h3>In training</h3>'+(N.recruit.length?N.recruit.map((r,i)=>'<div class="q"><span>'+esc(N.tpls[r.t].name)+' → '+P[r.p>=0?r.p:N.cap].name+'</span><span>'+(r.left>0?r.left+' days':'waiting for equipment')+'</span><button class="ghost" data-act="cancelRecruit:'+i+'">✕</button></div>').join(''):'<p class="sub">Nothing in training.</p>');
  return h},
 design(){const t=edit.tpl,st=G.tplStats(S,S.player,t),N=me();let h='<button class="link" data-act="design:x">‹ Back</button><h2>Division design</h2><input id="tplname" class="txt" maxlength="28" value="'+esc(t.name).replace(/"/g,'&quot;')+'">'+
   '<h3>Line battalions</h3>'+Object.keys(D.BN).map(b=>{const B=D.BN[b],ok=G.canBn(S,S.player,b);return'<div class="q'+(ok?'':' off')+'"><span><b>'+B.n+'</b><small>Atk '+B.att+' · Def '+B.def+' · Brk '+B.brk+' · Width '+B.w+(ok?'':' · needs research')+'</small></span><span class="step"><button data-act="bn:'+b+':-1"'+(ok?'':' disabled')+'>−</button><b>'+(t.bn[b]||0)+'</b><button data-act="bn:'+b+':1"'+(ok?'':' disabled')+'>+</button></span></div>'}).join('')+
   '<h3>Support companies</h3>'+Object.keys(D.SUP).map(s=>{const X=D.SUP[s],on=(t.sup||[]).includes(s);return'<label class="q"><span><b>'+X.n+'</b><small>'+(X.def?'Defence +'+X.def+' ':'')+(X.dig?'Entrenchment +'+X.dig*100+'% ':'')+(X.spd?'Speed +10% ':'')+(X.heal?'Fewer permanent losses':'')+'</small></span><input type="checkbox" data-sup="'+s+'"'+(on?' checked':'')+'></label>'}).join('')+
   '<h3>On paper</h3>'+statRow(st)+'<p class="sub">Equipment: '+Object.keys(st.eq).filter(e=>st.eq[e]).map(e=>Math.round(st.eq[e])+' '+D.EQUIP[e].n.toLowerCase()).join(', ')+'. A battle line is 80 wide, plus 40 for each extra direction of attack. Breakthrough protects troops while they attack; without it, attackers bleed.</p>'+
   '<div class="row"><button data-act="saveTpl">Save design</button></div><p class="sub">Existing divisions of this design change with it. Re-equipping drops them to 85% strength until reinforcements arrive.</p>';return h},
 prod(){const N=me(),E=D.ECON[N.econ],used=N.lines.reduce((s,l)=>s+l.f,0),need={};
  for(const d of S.divs)if(d.o===S.player){const st=G.stats(S,d);for(const e in st.eq)need[e]=(need[e]||0)+st.eq[e]*(1-d.str)}for(const r of N.recruit){const st=G.tplStats(S,S.player,N.tpls[r.t]);for(const e in st.eq)need[e]=(need[e]||0)+st.eq[e]}
  let h='<h2>Industry</h2>'+mgrNote('industry')+'<h3>Military factories <small>'+used+' of '+N.mil+' assigned</small></h3>';
  for(const e in D.EQUIP){const X=D.EQUIP[e];if(X.tech&&!N.tech.includes(X.tech))continue;const l=N.lines.find(x=>x.eq===e),f=l?l.f:0,out=f*X.per*E.out*(1+(N.mod.prod||0));
   h+='<div class="q"><span><b>'+X.n+'</b><small>In store '+fmt(Math.max(0,N.stock[e]))+' · needed '+fmt(need[e]||0)+' · +'+(out>=10?Math.round(out):out.toFixed(1))+' a day</small></span><span class="step"><button data-act="line:'+e+':-1">−</button><b>'+f+'</b><button data-act="line:'+e+':1">+</button></span></div>'}
  const free=N.civ*(1-E.goods);h+='<h3>Civilian factories <small>'+N.civ+', of which '+free.toFixed(0)+' free to build</small></h3><div class="row"><button data-act="build:civ">Civilian factory</button><button data-act="build:mil">Military factory</button><button data-act="build:fleet">Battle squadron</button><button data-act="build:subs">Submarine flotilla</button></div><p class="sub">Forts and railways are ordered from a province. The first projects in the queue get up to 15 factories each.</p>';
  h+=N.build.length?N.build.map((b,i)=>'<div class="q"><span>'+D.BUILD[b.k].n+(b.p>=0?' · '+P[b.p].name:'')+'</span><span>'+bar(b.prog/D.BUILD[b.k].cost)+'</span><button class="ghost" data-act="cancelBuild:'+i+'">✕</button></div>').join(''):'<p class="sub">Nothing under construction.</p>';
  if(G.blockaded(S,S.player))h+='<p class="bad">The enemy fleet is blockading our ports. Output is down and stability is draining.</p>';return h},
 res(){const N=me(),slots=D.NATIONS[S.player].slots,yr=G.date(S.day).y;let h='<h2>Research</h2>'+mgrNote('research')+'<h3>Teams <small>'+N.research.length+' of '+slots+' busy</small></h3>';
  h+=N.research.length?N.research.map(r=>{const T=D.TECH.find(x=>x.id===r.id);return'<div class="q"><span><b>'+T.name+'</b><small>'+T.desc+'</small></span>'+bar(r.prog)+'</div>'}).join(''):'<p class="sub">No research under way.</p>';
  const av=G.techAvail(S,S.player);for(const tr of['Infantry','Artillery','Industry','Machines']){const list=av.filter(T=>T.track===tr);if(!list.length)continue;h+='<h3>'+tr+'</h3>'+list.map(T=>'<button class="tech" data-act="research:'+T.id+'"'+(N.research.length>=slots?' disabled':'')+'><b>'+T.name+'</b> <i>'+T.year+(T.year>yr?' · ahead of its time, slower':'')+'</i><small>'+T.desc+'</small></button>').join('')}
  h+='<h3>Known</h3><p class="sub">'+(N.tech.map(id=>D.TECH.find(x=>x.id===id).name).join(', ')||'Nothing yet.')+'</p>';return h},
 chron(){const ks=[['all','All'],['war','War'],['dip','Diplomacy'],['story','Events'],['home','Home']];const list=S.chron.filter(x=>chronK==='all'||x.k===chronK).slice(-150).reverse();
  return'<h2>The Chronicle</h2><p class="sub">Fate seed '+S.seed+'. The same seed and the same decisions give the same history.</p><div class="seg">'+ks.map(k=>'<button data-act="chronK:'+k[0]+'" class="'+(chronK===k[0]?'on':'')+'">'+k[1]+'</button>').join('')+'</div><div class="news">'+list.map(x=>'<p><i>'+G.date(x.day).str+'</i>'+esc(x.text)+'</p>').join('')+'</div>'},
 sea(){const N=me(),p=S.player,war=G.activeEnemies(S,p).length>0;let tot=0;for(const z in D.SEAS)tot+=(N.sq||{})[z]||0;
  let h='<h2>Sea and Air</h2>'+mgrNote('sea')+'<h3>The fleet <small>'+tot+' battle squadrons, '+(N.subs||0)+' submarine flotillas</small></h3><p class="sub">A crossing is closed to you when the enemy has much the stronger fleet in either sea it touches. Ports are blockaded when the enemy dominates most of the seas they stand on. Squadrons and submarines are built under Industry.</p>';
  for(const z in D.SEAS){const f=G.seaForce(S,p,z),mine=(N.sq||{})[z]||0,ports=G.ports(S,p).z[z]||0,st=!war?'':f.theirs>0&&f.mine<.6*f.theirs?'<span class="bad">closed to us</span>':f.mine>0&&f.theirs<.6*f.mine?'<span class="yes">ours</span>':f.theirs>0?'contested':'';
    h+='<div class="q"><span><b>'+D.SEAS[z]+'</b><small>'+ports+(ports===1?' port':' ports')+(war?' · our side '+f.mine+' · enemy '+f.theirs:'')+' '+st+'</small></span><span class="step"><button data-act="sq:'+z+':-1">−</button><b>'+mine+'</b><button data-act="sq:'+z+':1">+</button></span></div>'}
  if(war){const pen=G.subPenalty(S,p);h+='<p class="sub">'+(G.blockaded(S,p)?'<span class="bad">We are blockaded.</span> ':'')+(pen>0?'Enemy submarines are costing us '+Math.round(pen*100)+'% of our output. Squadrons in the Atlantic and North Sea escort the convoys.':'')+'</p>'}
  const mineW=(S.wings||[]).filter(w=>w.o===p),bases={};for(const w of mineW)(bases[w.p]=bases[w.p]||[]).push(w);
  h+='<h3>The air arm <small>'+mineW.filter(w=>w.t==='f').length+' fighter wings, '+mineW.filter(w=>w.t==='b').length+' bomber wings</small></h3>';
  if(!N.tech.includes('fighter'))h+='<p class="sub">No aircraft yet. Research Fighter aircraft, then Bombing aircraft.</p>';
  else{h+='<p class="sub">Wings reach battles within about 550 km of their base. Whoever has more fighters overhead holds the sky, and bombers add to an attack in proportion.</p><div class="row"><button data-act="wing:f">Form a fighter wing<small>'+Math.floor(N.stock.fighters)+' of '+D.WING_SIZE+' fighters in store</small></button>'+(N.tech.includes('bomber')?'<button data-act="wing:b">Form a bomber wing<small>'+Math.floor(N.stock.bombers)+' of '+D.WING_SIZE+' bombers in store</small></button>':'')+'</div><p class="sub">Aircraft are built on the military production lines under Industry.</p>';
   for(const b in bases){const ws=bases[b],nf=ws.filter(w=>w.t==='f').length,nb=ws.length-nf,dst=selProv>=0&&selProv!==+b&&G.friendly(S,p,S.prov[selProv].ctrl);h+='<div class="q"><span><b>'+esc(P[b].name)+'</b><small>'+nf+' fighter, '+nb+' bomber'+(ws.some(w=>w.ready>S.day)?' · settling in':'')+'</small></span><button class="ghost" data-act="rebase:'+b+'"'+(dst?'':' disabled')+'>'+(dst?'Move to '+esc(P[selProv].name):'Select a province to move')+'</button></div>'}}
  return h},
 min(){const m=me().mgr||{};let h='<h2>Ministers</h2><p class="sub">Each area of the state can be left to a minister or run by you. With all of them delegated you only answer telegrams, conduct diplomacy and command the army.</p>';
  for(const k in AREA){const a=AREA[k],on=!!m[k];h+='<div class="tpl"><b>'+a[1]+'</b> <small>'+(on?(k==='armies'?'the generals are in command':'minister in charge'):'you are in charge')+'</small><p>'+a[2]+'</p><div class="row"><button class="'+(on?'ghost':'')+'" data-act="mgr:'+k+':'+(on?0:1)+'">'+(on?'Take over':k==='armies'?'Let the generals run the war':'Hand to a minister')+'</button><button class="ghost" data-act="panel:'+a[0]+'">Open '+a[1].toLowerCase()+'</button></div></div>'}
  return h},
 help(){return HELP},
 menu(){return'<h2>Powder Keg</h2><p class="sub">'+esc(D.SCEN[S.scen].name)+' · Fate seed '+S.seed+'. The game saves itself on the first of every month in this browser.</p><div class="acts"><button data-act="panel:help">How to play</button><button data-act="save">Save now</button><button class="ghost" data-act="sound">Sound: '+(sound?'on':'off')+'</button>'+(S.flags.ended!==undefined?'<button class="ghost" data-act="reckon">Show the reckoning again</button>':'')+'<button class="danger" data-act="quit">Quit to the main menu<small>Your save is kept</small></button></div>'+
  '<h3>Controls</h3><p class="sub">Click a province to select your divisions there, then click where they should go. Right-click also gives a move order. Shift-click adds another stack. Space pauses, 1 to 3 set the speed, Escape clears the selection.</p>'}
};
function fleetLineOld(){const en=G.activeEnemies(S,S.player);if(!en.length)return'The fleet decides who may cross the sea and who is blockaded in wartime.';const side=G.sideOf(S,S.player).filter(t=>G.alive(S,t)),mine=side.reduce((s,t)=>s+S.nat[t].navy,0),theirs=en.reduce((s,t)=>s+S.nat[t].navy,0);
  return'Our side '+mine+', the enemy '+theirs+'. '+(mine>=.6*theirs?'Our troops can cross the sea.':'The enemy controls the sea: no crossings.')+(theirs>mine*1.5?' We are blockaded.':mine>theirs*1.5?' The enemy is blockaded.':'')}
function op(v){return'<b class="'+(v<=-30?'bad':v>=30?'yes':'')+'">'+(v>0?'+':'')+v+'</b>'}
function showPanel(){const el=$('panel');if(!panel){el.hidden=true;$('panel-body').innerHTML='';return}el.hidden=false;const body=$('panel-body'),sc=body.scrollTop;body.innerHTML=PAN[panel]();body.scrollTop=sc;
  body.querySelectorAll('[data-ball]').forEach(e=>{const t=e.dataset.ball;e.appendChild(A.icon(fid(t),e.classList.contains('big')?56:30,mood(t)))})}
function modal(){const el=$('modal');if(S&&endOpen){el.hidden=false;el.innerHTML=reckoning();return}if(!S||!S.pending.length){el.hidden=true;return}const pe=S.pending[0],E=PK.EVENTS[pe.id],txt=typeof E.text==='function'?E.text(S,pe.tag,pe.data):E.text,opts=E.opts(S,pe.tag,pe.data);
  el.hidden=false;el.innerHTML='<div class="card"><div class="ic">'+E.pic+'</div><p class="eyebrow">'+(E.fate?'Fate':'Telegram')+' · '+G.date(S.day).str+'</p><h2>'+esc(E.title)+'</h2><p>'+esc(cap1(txt))+'</p><div class="choices">'+opts.map((o,i)=>'<button data-act="opt:'+i+'">'+esc(cap1(o.label))+(o.tip?'<small>'+esc(cap1(o.tip))+'</small>':'')+'</button>').join('')+'</div></div>';return}
/* ---------- the reckoning ---------- */
function reckoning(){const N=me(),gs=G.goals(S,S.player),done=gs.filter(g=>g.ok).length,SC=D.SCEN[S.scen],rows=SC.compare?SC.compare(S):generic();let dead=0;for(const t of G.TAGS)dead+=S.nat[t].lost||0;
  const laurels=[];if(S.flags.great_war===undefined)laurels.push(['🕊️','Peacemaker','No two great powers went to war.']);if(N.wins)laurels.push(['🏆','Victor','On the winning side against a great power.']);if(!N.everCapit&&!N.dead&&N.foughtMajor)laurels.push(['🛡️','Unbroken','Fought a great power and never capitulated.']);
  if(G.rank(S,S.player)===1)laurels.push(['👑','First among the powers','The strongest nation in Europe.']);
  const verdict=N.dead?'Your nation no longer exists.':done===gs.length?'Every aim achieved.':done===0?'None of your aims was achieved.':done+' of '+gs.length+' aims achieved.';
  let h='<div class="card wide"><p class="eyebrow">The reckoning · '+G.date(Math.min(S.day,S.end)).str+'</p><h2>'+esc(nm(S.player))+'</h2><p class="center"><b>'+verdict+'</b></p>'+
   gs.map(g=>'<div class="aim '+(g.ok?'ok':'')+'"><b>'+(g.ok?'✓':'✗')+' '+esc(g.name)+'</b><small>'+esc(g.desc)+'</small></div>').join('')+
   (laurels.length?'<div class="laurels">'+laurels.map(l=>'<span title="'+l[2]+'">'+l[0]+' <b>'+l[1]+'</b><small>'+l[2]+'</small></span>').join('')+'</div>':'');
  if(rows.length)h+='<h3>Your timeline against the real one</h3><div class="tw"><table class="cmp"><thead><tr><th></th><th>What really happened</th><th>What happened here</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<p class="sub center">Soldiers lost by all nations in this timeline: '+fmt(dead)+'.</p><div class="choices">'+
   (!N.dead?'<button data-act="endKeep">Keep playing<small>The clock runs on. Nothing more is judged.</small></button>':'')+
   (G.carry&&S.scen==='1914'&&!N.dead?'<button data-act="carry">Carry this world into 1936<small>The map, the grudges and the treaties of this game become the starting point of the next war.</small></button>':'')+
   '<button class="ghost" data-act="quit">Main menu</button></div></div>';return h}
/* a world with no real counterpart is summed up on its own terms */
function generic(){const rows=[],wars=Object.keys(S.flags).filter(k=>k.startsWith('w:')&&S.flags[k]>=S.day0),big=S.treaties.filter(t=>t.day>=S.day0&&t.level>=0);
  rows.push(['Wars',S.past?'This world has no counterpart in the history books.':'',wars.length?wars.length+' declarations of war, the first on '+G.date(Math.min(...wars.map(k=>S.flags[k]))).str+'.':'None.']);
  rows.push(['Treaties','',big.length?big.map(t=>['A peace of reconciliation','A victor\'s peace','A dictated peace'][t.level]+' on '+t.losers.map(l=>G.name(S,l)).join(', ')+' ('+G.date(t.day).y+')').join('; ')+'.':'None imposed.']);
  rows.push(['The strongest power','',G.name(S,G.TAGS.filter(t=>!S.nat[t].dead).sort((a,b)=>G.strength(S,b)-G.strength(S,a))[0])+'.']);
  const gone=G.TAGS.filter(t=>S.own0.includes(t)&&S.nat[t].dead).map(t=>G.name(S,t));rows.push(['Vanished from the map','',gone.length?gone.join(', ')+'.':'No one.']);return rows}
function checkEnd(){if(!S||endOpen)return;if(S.flags.ended===undefined&&(S.day>=S.end||me().dead)){S.flags.ended=S.day;endOpen=true;speed=0;saveGame();beep('end')}}
/* ---------- sound ---------- */
let actx=null;function beep(kind){if(!sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime,notes={click:[[660,.04]],tele:[[880,.08],[1175,.12]],war:[[110,.35],[98,.45]],end:[[392,.2],[523,.2],[659,.4]],done:[[523,.1],[784,.16]]}[kind]||[[440,.05]];let at=t;
  for(const[f,d]of notes){const o=actx.createOscillator(),g=actx.createGain();o.type=kind==='war'?'sawtooth':'triangle';o.frequency.value=f;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(kind==='war'?.12:.07,at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(actx.destination);o.start(at);o.stop(at+d+.02);at+=d*.8}}catch(e){}}
function cues(){const w=Object.keys(S.wars).filter(k=>k.split('|').includes(S.player)).length;if(w>seenWar)beep('war');seenWar=w;if(S.pending.length>seenPend)beep('tele');seenPend=S.pending.length}
const HELP='<h2>How to play</h2><p>You run one nation. The clock is paused until you press ▶. Telegrams stop it again whenever a decision is yours.</p>'+
 '<h3>Start small</h3><p>You do not have to manage everything. Ministers run plans, industry, research and the fleet unless you take an area over under <b>Ministers</b>. To begin with, answer the telegrams, watch the map, and command your divisions. You can even hand the war to the generals.</p>'+
 '<h3>The map</h3><p>Click a province to see it and to select your divisions there. With divisions selected, click another province to send them. Right-click does the same. Shift-click adds a second stack. The bar under each counter shows strength and organisation together.</p>'+
 '<h3>Fighting</h3><p>Moving into a province held by the enemy starts a battle. A battle line is 80 wide, about three divisions, plus 40 for each extra direction you attack from, so attack from several provinces at once. Defenders who are dug in or behind forts take very little harm, and attackers without breakthrough bleed. Heavy artillery, and later tanks, are how a line is broken. Cut a province off from its capital and the troops in it starve.</p>'+
 '<h3>Sea and air</h3><p>Battle squadrons are stationed in six seas. Move them where your crossings and ports need them: an enemy with the stronger fleet in a sea closes it to your troops and can blockade you. Submarines cut the enemy\'s output unless escorted convoys stop them. Fighter and bomber wings are formed from aircraft you build, based in a province, and reach battles nearby.</p>'+
 '<h3>Armies</h3><p>Select divisions, open Army and form them into an army. Set it to Hold, Advance or Assault and it runs its own front under its general. Leave it on Manual to give every order yourself.</p>'+
 '<h3>The country</h3><p><b>Plans</b> shape what kind of state you become, one at a time. <b>Industry</b> splits military factories between weapons and uses civilian factories to build. <b>Research</b> runs two or three teams. <b>State</b> holds your laws, and your aims.</p>'+
 '<h3>Other nations</h3><p>A ball\'s eyes show what it thinks of you. Open Diplomacy to improve relations, guarantee a neighbour, propose an alliance, demand a claim, or prepare a case for war. Every nation has its own temperament and remembers a harsh peace.</p>'+
 '<h3>Winning</h3><p>There is no single way to win. Your aims are listed under State and are judged on the end date, when your timeline is set beside the real one. Stability and war support matter as much as armies: a nation whose home front collapses must ask for terms.</p>';
/* ---------- tutorial: a guided first quarter of an hour in a real game ---------- */
let tutMoved=false;
const TUT=[
 {t:'This is France on 28 June 1914. The clock is stopped, and nothing happens until you say so. This short tour shows you the controls in a real game. You can leave it at any time.',next:'Start'},
 {t:'<b>Look around.</b> Drag the map to move it. Pinch, or use the scroll wheel, to zoom in and out. Try both.',done:()=>tutMoved},
 {t:'<b>Select troops.</b> Each little plate on the map is a stack of divisions, with a number. Tap <b>Paris</b>, ringed in gold, to select the divisions there.',ring:()=>me().cap,enter:()=>centreOn(me().cap,Math.max(cam.z,1.5)),done:()=>sel.size>0},
 {t:'<b>Give an order.</b> With divisions selected, tap any other French province and they will march there. A blue line shows their route. Tap Paris again, or Deselect, to let go of them.',done:()=>[...sel].some(id=>{const d=G.div(S,id);return d&&d.path})},
 {t:'<b>Start the clock.</b> Press ▶ at the top. The buttons beside it run time faster, and ❚❚ stops it. On a keyboard, Space pauses.',pulse:'.speed [data-act="speed:1"]',done:()=>speed>0},
 {t:'<b>Telegrams.</b> Days are passing. When something needs your decision the game stops and a telegram appears. Read it and choose. One is on its way now.',done:()=>S.flags.tutAnswered!==undefined},
 {t:'<b>Other nations.</b> Every ball\'s eyes show what it thinks of you. Open <b>Diplomacy</b> and tap the German Empire to see how you stand and what you can do.',pulse:'#side [data-act="panel:dip"]',done:()=>panel==='dip'&&!!dipTag},
 {t:'<b>Armies.</b> Moving every division by hand is hard work. Tap a province holding your troops, open <b>Army</b>, and press "Form a new army". An army can be told to Hold or Advance and will then run its own front.',pulse:'#side [data-act="panel:army"]',done:()=>(me().armies||[]).length>0},
 {t:'<b>Ministers.</b> You do not have to run everything. Open <b>Ministers</b>: plans, industry, research and the fleet are being looked after for you. Take one over whenever you want more to do.',pulse:'#side [data-act="panel:min"]',done:()=>panel==='min'},
 {t:'<b>Your aims.</b> Open <b>State</b>. At the top are the aims you will be judged on when the game ends on 1 January 1920, and below them the health of your home front.',pulse:'#side [data-act="panel:gov"]',done:()=>panel==='gov'},
 {t:'That is everything you need. The Austrian ultimatum to Serbia is days away, and what France does about it is up to you. "How to play" under ☰ has the detail on fighting, fleets and peace.',next:'Finish'}];
function tutShow(){const el=$('tut'),on=S&&S.tut!==undefined&&S.tut<TUT.length&&!endOpen;document.querySelectorAll('.pulse').forEach(e=>e.classList.remove('pulse'));$('hud').classList.toggle('tuton',!!on);if(!on){el.hidden=true;return}
  const st=TUT[S.tut];el.hidden=false;el.innerHTML='<div class="tutcard"><p class="tn">Tutorial · step '+(S.tut+1)+' of '+TUT.length+'</p><p>'+st.t+'</p><div class="row">'+(st.next?'<button data-act="tutNext">'+st.next+'</button>':'<span class="sub">Do this to continue.</span>')+(S.tut<TUT.length-1?'<button class="link" data-act="tutSkip">Leave the tutorial</button>':'')+'</div></div>';
  if(st.pulse){const t=document.querySelector(st.pulse);if(t)t.classList.add('pulse')}}
function tutCheck(){if(!S||S.tut===undefined||S.tut>=TUT.length)return;const st=TUT[S.tut];if(st.done&&st.done())tutGo(S.tut+1)}
function tutGo(i){S.tut=i;tutMoved=false;if(i>=TUT.length){S.tut=undefined;toast('Tutorial finished. Good luck.')}else{const st=TUT[i];if(st.enter)st.enter();if(i===5&&!S.sched.some(x=>x.id==='f_press'))S.sched.push({day:S.day+2,id:'f_press',tag:S.player})}refresh()}
/* the bars change height when they wrap on a narrow screen; everything else is placed from their real size */
function measure(){const h=$('hud'),t=$('tut');h.style.setProperty('--top',$('top').offsetHeight+'px');h.style.setProperty('--bot',$('bottom').offsetHeight+'px');h.style.setProperty('--tut',(t.hidden?0:t.offsetHeight+8)+'px')}
function refresh(){if(!S)return;checkEnd();cues();top();side();bottom();info();showPanel();modal();tutShow();measure();dirty=true;tutCheck()}

/* ---------- actions ---------- */
function say(err){if(err)toast(err);refresh()}
function act(a){const[k,x,y]=a.split(':'),p=S&&S.player;
  switch(k){
   case'new':startGame(x);break;case'continue':loadGame();break;
   case'speed':speed=+x;refresh();break;
   case'panel':panel=panel===x?null:x;edit=null;if(x==='dip')dipTag=null;refresh();break;
   case'closepanel':panel=null;edit=null;refresh();break;
   case'desel':sel.clear();selProv=-1;refresh();break;
   case'halt':G.halt(S,[...sel]);refresh();break;
   case'opt':G.resolve(S,0,+x);if(S.tut!==undefined)S.flags.tutAnswered=S.day;refresh();break;
   case'law':say(G.cmd.law(S,p,x,+y));break;
   case'dip':dipTag=x||null;panel='dip';refresh();break;
   case'do':{const n0=S.chron.length,e=G.cmd[x](S,p,y);if(!e&&x==='improve')toast('Our envoys are well received.');if(!e&&x==='alliance')toast(nm(y)+' accepts.');if(!e&&x==='demand'&&S.chron.length>n0)toast(S.chron[S.chron.length-1].text);say(e);break}
   case'recruit':say(G.cmd.recruit(S,p,+x,recP>=0&&S.prov[recP].ctrl===p?recP:undefined)||'');break;
   case'recruitHere':recP=selProv;panel='army';edit=null;refresh();break;
   case'cancelRecruit':G.cmd.cancelRecruit(S,p,+x);refresh();break;
   case'design':if(x==='x')edit=null;else{const N=me(),i=+x;edit={i,tpl:JSON.parse(JSON.stringify(N.tpls[i]||{name:'New Division',bn:{inf:6},sup:[]}))}}refresh();break;
   case'bn':if(!edit)break;keepName();edit.tpl.bn[x]=Math.max(0,(edit.tpl.bn[x]||0)+(+y));refresh();break;
   case'saveTpl':{if(!edit)break;keepName();const e=G.cmd.template(S,p,edit.i,edit.tpl);if(!e){edit=null;toast('Design saved.')}say(e);break}
   case'line':G.cmd.line(S,p,x,+y);refresh();break;
   case'build':say(G.cmd.build(S,p,x,y===undefined?undefined:+y)||'');break;
   case'cancelBuild':G.cmd.cancelBuild(S,p,+x);refresh();break;
   case'research':say(G.cmd.research(S,p,x));break;
   case'chronK':chronK=x;refresh();break;
   case'board':if(PK.BOARDUI)PK.BOARDUI.show();break;
   case'tutorial':{menuScen='1914';const g=G.newGame('FRA',1914,'1914');g.tut=0;begin(g);break}
   case'tutNext':tutGo(S.tut+1);break;case'tutSkip':S.tut=undefined;refresh();break;
   case'mgr':G.cmd.minister(S,p,x,y==='1');refresh();break;
   case'armyGen':say(G.cmd.armyGeneral(S,p,+x));break;
   case'sq':say(G.cmd.squadron(S,p,x,+y));break;case'wing':say(G.cmd.wing(S,p,x));break;case'rebase':say(G.cmd.rebase(S,p,+x,selProv));break;
   case'sound':sound=!sound;try{localStorage.setItem('powderkeg.sound',sound?'1':'0')}catch(e){}if(sound)beep('done');refresh();break;
   case'reckon':endOpen=true;panel=null;refresh();break;
   case'endKeep':endOpen=false;refresh();break;
   case'carry':{const n=G.carry(S);if(n){endOpen=false;begin(n);saveGame();toast('It is 1936. The world you made is still here.')}break}
   case'scen':menuScen=x;menu();break;
   case'plan':say(G.cmd.plan(S,p,x));break;case'cancelPlan':G.cmd.cancelPlan(S,p);refresh();break;
   case'armyNew':say(G.cmd.armyNew(S,p,[...sel]));break;
   case'armyAdd':G.cmd.armyAdd(S,p,+x,[...sel]);refresh();break;
   case'armySet':G.cmd.armySet(S,p,+x,'stance',+y);refresh();break;
   case'armyFoe':{const a=(me().armies||[]).find(v=>v.id===+x),f=[null].concat(G.activeEnemies(S,p));if(a){a.foe=f[(f.indexOf(a.foe)+1)%f.length]||null}refresh();break}
   case'armySel':sel.clear();selProv=-1;for(const d of S.divs)if(d.o===p&&d.army===+x)sel.add(d.id);refresh();break;
   case'armyDel':G.cmd.armyDisband(S,p,+x);refresh();break;
   case'save':toast(saveGame()?'Saved.':'This browser would not store the save.');break;
   case'quit':saveGame();S=null;speed=0;panel=null;endOpen=false;sel.clear();selProv=-1;$('hud').hidden=true;$('modal').hidden=true;menu();dirty=true;break;
   case'seed':{const el=$('seed');if(el)el.value=1000+Math.floor(Math.random()*9000);break}
  }}
function keepName(){const el=$('tplname');if(el&&edit)edit.tpl.name=el.value.trim()||'Division'}

/* ---------- saving ---------- */
function saveGame(){if(!S)return false;try{localStorage.setItem(SAVE_KEY,G.save(S));return true}catch(e){return false}}
function savedInfo(){try{const s=localStorage.getItem(SAVE_KEY);if(!s)return null;const o=JSON.parse(s);if(o.v!==D.VERSION||!o.nat[o.player])return null;return{player:o.player,day:o.day,name:o.nat[o.player].name||(o.natOv&&o.natOv[o.player]&&o.natOv[o.player].name)||D.BASE_NATIONS[o.player].name}}catch(e){return null}}
function loadGame(){try{const o=G.load(localStorage.getItem(SAVE_KEY));if(o)begin(o);else toast('That save could not be read.')}catch(e){toast('That save could not be read.')}}

/* ---------- menu ---------- */
const BLURB={GER:'The strongest army in Europe, with enemies on both sides.',AUS:'Eleven nations under one crown, and a score to settle with Serbia.',RUS:'Endless manpower, thin industry, and a throne less secure than it looks.',FRA:'Forty-three years of waiting for Alsace-Lorraine.',
 ENG:'The greatest fleet in the world and a very small army.',ITA:'Allied to its rival and courted by everyone.',OTT:'An old empire deciding which friend will cost it least.'};
function menu(){const m=$('menu');m.hidden=false;const sv=savedInfo(),scens=Object.keys(D.SCEN).filter(k=>k!=='carry');if(!D.SCEN[menuScen])menuScen='1914';const SC=D.SCEN[menuScen],pre=G.newGame('XXX',1,menuScen),live=G.TAGS.filter(t=>!pre.nat[t].dead),
  majors=live.filter(t=>D.NATIONS[t].major),minors=live.filter(t=>!D.NATIONS[t].major&&t!=='LUX'&&t!=='PER'&&t!=='DZG'),card=t=>D.NATIONS[t].regime?'<div class="mcard off"><span class="ic" data-ball="'+t+'"></span><span class="mbody"><b>'+D.NATIONS[t].name+'</b><span>Run by the computer in this scenario.</span></span></div>':'<button class="mcard" data-act="new:'+t+'"><span class="ic" data-ball="'+t+'"></span><span class="mbody"><b>'+D.NATIONS[t].name+'</b><span>'+esc((SC.blurbs&&SC.blurbs[t])||(menuScen==='1914'&&BLURB[t])||'')+'</span></span></button>';
  m.innerHTML='<div class="menu-in">'+(PK.BOARDUI?'<button class="ghost backb" data-act="board">← Back to the board game</button>':'')+'<p class="eyebrow">Europe, '+G.date(SC.start).str+'</p><h1>Powder Keg</h1>'+(scens.length>1?'<div class="seg">'+scens.map(k=>'<button data-act="scen:'+k+'" class="'+(k===menuScen?'on':'')+'">'+esc(D.SCEN[k].name)+'</button>').join('')+'</div>':'')+'<p class="lede">'+esc(SC.blurb||'')+' Choose a nation and decide.</p>'+
   '<button class="big tutbtn" data-act="tutorial">Tutorial<small>Ten minutes in a real game, as France in 1914</small></button>'+
   (sv?'<button class="big" data-act="continue">Continue your saved game<small>'+esc(sv.name)+' · '+G.date(sv.day).str+'</small></button>':'')+
   '<h3>The great powers</h3><div class="mlist">'+majors.map(card).join('')+'</div>'+
   '<h3>The smaller states</h3><div class="minors">'+minors.map(t=>'<button data-act="new:'+t+'"><span class="ic" data-ball="'+t+'"></span>'+D.NATIONS[t].name+'</button>').join('')+'</div>'+
   '<label class="seedrow" for="seed">Fate seed <input id="seed" class="txt" inputmode="numeric" maxlength="9" value="'+(1000+Math.floor(Math.random()*9000))+'"><button class="ghost" data-act="seed">Shuffle</button></label>'+
   '<p class="fine">The seed shuffles the Fate cards and the choices other nations make. Play the same seed with the same decisions and history repeats itself. Change one decision and it will not.</p></div>';
  m.querySelectorAll('[data-ball]').forEach(e=>e.appendChild(A.icon(fid(e.dataset.ball),e.parentNode.classList.contains('mcard')?48:26,'neutral')))}
function startGame(tag){const el=$('seed'),seed=Math.abs(parseInt(el&&el.value,10))||1914;begin(G.newGame(tag,seed,menuScen))}
function begin(state){S=state;G.applyScen(S);G.index(S);G.supply(S);endOpen=false;seenWar=Object.keys(S.wars).filter(k=>k.split('|').includes(S.player)).length;seenPend=S.pending.length;$('menu').hidden=true;$('hud').hidden=false;speed=0;panel=null;sel.clear();selProv=-1;dipTag=null;edit=null;recP=-1;resize();const cap=me().cap;centreOn(cap>=0?cap:0,Math.max(minZ(),Math.min(1.5,vw/900)));refresh();
  if(S.day===S.day0&&S.tut===undefined)toast('Paused. Your ministers run industry, research, plans and the fleet. You decide the telegrams, diplomacy and the army. Press ▶ when ready.')}

/* ---------- main loop ---------- */
function frame(t){const dt=Math.min(250,t-last);last=t;
  if(S&&speed>0&&!S.pending.length){acc+=dt;let n=0;while(acc>=SPEED[speed]&&n<6){acc-=SPEED[speed];n++;if(!G.tick(S))break;if(G.date(S.day).d===1)saveGame();if(S.pending.length)break}
    if(n){for(const id of[...sel])if(!G.div(S,id))sel.delete(id);refresh()}}else acc=0;
  if(dirty)draw();requestAnimationFrame(frame)}
function init(){cv=$('cv');cx=cv.getContext('2d');
  document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled){e.preventDefault();beep('click');act(b.dataset.act)}});
  document.addEventListener('change',e=>{const t=e.target;if(t.dataset.div){const id=+t.dataset.div;if(t.checked)sel.add(id);else sel.delete(id);bottom();dirty=true}
    if(t.dataset.sup&&edit){keepName();const s=t.dataset.sup,a=edit.tpl.sup=edit.tpl.sup||[];if(t.checked){if(!a.includes(s))a.push(s)}else edit.tpl.sup=a.filter(x=>x!==s);refresh()}});
  cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);drag=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.offsetX,e.offsetY,Math.exp(-e.deltaY*.0015))},{passive:false});cv.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{if(!S||e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();speed=speed?0:1;refresh()}else if(e.key>='1'&&e.key<='3'){speed=+e.key;refresh()}else if(e.key==='Escape'){if(panel){panel=null;edit=null}else{sel.clear();selProv=-1}refresh()}});
  try{sound=localStorage.getItem('powderkeg.sound')!=='0'}catch(e){}
  window.addEventListener('resize',resize);resize();menu();requestAnimationFrame(frame);
  const hot=window.claude&&window.claude.hot;if(hot&&hot.snapshot)hot.snapshot(()=>(S?{save:G.save(S)}:{}));
  if(hot&&hot.data&&hot.data.save){try{const o=G.load(hot.data.save);if(o)begin(o)}catch(e){}}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{dirty=true})}
PK.UI={init,state:()=>S,act,centreOn,click:(key,right)=>click(G.KEY[key]===undefined?-1:G.KEY[key],right),setSpeed:v=>{speed=v}};
PK.UI.boot=init;/* when the board game is on the page it starts first and opens this on request */
if(!PK.BOARD_FIRST){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()}
})(globalThis.PK=globalThis.PK||{});
