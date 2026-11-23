/* Powder Keg — simulation. Pure functions over a JSON-serialisable state S. No DOM. */
(function(PK){
const D=PK.DATA,M=PK.MAP,G=PK.SIM={};
const KEY=G.KEY={};M.provs.forEach(p=>KEY[p.key]=p.id);
const NB=G.NB=M.provs.map((p,i)=>M.adj[i].map(j=>({j,sea:false})));
M.sea.forEach(([a,b])=>{if(!M.adj[a].includes(b)){NB[a].push({j:b,sea:true});NB[b].push({j:a,sea:true})}});
const TAGS=G.TAGS=Object.keys(D.NATIONS);
/* which sea each province looks out on */
const ZONE=G.ZONE=M.provs.map(p=>{const lon=p.x/M.proj.kx+M.proj.lon0,lat=M.proj.lat1-p.y/M.proj.ky;
  if(lon>27.8&&lon<42.5&&lat>40.6&&lat<47.6)return'black';if(lat>53.5&&lon<31&&(lon>=12.6||(lon>=9.5&&lat<55.3)))return'balt';if((lat>=51&&lon>=-2)||(lat>=55&&lon>=-4.6))return'north';
  if(lon<-5.5||(lat>43.2&&lon<3.2))return'atl';if(lon<15.6&&lat<44.6)return'wmed';return'emed'});
const SEAS=Object.keys(D.SEAS);M.provs.forEach(p=>{p.name0=p.name});
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
/* Belgrade sits on the frontier; Serbia did not fall with it */
{const vp={belgrade:5,nis:4,skopje:3};for(const k in vp)if(KEY[k]!==undefined)M.provs[KEY[k]].vp=vp[k]}

/* ---------- basics ---------- */
G.rnd=function(S){let t=S.rng=(S.rng+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
G.pick=function(S,arr,wf){let tot=0;const w=arr.map(x=>{const v=Math.max(0,wf?wf(x):1);tot+=v;return v});if(tot<=0)return arr[0];let r=G.rnd(S)*tot;for(let i=0;i<arr.length;i++){r-=w[i];if(r<=0)return arr[i]}return arr[arr.length-1]};
G.date=function(day){const d=new Date(D.EPOCH+day*864e5);return{y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),str:d.getUTCDate()+' '+D.MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear()}};
G.dayOf=(y,m,d)=>Math.round((Date.UTC(y,m-1,d)-D.EPOCH)/864e5);
G.name=(S,tag)=>S.nat[tag].name||D.NATIONS[tag].name;
G.the=function(S,tag){const n=G.name(S,tag);return /Empire|Kingdom|Republic|Union|Netherlands|Reich|States|Federation|Commonwealth|Monarchy/.test(n)?'the '+n:n};
G.adj=(S,tag)=>D.NATIONS[tag].adj;
const wk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
G.atWar=(S,a,b)=>a!==b&&!!S.wars[wk(a,b)];
G.friendly=function(S,a,b){if(a===b)return true;const f=S.nat[a].faction;return !!f&&f===S.nat[b].faction};
G.alive=(S,tag)=>{const N=S.nat[tag];return !N.dead&&!N.capit};
G.enemies=(S,tag)=>TAGS.filter(t=>t!==tag&&S.wars[wk(tag,t)]&&!S.nat[t].dead);
G.activeEnemies=(S,tag)=>G.enemies(S,tag).filter(t=>!S.nat[t].capit);
G.inWar=(S,tag)=>G.activeEnemies(S,tag).length>0;
G.op=function(S,a,b,d){if(a===b||!S.rel[a])return;S.rel[a][b]=clamp((S.rel[a][b]||0)+d,-100,100);S.rel[b][a]=clamp((S.rel[b][a]||0)+d*.6,-100,100)};
G.opinion=(S,a,b)=>a===b?100:Math.round((S.rel[a]&&S.rel[a][b])||0);
G.flag=(S,f)=>{if(S.flags[f]===undefined)S.flags[f]=S.day};
G.has=(S,f,days)=>S.flags[f]!==undefined&&S.day-S.flags[f]>=(days||0);
G.news=function(S,text,k){text=text.charAt(0).toUpperCase()+text.slice(1);S.chron.push({day:S.day,text,k:k||'story'});if(S.chron.length>500)S.chron.shift()};
G.say=function(S,tag,text){S.says=S.says.filter(x=>x.tag!==tag);S.says.push({tag,text,until:S.day+12})};
G.tension=(S,d)=>{S.tension=clamp(S.tension+d,0,100)};
G.members=(S,f)=>f&&S.factions[f]?S.factions[f].members.filter(t=>!S.nat[t].dead):[];
G.sideOf=(S,tag)=>{const f=S.nat[tag].faction;return f?G.members(S,f):[tag]};

/* ---------- division statistics ---------- */
G.tplStats=function(S,tag,tpl){const N=S.nat[tag],m=N.mod,st={att:0,def:0,brk:0,org:0,hp:0,w:0,mp:0,spd:99,eq:{},n:0};let orgN=0;
  for(const b in tpl.bn){const c=tpl.bn[b];if(!c)continue;const B=D.BN[b],foot=b==='inf'||b==='cav',gun=b==='art'||b==='hart';
    st.att+=c*B.att*(1+(foot?m.infAtt||0:gun?m.artAtt||0:0));st.def+=c*B.def*(1+(foot?m.infDef||0:0));st.brk+=c*B.brk*(1+(b==='inf'?m.infBrk||0:0));
    st.org+=c*B.org;orgN+=c;st.hp+=c*B.hp;st.w+=c*B.w;st.mp+=c*B.mp;st.spd=Math.min(st.spd,B.spd);st.n+=c;for(const e in B.eq)st.eq[e]=(st.eq[e]||0)+c*B.eq[e]}
  st.dig=0;st.heal=0;let sp=1;
  for(const s of tpl.sup||[]){const X=D.SUP[s];st.att+=X.att||0;st.def+=X.def||0;st.brk+=X.brk||0;st.mp+=X.mp;st.dig+=X.dig||0;st.heal+=X.heal||0;sp+=X.spd||0;for(const e in X.eq)st.eq[e]=(st.eq[e]||0)+X.eq[e]}
  st.org=orgN?st.org/orgN:1;st.spd=(st.spd===99?4:st.spd)*sp*(1+(m.move||0));return st};
G.stats=function(S,d){const N=S.nat[d.o];N._st=N._st||[];return N._st[d.t]||(N._st[d.t]=G.tplStats(S,d.o,N.tpls[d.t]))};
G.touch=(S,tag)=>{S.nat[tag]._st=null};
G.power=function(S,d){const st=G.stats(S,d);return(st.att+st.def)*d.str*(.4+.6*d.org)};

/* ---------- new game ---------- */
G.applyScen=function(S){const SC=D.SCEN[S.scen||'1914'];for(const t of TAGS)D.NATIONS[t]=Object.assign({},D.BASE_NATIONS[t],(SC.nations||{})[t],(S.natOv||{})[t]);
  M.provs.forEach(p=>{p.name=(S.names&&S.names[p.key])||(SC.names||{})[p.key]||p.name0});D.CLAIMS=SC.claims||{}};
G.claims=function(S,tag){return(D.CLAIMS[tag]||[]).concat(S.nat[tag].claims||[])};
G.rename=function(S,tag,o){S.natOv=S.natOv||{};S.natOv[tag]=Object.assign(S.natOv[tag]||{},o);delete S.nat[tag].name;G.applyScen(S)};
/* a plausible army for a nation that has no written order of battle */
G.autoOOB=function(S,tag,scale){const N=S.nat[tag];if(N.cap<0)return;let vp=0,ind=0;const own=[];for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===tag){vp+=M.provs[i].vp;ind+=M.provs[i].ind;own.push(i)}
  const n=Math.max(2,Math.min(90,Math.round((vp*.22+ind*.5+own.length*.25)*(scale||1))));own.sort((a,b)=>M.provs[b].vp-M.provs[a].vp);const spots=own.slice(0,Math.max(1,Math.ceil(n/4)));
  for(let k=0;k<n;k++)G.spawn(S,tag,spots[k%spots.length],0,1,D.NATIONS[tag].xp)};
G.newGame=function(player,seed,scen,opt){
  const SC=Object.assign({},D.SCEN[scen||'1914'],opt||{});
  const S={v:D.VERSION,scen:SC.id,seed,rng:seed|0,day:SC.start,day0:SC.start,end:SC.end,player,flags:{},fired:{},pending:[],chron:[],says:[],tension:SC.tension===undefined?30:SC.tension,wars:{},factions:{},guar:(SC.guarantees||[]).map(g=>g.slice()),
    rel:{},nat:{},prov:[],divs:[],battles:{},nextId:1,cb:{},cool:{},grudge:{},treaties:[],sched:[],own0:[],natOv:SC.natOv?JSON.parse(JSON.stringify(SC.natOv)):{},names:SC.provNames||null};
  G.applyScen(S);
  for(const f in SC.factions||{})S.factions[f]={name:SC.factions[f].name,members:SC.factions[f].members.slice()};
  M.provs.forEach(p=>{const o=(SC.owners&&SC.owners[p.key])||p.owner;S.prov.push({owner:o,ctrl:o,fort:0,rail:0});S.own0.push(o)});
  for(const k in SC.forts||{})if(KEY[k]!==undefined)S.prov[KEY[k]].fort=SC.forts[k];
  const techOf=tag=>((SC.tech&&SC.tech.all)||[]).concat((SC.tech&&SC.tech[tag])||[]).filter((x,i,a)=>a.indexOf(x)===i);
  for(const tag of TAGS){const C=D.NATIONS[tag];S.rel[tag]={};let cap=SC.caps&&SC.caps[tag]!==undefined?KEY[SC.caps[tag]]:M.provs.findIndex((p,i)=>S.prov[i].owner===tag&&p.cap);
    if(cap===undefined||cap<0||S.prov[cap].owner!==tag){cap=-1;let bv=-1;for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===tag&&M.provs[i].vp>bv){bv=M.provs[i].vp;cap=i}}
    const N=S.nat[tag]={tag,faction:null,pp:tag===player?60:30,stab:C.stab,ws:C.ws,cons:C.cons,econ:C.econ,stock:{rifles:900,mgs:20,guns:30,hguns:6,acars:0,tanks:0},lines:[],build:[],recruit:[],
      tpls:[],tech:techOf(tag),research:[],mod:{},capit:false,dead:cap<0,cap,builtCiv:0,builtMil:0,civ:0,mil:0,
      lost:0,lostPrev:0,kills:0,vp0:0,divs0:0,navy:C.navy,auto:tag!==player,mgr:tag===player?{plans:true,industry:true,research:true,sea:true,armies:false}:null,claims:((SC.dynClaims||{})[tag]||[]).slice(),armies:[],plans:[],plan:null};
    for(const e in D.EQUIP)if(N.stock[e]===undefined)N.stock[e]=0;
    if(SC.start>D.DAY(1930,1,1))for(const id of['fighter','bomber'])if(!N.tech.includes(id))N.tech.push(id);
    for(const id of N.tech){const T=D.TECH.find(x=>x.id===id);if(T)for(const k in T.fx)N.mod[k]=(N.mod[k]||0)+T.fx[k]}
    const o=(SC.oob&&SC.oob[tag])||['small'],T0=(SC.tpl&&SC.tpl[o[0]])||D.TPL[o[0]]||D.TPL.small,T1=(SC.tpl&&SC.tpl[o.cav||'cav'])||D.TPL.cav;N.tpls=[JSON.parse(JSON.stringify(T0)),JSON.parse(JSON.stringify(T1))];
    for(const extra of(SC.extraTpl&&SC.extraTpl[tag])||[])N.tpls.push(JSON.parse(JSON.stringify((SC.tpl&&SC.tpl[extra])||D.TPL[extra])));
    if(N.dead)continue;
    if(SC.oob&&SC.oob[tag]){for(let i=1;i<o.length;i++){const[k,ni,nc,nx]=o[i],p=KEY[k];if(p===undefined||S.prov[p].owner!==tag)continue;G.spawn(S,tag,p,0,ni,C.xp);G.spawn(S,tag,p,1,nc||0,C.xp);if(nx&&N.tpls[2])G.spawn(S,tag,p,2,nx,C.xp)}}
    else G.autoOOB(S,tag,SC.armyScale);
    N.divs0=S.divs.filter(d=>d.o===tag).length}
  for(const f in S.factions){S.factions[f].members=S.factions[f].members.filter(t=>!S.nat[t].dead);for(const t of S.factions[f].members)S.nat[t].faction=f}
  for(const[a,b,v]of SC.opinion||[]){if(S.rel[a]&&S.rel[b]){S.rel[a][b]=v;S.rel[b][a]=v}}
  if(SC.rel)for(const a in SC.rel)for(const b in SC.rel[a])if(S.rel[a])S.rel[a][b]=SC.rel[a][b];
  if(SC.grudge)S.grudge=JSON.parse(JSON.stringify(SC.grudge));
  for(const tag of TAGS){if(S.nat[tag].dead)continue;G.factories(S,tag);G.aiEcon(S,tag,true);const N=S.nat[tag];N.vp0=M.provs.reduce((s,p,i)=>s+(S.prov[i].owner===tag?p.vp:0),0)}
  S.wings=[];for(const tag of TAGS){const N=S.nat[tag];if(N.dead)continue;G.syncNavy(S,tag);if(SC.start>D.DAY(1930,1,1)&&N.cap>=0){for(let k=0;k<Math.round(N.mil/7);k++)G.newWing(S,tag,'f',N.cap);for(let k=0;k<Math.round(N.mil/11);k++)G.newWing(S,tag,'b',N.cap)}}
  for(const w of S.wings)w.ready=S.day;
  G.index(S);G.supply(S);
  if(SC.intro)G.news(S,SC.intro,'story');
  return S};
const ORD=n=>n+(n%100>10&&n%100<14?'th':['th','st','nd','rd'][n%10]||'th');
G.spawn=function(S,tag,p,t,n,xp,name,str){const N=S.nat[tag];for(let i=0;i<n;i++){N.seq=(N.seq||0)+1;
  S.divs.push({id:S.nextId++,o:tag,t,name:name?name.replace('#',ORD(N.seq)):ORD(N.seq)+' '+N.tpls[t].name,p,org:1,str:str||1,xp:xp||.2,path:null,prog:0,dig:S.day===S.day0?.25:0,oos:0})}};

/* ---------- indices ---------- */
G.index=function(S){const at=S._at=M.provs.map(()=>[]);for(const d of S.divs)at[d.p].push(d);S._sea={};S._byId=null};
G.div=function(S,id){if(!S._byId){S._byId=new Map();for(const d of S.divs)S._byId.set(d.id,d)}return S._byId.get(id)};
G.seaOK=function(S,tag){if(S._sea[tag]!==undefined)return S._sea[tag];const en=G.activeEnemies(S,tag);let ok=true;
  if(en.length){const mine=G.sideOf(S,tag).filter(t=>G.alive(S,t)).reduce((s,t)=>s+S.nat[t].navy,0),theirs=en.reduce((s,t)=>s+S.nat[t].navy,0);ok=mine>=.6*theirs}
  return S._sea[tag]=ok};
G.blockaded=function(S,tag){const en=G.activeEnemies(S,tag);if(!en.length)return false;const P=G.ports(S,tag);if(!P.n)return false;let shut=0;for(const z in P.z){const f=G.seaForce(S,tag,z);if(f.theirs>=2&&f.theirs>f.mine*1.5)shut+=P.z[z]}return shut/P.n>=.6};
/* ---------- fleets ---------- */
G.ports=function(S,tag){const z={};let n=0;for(let i=0;i<M.provs.length;i++)if(M.provs[i].port&&S.prov[i].owner===tag&&S.prov[i].ctrl===tag){z[ZONE[i]]=(z[ZONE[i]]||0)+1;n++}return{z,n}};
G.homeSea=function(S,tag){const P=G.ports(S,tag);let b=null,bv=0;for(const k in P.z)if(P.z[k]>bv){bv=P.z[k];b=k}return b};
/* squadrons follow the fleet number: one squadron for every five points */
G.syncNavy=function(S,tag){const N=S.nat[tag];N.sq=N.sq||{};if(N.subs===undefined)N.subs=Math.round(N.navy/12);const want=Math.max(0,Math.floor(N.navy/5));let cur=0;for(const z of SEAS)cur+=N.sq[z]||0;if(cur===want)return;
  const P=G.ports(S,tag),home=G.homeSea(S,tag);if(!home){for(const z of SEAS)N.sq[z]=0;return}
  if(cur===0){let left=want;for(const z in P.z){const k=Math.floor(want*P.z[z]/P.n);N.sq[z]=k;left-=k}N.sq[home]=(N.sq[home]||0)+left;return}
  while(cur<want){N.sq[home]=(N.sq[home]||0)+1;cur++}while(cur>want){let b=null;for(const z of SEAS)if((N.sq[z]||0)>0&&(b===null||N.sq[z]>N.sq[b]))b=z;if(b===null)break;N.sq[b]--;cur--}S._sea={}};
G.seaForce=function(S,tag,z){if(S._sea['f'+tag+z])return S._sea['f'+tag+z];let mine=0,theirs=0;for(const t of G.sideOf(S,tag))if(G.alive(S,t))mine+=(S.nat[t].sq||{})[z]||0;for(const e of G.activeEnemies(S,tag))theirs+=(S.nat[e].sq||{})[z]||0;return S._sea['f'+tag+z]={mine,theirs}};
/* a crossing is closed if the enemy outguns us in either sea it touches */
G.linkOK=function(S,tag,a,b){if(!G.activeEnemies(S,tag).length)return true;for(const z of(ZONE[a]===ZONE[b]?[ZONE[a]]:[ZONE[a],ZONE[b]])){const f=G.seaForce(S,tag,z);if(f.theirs>0&&f.mine<.6*f.theirs)return false}return true};
G.moveSq=function(S,tag,from,to,n){const N=S.nat[tag];n=Math.min(n,(N.sq[from]||0));if(n<=0||from===to)return 0;N.sq[from]-=n;N.sq[to]=(N.sq[to]||0)+n;S._sea={};return n};
G.navalWar=function(S){for(const z of SEAS){const here=TAGS.filter(t=>G.alive(S,t)&&((S.nat[t].sq||{})[z]||0)>0);for(let i=0;i<here.length;i++)for(let j=i+1;j<here.length;j++){const a=here[i],b=here[j];if(!G.atWar(S,a,b))continue;const A=S.nat[a],B=S.nat[b],pa=A.sq[z],pb=B.sq[z];if(!pa||!pb)continue;
    /* a badly outnumbered fleet mostly stays in harbour */
    if(G.rnd(S)>(Math.min(pa,pb)/Math.max(pa,pb)<.6?.008:.035))continue;const la=Math.min(pa,Math.round(pb*(.08+G.rnd(S)*.22)*(pb>=pa?1:.6)+(G.rnd(S)<.35?1:0))),lb=Math.min(pb,Math.round(pa*(.08+G.rnd(S)*.22)*(pa>=pb?1:.6)+(G.rnd(S)<.35?1:0)));if(la+lb===0)continue;
    A.sq[z]-=la;A.navy=Math.max(0,A.navy-5*la);B.sq[z]-=lb;B.navy=Math.max(0,B.navy-5*lb);S._sea={};
    if(la+lb>=2)G.news(S,'Naval battle in the '+D.SEAS[z]+': '+G.the(S,a)+' loses '+la+(la===1?' squadron':' squadrons')+', '+G.the(S,b)+' '+lb+'.','war')}}};
G.subPenalty=function(S,tag){const en=G.activeEnemies(S,tag);if(!en.length)return 0;const P=G.ports(S,tag);if(!(P.z.atl||P.z.north))return 0;let subs=0;for(const e of en)subs+=S.nat[e].subs||0;return clamp((subs*1.5-G.seaForce(S,tag,'atl').mine-G.seaForce(S,tag,'north').mine)*.008,0,.2)};
G.aiNavy=function(S,tag){const N=S.nat[tag];if(!G.mgr(S,tag,'sea')||!N.sq)return;const P=G.ports(S,tag);if(!P.n)return;let total=0;for(const z of SEAS)total+=N.sq[z]||0;if(!total)return;const w={};let tw=0;
  for(const z in P.z){w[z]=P.z[z]*(1+G.seaForce(S,tag,z).theirs*.35);tw+=w[z]}let left=total;const home=G.homeSea(S,tag);for(const z of SEAS)N.sq[z]=0;for(const z in w){const k=Math.floor(total*w[z]/tw);N.sq[z]=k;left-=k}N.sq[home]+=left;S._sea={}};
/* ---------- air wings ---------- */
const AIR_RANGE=230;
G.airOver=function(S,tag,p){let f=0,b=0;const q=M.provs[p];for(const w of S.wings||[]){if(w.ready>S.day||!G.friendly(S,tag,w.o))continue;const o=M.provs[w.p];if(Math.hypot(o.cx-q.cx,o.cy-q.cy)>AIR_RANGE)continue;if(w.t==='f')f+=w.str;else b+=w.str}return{f,b}};
G.newWing=function(S,tag,t,p){S.wings=S.wings||[];S.wings.push({id:S.nextId++,o:tag,t,p,str:1,ready:S.day+3})};
G.airWar=function(S,side,foe,p,hot){/* wear on the wings that flew */const q=M.provs[p];for(let i=S.wings.length-1;i>=0;i--){const w=S.wings[i];if(w.ready>S.day)continue;const o=M.provs[w.p];if(Math.hypot(o.cx-q.cx,o.cy-q.cy)>AIR_RANGE)continue;
    let mine=null;if(G.friendly(S,side,w.o))mine=hot.a;else if(G.friendly(S,foe,w.o))mine=hot.d;if(!mine)continue;const them=mine===hot.a?hot.d:hot.a;w.str-=.004+(them.f>0?.012*Math.min(2,them.f/Math.max(.5,mine.f)):0)*(w.t==='b'?1.3:1);if(w.str<.2)S.wings.splice(i,1)}};
G.airUpkeep=function(S,tag){const N=S.nat[tag];for(const w of S.wings||[]){if(w.o!==tag||w.str>=1)continue;const e=D.WING[w.t].eq,need=Math.min(1-w.str,.03),cost=need*D.WING_SIZE;if(N.stock[e]>=cost){N.stock[e]-=cost;w.str+=need}}
  if(!G.mgr(S,tag,'sea'))return;for(const t of['f','b']){const e=D.WING[t].eq;let n=0;for(const w of S.wings||[])if(w.o===tag)n++;if(N.stock[e]>=D.WING_SIZE*1.5&&n<4+N.mil/3&&N.cap>=0&&S.prov[N.cap].ctrl===tag){N.stock[e]-=D.WING_SIZE;G.newWing(S,tag,t,N.cap)}}
  if((S.day+tag.charCodeAt(1))%6)return;/* send the wings where the fighting is */let best=-1,bv=0;for(let i=0;i<M.provs.length;i++){if(S.prov[i].ctrl!==tag)continue;let v=0;for(const nb of NB[i]){if(S.battles[nb.j])v+=3;if(G.atWar(S,tag,S.prov[nb.j].ctrl))v+=1+G.hostileAt(S,nb.j,tag).length*.2}if(S.battles[i])v+=3;if(v>bv){bv=v;best=i}}
  if(best>=0)for(const w of S.wings)if(w.o===tag&&w.p!==best&&(S.prov[w.p].ctrl!==tag||G.rnd(S)<.5)){w.p=best;w.ready=S.day+3}};
G.canEnter=function(S,tag,p){const c=S.prov[p].ctrl;return G.friendly(S,tag,c)||G.atWar(S,tag,c)};
G.hostileAt=function(S,p,tag){return S._at[p].filter(d=>!d.ret&&G.atWar(S,tag,d.o))};
G.factories=function(S,tag){const N=S.nat[tag];let base=0;for(let i=0;i<M.provs.length;i++){const P=S.prov[i];if(P.ctrl===tag)base+=M.provs[i].ind*(P.owner===tag?1:.3)}
  const r=D.NATIONS[tag].mil;N.mil=Math.max(0,Math.round(base*r)+N.builtMil);N.civ=Math.max(0,Math.round(base*(1-r))+N.builtCiv);return N};
G.manpower=function(S,tag){const N=S.nat[tag];let used=0;for(const d of S.divs)if(d.o===tag)used+=G.stats(S,d).mp*d.str;for(const r of N.recruit)used+=G.tplStats(S,tag,N.tpls[r.t]).mp;
  const total=D.NATIONS[tag].pop*1e6*D.CONS[N.cons].pct;return{total,used,free:Math.max(0,total-used-N.lost)}};

/* ---------- movement ---------- */
G.moveDays=function(S,d,a,b,sea){if(sea)return 5;const A=M.provs[a],B=M.provs[b],km=Math.hypot(A.cx-B.cx,A.cy-B.cy)*2.5,st=G.stats(S,d);
  let days=km/(st.spd*6)*D.TERRAIN[B.terr].move;if(G.friendly(S,d.o,S.prov[a].ctrl)&&G.friendly(S,d.o,S.prov[b].ctrl))days*=.4/(1+.15*S.prov[b].rail);else if(!G.friendly(S,d.o,S.prov[b].ctrl))days*=1.7;return Math.max(1,days)};
G.path=function(S,d,dest,from){const src=from===undefined?d.p:from;if(src===dest)return[];const dist=new Map([[src,0]]),prev=new Map(),open=[src],done=new Set(),sea=G.seaOK(S,d.o);
  while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(dist.get(open[i])<dist.get(open[bi]))bi=i;const u=open.splice(bi,1)[0];if(u===dest)break;if(done.has(u))continue;done.add(u);
    for(const nb of NB[u]){if(done.has(nb.j)||(nb.sea&&!G.linkOK(S,d.o,u,nb.j))||!G.canEnter(S,d.o,nb.j))continue;const c=dist.get(u)+G.moveDays(S,d,u,nb.j,nb.sea)+(G.atWar(S,d.o,S.prov[nb.j].ctrl)?6:0);
      if(c<(dist.has(nb.j)?dist.get(nb.j):1e9)){dist.set(nb.j,c);prev.set(nb.j,u);open.push(nb.j)}}}
  if(!prev.has(dest))return null;const out=[];for(let u=dest;u!==src;u=prev.get(u))out.unshift(u);return out};
