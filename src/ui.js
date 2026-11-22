/* Powder Keg — interface: map canvas, HUD, panels, telegrams. */
(function(PK){
const D=PK.DATA,G=PK.SIM,M=PK.MAP,A=PK.ART,P=M.provs,$=id=>document.getElementById(id);
const SAVE_KEY='powderkeg.save.v'+D.VERSION,SPEED=[0,900,320,70];
let S=null,cv,cx,dpr=1,cam={x:300,y:250,z:1},vw=800,vh=600,speed=0,acc=0,last=0,dirty=true;
let selProv=-1,sel=new Set(),panel=null,dipTag=null,edit=null,recP=-1,chronK='all';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const fmt=n=>n>=1e6?(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e4?Math.round(n/1e3)+'k':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.round(n));
const pct=v=>Math.round(v)+'%';
const fid=t=>t==='RUS'&&S&&S.flags.soviet!==undefined?'SOV':t;
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
  /* the nations themselves */
  for(const t of G.TAGS){const N=S.nat[t];if(N.dead||N.cap<0)continue;const C=D.NATIONS[t],p=P[N.cap],rr=(C.major?17:10)*Math.max(.55,Math.min(1.2,k*1.05)),x=p.cx,y=p.cy-(C.major?30:21)*Math.max(.6,k);
    if(!C.major&&z<.75)continue;A.ball(c,fid(t),x,y,rr,mood(t),{you:t===S.player});
    if(C.major&&z<1.5){c.font=(12*Math.max(.7,k))+'px "IM Fell English SC",Georgia,serif';c.lineWidth=3*k;c.strokeStyle='rgba(241,233,214,.85)';const ly=y-(t==='GER'?rr*1.3:rr)-(t==='ENG'||t==='GER'?rr*.95:rr*.55);c.strokeText(nm(t),x,ly);c.fillStyle='#2A241C';c.fillText(nm(t),x,ly)}}
  for(const s of S.says){const N=S.nat[s.tag];if(N.dead||N.cap<0)continue;const p=P[N.cap],C=D.NATIONS[s.tag],y0=p.cy-(C.major?30:21)*Math.max(.6,k);c.font='700 '+(12*k)+'px "Alegreya Sans",sans-serif';const tw=c.measureText(s.text).width+14*k,x=p.cx+16*k,y=y0-8*k;
    c.fillStyle='#fff';c.strokeStyle='#1B1B1B';c.lineWidth=1.3*k;c.beginPath();c.roundRect(x,y-10*k,tw,20*k,7*k);c.fill();c.stroke();c.fillStyle='#1B1B1B';c.textAlign='left';c.fillText(s.text,x+7*k,y+4*k);c.textAlign='center'}
  c.textAlign='left'}
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);vw=cv.clientWidth;vh=cv.clientHeight;cv.width=vw*dpr;cv.height=vh*dpr;clampCam();dirty=true}
function minZ(){return Math.max(vw/M.W,vh/M.H)*.8}
function clampCam(){cam.z=Math.max(minZ(),Math.min(5,cam.z));const w=vw/cam.z,h=vh/cam.z;cam.x=Math.max(-w*.3,Math.min(M.W-w*.7,cam.x));cam.y=Math.max(-h*.3,Math.min(M.H-h*.7,cam.y))}
function centreOn(p,z){if(z)cam.z=z;cam.x=P[p].cx-vw/cam.z/2;cam.y=P[p].cy-vh/cam.z/2;clampCam();dirty=true}
function zoomAt(sx,sy,f){const wx=cam.x+sx/cam.z,wy=cam.y+sy/cam.z;cam.z=Math.max(minZ(),Math.min(5,cam.z*f));cam.x=wx-sx/cam.z;cam.y=wy-sy/cam.z;clampCam();dirty=true}

/* ---------- input ---------- */
const ptr=new Map();let drag=null,pinch=0;
function onDown(e){cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});if(ptr.size===1)drag={x:e.offsetX,y:e.offsetY,cx:cam.x,cy:cam.y,moved:false,btn:e.button,shift:e.shiftKey};else if(ptr.size===2){const a=[...ptr.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(drag)drag.moved=true}}
function onMove(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(ptr.size===2){const a=[...ptr.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)zoomAt((a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,d/pinch);pinch=d;return}
  if(!drag)return;const dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<6)return;drag.moved=true;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();dirty=true}
