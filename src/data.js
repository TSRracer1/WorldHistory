/* Powder Keg — static game data. No DOM, no state. */
(function(PK){
const D=PK.DATA={};
D.VERSION=2;
D.EPOCH=Date.UTC(1914,0,1);
D.START_DAY=178;            /* 28 June 1914 */
D.MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ---------- nations ----------
   dials: amb ambition, cau caution, gru how long a grudge lasts (all 0..1)
   pop in millions; mil = share of industry that starts as military factories; navy = fleet strength */
const n=(name,adj,color,o)=>Object.assign({name,adj,color,major:false,pop:5,mil:.3,navy:1,stab:65,ws:45,cons:1,econ:0,slots:2,dials:{amb:.3,cau:.6,gru:.5},xp:.2},o);
D.NATIONS={
 GER:n('German Empire','German','#8E949B',{major:true,pop:65,mil:.42,navy:55,stab:70,ws:60,cons:2,slots:3,dials:{amb:.8,cau:.3,gru:.6},xp:.45,head:'Kaiser Wilhelm II'}),
 AUS:n('Austria-Hungary','Austro-Hungarian','#D9CDB0',{major:true,pop:51,mil:.36,navy:15,stab:50,ws:50,cons:2,dials:{amb:.6,cau:.4,gru:.8},xp:.3,head:'Emperor Franz Joseph'}),
 RUS:n('Russian Empire','Russian','#6F9A6B',{major:true,pop:166,mil:.34,navy:20,stab:48,ws:50,cons:1,dials:{amb:.6,cau:.4,gru:.6},xp:.25,head:'Tsar Nicholas II'}),
 FRA:n('French Republic','French','#6E8FC7',{major:true,pop:40,mil:.42,navy:40,stab:60,ws:60,cons:2,slots:3,dials:{amb:.5,cau:.5,gru:.9},xp:.4,head:'President Poincaré'}),
 ENG:n('British Empire','British','#D48A8A',{major:true,pop:46,mil:.24,navy:100,stab:72,ws:40,cons:0,slots:3,dials:{amb:.4,cau:.8,gru:.9},xp:.55,head:'Prime Minister Asquith'}),
 ITA:n('Kingdom of Italy','Italian','#A8C678',{major:true,pop:35,mil:.3,navy:30,stab:52,ws:35,cons:1,dials:{amb:.8,cau:.6,gru:.3},xp:.25,head:'Prime Minister Salandra'}),
 OTT:n('Ottoman Empire','Ottoman','#C9B463',{major:true,pop:21,mil:.5,navy:6,stab:42,ws:45,cons:1,dials:{amb:.6,cau:.5,gru:.6},xp:.2,head:'Enver Pasha'}),
 SER:n('Kingdom of Serbia','Serbian','#B37C5C',{pop:4.5,stab:70,ws:75,cons:2,dials:{amb:.7,cau:.2,gru:.9},xp:.45}),
 MNT:n('Montenegro','Montenegrin','#9C5A3C',{pop:.4,stab:70,ws:70,cons:2,dials:{amb:.5,cau:.2,gru:.8}}),
 ALB:n('Albania','Albanian','#9A4F55',{pop:.8,stab:30}),
 GRE:n('Kingdom of Greece','Greek','#7FB3D6',{pop:4.8,navy:4,dials:{amb:.6,cau:.6,gru:.5}}),
 BUL:n('Kingdom of Bulgaria','Bulgarian','#86A45F',{pop:4.5,cons:2,ws:55,dials:{amb:.8,cau:.5,gru:.9},xp:.35}),
 ROM:n('Kingdom of Romania','Romanian','#D8C257',{pop:7.5,dials:{amb:.7,cau:.7,gru:.4}}),
 BEL:n('Belgium','Belgian','#D6A94C',{pop:7.5,stab:75,dials:{amb:.1,cau:.8,gru:.7}}),
 NED:n('Netherlands','Dutch','#E39A52',{pop:6.2,navy:8,stab:80,dials:{amb:.1,cau:.95,gru:.4}}),
 LUX:n('Luxembourg','Luxembourgish','#9CC3D6',{pop:.26,stab:80,dials:{amb:0,cau:1,gru:.3}}),
 SWI:n('Switzerland','Swiss','#D97C78',{pop:3.8,stab:85,cons:2,dials:{amb:0,cau:1,gru:.3}}),
 SPA:n('Kingdom of Spain','Spanish','#E2C660',{pop:20,navy:8,stab:50,dials:{amb:.2,cau:.9,gru:.4}}),
 POR:n('Portugal','Portuguese','#5C9E74',{pop:6,navy:3,stab:40,dials:{amb:.3,cau:.7,gru:.4}}),
 DEN:n('Denmark','Danish','#C4605C',{pop:2.8,navy:3,stab:80,dials:{amb:.1,cau:.95,gru:.6}}),
 NOR:n('Norway','Norwegian','#B26C80',{pop:2.4,navy:3,stab:80,dials:{amb:.1,cau:.95,gru:.3}}),
 SWE:n('Sweden','Swedish','#5F9BD0',{pop:5.6,navy:6,stab:78,dials:{amb:.2,cau:.9,gru:.4}}),
 PER:n('Persia','Persian','#9A8FB3',{pop:10,stab:30,dials:{amb:.1,cau:.9,gru:.4}}),
 /* nations that are not on the map in 1914 but can appear in a peace, or exist in later scenarios */
 POL:n('Poland','Polish','#D98CA6',{pop:27,stab:55,ws:60,cons:2,dials:{amb:.5,cau:.4,gru:.8},xp:.3}),
 FIN:n('Finland','Finnish','#B9CDE6',{pop:3.3,stab:65,ws:65,cons:2,dials:{amb:.2,cau:.7,gru:.7},xp:.35}),
 CZE:n('Czechoslovakia','Czechoslovak','#7FB8A6',{pop:13,mil:.4,stab:65,cons:2,dials:{amb:.2,cau:.7,gru:.5},xp:.3}),
 HUN:n('Hungary','Hungarian','#C98F5C',{pop:8,stab:50,dials:{amb:.6,cau:.5,gru:.9}}),
 UKR:n('Ukraine','Ukrainian','#E3CF6A',{pop:28,stab:40,dials:{amb:.3,cau:.6,gru:.6}}),
 LIT:n('Lithuania','Lithuanian','#C7B04A',{pop:2.5,stab:55,dials:{amb:.3,cau:.7,gru:.7}}),
 LAT:n('Latvia','Latvian','#A85A5A',{pop:1.9,stab:60,dials:{amb:.1,cau:.8,gru:.5}}),
 EST:n('Estonia','Estonian','#6C8FB0',{pop:1.1,stab:60,dials:{amb:.1,cau:.8,gru:.5}}),
 IRE:n('Ireland','Irish','#6FAE7C',{pop:3,stab:55,dials:{amb:.2,cau:.8,gru:.9}}),
 DZG:n('Free City of Danzig','Danzig','#C9A0A0',{pop:.4,stab:50,dials:{amb:0,cau:1,gru:.3}})
};
/* provinces a nation is made of if it appears in a peace settlement; the first is its capital */
D.CORES={POL:['warsaw','lodz','lublin','bialystok','krakow','posen','brestlitovsk'],FIN:['helsinki','turku','vyborg'],CZE:['prague','brno','pressburg'],HUN:['budapest','szeged','debrecen'],
 UKR:['kiev','vinnitsa','poltava','kharkov','ekaterinoslav','rovno'],LIT:['kovno','vilna'],LAT:['riga','libau','dvinsk'],EST:['reval'],IRE:['dublin','cork','galway']};
/* who a new nation can be carved from, and how hard the peace must be (1 victor's peace, 2 dictated) */
D.RELEASE={POL:{from:['RUS','GER','AUS'],level:1},FIN:{from:['RUS'],level:1},EST:{from:['RUS'],level:1},LAT:{from:['RUS'],level:1},LIT:{from:['RUS'],level:1},UKR:{from:['RUS'],level:2},CZE:{from:['AUS'],level:1},HUN:{from:['AUS'],level:2}};
D.FACTIONS={CP:{name:'Central Powers',members:['GER','AUS']},EN:{name:'Entente',members:['FRA','RUS']}};
D.GUARANTEES=[['RUS','SER'],['ENG','BEL'],['SER','MNT']];
/* opening opinions: [a,b,value], applied both ways */
D.OPINION=[['GER','AUS',70],['FRA','RUS',70],['ENG','FRA',45],['ENG','RUS',15],['GER','FRA',-55],['GER','RUS',-25],['GER','ENG',-20],['AUS','SER',-70],['AUS','RUS',-45],['RUS','SER',65],
 ['ITA','AUS',-25],['ITA','GER',25],['ITA','FRA',5],['OTT','RUS',-55],['OTT','GER',35],['OTT','ENG',-10],['OTT','GRE',-50],['BUL','SER',-60],['BUL','GRE',-45],['BUL','ROM',-40],['BUL','OTT',-10],
 ['ROM','AUS',-20],['ROM','RUS',-10],['GRE','SER',40],['SER','MNT',80],['ENG','BEL',50],['FRA','BEL',40],['GER','NED',20],['SWE','RUS',-30],['SWE','GER',30],['DEN','GER',-25],['ENG','POR',40],['FRA','ITA',5],['AUS','MNT',-50]];
/* provinces a nation believes should be its own */
D.CLAIMS={FRA:['metz','strasbourg'],ITA:['tyrol','trieste','dalmatia'],SER:['sarajevo','neusatz'],MNT:[],ROM:['kolozsvar','kronstadt','temesvar','czernowitz'],BUL:['skopje','nis','salonika','constanta'],
 GRE:['smyrna','adrianople','tirana'],RUS:['lemberg','przemysl','erzurum','trebizond','constantinople'],GER:['nancy','liege','lodz','warsaw','kovno','riga'],AUS:['belgrade','nis','cetinje'],
 OTT:['kars','batum','erivan','cyprus','dedeagach'],DEN:['kiel'],ENG:['mosul','damascus'],SWE:['turku','helsinki']};

/* ---------- units ---------- */
D.EQUIP={rifles:{n:'Rifles',per:20},mgs:{n:'Machine guns',per:1.5},guns:{n:'Field guns',per:.6},hguns:{n:'Heavy guns',per:.25},acars:{n:'Armoured cars',per:.15,tech:'acar'},tanks:{n:'Tanks',per:.08,tech:'tank'}};
/* line battalions: att attack, def defence, brk breakthrough (protection while attacking), org, hp, spd km/h, w combat width, mp manpower */
D.BN={
 inf:{n:'Infantry',att:3,def:6,brk:1,org:60,hp:25,spd:4,w:2,mp:1000,eq:{rifles:100}},
 cav:{n:'Cavalry',att:2.6,def:3,brk:3,org:65,hp:20,spd:6.5,w:2,mp:600,eq:{rifles:60}},
 art:{n:'Field artillery',att:9,def:3,brk:1.5,org:0,hp:5,spd:4,w:3,mp:400,eq:{guns:12}},
 hart:{n:'Heavy artillery',att:17,def:4,brk:2,org:0,hp:5,spd:3,w:3,mp:500,eq:{hguns:8}},
 acar:{n:'Armoured cars',att:4,def:4,brk:6,org:40,hp:10,spd:8,w:2,mp:200,eq:{acars:10},tech:'acar'},
 tank:{n:'Tanks',att:7,def:3,brk:16,org:30,hp:12,spd:4,w:2,mp:250,eq:{tanks:8},tech:'tank'}
};
/* support companies: one of each at most */
D.SUP={
 mg:{n:'Machine-gun company',def:9,att:1.5,mp:200,eq:{mgs:12}},
 eng:{n:'Engineers',dig:.25,mp:300,eq:{rifles:30}},
 rec:{n:'Cavalry scouts',spd:.1,brk:1,mp:150,eq:{rifles:15}},
 med:{n:'Field hospital',heal:.3,mp:150,eq:{}}
};
D.TPL={
 std:{name:'Infantry Division',bn:{inf:9,art:3},sup:['mg']},
 ger:{name:'Infanterie-Division',bn:{inf:9,art:3,hart:1},sup:['mg','eng']},
 eng:{name:'Infantry Division',bn:{inf:9,art:3},sup:['mg','eng','med']},
 rus:{name:'Infantry Division',bn:{inf:12,art:2},sup:[]},
 aus:{name:'Infanterietruppendivision',bn:{inf:9,art:2},sup:['mg']},
 lite:{name:'Infantry Division',bn:{inf:8,art:1},sup:[]},
 small:{name:'Infantry Brigade',bn:{inf:6,art:1},sup:[]},
 cav:{name:'Cavalry Division',bn:{cav:6,art:1},sup:['rec']}
};
/* order of battle: tag -> [infantry template, [province, infantry divisions, cavalry divisions]...] */
D.OOB={
 GER:['ger',['cologne',10,2],['metz',9,2],['strasbourg',6,0],['ruhr',6,0],['frankfurt',5,0],['konigsberg',7,1],['danzig',3,0],['posen',4,1],['breslau',3,0],['oppeln',2,0],['berlin',4,0],['hamburg',2,0],['munich',1,0]],
 FRA:['std',['nancy',8,0],['reims',7,3],['lille',5,2],['dijon',5,0],['paris',6,0],['lyon',3,0],['nice',2,0],['algiers',2,0],['marseille',2,0]],
 RUS:['rus',['warsaw',8,3],['lodz',4,0],['lublin',5,2],['bialystok',5,0],['kovno',5,2],['vilna',4,0],['brestlitovsk',4,0],['rovno',5,3],['kiev',4,0],['vinnitsa',3,0],['petersburg',4,0],['moscow',3,0],['odessa',2,0],['tiflis',2,0],['kars',2,0]],
 AUS:['aus',['krakow',5,0],['przemysl',6,0],['lemberg',6,3],['czernowitz',2,0],['vienna',3,0],['budapest',3,0],['sarajevo',5,0],['neusatz',4,0],['temesvar',3,0],['szeged',0,2],['zagreb',2,0],['tyrol',2,0],['trieste',1,0]],
 ENG:['eng',['london',4,1],['birmingham',2,0],['edinburgh',1,0],['dublin',1,0]],
 ITA:['lite',['venice',5,2],['milan',4,0],['turin',3,0],['bologna',2,0],['rome',3,0],['naples',2,0],['sicily',1,0]],
 OTT:['lite',['constantinople',5,0],['adrianople',4,1],['smyrna',2,0],['ankara',1,0],['erzurum',4,1],['sivas',2,0],['aleppo',2,0],['damascus',2,0]],
 SER:['std',['belgrade',5,0],['nis',3,0],['skopje',2,0]],MNT:['small',['cetinje',2,0]],ALB:['small',['tirana',1,0]],
 BEL:['lite',['liege',2,0],['brussels',2,0],['ghent',2,0]],NED:['lite',['amsterdam',3,0],['eindhoven',2,0]],SWI:['lite',['bern',3,0],['zurich',3,0]],
 SPA:['lite',['madrid',3,0],['barcelona',2,0],['seville',2,0],['bilbao',1,0]],POR:['small',['lisbon',2,0],['porto',1,0]],DEN:['small',['copenhagen',2,0],['jutland',1,0]],
 NOR:['small',['oslo',2,0],['bergen',1,0]],SWE:['lite',['stockholm',3,0],['gothenburg',1,0],['malmo',2,0]],ROM:['lite',['bucharest',4,0],['ploesti',2,0],['iasi',2,0],['craiova',2,0]],
 BUL:['std',['sofia',4,0],['plovdiv',3,0],['pleven',2,0],['varna',1,0]],GRE:['lite',['athens',3,0],['salonika',3,0],['larissa',2,0]],PER:['small',['tabriz',2,0]],LUX:['small']
};
D.TERRAIN={plains:{def:1,move:1,n:'Plains'},hills:{def:1.25,move:1.3,n:'Hills'},mountain:{def:1.6,move:1.9,n:'Mountains'},forest:{def:1.2,move:1.35,n:'Forest'},marsh:{def:1.3,move:1.8,n:'Marsh'},urban:{def:1.35,move:1,n:'City'},desert:{def:.95,move:1.4,n:'Desert'}};

/* ---------- laws ---------- */
D.CONS=[{n:'Volunteers only',pct:.015,ws:0},{n:'Limited conscription',pct:.03,ws:15},{n:'Extensive conscription',pct:.055,ws:30},{n:'Service by requirement',pct:.1,ws:55,war:true},{n:'All adults serve',pct:.18,ws:75,war:true,stab:-.03}];
D.ECON=[{n:'Civilian economy',goods:.35,out:.85,ws:0},{n:'Partial mobilisation',goods:.28,out:1,ws:25},{n:'War economy',goods:.2,out:1.15,ws:50,war:true},{n:'Total mobilisation',goods:.1,out:1.3,ws:70,war:true,stab:-.03}];
D.LAW_COST=120;
D.BUILD={civ:{n:'Civilian factory',cost:1500},mil:{n:'Military factory',cost:1000},fleet:{n:'Warships',cost:2400},fort:{n:'Fortress level',cost:350,max:5},rail:{n:'Railway upgrade',cost:500,max:3}};

/* ---------- research ---------- */
const t=(id,name,track,year,fx,desc)=>({id,name,track,year,fx,desc});
D.TECH=[
 t('rifle14','Improved service rifle','Infantry',1914,{infAtt:.08},'Infantry attack +8%'),
 t('helmet','Steel helmets','Infantry',1915,{loss:-.1},'Losses from enemy fire −10%'),
 t('trench','Trench systems','Infantry',1915,{dig:.3},'Maximum entrenchment +30%'),
 t('lmg','Light machine guns','Infantry',1916,{infDef:.1,infAtt:.05},'Infantry defence +10%, attack +5%'),
 t('storm','Infiltration tactics','Infantry',1917,{infBrk:1.5},'Infantry breakthrough +150%'),
 t('qf','Quick-firing field guns','Artillery',1914,{artAtt:.1},'Artillery attack +10%'),
 t('howitzer','Heavy howitzers','Artillery',1915,{artAtt:.08,siege:.25},'Artillery attack +8%, forts count for 25% less'),
 t('gas','Poison gas','Artillery',1915,{gas:.12},'Attack +12% against entrenched troops. Other powers will not forgive it.'),
 t('barrage','Creeping barrage','Artillery',1916,{artAtt:.12,infBrk:.5},'Artillery attack +12%, infantry breakthrough +50%'),
 t('assembly','Standardised parts','Industry',1914,{prod:.1},'Factory output +10%'),
 t('build','Reinforced concrete','Industry',1914,{build:.15},'Construction speed +15%'),
 t('rail','Military rail timetables','Industry',1915,{move:.15,supply:.2},'Movement +15%, supply +20%'),
 t('nitrate','Synthetic nitrates','Industry',1915,{prod:.08,blockade:-.5},'Factory output +8%, blockade hurts half as much'),
 t('boards','War industry boards','Industry',1916,{prod:.12},'Factory output +12%'),
 t('recon','Aerial reconnaissance','Machines',1914,{infDef:.05,artAtt:.05},'Defence +5%, artillery attack +5%'),
 t('acar','Armoured cars','Machines',1915,{},'Unlocks armoured car battalions'),
 t('fighter','Fighter aircraft','Machines',1916,{infDef:.05,infAtt:.05},'Attack and defence +5%'),
 t('tank','Landships','Machines',1916,{},'Unlocks tank battalions'),
 t('radio','Field telephones','Machines',1915,{org:.1},'Organisation recovers 10% faster')
];
D.TECH_DAYS=170;
D.START_TECH={GER:['rifle14','qf','assembly'],FRA:['rifle14','qf'],ENG:['rifle14','assembly'],RUS:[],AUS:['qf'],ITA:[],OTT:[]};

/* ---------- scenarios ----------
   A scenario supplies everything that differs between starting years. Fields: start/end (days since 1 Jan 1914), intro (first Chronicle line),
   owners {province key: tag}, caps {tag: province key}, names {province key: name}, nations {tag: overrides of D.NATIONS}, factions, guarantees,
   opinion, claims, oob, tech {tag:[ids]} (tech.all applies to everyone), tpl {name: template} (overrides D.TPL), forts, tension. */
const DAY=(y,m,d)=>Math.round((Date.UTC(y,m-1,d)-D.EPOCH)/864e5);D.DAY=DAY;
D.SCEN={'1914':{id:'1914',name:'1914: The July Crisis',blurb:'The Archduke is dead in Sarajevo. In five weeks the continent may be at war, or it may not.',start:D.START_DAY,end:DAY(1920,1,1),tension:32,
 intro:'Archduke Franz Ferdinand of Austria and his wife Sophie are shot dead in Sarajevo by Gavrilo Princip, a Bosnian Serb.',
 factions:D.FACTIONS,guarantees:D.GUARANTEES,opinion:D.OPINION,claims:D.CLAIMS,oob:D.OOB,tech:D.START_TECH,
 forts:{liege:3,metz:3,strasbourg:2,nancy:3,reims:1,przemysl:3,konigsberg:2,krakow:2,warsaw:2,kovno:2,erzurum:2,ghent:2,adrianople:2,paris:2,tyrol:2,belgrade:1,gallipoli:2,kars:2,trieste:1}}};
D.BASE_NATIONS=JSON.parse(JSON.stringify(D.NATIONS));
/* ---------- generals ---------- */
D.GENERALS={GER:['Hindenburg','Ludendorff','Mackensen','von Kluck','von Bülow','Falkenhayn','Rupprecht','Hoffmann','von Below','Gallwitz'],FRA:['Joffre','Foch','Pétain','Gallieni','Castelnau','Lanrezac','Nivelle','Franchet d\'Espèrey','Fayolle','Mangin'],
 ENG:['French','Haig','Smith-Dorrien','Allenby','Plumer','Byng','Rawlinson','Monash','Currie','Gough'],RUS:['Brusilov','Samsonov','Rennenkampf','Ruzsky','Alekseyev','Ivanov','Yudenich','Kornilov','Evert','Lechitsky'],
 AUS:['Conrad','Boroević','Potiorek','Dankl','Auffenberg','Böhm-Ermolli','Kövess','Arz'],ITA:['Cadorna','Diaz','Capello','Aosta','Badoglio','Giardino'],OTT:['Enver','Mustafa Kemal','Djemal','Izzet','Esad','Vehib'],
 SER:['Putnik','Mišić','Stepanović','Bojović'],BUL:['Zhekov','Todorov','Boyadzhiev'],ROM:['Averescu','Prezan'],GRE:['Danglis','Paraskevopoulos'],BEL:['Leman','de Witte']};
D.TRAITS={att:{n:'Attacker',d:'attack'},def:{n:'Defender',d:'defence'},org:{n:'Organiser',d:'recovery'}};
/* ---------- aims: what each nation is trying to achieve by the end date ----------
   own: hold these provinces. keep: lose nothing you started with. alive: unconquered with your capital. free: that nation still stands.
   top: rank among the powers. navy: largest fleet. dynasty: no revolution. unbeaten: never capitulate. */
D.GOALS={'1914':{
 GER:[{t:'alive'},{t:'own',keys:['warsaw','lodz'],n:'A Polish border strip'},{t:'top',n:2}],
 AUS:[{t:'alive'},{t:'keep',n:'The Monarchy undivided'},{t:'own',keys:['belgrade'],n:'Serbia subdued'}],
 RUS:[{t:'alive'},{t:'dynasty'},{t:'own',keys:['lemberg','przemysl'],n:'Galicia for the Tsar'}],
 FRA:[{t:'alive'},{t:'own',keys:['metz','strasbourg'],n:'Alsace-Lorraine restored'},{t:'top',n:3}],
 ENG:[{t:'keep',n:'The Empire intact'},{t:'free',tag:'BEL'},{t:'navy'}],
 ITA:[{t:'alive'},{t:'own',keys:['tyrol','trieste'],n:'Trento and Trieste'},{t:'unbeaten'}],
 OTT:[{t:'alive'},{t:'keep',n:'The Empire intact'},{t:'own',keys:['kars','batum'],n:'The lost provinces of 1878'}],
 SER:[{t:'alive'},{t:'own',keys:['sarajevo'],n:'Bosnia united with Serbia'},{t:'keep',n:'Lose nothing'}],
 BUL:[{t:'alive'},{t:'own',keys:['skopje'],n:'Macedonia'},{t:'unbeaten'}],
 ROM:[{t:'alive'},{t:'own',keys:['kolozsvar','kronstadt'],n:'Transylvania'},{t:'unbeaten'}],
 GRE:[{t:'alive'},{t:'own',keys:['smyrna'],n:'The Great Idea: Smyrna'},{t:'unbeaten'}]}};
/* things countryballs say */
D.VOICE={GER:'Is of Ordnung.',ENG:'I say.',FRA:'Hon hon.',RUS:'Is of cold.',AUS:'Is complicated.',ITA:'Mamma mia.',OTT:'Is of tired.',SER:'Serbia stronk.'};
})(globalThis.PK=globalThis.PK||{});