G.order=function(S,ids,dest){let n=0;for(const id of ids){const d=G.div(S,id);if(!d||d.ret)continue;const p=G.path(S,d,dest);if(p&&p.length){G.leaveBattle(S,d);d.path=p;d.prog=0;n++}else if(p){d.path=null}}return n};
G.halt=function(S,ids){for(const id of ids){const d=G.div(S,id);if(d&&!d.ret){G.leaveBattle(S,d);d.path=null;d.prog=0}}};
G.leaveBattle=function(S,d){if(d.b!==undefined&&d.b!==null){const B=S.battles[d.b];if(B)B.att=B.att.filter(x=>x!==d.id);d.b=null}};
G.setCtrl=function(S,p,tag){const P=S.prov[p],old=P.ctrl;const to=(G.friendly(S,tag,P.owner)&&!S.nat[P.owner].capit)?P.owner:tag;if(to===old)return;P.ctrl=to;S._ctrlDirty=true;
  if(M.provs[p].vp>=8&&old!==to)G.news(S,M.provs[p].name+' falls to '+G.adj(S,tag)+' troops.','war');
  if(P.fort>0&&!G.friendly(S,to,old))P.fort=Math.max(0,P.fort-1)};
function isSea(a,b){for(const nb of NB[a])if(nb.j===b)return nb.sea;return false}
G.moveAll=function(S){for(const d of S.divs){if(!d.path||!d.path.length){d.path=null;continue}
  const nx=d.path[0],sea=isSea(d.p,nx);
  if(!d.ret&&(!G.canEnter(S,d.o,nx)||(sea&&!G.linkOK(S,d.o,d.p,nx)))){d.path=null;d.prog=0;G.leaveBattle(S,d);continue}
  const hostile=G.atWar(S,d.o,S.prov[nx].ctrl);
  if(!d.ret&&G.hostileAt(S,nx,d.o).length){if(d.org<.12){d.path=null;d.prog=0;G.leaveBattle(S,d);continue}
    let B=S.battles[nx];if(!B)B=S.battles[nx]={p:nx,att:[],day0:S.day,ca:0,cd:0,side:d.o};if(!B.att.includes(d.id))B.att.push(d.id);d.b=nx;d.dig=0;continue}
  if(d.b!=null)G.leaveBattle(S,d);
  d.dig=0;d.prog+=1;if(d.prog>=G.moveDays(S,d,d.p,nx,sea)){d.p=nx;d.path.shift();d.prog=0;if(hostile)G.setCtrl(S,nx,d.o);if(d.ret){d.ret=false;d.path=null}if(d.path&&!d.path.length)d.path=null}}};