function onUp(e){ptr.delete(e.pointerId);if(ptr.size<2)pinch=0;if(!drag||ptr.size)return;const d=drag;drag=null;if(d.moved||!S)return;click(provAtW(cam.x+d.x/cam.z,cam.y+d.y/cam.z),d.btn===2,d.shift)}
function mine(p){return p<0?[]:S._at[p].filter(d=>d.o===S.player&&!d.ret)}
function click(p,right,shift){if(S.pending.length)return;
  if(right){if(sel.size&&p>=0)moveTo(p);return}
  if(sel.size&&p>=0&&!shift){const here=new Set([...sel].map(id=>G.div(S,id)).filter(Boolean).map(d=>d.p));if(!(here.size===1&&here.has(p))){moveTo(p);return}}
  if(p<0||(!shift&&p===selProv&&sel.size)){sel.clear();selProv=-1}else{if(!shift)sel.clear();selProv=p;for(const d of mine(p))sel.add(d.id)}
  refresh()}
function moveTo(p){const ids=[...sel],n=G.order(S,ids,p);if(n)toast(n+(n===1?' division':' divisions')+' ordered to '+P[p].name+'.');else toast(G.canEnter(S,S.player,p)?'No route to '+P[p].name+'.':P[p].name+' is neutral ground. Your troops cannot enter.');refresh()}

/* ---------- HUD ---------- */
function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=t;$('toasts').appendChild(el);setTimeout(()=>el.remove(),3200)}
function top(){const N=me(),mp=N._mp||G.manpower(S,S.player),war=G.inWar(S,S.player);
  $('top').innerHTML='<button class="who" data-act="panel:gov">'+'<span id="whoball"></span><b>'+esc(nm(S.player))+'</b></button><span class="date">'+G.date(S.day).str+'</span>'+
   '<span class="st" title="Political power">⭐ <b>'+Math.floor(N.pp)+'</b></span><span class="st'+(N.stab<30?' bad':'')+'" title="Stability">🏠 <b>'+pct(N.stab)+'</b></span><span class="st'+(war&&N.ws<25?' bad':'')+'" title="War support">📣 <b>'+pct(N.ws)+'</b></span>'+
   '<span class="st" title="Manpower available">👥 <b>'+fmt(mp.free)+'</b></span><span class="st" title="Civilian / military factories">🏭 <b>'+N.civ+' / '+N.mil+'</b></span>'+
   '<span class="tens" title="World tension">🔥 <span class="bar"><i style="width:'+S.tension+'%"></i></span></span>'+
   '<span class="speed">'+['❚❚','▶','▶▶','▶▶▶'].map((s,i)=>'<button data-act="speed:'+i+'" class="'+(speed===i?'on':'')+'">'+s+'</button>').join('')+'</span><button class="tb" data-act="panel:menu" title="Menu">☰</button>';
  $('whoball').appendChild(A.icon(fid(S.player),30,mood(S.player)))}
const RAIL=[['gov','🏛️','State'],['dip','🤝','Diplomacy'],['army','⚔️','Army'],['prod','🏭','Industry'],['res','🔬','Research'],['chron','📰','Chronicle']];
function side(){$('side').innerHTML=RAIL.map(r=>'<button data-act="panel:'+r[0]+'" class="'+(panel===r[0]?'on':'')+'">'+r[1]+'<small>'+r[2]+'</small></button>').join('')}
function bottom(){const n=S.chron.length,last=S.chron.slice(Math.max(0,n-2)).reverse();let h='<div class="chron"><b>The Chronicle</b>'+last.map(x=>'<p><i>'+G.date(x.day).str+'</i> '+esc(x.text)+'</p>').join('')+'</div>';
  if(sel.size){const ds=[...sel].map(id=>G.div(S,id)).filter(Boolean);h+='<div class="selbar"><b>'+ds.length+(ds.length===1?' division':' divisions')+' selected</b><span>Click a province to send them there.</span><span class="row"><button data-act="halt">Halt</button><button class="ghost" data-act="desel">Deselect</button></span></div>'}
  else h+='<div class="selbar dim"><span>Click a province to inspect it and select your divisions there. Drag to move the map, scroll to zoom.</span></div>';
  $('bottom').innerHTML=h}
