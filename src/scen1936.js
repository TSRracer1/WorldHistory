/* Powder Keg — the 1936 start, its telegrams and plans, and carrying a finished 1914 world forward to 1936.
   Loaded after plans.js. Adds era content to the shared tables, D.SCEN['1936'], D.SCEN.carry and G.carry(S).
   Tone: the regimes are told plainly as history. No hate symbols. Germany, Italy and the Soviet Union carry regime:true
   in the historical start and are run by the computer. */
(function(PK){
const D=PK.DATA,G=PK.SIM,M=PK.MAP,E=PK.EVENTS,L=PK.PLANS,DAY=D.DAY;
const has=G.has,set=G.flag,nm=G.name,war=G.atWar,alive=G.alive;
const bump=(S,t,k,v)=>{S.nat[t][k]=Math.max(0,Math.min(100,S.nat[t][k]+v))};
const later=(S,days,id,tag,data)=>S.sched.push({day:S.day+days,id,tag,data:data||null});
const reg=S=>!!D.NATIONS.GER.regime&&!S.nat.GER.dead;
const own=(S,k)=>S.prov[G.KEY[k]].owner;
const strength=(S,tags)=>S.divs.reduce((s,d)=>s+(tags.includes(d.o)?G.power(S,d):0),0);
const odds=(S,a,b)=>(strength(S,G.sideOf(S,a))+1)/(strength(S,G.sideOf(S,b))+1);
function raise(S,t,n,tpl,name,str){const N=S.nat[t];if(N.dead||N.capit||N.cap<0||S.prov[N.cap].ctrl!==t||!N.tpls[tpl||0])return;G.spawn(S,t,N.cap,tpl||0,n,D.NATIONS[t].xp,name,str||.85);G.index(S)}
function sue(S,tag){const lead=G.activeEnemies(S,tag).sort((a,b)=>S.nat[b].kills-S.nat[a].kills)[0];if(!lead)return;
  if(lead===S.player){S.pending.push({id:'_armistice',tag:lead,data:{from:tag}});return}
  G.news(S,nm(S,tag)+' asks for an armistice. '+nm(S,lead)+' accepts.','dip');G.treaty(S,[tag],[],D.NATIONS[lead].dials.gru>.7?2:1)}
/* put the listed nations into one alliance, reusing whichever of them already has one */
function ally(S,list,id,name){list=list.filter(t=>alive(S,t));if(list.length<2&&!list.some(t=>S.nat[t].faction))return;let f=list.map(t=>S.nat[t].faction).find(Boolean);
  if(!f){f=id;if(!S.factions[f])S.factions[f]={name,members:[]};const first=list[0];S.factions[f].members.push(first);S.nat[first].faction=f}
  for(const t of list)if(!S.nat[t].faction&&!G.members(S,f).some(m=>war(S,m,t)))G.joinFaction(S,t,f);G.spread(S)}
const allies=(S,list)=>ally(S,list,'AL','Allies'),axis=(S,list)=>ally(S,list,'AX','Axis');
/* one state absorbs another without a war */
function annex(S,from,to,text){const N=S.nat[from];if(N.dead)return;for(let i=0;i<M.provs.length;i++){const P=S.prov[i];if(P.owner===from){P.owner=P.ctrl=to}else if(P.ctrl===from)P.ctrl=P.owner}
  for(let i=S.divs.length-1;i>=0;i--)if(S.divs[i].o===from)S.divs.splice(i,1);if(N.faction)G.leaveFaction(S,from,true);for(const k in S.wars)if(k.split('|').includes(from))delete S.wars[k];
  S.guar=S.guar.filter(g=>g[0]!==from&&g[1]!==from);N.dead=true;N.capit=false;N.recruit=[];N.plan=null;for(const k in S.battles)delete S.battles[k];for(const d of S.divs)d.b=null;
  G.index(S);for(const d of S.divs)if(!G.canEnter(S,d.o,d.p)){d.p=S.nat[d.o].cap>=0?S.nat[d.o].cap:d.p;d.path=null;d.ret=false}G.index(S);S._ctrlDirty=true;if(text)G.news(S,text,'dip')}

/* =====================================================================
   Era content: technology, battalions, equipment, templates
   ===================================================================== */
const OLD=D.TECH.map(t=>t.id);
const t=(id,name,track,year,fx,desc)=>D.TECH.push({id,name,track,year,fx,desc});
t('mot','Motorised infantry','Machines',1934,{},'Unlocks motorised infantry battalions');
t('mtank','Medium tanks','Machines',1936,{},'Unlocks medium tank battalions');
t('mono','Monoplane fighters','Machines',1936,{infDef:.06},'Defence +6%');
t('tradio','Tank radios','Machines',1937,{armBrk:.2,org:.05},'Armoured breakthrough +20%, organisation recovers 5% faster');
t('cas','Close air support','Machines',1938,{armAtt:.1,artAtt:.08},'Armoured attack +10%, artillery attack +8%');
t('radar','Radio direction finding','Machines',1939,{infDef:.05,blockade:-.2},'Defence +5%, blockade hurts a fifth less');
t('hvytank','Heavy tanks','Machines',1941,{armAtt:.2},'Armoured attack +20%');
t('smg','Submachine guns','Infantry',1936,{infAtt:.06},'Infantry attack +6%');
t('combined','Combined-arms doctrine','Infantry',1939,{armBrk:.3,move:.1},'Armoured breakthrough +30%, movement +10%');
t('winter','Winter equipment','Infantry',1940,{loss:-.06,org:.05},'Losses −6%, organisation recovers 5% faster');
t('atgun','Anti-tank guns','Artillery',1937,{infDef:.08},'Infantry defence +8%');
t('rocket','Rocket artillery','Artillery',1941,{artAtt:.12},'Artillery attack +12%');
t('synth','Synthetic fuel and rubber','Industry',1937,{prod:.06,blockade:-.3},'Factory output +6%, blockade hurts 30% less');
t('flow','Flow-line production','Industry',1939,{prod:.12},'Factory output +12%');
t('lorry','Motorised supply columns','Industry',1940,{move:.1,supply:.2},'Movement +10%, supply +20%');
D.EQUIP.trucks={n:'Lorries',per:1.2,tech:'mot'};D.EQUIP.mtanks={n:'Medium tanks',per:.12,tech:'mtank'};
D.BN.mot={n:'Motorised infantry',att:3.4,def:6,brk:2,org:60,hp:25,spd:10,w:2,mp:1000,eq:{rifles:100,trucks:30},tech:'mot'};
D.BN.mtank={n:'Medium tanks',att:22,def:6,brk:36,org:25,hp:14,spd:8,w:2,mp:300,eq:{mtanks:10},tech:'mtank'};
const TPL36={
 inf36:{name:'Infantry Division',bn:{inf:9,art:3},sup:['mg','eng']},
 ger36:{name:'Infanterie-Division',bn:{inf:9,art:3,hart:1},sup:['mg','eng','rec']},
 fra36:{name:'Division d\'Infanterie',bn:{inf:9,art:3,hart:1},sup:['mg','eng']},
 sov36:{name:'Rifle Division',bn:{inf:9,art:2},sup:['mg']},
 lite36:{name:'Infantry Division',bn:{inf:7,art:2},sup:['mg']},
 small:{name:'Infantry Division',bn:{inf:6,art:1},sup:['mg']},
 cav:{name:'Cavalry Division',bn:{cav:6,art:1},sup:['rec']},
 panzer:{name:'Panzer-Division',bn:{mtank:4,mot:4,art:2},sup:['eng','rec']},
 dlm:{name:'Division Légère Mécanique',bn:{mtank:3,mot:3,art:1},sup:['rec']},
 armd:{name:'Armoured Division',bn:{mtank:4,mot:2,art:1},sup:['rec']},
 tankc:{name:'Tank Corps',bn:{mtank:5,mot:2},sup:[]},
 celere:{name:'Divisione Corazzata',bn:{tank:4,mot:3,art:1},sup:['rec']},
 fast:{name:'Fast Division',bn:{tank:2,cav:2,mot:2,art:1},sup:['rec']},
 mech:{name:'Mechanised Division',bn:{mtank:3,mot:4,art:2},sup:['eng','rec']}
};
/* the simulation's modifiers are keyed on 1914 arms; give the new arms theirs */
const baseStats=G.tplStats;
G.tplStats=function(S,tag,tpl){const st=baseStats(S,tag,tpl),m=S.nat[tag].mod,b=tpl.bn||{};
  if(b.mot){st.att+=b.mot*D.BN.mot.att*(m.infAtt||0);st.def+=b.mot*D.BN.mot.def*(m.infDef||0)}
  for(const k of['mtank','tank'])if(b[k]){st.att+=b[k]*D.BN[k].att*(m.armAtt||0);st.brk+=b[k]*D.BN[k].brk*(m.armBrk||0)}return st};
/* computer-run nations must also build what their armoured divisions use */
const baseEcon=G.aiEcon;
G.aiEcon=function(S,tag,init){baseEcon(S,tag,init);const N=S.nat[tag];if(!N||N.dead||N.capit||(!N.auto&&!init)||!N.lines.length)return;
  for(const e of['mtanks','trucks']){const bn=e==='mtanks'?'mtank':'mot';if(!N.tech.includes(D.EQUIP[e].tech)||!N.tpls.some(x=>x.bn[bn]>0)||N.lines.some(l=>l.eq===e))continue;
    const big=N.lines.slice().sort((a,b)=>b.f-a.f)[0],f=Math.max(1,Math.floor(N.mil*.09));if(big.f>f+1){big.f-=f;N.lines.push({eq:e,f})}}};

/* =====================================================================
   The map and the powers on 1 January 1936
   ===================================================================== */
const owners={};const give=(tag,keys)=>keys.split(' ').forEach(k=>{if(G.KEY[k]===undefined)throw new Error('1936: unknown province '+k);owners[k]=tag});
give('FRA','metz strasbourg aleppo damascus deirezzor');give('ENG','mosul');give('IRE','dublin cork galway');
give('POL','warsaw lodz lublin bialystok brestlitovsk pinsk vilna krakow przemysl lemberg posen oppeln rovno danzig');
give('LIT','kovno');give('LAT','riga libau dvinsk');give('EST','reval');give('FIN','helsinki turku vyborg');
give('CZE','prague brno pressburg');give('HUN','budapest szeged debrecen');give('ROM','kolozsvar kronstadt temesvar czernowitz kishinev');
give('SER','cetinje sarajevo zagreb dalmatia neusatz');give('ITA','trieste');give('GRE','dedeagach');give('OTT','kars');
const names={petersburg:'Leningrad',constantinople:'Istanbul',oslo:'Oslo',tsaritsyn:'Stalingrad',nizhny:'Gorky',reval:'Tallinn',kovno:'Kaunas',vilna:'Wilno',lemberg:'Lwów',krakow:'Kraków',posen:'Poznań',oppeln:'Katowice',
 danzig:'Danzig Corridor',pressburg:'Bratislava',brno:'Brno',kolozsvar:'Cluj',kronstadt:'Brașov',temesvar:'Timișoara',czernowitz:'Cernăuți',kishinev:'Chișinău',neusatz:'Novi Sad',zagreb:'Zagreb',dalmatia:'Split',
 tirana:'Tirana',smyrna:'İzmir',ankara:'Ankara',adrianople:'Edirne',antalya:'Antalya',trebizond:'Trabzon',ekaterinoslav:'Dnepropetrovsk',donbass:'Stalino',kuban:'Krasnodar',tiflis:'Tbilisi',erivan:'Yerevan',
 helsinki:'Helsinki',turku:'Turku',vyborg:'Viipuri',strasbourg:'Strasbourg',libau:'Liepāja',dvinsk:'Daugavpils',brestlitovsk:'Brześć',tver:'Kalinin',dedeagach:'Alexandroupoli',tyrol:'Innsbruck',przemysl:'Przemyśl',
 saxony:'Dresden',konigsberg:'Königsberg',bialystok:'Białystok',lodz:'Łódź'};
const nations={
 GER:{name:'German Reich',adj:'German',head:'Chancellor Hitler',regime:true,major:true,pop:67,mil:.46,navy:25,stab:70,ws:55,cons:2,slots:3,xp:.45,dials:{amb:.5,cau:.15,gru:.9}},
 ITA:{name:'Kingdom of Italy',adj:'Italian',head:'Benito Mussolini',regime:true,major:true,pop:43,mil:.34,navy:45,stab:62,ws:40,cons:2,xp:.25,dials:{amb:.8,cau:.55,gru:.4}},
 RUS:{name:'Soviet Union',adj:'Soviet',flag:'SOV',head:'General Secretary Stalin',regime:true,major:true,pop:165,mil:.45,navy:20,stab:55,ws:50,cons:2,slots:3,xp:.2,dials:{amb:.5,cau:.6,gru:.7}},
 ENG:{name:'United Kingdom',adj:'British',head:'Prime Minister Baldwin',major:true,pop:47,mil:.26,navy:100,stab:75,ws:25,cons:0,slots:3,xp:.45,dials:{amb:.2,cau:.85,gru:.6}},
 FRA:{name:'French Republic',adj:'French',head:'Prime Minister Sarraut',major:true,pop:41,mil:.36,navy:45,stab:50,ws:30,cons:2,slots:3,xp:.35,dials:{amb:.2,cau:.9,gru:.7}},
 POL:{name:'Poland',adj:'Polish',head:'Marshal Rydz-Śmigły',pop:34,mil:.36,stab:58,ws:62,cons:2,xp:.35,dials:{amb:.4,cau:.35,gru:.8}},
 CZE:{name:'Czechoslovakia',adj:'Czechoslovak',head:'President Beneš',pop:15,mil:.48,stab:62,ws:55,cons:2,xp:.35,dials:{amb:.1,cau:.7,gru:.5}},
 AUS:{name:'Austria',adj:'Austrian',flag:'AUT',head:'Chancellor Schuschnigg',major:false,pop:6.7,mil:.3,navy:1,stab:40,ws:30,cons:1,slots:2,xp:.25,dials:{amb:.1,cau:.8,gru:.5}},
 HUN:{name:'Kingdom of Hungary',adj:'Hungarian',head:'Regent Horthy',pop:9,stab:55,ws:45,dials:{amb:.7,cau:.6,gru:.9}},
 SER:{name:'Yugoslavia',adj:'Yugoslav',flag:'YUG',head:'Prince Regent Paul',pop:15,stab:45,ws:50,cons:2,navy:3,dials:{amb:.2,cau:.7,gru:.6}},
 OTT:{name:'Turkey',adj:'Turkish',head:'President Atatürk',major:false,pop:16,mil:.35,navy:8,stab:68,ws:45,cons:2,slots:2,dials:{amb:.15,cau:.9,gru:.5}},
 ROM:{name:'Kingdom of Romania',adj:'Romanian',head:'King Carol II',pop:19,stab:50,ws:45,cons:2,dials:{amb:.3,cau:.75,gru:.6}},
 BUL:{name:'Kingdom of Bulgaria',adj:'Bulgarian',head:'Tsar Boris III',pop:6.2,stab:55,dials:{amb:.7,cau:.7,gru:.9}},
 GRE:{name:'Kingdom of Greece',adj:'Greek',head:'General Metaxas',pop:7,navy:5,stab:50,dials:{amb:.2,cau:.7,gru:.6}},
 SPA:{name:'Spanish Republic',adj:'Spanish',head:'President Azaña',pop:25,navy:8,stab:25,ws:40,dials:{amb:.1,cau:.9,gru:.6}},
 FIN:{name:'Finland',adj:'Finnish',head:'President Svinhufvud',pop:3.6,stab:70,ws:70,cons:2,xp:.45,dials:{amb:.1,cau:.6,gru:.8}},
 IRE:{name:'Ireland',adj:'Irish',head:'Éamon de Valera',pop:3,stab:65,dials:{amb:.1,cau:.95,gru:.8}},
 BEL:{name:'Belgium',adj:'Belgian',head:'King Leopold III',pop:8.3,stab:65,cons:2,dials:{amb:.05,cau:.9,gru:.6}},
 NED:{name:'Netherlands',adj:'Dutch',pop:8.5,navy:10,stab:75,dials:{amb:.05,cau:.95,gru:.4}},
 LIT:{name:'Lithuania',adj:'Lithuanian',head:'President Smetona',pop:2.5},LAT:{name:'Latvia',adj:'Latvian',head:'Kārlis Ulmanis',pop:1.9},EST:{name:'Estonia',adj:'Estonian',head:'Konstantin Päts',pop:1.1},
 ALB:{name:'Kingdom of Albania',adj:'Albanian',head:'King Zog',pop:1,stab:45},PER:{name:'Iran',adj:'Iranian',head:'Reza Shah',pop:15,stab:50},
 SWE:{pop:6.2,stab:80},NOR:{pop:2.9,stab:80},DEN:{pop:3.7,stab:80},SWI:{pop:4.2,stab:88},POR:{name:'Portugal',head:'António Salazar',pop:7,stab:60},LUX:{pop:.3}
};
const all36=OLD.filter(id=>id!=='trench'&&id!=='gas');
D.SCEN['1936']={id:'1936',name:'1936: The Gathering Storm',blurb:'Eighteen years after the armistice, Germany is rearming and the men who made the peace have lost the will to enforce it.',
 start:DAY(1936,1,1),end:DAY(1946,1,1),tension:24,
 intro:'Europe, New Year 1936. Germany has been a one-party dictatorship for three years; it is rearming in defiance of the Versailles treaty, and its Nuremberg Laws have stripped German Jews of their citizenship. Italy is conquering Abyssinia. Britain and France want, above all, no second war.',
 owners,names,nations,caps:{RUS:'moscow',OTT:'ankara',POL:'warsaw',CZE:'prague',HUN:'budapest',FIN:'helsinki',LIT:'kovno',LAT:'riga',EST:'reval',IRE:'dublin',AUS:'vienna',SER:'belgrade'},
 factions:{},guarantees:[['FRA','POL'],['FRA','CZE'],['ENG','BEL'],['FRA','BEL']],
 opinion:[['GER','FRA',-50],['GER','POL',-35],['GER','CZE',-45],['GER','AUS',-25],['GER','ITA',10],['GER','RUS',-60],['GER','ENG',-10],['ENG','FRA',50],['FRA','POL',45],['FRA','CZE',55],['FRA','RUS',15],['ENG','RUS',-25],
  ['POL','RUS',-50],['POL','CZE',-25],['POL','LIT',-40],['POL','ROM',40],['HUN','CZE',-55],['HUN','ROM',-60],['HUN','SER',-45],['CZE','ROM',50],['CZE','SER',50],['ROM','SER',50],['ROM','RUS',-40],['FIN','RUS',-40],
  ['ITA','FRA',-25],['ITA','ENG',-30],['ITA','AUS',30],['ITA','SER',-35],['ITA','GRE',-30],['ITA','ALB',15],['ITA','HUN',30],['OTT','GRE',20],['BUL','GRE',-40],['BUL','SER',-35],['BUL','ROM',-35],['ENG','POR',40],['ENG','BEL',40],
  ['FRA','BEL',40],['GER','HUN',30],['GER','BUL',20],['ENG','IRE',-20],['RUS','EST',-25],['RUS','LAT',-25],['RUS','LIT',-10],['GER','LIT',-20],['ENG','NED',30],['ENG','GRE',25],['ENG','OTT',15],['CZE','RUS',25]],
 claims:{GER:['danzig','posen','oppeln','metz','strasbourg'],ITA:['nice','corsica','tunis','dalmatia','tirana','valona'],RUS:['brestlitovsk','pinsk','rovno','lemberg','vilna','kishinev','czernowitz','vyborg','reval','riga','libau','dvinsk','kovno','kars'],
  HUN:['pressburg','kolozsvar','neusatz'],BUL:['dedeagach','skopje','constanta'],LIT:['vilna'],SER:['trieste'],IRE:['belfast'],POL:[],FRA:[],ENG:[]},
 tpl:TPL36,extraTpl:{GER:['panzer'],FRA:['dlm'],ENG:['armd'],RUS:['tankc'],ITA:['celere'],CZE:['fast']},
 oob:{
  GER:['ger36',['berlin',3,0,1],['hamburg',2,0],['hanover',2,0],['stuttgart',2,0],['munich',3,0],['nuremberg',2,0,1],['saxony',3,0],['breslau',3,0],['stettin',2,0],['konigsberg',3,1],['magdeburg',2,0],['erfurt',1,0,1],['bremen',1,0],['kiel',1,0]],
  FRA:['fra36',['metz',5,0],['strasbourg',4,0],['nancy',4,0],['reims',3,2,1],['lille',3,0],['dijon',2,0],['paris',3,0,1],['lyon',2,0],['nice',2,0],['algiers',1,0],['tunis',1,0],['marseille',1,0],['damascus',1,0]],
  ENG:['inf36',['london',3,0,1],['birmingham',1,0],['edinburgh',1,0],['belfast',1,0],['cyprus',0,0],['mosul',1,0]],
  ITA:['lite36',['turin',4,0],['milan',3,0,1],['venice',3,0],['trieste',4,0],['genoa',1,0],['bologna',2,0],['florence',1,0],['rome',3,1],['naples',2,0],['bari',1,0],['sicily',1,0],['sardinia',1,0]],
  RUS:['sov36',['minsk',6,2,2],['smolensk',4,0],['vitebsk',3,0],['mogilev',3,0],['gomel',3,0],['kiev',7,3,2],['vinnitsa',5,2],['odessa',4,0],['petersburg',6,0,1],['pskov',3,0],['novgorod',2,0],['moscow',6,0,1],['tula',2,0],
   ['kharkov',3,0],['rostov',2,0],['tiflis',3,0],['erivan',2,0],['batum',2,0],['petrozavodsk',2,0],['tsaritsyn',2,0]],
  POL:['inf36',['warsaw',3,1],['lodz',3,1],['posen',3,1],['danzig',2,0],['krakow',2,0],['oppeln',2,0],['bialystok',1,1],['vilna',2,1],['lemberg',1,0],['rovno',1,0]],
  CZE:['inf36',['prague',6,0,1],['brno',3,0],['pressburg',3,0]],
  AUS:['lite36',['vienna',3,0],['linz',1,0],['graz',1,0],['tyrol',1,0]],HUN:['lite36',['budapest',4,0],['szeged',1,1],['debrecen',2,0]],
  SER:['lite36',['belgrade',4,0],['zagreb',3,0],['nis',2,0],['skopje',2,0],['sarajevo',2,0],['dalmatia',1,0],['neusatz',2,1]],
  ROM:['lite36',['bucharest',4,0],['ploesti',2,0],['iasi',3,1],['kishinev',3,0],['kolozsvar',3,0],['temesvar',2,0],['constanta',1,0],['czernowitz',1,0]],
  OTT:['lite36',['ankara',3,0],['constantinople',4,0],['adrianople',3,1],['smyrna',2,0],['erzurum',3,1],['kars',2,0],['diyarbakir',1,0],['adana',1,0]],
  BEL:['inf36',['brussels',3,0],['liege',3,0],['ghent',2,0]],NED:['lite36',['amsterdam',3,0],['eindhoven',2,0],['groningen',1,0]],
  FIN:['inf36',['helsinki',2,0],['vyborg',4,0],['turku',1,0]],GRE:['lite36',['athens',3,0],['salonika',4,0],['larissa',2,0],['ioannina',2,0]],BUL:['lite36',['sofia',4,0],['plovdiv',3,0],['pleven',2,0],['varna',1,0]],
  SWE:['inf36',['stockholm',3,0],['gothenburg',1,0],['malmo',2,0]],SWI:['inf36',['bern',3,0],['zurich',3,0]],SPA:['small',['madrid',3,0],['barcelona',2,0],['seville',2,0]],
  LIT:['small',['kovno',3,0]],LAT:['small',['riga',2,0],['dvinsk',1,0]],EST:['small',['reval',2,0]],IRE:['small',['dublin',2,0]],DEN:['small',['copenhagen',2,0],['jutland',1,0]],NOR:['small',['oslo',2,0],['bergen',1,0]],
  POR:['small',['lisbon',2,0],['porto',1,0]],ALB:['small',['tirana',1,0]],LUX:['small'],PER:['small',['tabriz',2,0]]},
 tech:{all:all36,GER:['mot','mtank','smg'],RUS:['mot','mtank'],FRA:['mot','mtank'],ENG:['mot','mtank','mono'],ITA:['mot'],CZE:['mot','mtank'],POL:['mot']},
 forts:{metz:4,strasbourg:4,nancy:3,lille:1,liege:3,ghent:1,prague:3,brno:2,pressburg:1,konigsberg:2,warsaw:1,posen:1,vyborg:3,minsk:2,kiev:2,petersburg:2,nice:2,turin:2,tyrol:1,adrianople:2,gallipoli:2,eindhoven:1,bern:3,zurich:3}
};

/* =====================================================================
   Telegrams, 1936–1945
   ===================================================================== */
const ev=(id,o)=>{E[id]=Object.assign({scen:'1936'},o)};
function regimeFalls(S,how){if(!reg(S))return;set(S,'regime_fell');G.rename(S,'GER',{name:'German Republic',adj:'German',flag:'REP',head:'Chancellor Goerdeler',regime:false,dials:{amb:.3,cau:.7,gru:.5}});
  S.nat.GER.stab=45;G.tension(S,-20);for(const o of['ENG','FRA','POL','CZE'])if(!S.nat[o].dead)G.op(S,o,'GER',30);
  G.news(S,how+' The dictatorship in Germany is over. A provisional government of generals and civil servants promises elections and an end to the camps.','story');G.say(S,'GER','Is of sorry. Is different now.');
  if(G.inWar(S,'GER'))sue(S,'GER')}
function rhineDone(S){set(S,'rhine_done');bump(S,'GER','stab',6);bump(S,'GER','ws',8);bump(S,'FRA','ws',-3);G.tension(S,6);G.op(S,'BEL','FRA',-15);S.guar=S.guar.filter(g=>!(g[0]==='FRA'&&g[1]==='BEL'));
  for(const k of['cologne','ruhr'])if(own(S,k)==='GER')G.spawn(S,'GER',G.KEY[k],0,2,.4);G.index(S);
  G.news(S,'German troops stay in the Rhineland. France protests to the League of Nations; Belgium returns to neutrality.','dip')}

ev('rhineland',{tag:'GER',when:S=>S.day>=DAY(1936,3,7)&&reg(S),pic:'🌉',title:'The Rhineland',
 text:'The Locarno treaties keep the Rhineland free of German troops. The Chancellor proposes to send three battalions across the bridges and see what France does.',
 opts:S=>[
  {label:'March.',tip:'',w:92,fx(S){set(S,'rhine_move');G.tension(S,6);G.news(S,'German battalions cross the Rhine bridges into the demilitarised zone, in breach of Versailles and Locarno.','story');later(S,1,'rhineland_fra','FRA')}},
  {label:'Wait a year.',tip:'',w:8,fx(S){later(S,365,'rhineland','GER')}}]});
ev('rhineland_fra',{pic:'🌉',title:'German troops on the Rhine',
 text:'Three German battalions have entered the demilitarised Rhineland. The treaty gives France the right to expel them by force. General Gamelin says he cannot move without general mobilisation, six weeks before an election. London has said nothing.',
 opts:S=>[
  {label:'Mobilise and march in.',tip:'Stability −6. If Berlin does not back down, it is war. If it does, the regime may not survive the humiliation.',w:8,fx(S){set(S,'rhine_march');bump(S,'FRA','stab',-6);G.tension(S,10);G.news(S,'France mobilises and orders its army into the Rhineland.','story');later(S,3,'rhineland_ger2','GER')}},
  {label:'Ask London to act with us.',tip:'Britain decides.',w:14,fx(S){later(S,2,'rhineland_eng','ENG')}},
  {label:'Protest to the League of Nations.',tip:'Germany keeps the Rhineland. Its government is strengthened; ours is not.',w:78,fx(S){rhineDone(S)}}]});
ev('rhineland_eng',{pic:'🎩',title:'France asks for support',
 text:'Paris will march into the Rhineland if Britain marches too. The Cabinet\'s feeling is that the Germans are only walking into their own back garden, and that the public would not understand a war to stop them.',
 opts:S=>[
  {label:'A joint ultimatum: withdraw, or be expelled.',tip:'France +20. Risk of war.',w:15,fx(S){set(S,'rhine_march');set(S,'rhine_joint');G.op(S,'ENG','FRA',20);G.tension(S,10);G.news(S,'Britain and France jointly demand that Germany evacuate the Rhineland.','story');later(S,3,'rhineland_ger2','GER')}},
  {label:'Britain cannot support the use of force.',tip:'France −10. Germany keeps the Rhineland.',w:85,fx(S){G.op(S,'ENG','FRA',-10);rhineDone(S)}}]});
ev('rhineland_ger2',{pic:'⚠️',title:'The French are coming',
 text:'French divisions are moving on the Saar. The War Minister begs for the battalions to be recalled.',
 opts:S=>[
  {label:'Withdraw.',tip:'',w:75,fx(S){set(S,'rhine_backdown');bump(S,'GER','stab',-20);bump(S,'FRA','ws',8);bump(S,'FRA','stab',8);G.tension(S,-6);G.news(S,'The German battalions withdraw across the Rhine. It is the regime\'s first defeat.','story');later(S,20,'generals_plot','GER')}},
  {label:'Stand and fight.',tip:'',w:25,fx(S){if(has(S,'rhine_joint'))allies(S,['FRA','ENG']);G.declareWar(S,'FRA','GER',{text:'French troops enter the Rhineland. German battalions open fire: France and Germany are at war.'})}}]});
ev('generals_plot',{pic:'🗡️',title:'The army and the Chancellor',
 text:'The retreat has broken the spell. Senior officers who always thought the Chancellor a reckless amateur now talk openly of removing him before he tries again.',
 opts:S=>[
  {label:'The generals act.',tip:'',w:60,fx(S){regimeFalls(S,'Army units occupy the government quarter in Berlin and arrest the party leadership.')}},
  {label:'The regime purges its critics and survives.',tip:'',w:40,fx(S){bump(S,'GER','stab',8);set(S,'rhine_done');G.news(S,'The German government survives the Rhineland fiasco and dismisses its War Minister.','dip')}}]});
ev('spain',{tag:S=>S.player==='ENG'?'ENG':'FRA',when:S=>S.day>=DAY(1936,7,18),pic:'🐂',title:'Civil war in Spain',
 text:'Army garrisons in Spain and Morocco have risen against the Republic under General Franco. German and Italian aircraft are ferrying his troops across the Straits. Madrid asks the democracies to sell it arms.',
 opts:(S,tg)=>[
  {label:'Non-intervention. An arms embargo on both sides.',tip:'Stability −2. The Republic will probably fall.',w:tg==='ENG'?88:70,fx(S){bump(S,tg,'stab',-2);G.tension(S,4);G.news(S,nm(S,tg)+' declares non-intervention in the Spanish war. Germany, Italy and the Soviet Union sign the agreement and ignore it.','dip')}},
  {label:'Arm the Republic.',tip:'Stability −6, 400 rifles. Italy −15, Germany −10, the Soviet Union +15. The Republic may hold.',w:tg==='ENG'?12:30,fx(S){set(S,'spain_aid');bump(S,tg,'stab',-6);S.nat[tg].stock.rifles=Math.max(0,S.nat[tg].stock.rifles-400);G.op(S,tg,'ITA',-15);G.op(S,tg,'GER',-10);G.op(S,tg,'RUS',15);G.tension(S,7);
    G.news(S,nm(S,tg)+' opens its arsenals to the Spanish Republic.','dip')}}]});
ev('spain_end',{tag:'SPA',when:S=>S.day>=DAY(1939,4,1)&&alive(S,'SPA'),pic:'🐂',title:'The end in Spain',
 text:'After nearly three years and half a million dead, the war in Spain is decided.',
 opts:S=>[
  {label:'Franco\'s Nationalists enter Madrid.',tip:'',w:has(S,'spain_aid')?45:88,fx(S){G.rename(S,'SPA',{name:'Spanish State',adj:'Spanish',head:'General Franco'});bump(S,'SPA','stab',25);G.op(S,'SPA','GER',25);G.op(S,'SPA','ITA',25);G.op(S,'SPA','FRA',-20);G.news(S,'The Spanish Republic surrenders. General Franco rules Spain.','story')}},
  {label:'The Republic holds.',tip:'',w:has(S,'spain_aid')?55:12,fx(S){bump(S,'SPA','stab',20);G.op(S,'SPA','FRA',30);G.op(S,'SPA','RUS',20);G.op(S,'SPA','GER',-30);G.news(S,'The Nationalist offensive on Madrid collapses. The Spanish Republic survives.','story')}}]});
ev('axis',{tag:'ITA',when:S=>S.day>=DAY(1936,10,25)&&reg(S)&&!!D.NATIONS.ITA.regime,pic:'🤝',title:'Rome and Berlin',
 text:'The League\'s sanctions over Abyssinia have left Italy without friends in the West. Berlin offers an understanding.',
 opts:S=>[
  {label:'An axis round which Europe will turn.',tip:'',w:85,fx(S){set(S,'axis');G.op(S,'ITA','GER',45);G.op(S,'ITA','AUS',-25);G.tension(S,4);G.news(S,'Mussolini announces a Rome–Berlin Axis.','dip')}},
  {label:'Keep a free hand.',tip:'',w:15,fx(S){set(S,'ita_aloof');G.op(S,'ITA','FRA',20);G.op(S,'ITA','ENG',15)}}]});
/* rearmament: the regimes arm in peacetime whatever anyone chooses */
function rearm(id,date,nInf,nArm,fac,text){ev(id,{tag:'GER',when:S=>S.day>=date&&reg(S)&&alive(S,'GER'),pic:'🏭',title:'German rearmament',text,opts:S=>[{label:'Continue.',fx(S){raise(S,'GER',nInf,0);raise(S,'GER',nArm,2);S.nat.GER.builtMil+=fac;G.tension(S,2);G.news(S,text,'dip')}}]})}
rearm('rearm37',DAY(1937,1,15),12,2,5,'Germany\'s army passes forty divisions. Conscription has been extended to two years.');
rearm('rearm38',DAY(1938,1,15),14,2,6,'German arms spending now exceeds that of Britain and France together.');
rearm('rearm39',DAY(1939,1,15),14,2,6,'Germany fields more than a hundred divisions, six of them armoured.');
rearm('rearm40',DAY(1940,1,15),12,2,5,'German war production is running at full stretch.');
ev('sov_rearm',{tag:'RUS',when:S=>S.day>=DAY(1938,6,1)&&alive(S,'RUS'),pic:'🏭',title:'The Third Five-Year Plan',text:'Soviet heavy industry is turned over to armaments.',opts:S=>[{label:'Continue.',fx(S){raise(S,'RUS',16,0);raise(S,'RUS',3,2);S.nat.RUS.builtMil+=8}}]});
ev('sov_rearm2',{tag:'RUS',when:S=>S.day>=DAY(1940,6,1)&&alive(S,'RUS'),pic:'🏭',title:'The Red Army expands',text:'The Red Army doubles in size in two years.',opts:S=>[{label:'Continue.',fx(S){raise(S,'RUS',20,0);raise(S,'RUS',4,2);S.nat.RUS.builtMil+=8}}]});
ev('ita_albania',{tag:'ITA',when:S=>S.day>=DAY(1939,4,7)&&!!D.NATIONS.ITA.regime&&alive(S,'ALB')&&!G.inWar(S,'ITA'),pic:'⛵',title:'Albania',text:'Italian troops are ready to land at Durazzo.',
 opts:S=>[{label:'Occupy Albania.',w:80,fx(S){annex(S,'ALB','ITA','Italian troops land in Albania. King Zog flees; the crown is offered to Victor Emmanuel.');G.tension(S,5);G.op(S,'ITA','GRE',-20);G.op(S,'ITA','SER',-15)}},{label:'Leave it.',w:20,fx(S){}}]});

/* --- Austria --- */
ev('anschluss',{tag:'GER',when:S=>S.day>=DAY(1938,3,11)&&reg(S)&&alive(S,'AUS')&&!war(S,'GER','AUS')&&!G.inWar(S,'GER'),pic:'🏔️',title:'Austria',
 text:'Chancellor Schuschnigg has called a plebiscite on Austrian independence for Sunday.',
 opts:S=>[
  {label:'Demand that he cancel it and resign.',w:90,fx(S){G.tension(S,8);G.news(S,'Berlin demands the resignation of the Austrian government. German divisions mass on the frontier.','story');later(S,1,'anschluss_aus','AUS')}},
  {label:'Not yet.',w:10,fx(S){later(S,200,'anschluss','GER')}}]});
ev('anschluss_aus',{pic:'🏔️',title:'An ultimatum from Berlin',
 text:S=>'Germany demands that the plebiscite be cancelled and the government handed to its nominee, or it will invade. '+(has(S,'ita_aloof')?'Italy, as in 1934, has moved divisions to the Brenner.':'Italy, which guaranteed our independence in 1934, does not answer the telephone.')+' The army could resist for a few days.',
 opts:S=>[
  {label:'Yield to force. Order the army not to resist.',tip:'Austria is absorbed into Germany.',w:has(S,'ita_aloof')?45:82,fx(S){anschlussDone(S)}},
  {label:'Refuse, and appeal to the powers.',tip:'France decides whether Austria stands alone.',w:has(S,'ita_aloof')?55:18,fx(S){set(S,'aus_resists');if(has(S,'ita_aloof')&&alive(S,'ITA'))S.guar.push(['ITA','AUS']);later(S,1,'anschluss_powers','FRA')}}]});
function anschlussDone(S){set(S,'anschluss_done');annex(S,'AUS','GER','German troops cross into Austria unopposed. The country is declared a province of the Reich; within days its Jews are being robbed, beaten and driven out.');
  raise(S,'GER',5,0);bump(S,'GER','stab',6);G.tension(S,6);for(const o of['ENG','FRA','CZE'])G.op(S,o,'GER',-12)}
ev('anschluss_powers',{pic:'🏔️',title:'Austria appeals for help',
 text:'Vienna has refused the German ultimatum and asks whether France will stand behind it. France is between governments this week.',
 opts:S=>[
  {label:'Guarantee Austrian independence.',tip:'If Germany invades, France is at war.',w:12,fx(S){if(alive(S,'AUS'))S.guar.push(['FRA','AUS']);G.tension(S,6);G.news(S,'France guarantees the independence of Austria.','dip');later(S,2,'anschluss_ger2','GER')}},
  {label:'Austria is beyond help.',tip:'',w:88,fx(S){later(S,2,'anschluss_ger2','GER')}}]});
ev('anschluss_ger2',{pic:'🏔️',title:'Austria refuses',
 text:'Vienna will not yield.',
 opts:S=>{const backed=S.guar.some(g=>g[1]==='AUS');return[
  {label:'March.',w:backed?45:90,fx(S){if(!alive(S,'AUS'))return;if(!backed){anschlussDone(S);return}G.declareWar(S,'GER','AUS',{text:'Germany invades Austria.'})}},
  {label:'Call it off.',w:backed?55:10,fx(S){set(S,'anschluss_failed');bump(S,'GER','stab',-10);if(alive(S,'AUS'))bump(S,'AUS','stab',15);G.tension(S,-3);G.news(S,'Berlin withdraws its ultimatum to Austria.','dip');later(S,300,'anschluss','GER')}}]}});
ev('pogrom',{tag:'GER',when:S=>S.day>=DAY(1938,11,9)&&reg(S)&&alive(S,'GER'),pic:'🕯️',title:'November 1938',text:'A night of organised violence.',
 opts:S=>[{label:'Continue.',fx(S){G.news(S,'In a single night of state-organised violence across Germany, synagogues are burned, thousands of Jewish shops and homes are wrecked, about a hundred people are killed and some thirty thousand Jewish men are sent to concentration camps.','story');
   for(const o of['ENG','FRA','NED','BEL','SWE','SWI'])if(!S.nat[o].dead)G.op(S,o,'GER',-10)}}]});

/* --- Czechoslovakia --- */
ev('munich',{tag:'GER',when:S=>S.day>=DAY(1938,9,12)&&reg(S)&&alive(S,'CZE')&&!war(S,'GER','CZE')&&!G.inWar(S,'GER'),pic:'🏞️',title:'The Sudetenland',
 text:'Three million German-speakers live inside Czechoslovakia\'s mountain frontier, and so do its fortresses.',
 opts:S=>[
  {label:'Demand the Sudetenland by 1 October.',w:90,fx(S){set(S,'sudeten_demand');G.tension(S,10);G.news(S,'At Nuremberg the German Chancellor demands "self-determination" for the Sudeten Germans. Prague declares martial law in the border districts.','story');later(S,3,'munich_eng','ENG')}},
  {label:'Not this year.',w:10,fx(S){later(S,180,'munich','GER')}}]});
ev('munich_eng',{pic:'✈️',title:'War by October?',
 text:'Germany will invade Czechoslovakia in a fortnight unless it is given the Sudetenland. France is bound by treaty to defend the Czechs; Britain is bound only to France. The Chiefs of Staff advise that nothing can save Czechoslovakia from being overrun, and that London has almost no modern fighters.',
 opts:S=>[
  {label:'Fly to Germany and arrange a peaceful transfer.',tip:'Presses France and Prague to give way.',w:75,fx(S){set(S,'eng_appease');G.news(S,'The British Prime Minister flies to Berchtesgaden to negotiate with the German Chancellor.','dip');later(S,2,'munich_fra','FRA')}},
  {label:'Warn Berlin that if France fights, Britain fights.',tip:'War support +6, Germany −15.',w:25,fx(S){set(S,'eng_firm');bump(S,'ENG','ws',6);G.op(S,'ENG','GER',-15);G.op(S,'ENG','CZE',20);G.tension(S,6);G.news(S,'London warns that Britain will stand by France if Czechoslovakia is attacked.','dip');later(S,2,'munich_fra','FRA')}}]});
ev('munich_fra',{pic:'📜',title:'The treaty of 1924',
 text:S=>'France has promised to go to war if Czechoslovakia is attacked. '+(has(S,'eng_appease')?'Britain is urging a negotiated cession and will not promise to fight.':'Britain has said it will stand with us.')+' The air force says it would be destroyed in two weeks.',
 opts:S=>[
  {label:'Tell Prague it must give way.',tip:'The guarantee to Czechoslovakia is withdrawn.',w:has(S,'eng_appease')?85:35,fx(S){set(S,'fra_abandon');S.guar=S.guar.filter(g=>!(g[0]==='FRA'&&g[1]==='CZE'));G.op(S,'FRA','CZE',-40);bump(S,'FRA','ws',-4);later(S,2,'munich_cze','CZE')}},
  {label:'France will honour its signature.',tip:'War support +6.',w:has(S,'eng_appease')?15:65,fx(S){set(S,'fra_firm');bump(S,'FRA','ws',6);G.op(S,'FRA','CZE',15);G.tension(S,5);later(S,2,'munich_cze','CZE')}}]});
ev('munich_cze',{pic:'🏰',title:'The decision in Prague',
 text:S=>(has(S,'fra_abandon')?'France has told us that if we refuse the German terms we fight alone. ':'France says it will honour the alliance. ')+(has(S,'eng_firm')?'Britain has warned Berlin. ':'')+'Thirty-five divisions stand in the frontier fortifications. Without the Sudetenland the country has no defensible border and loses most of its heavy industry.',
 opts:S=>[
  {label:'Accept the loss of the Sudetenland.',tip:'The frontier forts and two-fifths of our arms industry are lost. Stability −20.',w:has(S,'fra_abandon')?85:20,fx(S){set(S,'munich_signed');for(const k of['prague','brno','pressburg'])if(own(S,k)==='CZE')S.prov[G.KEY[k]].fort=0;
    const N=S.nat.CZE;N.builtMil-=Math.round(N.mil*.4);bump(S,'CZE','stab',-20);bump(S,'CZE','ws',-20);S.nat.GER.builtMil+=4;bump(S,'GER','stab',6);G.tension(S,-8);S.guar=S.guar.filter(g=>g[1]!=='CZE');
    G.news(S,'At Munich, Britain, France, Germany and Italy agree that Czechoslovakia must hand over the Sudetenland within ten days. The Czechs are not at the table.','story');G.say(S,'ENG','Peace for our time.')}},
  {label:'Mobilise. We will fight.',tip:'Germany must decide whether to attack.',w:has(S,'fra_abandon')?15:80,fx(S){set(S,'cze_fights');bump(S,'CZE','ws',10);G.tension(S,8);G.news(S,'Czechoslovakia orders general mobilisation and rejects the German demands.','story');later(S,3,'munich_ger2','GER')}}]});
ev('munich_ger2',{pic:'⚔️',title:'The Czechs will fight',
 text:'Prague has mobilised. The General Staff has warned in writing that a war now against the Czech forts, France and perhaps Britain cannot be won.',
 opts:S=>{const f=has(S,'fra_firm'),e=has(S,'eng_firm');return[
  {label:'Attack on 1 October.',w:f?(e?35:60):85,fx(S){G.declareWar(S,'GER','CZE',{text:'Germany invades Czechoslovakia.'})}},
  {label:'Postpone.',w:f?(e?30:40):15,fx(S){set(S,'munich_failed');bump(S,'GER','stab',-12);bump(S,'CZE','stab',10);G.tension(S,-5);G.news(S,'Berlin lets its deadline pass. Czechoslovakia stands.','dip');later(S,270,'munich','GER')}},
  {label:'The generals arrest the Chancellor rather than obey.',w:f&&e?35:0,fx(S){regimeFalls(S,'Ordered to begin a war they believe lost in advance, the commanders of the Berlin garrison seize the Chancellery.')}}]}});
ev('eng_joins',{tag:'ENG',when:S=>alive(S,'ENG')&&war(S,'FRA','GER')&&!war(S,'ENG','GER')&&!S.nat.FRA.capit&&(has(S,'eng_firm',5)||has(S,'rhine_joint',5)||(S.wars['FRA|GER']&&S.day-S.wars['FRA|GER'].day>40)),pic:'🎩',title:'France is at war',
 text:'France and Germany are fighting. Britain has no treaty that compels it to join, and no illusion about what a German victory would mean.',
 opts:S=>[
  {label:'Declare war on Germany.',tip:'An alliance with France.',w:has(S,'eng_firm')?90:60,fx(S){allies(S,['FRA','ENG']);if(!war(S,'ENG','GER'))G.declareWar(S,'ENG','GER')}},
  {label:'Stay out.',tip:'France −30.',w:has(S,'eng_firm')?10:40,fx(S){G.op(S,'ENG','FRA',-30)}}]});
ev('prague',{tag:'CZE',when:S=>S.day>=DAY(1939,3,14)&&has(S,'munich_signed',60)&&reg(S)&&alive(S,'CZE')&&!war(S,'GER','CZE'),pic:'🏰',title:'President Hácha in Berlin',
 text:'Slovakia has declared independence under German protection. The President has been summoned to Berlin in the night and told that German bombers will destroy Prague at dawn unless he signs the country over.',
 opts:S=>[
  {label:'Sign. Order the army to stay in barracks.',tip:'Czechoslovakia ceases to exist.',w:85,fx(S){set(S,'prague_occupied');annex(S,'CZE','GER','German troops occupy Prague. Bohemia and Moravia become a German protectorate; the Munich agreement is six months old.');raise(S,'GER',4,0);S.nat.GER.builtMil+=5;G.tension(S,12);
    for(const o of['ENG','FRA','POL'])G.op(S,o,'GER',-30);bump(S,'ENG','ws',10);bump(S,'FRA','ws',8)}},
  {label:'Refuse. Fight in the streets if we must.',tip:'War with Germany, without forts and without allies.',w:15,fx(S){set(S,'prague_occupied');G.tension(S,12);for(const o of['ENG','FRA','POL'])G.op(S,o,'GER',-30);G.declareWar(S,'GER','CZE',{text:'Germany invades what remains of Czechoslovakia.'})}}]});

/* --- Poland --- */
ev('guarantee_pol',{tag:'ENG',when:S=>S.day>=DAY(1939,3,31)&&reg(S)&&alive(S,'POL')&&!S.guar.some(g=>g[0]==='ENG'&&g[1]==='POL')&&(has(S,'prague_occupied')||has(S,'anschluss_done')||S.tension>=60),pic:'🛡️',title:'A line in the east',
 text:'Germany has broken every undertaking it has given. Its newspapers have now turned on Poland. The Foreign Office proposes a public guarantee of Polish independence, to be given jointly with France.',
 opts:S=>[
  {label:'Guarantee Poland.',tip:'An alliance with France. If Poland is attacked, Britain is at war.',w:85,fx(S){set(S,'pol_guaranteed');if(!S.guar.some(g=>g[0]==='ENG'&&g[1]==='POL'))S.guar.push(['ENG','POL']);allies(S,['ENG','FRA']);G.op(S,'ENG','POL',30);G.tension(S,8);
    G.news(S,'Britain and France guarantee the independence of Poland.','story')}},
  {label:'No commitments east of the Rhine.',tip:'Poland −20.',w:15,fx(S){set(S,'no_guarantee');G.op(S,'ENG','POL',-20)}}]});
ev('pact',{tag:'RUS',when:S=>S.day>=DAY(1939,8,19)&&reg(S)&&!!D.NATIONS.RUS.regime&&alive(S,'RUS')&&alive(S,'POL')&&!war(S,'GER','RUS')&&!G.inWar(S,'GER'),pic:'🖊️',title:'Two delegations in Moscow',
 text:'A British and French military mission has been in Moscow for a week without authority to sign anything. Berlin offers a non-aggression pact at once, with a secret protocol dividing eastern Europe.',
 opts:S=>[
  {label:'Sign with Germany.',w:has(S,'munich_signed')?85:60,fx(S){pactSigned(S)}},
  {label:'Sign with Britain and France, if Poland will let the Red Army through.',w:has(S,'pol_guaranteed')?25:8,fx(S){set(S,'soviet_west');later(S,2,'pol_passage','POL')}},
  {label:'Sign with no one.',w:12,fx(S){set(S,'soviet_aloof')}}]});
function pactSigned(S){set(S,'mr_pact');S.rel.GER.RUS=25;S.rel.RUS.GER=25;G.tension(S,10);G.news(S,'Germany and the Soviet Union sign a ten-year pact of non-aggression. The chancelleries of Europe are stunned.','story');G.say(S,'POL','Is not good.')}
ev('pol_passage',{pic:'🚂',title:'The Red Army at the door',
 text:'Moscow will ally with Britain and France against Germany on one condition: Soviet armies must be free to cross Polish territory. Marshal Rydz-Śmigły has said that with the Germans we risk our liberty, and with the Russians our soul.',
 opts:S=>[
  {label:'Refuse.',tip:'The Soviet Union will probably turn to Berlin.',w:80,fx(S){set(S,'soviet_spurned');G.op(S,'POL','RUS',-15);if(G.rnd(S)<.75)pactSigned(S);else set(S,'soviet_aloof')}},
  {label:'Agree.',tip:'The Soviet Union joins the alliance with Britain and France. Stability −8.',w:20,fx(S){set(S,'grand_coalition');bump(S,'POL','stab',-8);S.guar.push(['RUS','POL']);G.op(S,'POL','RUS',25);G.op(S,'RUS','FRA',25);G.op(S,'RUS','ENG',25);
    G.news(S,'Britain, France and the Soviet Union sign a military alliance. Poland consents to the passage of Soviet troops.','story')}}]});
ev('danzig',{tag:'GER',when:S=>S.day>=DAY(1939,8,25)&&reg(S)&&alive(S,'POL')&&!war(S,'GER','POL')&&!G.inWar(S,'GER'),pic:'⚓',title:'Danzig',
 text:'The Free City of Danzig and a road across the Polish Corridor.',
 opts:S=>[
  {label:'Present the demand.',w:92,fx(S){G.tension(S,8);G.news(S,'Germany demands Danzig and an extraterritorial road and railway across the Polish Corridor.','story');later(S,2,'danzig_pol','POL')}},
  {label:'Wait.',w:8,fx(S){later(S,150,'danzig','GER')}}]});
ev('danzig_pol',{pic:'⚓',title:'The German demands',
 text:S=>'Berlin demands Danzig and a corridor across the Corridor. '+(S.guar.some(g=>g[0]==='ENG'&&g[1]==='POL')?'Britain and France have guaranteed our independence. ':S.guar.some(g=>g[1]==='POL')?'France is pledged to us; Britain is not. ':'No one is pledged to us. ')+(has(S,'mr_pact')?'Germany and the Soviet Union have just signed a pact.':'')+' Colonel Beck reminds the Sejm that there is one thing in the life of nations that is without price, and that is honour.',
 opts:S=>[
  {label:'Refuse.',tip:'Germany must decide whether to attack.',w:85,fx(S){set(S,'danzig_refused');bump(S,'POL','ws',8);later(S,4,'danzig_ger2','GER')}},
  {label:'Cede the Corridor.',tip:'The Danzig Corridor passes to Germany. Stability −15. Poland is cut off from the sea.',w:15,fx(S){set(S,'danzig_ceded');if(own(S,'danzig')==='POL'){G.transfer(S,'danzig','GER');G.addClaim(S,'POL','danzig')}bump(S,'POL','stab',-15);bump(S,'POL','ws',-10);bump(S,'GER','stab',6);
    G.news(S,'Poland cedes Danzig and the Corridor to Germany.','story');later(S,240,'danzig_more','GER')}}]});
ev('danzig_more',{pic:'⚔️',title:'Poland, again',text:'Posen and Upper Silesia were German before 1919.',
 opts:S=>[{label:'Invade.',w:75,fx(S){if(reg(S)&&alive(S,'POL')&&!war(S,'GER','POL')){G.declareWar(S,'GER','POL',{text:'German forces cross the Polish frontier at dawn.'});if(has(S,'mr_pact'))later(S,17,'soviet_east','RUS')}}},{label:'Be content.',w:25,fx(S){}}]});
ev('danzig_ger2',{pic:'⚔️',title:'Case White',
 text:'Poland has refused.',
 opts:S=>[
  {label:'Attack.',w:has(S,'mr_pact')?95:has(S,'grand_coalition')?35:75,fx(S){if(!alive(S,'POL'))return;G.declareWar(S,'GER','POL',{text:'German forces cross the Polish frontier at dawn.'});if(has(S,'mr_pact'))later(S,17,'soviet_east','RUS')}},
  {label:'Draw back.',w:has(S,'mr_pact')?5:has(S,'grand_coalition')?65:25,fx(S){set(S,'danzig_failed');bump(S,'GER','stab',-10);G.tension(S,-4);G.news(S,'Germany lets its ultimatum to Poland lapse.','dip');later(S,240,'danzig','GER')}}]});
ev('soviet_east',{pic:'🚩',title:'The secret protocol',text:'The Polish army is breaking. The line agreed with Berlin runs along the Bug.',
 opts:S=>[{label:'Occupy eastern Poland.',w:92,fx(S){let n=0;for(const k of['brestlitovsk','pinsk','rovno','lemberg','vilna'])if(own(S,k)==='POL'&&S.prov[G.KEY[k]].ctrl==='POL'){G.transfer(S,k,'RUS');G.addClaim(S,'POL',k);n++}
   if(n){G.news(S,'The Red Army enters eastern Poland "to protect the Ukrainian and Belorussian populations". Poland is partitioned for the fourth time.','story');G.checkCapit(S)}}},{label:'Stay behind the frontier.',w:8,fx(S){}}]});
ev('case_yellow',{tag:'GER',when:S=>reg(S)&&war(S,'GER','FRA')&&!S.nat.FRA.capit&&alive(S,'BEL')&&!war(S,'GER','BEL')&&S.wars['FRA|GER']&&S.day-S.wars['FRA|GER'].day>230,pic:'🗺️',title:'The western offensive',
 text:'The French frontier is fortified from Switzerland to Luxembourg. Belgium and the Netherlands are not.',
 opts:S=>[{label:'Through the Low Countries.',w:88,fx(S){for(const x of['LUX','NED','BEL'])if(alive(S,x)&&!war(S,'GER',x))G.declareWar(S,'GER',x,{text:x==='BEL'?'Germany invades Belgium, the Netherlands and Luxembourg without warning.':'German troops enter '+nm(S,x)+'.'})}},
  {label:'Stay behind the Westwall.',w:12,fx(S){}}]});
ev('winter_war',{tag:'FIN',when:S=>S.day>=DAY(1939,11,26)&&!!D.NATIONS.RUS.regime&&alive(S,'FIN')&&alive(S,'RUS')&&!war(S,'RUS','FIN')&&!war(S,'RUS','GER')&&own(S,'vyborg')==='FIN',pic:'❄️',title:'Moscow\'s demands',
 text:'The Soviet Union demands the Karelian Isthmus, on which Finland\'s only fortified line stands, to move the frontier away from Leningrad.',
 opts:S=>[
  {label:'Refuse.',tip:'War with the Soviet Union.',w:75,fx(S){G.declareWar(S,'RUS','FIN',{text:'The Soviet Union attacks Finland. Helsinki is bombed on the first morning.'});G.op(S,'ENG','RUS',-20);G.op(S,'FRA','RUS',-20);G.op(S,'SWE','RUS',-25);G.say(S,'FIN','Is of sisu.')}},
  {label:'Cede the Isthmus.',tip:'Viipuri passes to the Soviet Union. Stability −12.',w:25,fx(S){G.transfer(S,'vyborg','RUS');G.addClaim(S,'FIN','vyborg');bump(S,'FIN','stab',-12);G.news(S,'Finland cedes the Karelian Isthmus to the Soviet Union.','dip')}}]});
ev('winter_peace',{tag:'RUS',when:S=>war(S,'RUS','FIN')&&S.wars['FIN|RUS']&&S.day-S.wars['FIN|RUS'].day>105&&!S.nat.FIN.dead&&G.sideOf(S,'FIN').length===1,pic:'❄️',title:'Peace with Finland',text:'The war has cost far more than expected.',
 opts:S=>[{label:'Take the Isthmus and make peace.',w:80,fx(S){G.treaty(S,['FIN'],[],0)}},{label:'Fight on to Helsinki.',w:20,fx(S){}}]});
ev('baltic',{tag:'RUS',when:S=>S.day>=DAY(1940,6,15)&&has(S,'mr_pact')&&alive(S,'RUS')&&!war(S,'RUS','GER'),pic:'🚩',title:'The Baltic states and Bessarabia',text:'The secret protocol assigns them to the Soviet sphere.',
 opts:S=>[{label:'Send the ultimatums.',w:90,fx(S){for(const x of['EST','LAT','LIT'])if(alive(S,x)&&!war(S,'RUS',x))later(S,1,'baltic_ult',x);if(alive(S,'ROM')&&own(S,'kishinev')==='ROM')later(S,12,'bessarabia','ROM')}},{label:'Leave them be.',w:10,fx(S){}}]});
ev('baltic_ult',{pic:'🚩',title:'A Soviet ultimatum',
 text:(S,tg)=>'Moscow accuses '+nm(S,tg)+' of conspiring against it and demands a new government and free entry for the Red Army. There are already Soviet garrisons in the country.',
 opts:(S,tg)=>[
  {label:'Submit.',tip:'The country is absorbed into the Soviet Union.',w:88,fx(S){annex(S,tg,'RUS','The Red Army occupies '+nm(S,tg)+', which is declared a Soviet republic.')}},
  {label:'Resist.',tip:'War with the Soviet Union.',w:12,fx(S){G.declareWar(S,'RUS',tg)}}]});
ev('bessarabia',{pic:'🚩',title:'Bessarabia',
 text:'The Soviet Union gives Romania four days to evacuate Bessarabia and northern Bukovina. Berlin advises us to comply.',
 opts:S=>[
  {label:'Evacuate.',tip:'Chișinău and Cernăuți pass to the Soviet Union. Stability −12.',w:85,fx(S){for(const k of['kishinev','czernowitz'])if(own(S,k)==='ROM'){G.transfer(S,k,'RUS');G.addClaim(S,'ROM',k)}bump(S,'ROM','stab',-12);G.op(S,'ROM','RUS',-30);G.news(S,'Romania evacuates Bessarabia and northern Bukovina.','dip')}},
  {label:'Fight.',tip:'War with the Soviet Union.',w:15,fx(S){G.declareWar(S,'RUS','ROM')}}]});
ev('italy_enters',{tag:'ITA',when:S=>!!D.NATIONS.ITA.regime&&reg(S)&&alive(S,'ITA')&&!G.inWar(S,'ITA')&&war(S,'GER','FRA')&&(G.vpShare(S,'FRA')<.85||S.nat.FRA.capit),pic:'🗡️',title:'A few thousand dead',
 text:'France is breaking. Mussolini says he needs only a few thousand dead to sit at the peace conference as a belligerent.',
 opts:S=>[
  {label:'Declare war on France and Britain.',w:has(S,'axis')?80:35,fx(S){axis(S,['GER','ITA']);if(!war(S,'ITA','FRA')&&alive(S,'FRA'))G.declareWar(S,'ITA','FRA');G.say(S,'ITA','Is safe now? Then avanti!')}},
  {label:'Stay non-belligerent.',w:has(S,'axis')?20:65,fx(S){set(S,'ita_out36')}}]});
ev('fall_of_france',{tag:'ENG',when:S=>S.nat.FRA.capit&&alive(S,'ENG')&&war(S,'ENG','GER')&&reg(S),pic:'🏝️',title:'Alone',
 text:'France has asked for an armistice. The army has come home from Dunkirk without its guns. Through neutral capitals Berlin lets it be known that Britain could keep its Empire in return for a free German hand in Europe.',
 opts:S=>[
  {label:'We shall never surrender.',tip:'War support +20, stability +5.',w:85,fx(S){bump(S,'ENG','ws',20);bump(S,'ENG','stab',5);G.rename(S,'ENG',{head:'Prime Minister Churchill'});G.news(S,'France signs an armistice at Compiègne. Britain fights on alone.','story');G.say(S,'ENG','Never.')}},
  {label:'Ask what the terms are.',tip:'The war in the west ends on Germany\'s terms.',w:15,fx(S){G.news(S,'France signs an armistice at Compiègne. Britain opens negotiations through Stockholm.','story');G.treaty(S,G.sideOf(S,'ENG').filter(x=>G.enemies(S,x).length),[],1)}}]});
function joiner(id,tag,title,text){ev(id,{tag,when:S=>reg(S)&&alive(S,tag)&&!G.inWar(S,tag)&&S.nat.FRA.capit&&G.inWar(S,'GER')&&!!S.nat.GER.faction&&S.day>=DAY(1940,11,1)&&!S.nat[tag].faction,pic:'🖊️',title,text,
 opts:S=>[{label:'Sign the Tripartite Pact.',tip:'Join the Axis.',w:60,fx(S){axis(S,['GER',tag])}},{label:'Stay neutral.',tip:'',w:40,fx(S){}}]})}
joiner('hun_axis','HUN','Hungary and the Axis','Germany is master of the continent, and only Germany can return what Hungary lost at Trianon.');
joiner('rom_axis','ROM','Romania and the Axis','We have lost Bessarabia without a shot. Only Germany can protect what remains, and Germany wants our oil.');
joiner('bul_axis','BUL','Bulgaria and the Axis','German divisions are on the Danube. They ask for passage, and offer Thrace.');
ev('barbarossa',{tag:'GER',when:S=>reg(S)&&alive(S,'GER')&&alive(S,'RUS')&&!war(S,'GER','RUS')&&!G.friendly(S,'GER','RUS')&&((S.nat.FRA.capit&&S.day>=DAY(1941,6,22))||(S.day>=DAY(1942,6,1)&&G.inWar(S,'GER'))),pic:'🧭',title:'The east',
 text:'The Soviet Union is the last power on the continent.',
 opts:S=>[{label:'Invade.',w:85,fx(S){G.declareWar(S,'GER','RUS',{text:'Germany invades the Soviet Union along the whole frontier from the Baltic to the Black Sea. It is the largest invasion in history.'});G.say(S,'RUS','Is very big mistake.')}},
  {label:'Not this year.',w:15,fx(S){later(S,365,'barbarossa','GER')}}]});
ev('grand_alliance',{tag:'ENG',when:S=>alive(S,'ENG')&&alive(S,'RUS')&&war(S,'GER','RUS')&&war(S,'GER','ENG')&&!G.friendly(S,'ENG','RUS')&&!war(S,'ENG','RUS'),pic:'🤝',title:'An ally in the east',
 text:'Germany and the Soviet Union are at war. No one has been a more consistent opponent of Communism than this government. But any state that fights Germany will have our aid.',
 opts:S=>[{label:'Alliance with the Soviet Union.',tip:'',w:90,fx(S){const f=S.nat.ENG.faction;if(f&&!S.nat.RUS.faction)G.joinFaction(S,'RUS',f);else allies(S,['ENG','RUS']);G.op(S,'ENG','RUS',40)}},
  {label:'Let them bleed each other.',tip:'',w:10,fx(S){}}]});
ev('lend_lease',{tag:S=>['ENG','FRA','RUS'].find(x=>alive(S,x)&&war(S,x,'GER'))||null,when:S=>S.day>=DAY(1941,3,11)&&reg(S)&&['ENG','FRA','RUS'].some(x=>alive(S,x)&&war(S,x,'GER')),pic:'🚢',title:'Lend-Lease',
 text:'The United States Congress has voted to supply arms to any country whose defence the President deems vital to America.',
 opts:S=>[{label:'The arsenal of democracy.',tip:'Rifles, guns and lorries arrive.',fx(S){for(const x of['ENG','FRA','RUS'])if(alive(S,x)&&war(S,x,'GER')){const k=S.nat[x].stock;k.rifles+=5000;k.guns+=200;k.trucks=(k.trucks||0)+600;bump(S,x,'ws',4)}G.news(S,'The United States begins supplying arms to the nations fighting Germany.','story')}}]});
ev('usa36',{tag:S=>['ENG','FRA','RUS'].find(x=>alive(S,x)&&war(S,x,'GER'))||null,when:S=>S.day>=DAY(1941,12,11)&&reg(S)&&G.inWar(S,'GER')&&['ENG','FRA','RUS'].some(x=>alive(S,x)&&war(S,x,'GER')),pic:'🗽',title:'America at war',
 text:'Japan has attacked the American fleet at Pearl Harbor, and Germany has declared war on the United States. American divisions will cross the Atlantic within the year.',
 opts:(S,tg)=>[{label:'So we have won after all.',tip:'American divisions and supplies arrive.',fx(S){set(S,'usa_in');const who=alive(S,'ENG')&&war(S,'ENG','GER')?'ENG':tg,p=['plymouth','bristol','london','brest','bordeaux','odessa','moscow'].map(k=>G.KEY[k]).find(i=>S.prov[i].ctrl===who);
   if(p!==undefined){G.spawn(S,who,p,0,12,.3,'# US Infantry Division');if(S.nat[who].tpls[2])G.spawn(S,who,p,2,3,.3,'# US Armored Division');G.index(S)}
   for(const x of['ENG','FRA','RUS'])if(alive(S,x)&&war(S,x,'GER')){const k=S.nat[x].stock;k.rifles+=8000;k.guns+=400;k.mtanks=(k.mtanks||0)+150;bump(S,x,'ws',12)}bump(S,'GER','ws',-6);
   G.news(S,'The United States is at war with Germany.','story')}}]});
ev('july_plot',{tag:'GER',when:S=>reg(S)&&G.inWar(S,'GER')&&alive(S,'GER')&&(S.nat.GER.ws<28||S.nat.GER.stab<28||(S.day>=DAY(1944,7,20)&&G.vpShare(S,'GER')<.9)),pic:'💼',title:'The briefcase',
 text:'A colonel of the General Staff has carried a bomb into the Chancellor\'s headquarters.',
 opts:S=>[{label:'The bomb kills him.',w:45,fx(S){regimeFalls(S,'The German Chancellor is killed by a bomb planted by army officers.')}},
  {label:'He survives.',w:55,fx(S){bump(S,'GER','stab',-6);G.news(S,'An attempt by army officers to kill the German Chancellor fails. Thousands are arrested.','story');later(S,300,'july_plot','GER')}}]});
ev('regime_crisis',{tag:'GER',when:S=>reg(S)&&!G.inWar(S,'GER')&&S.nat.GER.stab<34,pic:'🗡️',title:'A regime that has stopped winning',
 text:'The Chancellor promised bloodless victories. He has delivered retreats.',
 opts:S=>[{label:'The army removes him.',w:55,fx(S){regimeFalls(S,'After one humiliation too many, the army moves against the party.')}},{label:'He holds on.',w:45,fx(S){bump(S,'GER','stab',10)}}]});
/* if the dictatorship falls, the frontier of 1919 is still a grievance, but one for conference tables */
ev('revision',{tag:'POL',when:S=>has(S,'regime_fell',300)&&alive(S,'POL')&&alive(S,'GER')&&!war(S,'GER','POL')&&own(S,'danzig')==='POL',pic:'📜',title:'Germany asks for a plebiscite',
 text:'The new government in Berlin, anxious to show its voters that moderation pays, asks for a League-supervised vote in the Corridor and offers Poland a guaranteed free port and a twenty-five-year pact in return.',
 opts:S=>[
  {label:'Agree to the plebiscite.',tip:'The Corridor will probably vote to stay Polish; Danzig city will not. Germany +30, stability −4.',w:45,fx(S){G.op(S,'POL','GER',30);bump(S,'POL','stab',-4);G.tension(S,-8);G.news(S,'Poland and Germany agree to settle the Corridor by plebiscite. The city of Danzig votes for Germany; the countryside stays Polish.','dip')}},
  {label:'Refuse. The frontier is not for sale.',tip:'Germany −20.',w:55,fx(S){G.op(S,'POL','GER',-20);G.tension(S,4)}}]});
/* the player's own home front in the later scenarios */
E.home36={scen:'any',tag:S=>S.player,when:S=>S.scen!=='1914'&&S.nat[S.player]&&alive(S,S.player)&&G.inWar(S,S.player)&&S.nat[S.player].stab<18&&!(S.flags.collapse36>S.day-200),pic:'🏚️',title:'The home front gives way',
 text:'There are strikes in the arms factories and the ministers no longer agree on anything except that the war cannot be carried through another winter.',
 opts:(S,tg)=>[{label:'Ask for an armistice.',tip:'The enemy decides the terms.',fx(S){S.flags.collapse36=S.day;S.fired.home36=undefined;sue(S,tg)}},
  {label:'Fight on.',tip:'Stability +6 through repression, war support −8.',fx(S){S.flags.collapse36=S.day;S.fired.home36=undefined;bump(S,tg,'stab',6);bump(S,tg,'ws',-8)}}]};

/* =====================================================================
   Plans for 1936
   ===================================================================== */
const st=bump,modf=(S,tg,k,v)=>{const m=S.nat[tg].mod;m[k]=(m[k]||0)+v},fac=(S,tg,c,m)=>{S.nat[tg].builtCiv+=c;S.nat[tg].builtMil+=m},op=(S,tg,o,v)=>{if(S.nat[o]&&!S.nat[o].dead)G.op(S,o,tg,v)};
const fort=(S,tg,keys,n)=>{for(const k of keys){const i=G.KEY[k];if(i!==undefined&&S.prov[i].ctrl===tg)S.prov[i].fort=Math.min(5,S.prov[i].fort+(n||1))}};
function P(id,only,group,name,desc,fx,o){L[id]=Object.assign({id,group,name,desc,fx,days:70,scen:'1936',only},o||{})}
P('eng36_shadow','ENG','Kingdom','Shadow factories','Motor works are equipped to build aircraft and tanks. +4 military factories.',(S,tg)=>fac(S,tg,0,4));
P('eng36_fighter','ENG','Kingdom','Fighter Command','Radar stations and eight-gun fighters. Defence +8%, stability +3.',(S,tg)=>{modf(S,tg,'infDef',.08);st(S,tg,'stab',3)},{req:['eng36_shadow']});
P('eng36_appease','ENG','Kingdom','Appeasement','Remove Germany\'s grievances and there will be nothing to fight about. Stability +8, Germany +20, tension −5, war support −6.',(S,tg)=>{st(S,tg,'stab',8);op(S,tg,'GER',20);G.tension(S,-5);st(S,tg,'ws',-6)},{x:['eng36_collective'],w:()=>2});
P('eng36_collective','ENG','Kingdom','Collective security','A grand alliance against aggression. War support +10, France +20, the Soviet Union +15, Germany −15.',(S,tg)=>{st(S,tg,'ws',10);op(S,tg,'FRA',20);op(S,tg,'RUS',15);op(S,tg,'GER',-15)},{x:['eng36_appease']});
P('eng36_training','ENG','Kingdom','The Military Training Act','Conscription in peacetime, for the first time. Limited conscription; 6 new divisions.',(S,tg)=>{S.nat[tg].cons=Math.max(1,S.nat[tg].cons);raise(S,tg,6,0)});
P('eng36_bef','ENG','Kingdom','A field force for the Continent','4 infantry and 2 armoured divisions.',(S,tg)=>{raise(S,tg,4,0);raise(S,tg,2,2)},{req:['eng36_training']});
P('eng36_empire','ENG','Kingdom','The Empire at war','Canada, Australia, New Zealand, South Africa and India send 8 divisions.',(S,tg)=>raise(S,tg,8,0,'# Dominion Division',.9),{war:true});
P('fra36_maginot','FRA','Republic','The Maginot Line to the sea','Fortify the Belgian frontier. Forts +2 at Lille and Reims.',(S,tg)=>fort(S,tg,['lille','reims'],2),{x:['fra36_armour']});
P('fra36_armour','FRA','Republic','The professional army','Colonel de Gaulle\'s armoured corps. 3 mechanised divisions; armoured breakthrough +20%.',(S,tg)=>{raise(S,tg,3,2);modf(S,tg,'armBrk',.2)},{x:['fra36_maginot']});
P('fra36_matignon','FRA','Republic','The Matignon Accords','The forty-hour week and paid holidays. Stability +12, factory output −4%.',(S,tg)=>{st(S,tg,'stab',12);modf(S,tg,'prod',-.04)},{x:['fra36_union']});
P('fra36_union','FRA','Republic','A government of national union','Stability +5, war support +8.',(S,tg)=>{st(S,tg,'stab',5);st(S,tg,'ws',8)},{x:['fra36_matignon']});
P('fra36_east','FRA','Republic','The eastern alliances','Staff talks with Warsaw, Prague and Moscow. Poland +15, Czechoslovakia +15, the Soviet Union +15.',(S,tg)=>{op(S,tg,'POL',15);op(S,tg,'CZE',15);op(S,tg,'RUS',15)});
P('fra36_arms','FRA','Republic','Nationalise the arms industry','+4 military factories.',(S,tg)=>fac(S,tg,0,4));
P('fra36_class','FRA','Republic','Call up the reserves','6 new divisions.',(S,tg)=>raise(S,tg,6,0),{req:['fra36_arms']});
P('pol36_cop','POL','Republic','The Central Industrial District','Arms works in the fork of the Vistula and the San. +3 civilian and +2 military factories.',(S,tg)=>fac(S,tg,3,2));
P('pol36_balance','POL','Republic','The policy of balance','Equal distance from Berlin and Moscow. Germany +15, the Soviet Union +15.',(S,tg)=>{op(S,tg,'GER',15);op(S,tg,'RUS',15)},{x:['pol36_west']});
P('pol36_west','POL','Republic','Lean on the West','France +20, Britain +20, Germany −10.',(S,tg)=>{op(S,tg,'FRA',20);op(S,tg,'ENG',20);op(S,tg,'GER',-10)},{x:['pol36_balance']});
P('pol36_army','POL','Republic','The six-year army plan','6 new divisions; artillery attack +5%.',(S,tg)=>{raise(S,tg,6,0);modf(S,tg,'artAtt',.05)});
P('pol36_forts','POL','Republic','Fortify the frontiers','+1 fort level at Poznań, Łódź, Katowice and the Corridor.',(S,tg)=>fort(S,tg,['posen','lodz','oppeln','danzig'],1),{req:['pol36_army']});
P('pol36_cipher','POL','Republic','The Cipher Bureau','Three mathematicians are reading the German Enigma. Defence +5%; current research leaps forward.',(S,tg)=>{modf(S,tg,'infDef',.05);for(const r of S.nat[tg].research)r.prog+=.3});
P('pol36_romania','POL','Republic','The Romanian bridgehead','Romania +25.',(S,tg)=>op(S,tg,'ROM',25));
P('cze36_forts','CZE','Republic','The border fortresses','Forts +2 at Prague, +1 at Brno and Bratislava.',(S,tg)=>{fort(S,tg,['prague'],2);fort(S,tg,['brno','pressburg'],1)});
P('cze36_skoda','CZE','Republic','Škoda and ČKD','+4 military factories.',(S,tg)=>fac(S,tg,0,4));
P('cze36_little','CZE','Republic','The Little Entente','Romania +20, Yugoslavia +20.',(S,tg)=>{op(S,tg,'ROM',20);op(S,tg,'SER',20)},{x:['cze36_moscow']});
P('cze36_moscow','CZE','Republic','The treaty with Moscow','The Soviet Union +30, Poland −10.',(S,tg)=>{op(S,tg,'RUS',30);op(S,tg,'POL',-10)},{x:['cze36_little']});
P('cze36_statute','CZE','Republic','The nationalities statute','Autonomy for the German, Slovak and Hungarian districts. Stability +12, Germany +5.',(S,tg)=>{st(S,tg,'stab',12);op(S,tg,'GER',5)});
P('cze36_mobil','CZE','Republic','The mobilisation plan','5 new divisions.',(S,tg)=>raise(S,tg,5,0),{req:['cze36_skoda']});
P('ger36_four','GER','Reich','The Four Year Plan','+6 military factories.',(S,tg)=>fac(S,tg,0,6),{w:()=>6});
P('ger36_west','GER','Reich','The Westwall','Forts +2 at Cologne, Frankfurt and Stuttgart.',(S,tg)=>fort(S,tg,['cologne','frankfurt','stuttgart'],2),{w:()=>3});
P('ger36_army','GER','Reich','Army expansion','10 new divisions.',(S,tg)=>raise(S,tg,10,0),{w:()=>6,req:['ger36_four']});
P('ita36_autarky','ITA','Kingdom','Autarky','+3 military factories.',(S,tg)=>fac(S,tg,0,3),{w:()=>4});
P('ita36_army','ITA','Kingdom','Eight million bayonets','6 new divisions.',(S,tg)=>raise(S,tg,6,0),{w:()=>4});
P('rus36_heavy','RUS','Union','Heavy industry beyond the Urals','+8 military factories.',(S,tg)=>fac(S,tg,0,8),{w:()=>5});
P('rus36_army','RUS','Union','The Red Army','14 new divisions.',(S,tg)=>raise(S,tg,14,0),{w:()=>5,req:['rus36_heavy']});

/* =====================================================================
   Carrying a 1914 world forward to 1936
   ===================================================================== */
D.SCEN.carry={id:'carry',name:'1936: Your own world',blurb:'The world your last game left behind, eighteen years on.',start:DAY(1936,1,1),end:DAY(1946,1,1),tension:22,claims:D.SCEN['1914'].claims,
 tpl:TPL36,tech:{all:all36,GER:['mot','mtank'],FRA:['mot','mtank'],ENG:['mot','mtank'],RUS:['mot','mtank'],ITA:['mot'],AUS:['mot']},armyScale:1,factions:{},guarantees:[],opinion:[]};
const YEAR=d=>G.date(d).y,LEVEL=['a peace of reconciliation','a victor\'s peace','a dictated peace'];
/* returns a new state, or null if the player's nation no longer exists */
G.carry=function(S0){const p=S0.player;if(!S0.nat[p]||S0.nat[p].dead)return null;G.applyScen(S0);
  const ownersC={},caps={},rel={},dyn={},natOv=JSON.parse(JSON.stringify(S0.natOv||{})),hold={};
  M.provs.forEach((q,i)=>{ownersC[q.key]=S0.prov[i].owner;hold[S0.prov[i].owner]=1});
  for(const tg of G.TAGS){const N=S0.nat[tg];if(N.dead||!hold[tg])continue;if(N.cap>=0&&S0.prov[N.cap].owner===tg)caps[tg]=M.provs[N.cap].key;dyn[tg]=(N.claims||[]).slice();
    rel[tg]={};for(const o in S0.rel[tg]||{})rel[tg][o]=Math.round((S0.rel[tg][o]||0)/2);
    let g=0;for(const w in(S0.grudge[tg]||{}))if(S0.nat[w]&&!S0.nat[w].dead)g=Math.max(g,S0.grudge[tg][w]);
    if(g>=35&&tg!==p){const dials=Object.assign({},D.NATIONS[tg].dials,{amb:Math.max(.85,D.NATIONS[tg].dials.amb),cau:Math.min(.25,D.NATIONS[tg].dials.cau),gru:.9});natOv[tg]=Object.assign({},natOv[tg],{dials,regime:true,revanchist:true})}}
  const S=G.newGame(p,(S0.seed|0)+1,'carry',{owners:ownersC,caps,natOv,provNames:S0.names||null,rel,grudge:S0.grudge||{},dynClaims:dyn});
  /* the opinions of the defeated stay sour whatever else has healed */
  for(const l in S.grudge)for(const w in S.grudge[l])if(S.rel[l]&&S.rel[w]&&S.grudge[l][w]>=35)S.rel[l][w]=Math.min(S.rel[l][w]||0,-S.grudge[l][w]);
  for(const tg of G.TAGS){const N=S.nat[tg],N0=S0.nat[tg];if(N.dead)continue;N.builtCiv=Math.round((N0.builtCiv||0)*1.2)+2;N.builtMil=Math.round((N0.builtMil||0)*1.1)+1;N.navy=N0.navy;
    if(D.NATIONS[tg].major&&N.tech.includes('mtank')&&N.cap>=0){N.tpls.push(JSON.parse(JSON.stringify(TPL36.mech)));G.spawn(S,tg,N.cap,2,Math.max(1,Math.round(N.divs0/14)),D.NATIONS[tg].xp)}
    N.divs0=S.divs.filter(d=>d.o===tg).length;G.factories(S,tg);G.aiEcon(S,tg,true)}
  G.index(S);G.supply(S);S.past={seed:S0.seed,day:S0.day,treaties:S0.treaties||[],player:p};
  const rev=G.TAGS.filter(tg=>!S.nat[tg].dead&&D.NATIONS[tg].revanchist).map(tg=>nm(S,tg));
  G.news(S,'New Year 1936. '+((S0.treaties||[]).filter(x=>x.level>=0).length?'The map of Europe is the one drawn by '+(S0.treaties.filter(x=>x.level>=0).slice(-3).map(x=>LEVEL[x.level]+' of '+YEAR(x.day)).join(', '))+'.':'No great treaty has redrawn the map since 1914.')+
    (rev.length?' In '+rev.join(', ')+' a generation has grown up being taught that the peace was a crime, and governments have come to power on the promise to undo it.':' No power has a grievance it would go to war over, yet.'),'story');
  for(const x of(S0.treaties||[]).filter(x=>x.level>=0).slice(-6))G.news(S,'Remembered from '+YEAR(x.day)+': '+LEVEL[x.level]+' imposed on '+x.losers.map(l=>nm(S,l)).join(', ')+' by '+x.winners.slice(0,4).map(l=>nm(S,l)).join(', ')+'.','dip');
  return S};
/* claims pressed: a demand, then perhaps a war. Standing telegrams, fired by the monthly hook below. */
E.c_demand={scen:'any',pic:'📢',title:'A demand',
 text:(S,tg,d)=>nm(S,d.from)+' demands the cession of '+M.provs[G.KEY[d.key]].name+'. Its newspapers speak of nothing else and its army is exercising on the frontier.',
 opts:(S,tg,d)=>{const o=odds(S,d.from,tg),backed=S.guar.some(g=>g[1]===tg&&alive(S,g[0]))||G.sideOf(S,tg).length>1,cap=S.nat[tg].cap===G.KEY[d.key];return[
  {label:'Cede the province.',tip:M.provs[G.KEY[d.key]].name+' passes to '+nm(S,d.from)+'. Stability −8.',w:cap?0:(o>1.6&&!backed?60:o>1.2?25:8),fx(S){if(own(S,d.key)===tg){G.transfer(S,d.key,d.from);G.addClaim(S,tg,d.key)}bump(S,tg,'stab',-8);bump(S,d.from,'stab',5);G.tension(S,-2);
    G.news(S,nm(S,tg)+' cedes '+M.provs[G.KEY[d.key]].name+' to '+nm(S,d.from)+' under threat of war.','dip')}},
  {label:'Refuse.',tip:'They may attack.',w:40,fx(S){refuse(S,tg,d)}},
  {label:'Refuse, and ask the powers for a guarantee.',tip:'A friendly great power may pledge itself to us.',w:backed?5:30,fx(S){const g=G.TAGS.filter(x=>x!==tg&&x!==d.from&&D.NATIONS[x].major&&alive(S,x)&&!G.friendly(S,x,d.from)&&G.opinion(S,x,tg)>=10&&G.opinion(S,x,d.from)<20&&x!==S.player).sort((a,b)=>G.opinion(S,b,tg)-G.opinion(S,a,tg))[0];
    if(g&&!S.guar.some(q=>q[0]===g&&q[1]===tg)){S.guar.push([g,tg]);G.news(S,nm(S,g)+' guarantees the independence of '+nm(S,tg)+'.','dip')}refuse(S,tg,d)}}]}};
function refuse(S,tg,d){S.cb[d.from+'>'+tg]=S.day;G.tension(S,8);G.op(S,tg,d.from,-20);G.news(S,nm(S,tg)+' rejects the demand of '+nm(S,d.from)+' for '+M.provs[G.KEY[d.key]].name+'.','dip');if(d.from!==S.player)later(S,25,'c_war',d.from,{on:tg})}
E.c_war={scen:'any',pic:'⚔️',title:'The demand was refused',
 text:(S,tg,d)=>nm(S,d.on)+' has refused. The army is ready.',
 opts:(S,tg,d)=>{const o=alive(S,d.on)?odds(S,tg,d.on):0,C=D.NATIONS[tg].dials;return[
  {label:'Attack.',w:o>1+C.cau*.6?70:o>.8?15:2,fx(S){if(alive(S,d.on)&&!G.friendly(S,tg,d.on)&&!G.inWar(S,tg))G.declareWar(S,tg,d.on)}},
  {label:'Stand down.',w:30,fx(S){bump(S,tg,'stab',-5)}}]}};
const baseMonthly=G.monthly;
G.monthly=function(S){baseMonthly(S);if(!(S.scen==='carry'||(S.scen==='1936'&&has(S,'regime_fell',200))))return;
  for(const tg of G.TAGS){const C=D.NATIONS[tg],N=S.nat[tg];if(tg===S.player||N.dead||N.capit||G.inWar(S,tg)||C.dials.amb<.6||S.flags['press_'+tg]>S.day-330)continue;if(G.rnd(S)>.1*C.dials.amb)continue;
    const cl=G.claims(S,tg).filter(k=>{const o=own(S,k);return o!==tg&&alive(S,o)&&!G.friendly(S,tg,o)&&M.adj[G.KEY[k]].concat(M.sea.filter(x=>x.includes(G.KEY[k])).map(x=>x[0]===G.KEY[k]?x[1]:x[0])).some(j=>S.prov[j].owner===tg)});if(!cl.length)continue;
    const key=G.pick(S,cl),on=own(S,key);S.flags['press_'+tg]=S.day;G.tension(S,7);G.news(S,nm(S,tg)+' demands '+M.provs[G.KEY[key]].name+' from '+nm(S,on)+'.','dip');G.fire(S,'c_demand',on,{from:tg,key})}};
/* In the later scenarios a nation's own large ports feed the troops around them, so East Prussia is not starved by the Corridor. */
const baseSupply=G.supply;
G.supply=function(S){baseSupply(S);if(S.scen==='1914')return;for(const tg of G.TAGS){const N=S.nat[tg],set=S._sup[tg];if(!set||N.dead||N.capit)continue;const open=[];
  for(let i=0;i<M.provs.length;i++)if(!set.has(i)&&M.provs[i].port&&M.provs[i].vp>=3&&S.prov[i].owner===tg&&S.prov[i].ctrl===tg){set.add(i);open.push(i)}
  while(open.length){const u=open.pop();for(const j of M.adj[u])if(!set.has(j)&&G.friendly(S,tg,S.prov[j].ctrl)){set.add(j);open.push(j)}}}};
/* Yugoslavia's flag, once the art module is there to hold it */
const baseScen=G.applyScen;G.applyScen=function(S){baseScen(S);if(PK.ART&&PK.ART.FLAG&&!PK.ART.FLAG.YUG)PK.ART.FLAG.YUG={h:['#1F3F8F','#F4F1EA','#D2262B']}};
})(globalThis.PK=globalThis.PK||{});