/* ---------- battles ---------- */
function fitWidth(list,S,width){const out=[];let w=0;for(const d of list){const dw=G.stats(S,d).w;if(out.length&&w+dw>width)break;out.push(d);w+=dw}return out}
G.fight=function(S){for(const k in S.battles){const B=S.battles[k],p=B.p;
  let att=B.att.map(id=>G.div(S,id)).filter(d=>d&&d.path&&d.path[0]===p&&d.org>.1&&G.atWar(S,d.o,S.prov[p].ctrl));
  const aTag=att.length?att[0].o:B.side;let def=S._at[p].filter(d=>!d.ret&&G.atWar(S,aTag,d.o));
  if(!att.length||!def.length){G.endBattle(S,B,att,def);continue}
  const origins=new Set(att.map(d=>d.p)),T=D.TERRAIN[M.provs[p].terr],P=S.prov[p];
  att.sort((a,b)=>b.org-a.org);def.sort((a,b)=>b.org-a.org);
  const A=fitWidth(att,S,80+40*(origins.size-1)),Dd=fitWidth(def,S,80+40*(origins.size-1));
  let aAtt=0,aBrk=0,dAtt=0,dDef=0;const aN=S.nat[aTag].mod;
  for(const d of A){const st=G.stats(S,d),g=G.genOf(S,d);let m=d.str*(.75+.5*d.xp)*(d.oos>3?.6:1)*(isSea(d.p,p)?.5:1)*(g?1+.01*g.skill+(g.trait==='att'?.04*g.skill:0):1);aAtt+=st.att*m;aBrk+=st.brk*m}
  let digAvg=0;for(const d of Dd){const st=G.stats(S,d),g=G.genOf(S,d),m=d.str*(.75+.5*d.xp)*(d.oos>3?.6:1)*(g?1+.01*g.skill+(g.trait==='def'?.04*g.skill:0):1);dAtt+=st.att*m*.9;dDef+=st.def*m*(1+d.dig);digAvg+=d.dig/Dd.length}
  if(S.wings&&S.wings.length){const ha=G.airOver(S,aTag,p),hd=G.airOver(S,Dd[0].o,p);if(ha.f+ha.b+hd.f+hd.b>0){const sup=ha.f>hd.f*1.3?1:hd.f>ha.f*1.3?-1:0;aAtt*=1+Math.min(.3,ha.b*.03)*(sup>0?1:sup===0?.5:.15)+(sup>0?.04:0);dAtt*=1+Math.min(.3,hd.b*.03)*(sup<0?1:sup===0?.5:.15)+(sup<0?.04:0);B.air=sup;G.airWar(S,aTag,Dd[0].o,p,{a:ha,d:hd})}}
  aAtt*=1+(aN.gas||0)*(digAvg>.2?1:0);dDef*=T.def*(1+P.fort*.18*(1-(aN.siege||0)));
  /* dug-in troops behind forts shrug off most of what is thrown at them */
  const cover=.1/((1+digAvg*1.5)*(1+P.fort*.2*(1-(aN.siege||0))));
  const hitD=Math.min(aAtt,dDef)*cover+Math.max(0,aAtt-dDef)*.3,hitA=Math.min(dAtt,aBrk)*.1+Math.max(0,dAtt-aBrk)*.3;
  hurt(S,Dd,hitD,B,'cd',aTag);hurt(S,A,hitA,B,'ca',Dd[0].o);
  for(const d of A)if(d.org<=.1){d.path=null;d.prog=0;d.b=null;B.att=B.att.filter(x=>x!==d.id)}
  for(const d of Dd)if(d.org<=0)G.retreat(S,d,origins);
  att=B.att.map(id=>G.div(S,id)).filter(d=>d&&d.path&&d.path[0]===p);def=S._at[p].filter(d=>!d.ret&&G.atWar(S,aTag,d.o)&&S.divs.includes(d));
  if(!att.length||!def.length)G.endBattle(S,B,att,def)}};
function hurt(S,list,hits,B,ck,foe){const per=hits/list.length;for(const d of list){const st=G.stats(S,d),N=S.nat[d.o];d.org=Math.max(0,d.org-per/st.org);
  const sl=Math.min(d.str,per/st.hp*.9*(1+(N.mod.loss||0))*(1-st.heal*.3)),men=sl*st.mp;d.str-=sl;d.xp=Math.min(1,d.xp+.004);N.lost+=men*.6;S.nat[foe].kills+=men;B[ck]+=men}}
G.retreat=function(S,d,avoid){const N=S.nat[d.o];let best=-1,bs=1e9;const cap=M.provs[N.cap>=0?N.cap:d.p];
  for(const nb of NB[d.p]){if(nb.sea&&!G.linkOK(S,d.o,d.p,nb.j))continue;if(!G.friendly(S,d.o,S.prov[nb.j].ctrl)||(avoid&&avoid.has(nb.j))||G.hostileAt(S,nb.j,d.o).length)continue;
    const q=M.provs[nb.j],sc=Math.hypot(q.cx-cap.cx,q.cy-cap.cy)+(S.battles[nb.j]?400:0);if(sc<bs){bs=sc;best=nb.j}}
  if(best<0||d.str<.08){G.destroy(S,d,true);return}
  d.ret=true;d.path=[best];d.prog=0;d.dig=0;d.b=null};
G.destroy=function(S,d,surr){const i=S.divs.indexOf(d);if(i<0)return;const N=S.nat[d.o];N.lost+=G.stats(S,d).mp*d.str;S.divs.splice(i,1);const a=S._at[d.p],j=a.indexOf(d);if(j>=0)a.splice(j,1);if(S._byId)S._byId.delete(d.id);
  if(surr){S._surr=S._surr||{};S._surr[d.o+'@'+d.p]=(S._surr[d.o+'@'+d.p]||0)+1}};
G.endBattle=function(S,B,att,def){delete S.battles[B.p];const won=!def.length&&att.length,name=M.provs[B.p].name,cas=B.ca+B.cd;
  for(const id of B.att){const d=G.div(S,id);if(d)d.b=null}
  if(won)for(const d of att){d.prog=Math.max(d.prog,G.moveDays(S,d,d.p,B.p,isSea(d.p,B.p))-1.5);S.nat[d.o].ws=clamp(S.nat[d.o].ws+.02,0,100)}
  if(cas>30000){const a=B.side,dn=S.prov[B.p].ctrl;G.news(S,'Battle of '+name+': '+(won?G.adj(S,a)+' troops break through':'the '+G.adj(S,dn)+' line holds')+' after '+(S.day-B.day0+1)+' days. Around '+fmtK(cas)+' casualties.','war')}};
const fmtK=n=>n>=1e6?(n/1e6).toFixed(1)+' million':Math.round(n/1000)+',000';G.fmtK=fmtK;