function bar(v,cls){return'<span class="mbar '+(cls||'')+'"><i style="width:'+Math.round(Math.max(0,Math.min(1,v))*100)+'%"></i></span>'}
function divStatus(d){if(d.ret)return'Retreating to '+P[d.path?d.path[0]:d.p].name;if(d.b!=null)return'Attacking '+P[d.b].name;if(S.battles[d.p])return'Defending';if(d.path)return'Marching to '+P[d.path[d.path.length-1]].name;if(d.oos>3)return'Cut off from supply';return d.dig>.05?'Dug in '+Math.round(d.dig*100)+'%':'Idle'}
function info(){const el=$('info');if(selProv<0){el.hidden=true;return}el.hidden=false;const p=P[selProv],pr=S.prov[selProv],T=D.TERRAIN[p.terr],own=pr.ctrl===S.player;
  let h='<button class="x" data-act="desel" aria-label="Close">✕</button><h3>'+esc(p.name)+'</h3><p class="sub">'+esc(nm(pr.owner))+(pr.ctrl!==pr.owner?' · occupied by '+esc(nm(pr.ctrl)):'')+'</p>'+
   '<p>'+T.n+(T.def!==1?' (defence ×'+T.def+')':'')+(pr.fort?' · Fort '+pr.fort:'')+(p.port?' · Port':'')+'<br>Industry '+p.ind+' · Victory points '+p.vp+(pr.rail?' · Rail '+pr.rail:'')+'</p>';
  const B=S.battles[selProv];if(B){const at=B.att.length,df=S._at[selProv].filter(d=>!d.ret).length;h+='<p class="battle">💥 <b>Battle</b>, day '+(S.day-B.day0+1)+'. '+at+' attacking, '+df+' defending.<br>Losses: attackers '+fmt(B.ca)+', defenders '+fmt(B.cd)+'.</p>'}
  const by={};for(const d of S._at[selProv])(by[d.o]=by[d.o]||[]).push(d);
  if(visible(selProv))for(const t in by)if(t!==S.player)h+='<p><b>'+by[t].length+'</b> '+esc(G.adj(S,t))+(by[t].length===1?' division':' divisions')+(G.atWar(S,S.player,t)?' <span class="bad">(enemy)</span>':'')+'</p>';
  const ds=by[S.player]||[];if(ds.length){h+='<div class="dlist">'+ds.map(d=>'<label class="drow"><input type="checkbox" data-div="'+d.id+'"'+(sel.has(d.id)?' checked':'')+'><span><b>'+esc(d.name)+'</b><small>'+divStatus(d)+'</small></span><span class="bars">'+bar(d.str,'s')+bar(d.org,'o')+'</span></label>').join('')+'</div><p class="sub">Top bar strength, bottom bar organisation.</p>'}
  if(own)h+='<div class="row"><button data-act="build:fort:'+selProv+'">Build fort</button><button data-act="build:rail:'+selProv+'">Improve rail</button><button class="ghost" data-act="recruitHere">Recruit here</button></div>';
  el.innerHTML=h}

