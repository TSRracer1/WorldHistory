/* Powder Keg — the board game. Turn-based, Risk-style rules on the campaign map.
   Territories are groups of the campaign's provinces. No DOM; the state is plain JSON. */
(function(PK){
PK.BOARD_FIRST=true;
const D=PK.DATA,G=PK.SIM,M=PK.MAP,B=PK.BOARD={};
const SEASONS=['Spring','Summer','Autumn','Winter'];
B.VERSION=1;

/* ---------- regions: hold every territory in one for extra armies each turn ---------- */
B.BONUS={'British Isles':2,France:3,'Low Countries':1,Germany:4,'Austria-Hungary':3,Italy:2,Balkans:3,Russia:3,'Poland & Baltic':2,Poland:3,Baltic:1,
  'Central Europe':2,Scandinavia:2,Iberia:1,Anatolia:2,'Middle East':1,'North Africa':1,Switzerland:0};
const NATREG={BEL:'Low Countries',NED:'Low Countries',LUX:'Low Countries',SWI:'Switzerland',SPA:'Iberia',POR:'Iberia',DEN:'Scandinavia',NOR:'Scandinavia',SWE:'Scandinavia',FIN:'Scandinavia',
  SER:'Balkans',MNT:'Balkans',ALB:'Balkans',GRE:'Balkans',BUL:'Balkans',ROM:'Balkans',PER:'Middle East',IRE:'British Isles',EST:'Baltic',LAT:'Baltic',LIT:'Baltic',DZG:'Baltic',HUN:'Central Europe',CZE:'Central Europe'};
const SHORT={GER:'Germany',AUS:'Austria-Hungary',RUS:'Russia',FRA:'France',ENG:'Britain',ITA:'Italy',OTT:'Ottoman Empire',SER:'Serbia',MNT:'Montenegro',ALB:'Albania',GRE:'Greece',BUL:'Bulgaria',
  ROM:'Romania',BEL:'Belgium',NED:'Netherlands',LUX:'Luxembourg',SWI:'Switzerland',SPA:'Spain',POR:'Portugal',DEN:'Denmark',NOR:'Norway',SWE:'Sweden',PER:'Persia',IRE:'Ireland',FIN:'Finland',
  EST:'Estonia',LAT:'Latvia',LIT:'Lithuania',DZG:'Danzig',HUN:'Hungary',CZE:'Czechoslovakia',POL:'Poland',UKR:'Ukraine'};

/* ---------- scenarios ---------- */
const S14=[['london','South England','British Isles'],['manchester','North England','British Isles'],['glasgow','Scotland','British Isles'],['dublin','Ireland','British Isles'],['cyprus','Cyprus','Middle East'],
 ['paris','Paris','France'],['reims','Champagne','France'],['nancy','Lorraine','France'],['brest','Brittany','France'],['bordeaux','Aquitaine','France'],['lyon','Lyon','France'],['marseille','Provence','France'],['algiers','Algeria','North Africa'],
 ['berlin','Brandenburg','Germany'],['hamburg','Hamburg','Germany'],['cologne','Rhineland','Germany'],['metz','Alsace-Lorraine','Germany'],['munich','Bavaria','Germany'],['saxony','Saxony','Germany'],['breslau','Silesia','Germany'],['danzig','West Prussia','Germany'],['konigsberg','East Prussia','Germany'],
 ['vienna','Austria','Austria-Hungary'],['tyrol','Tyrol','Austria-Hungary'],['prague','Bohemia','Austria-Hungary'],['budapest','Hungary','Austria-Hungary'],['kolozsvar','Transylvania','Austria-Hungary'],['zagreb','Croatia','Austria-Hungary'],['sarajevo','Bosnia','Austria-Hungary'],['lemberg','Galicia','Austria-Hungary'],
 ['rome','Rome','Italy'],['milan','Lombardy','Italy'],['venice','Venetia','Italy'],['naples','Naples','Italy'],['sicily','Sicily','Italy'],
 ['petersburg','Petrograd','Russia'],['helsinki','Finland','Scandinavia'],['riga','Courland','Poland & Baltic'],['vilna','Lithuania','Poland & Baltic'],['warsaw','Poland','Poland & Baltic'],['minsk','Byelorussia','Russia'],['moscow','Moscow','Russia'],
 ['kiev','Ukraine','Russia'],['odessa','Bessarabia','Russia'],['kharkov','Kharkov','Russia'],['rostov','Don','Russia'],['tiflis','Caucasus','Russia'],['saratov','Volga','Russia'],['vologda','North Russia','Russia'],
 ['constantinople','Constantinople','Anatolia'],['ankara','Anatolia','Anatolia'],['smyrna','Smyrna','Anatolia'],['erzurum','Armenia','Anatolia'],['aleppo','Syria','Middle East'],['mosul','Mesopotamia','Middle East']];
const S38=[['london','South England','British Isles'],['manchester','North England','British Isles'],['glasgow','Scotland','British Isles'],['cyprus','Cyprus','Middle East'],['mosul','Iraq','Middle East'],
 ['paris','Paris','France'],['reims','Champagne','France'],['nancy','Lorraine','France'],['brest','Brittany','France'],['bordeaux','Aquitaine','France'],['lyon','Lyon','France'],['marseille','Provence','France'],['algiers','Algeria','North Africa'],['damascus','Syria','Middle East'],
 ['berlin','Brandenburg','Germany'],['hamburg','Hamburg','Germany'],['cologne','Rhineland','Germany'],['munich','Bavaria','Germany'],['saxony','Saxony','Germany'],['breslau','Silesia','Germany'],['konigsberg','East Prussia','Germany'],['vienna','Austria','Germany'],
 ['warsaw','Warsaw','Poland'],['posen','Poznań','Poland'],['westprussia','The Corridor','Poland'],['krakow','Kraków','Poland'],['lemberg','Lwów','Poland'],['vilna','Wilno','Poland'],
 ['prague','Bohemia','Central Europe'],['sudeten','Sudetenland','Central Europe'],['brno','Slovakia','Central Europe'],
 ['bucharest','Wallachia','Balkans'],['kolozsvar','Transylvania','Balkans'],['belgrade','Serbia','Balkans'],['zagreb','Croatia','Balkans'],
 ['rome','Rome','Italy'],['milan','Lombardy','Italy'],['venice','Venetia','Italy'],['naples','Naples','Italy'],['sicily','Sicily','Italy'],
 ['constantinople','Istanbul','Anatolia'],['ankara','Anatolia','Anatolia'],['erzurum','Armenia','Anatolia'],
 ['petersburg','Leningrad','Russia'],['minsk','Byelorussia','Russia'],['moscow','Moscow','Russia'],['kiev','Ukraine','Russia'],['odessa','Odessa','Russia'],['kharkov','Kharkov','Russia'],['rostov','Don','Russia'],
 ['tiflis','Caucasus','Russia'],['saratov','Volga','Russia'],['vologda','North Russia','Russia']];
B.SCEN={
 '1914':{id:'1914',sim:'1914',name:'1914: The Great War',blurb:'The Archduke is dead and the great powers are at war. Can your side win before the winter of 1918?',
   year:1914,season:1,turns:18,seeds:S14,teams:{CP:{name:'Central Powers',members:['GER','AUS']},EN:{name:'Entente',members:['FRA','RUS','SER','MNT']}},
   playable:['GER','FRA','RUS','AUS','ENG','ITA','OTT','SER'],guarantees:[['ENG','BEL']],mult:{GER:1.35,FRA:1.05,RUS:.9,AUS:.95,ENG:.8,ITA:.85,OTT:.9},industry:{GER:3,AUS:1,FRA:1,ENG:1},
   real:'Germany went through Belgium and Britain joined at once. Italy and Romania joined the Entente, the Ottomans and Bulgaria the Central Powers. Russia collapsed into revolution in 1917, America came in, and Germany asked for an armistice in November 1918.'},
 '1938':{id:'1938',sim:'1936',name:'1938: The Second World War',blurb:'Germany has swallowed Austria and wants Czechoslovakia next. Stop it at Munich, or fight it later.',
   year:1938,season:2,turns:28,seeds:S38,owners:{AUS:'GER'},teams:{AX:{name:'Axis',members:['GER']},AL:{name:'Allies',members:[]}},
   playable:['ENG','FRA','POL','CZE'],guarantees:[],mult:{GER:2,FRA:1,ENG:.85,POL:.85,RUS:1,ITA:.85,CZE:1.1},industry:{GER:7,RUS:2,ENG:1,FRA:1},
   short:{RUS:'Soviet Union',OTT:'Turkey',SER:'Yugoslavia',AUS:'Austria'},
   real:'Britain and France gave way at Munich. Germany took Prague in March 1939 and invaded Poland that September. France fell in 1940, Germany attacked the Soviet Union in 1941, America joined that December, and Germany surrendered in May 1945.'}};
B.name=(st,t)=>((B.SCEN[st.scen].short||{})[t])||SHORT[t]||D.NATIONS[t].name;
B.season=(st,turn)=>{const k=B.SCEN[st.scen].season+(turn||st.turn)-1;return SEASONS[k%4]+' '+(B.SCEN[st.scen].year+Math.floor(k/4))};

/* ---------- building the board from the provinces ---------- */
const BUILT={};
B.board=function(scen){if(BUILT[scen])return BUILT[scen];const SC=B.SCEN[scen],S0=G.newGame('XXX',1,SC.sim),own=S0.prov.map(p=>(SC.owners&&SC.owners[p.owner])||p.owner),NB=G.NB,P=M.provs;
  const T=[],ptoT=P.map(()=>-1),seedOf={};
  for(const s of SC.seeds){const i=G.KEY[s[0]];if(i!==undefined&&ptoT[i]<0){ptoT[i]=T.length;T.push({name:s[1],region:s[2],owner:own[i],seed:i})}}
  /* every nation without a seed is one territory, centred on its capital */
  const tags=[...new Set(own)];for(const t of tags){if(T.some(x=>x.owner===t))continue;let cap=S0.nat[t]&&S0.nat[t].cap;if(cap===undefined||cap<0||own[cap]!==t)cap=own.indexOf(t);ptoT[cap]=T.length;T.push({name:SHORT[t]||D.NATIONS[t].name,region:NATREG[t]||'',owner:t,seed:cap})}
  /* grow each territory through its own nation's provinces, nearest seed first */
  let q=T.map((x,k)=>x.seed);while(q.length){const nq=[];for(const i of q)for(const nb of NB[i])if(ptoT[nb.j]<0&&own[nb.j]===own[i]){ptoT[nb.j]=ptoT[i];nq.push(nb.j)}q=nq}
  for(let i=0;i<P.length;i++)if(ptoT[i]<0){ptoT[i]=T.length;T.push({name:P[i].name,region:NATREG[own[i]]||'',owner:own[i],seed:i});let q2=[i];while(q2.length){const n2=[];for(const u of q2)for(const nb of NB[u])if(ptoT[nb.j]<0&&own[nb.j]===own[i]){ptoT[nb.j]=ptoT[i];n2.push(nb.j)}q2=n2}}
  T.forEach((t,k)=>{t.id=k;t.provs=[];t.vp=0;t.ind=0});P.forEach((p,i)=>{const t=T[ptoT[i]];t.provs.push(i);t.vp+=p.vp;t.ind+=p.ind});
  for(const t of T){let ax=0,ay=0,aw=0;for(const i of t.provs){const w=Math.max(1,P[i].area);ax+=P[i].cx*w;ay+=P[i].cy*w;aw+=w}ax/=aw;ay/=aw;let best=t.provs[0],bd=1e18;for(const i of t.provs){const d=(P[i].cx-ax)**2+(P[i].cy-ay)**2;if(d<bd){bd=d;best=i}}t.cx=P[best].cx;t.cy=P[best].cy}
  const adj=T.map(()=>new Map());for(let i=0;i<P.length;i++)for(const nb of NB[i]){const a=ptoT[i],b=ptoT[nb.j];if(a===b)continue;if(!adj[a].has(b)||!nb.sea)adj[a].set(b,nb.sea);if(!adj[b].has(a)||!nb.sea)adj[b].set(a,nb.sea)}
  const caps={};for(const t of tags){const c=S0.nat[t]&&S0.nat[t].cap;if(c!==undefined&&c>=0&&own[c]===t)caps[t]=ptoT[c];else{const any=T.filter(x=>x.owner===t).sort((a,b)=>b.vp-a.vp)[0];if(any)caps[t]=any.id}}
  if(SC.owners)for(const from in SC.owners){const to=SC.owners[from];delete caps[from];if(caps[to]===undefined){const any=T.filter(x=>x.owner===to).sort((a,b)=>b.vp-a.vp)[0];if(any)caps[to]=any.id}}
  const regions={};for(const t of T)if(t.region)(regions[t.region]=regions[t.region]||[]).push(t.id);
  return BUILT[scen]={T,ptoT,adj:adj.map(m=>[...m].map(([t,sea])=>({t,sea}))),caps,regions,tags:tags.filter(t=>T.some(x=>x.owner===t))}};

/* ---------- dice ---------- */
const OUT={};for(let a=1;a<=3;a++)for(let d=1;d<=2;d++){const res={},n=Math.pow(6,a+d);const roll=(k,arr)=>{if(k===a+d){const A=arr.slice(0,a).sort((x,y)=>y-x),Dd=arr.slice(a).sort((x,y)=>y-x);let la=0,ld=0;for(let i=0;i<Math.min(a,d);i++){if(A[i]>Dd[i])ld++;else la++}const key=la+','+ld;res[key]=(res[key]||0)+1;return}for(let v=1;v<=6;v++){arr[k]=v;roll(k+1,arr)}};roll(0,[]);OUT[a+''+d]=Object.entries(res).map(([k,c])=>{const[la,ld]=k.split(',').map(Number);return{la,ld,p:c/n}})}
const WC=new Map();
/* chance that an attack with A spare armies against D defenders, kept up until one side is gone, takes the territory */
B.winChance=function(A,D){A=Math.min(A,45);D=Math.min(D,45);if(D<=0)return 1;if(A<=0)return 0;const k=A*64+D;if(WC.has(k))return WC.get(k);const a=Math.min(3,A),d=Math.min(2,D);let p=0;for(const o of OUT[a+''+d])p+=o.p*B.winChance(A-o.la,D-o.ld);WC.set(k,p);return p};
function rnd(st){let t=st.rng=(st.rng+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const die=st=>1+Math.floor(rnd(st)*6);
B.rnd=rnd;

/* ---------- relations ---------- */
const pk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
B.active=(st,t)=>!!st.nat[t]&&!st.nat[t].out;
B.hostile=function(st,a,b){if(!a||!b||a===b)return false;const A=st.nat[a],Bn=st.nat[b];if(!A||!Bn||A.out||Bn.out)return false;if(st.truce[pk(a,b)]>=st.turn)return false;if(A.team&&Bn.team)return A.team!==Bn.team;return !!st.wars[pk(a,b)]};
B.other=(st,team)=>Object.keys(st.teams).find(k=>k!==team);
B.members=(st,team)=>B.board(st.scen).tags.filter(t=>st.nat[t]&&st.nat[t].team===team&&!st.nat[t].out);
B.major=t=>!!D.NATIONS[t].major||['POL','CZE'].includes(t);
/* the powers whose defeat ends a war: Poland and Czechoslovakia count as large for armies, not for this */
B.great=t=>!!D.BASE_NATIONS[t].major;
function news(st,text){st.news.push(text);st.log.push({turn:st.turn,text});if(st.log.length>300)st.log.shift()}
B.join=function(st,t,team,quiet){const N=st.nat[t];if(!N||N.out||N.team===team)return;N.team=team;if(B.great(t))st.had[team]=true;delete st.truce[pk(t,'')];for(const k in st.wars){const[a,b]=k.split('|');if((a===t&&st.nat[b].team===team)||(b===t&&st.nat[a].team===team))delete st.wars[k]}
  if(!quiet)news(st,B.name(st,t)+' joins the '+st.teams[team].name+'.')};
/* a attacks (or declares war on) b. Pair-only wars bring nobody else in. */
B.declare=function(st,a,b,o){o=o||{};if(a===b||B.hostile(st,a,b)||!B.active(st,a)||!B.active(st,b))return;const A=st.nat[a],Bn=st.nat[b];
  if(o.pair){st.wars[pk(a,b)]=1;news(st,B.name(st,a)+' attacks '+B.name(st,b)+'.');return}
  if(!A.team&&Bn.team)B.join(st,a,B.other(st,Bn.team));else if(A.team&&!Bn.team)B.join(st,b,B.other(st,A.team));else if(!A.team&&!Bn.team)st.wars[pk(a,b)]=1;
  news(st,B.name(st,a)+' declares war on '+B.name(st,b)+'.');
  for(const[g,v]of st.guar)if(v===b&&g!==a&&B.active(st,g)&&!B.hostile(st,g,a)&&st.nat[a].team){if(g===st.player)st.cards.push({id:'_guarantee',data:{g,v,a}});else if(rnd(st)<.92){B.join(st,g,B.other(st,st.nat[a].team));news(st,B.name(st,g)+' keeps its promise to '+B.name(st,v)+'.')}}};
B.surrender=function(st,t,why){const N=st.nat[t];if(!N||N.out)return;N.out=true;for(const k in st.wars)if(k.split('|').includes(t))delete st.wars[k];
  for(const x of st.terr)if(x.o===t)x.a=Math.max(1,Math.floor(x.a/2));news(st,why||(B.name(st,t)+' surrenders and leaves the war.'));if(t===st.player)B.finish(st,'defeat');else B.checkWin(st)};
B.give=function(st,ids,to){for(const id of ids){const x=st.terr[id];if(!x)continue;x.o=to;x.a=Math.max(1,x.a)}};

/* ---------- game setup ---------- */
B.newGame=function(scen,player,diff,seed){const SC=B.SCEN[scen],BD=B.board(scen);G.applyScen({scen:SC.sim,natOv:{}});
  const st={v:B.VERSION,scen,player,diff:diff||'easy',seed:seed|0,rng:seed|0,turn:1,phase:'place',toPlace:0,moved:false,teams:{},nat:{},wars:{},truce:{},had:{},treaties:[],guar:SC.guarantees.map(g=>g.slice()),terr:[],flags:{},fired:{},cards:[],news:[],log:[],result:null,net:{},first:true};
  for(const k in SC.teams){st.teams[k]={name:SC.teams[k].name};st.net[k]=0}
  for(const t of BD.tags)st.nat[t]={team:null,out:false,cap:BD.caps[t]};
  for(const k in SC.teams)for(const t of SC.teams[k].members)if(st.nat[t]){st.nat[t].team=k;if(B.great(t))st.had[k]=true}
  for(const t of BD.T){const maj=B.major(t.owner),str=t.vp+t.ind,m=(SC.mult[t.owner]||1);st.terr.push({o:t.owner,a:maj?Math.max(3,Math.min(14,Math.round((3+str/5)*m))):Math.max(2,Math.min(6,Math.round(1.5+str/7))),a0:0})}
  for(const t of BD.tags){const c=st.nat[t].cap;if(c!==undefined&&B.major(t))st.terr[c].a+=2}
  st.terr.forEach(x=>x.o0=x.o);
  B.startRound(st);return st};

/* ---------- reinforcements ---------- */
B.reinforcements=function(st,t){const BD=B.board(st.scen),N=st.nat[t],parts=[];if(!N||N.out)return{total:0,parts};const mine=st.terr.filter(x=>x.o===t).length,maj=B.major(t);
  parts.push([mine+' territories',maj?Math.max(3,Math.floor(mine/3)):Math.max(1,Math.floor(mine/3))]);
  for(const r in BD.regions){const ids=BD.regions[r];if(ids.length>1&&B.BONUS[r]&&ids.every(id=>st.terr[id].o===t))parts.push(['All of '+r,B.BONUS[r]])}
  if(maj&&N.cap!==undefined&&st.terr[N.cap].o===t)parts.push(['Your capital',2]);
  const ind=(B.SCEN[st.scen].industry||{})[t];if(ind&&st.terr.filter(x=>x.o===t&&x.o0===t).length>=st.terr.filter(x=>x.o0===t).length*.6)parts.push(['Industry',ind]);
  if(st.flags.usa&&N.team===st.flags.usa&&(t==='ENG'||t==='FRA'||(t==='RUS'&&!B.active(st,'FRA')&&!B.active(st,'ENG'))))parts.push(['American help',3]);
  if(st.flags.uboats&&t==='ENG'&&st.turn<st.flags.uboats)parts.push(['Submarine war',-2]);
  if(st.flags.fareast&&t==='ENG'&&st.turn<st.flags.fareast)parts.push(['War in the Far East',-2]);
  let total=parts.reduce((s,p)=>s+p[1],0);const vsPlayer=st.player&&st.nat[st.player]&&B.hostile(st,t,st.player);
  if(t===st.player&&st.diff==='easy'){const extra=Math.ceil(total*.5);parts.push(['Easy',extra]);total+=extra}
  if(t!==st.player&&vsPlayer&&st.diff==='hard'){const extra=Math.ceil(total*.25);parts.push(['Hard',extra]);total+=extra}
  if(t!==st.player&&vsPlayer&&st.diff==='easy'){const cut=-Math.floor(total*.2);if(cut){parts.push(['Easy',cut]);total+=cut}}
  return{total:Math.max(1,total),parts}};

/* ---------- player actions ---------- */
B.place=function(st,id,n){const x=st.terr[id];if(st.phase!=='place'||x.o!==st.player)return'Place armies on your own territories.';n=Math.max(1,Math.min(n||1,st.toPlace));x.a+=n;st.toPlace-=n;if(st.toPlace<=0)st.phase='attack';return''};
B.autoPlace=function(st){if(st.phase!=='place')return;placeAI(st,st.player,st.toPlace);st.toPlace=0;st.phase='attack'};
/* why a territory cannot be attacked, or '' */
B.canAttack=function(st,from,to,tag){tag=tag||st.player;const BD=B.board(st.scen),a=st.terr[from],d=st.terr[to];if(!a||!d)return'?';if(a.o!==tag)return'Start from one of your territories.';if(a.a<2)return'You need at least 2 armies to attack from here.';
  if(!BD.adj[from].some(e=>e.t===to))return'That territory is not next to '+BD.T[from].name+'.';if(d.o===tag)return'That is already yours.';const o=st.nat[d.o];if(!o||o.out)return B.name(st,d.o)+' has left the war and cannot be attacked.';
  if(st.nat[tag].team&&o.team===st.nat[tag].team)return B.name(st,d.o)+' is on your side.';const tr=st.truce[pk(tag,d.o)];if(tr>=st.turn)return'You made peace with '+B.name(st,d.o)+'. You cannot attack it again until '+B.season(st,tr+1)+'.';return''};
/* what attacking would set off, as plain sentences */
B.warning=function(st,from,to){const d=st.terr[to],me=st.player,o=d.o;if(B.hostile(st,me,o))return'';const N=st.nat[me],O=st.nat[o],out=[];
  out.push(B.name(st,o)+' is not at war with you. Attacking starts a war.');if(!N.team&&O.team)out.push('You will join the '+st.teams[B.other(st,O.team)].name+'.');
  if(N.team&&!O.team)out.push(B.name(st,o)+' will join the '+st.teams[B.other(st,N.team)].name+'.');
  for(const[g,v]of st.guar)if(v===o&&g!==me&&B.active(st,g)&&!B.hostile(st,g,me)&&N.team)out.push(B.name(st,g)+' has promised to protect '+B.name(st,o)+' and will almost certainly declare war on you.');return out.join(' ')};
/* one roll of the dice */
B.roll=function(st,from,to,tag){tag=tag||st.player;const a=st.terr[from],d=st.terr[to];if(!B.hostile(st,tag,d.o))B.declare(st,tag,d.o);if(st.result)return null;
  const na=Math.min(3,a.a-1),nd=Math.min(2,d.a),A=[],Dd=[];for(let i=0;i<na;i++)A.push(die(st));for(let i=0;i<nd;i++)Dd.push(die(st));A.sort((x,y)=>y-x);Dd.sort((x,y)=>y-x);
  let la=0,ld=0;for(let i=0;i<Math.min(na,nd);i++){if(A[i]>Dd[i])ld++;else la++}a.a-=la;d.a-=ld;const r={A,D:Dd,la,ld,won:false};
  if(d.a<=0){r.won=true;conquer(st,from,to,tag,na)}return r};
/* keep rolling until the territory falls or the attackers are down to one */
B.blitz=function(st,from,to,tag,stopAt){const rs=[];stopAt=stopAt||1;while(st.terr[from].a>stopAt&&st.terr[to].o!==(tag||st.player)){const r=B.roll(st,from,to,tag);if(!r)break;rs.push(r);if(r.won)break}return rs};
function conquer(st,from,to,tag,dice){const d=st.terr[to],loser=d.o,BD=B.board(st.scen);d.o=tag;d.a=0;const move=Math.min(st.terr[from].a-1,Math.max(1,dice));st.terr[from].a-=move;d.a=move;
  const tt=st.nat[tag].team,lt=st.nat[loser]&&st.nat[loser].team;if(tt&&lt&&tt!==lt){st.net[tt]++;st.net[lt]--}
  news(st,B.name(st,tag)+' takes '+BD.T[to].name+' from '+B.name(st,loser)+'.');
  if(tag===st.player){const max=st.terr[from].a-1;if(max>0)st.pendingMove={from,to,min:0,max}}
  if(st.nat[loser].cap===to)news(st,B.name(st,loser)+' has lost its capital.');
  if(!st.terr.some(x=>x.o===loser))B.surrender(st,loser,B.name(st,loser)+' has lost its last territory.');
  B.checkWin(st)}
B.moveIn=function(st,n){const m=st.pendingMove;if(!m)return;n=Math.max(m.min,Math.min(m.max,n|0));st.terr[m.from].a-=n;st.terr[m.to].a+=n;st.pendingMove=null};
B.endAttacks=function(st){if(st.pendingMove)B.moveIn(st,0);if(st.phase==='attack')st.phase='move'};
/* own territories reachable from one through your own land */
B.reach=function(st,from,tag){tag=tag||st.player;const BD=B.board(st.scen),seen=new Set([from]),q=[from];while(q.length){const u=q.pop();for(const e of BD.adj[u])if(!seen.has(e.t)&&st.terr[e.t].o===tag){seen.add(e.t);q.push(e.t)}}seen.delete(from);return seen};
B.fortify=function(st,from,to,n){if(st.phase!=='move'||st.moved)return'You have already moved this turn.';const a=st.terr[from];if(a.o!==st.player||st.terr[to].o!==st.player)return'Move between your own territories.';
  if(!B.reach(st,from).has(to))return'Those two are not connected through your own territories.';n=Math.max(1,Math.min(a.a-1,n|0));if(n<1)return'Leave at least one army behind.';a.a-=n;st.terr[to].a+=n;st.moved=true;return''};

/* ---------- computer players ---------- */
function threat(st,t,id){const BD=B.board(st.scen);let th=0,front=false;for(const e of BD.adj[id]){const x=st.terr[e.t];if(B.hostile(st,t,x.o)){front=true;th+=x.a}}return{front,th}}
function placeAI(st,t,n){const BD=B.board(st.scen),mine=st.terr.map((x,i)=>i).filter(i=>st.terr[i].o===t);if(!mine.length)return;const add={};
  for(let k=0;k<n;k++){let best=mine[0],bv=-1e9;for(const i of mine){const{front,th}=threat(st,t,i),cap=st.nat[t].cap===i?3:0,v=(front?10+th-(st.terr[i].a+(add[i]||0)):-50)+cap+(front?0:cap*3-(add[i]||0));if(v>bv){bv=v;best=i}}add[best]=(add[best]||0)+1}
  for(const i in add)st.terr[i].a+=add[i]}
const THR={easy:.72,normal:.6,hard:.5};
B.aiTurn=function(st,t){if(!B.active(st,t))return;const BD=B.board(st.scen);placeAI(st,t,B.reinforcements(st,t).total);const thr=st.player&&B.hostile(st,t,st.player)?THR[st.diff]:.6;
  const cap={easy:2,normal:3,hard:4}[st.player&&B.hostile(st,t,st.player)?st.diff:'normal'];let won=0,fromPlayer=0;
  /* no enemy takes more than a few of the player's territories in one turn, so a player is never wiped out before getting a move */
  const pcap={easy:1,normal:2,hard:3}[st.diff]-(st.turn===1?1:0);
  for(let n=0;n<14&&!st.result&&won<cap;n++){let best=null,bs=0;for(let i=0;i<st.terr.length;i++){const a=st.terr[i];if(a.o!==t||a.a<3)continue;for(const e of BD.adj[i]){const d=st.terr[e.t];if(!B.hostile(st,t,d.o))continue;
      if(d.o===st.player&&fromPlayer>=pcap)continue;const p=B.winChance(a.a-1,d.a);if(p<thr)continue;const val=1+(st.nat[d.o].cap===e.t?4:0)+BD.T[e.t].vp/20+(BD.T[e.t].region&&BD.regions[BD.T[e.t].region].every(id=>id===e.t||st.terr[id].o===t)?2:0);if(p*val>bs){bs=p*val;best=[i,e.t]}}}
    if(!best)break;const wasP=st.terr[best[1]].o===st.player;B.blitz(st,best[0],best[1],t,2);if(st.terr[best[1]].o===t){won++;if(wasP)fromPlayer++;const f=st.terr[best[0]],d=st.terr[best[1]],keep=threat(st,t,best[0]).front?Math.ceil(f.a/3):1,mv=Math.max(0,f.a-keep);f.a-=mv;d.a+=mv}}
  /* one move from the quiet rear to the busiest front */
  let from=-1,fa=1;for(let i=0;i<st.terr.length;i++){const x=st.terr[i];if(x.o===t&&x.a>fa&&!threat(st,t,i).front){fa=x.a;from=i}}
  if(from>=0){let to=-1,tv=-1e9;for(const j of B.reach(st,from,t)){const{front,th}=threat(st,t,j);if(front&&th-st.terr[j].a>tv){tv=th-st.terr[j].a;to=j}}if(to>=0){const n=st.terr[from].a-1;st.terr[from].a-=n;st.terr[to].a+=n}}};

/* ---------- rounds ---------- */
B.order=st=>B.board(st.scen).tags.filter(t=>B.active(st,t)&&(st.nat[t].team||B.major(t)||Object.keys(st.wars).some(k=>k.split('|').includes(t))));
B.startRound=function(st){st.news=[];if(st.result)return;B.runEvents(st);if(st.turn>1)B.aiPeace(st);st.moved=false;st.pendingMove=null;if(st.result)return;
  if(st.player&&st.nat[st.player]){st.toPlace=B.reinforcements(st,st.player).total;st.phase='place'}else st.phase='ai'};
B.endTurn=function(st){if(st.result)return;if(st.pendingMove)B.moveIn(st,0);st.phase='ai';st.first=false;for(const t of B.order(st)){if(t===st.player)continue;B.aiTurn(st,t);if(st.result)return}
  st.turn++;if(st.turn>B.SCEN[st.scen].turns){B.finishByScore(st);return}B.startRound(st)};
/* a whole game for computer-only tests: the player's seat is played by the computer too */
B.autoTurn=function(st){if(st.result)return;if(st.cards.length){while(st.cards.length)B.resolve(st,0,B.pickAI(st,st.cards[0]));if(st.table){const b=st.table.with;st.table=null;if(B.hostile(st,st.player,b))B.makePeace(st,st.player,b,B.bestDeal(st,st.player,b))}if(st.result)return}if(st.phase==='place')B.autoPlace(st);B.aiAttackFor(st);B.endTurn(st)};
B.aiAttackFor=function(st){const t=st.player;if(!B.active(st,t))return;const BD=B.board(st.scen);for(let n=0;n<4&&!st.result;n++){let best=null,bs=0;for(let i=0;i<st.terr.length;i++){const a=st.terr[i];if(a.o!==t||a.a<3)continue;for(const e of BD.adj[i]){const d=st.terr[e.t];if(!B.hostile(st,t,d.o))continue;const p=B.winChance(a.a-1,d.a);if(p>.6&&p>bs){bs=p;best=[i,e.t]}}}
    if(!best)break;B.blitz(st,best[0],best[1],t,2);if(st.pendingMove)B.moveIn(st,Math.floor(st.pendingMove.max*.6))}st.phase='move'};

/* ---------- winning ---------- */
B.checkWin=function(st){if(st.result)return;const ks=Object.keys(st.teams),alive=ks.map(k=>B.members(st,k).filter(B.great).length),fought=ks.map(k=>!!st.had[k]);
  for(let i=0;i<2;i++)if(fought[i]&&fought[1-i]&&!alive[i]&&alive[1-i]){B.finish(st,null,ks[1-i]);return}};
B.finishByScore=function(st){const ks=Object.keys(st.teams);let w=null;const outs=ks.map(k=>st.treaties.filter(x=>x.loserTeam===k&&B.great(x.loser)).length);
  if(outs[0]!==outs[1])w=ks[outs[0]<outs[1]?1:0];else if(Math.abs(st.net[ks[0]]-st.net[ks[1]])>2)w=ks[st.net[ks[0]]>st.net[ks[1]]?0:1];B.finish(st,null,w,true)};
B.finish=function(st,forced,winner,timeUp){if(st.result)return;const me=st.player&&st.nat[st.player],mt=me&&me.team;let r=forced;
  if(!r){if(!me)r=winner?'watch':'draw';else if(!mt)r='neutral';else if(!winner)r='draw';else r=winner===mt?'victory':'defeat'}
  st.result={r,winner:winner||null,turn:st.turn,timeUp:!!timeUp};st.phase='over';
  news(st,winner?('The '+st.teams[winner].name+' have won the war.'):r==='defeat'?'Your nation has surrendered.':'The war ends with neither side beaten.')};

/* ---------- peace ----------
   How the war between a and b stands, from a's side: land taken from each other, capitals held, and the size of the armies. */
B.score=function(st,a,b){let s=0,aa=0,ba=0;for(let i=0;i<st.terr.length;i++){const x=st.terr[i];if(x.o0===b&&x.o===a)s+=2;if(x.o0===a&&x.o===b)s-=2;if(x.o===a)aa+=x.a;if(x.o===b)ba+=x.a}
  const ca=st.nat[a].cap,cb=st.nat[b].cap;if(cb!==undefined&&st.terr[cb].o===a)s+=6;if(ca!==undefined&&st.terr[ca].o===b)s-=6;if(aa+ba)s+=Math.round(4*(aa-ba)/(aa+ba));return s};
/* what a deal asks of b: keeping land you hold is cheap, taking land you never reached costs more, a capital costs most */
B.cost=function(st,a,b,id,dir){const x=st.terr[id];if(dir>0)return x.o===a?2:5;return-(x.o===b?2:3)};
B.price=function(st,a,b,deal){let p=0;for(const id of deal.take)p+=B.cost(st,a,b,id,1);for(const id of deal.give)p+=B.cost(st,a,b,id,-1);return p};
/* territories that can be part of a peace between a and b */
B.peaceItems=function(st,a,b){const BD=B.board(st.scen),near=id=>BD.adj[id].some(e=>{const o=st.terr[e.t].o;return o===a||o===b});const take=[],give=[];
  for(let i=0;i<st.terr.length;i++){const x=st.terr[i];if(x.o===b&&(x.o0===a||near(i)))take.push(i);else if(x.o===a&&x.o0===b)take.push(i);if(x.o===a&&(x.o0===b||BD.adj[i].some(e=>st.terr[e.t].o===b)))give.push(i);else if(x.o===b&&x.o0===a)give.push(i)}
  const caps=new Set([st.nat[a].cap,st.nat[b].cap]);/* capitals are never part of a peace */
  return{take:[...new Set(take)].filter(i=>!caps.has(i)),give:[...new Set(give)].filter(i=>!take.includes(i)&&!caps.has(i))}};
B.limit=function(st,a,b){return B.score(st,a,b)+(st.nat[b].cap!==undefined&&st.terr[st.nat[b].cap].o!==b?2:0)};
B.accepts=function(st,a,b,deal){if(deal.take.length&&st.terr.filter(x=>x.o===b).every((x,i)=>deal.take.includes(st.terr.indexOf(x))))return false;return B.price(st,a,b,deal)<=B.limit(st,a,b)};
/* the best deal b will accept, for a computer-run a */
B.bestDeal=function(st,a,b){const items=B.peaceItems(st,a,b),deal={take:[],give:[]},lim=B.limit(st,a,b);
  /* first keep what a holds of b's, then return what b holds of a's, then reach further */
  const held=items.take.filter(i=>st.terr[i].o===a),back=items.take.filter(i=>st.terr[i].o===b&&st.terr[i].o0===a),more=items.take.filter(i=>st.terr[i].o===b&&st.terr[i].o0!==a).sort((x,y)=>B.board(st.scen).T[y].vp-B.board(st.scen).T[x].vp);
  let extra=0;for(const i of held.concat(back,more)){if(more.includes(i)&&extra>=2)continue;deal.take.push(i);if(!B.accepts(st,a,b,deal))deal.take.pop();else if(more.includes(i))extra++}
  if(!B.accepts(st,a,b,deal)){deal.take=[];for(const i of items.give){deal.give.push(i);if(B.accepts(st,a,b,deal))break}}return deal};
B.makePeace=function(st,a,b,deal){const BD=B.board(st.scen),move=(id,to)=>{const x=st.terr[id],from=x.o;if(x.o===to)return;const home=BD.adj[id].map(e=>e.t).find(j=>st.terr[j].o===from);if(home!==undefined)st.terr[home].a+=Math.max(0,x.a-1);x.o=to;x.a=1};
  for(const id of deal.take)move(id,a);for(const id of deal.give)move(id,b);
  const sa=B.score(st,a,b),loser=sa>=0?b:a,winner=loser===a?b:a,lt=st.nat[loser].team;delete st.wars[pk(a,b)];st.truce[pk(a,b)]=st.turn+4;
  if(lt&&st.nat[winner].team&&lt!==st.nat[winner].team){st.nat[loser].team=null;st.truce[pk(loser,'')]=1}
  st.treaties.push({turn:st.turn,a,b,winner,loser,loserTeam:lt,take:deal.take.slice(),give:deal.give.slice()});
  const nmT=ids=>ids.map(i=>BD.T[i].name).join(', ');
  news(st,'Peace between '+B.name(st,a)+' and '+B.name(st,b)+'.'+(deal.take.length?' '+B.name(st,b)+' hands over '+nmT(deal.take)+'.':'')+(deal.give.length?' '+B.name(st,a)+' hands over '+nmT(deal.give)+'.':'')+(lt&&st.nat[loser].team===null?' '+B.name(st,loser)+' leaves the war.':''));
  if(!st.terr.some(x=>x.o===loser))B.surrender(st,loser);B.checkWin(st)};
/* nations that are losing ask the enemy holding most of their land for terms */
B.aiPeace=function(st){for(const t of B.board(st.scen).tags){if(!B.active(st,t)||st.result)continue;const foes=B.board(st.scen).tags.filter(x=>B.hostile(st,t,x));if(!foes.length)continue;
  const capLost=st.nat[t].cap!==undefined&&st.terr[st.nat[t].cap].o!==t,own0=st.terr.filter(x=>x.o0===t).length||1,lostN=st.terr.filter(x=>x.o0===t&&x.o!==t).length;
  const enemy=foes.map(f=>[f,st.terr.filter(x=>x.o0===t&&x.o===f).length]).sort((x,y)=>y[1]-x[1])[0];if(!enemy||!enemy[1])continue;const w=enemy[0];
  const big=B.major(t),desperate=big?((capLost&&lostN/own0>=.4)||B.score(st,t,w)<=-14):(capLost||lostN/own0>=.5);if(!desperate||(t===st.player))continue;if(B.rnd(st)>(capLost?.75:.4))continue;
  if(w===st.player){if(!st.cards.some(c=>c.id==='_peaceAsk'&&c.data.from===t))st.cards.push({id:'_peaceAsk',data:{from:t}});continue}
  B.makePeace(st,w,t,B.bestDeal(st,w,t))}
  /* the enemy offers the player terms when the player's own capital has fallen */
  const p=st.player;if(p&&B.active(st,p)&&st.nat[p].cap!==undefined){const holder=st.terr[st.nat[p].cap].o;if(holder!==p&&B.hostile(st,p,holder)&&!st.cards.some(c=>c.id==='_peaceTerms')&&!(st.flags.refusedTerms>=st.turn-1)){st.cards.push({id:'_peaceTerms',data:{from:holder,deal:B.bestDeal(st,holder,p)}})}}};
/* the player asks an enemy for peace with a deal of their own */
B.propose=function(st,b,deal){const a=st.player;if(!B.hostile(st,a,b))return'You are not at war with '+B.name(st,b)+'.';if(!B.accepts(st,a,b,deal))return B.name(st,b)+' refuses. You are asking for more than the war has won you.';B.makePeace(st,a,b,deal);return''};

/* ---------- telegrams ---------- */
const EV=B.EVENTS={};
B.pickAI=function(st,card){const E=B.card(card),opts=E.opts(st,card.data);let tot=0;const w=opts.map(o=>{const v=typeof o.w==='function'?o.w(st):(o.w===undefined?1:o.w);tot+=Math.max(0,v);return Math.max(0,v)});let r=rnd(st)*tot;for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i}return 0};
const GUAR={title:'A promise falls due',text:(st,d)=>B.name(st,d.a)+' has attacked '+B.name(st,d.v)+'. You promised to protect '+B.name(st,d.v)+'.',
  opts:(st,d)=>[{label:'Keep the promise. Declare war on '+B.name(st,d.a)+'.',fx(st){B.join(st,d.g,B.other(st,st.nat[d.a].team))}},{label:'Stay out of it.',fx(st){news(st,B.name(st,d.g)+' breaks its promise to '+B.name(st,d.v)+'.')}}]};
const PASK={title:'A request for peace',text:(st,d)=>B.name(st,d.from)+' asks for peace. You decide the terms at the peace table: which territories you keep, which you demand, which you hand back.',
  opts:(st,d)=>[{label:'Go to the peace table.',table:true,fx(st){st.table={with:d.from}}},{label:'Refuse. Fight on.',fx(st){news(st,'You refuse to talk to '+B.name(st,d.from)+'.')}}]};
const PTERMS={title:'Terms are offered',text:(st,d)=>{const BD=B.board(st.scen),t=d.deal.take.map(i=>BD.T[i].name),g=d.deal.give.map(i=>BD.T[i].name);return B.name(st,d.from)+' holds your capital and offers peace. You would hand over: '+(t.length?t.join(', '):'nothing')+'.'+(g.length?' You would get back: '+g.join(', ')+'.':'')+' If you accept, you leave the war.'},
  opts:(st,d)=>[{label:'Accept the terms.',w:80,fx(st){B.makePeace(st,d.from,st.player,d.deal)}},{label:'Refuse and fight on.',w:20,fx(st){st.flags.refusedTerms=st.turn;news(st,'You refuse the terms.')}}]};
B.card=c=>c.id==='_guarantee'?GUAR:c.id==='_peaceAsk'?PASK:c.id==='_peaceTerms'?PTERMS:EV[c.id];
B.resolve=function(st,i,oi){const c=st.cards[i];if(!c)return;const E=B.card(c),o=E.opts(st,c.data)[oi];st.cards.splice(i,1);if(c.data&&c.data.from&&!B.active(st,c.data.from))return;if(o&&o.fx)o.fx(st,c.data);B.checkWin(st);if(st.phase==='place'&&st.player&&st.nat[st.player])st.toPlace=Math.max(st.toPlace,0)};
B.runEvents=function(st){for(const id in EV){const E=EV[id];if(E.scen!==st.scen||st.fired[id])continue;const[t0,t1]=Array.isArray(E.turn)?E.turn:[E.turn,E.turn];if(st.turn<t0||st.turn>t1)continue;if(E.when&&!E.when(st))continue;
    const who=E.who?E.who(st):null;if(who&&!B.active(st,who))continue;st.fired[id]=st.turn;if(who&&who===st.player){st.cards.push({id});continue}const opts=E.opts(st);const oi=B.pickAI(st,{id});if(opts[oi].fx)opts[oi].fx(st);if(st.result)return}};
const ev=(id,o)=>{EV[id]=o};
const act=B.active,host=B.hostile,dec=B.declare,join=B.join,nm=B.name;
const terrOf=(st,name)=>B.board(st.scen).T.findIndex(t=>t.name===name);
const lost=(st,t)=>st.terr.filter(x=>x.o0===t&&x.o!==t).length;

/* 1914 */
ev('schlieffen',{scen:'1914',turn:1,who:()=> 'GER',title:'The plan for the west',text:'France must be beaten in six weeks, before Russia is ready. The quickest road to Paris runs through Belgium, which is neutral. Britain has promised to protect Belgium.',
 opts:()=>[{label:'March through Belgium.',tip:'Belgium and Britain go to war with you. Paris is closer.',w:80,fx(st){dec(st,'GER','BEL');dec(st,'GER','LUX');st.flags.belgium=1}},
  {label:'Respect Belgian neutrality.',tip:'Britain may stay out of the war, for now.',w:20,fx(st){st.flags.spared=1;news(st,'Germany respects the neutrality of Belgium.')}}]});
ev('eng_joins',{scen:'1914',turn:[3,10],who:()=> 'ENG',when:st=>act(st,'ENG')&&!st.nat.ENG.team&&act(st,'FRA'),title:'France asks for help',text:'The French army is fighting for its life and Paris asks Britain to keep the promises made in secret before the war.',
 opts:()=>[{label:'Join the Entente.',w:40,fx(st){join(st,'ENG','EN')}},{label:'Not yet.',w:60,fx(st){st.fired.eng_joins=0;if(st.turn>=10)st.fired.eng_joins=1}}]});
ev('ottoman',{scen:'1914',turn:2,who:()=> 'OTT',when:st=>!st.nat.OTT.team,title:'Two German warships',text:'Two German cruisers have reached Constantinople. Enver Pasha wants to raise the Ottoman flag over them and attack Russia.',
 opts:()=>[{label:'Join the Central Powers and attack Russia.',w:75,fx(st){dec(st,'OTT','RUS')}},{label:'Stay neutral.',w:25,fx(st){news(st,'The Ottoman Empire stays neutral.')}}]});
ev('italy',{scen:'1914',turn:4,who:()=> 'ITA',when:st=>!st.nat.ITA.team,title:'Italy chooses',text:'Both sides want Italy. Britain and France offer Trento and Trieste, which belong to Austria-Hungary.',
 opts:()=>[{label:'Join the Entente and attack Austria-Hungary.',w:65,fx(st){dec(st,'ITA','AUS')}},{label:'Join the Central Powers and attack France.',w:10,fx(st){dec(st,'ITA','FRA')}},{label:'Stay neutral.',w:25,fx(st){news(st,'Italy stays neutral.')}}]});
ev('bulgaria',{scen:'1914',turn:6,who:()=> 'BUL',when:st=>act(st,'SER')&&!st.nat.BUL.team&&st.nat.SER.team,title:'',text:'',opts:()=>[{w:70,fx(st){dec(st,'BUL','SER')}},{w:30}]});
ev('romania',{scen:'1914',turn:9,who:()=> 'ROM',when:st=>act(st,'AUS')&&!st.nat.ROM.team,title:'',text:'',opts:()=>[{w:60,fx(st){dec(st,'ROM','AUS')}},{w:40}]});
ev('greece',{scen:'1914',turn:13,who:()=> 'GRE',when:st=>!st.nat.GRE.team&&(act(st,'BUL')&&st.nat.BUL.team==='CP'),title:'',text:'',opts:()=>[{w:50,fx(st){dec(st,'GRE','BUL')}},{w:50}]});
ev('uboats',{scen:'1914',turn:11,who:()=> 'GER',when:st=>act(st,'GER')&&host(st,'GER','ENG'),title:'The submarine question',text:'Britain\'s blockade is starving Germany. The admirals say that sinking every ship near Britain, without warning, will starve Britain first. It will also bring America into the war.',
 opts:()=>[{label:'Sink everything.',tip:'Britain gets 2 fewer armies a turn. America joins your enemies next turn.',w:70,fx(st){st.flags.uboats=st.turn+6;st.flags.usaDue=st.turn+1;news(st,'Germany declares unrestricted submarine warfare.')}},{label:'Keep to the rules.',tip:'America stays out.',w:30,fx(st){news(st,'Germany keeps its submarines on a short leash.')}}]});
ev('usa',{scen:'1914',turn:[12,18],when:st=>st.flags.usaDue&&st.turn>=st.flags.usaDue&&act(st,'GER')&&B.members(st,'EN').length>0,title:'',text:'',opts:()=>[{fx(st){st.flags.usa='EN';news(st,'The United States declares war on Germany. American troops start to land in France.')}}]});
ev('revolution',{scen:'1914',turn:[11,18],who:()=> 'RUS',when:st=>act(st,'RUS')&&st.nat.RUS.team&&(lost(st,'RUS')>=3||st.turn>=14),title:'Revolution in Petrograd',text:'There is no bread in the capital. Soldiers are refusing to fire on the crowds, and the Tsar has abdicated. The new government cannot keep the army in the field much longer.',
 opts:()=>[{label:'Make peace.',tip:'Russia leaves the war. Germany keeps what it holds.',w:85,fx(st){const w=act(st,'GER')&&host(st,'GER','RUS')?'GER':B.board(st.scen).tags.find(x=>host(st,x,'RUS'));news(st,'Revolution in Russia. The new government asks for peace.');if(w)B.makePeace(st,w,'RUS',{take:st.terr.map((x,i)=>i).filter(i=>st.terr[i].o0==='RUS'&&st.terr[i].o===w),give:[]})}},{label:'Fight on.',tip:'Half of your armies desert.',w:15,fx(st){for(const x of st.terr)if(x.o==='RUS')x.a=Math.max(1,Math.ceil(x.a/2));news(st,'Russia fights on. Thousands of soldiers walk home.')}}]});

/* 1938 */
const FIRM=st=>['ENG','FRA'].includes(st.player)?st.player:'ENG';
ev('munich',{scen:'1938',turn:1,who:FIRM,title:'Munich',text:'Germany demands the Sudetenland, the mountain border of Czechoslovakia where its forts are. France is pledged to defend Czechoslovakia. Britain is not, but France will not fight alone.',
 opts:()=>[{label:'Give way. Germany takes the Sudetenland.',tip:'No war this year. Czechoslovakia loses its forts.',w:75,fx(st){st.flags.munich=1;const id=terrOf(st,'Sudetenland');if(st.player==='CZE'){st.cards.push({id:'cze_alone'})}else{B.give(st,[id],'GER');news(st,'At Munich, Britain and France agree that Germany may take the Sudetenland.')}}},
  {label:'Stand firm with Czechoslovakia.',tip:'If Germany attacks, Britain and France fight.',w:25,fx(st){st.flags.firm=1;if(B.rnd(st)<.65){dec(st,'GER','CZE');join(st,'FRA','AL');join(st,'ENG','AL')}else news(st,'Faced with war on two fronts, Germany backs down. For now.')}}]});
ev('cze_alone',{scen:'1938',turn:99,title:'Abandoned',text:'Britain and France have agreed to hand the Sudetenland to Germany. Czechoslovakia was not invited to Munich.',
 opts:()=>[{label:'Give up the Sudetenland.',fx(st){B.give(st,[terrOf(st,'Sudetenland')],'GER');news(st,'Czechoslovakia gives up the Sudetenland.')}},{label:'Fight alone.',tip:'You are at war with Germany, with no allies.',fx(st){dec(st,'GER','CZE')}}]});
ev('prague',{scen:'1938',turn:3,who:()=> 'CZE',when:st=>st.flags.munich&&act(st,'CZE')&&!host(st,'GER','CZE'),title:'The rest of the country',text:'German troops are on three sides of you and Germany now demands that Bohemia and Moravia become a German protectorate.',
 opts:()=>[{label:'Submit.',tip:'Czechoslovakia ceases to exist.',w:90,fx(st){B.give(st,st.terr.map((x,i)=>i).filter(i=>st.terr[i].o==='CZE'),'GER');B.surrender(st,'CZE','German troops enter Prague. Czechoslovakia has ceased to exist.')}},{label:'Fight.',tip:'War with Germany.',w:10,fx(st){dec(st,'GER','CZE')}}]});
ev('guarantee',{scen:'1938',turn:3,when:st=>act(st,'POL'),title:'',text:'',opts:()=>[{fx(st){st.guar.push(['ENG','POL'],['FRA','POL']);news(st,'Britain and France guarantee the independence of Poland.')}}]});
ev('pact',{scen:'1938',turn:4,when:st=>act(st,'RUS')&&!st.nat.RUS.team,title:'',text:'',opts:()=>[{w:65,fx(st){st.flags.pact=1;news(st,'Germany and the Soviet Union sign a pact. Each promises not to attack the other.')}},{w:35,fx(st){news(st,'Talks between Berlin and Moscow come to nothing.')}}]});
ev('danzig',{scen:'1938',turn:4,who:()=> 'POL',when:st=>act(st,'POL')&&!host(st,'GER','POL'),title:'Danzig',text:'Germany demands the Free City of Danzig and a road and railway of its own across the Polish Corridor.',
 opts:()=>[{label:'Refuse.',tip:'Germany will probably attack in the autumn.',w:90,fx(st){st.flags.refused=1;news(st,'Poland refuses the German demands.')}},{label:'Give way.',tip:'Danzig and the Corridor go to Germany.',w:10,fx(st){B.give(st,[terrOf(st,'Danzig'),terrOf(st,'The Corridor')].filter(i=>i>=0),'GER');if(act(st,'DZG'))B.surrender(st,'DZG','Danzig is joined to Germany.');st.flags.dgave=1}}]});
ev('poland',{scen:'1938',turn:[5,10],when:st=>act(st,'GER')&&act(st,'POL')&&!host(st,'GER','POL'),title:'',text:'',opts:st=>[{w:st.turn===5?90:50,fx(st){dec(st,'GER','POL');if(act(st,'DZG'))B.give(st,[terrOf(st,'Danzig')],'GER'),B.surrender(st,'DZG','Danzig is joined to Germany.');if(st.flags.pact&&act(st,'RUS'))dec(st,'RUS','POL',{pair:true})}},{w:st.turn===5?10:50,fx(st){st.fired.poland=0}}]});
ev('north',{scen:'1938',turn:7,when:st=>act(st,'GER')&&host(st,'GER','FRA'),title:'',text:'',opts:()=>[{w:60,fx(st){dec(st,'GER','DEN');dec(st,'GER','NOR')}},{w:40}]});
ev('west',{scen:'1938',turn:[7,9],when:st=>act(st,'GER')&&act(st,'FRA'),title:'',text:'',opts:st=>[{w:80,fx(st){if(!host(st,'GER','FRA'))dec(st,'GER','FRA');for(const t of['BEL','NED','LUX'])dec(st,'GER',t)}},{w:20,fx(st){st.fired.west=0}}]});
ev('italy38',{scen:'1938',turn:[8,12],who:()=> 'ITA',when:st=>act(st,'ITA')&&!st.nat.ITA.team&&B.members(st,'AL').length>0,title:'',text:'',opts:st=>[{w:(lost(st,'FRA')>0||!act(st,'FRA'))?80:35,fx(st){join(st,'ITA','AX')}},{w:40,fx(st){st.fired.italy38=0}}]});
ev('winter',{scen:'1938',turn:6,when:st=>st.flags.pact&&act(st,'RUS')&&act(st,'FIN'),title:'',text:'',opts:()=>[{w:70,fx(st){dec(st,'RUS','FIN',{pair:true})}},{w:30}]});
ev('baltic',{scen:'1938',turn:8,when:st=>st.flags.pact&&act(st,'RUS'),title:'',text:'',opts:()=>[{fx(st){for(const t of['EST','LAT','LIT'])if(act(st,t)&&!st.nat[t].team){B.give(st,st.terr.map((x,i)=>i).filter(i=>st.terr[i].o===t),'RUS');B.surrender(st,t,nm(st,t)+' is annexed by the Soviet Union.')}}}]});
ev('greece38',{scen:'1938',turn:10,when:st=>st.nat.ITA.team==='AX'&&act(st,'GRE')&&!st.nat.GRE.team,title:'',text:'',opts:()=>[{w:65,fx(st){dec(st,'ITA','GRE')}},{w:35}]});
ev('danube',{scen:'1938',turn:10,when:st=>act(st,'GER'),title:'',text:'',opts:()=>[{fx(st){for(const t of['HUN','ROM','BUL'])if(act(st,t)&&!st.nat[t].team&&B.rnd(st)<.6)join(st,t,'AX')}}]});
ev('balkans',{scen:'1938',turn:11,when:st=>act(st,'GER')&&st.nat.GER.team,title:'',text:'',opts:()=>[{w:60,fx(st){for(const t of['SER','GRE'])if(act(st,t)&&!host(st,'GER',t))dec(st,'GER',t)}},{w:40}]});
ev('barbarossa',{scen:'1938',turn:[12,20],when:st=>act(st,'GER')&&act(st,'RUS')&&!host(st,'GER','RUS'),title:'',text:'',opts:st=>[{w:st.turn===12?85:45,fx(st){dec(st,'GER','RUS');if(act(st,'FIN')&&host(st,'RUS','FIN')){delete st.wars[pk('FIN','RUS')];join(st,'FIN','AX')}}},{w:st.turn===12?15:55,fx(st){st.fired.barbarossa=0}}]});
ev('usa38',{scen:'1938',turn:[14,28],when:st=>act(st,'GER')&&B.members(st,'AL').length>0,title:'',text:'',opts:()=>[{fx(st){st.flags.usa='AL';st.flags.fareast=st.turn+4;news(st,'Japan attacks the American fleet at Pearl Harbor. The United States enters the war, and British troops are needed in Asia.')}}]});
})(globalThis.PK=globalThis.PK||{});