/* ---------- supply, recovery, reinforcement ---------- */
G.supply=function(S){S._sup={};const fac={};
  for(const tag of TAGS){const N=S.nat[tag];if(N.dead||N.capit)continue;const key=N.faction||tag;if(fac[key]){S._sup[tag]=fac[key];continue}
    const set=new Set(),open=[];for(const t of G.sideOf(S,tag)){if(!G.alive(S,t))continue;let c=S.nat[t].cap;if(c<0||S.prov[c].ctrl!==t){c=-1;let bv=-1;for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===t&&S.prov[i].ctrl===t&&M.provs[i].vp>bv){bv=M.provs[i].vp;c=i}}if(c>=0){set.add(c);open.push(c)}}
    while(open.length){const u=open.pop();for(const nb of NB[u]){if(set.has(nb.j)||(nb.sea&&!G.linkOK(S,tag,u,nb.j))||!G.friendly(S,tag,S.prov[nb.j].ctrl))continue;set.add(nb.j);open.push(nb.j)}}
    fac[key]=S._sup[tag]=set}};
G.recover=function(S){for(let i=S.divs.length-1;i>=0;i--){const d=S.divs[i],N=S.nat[d.o],st=G.stats(S,d),sup=S._sup[d.o],ok=sup&&sup.has(d.p);
  d.oos=ok?0:d.oos+1;const fighting=(d.b!==null&&d.b!==undefined)||!!S.battles[d.p];
  if(!ok&&d.oos>4){d.str-=.012;d.org=Math.max(0,d.org-.04);if(d.str<.1){G.destroy(S,d,true);continue}}
  if(!fighting&&!d.ret){if(ok){const g=G.genOf(S,d);d.org=Math.min(1,d.org+.06*(1+(N.mod.org||0))*(g&&g.trait==='org'?1+.12*g.skill:1))}if(!d.path)d.dig=Math.min((.7+st.dig)*(1+(N.mod.dig||0)),d.dig+.035)}
  if(ok&&d.str<1&&!d.ret){const want=Math.min(1-d.str,fighting?.008:.025);let r=1;for(const e in st.eq)if(st.eq[e]>0)r=Math.min(r,N.stock[e]/(st.eq[e]*want));r=clamp(r,0,1);
    const mp=N._mp;if(mp&&mp.free<st.mp*want*r)r=0;if(r>0){const g=want*r;for(const e in st.eq)N.stock[e]-=st.eq[e]*g;d.str+=g;if(mp)mp.free-=st.mp*g}}}
  if(S._surr){for(const k in S._surr)if(S._surr[k]>=3){const[t,p]=k.split('@');G.news(S,S._surr[k]+' '+G.adj(S,t)+' divisions are cut off and destroyed near '+M.provs[+p].name+'.','war')}S._surr=null}};

/* ---------- economy ---------- */
G.economy=function(S,tag){const N=S.nat[tag];if(N.dead||N.capit)return;G.factories(S,tag);G.runPlan(S,tag);G.syncNavy(S,tag);G.airUpkeep(S,tag);N.pp+=2+(N.stab>70?.5:0);
  const E=D.ECON[N.econ],blk=(G.blockaded(S,tag)?1-.12*(1+(N.mod.blockade||0)):1)*(1-G.subPenalty(S,tag));
  let used=0;for(const l of N.lines)used+=l.f;if(used>N.mil){const k=N.mil/used;for(const l of N.lines)l.f=Math.floor(l.f*k)}
  for(const l of N.lines)N.stock[l.eq]+=l.f*D.EQUIP[l.eq].per*E.out*(1+(N.mod.prod||0))*blk;
  let free=N.civ*(1-E.goods);for(let i=0;i<N.build.length&&free>0;i++){const b=N.build[i],n=Math.min(15,free);free-=n;b.prog+=n*(1+(N.mod.build||0));
    if(b.prog>=D.BUILD[b.k].cost){if(b.k==='civ')N.builtCiv++;else if(b.k==='mil')N.builtMil++;else if(b.k==='fleet'){N.navy+=5;S._sea={}}else if(b.k==='subs'){N.subs=(N.subs||0)+1}else if(b.p>=0&&S.prov[b.p].ctrl===tag)S.prov[b.p][b.k]=Math.min(D.BUILD[b.k].max,S.prov[b.p][b.k]+1);
      N.build.splice(i,1);i--;if(tag===S.player)G.news(S,D.BUILD[b.k].n+' completed'+(b.p>=0?' in '+M.provs[b.p].name:'')+'.','home')}}
  const yr=G.date(S.day).y;for(let i=N.research.length-1;i>=0;i--){const r=N.research[i],T=D.TECH.find(x=>x.id===r.id);r.prog+=1/(D.TECH_DAYS*(1+Math.max(0,T.year-yr)*.6));
    if(r.prog>=1){N.research.splice(i,1);N.tech.push(T.id);for(const k in T.fx)N.mod[k]=(N.mod[k]||0)+T.fx[k];G.touch(S,tag);if(tag===S.player)G.news(S,'Research complete: '+T.name+'.','home');if(T.id==='gas')G.flag(S,'gas_'+tag)}}
  for(let i=0;i<N.recruit.length;i++){const r=N.recruit[i];if(r.left>0){r.left--;continue}
    const st=G.tplStats(S,tag,N.tpls[r.t]);let ratio=1;for(const e in st.eq)if(st.eq[e]>0)ratio=Math.min(ratio,N.stock[e]/st.eq[e]);if(ratio<.45)continue;
    let p=r.p;if(p===undefined||p<0||S.prov[p].ctrl!==tag)p=N.cap;if(p<0||S.prov[p].ctrl!==tag)continue;
    for(const e in st.eq)N.stock[e]-=st.eq[e]*ratio;G.spawn(S,tag,p,r.t,1,.1,null,ratio);const d=S.divs[S.divs.length-1];d.org=.3;S._at[p].push(d);if(S._byId)S._byId.set(d.id,d);
    N.recruit.splice(i,1);i--;if(tag===S.player)G.news(S,d.name+' is ready at '+M.provs[p].name+'.','home')}};
G.techAvail=function(S,tag){const N=S.nat[tag],yr=G.date(S.day).y;return D.TECH.filter(T=>!N.tech.includes(T.id)&&!N.research.some(r=>r.id===T.id)&&T.year<=yr+2)};
G.canBn=(S,tag,b)=>!D.BN[b].tech||S.nat[tag].tech.includes(D.BN[b].tech);