/* ---------- panels ---------- */
function tplLine(t){const parts=[];for(const b in t.bn)if(t.bn[b])parts.push(t.bn[b]+' '+D.BN[b].n.toLowerCase());return parts.join(', ')+((t.sup||[]).length?' + '+t.sup.map(s=>D.SUP[s].n.toLowerCase()).join(', '):'')}
function statRow(st){return'<span class="stats">Attack <b>'+st.att.toFixed(0)+'</b> · Defence <b>'+st.def.toFixed(0)+'</b> · Breakthrough <b>'+st.brk.toFixed(0)+'</b> · Org <b>'+st.org.toFixed(0)+'</b> · Width <b>'+st.w+'</b> · Speed <b>'+st.spd.toFixed(1)+'</b> · Men <b>'+fmt(st.mp)+'</b></span>'}
const PAN={
 gov(){const N=me(),mp=G.manpower(S,S.player),war=G.activeEnemies(S,S.player),f=N.faction&&S.factions[N.faction];
  let h='<h2>'+esc(nm(S.player))+'</h2><p class="sub">'+esc(D.NATIONS[S.player].head||'')+'</p>'+
   '<h3>The home front</h3><table class="kv"><tr><td>Stability</td><td>'+bar(N.stab/100)+' '+pct(N.stab)+'</td></tr><tr><td>War support</td><td>'+bar(N.ws/100)+' '+pct(N.ws)+'</td></tr>'+
   '<tr><td>Manpower</td><td>'+fmt(mp.free)+' free of '+fmt(mp.total)+'</td></tr><tr><td>Lost in war</td><td>'+fmt(N.lost)+'</td></tr></table>'+
   '<p class="sub">Stability falls in long wars, under blockade and when war support is low. Below 18% the government will be forced to ask for terms. War support falls with casualties and occupied land.</p>'+
   '<h3>Alliances and wars</h3><p>'+(f?'Member of the <b>'+esc(f.name)+'</b> with '+G.members(S,N.faction).filter(t=>t!==S.player).map(t=>esc(nm(t))).join(', ')+'.':'No alliance.')+'</p><p>'+(war.length?'At war with '+war.map(t=>esc(nm(t))).join(', ')+'.':'At peace.')+'</p>';
  h+='<h3>Conscription</h3><div class="laws">'+D.CONS.map((L,i)=>'<button data-act="law:cons:'+i+'" class="'+(N.cons===i?'on':'')+'"'+(L.war&&!war.length?' disabled':'')+'>'+L.n+'<small>'+(L.pct*100).toFixed(1)+'% of the population'+(L.war?' · wartime only':'')+'</small></button>').join('')+'</div>';
  h+='<h3>Economy</h3><div class="laws">'+D.ECON.map((L,i)=>'<button data-act="law:econ:'+i+'" class="'+(N.econ===i?'on':'')+'"'+(L.war&&!war.length?' disabled':'')+'>'+L.n+'<small>Output ×'+L.out+' · '+Math.round(L.goods*100)+'% of civilian factories on consumer goods'+(L.war?' · wartime only':'')+'</small></button>').join('')+'</div><p class="sub">Changing a law costs '+D.LAW_COST+' political power.</p>';
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
  const cl=(D.CLAIMS[t]||[]).filter(k=>S.prov[G.KEY[k]].owner!==t).map(k=>P[G.KEY[k]].name);if(cl.length)h+='<p class="sub">Claims: '+cl.join(', ')+'.</p>';
  h+='<div class="acts">';
  if(war)h+='<button data-act="do:peace:'+t+'">Offer peace<small>30 ⭐ · They accept only if their will is breaking</small></button>';
  else{h+='<button data-act="do:improve:'+t+'">Improve relations<small>25 ⭐ · Their opinion +12</small></button>';
   if(!ally){h+='<button data-act="do:alliance:'+t+'">Propose an alliance<small>50 ⭐ · Needs good opinion, or fair opinion and a tense world</small></button>';
    if(!S.guar.some(g=>g[0]===p&&g[1]===t))h+='<button data-act="do:guarantee:'+t+'">Guarantee independence<small>40 ⭐ · You will be called on if they are attacked</small></button>';
    if(cb===undefined)h+='<button data-act="do:justify:'+t+'">Prepare a case for war<small>'+((D.CLAIMS[p]||[]).some(k=>S.prov[G.KEY[k]].owner===t)?35:60)+' ⭐ · Ready in 45 days · Raises tension</small></button>';
    else if(cb>S.day)h+='<button disabled>Case for war ready in '+(cb-S.day)+' days</button>';
    h+='<button class="danger" data-act="do:declare:'+t+'">Declare war<small>'+(cb!==undefined&&cb<=S.day?'You have a case for war':'Without a case: stability −8, every nation thinks less of you')+'</small></button>'}}
  if(ally&&me().faction)h+='<button class="ghost" data-act="do:leave:'+t+'">Leave the alliance<small>Stability −6</small></button>';
  return h+'</div>'},
 army(){if(edit)return PAN.design();const N=me(),mine=S.divs.filter(d=>d.o===S.player),mp=G.manpower(S,S.player);let str=0;for(const d of mine)str+=d.str;
  let h='<h2>The Army</h2><p>'+mine.length+' divisions at '+pct(mine.length?str/mine.length*100:0)+' average strength. '+fmt(mp.free)+' men available.</p><h3>Division designs</h3>';
  N.tpls.forEach((t,i)=>{const st=G.tplStats(S,S.player,t),n=mine.filter(d=>d.t===i).length;h+='<div class="tpl"><b>'+esc(t.name)+'</b> <small>'+n+' in the field</small><p>'+tplLine(t)+'</p>'+statRow(st)+'<div class="row"><button data-act="recruit:'+i+'">Recruit<small>'+fmt(st.mp)+' men · 60 days</small></button><button class="ghost" data-act="design:'+i+'">Edit design</button></div></div>'});
  if(N.tpls.length<8)h+='<button class="ghost" data-act="design:'+N.tpls.length+'">New design</button>';
  h+='<p class="sub">New divisions muster at '+(recP>=0&&S.prov[recP].ctrl===S.player?P[recP].name:N.cap>=0?P[N.cap].name:'the capital')+'. Select one of your provinces and press "Recruit here" to change that.</p>';
  h+='<h3>In training</h3>'+(N.recruit.length?N.recruit.map((r,i)=>'<div class="q"><span>'+esc(N.tpls[r.t].name)+' → '+P[r.p>=0?r.p:N.cap].name+'</span><span>'+(r.left>0?r.left+' days':'waiting for equipment')+'</span><button class="ghost" data-act="cancelRecruit:'+i+'">✕</button></div>').join(''):'<p class="sub">Nothing in training.</p>');
  return h},
 design(){const t=edit.tpl,st=G.tplStats(S,S.player,t),N=me();let h='<button class="link" data-act="design:x">‹ Back</button><h2>Division design</h2><input id="tplname" class="txt" maxlength="28" value="'+esc(t.name).replace(/"/g,'&quot;')+'">'+
   '<h3>Line battalions</h3>'+Object.keys(D.BN).map(b=>{const B=D.BN[b],ok=G.canBn(S,S.player,b);return'<div class="q'+(ok?'':' off')+'"><span><b>'+B.n+'</b><small>Atk '+B.att+' · Def '+B.def+' · Brk '+B.brk+' · Width '+B.w+(ok?'':' · needs research')+'</small></span><span class="step"><button data-act="bn:'+b+':-1"'+(ok?'':' disabled')+'>−</button><b>'+(t.bn[b]||0)+'</b><button data-act="bn:'+b+':1"'+(ok?'':' disabled')+'>+</button></span></div>'}).join('')+
   '<h3>Support companies</h3>'+Object.keys(D.SUP).map(s=>{const X=D.SUP[s],on=(t.sup||[]).includes(s);return'<label class="q"><span><b>'+X.n+'</b><small>'+(X.def?'Defence +'+X.def+' ':'')+(X.dig?'Entrenchment +'+X.dig*100+'% ':'')+(X.spd?'Speed +10% ':'')+(X.heal?'Fewer permanent losses':'')+'</small></span><input type="checkbox" data-sup="'+s+'"'+(on?' checked':'')+'></label>'}).join('')+
   '<h3>On paper</h3>'+statRow(st)+'<p class="sub">Equipment: '+Object.keys(st.eq).filter(e=>st.eq[e]).map(e=>Math.round(st.eq[e])+' '+D.EQUIP[e].n.toLowerCase()).join(', ')+'. A battle line is 80 wide, plus 40 for each extra direction of attack. Breakthrough protects troops while they attack; without it, attackers bleed.</p>'+
   '<div class="row"><button data-act="saveTpl">Save design</button></div><p class="sub">Existing divisions of this design change with it and will need the new equipment.</p>';return h},
 prod(){const N=me(),E=D.ECON[N.econ],used=N.lines.reduce((s,l)=>s+l.f,0),need={};
  for(const d of S.divs)if(d.o===S.player){const st=G.stats(S,d);for(const e in st.eq)need[e]=(need[e]||0)+st.eq[e]*(1-d.str)}for(const r of N.recruit){const st=G.tplStats(S,S.player,N.tpls[r.t]);for(const e in st.eq)need[e]=(need[e]||0)+st.eq[e]}
  let h='<h2>Industry</h2><h3>Military factories <small>'+used+' of '+N.mil+' assigned</small></h3>';
  for(const e in D.EQUIP){const X=D.EQUIP[e];if(X.tech&&!N.tech.includes(X.tech))continue;const l=N.lines.find(x=>x.eq===e),f=l?l.f:0,out=f*X.per*E.out*(1+(N.mod.prod||0));
   h+='<div class="q"><span><b>'+X.n+'</b><small>In store '+fmt(Math.max(0,N.stock[e]))+' · needed '+fmt(need[e]||0)+' · +'+(out>=10?Math.round(out):out.toFixed(1))+' a day</small></span><span class="step"><button data-act="line:'+e+':-1">−</button><b>'+f+'</b><button data-act="line:'+e+':1">+</button></span></div>'}
  const free=N.civ*(1-E.goods);h+='<h3>Civilian factories <small>'+N.civ+', of which '+free.toFixed(0)+' free to build</small></h3><div class="row"><button data-act="build:civ">Civilian factory</button><button data-act="build:mil">Military factory</button></div><p class="sub">Forts and railways are ordered from a province. The first projects in the queue get up to 15 factories each.</p>';
  h+=N.build.length?N.build.map((b,i)=>'<div class="q"><span>'+D.BUILD[b.k].n+(b.p>=0?' · '+P[b.p].name:'')+'</span><span>'+bar(b.prog/D.BUILD[b.k].cost)+'</span><button class="ghost" data-act="cancelBuild:'+i+'">✕</button></div>').join(''):'<p class="sub">Nothing under construction.</p>';
  if(G.blockaded(S,S.player))h+='<p class="bad">The enemy fleet is blockading our ports. Output is down and stability is draining.</p>';return h},
 res(){const N=me(),slots=D.NATIONS[S.player].slots,yr=G.date(S.day).y;let h='<h2>Research</h2><h3>Teams <small>'+N.research.length+' of '+slots+' busy</small></h3>';
  h+=N.research.length?N.research.map(r=>{const T=D.TECH.find(x=>x.id===r.id);return'<div class="q"><span><b>'+T.name+'</b><small>'+T.desc+'</small></span>'+bar(r.prog)+'</div>'}).join(''):'<p class="sub">No research under way.</p>';
  const av=G.techAvail(S,S.player);for(const tr of['Infantry','Artillery','Industry','Machines']){const list=av.filter(T=>T.track===tr);if(!list.length)continue;h+='<h3>'+tr+'</h3>'+list.map(T=>'<button class="tech" data-act="research:'+T.id+'"'+(N.research.length>=slots?' disabled':'')+'><b>'+T.name+'</b> <i>'+T.year+(T.year>yr?' · ahead of its time, slower':'')+'</i><small>'+T.desc+'</small></button>').join('')}
  h+='<h3>Known</h3><p class="sub">'+(N.tech.map(id=>D.TECH.find(x=>x.id===id).name).join(', ')||'Nothing yet.')+'</p>';return h},
 chron(){const ks=[['all','All'],['war','War'],['dip','Diplomacy'],['story','Events'],['home','Home']];const list=S.chron.filter(x=>chronK==='all'||x.k===chronK).slice(-150).reverse();
  return'<h2>The Chronicle</h2><p class="sub">Fate seed '+S.seed+'. The same seed and the same decisions give the same history.</p><div class="seg">'+ks.map(k=>'<button data-act="chronK:'+k[0]+'" class="'+(chronK===k[0]?'on':'')+'">'+k[1]+'</button>').join('')+'</div><div class="news">'+list.map(x=>'<p><i>'+G.date(x.day).str+'</i>'+esc(x.text)+'</p>').join('')+'</div>'},
 menu(){return'<h2>Powder Keg</h2><p class="sub">The game saves itself on the first of every month in this browser.</p><div class="acts"><button data-act="save">Save now</button><button class="danger" data-act="quit">Quit to the main menu<small>Your save is kept</small></button></div>'+
  '<h3>Controls</h3><p class="sub">Click a province to select your divisions there, then click where they should go. Right-click also gives a move order. Shift-click adds another stack. Space pauses, 1 to 3 set the speed, Escape clears the selection.</p>'}
};
function op(v){return'<b class="'+(v<=-30?'bad':v>=30?'yes':'')+'">'+(v>0?'+':'')+v+'</b>'}
function showPanel(){const el=$('panel');if(!panel){el.hidden=true;return}el.hidden=false;const body=$('panel-body'),sc=body.scrollTop;body.innerHTML=PAN[panel]();body.scrollTop=sc;
  body.querySelectorAll('[data-ball]').forEach(e=>{const t=e.dataset.ball;e.appendChild(A.icon(fid(t),e.classList.contains('big')?56:30,mood(t)))})}
function modal(){const el=$('modal');if(!S||!S.pending.length){el.hidden=true;return}const pe=S.pending[0],E=PK.EVENTS[pe.id],txt=typeof E.text==='function'?E.text(S,pe.tag,pe.data):E.text,opts=E.opts(S,pe.tag,pe.data);
  el.hidden=false;el.innerHTML='<div class="card"><div class="ic">'+E.pic+'</div><p class="eyebrow">'+(E.fate?'Fate':'Telegram')+' · '+G.date(S.day).str+'</p><h2>'+esc(E.title)+'</h2><p>'+esc(txt)+'</p><div class="choices">'+opts.map((o,i)=>'<button data-act="opt:'+i+'">'+esc(o.label)+(o.tip?'<small>'+esc(o.tip)+'</small>':'')+'</button>').join('')+'</div></div>'}
function refresh(){if(!S)return;top();side();bottom();info();showPanel();modal();dirty=true}

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
   case'opt':G.resolve(S,0,+x);refresh();break;
   case'law':say(G.cmd.law(S,p,x,+y));break;
   case'dip':dipTag=x||null;panel='dip';refresh();break;
   case'do':{const e=G.cmd[x](S,p,y);if(!e&&x==='improve')toast('Our envoys are well received.');if(!e&&x==='alliance')toast(nm(y)+' accepts.');say(e);break}
   case'recruit':say(G.cmd.recruit(S,p,+x,recP>=0&&S.prov[recP].ctrl===p?recP:undefined)||'');break;
   case'recruitHere':recP=selProv;panel='army';edit=null;refresh();break;
   case'cancelRecruit':G.cmd.cancelRecruit(S,p,+x);refresh();break;
   case'design':if(x==='x')edit=null;else{const N=me(),i=+x;edit={i,tpl:JSON.parse(JSON.stringify(N.tpls[i]||{name:'New Division',bn:{inf:6},sup:[]}))}}refresh();break;
   case'bn':keepName();edit.tpl.bn[x]=Math.max(0,(edit.tpl.bn[x]||0)+(+y));refresh();break;
   case'saveTpl':{keepName();const e=G.cmd.template(S,p,edit.i,edit.tpl);if(!e){edit=null;toast('Design saved.')}say(e);break}
   case'line':G.cmd.line(S,p,x,+y);refresh();break;
   case'build':say(G.cmd.build(S,p,x,y===undefined?undefined:+y)||'');break;
   case'cancelBuild':G.cmd.cancelBuild(S,p,+x);refresh();break;
   case'research':say(G.cmd.research(S,p,x));break;
   case'chronK':chronK=x;refresh();break;
   case'save':toast(saveGame()?'Saved.':'This browser would not store the save.');break;
   case'quit':saveGame();S=null;speed=0;panel=null;sel.clear();selProv=-1;$('hud').hidden=true;$('modal').hidden=true;menu();dirty=true;break;
   case'seed':{const el=$('seed');if(el)el.value=1000+Math.floor(Math.random()*9000);break}
  }}