/* ---------- player commands (also used by the AI) ---------- */
G.cmd={
 recruit(S,tag,t,p){const N=S.nat[tag],st=G.tplStats(S,tag,N.tpls[t]),mp=G.manpower(S,tag);if(mp.free<st.mp)return'Not enough manpower.';N.recruit.push({t,p:p===undefined?N.cap:p,left:60});return''},
 cancelRecruit(S,tag,i){S.nat[tag].recruit.splice(i,1)},
 line(S,tag,eq,delta){const N=S.nat[tag];let l=N.lines.find(x=>x.eq===eq);const used=N.lines.reduce((s,x)=>s+x.f,0);if(delta>0&&used+delta>N.mil)delta=N.mil-used;if(!l){if(delta<=0)return;l={eq,f:0};N.lines.push(l)}l.f=Math.max(0,l.f+delta)},
 build(S,tag,k,p){const N=S.nat[tag];if(N.build.length>=8)return'The construction queue is full.';if(D.BUILD[k].max&&(p===undefined||p<0||S.prov[p].ctrl!==tag))return'Choose one of your provinces first.';
   if(D.BUILD[k].max&&S.prov[p][k]+N.build.filter(b=>b.k===k&&b.p===p).length>=D.BUILD[k].max)return'Already at the maximum there.';N.build.push({k,p:D.BUILD[k].max?p:-1,prog:0});return''},
 cancelBuild(S,tag,i){S.nat[tag].build.splice(i,1)},
 research(S,tag,id){const N=S.nat[tag];if(N.research.length>=D.NATIONS[tag].slots)return'All research teams are busy.';if(N.tech.includes(id)||N.research.some(r=>r.id===id))return'';N.research.push({id,prog:0});return''},
 law(S,tag,kind,i){const N=S.nat[tag],L=(kind==='cons'?D.CONS:D.ECON)[i];if(!L||N[kind]===i)return'';if(N.pp<D.LAW_COST)return'Needs '+D.LAW_COST+' political power.';if(L.war&&!G.inWar(S,tag))return'Only possible in wartime.';
   N.pp-=D.LAW_COST;N[kind]=i;return''},
 template(S,tag,i,tpl){const N=S.nat[tag];let n=0,w=0;for(const b in tpl.bn){if(tpl.bn[b]<0||!G.canBn(S,tag,b))return'Not available.';n+=tpl.bn[b];w+=tpl.bn[b]*D.BN[b].w}
   if(n<1)return'A division needs at least one battalion.';if(n>25)return'At most 25 battalions.';if((tpl.sup||[]).length>4)return'At most four support companies.';
   if(i>=N.tpls.length){if(N.tpls.length>=8)return'At most eight designs.';N.tpls.push(tpl)}
   else{const was=JSON.stringify([N.tpls[i].bn,N.tpls[i].sup]);N.tpls[i]=tpl;/* re-equipping costs readiness */if(was!==JSON.stringify([tpl.bn,tpl.sup]))for(const d of S.divs)if(d.o===tag&&d.t===i){d.str=Math.max(.3,d.str*.85);d.org*=.7}}G.touch(S,tag);return''},
 improve(S,a,b){const N=S.nat[a];if(N.pp<25)return'Needs 25 political power.';N.pp-=25;S.rel[b][a]=clamp((S.rel[b][a]||0)+12,-100,100);S.rel[a][b]=clamp((S.rel[a][b]||0)+6,-100,100);return''},
 guarantee(S,a,b){const N=S.nat[a];if(S.guar.some(g=>g[0]===a&&g[1]===b))return'Already guaranteed.';if(N.pp<40)return'Needs 40 political power.';N.pp-=40;S.guar.push([a,b]);G.op(S,b,a,15);G.tension(S,2);
   G.news(S,G.the(S,a)+' guarantees the independence of '+G.the(S,b)+'.','dip');return''},
 justify(S,a,b){const N=S.nat[a],cost=G.claims(S,a).some(k=>S.prov[KEY[k]]&&S.prov[KEY[k]].owner===b)?35:60;if(S.cb[a+'>'+b]!==undefined)return'Already under way.';if(N.pp<cost)return'Needs '+cost+' political power.';
   N.pp-=cost;S.cb[a+'>'+b]=S.day+45;G.tension(S,4);G.op(S,b,a,-20);G.news(S,'The '+G.adj(S,a)+' press turns on '+G.the(S,b)+'. Diplomats fear a pretext for war is being prepared.','dip');return''},
 declare(S,a,b){if(G.friendly(S,a,b))return'You cannot attack an ally.';const ready=S.cb[a+'>'+b]!==undefined&&S.cb[a+'>'+b]<=S.day;if(!ready){S.nat[a].stab=clamp(S.nat[a].stab-8,0,100);for(const t of TAGS)if(t!==a)G.op(S,t,a,-12)}
   G.declareWar(S,a,b,{surprise:!ready});return''},
 alliance(S,a,b){const A=S.nat[a],B=S.nat[b];if(A.pp<50)return'Needs 50 political power.';if(G.friendly(S,a,b))return'Already allied.';if(G.atWar(S,a,b))return'You are at war.';
   A.pp-=50;const o=G.opinion(S,b,a),clash=G.sideOf(S,a).some(t=>G.atWar(S,t,b))||G.sideOf(S,b).some(t=>G.atWar(S,t,a)||G.opinion(S,t,a)<-20);
   const cautious=D.NATIONS[b].dials.cau>.85;if(clash||cautious||o<45||(o<70&&S.tension<45)){G.say(S,b,cautious?'Is of neutral. Forever.':'No. Not yet.');return G.the(S,b)+' declines.'}
   if(B.faction&&!A.faction)G.joinFaction(S,a,B.faction);else{if(!A.faction){const id='F'+S.day+a;S.factions[id]={name:G.adj(S,a)+'–'+G.adj(S,b)+' Alliance',members:[a]};A.faction=id}G.joinFaction(S,b,A.faction)}return''},
 peace(S,a,b){if(!G.atWar(S,a,b))return'';const B=S.nat[b];if(S.nat[a].pp<30)return'Needs 30 political power.';S.nat[a].pp-=30;
   if(G.sideOf(S,b).length>1&&G.sideOf(S,b)[0]!==b)return G.the(S,b)+' will not make peace without its allies.';
   /* they settle if their will is breaking, or if we hold a good part of their country and they hold none of ours */
   let theirs=0,held=0,ours=0;for(let i=0;i<M.provs.length;i++){const P=S.prov[i];if(P.owner===b){theirs+=M.provs[i].vp;if(G.friendly(S,a,P.ctrl))held+=M.provs[i].vp}else if(G.friendly(S,a,P.owner)&&G.friendly(S,b,P.ctrl))ours++}
   const winning=theirs>0&&held/theirs>=.2&&ours===0;
   if(B.ws<35||B.stab<30||winning){G.treaty(S,G.sideOf(S,b).filter(t=>G.atWar(S,t,a)),G.sideOf(S,a).filter(t=>G.atWar(S,t,b)),winning||B.ws<20?0:-1);return''}return G.the(S,b)+' refuses. Its people still believe in victory.'},
 leave(S,a){const N=S.nat[a];if(!N.faction)return'';G.leaveFaction(S,a);N.stab=clamp(N.stab-6,0,100);return''},
 armyNew(S,tag,ids){const N=S.nat[tag];N.armies=N.armies||[];if(N.armies.length>=12)return'At most twelve armies.';N.armySeq=(N.armySeq||0)+1;const a={id:N.armySeq,name:ORD(N.armySeq)+' Army',stance:0,foe:null,gen:G.newGeneral(S,tag)};N.armies.push(a);G.cmd.armyAdd(S,tag,a.id,ids);return''},
 armyAdd(S,tag,id,ids){for(const i of ids){const d=G.div(S,i);if(d&&d.o===tag)d.army=id}},
 armySet(S,tag,id,k,v){const a=(S.nat[tag].armies||[]).find(x=>x.id===id);if(a)a[k]=v},
 armyDisband(S,tag,id){const N=S.nat[tag];N.armies=(N.armies||[]).filter(a=>a.id!==id);for(const d of S.divs)if(d.o===tag&&d.army===id)d.army=0},
 squadron(S,tag,z,delta){const N=S.nat[tag],home=G.homeSea(S,tag);if(!N.sq||!D.SEAS[z])return'';if(delta>0){let from=null;for(const k of SEAS)if(k!==z&&(N.sq[k]||0)>0&&(from===null||N.sq[k]>N.sq[from]))from=k;if(from===null)return'No squadron to spare.';
     if(!G.ports(S,tag).z[z]&&!G.sideOf(S,tag).some(t=>G.ports(S,t).z[z]))return'We have no port on that sea, and no ally who has.';G.moveSq(S,tag,from,z,1)}
   else{if(!(N.sq[z]>0))return'';const to=home&&home!==z?home:SEAS.find(k=>k!==z&&G.ports(S,tag).z[k]);if(!to)return'There is nowhere else to send it.';G.moveSq(S,tag,z,to,1)}return''},
 wing(S,tag,t){const N=S.nat[tag],W=D.WING[t];if(!W)return'';if(!N.tech.includes(D.EQUIP[W.eq].tech))return'Needs research first.';if(N.stock[W.eq]<D.WING_SIZE)return'Needs '+D.WING_SIZE+' '+D.EQUIP[W.eq].n.toLowerCase()+' in store.';if(N.cap<0||S.prov[N.cap].ctrl!==tag)return'No capital to form it in.';
   N.stock[W.eq]-=D.WING_SIZE;G.newWing(S,tag,t,N.cap);return''},
 rebase(S,tag,from,to){if(to===undefined||to<0||!G.friendly(S,tag,S.prov[to].ctrl))return'Choose one of your own or an ally\'s provinces on the map first.';let n=0;for(const w of S.wings||[])if(w.o===tag&&w.p===from){w.p=to;w.ready=S.day+3;n++}return n?'':'No wings there.'},
 minister(S,tag,k,on){const N=S.nat[tag];N.mgr=N.mgr||{};N.mgr[k]=!!on;return''},
 armyGeneral(S,tag,id){const N=S.nat[tag],a=(N.armies||[]).find(x=>x.id===id);if(!a)return'';if(N.pp<25)return'Needs 25 political power.';N.pp-=25;a.gen=G.newGeneral(S,tag);return''},
 demand(S,a,b){const N=S.nat[a],keys=G.claims(S,a).filter(k=>S.prov[KEY[k]].owner===b&&S.nat[b].cap!==KEY[k]);if(!keys.length)return'We claim nothing they hold.';if(G.atWar(S,a,b))return'';if(N.pp<40)return'Needs 40 political power.';
   if(S.flags['dem_'+a+b]>S.day-365)return'They have given their answer. Ask again next year.';N.pp-=40;S.flags['dem_'+a+b]=S.day;G.doDemand(S,a,b,keys);return''},
 plan(S,tag,id){const N=S.nat[tag];if(N.plan)return'A plan is already under way.';if(G.planState(S,tag,PK.PLANS[id])!=='open')return'Not available.';N.plan={id,left:PK.PLANS[id].days||70};return''},
 cancelPlan(S,tag){S.nat[tag].plan=null}
};
/* ---------- generals, demands, aims ---------- */
G.genOf=function(S,d){if(!d.army)return null;const a=S.nat[d.o].armies;if(!a)return null;for(const x of a)if(x.id===d.army)return x.gen||null;return null};
G.newGeneral=function(S,tag){const N=S.nat[tag],pool=((D.SCEN[S.scen].generals||{})[tag]||D.GENERALS[tag]||[]).filter(n=>!(N.armies||[]).some(a=>a.gen&&a.gen.name===n));N.genSeq=(N.genSeq||0)+1;
  const name=pool.length?pool[Math.floor(G.rnd(S)*pool.length)]:'the '+ORD(N.genSeq)+' staff appointee';return{name,skill:1+Math.floor(G.rnd(S)*3),trait:['att','def','org'][Math.floor(G.rnd(S)*3)]}};
G.sidePower=function(S,tag){const side=G.sideOf(S,tag);let p=0;for(const d of S.divs)if(side.includes(d.o))p+=G.power(S,d);return p+1};
G.odds=(S,a,b)=>G.sidePower(S,a)/G.sidePower(S,b);
G.cede=function(S,from,to,keys){for(const k of keys){G.addClaim(S,from,k);G.transfer(S,k,to)}G.op(S,from,to,-40);S.nat[from].stab=clamp(S.nat[from].stab-8,0,100);G.tension(S,3);
  G.news(S,G.the(S,from)+' cedes '+keys.map(k=>M.provs[KEY[k]].name).join(', ')+' to '+G.the(S,to)+' rather than fight.','dip')};
G.doDemand=function(S,a,b,keys){G.tension(S,5);G.news(S,G.the(S,a)+' demands '+keys.map(k=>M.provs[KEY[k]].name).join(', ')+' from '+G.the(S,b)+'.','dip');
  if(b===S.player){S.pending.push({id:'_demand',tag:b,data:{from:a,keys}});return}
  const backed=S.guar.some(g=>g[1]===b&&G.alive(S,g[0])&&g[0]!==a)||G.sideOf(S,b).filter(t=>G.alive(S,t)).length>1,o=G.odds(S,a,b);
  if((!backed&&o>=2.2)||o>=4.5)G.cede(S,b,a,keys);else{S.cb[a+'>'+b]=S.day;G.op(S,b,a,-25);G.news(S,G.the(S,b)+' refuses.','dip')}};
G.strength=function(S,tag){const N=S.nat[tag];if(N.dead||N.capit)return 0;let v=0;for(let i=0;i<M.provs.length;i++)if(S.prov[i].ctrl===tag)v+=M.provs[i].vp;let n=0;for(const d of S.divs)if(d.o===tag)n+=d.str;return v+(N.civ+N.mil)*1.5+n*.5};
G.rank=function(S,tag){const mine=G.strength(S,tag);let r=1;for(const t of TAGS)if(t!==tag&&G.strength(S,t)>mine)r++;return r};
/* each aim: {name, desc, ok} evaluated against the world as it stands */
G.goals=function(S,tag){const N=S.nat[tag],C=D.NATIONS[tag],list=((D.GOALS[S.scen]||{})[tag])||[{t:'alive'},{t:'keep'},C.major?{t:'top',n:3}:{t:'unbeaten'}];
  const extra=S.scen==='carry'&&(N.claims||[]).length?[{t:'own',keys:N.claims.slice(0,4),n:'Recover what was lost'}]:[];
  return list.concat(extra).map(g=>{const pn=k=>M.provs[KEY[k]].name;switch(g.t){
    case'alive':return{name:'Endure',desc:'Reach the end unconquered, holding '+(N.cap>=0?M.provs[N.cap].name:'your capital')+'.',ok:!N.dead&&!N.capit&&N.cap>=0&&S.prov[N.cap].ctrl===tag};
    case'own':return{name:g.n||'National aims',desc:'Own '+g.keys.map(pn).join(' and ')+'.',ok:g.keys.every(k=>S.prov[KEY[k]].owner===tag)};
    case'keep':{let lost=0;for(let i=0;i<M.provs.length;i++)if(S.own0[i]===tag&&S.prov[i].owner!==tag)lost++;return{name:g.n||'Territorial integrity',desc:'Own every province you started with.'+(lost?' ('+lost+' lost)':''),ok:!N.dead&&lost===0}}
    case'free':return{name:G.the(S,g.tag)+' stands',desc:G.the(S,g.tag)+' exists and holds its own capital.',ok:!S.nat[g.tag].dead&&!S.nat[g.tag].capit&&S.nat[g.tag].cap>=0&&S.prov[S.nat[g.tag].cap].ctrl===g.tag};
    case'top':{const r=G.rank(S,tag);return{name:g.n===1?'The first power in Europe':'A leading power',desc:'Rank in the top '+g.n+' powers by strength. (Now '+ORD(r)+')',ok:r<=g.n}}
    case'navy':{let best=true;for(const t of TAGS)if(t!==tag&&!S.nat[t].dead&&S.nat[t].navy>N.navy)best=false;return{name:'Rule the waves',desc:'Have the largest fleet.',ok:best&&!N.dead}}
    case'dynasty':return{name:'The dynasty survives',desc:'No revolution: the Tsar still reigns.',ok:!N.dead&&S.flags.rus_prov===undefined&&S.flags.soviet===undefined};
    case'flag':return{name:g.n,desc:g.d,ok:S.flags[g.flag]!==undefined};
    case'unbeaten':return{name:'Never beaten',desc:'Never capitulate.',ok:!N.dead&&!N.everCapit};
    default:return{name:'?',desc:'',ok:false}}})};
/* ---------- national plans ---------- */
G.planState=function(S,tag,P){const N=S.nat[tag],done=N.plans||[];if(done.includes(P.id))return'done';if(N.plan&&N.plan.id===P.id)return'active';
  if((P.x||[]).some(x=>done.includes(x)||(N.plan&&N.plan.id===x)))return'closed';if((P.req||[]).some(r=>!done.includes(r)))return'locked';if(P.war&&!G.inWar(S,tag))return'locked';return'open'};
G.plansFor=(S,tag)=>Object.values(PK.PLANS||{}).filter(P=>(!P.only||P.only===tag)&&(!P.scen||P.scen===S.scen)&&(!P.minor||!D.NATIONS[tag].major));
G.runPlan=function(S,tag){const N=S.nat[tag];if(!PK.PLANS)return;
  if(N.plan){if(--N.plan.left<=0){const P=PK.PLANS[N.plan.id];N.plans=N.plans||[];N.plans.push(P.id);N.plan=null;if(P&&P.fx)P.fx(S,tag);G.touch(S,tag);
      if(tag===S.player||P.news)G.news(S,(tag===S.player?'Plan complete: '+P.name+'.':P.news(S,tag)),tag===S.player?'home':'dip')}}
  else if(G.mgr(S,tag,'plans')&&(S.day+tag.charCodeAt(0))%9===0){const open=G.plansFor(S,tag).filter(P=>G.planState(S,tag,P)==='open');if(open.length){const P=G.pick(S,open,x=>x.w?x.w(S,tag):1);N.plan={id:P.id,left:P.days||70}}}};

/* ---------- war and peace ---------- */
G.joinFaction=function(S,tag,f){const N=S.nat[tag];if(N.faction===f||!S.factions[f])return;if(N.faction)G.leaveFaction(S,tag,true);N.faction=f;S.factions[f].members.push(tag);
  G.news(S,G.the(S,tag)+' joins the '+S.factions[f].name+'.','dip');G.tension(S,D.NATIONS[tag].major?6:3);
  for(const m of G.members(S,f))if(m!==tag){for(const e of G.enemies(S,m))if(!G.friendly(S,tag,e))G.setWar(S,tag,e,e);for(const e of G.enemies(S,tag))if(!G.friendly(S,m,e))G.setWar(S,m,e,e)}S._ctrlDirty=true};
G.leaveFaction=function(S,tag,quiet){const N=S.nat[tag],f=N.faction;if(!f)return;const F=S.factions[f];F.members=F.members.filter(t=>t!==tag);N.faction=null;for(const m of F.members)G.op(S,m,tag,-30);
  if(!quiet)G.news(S,G.the(S,tag)+' leaves the '+F.name+'.','dip');if(F.members.length<2){for(const m of F.members)S.nat[m].faction=null;delete S.factions[f]}};
G.setWar=function(S,a,b,agg){if(a===b||S.wars[wk(a,b)]||S.nat[a].dead||S.nat[b].dead)return false;S.wars[wk(a,b)]={day:S.day,agg:agg||a};G.flag(S,'w:'+wk(a,b));if(D.NATIONS[b].major)S.nat[a].foughtMajor=true;if(D.NATIONS[a].major)S.nat[b].foughtMajor=true;if(D.NATIONS[a].major&&D.NATIONS[b].major)G.flag(S,'great_war');S.guar=S.guar.filter(g=>!((g[0]===a&&g[1]===b)||(g[0]===b&&g[1]===a)));
  S.rel[a][b]=Math.min(S.rel[a][b]||0,-60);S.rel[b][a]=Math.min(S.rel[b][a]||0,-60);S._sea={};return true};
G.declareWar=function(S,a,b,o){o=o||{};if(G.atWar(S,a,b)||G.friendly(S,a,b)||S.nat[a].dead||S.nat[b].dead)return;
  G.setWar(S,a,b,a);G.tension(S,(D.NATIONS[a].major&&D.NATIONS[b].major)?14:7);G.news(S,(o.text||G.the(S,a)+' declares war on '+G.the(S,b)+'.'),'war');
  /* defenders' allies come in at once; attackers' allies are asked */
  for(const m of G.sideOf(S,b))if(m!==b&&G.alive(S,m)){if(m===S.player&&!o.noAsk)S.pending.push({id:'_allycall',tag:m,data:{ally:b,enemy:a,def:true}});else G.setWar(S,m,a,a)}
  for(const m of G.sideOf(S,a))if(m!==a&&G.alive(S,m)){if(m===S.player&&!o.noAsk)S.pending.push({id:'_allycall',tag:m,data:{ally:a,enemy:b,def:false}});else if(G.opinion(S,m,a)>=20||o.force)G.setWar(S,m,b,a);else G.leaveFaction(S,m)}
  G.spread(S);
  for(const g of S.guar.slice())if(g[1]===b&&g[0]!==a&&!G.atWar(S,g[0],a)&&G.alive(S,g[0])&&!G.friendly(S,g[0],a)){
    if(g[0]===S.player)S.pending.push({id:'_guarantee',tag:g[0],data:{victim:b,enemy:a}});
    else if(G.rnd(S)<.95-D.NATIONS[g[0]].dials.cau*.25+(G.opinion(S,g[0],a)<=-15?.2:0))G.honour(S,g[0],b,a);else{G.op(S,b,g[0],-40);G.news(S,G.the(S,g[0])+' abandons its guarantee to '+G.the(S,b)+'.','dip')}}
  S._ctrlDirty=true};
/* everyone in a faction shares its wars */
G.spread=function(S){for(let pass=0;pass<3;pass++)for(const f in S.factions){const ms=G.members(S,f).filter(t=>G.alive(S,t));for(const m of ms)for(const e of G.enemies(S,m))for(const m2 of ms)if(m2!==m&&m2!==S.player&&!G.friendly(S,m2,e))G.setWar(S,m2,e,e)}};
G.honour=function(S,g,victim,enemy){const A=S.nat[g],V=S.nat[victim];G.news(S,G.the(S,g)+' honours its guarantee to '+G.the(S,victim)+'.','dip');
  if(A.faction)G.joinFaction(S,victim,A.faction);else if(V.faction)G.joinFaction(S,g,V.faction);
  else{let f=null;for(const k in S.factions)if(G.members(S,k).some(m=>G.atWar(S,m,enemy))&&!G.members(S,k).some(m=>G.atWar(S,m,g)||G.atWar(S,m,victim))){f=k;break}
    if(!f){f='F'+S.day+g;S.factions[f]={name:G.adj(S,g)+'–'+G.adj(S,victim)+' Alliance',members:[]}}G.joinFaction(S,g,f);G.joinFaction(S,victim,f)}
  if(!G.atWar(S,g,enemy)){G.setWar(S,g,enemy,enemy);G.news(S,G.the(S,g)+' declares war on '+G.the(S,enemy)+'.','war');G.tension(S,10)}G.spread(S)};
G.vpShare=function(S,tag){let tot=0,held=0;for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===tag){tot+=M.provs[i].vp;if(S.prov[i].ctrl===tag)held+=M.provs[i].vp}return tot?held/tot:0};
G.checkCapit=function(S){for(const tag of TAGS){const N=S.nat[tag];if(N.dead||N.capit||!G.enemies(S,tag).length)continue;const sh=G.vpShare(S,tag),capHeld=N.cap>=0&&S.prov[N.cap].ctrl===tag;
  if(sh<(D.NATIONS[tag].major?.4:.3)||(!capHeld&&sh<(D.NATIONS[tag].major?.55:.5)))G.capitulate(S,tag)}};
G.capitulate=function(S,tag){const N=S.nat[tag];N.capit=true;N.everCapit=true;const en=G.enemies(S,tag);if(!en.length)return;const cnt={};for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===tag&&en.includes(S.prov[i].ctrl))cnt[S.prov[i].ctrl]=(cnt[S.prov[i].ctrl]||0)+1;
  let occ=en[0],b=-1;for(const t in cnt)if(cnt[t]>b){b=cnt[t];occ=t}
  for(let i=S.divs.length-1;i>=0;i--)if(S.divs[i].o===tag)S.divs.splice(i,1);G.index(S);for(const k in S.battles)delete S.battles[k];for(const d of S.divs)d.b=null;
  for(let i=0;i<M.provs.length;i++)if(S.prov[i].ctrl===tag)S.prov[i].ctrl=G.friendly(S,occ,S.prov[i].owner)&&S.prov[i].owner!==tag?S.prov[i].owner:occ;
  N.recruit=[];S._ctrlDirty=true;G.news(S,G.the(S,tag)+' has capitulated. Its armies lay down their arms.','war');G.say(S,tag,'Is over for me.');for(const e of en)S.nat[e].ws=clamp(S.nat[e].ws+6,0,100);
  for(const m of G.sideOf(S,tag))if(m!==tag&&G.alive(S,m))S.nat[m].ws=clamp(S.nat[m].ws-6,0,100);G.checkPeace(S)};
G.checkPeace=function(S){for(const tag of TAGS){const N=S.nat[tag];if(!N.capit||N.dead)continue;const side=G.sideOf(S,tag),/* only allies who are in this same war can keep it going */co=side.filter(t=>t===tag||G.enemies(S,t).some(e=>G.atWar(S,tag,e))),majors=co.filter(t=>D.NATIONS[t].major);
  const done=(majors.length?majors:co).every(t=>S.nat[t].capit);if(!done)continue;
  const losers=side.filter(t=>G.enemies(S,t).length),winners=TAGS.filter(t=>G.alive(S,t)&&losers.some(l=>G.atWar(S,t,l)));if(!losers.length)continue;
  if(!winners.length)continue;
  /* the beaten stay occupied while someone is still fighting their conquerors and is not their own enemy */
  if(TAGS.some(t=>G.alive(S,t)&&!losers.includes(t)&&!losers.some(l=>G.atWar(S,t,l))&&winners.some(w=>G.atWar(S,t,w))))continue;
  for(const l of side)if(!S.nat[l].capit&&G.enemies(S,l).length)S.nat[l].capit=true;
  const top=winners.slice().sort((a,b)=>S.nat[b].kills-S.nat[a].kills)[0];
  if(winners.includes(S.player)&&D.NATIONS[S.player].major){if(!S.pending.some(p=>p.id==='_treaty'))S.pending.push({id:'_treaty',tag:S.player,data:{losers,winners}})}
  else{const g=D.NATIONS[top].dials.gru,r=G.rnd(S);G.treaty(S,losers,winners,r<g*.6?2:r<.5+g*.4?1:0)}return}};