function keepName(){const el=$('tplname');if(el&&edit)edit.tpl.name=el.value.trim()||'Division'}

/* ---------- saving ---------- */
function saveGame(){if(!S)return false;try{localStorage.setItem(SAVE_KEY,G.save(S));return true}catch(e){return false}}
function savedInfo(){try{const s=localStorage.getItem(SAVE_KEY);if(!s)return null;const o=JSON.parse(s);if(o.v!==D.VERSION||!o.nat[o.player])return null;return{player:o.player,day:o.day}}catch(e){return null}}
function loadGame(){try{const o=G.load(localStorage.getItem(SAVE_KEY));if(o)begin(o);else toast('That save could not be read.')}catch(e){toast('That save could not be read.')}}

/* ---------- menu ---------- */
const BLURB={GER:'The strongest army in Europe, with enemies on both sides.',AUS:'Eleven nations under one crown, and a score to settle with Serbia.',RUS:'Endless manpower, thin industry, and a throne less secure than it looks.',FRA:'Forty-three years of waiting for Alsace-Lorraine.',
 ENG:'The greatest fleet in the world and a very small army.',ITA:'Allied to its rival and courted by everyone.',OTT:'An old empire deciding which friend will cost it least.'};
function menu(){const m=$('menu');m.hidden=false;const sv=savedInfo(),majors=G.TAGS.filter(t=>D.NATIONS[t].major),minors=G.TAGS.filter(t=>!D.NATIONS[t].major&&t!=='LUX'&&t!=='PER');
  m.innerHTML='<div class="menu-in"><p class="eyebrow">Europe, 28 June 1914</p><h1>Powder Keg</h1><p class="lede">The Archduke is dead in Sarajevo. In five weeks the continent may be at war, or it may not. Choose a nation and decide.</p>'+
   (sv?'<button class="big" data-act="continue">Continue as '+esc(D.NATIONS[sv.player].name)+'<small>'+G.date(sv.day).str+'</small></button>':'')+
   '<h3>The great powers</h3><div class="mlist">'+majors.map(t=>'<button class="mcard" data-act="new:'+t+'"><span class="ic" data-ball="'+t+'"></span><span class="mbody"><b>'+D.NATIONS[t].name+'</b><span>'+BLURB[t]+'</span></span></button>').join('')+'</div>'+
   '<h3>The smaller states</h3><div class="minors">'+minors.map(t=>'<button data-act="new:'+t+'"><span class="ic" data-ball="'+t+'"></span>'+D.NATIONS[t].name+'</button>').join('')+'</div>'+
   '<label class="seedrow" for="seed">Fate seed <input id="seed" class="txt" inputmode="numeric" maxlength="9" value="'+(1000+Math.floor(Math.random()*9000))+'"><button class="ghost" data-act="seed">Shuffle</button></label>'+
   '<p class="fine">The seed shuffles the Fate cards and the choices other nations make. Play the same seed with the same decisions and history repeats itself. Change one decision and it will not.</p></div>';
  m.querySelectorAll('[data-ball]').forEach(e=>e.appendChild(A.icon(e.dataset.ball,e.parentNode.classList.contains('mcard')?48:26,'neutral')))}