G.treaty=function(S,losers,winners,level){winners=TAGS.filter(t=>!S.nat[t].dead&&!losers.includes(t)&&losers.some(l=>G.atWar(S,t,l)));if(!winners.length)return;const lead=winners.filter(t=>G.alive(S,t)).sort((a,b)=>S.nat[b].kills-S.nat[a].kills)[0]||winners[0];const names=['a peace of reconciliation','a victor\'s peace','a dictated peace'];const moved=[];
  const pre=S.prov.map(P=>P.owner),revive={};
  for(let i=0;i<M.provs.length;i++){const P=S.prov[i],p=M.provs[i];
    if(losers.includes(pre[i])){let to=null;if(level>=0)to=winners.find(w=>G.claims(S,w).includes(p.key))||null;const lcap=S.nat[pre[i]].cap===i;
      const orig=S.own0[i];let back=false;if(!to&&level>=0&&orig!==pre[i]&&S.nat[orig]&&!losers.includes(orig)){back=true;if(S.nat[orig].dead){(revive[orig]=revive[orig]||[]).push(p.key);moved.push(i);continue}to=orig}

      if(!to&&level>=1&&winners.includes(P.ctrl)&&!lcap&&p.vp<10&&M.adj[i].some(j=>pre[j]===P.ctrl))to=P.ctrl;
      if(!to&&level>=2&&winners.includes(P.ctrl)&&!lcap)to=P.ctrl;
      /* land the loser had taken from someone who is not among the defeated goes back to them, not to whoever liberated it */
      if(to){P.owner=P.ctrl=to;moved.push(i);if(!back)G.addClaim(S,pre[i],p.key)}else if(winners.includes(P.ctrl)||losers.includes(P.ctrl))P.ctrl=P.owner}
    else if(winners.includes(pre[i])&&losers.includes(P.ctrl))P.ctrl=P.owner;
    else if(losers.includes(P.ctrl)&&!G.atWar(S,P.ctrl,P.owner))P.ctrl=P.owner}
  for(const o in revive){revive[o].sort((a,b)=>M.provs[KEY[b]].vp-M.provs[KEY[a]].vp);G.release(S,o,revive[o],lead)}
  /* new nations are carved out of the defeated */
  if(level>=1)for(const r in D.RELEASE){const R=D.RELEASE[r];if(level<R.level||!S.nat[r].dead)continue;
    const cores=D.CORES[r].filter(k=>{const i=KEY[k];if(i===undefined)return false;const o=S.prov[i].owner;return losers.includes(o)&&R.from.includes(o)&&S.nat[o].cap!==i});
    if(cores.length&&cores.includes(D.CORES[r][0])){for(const k of cores)G.addClaim(S,S.prov[KEY[k]].owner,k);G.release(S,r,cores,lead);moved.push(...cores.map(k=>KEY[k]));
      if(r==='HUN'&&!S.nat.AUS.dead)G.rename(S,'AUS',{name:'Austria',adj:'Austrian',flag:'AUT',major:false})}}
  for(const l of losers)for(const w of winners)delete S.wars[wk(l,w)];
  for(const l of losers){const N=S.nat[l];N.capit=false;const own=[];for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===l)own.push(i);
    if(!own.length){N.dead=true;if(N.faction)G.leaveFaction(S,l,true);for(let i=S.divs.length-1;i>=0;i--)if(S.divs[i].o===l)S.divs.splice(i,1);for(const k in S.wars)if(k.split('|').includes(l))delete S.wars[k];G.news(S,G.the(S,l)+' ceases to exist.','war');continue}
    if(N.cap<0||S.prov[N.cap].owner!==l)N.cap=own.sort((a,b)=>M.provs[b].vp-M.provs[a].vp)[0];
    if(level>=0){S.grudge[l]=S.grudge[l]||{};for(const w of winners){S.grudge[l][w]=[10,35,70][level];G.op(S,l,w,-[5,25,50][level]);S.rel[l][w]=Math.min(S.rel[l][w],[20,-20,-60][level])}}
    N.stab=clamp(N.stab-[0,5,10,20][level+1],5,100);N.ws=30;if(level>=2)N.builtMil-=Math.round(N.mil*.3);if(level>=1&&N.faction)G.leaveFaction(S,l,true);
    for(let i=S.divs.length-1;i>=0;i--)if(S.divs[i].o===l&&S.prov[S.divs[i].p].owner!==l)S.divs[i].p=N.cap;
    const have=S.divs.filter(d=>d.o===l).length,want=Math.max(2,Math.round(N.divs0*.25));if(have<want)G.spawn(S,l,N.cap,0,want-have,.2,null,.6)}
  for(const w of winners){const N=S.nat[w];N.stab=clamp(N.stab+5,0,100);N.ws=clamp(N.ws+10,0,100);if(level>=0&&losers.some(l=>D.NATIONS[l].major))N.wins=(N.wins||0)+1;
    if(N.capit&&!G.enemies(S,w).length){N.capit=false;if(N.cap>=0&&S.prov[N.cap].owner===w)G.spawn(S,w,N.cap,0,Math.max(2,Math.round(N.divs0*.25)),.2,null,.6)}}
  /* send everyone home from land that is no longer open to them */
  G.index(S);for(const d of S.divs){d.b=null;if(!G.canEnter(S,d.o,d.p)){d.p=S.nat[d.o].cap>=0?S.nat[d.o].cap:d.p;d.path=null;d.ret=false}else if(d.path&&d.path.some(p=>!G.canEnter(S,d.o,p)))d.path=null}
  for(const k in S.battles)delete S.battles[k];G.index(S);G.tension(S,-25);S._ctrlDirty=true;
  S.treaties.push({day:S.day,losers,winners,level,moved:moved.length});const city=M.provs[S.nat[lead].cap>=0?S.nat[lead].cap:0].name;
  if(level<0)G.news(S,'Peace without annexations between '+losers.map(t=>G.the(S,t)).join(', ')+' and '+winners.map(t=>G.the(S,t)).join(', ')+'.','dip');
  else G.news(S,'Treaty of '+city+': '+names[level]+' is imposed on '+losers.map(t=>G.the(S,t)).join(', ')+'. '+(moved.length?moved.length+' provinces change hands.':'No territory changes hands.'),'dip');
  if(level===2)G.flag(S,'dictated_peace')};
G.addClaim=function(S,tag,key){const N=S.nat[tag];if(!N)return;N.claims=N.claims||[];if(!N.claims.includes(key)&&!(D.CLAIMS[tag]||[]).includes(key))N.claims.push(key)};
/* bring a nation onto the map with the given provinces; the first key is its capital if it has none */
G.release=function(S,tag,keys,patron){const N=S.nat[tag],C=D.NATIONS[tag],ids=keys.map(k=>KEY[k]).filter(i=>i!==undefined);if(!ids.length)return false;const fresh=N.dead||N.cap<0;
  for(const i of ids){S.prov[i].owner=S.prov[i].ctrl=tag}
  if(fresh){N.dead=false;N.capit=false;N.cap=ids[0];N.faction=null;N.stab=C.stab;N.ws=C.ws;N.lost=0;N.lostPrev=0;N.pp=30;for(const k in S.wars)if(k.split('|').includes(tag))delete S.wars[k];
    for(const t of TAGS){if(t===tag)continue;S.rel[tag][t]=0;S.rel[t][tag]=0}}
  G.index(S);for(const d of S.divs)if(ids.includes(d.p)&&d.o!==tag&&!G.canEnter(S,d.o,d.p)){d.p=S.nat[d.o].cap>=0?S.nat[d.o].cap:d.p;d.path=null;d.ret=false;d.b=null}
  if(fresh){G.autoOOB(S,tag,.8);N.divs0=S.divs.filter(d=>d.o===tag).length;G.factories(S,tag);G.aiEcon(S,tag,true);N.vp0=ids.reduce((a,i)=>a+M.provs[i].vp,0);
    if(patron&&S.nat[patron]){S.rel[tag][patron]=50;S.rel[patron][tag]=40}G.news(S,C.name+' is proclaimed an independent state, with its capital at '+M.provs[N.cap].name+'.','dip');if(tag==='POL')G.say(S,'POL','Poland can into map!')}
  G.index(S);S._ctrlDirty=true;return true};
G.transfer=function(S,key,tag){const i=KEY[key];if(i===undefined)return;S.prov[i].owner=S.prov[i].ctrl=tag;G.index(S);for(const d of S.divs)if(d.p===i&&!G.canEnter(S,d.o,i)){d.p=S.nat[d.o].cap;d.path=null}G.index(S);S._ctrlDirty=true};

/* ---------- AI ---------- */
/* a nation is run by the computer (auto), or by a player who may hand single areas to ministers */
G.mgr=(S,tag,k)=>{const N=S.nat[tag];return N.auto||!!(N.mgr&&N.mgr[k])};
G.aiEcon=function(S,tag,init){const N=S.nat[tag],A=k=>init||G.mgr(S,tag,k);if(N.dead||N.capit||(!init&&!N.auto&&!['industry','research','armies'].some(k=>G.mgr(S,tag,k))))return;G.factories(S,tag);const war=G.inWar(S,tag);
  if(A('industry')){
  const useH=N.tpls.some(t=>t.bn.hart>0),w={rifles:.42,mgs:.14,guns:.3,hguns:useH?.14:0};if(!useH)w.rifles+=.14;
  if(N.tech.includes('tank')&&N.tpls.some(t=>t.bn.tank>0)){w.tanks=.1;w.rifles-=.1}
  if(N.tech.includes('fighter')&&N.mil>=8){w.fighters=.07;w.rifles-=.07}if(N.tech.includes('bomber')&&N.mil>=12){w.bombers=.05;w.rifles-=.05}
  N.lines=[];let left=N.mil;for(const e in w){const f=Math.floor(N.mil*w[e]);if(f>0){N.lines.push({eq:e,f});left-=f}}if(left>0&&N.lines.length)N.lines[0].f+=left;else if(left>0)N.lines.push({eq:'rifles',f:left})}
  if(init)return;
  if(A('industry')&&N.build.length<2)N.build.push({k:(N.navy>=20&&G.rnd(S)<.12)?'fleet':(war||S.tension>60)?'mil':'civ',p:-1,prog:0});
  while(A('research')&&N.research.length<D.NATIONS[tag].slots){const av=G.techAvail(S,tag);if(!av.length)break;N.research.push({id:G.pick(S,av,T=>1/(1+Math.max(0,T.year-G.date(S.day).y))).id,prog:0})}
  if(A('industry')&&war&&N.pp>=D.LAW_COST+(N.auto?0:60)){const mp=G.manpower(S,tag);if(N.econ<2){N.pp-=D.LAW_COST;N.econ++}else if(N.cons<3&&mp.free<mp.total*.15){N.pp-=D.LAW_COST;N.cons++}else if(N.cons<2){N.pp-=D.LAW_COST;N.cons++}}
  if(N.auto&&N.tech.includes('tank')&&war&&!N.tpls[0].bn.tank&&D.NATIONS[tag].major){N.tpls[0].bn.tank=1;G.touch(S,tag)}
  if(A('armies')&&(war||S.tension>75)&&N.cap>=0&&S.prov[N.cap].ctrl===tag){const mp=G.manpower(S,tag),st=G.tplStats(S,tag,N.tpls[0]);let free=mp.free;
    while(N.recruit.length<5&&free>st.mp*1.5&&N.stock.rifles>=st.eq.rifles*.6*(N.recruit.length+1)){N.recruit.push({t:0,p:N.cap,left:60});free-=st.mp}}};
function dijkstraAll(S,d,src){const dist=new Map([[src,0]]),open=[src],done=new Set(),sea=G.seaOK(S,d.o);
  while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(dist.get(open[i])<dist.get(open[bi]))bi=i;const u=open.splice(bi,1)[0];if(done.has(u))continue;done.add(u);
    for(const nb of NB[u]){if(done.has(nb.j)||(nb.sea&&!G.linkOK(S,d.o,u,nb.j))||!G.friendly(S,d.o,S.prov[nb.j].ctrl))continue;const c=dist.get(u)+G.moveDays(S,d,u,nb.j,nb.sea);if(c<(dist.has(nb.j)?dist.get(nb.j):1e9)){dist.set(nb.j,c);open.push(nb.j)}}}
  return dist}
G.aiMil=function(S,tag){const N=S.nat[tag];if(N.dead||N.capit)return;
  if(G.mgr(S,tag,'armies')){const my=S.divs.filter(d=>d.o===tag&&!d.ret);if(my.length)G.frontAI(S,tag,my,{attack:1,guard:true,home:true});return}
  for(const a of N.armies||[]){if(!a.stance)continue;const ds=S.divs.filter(d=>d.o===tag&&d.army===a.id&&!d.ret);if(ds.length)G.frontAI(S,tag,ds,{attack:a.stance-1,foe:a.foe||null})}};
/* o.attack: 0 hold the line, 1 advance when the odds are good, 2 assault. o.foe: only the front against that nation. */
G.frontAI=function(S,tag,my,o){const N=S.nat[tag];
  if(!G.inWar(S,tag)){if(o.home)for(const d of my)if(!d.path&&S.prov[d.p].owner!==tag&&N.cap>=0){const p=G.path(S,d,N.cap);if(p&&p.length)d.path=p}return}
  const sea=G.seaOK(S,tag),cau=D.NATIONS[tag].dials.cau,fronts=[];let unit=0;for(const d of my)unit+=G.power(S,d);unit=unit/my.length||1;
  for(let i=0;i<M.provs.length;i++){if(!G.friendly(S,tag,S.prov[i].ctrl))continue;let threat=0,host=false;
    for(const nb of NB[i]){if(nb.sea)continue;if(G.atWar(S,tag,S.prov[nb.j].ctrl)&&(!o.foe||S.prov[nb.j].ctrl===o.foe)){host=true;for(const e of G.hostileAt(S,nb.j,tag))threat+=G.power(S,e)}}
    if(host){const own=S.prov[i].owner===tag||S.prov[i].ctrl===tag;fronts.push({i,own,want:(2+threat/unit*1.1+M.provs[i].vp*.1+S.prov[i].fort*.3)*(own?1:.14),have:0,list:[]})}}
  if(!fronts.length)return;
  /* reachability from the capital keeps armies out of pockets and off far-away fronts they cannot walk to */
  const probe=my[0],home=N.cap>=0&&G.friendly(S,tag,S.prov[N.cap].ctrl)?dijkstraAll(S,probe,N.cap):null;
  let fr=home?fronts.filter(f=>home.has(f.i)):fronts;if(!fr.length)fr=fronts;
  let tot=0;for(const f of fr)tot+=f.want;const reserve=Math.min(3,Math.floor(my.length*.06));const nOwn=fr.filter(f=>f.own).length,minOwn=my.length>=nOwn*2?2:1;for(const f of fr)f.want=Math.max(f.own?minOwn:(nOwn?0:1),Math.round(f.want/tot*(my.length-reserve)));
  const byP=new Map(fr.map(f=>[f.i,f])),freeD=[];let guard=o.guard&&N.cap>=0&&S.prov[N.cap].ctrl===tag&&!byP.has(N.cap)&&my.length>8?2:0;
  for(const d of my){if(guard&&!d.path&&d.p===N.cap){guard--;continue}const dest=d.path&&d.path.length?d.path[d.path.length-1]:d.p,f=byP.get(dest);if(d.b!==null&&d.b!==undefined)continue;
    if(f&&f.have<f.want){f.have++;if(!d.path)f.list.push(d)}else if(G.atWar(S,tag,S.prov[dest].ctrl)){}else freeD.push(d)}
  const needy=fr.filter(f=>f.have<f.want).sort((a,b)=>(b.want-b.have)-(a.want-a.have));
  for(const f of needy){if(!freeD.length)break;const dist=dijkstraAll(S,probe,f.i);freeD.sort((a,b)=>(dist.has(a.p)?dist.get(a.p):1e8)-(dist.has(b.p)?dist.get(b.p):1e8));
    while(f.have<f.want&&freeD.length&&dist.has(freeD[0].p)){const d=freeD.shift(),p=G.path(S,d,f.i);if(p&&p.length){d.path=p;d.prog=0}f.have++}}
  /* attacks */
  if(!o.attack)return;const tried=new Set();let launched=false,urge=null;const due=o.guard&&S.day-(N.lastOff||S.day0)>100-D.NATIONS[tag].dials.amb*45;
  for(const f of fr){const ready=f.list.filter(d=>d.org>.72&&d.str>.55&&!d.path);if(!ready.length)continue;let best=null,bs=0;
    for(const nb of NB[f.i]){if(nb.sea||tried.has(nb.j)||!G.atWar(S,tag,S.prov[nb.j].ctrl)||(o.foe&&S.prov[nb.j].ctrl!==o.foe)||S.cool[tag+nb.j]>S.day)continue;const en=G.hostileAt(S,nb.j,tag),P=M.provs[nb.j];
      if(!en.length){const sc=5+P.vp;if(sc>bs){bs=sc;best={j:nb.j,empty:true}}continue}
      let def=0,att=0;for(const e of en)def+=G.stats(S,e).def*e.str*(1+e.dig)*(.5+.5*e.org);def*=D.TERRAIN[P.terr].def*(1+S.prov[nb.j].fort*.18);
      const group=[];for(const n2 of NB[nb.j]){if(n2.sea)continue;const g=byP.get(n2.j);if(g)for(const d of g.list)if(d.org>.72&&d.str>.55&&!d.path)group.push(d)}
      for(const d of group)att+=G.stats(S,d).att*d.str;const ratio=att/(def||1),thr=1.08+(o.attack>1?-.2:cau*.6)-(S.battles[nb.j]?.25:0)-(G.friendly(S,tag,S.prov[nb.j].owner)?.2:0);
      if(ratio>thr){const sc=ratio*(1+P.vp*.1);if(sc>bs){bs=sc;best={j:nb.j,group}}}else if(due&&ratio>.4&&group.length>=4&&(!urge||ratio>urge.ratio))urge={j:nb.j,group,ratio}}
    if(!best)continue;tried.add(best.j);launched=true;
    if(best.empty){const d=ready.sort((a,b)=>b.org-a.org)[0];if(ready.length>1||f.want<=1){d.path=[best.j];d.prog=0}}
    else{S.cool[tag+best.j]=S.day+14;const keep=new Map();for(const d of best.group){const k=keep.get(d.p)||0;if(k<1){keep.set(d.p,k+1);continue}d.path=[best.j];d.prog=0}}}
  if(launched)N.lastOff=S.day;
  else if(urge){N.lastOff=S.day;S.cool[tag+urge.j]=S.day+30;const keep=new Map();for(const d of urge.group){const k=keep.get(d.p)||0;if(k<1){keep.set(d.p,k+1);continue}d.path=[urge.j];d.prog=0}
    G.news(S,G.the(S,tag)+' opens a great offensive at '+M.provs[urge.j].name+'.','war')}};

/* ---------- monthly ---------- */
G.monthly=function(S){for(const tag of TAGS){const N=S.nat[tag];if(N.dead)continue;const war=G.inWar(S,tag),C=D.NATIONS[tag];
  if(war){const ml=N.lost-N.lostPrev;let own=0,occ=0,gain=0;for(let i=0;i<M.provs.length;i++){if(S.prov[i].owner===tag){own++;if(S.prov[i].ctrl!==tag)occ++}else if(S.prov[i].ctrl===tag)gain++}
    let yrs=0;for(const e of G.activeEnemies(S,tag)){const w=S.wars[wk(tag,e)];if(w)yrs=Math.max(yrs,(S.day-w.day)/365)}
    const occSh=own?occ/own:0;N.ws=clamp(N.ws-Math.max(0,yrs-2)*.45-.7-ml/(C.pop*1e6)*380+(gain>occ?.35:0)-occSh*2.5+(occ>0&&N.ws<45?.8:0),0,100);
    N.stab=clamp(N.stab-Math.max(0,yrs-3)*.3-.3-(N.ws<30?.9:0)+(D.CONS[N.cons].stab||0)*30+(D.ECON[N.econ].stab||0)*30-(G.blockaded(S,tag)?.6*(1+(N.mod.blockade||0)):0),0,100)}
  else{N.stab=clamp(N.stab+(N.stab<C.stab?.6:0),0,100);N.ws=clamp(N.ws+(N.ws<C.ws?.5:-.2),0,100);if(N.econ>1)N.econ=1;if(N.cons>2)N.cons=2}
  N.lostPrev=N.lost;
  /* a broken nation asks for terms */
  if(war&&!N.capit&&tag!==S.player&&(N.ws<10||N.stab<12)&&!S.flags['arm_'+tag+'_'+Math.floor(S.day/120)]){const side=G.sideOf(S,tag),lead=G.activeEnemies(S,tag).sort((a,b)=>S.nat[b].kills-S.nat[a].kills)[0];
    S.flags['arm_'+tag+'_'+Math.floor(S.day/120)]=S.day;if(lead===S.player)S.pending.push({id:'_armistice',tag:lead,data:{from:tag}});
    else if(lead&&G.rnd(S)<.75){G.news(S,G.the(S,tag)+' asks for an armistice. '+G.the(S,lead)+' accepts.','dip');G.treaty(S,[tag],G.enemies(S,tag).filter(t=>G.alive(S,t)),D.NATIONS[lead].dials.gru>.7?2:1)}}}
  for(const tag of TAGS)if(G.alive(S,tag))G.aiNavy(S,tag);for(let i=(S.wings||[]).length-1;i>=0;i--){const w=S.wings[i],N=S.nat[w.o];if(N.dead||N.capit)S.wings.splice(i,1);else if(!G.friendly(S,w.o,S.prov[w.p].ctrl)){if(N.cap>=0&&S.prov[N.cap].ctrl===w.o){w.p=N.cap;w.ready=S.day+5}else S.wings.splice(i,1)}}
  const anyWar=Object.keys(S.wars).length>0;if(!anyWar)G.tension(S,-.8);
  for(const k in S.cb)if(S.cb[k]<S.day-400)delete S.cb[k];
  S.says=S.says.filter(x=>x.until>=S.day)};

/* ---------- events ---------- */
G.fire=function(S,id,tag,data){const E=PK.EVENTS[id];if(!E)return;if(S.fired[id]===undefined&&id[0]!=='_'&&!E.fate)S.fired[id]=S.day;const N=S.nat[tag];if(!N||N.dead||(N.capit&&!E.evenIfDown))return;
  if(tag===S.player){S.pending.push({id,tag,data:data||null});return}
  const opts=E.opts(S,tag,data),o=G.pick(S,opts,x=>x.w===undefined?1:(typeof x.w==='function'?x.w(S,tag):x.w));o.fx&&o.fx(S,tag,data)};
G.resolve=function(S,i,oi){const pe=S.pending[i];if(!pe)return;const E=PK.EVENTS[pe.id],o=E.opts(S,pe.tag,pe.data)[oi];S.pending.splice(i,1);if(o&&o.fx)o.fx(S,pe.tag,pe.data);G.index(S)};
G.runEvents=function(S){for(const id in PK.EVENTS){const E=PK.EVENTS[id];if(id[0]==='_'||E.fate||S.fired[id]||!E.when||((E.scen||'1914')!==S.scen&&E.scen!=='any'))continue;if(E.when(S)){S.fired[id]=S.day;const tag=typeof E.tag==='function'?E.tag(S):E.tag;if(tag)G.fire(S,id,tag)}}
  for(let i=S.sched.length-1;i>=0;i--)if(S.sched[i].day<=S.day){const x=S.sched.splice(i,1)[0];G.fire(S,x.id,x.tag,x.data)}};
G.fate=function(S){const cards=Object.keys(PK.EVENTS).filter(id=>PK.EVENTS[id].fate);for(const tag of TAGS){const N=S.nat[tag];if(N.dead||N.capit)continue;if(G.rnd(S)>(tag===S.player?.3:D.NATIONS[tag].major?.16:.05))continue;
  const ok=cards.filter(id=>{const E=PK.EVENTS[id];return(!E.ok||E.ok(S,tag))&&!(S.flags['f_'+id+tag]>S.day-500)});if(!ok.length)continue;const id=G.pick(S,ok);S.flags['f_'+id+tag]=S.day;G.fire(S,id,tag)}};

/* ---------- the daily tick ---------- */
G.tick=function(S){if(S.pending.length)return false;S.day++;G.index(S);
  G.runEvents(S);if(G.checkCalls)G.checkCalls(S);
  for(const tag of TAGS){const N=S.nat[tag];if(N.dead||N.capit)continue;N._mp=G.manpower(S,tag);G.economy(S,tag)}
  let k=0;for(const tag of TAGS){k++;if((S.day+k)%3===0)G.aiMil(S,tag);if((S.day+k)%7===0)G.aiEcon(S,tag)}
  G.navalWar(S);G.moveAll(S);G.index(S);G.fight(S);G.index(S);G.supply(S);G.recover(S);
  if(S._ctrlDirty){S._ctrlDirty=false;G.checkCapit(S);G.supply(S);S.mapV=(S.mapV||0)+1}
  const dt=G.date(S.day);if(dt.d===1){G.monthly(S);G.fate(S);if(G.aiAmbition)G.aiAmbition(S);G.checkCapit(S);G.checkPeace(S)}
  return true};
G.save=S=>JSON.stringify(S,(k,v)=>k[0]==='_'?undefined:v);
G.load=function(str){const S=JSON.parse(str);if(S.v!==D.VERSION)return null;if(!S.scen){S.scen='1914';S.day0=D.START_DAY;S.end=D.SCEN['1914'].end}if(!S.own0)S.own0=S.prov.map(p=>p.owner);if(!S.wings)S.wings=[];if(!S.cool)S.cool={};for(const t of TAGS)if(!S.nat[t]){S.nat[t]={tag:t,dead:true,capit:false,cap:-1,faction:null,pp:0,stab:50,ws:50,cons:1,econ:0,stock:{},lines:[],build:[],recruit:[],tpls:[JSON.parse(JSON.stringify(D.TPL.small)),JSON.parse(JSON.stringify(D.TPL.cav))],tech:[],research:[],mod:{},builtCiv:0,builtMil:0,civ:0,mil:0,lost:0,lostPrev:0,kills:0,vp0:0,divs0:0,navy:1,auto:true,claims:[],armies:[],plans:[],plan:null};for(const e in D.EQUIP)S.nat[t].stock[e]=0;S.rel[t]={}}G.applyScen(S);G.index(S);G.supply(S);return S};
})(globalThis.PK=globalThis.PK||{});