function startGame(tag){const el=$('seed'),seed=Math.abs(parseInt(el&&el.value,10))||1914;begin(G.newGame(tag,seed))}
function begin(state){S=state;$('menu').hidden=true;$('hud').hidden=false;speed=0;panel=null;sel.clear();selProv=-1;dipTag=null;edit=null;recP=-1;resize();const cap=me().cap;centreOn(cap>=0?cap:0,Math.max(minZ(),Math.min(1.5,vw/900)));refresh();
  if(S.day===D.START_DAY)toast('The game is paused. Press ▶ when you are ready.')}

/* ---------- main loop ---------- */
function frame(t){const dt=Math.min(250,t-last);last=t;
  if(S&&speed>0&&!S.pending.length){acc+=dt;let n=0;while(acc>=SPEED[speed]&&n<6){acc-=SPEED[speed];n++;if(!G.tick(S))break;if(G.date(S.day).d===1)saveGame();if(S.pending.length)break}
    if(n){for(const id of[...sel])if(!G.div(S,id))sel.delete(id);refresh()}}else acc=0;
  if(dirty)draw();requestAnimationFrame(frame)}
function init(){cv=$('cv');cx=cv.getContext('2d');
  document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled){e.preventDefault();act(b.dataset.act)}});
  document.addEventListener('change',e=>{const t=e.target;if(t.dataset.div){const id=+t.dataset.div;if(t.checked)sel.add(id);else sel.delete(id);bottom();dirty=true}
    if(t.dataset.sup&&edit){keepName();const s=t.dataset.sup,a=edit.tpl.sup=edit.tpl.sup||[];if(t.checked){if(!a.includes(s))a.push(s)}else edit.tpl.sup=a.filter(x=>x!==s);refresh()}});
  cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMove);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);drag=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.offsetX,e.offsetY,Math.exp(-e.deltaY*.0015))},{passive:false});cv.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{if(!S||e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();speed=speed?0:1;refresh()}else if(e.key>='1'&&e.key<='3'){speed=+e.key;refresh()}else if(e.key==='Escape'){if(panel){panel=null;edit=null}else{sel.clear();selProv=-1}refresh()}});
  window.addEventListener('resize',resize);resize();menu();requestAnimationFrame(frame);
  const hot=window.claude&&window.claude.hot;if(hot&&hot.snapshot)hot.snapshot(()=>(S?{save:G.save(S)}:{}));
  if(hot&&hot.data&&hot.data.save){try{const o=G.load(hot.data.save);if(o)begin(o)}catch(e){}}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{dirty=true})}
PK.UI={init,state:()=>S,act,centreOn,click:(key,right)=>click(G.KEY[key]===undefined?-1:G.KEY[key],right),setSpeed:v=>{speed=v}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(globalThis.PK=globalThis.PK||{});
