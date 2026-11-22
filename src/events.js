/* Powder Keg — telegrams (story events) and Fate cards.
   Each event: tag (who decides), when(S) (fires once when true), title, pic, text, opts(S,tag,data) -> [{label,tip,w,fx}]
   w is the weight an AI nation gives the option. The player always chooses for their own nation. */
(function(PK){
const D=PK.DATA,G=PK.SIM,M=PK.MAP,E=PK.EVENTS={};
const has=G.has,set=G.flag,day=G.dayOf,nm=G.name;
const N=(S,t)=>S.nat[t],bump=(S,t,k,v)=>{S.nat[t][k]=Math.max(0,Math.min(100,S.nat[t][k]+v))};
const war=G.atWar,alive=G.alive,dial=(t,k)=>D.NATIONS[t].dials[k];
const warWithMajor=(S,t)=>G.activeEnemies(S,t).some(e=>D.NATIONS[e].major);
const sideStrength=(S,tags)=>S.divs.reduce((s,d)=>s+(tags.includes(d.o)?G.power(S,d):0),0);
/* how the war is going for the side tag would join: >1 means winning */
function odds(S,a,b){const A=G.sideOf(S,a),B=G.sideOf(S,b);return (sideStrength(S,A)+1)/(sideStrength(S,B)+1)}
function neighbours(S,tag){const out=new Set();for(let i=0;i<M.provs.length;i++)if(S.prov[i].owner===tag)for(const j of M.adj[i]){const o=S.prov[j].owner;if(o!==tag&&!S.nat[o].dead)out.add(o)}return[...out]}
function sue(S,tag){const lead=G.activeEnemies(S,tag).sort((a,b)=>S.nat[b].kills-S.nat[a].kills)[0];if(!lead)return;
  if(lead===S.player){S.pending.push({id:'_armistice',tag:lead,data:{from:tag}});return}
  G.news(S,nm(S,tag)+' asks for an armistice. '+nm(S,lead)+' accepts.','dip');G.treaty(S,[tag],G.enemies(S,tag).filter(t=>alive(S,t)),dial(lead,'gru')>.7?2:1)}

/* =====================================================================
   The July Crisis
   ===================================================================== */
E.sarajevo={tag:'AUS',when:S=>S.day>=D.START_DAY+2,pic:'🕯️',title:'The shots at Sarajevo',
 text:'The heir to the throne is dead, killed by a Bosnian Serb armed and trained across the border. The General Staff has wanted a reckoning with Serbia for years. Count Tisza warns that an attack on Serbia means war with Russia. The Emperor asks for the government\'s advice.',
 opts:S=>[
  {label:'Serbia must be broken. Draft an ultimatum it cannot accept.',tip:'Tension rises. Germany will be asked where it stands.',w:70,fx(S){set(S,'ult_harsh');G.tension(S,8);G.op(S,'AUS','SER',-20);G.news(S,'Vienna prepares demands on Serbia. Europe\'s chancelleries are uneasy.','dip')}},
  {label:'Demand a joint inquiry into the plot.',tip:'A firm but answerable demand. The hawks in Vienna will be furious.',w:20,fx(S){set(S,'ult_mild');G.tension(S,2);bump(S,'AUS','stab',-3)}},
  {label:'Bury the Archduke and let the matter rest.',tip:'Stability −6. Serbia grows bolder.',w:6,fx(S){set(S,'crisis_over');bump(S,'AUS','stab',-6);G.op(S,'AUS','SER',-10);G.news(S,'Vienna mourns, and does nothing more. The summer crisis fades.','dip');G.say(S,'SER','Is nothing happened.')}}]};
E.blankcheque={tag:'GER',when:S=>has(S,'ult_harsh',6)&&!has(S,'crisis_over'),pic:'✉️',title:'A letter from Vienna',
 text:'Count Hoyos has arrived in Berlin with a personal letter from Franz Joseph. Austria-Hungary means to eliminate Serbia as a power in the Balkans, and asks whether Germany will stand behind it if Russia intervenes. The Kaiser is about to leave for his summer cruise and wants an answer given today.',
 opts:S=>[
  {label:'Germany stands with Austria, whatever comes.',tip:'The "blank cheque". Austria +20, Russia −10. War becomes far more likely.',w:75,fx(S){set(S,'blank');G.op(S,'GER','AUS',20);G.op(S,'GER','RUS',-10);G.tension(S,8);G.say(S,'AUS','Danke. Is of best friends.')}},
  {label:'Propose a conference of the great powers.',tip:'Britain will be asked to host. Austria −15.',w:15,fx(S){set(S,'conf_proposed');G.op(S,'GER','AUS',-15);G.op(S,'GER','ENG',10);G.news(S,'Berlin proposes that the great powers meet to settle the Austro-Serbian dispute.','dip')}},
  {label:'This is Vienna\'s quarrel. The alliance does not cover it.',tip:'Germany leaves the alliance with Austria-Hungary.',w:8,fx(S){set(S,'ger_aloof');G.news(S,'Berlin declares that the Dual Alliance does not cover a war of Austria\'s choosing.','dip');G.leaveFaction(S,'GER');G.op(S,'GER','FRA',10);G.op(S,'GER','RUS',15);G.say(S,'AUS','Germany? Hallo? Is anybody of home?')}}]};
E.conference={tag:'ENG',when:S=>has(S,'conf_proposed',4),pic:'🏛️',title:'Sir Edward Grey\'s conference',
 text:'Berlin has suggested that the four powers not directly involved meet in London, as they did during the Balkan Wars. The Foreign Secretary is willing. The Cabinet is preoccupied with Ireland and would rather the Continent solved its own problems.',
 opts:S=>[
  {label:'Convene the ambassadors in London.',tip:'Tension −15. Germany +15.',w:80,fx(S){set(S,'conference');G.tension(S,-15);G.op(S,'ENG','GER',15);G.news(S,'The ambassadors of Britain, France, Germany and Italy meet in London.','dip');G.say(S,'ENG','Tea, gentlemen? Then we talk.')}},
  {label:'Britain has no interest in a Balkan quarrel.',tip:'The crisis runs its course.',w:20,fx(S){set(S,'noconf');set(S,'blank')}}]};
E.conf_result={tag:'AUS',when:S=>has(S,'conference',9),pic:'⚖️',title:'The London proposals',
 text:'The powers propose that Serbia dissolve the nationalist societies, dismiss the officers named in the Sarajevo inquiry and accept international observers. It is less than Vienna wanted, and it comes with Germany\'s signature on it.',
 opts:S=>[
  {label:'Accept the settlement.',tip:'The crisis ends. Stability −5, but peace holds.',w:60,fx(S){set(S,'crisis_over');set(S,'london_peace');bump(S,'AUS','stab',-5);G.tension(S,-10);G.op(S,'AUS','GER',-10);G.news(S,'Vienna accepts the London proposals. There will be no war this summer.','dip')}},
  {label:'Walk out. Austria will act alone.',tip:'Austria proceeds without German backing.',w:40,fx(S){set(S,'aus_alone');G.tension(S,10);G.op(S,'AUS','ENG',-20);G.news(S,'The Austrian ambassador leaves the London conference.','dip')}}]};
E.rus_backing={tag:'RUS',when:S=>has(S,'ult_harsh',8)&&!has(S,'crisis_over')&&alive(S,'SER'),pic:'🐻',title:'Serbia asks for protection',
 text:'Prince Alexander of Serbia has appealed to the Tsar. Sazonov argues that if Russia abandons the Serbs a second time, after the humiliation of 1909, it will count for nothing in the Balkans again. The army\'s reforms will not be complete until 1917.',
 opts:S=>[
  {label:'Russia will not be indifferent to Serbia\'s fate.',tip:'Russia will fight if Serbia is attacked.',w:72,fx(S){set(S,'rus_backs');G.tension(S,8);G.op(S,'RUS','SER',10);G.say(S,'RUS','Little brother is protected.')}},
  {label:'Advise Belgrade to accept whatever is asked.',tip:'The guarantee to Serbia is withdrawn. Serbia −35, stability −5.',w:28,fx(S){set(S,'rus_abandon');S.guar=S.guar.filter(g=>!(g[0]==='RUS'&&g[1]==='SER'));G.op(S,'RUS','SER',-35);bump(S,'RUS','stab',-5);G.news(S,'St. Petersburg urges Serbia to yield.','dip')}}]};
E.inquiry={tag:'SER',when:S=>has(S,'ult_mild',10),pic:'📜',title:'Vienna demands an inquiry',
 text:'Austria-Hungary asks that its officials take part in the Serbian investigation into the assassination. It touches Serbian sovereignty, but it is not an invitation to war.',
 opts:S=>[
  {label:'Agree to a joint inquiry.',tip:'The crisis ends.',w:85,fx(S){set(S,'crisis_over');G.tension(S,-6);G.op(S,'AUS','SER',10);G.news(S,'Serbia accepts a joint inquiry into the Sarajevo plot. The crisis passes.','dip')}},
  {label:'No foreign police on Serbian soil.',tip:'Vienna will reach for the ultimatum.',w:15,fx(S){set(S,'ult_harsh');set(S,'blank');G.tension(S,8)}}]};
E.ultimatum={tag:'SER',when:S=>has(S,'ult_harsh',17)&&(has(S,'blank')||has(S,'ger_aloof')||has(S,'aus_alone'))&&!has(S,'crisis_over'),pic:'⏳',title:'Forty-eight hours',
 text:S=>'Baron Giesl has handed over the Austrian note. Ten demands, a reply required within two days. Point six would put Austrian officials inside Serbia\'s own courts. '+(has(S,'rus_backs')?'Russia has promised it will not stand aside.':has(S,'rus_abandon')?'Russia has advised us to yield.':'St. Petersburg has not yet answered.'),
 opts:S=>[
  {label:'Accept nine points and offer arbitration on the tenth.',tip:'The historical reply.',w:60,fx(S){set(S,'ser_partial');G.news(S,'Serbia accepts almost all of the Austrian demands.','dip')}},
  {label:'Accept everything.',tip:'Stability −15. Austria has no pretext left.',w:has(S,'rus_abandon')?60:10,fx(S){set(S,'crisis_over');set(S,'ser_humbled');bump(S,'SER','stab',-15);G.tension(S,-8);G.news(S,'Serbia accepts the Austrian ultimatum in full. Vienna is almost disappointed.','dip')}},
  {label:'Reject the note and mobilise.',tip:'War is all but certain.',w:has(S,'rus_backs')?25:8,fx(S){set(S,'ser_reject');G.tension(S,6);G.say(S,'SER','Serbia stronk. Come and try.')}}]};
E.aus_decides={tag:'AUS',when:S=>(has(S,'ser_partial',3)||has(S,'ser_reject',3))&&!has(S,'crisis_over')&&alive(S,'SER'),pic:'⚔️',title:'The Serbian reply',
 text:S=>(has(S,'ser_reject')?'Serbia has rejected the note outright.':'Serbia\'s reply concedes nearly everything. Even the Kaiser, reading it, remarks that every reason for war has vanished.')+' The army is ready to bombard Belgrade. '+(S.nat.GER.faction===S.nat.AUS.faction?'Germany stands behind us.':'We would be acting without Germany.'),
 opts:S=>[
  {label:'Declare war on Serbia.',tip:'Russia may honour its guarantee.',w:S.nat.GER.faction===S.nat.AUS.faction?82:40,fx(S){set(S,'aus_ser_war');G.declareWar(S,'AUS','SER',{text:'Austria-Hungary declares war on Serbia. The first shells fall on Belgrade.'})}},
  {label:'Accept the reply as a basis for talks.',tip:'Stability −8. The crisis ends.',w:S.nat.GER.faction===S.nat.AUS.faction?18:60,fx(S){set(S,'crisis_over');bump(S,'AUS','stab',-8);G.tension(S,-10);G.news(S,'Vienna accepts the Serbian reply as a basis for negotiation.','dip')}}]};
E.schlieffen={tag:'GER',when:S=>war(S,'GER','FRA')&&alive(S,'BEL')&&!war(S,'GER','BEL'),pic:'🗺️',title:'The plan for the west',
 text:'Germany is at war with France and Russia at once. The General Staff has one plan: seven-eighths of the army swings through Belgium to envelop Paris within six weeks, before Russia can gather its strength. Britain is a guarantor of Belgian neutrality. Moltke insists the timetable cannot be changed.',
 opts:S=>[
  {label:'Execute the plan. Demand passage through Belgium.',tip:'War with Belgium and Luxembourg. Britain will very probably intervene.',w:70,fx(S){set(S,'belgium_invaded');if(alive(S,'LUX'))G.declareWar(S,'GER','LUX',{text:'German troops occupy Luxembourg.'});G.declareWar(S,'GER','BEL',{text:'Belgium refuses passage to the German army. Germany invades.'})}},
  {label:'Respect Belgian neutrality. Stand on the defensive in the west.',tip:'Britain has no clear cause for war. The war in the west will be fought on the fortress line.',w:30,fx(S){set(S,'belgium_spared');G.op(S,'GER','ENG',15);G.op(S,'GER','BEL',20);G.news(S,'Berlin announces it will respect the neutrality of Belgium.','dip')}}]};
E.eng_dilemma={tag:'ENG',when:S=>has(S,'belgium_spared',15)&&war(S,'GER','FRA')&&!war(S,'ENG','GER'),pic:'🎩',title:'The Cabinet divides',
 text:'France is at war and Belgium is untouched. Grey argues that Britain cannot watch France be crushed and keep its honour or its safety. Half the Cabinet will resign rather than go to war for a secret understanding the country never voted on.',
 opts:S=>[
  {label:'Stand by France.',tip:'War with Germany. Stability −10: the country is divided.',w:22,fx(S){bump(S,'ENG','stab',-10);if(S.factions.EN)G.joinFaction(S,'ENG','EN');if(!war(S,'ENG','GER'))G.declareWar(S,'ENG','GER')}},
  {label:'Armed neutrality. The fleet will keep the Channel closed to both sides.',tip:'Britain stays out for now. France −25.',w:78,fx(S){set(S,'eng_neutral');G.op(S,'ENG','FRA',-25);G.op(S,'ENG','GER',10);G.say(S,'ENG','Not my war. Yet.')}}]};
E.ott_choice={tag:'OTT',when:S=>war(S,'GER','RUS')&&S.wars['GER|RUS']&&S.day-S.wars['GER|RUS'].day>75&&!G.inWar(S,'OTT'),pic:'🌙',title:'Two German cruisers',
 text:'Goeben and Breslau have slipped past the British fleet and anchored at Constantinople. Enver Pasha proposes to raise the Ottoman flag over them and sail against the Russian coast. The Grand Vizier would rather sell neutrality to the highest bidder.',
 opts:S=>[
  {label:'Join Germany. Close the Straits and attack.',tip:'War with Russia and its allies.',w:S.nat.GER.faction?55*Math.min(1.5,odds(S,'GER','RUS')):5,fx(S){set(S,'ott_cp');if(S.nat.GER.faction)G.joinFaction(S,'OTT',S.nat.GER.faction);G.say(S,'OTT','Is of time. Ottoman can into relevance.')}},
  {label:'Stay neutral.',tip:'The Straits stay open.',w:35,fx(S){set(S,'ott_neutral')}},
  {label:'Offer the Entente an alliance in return for an end to the Capitulations.',tip:'Joins France and Russia, if they are still allied.',w:8,fx(S){if(S.nat.RUS.faction){G.op(S,'OTT','RUS',40);G.joinFaction(S,'OTT',S.nat.RUS.faction)}}}]};
E.ita_choice={tag:'ITA',when:S=>warWithMajor(S,'AUS')&&!G.inWar(S,'ITA'),pic:'🇮🇹',title:'The Triple Alliance',
 text:'Italy has been bound to Germany and Austria-Hungary since 1882, but only if they are attacked. Vienna did not consult Rome before moving against Serbia. San Giuliano observes that Italy\'s coasts are indefensible against the British fleet, and that the lands Italy wants are Austrian.',
 opts:S=>[
  {label:'Declare neutrality.',tip:'The historical choice. Italy can sell its entry later.',w:75,fx(S){set(S,'ita_neutral');G.op(S,'ITA','AUS',-10);G.op(S,'ITA','GER',-10);G.news(S,'Italy declares its neutrality.','dip')}},
  {label:'Honour the alliance.',tip:'Italy joins Germany and Austria-Hungary.',w:war(S,'ENG','GER')?6:22,fx(S){if(S.nat.AUS.faction)G.joinFaction(S,'ITA',S.nat.AUS.faction);G.say(S,'ITA','Is promise. Mostly.')}}]};
E.london_pact={tag:'ITA',when:S=>has(S,'ita_neutral',270)&&warWithMajor(S,'AUS')&&!G.inWar(S,'ITA'),pic:'🤝',title:'Sacred egoism',
 text:'Both sides are bidding. London offers the Trentino, South Tyrol, Trieste and Dalmatia once Austria is beaten. Vienna, under German pressure, might hand over the Trentino now in exchange for continued neutrality.',
 opts:S=>[
  {label:'Sign with the Entente and declare war on Austria-Hungary.',tip:'War for Trento and Trieste.',w:55/Math.max(.6,odds(S,'AUS','RUS')),fx(S){set(S,'ita_entente');const f=S.nat.FRA.faction||S.nat.RUS.faction||S.nat.ENG.faction;if(f)G.joinFaction(S,'ITA',f);if(!war(S,'ITA','AUS'))G.declareWar(S,'ITA','AUS')}},
  {label:'Ask Vienna for the Trentino as the price of neutrality.',tip:'Austria must answer.',w:25,fx(S){S.sched.push({day:S.day+10,id:'trento_demand',tag:'AUS'})}},
  {label:'Stay out.',tip:'',w:20,fx(S){set(S,'ita_out')}}]};
E.trento_demand={pic:'⛰️',title:'Italy names its price',
 text:'Rome will stay neutral if the Trentino is ceded at once. Berlin urges acceptance. The Emperor says he would rather lose everything honourably than bargain away provinces his family has held for five centuries.',
 opts:S=>[
  {label:'Cede the Trentino.',tip:'Innsbruck province passes to Italy. Italy stays neutral. Stability −8.',w:40,fx(S){G.transfer(S,'tyrol','ITA');bump(S,'AUS','stab',-8);G.op(S,'AUS','ITA',30);set(S,'ita_out');G.news(S,'Austria-Hungary cedes the Trentino to Italy.','dip')}},
  {label:'Refuse.',tip:'Italy will probably join the Entente.',w:60,fx(S){G.op(S,'AUS','ITA',-25);if(G.rnd(S)<.7&&!G.inWar(S,'ITA')){const f=S.nat.FRA.faction||S.nat.RUS.faction;if(f)G.joinFaction(S,'ITA',f);if(!war(S,'ITA','AUS'))G.declareWar(S,'ITA','AUS')}}}]};
E.bul_choice={tag:'BUL',when:S=>S.day>=day(1915,9,1)&&G.inWar(S,'SER')&&!G.inWar(S,'BUL'),pic:'🦁',title:'Bulgaria\'s revenge',
 text:'Serbia took Macedonia from us in 1913. Now Serbia is fighting for its life, and both alliances want the Bulgarian army. Only one of them can offer Macedonia.',
 opts:S=>{const cp=G.activeEnemies(S,'SER')[0];return[
  {label:'March on Serbia.',tip:'Join Serbia\'s enemies.',w:60*Math.min(1.6,cp?odds(S,cp,'SER'):.2),fx(S){const f=cp&&S.nat[cp].faction;if(f)G.joinFaction(S,'BUL',f);else if(cp)G.declareWar(S,'BUL','SER')}},
  {label:'Remain neutral.',tip:'',w:40,fx(S){}}]}};
E.rom_choice={tag:'ROM',when:S=>S.day>=day(1916,8,1)&&warWithMajor(S,'AUS')&&!G.inWar(S,'ROM'),pic:'🌾',title:'Romania at the crossroads',
 text:'Three million Romanians live under Hungarian rule in Transylvania. Bessarabia is Russian. Brătianu has waited two years to see which way the war would turn.',
 opts:S=>{const o=odds(S,'AUS','RUS');return[
  {label:'Cross the Carpathians into Transylvania.',tip:'Join Austria\'s enemies.',w:45/Math.max(.5,o),fx(S){const f=S.nat.RUS.faction||S.nat.FRA.faction;if(f)G.joinFaction(S,'ROM',f);if(!war(S,'ROM','AUS'))G.declareWar(S,'ROM','AUS')}},
  {label:'Join the Central Powers and take Bessarabia.',tip:'Join Russia\'s enemies.',w:15*o,fx(S){const f=S.nat.AUS.faction;if(f&&war(S,'AUS','RUS'))G.joinFaction(S,'ROM',f)}},
  {label:'Keep waiting.',tip:'',w:40,fx(S){}}]}};
E.gre_choice={tag:'GRE',when:S=>S.day>=day(1917,6,1)&&G.inWar(S,'BUL')&&!G.inWar(S,'GRE'),pic:'🏛️',title:'The National Schism',
 text:'Venizelos wants Greece in the war beside Britain and France. King Constantine, the Kaiser\'s brother-in-law, wants neutrality. The country has two governments.',
 opts:S=>[
  {label:'Venizelos prevails. Greece enters the war against Bulgaria.',tip:'',w:55,fx(S){const en=G.activeEnemies(S,'BUL')[0],f=en&&S.nat[en].faction;if(f)G.joinFaction(S,'GRE',f)}},
  {label:'The King keeps Greece neutral.',tip:'',w:45,fx(S){}}]};

/* =====================================================================
   The long war
   ===================================================================== */
E.christmas={tag:S=>S.player==='GER'||S.player==='ENG'?S.player:null,when:S=>S.day===day(1914,12,25)&&war(S,'GER','ENG'),pic:'🎄',title:'Christmas in the trenches',
 text:'Along parts of the front the shooting has stopped. Men are meeting between the lines to bury their dead, trade tobacco and, by some accounts, play football. Headquarters wants it ended at once.',
 opts:(S,t)=>[
  {label:'Look the other way for a day.',tip:'War support −2, stability +3.',fx(S){bump(S,t,'ws',-2);bump(S,t,'stab',3);G.news(S,'An unofficial truce holds along much of the Western Front on Christmas Day.','war')}},
  {label:'Forbid fraternisation.',tip:'Stability −1.',fx(S){bump(S,t,'stab',-1)}}]};
E.usw={tag:'GER',when:S=>war(S,'GER','ENG')&&S.wars['ENG|GER']&&S.day-S.wars['ENG|GER'].day>850,pic:'🌊',title:'The submarine question',
 text:'The British blockade is starving Germany. The Admiralty promises that unrestricted submarine warfare will bring Britain to its knees in six months. The Chancellor warns that it will bring America into the war first.',
 opts:S=>[
  {label:'Sink everything in the war zone, without warning.',tip:'Britain: stability −8, factories suffer. America will almost certainly enter the war.',w:60,fx(S){set(S,'usw');bump(S,'ENG','stab',-8);S.nat.ENG.builtCiv-=4;G.tension(S,6);G.news(S,'Germany announces unrestricted submarine warfare.','war')}},
  {label:'Keep to the prize rules.',tip:'America stays out.',w:40,fx(S){set(S,'usw_no')}}]};
E.usa_enters={tag:S=>['FRA','ENG'].find(t=>alive(S,t)&&war(S,t,'GER'))||null,when:S=>has(S,'usw',70)&&war(S,'GER','ENG'),pic:'🗽',title:'America enters the war',
 text:'American ships have been sunk and a German offer of alliance to Mexico has been published in every newspaper in the United States. Congress has declared war on Germany. The first divisions will land in France within months.',
 opts:(S,t)=>[{label:'Lafayette, we are here.',tip:'American divisions and supplies arrive.',fx(S){set(S,'usa_in');const p=['brest','nantes','bordeaux','rouen','plymouth','london'].map(k=>G.KEY[k]).find(i=>G.friendly(S,t,S.prov[i].ctrl));
   const who=alive(S,'FRA')?'FRA':t;if(p!==undefined)G.spawn(S,who,p,0,10,.25,'# US Division');for(const x of ['FRA','ENG'])if(alive(S,x)){S.nat[x].stock.rifles+=6000;S.nat[x].stock.guns+=250;bump(S,x,'ws',12)}bump(S,'GER','ws',-6);
   G.news(S,'The United States declares war on Germany.','war')}}]};
E.rus_feb={tag:'RUS',when:S=>G.inWar(S,'RUS')&&S.day>=day(1916,6,1)&&(S.nat.RUS.ws<30||S.nat.RUS.stab<28),pic:'🍞',title:'Bread riots in Petrograd',
 text:'The capital has no bread and no fuel. Striking workers fill the streets and the garrison is refusing to fire on them. The Duma asks the Tsar to abdicate. The generals at headquarters agree with the Duma.',
 opts:S=>[
  {label:'The Tsar abdicates. A provisional government fights on.',tip:'Stability +12, war support −8. The country is renamed.',w:60,fx(S){set(S,'rus_prov');bump(S,'RUS','stab',12);bump(S,'RUS','ws',-8);S.nat.RUS.name='Russian Republic';G.news(S,'Tsar Nicholas II abdicates. Three centuries of Romanov rule are over.','story')}},
  {label:'Send loyal regiments to restore order.',tip:'Stability −12. The army may not obey.',w:15,fx(S){bump(S,'RUS','stab',-12);for(const d of S.divs)if(d.o==='RUS')d.org*=.6}},
  {label:'Ask the enemy for terms.',tip:'Russia leaves the war on whatever terms it can get.',w:25,fx(S){set(S,'rus_prov');sue(S,'RUS')}}]};
E.rus_oct={tag:'RUS',when:S=>has(S,'rus_prov',200)&&G.inWar(S,'RUS')&&S.nat.RUS.ws<24,pic:'🚩',title:'All power to the Soviets',
 text:'The provisional government kept Russia in the war and the war has destroyed it. Lenin\'s Bolsheviks promise peace, land and bread. Red Guards are moving on the Winter Palace.',
 opts:S=>[{label:'The Bolsheviks seize power and sue for peace.',tip:'Russia leaves the war and becomes Soviet Russia.',w:75,fx(S){set(S,'soviet');S.nat.RUS.name='Soviet Russia';sue(S,'RUS');bump(S,'RUS','stab',15);G.news(S,'The Bolsheviks seize power in Petrograd.','story');G.say(S,'RUS','Is of revolution, comrade.')}},
  {label:'Kerensky holds on with loyal troops.',tip:'Stability −10.',w:25,fx(S){bump(S,'RUS','stab',-10)}}]};
E.fra_mutiny={tag:'FRA',when:S=>G.inWar(S,'FRA')&&S.day>=day(1916,1,1)&&S.nat.FRA.ws<30,pic:'🪖',title:'The army refuses',
 text:'After the last offensive, regiments are refusing to return to the line. They will defend their trenches, they say, but they will not attack again. Half the divisions on the front are affected.',
 opts:S=>[
  {label:'Pétain\'s remedy: leave, better food, and no more offensives for now.',tip:'War support +14. French divisions lose organisation.',w:70,fx(S){bump(S,'FRA','ws',14);for(const d of S.divs)if(d.o==='FRA'){d.org*=.5;d.path=d.path&&G.atWar(S,'FRA',S.prov[d.path[0]].ctrl)?null:d.path}}},
  {label:'Courts-martial.',tip:'Stability −10, war support +4.',w:30,fx(S){bump(S,'FRA','stab',-10);bump(S,'FRA','ws',4)}}]};
E.home_collapse={tag:S=>G.TAGS.find(t=>D.NATIONS[t].major&&G.inWar(S,t)&&S.nat[t].stab<18&&!has(S,'collapse_'+t))||null,when:S=>G.TAGS.some(t=>D.NATIONS[t].major&&G.inWar(S,t)&&S.nat[t].stab<18&&!has(S,'collapse_'+t)),pic:'🏚️',title:'The home front gives way',
 text:(S,t)=>'There are strikes in the munitions works and mutinies in the depots. Deputies who voted for the war now demand to know how it will end. '+(D.NATIONS[t].head||'The government')+' is told that the country cannot survive another winter of this.',
 opts:(S,t)=>[
  {label:'Ask for an armistice.',tip:'The enemy decides the terms.',w:60,fx(S){set(S,'collapse_'+t);S.fired.home_collapse=undefined;sue(S,t)}},
  {label:'Fight on.',tip:'Stability +6 through repression, war support −8.',w:40,fx(S){set(S,'collapse_'+t);S.fired.home_collapse=undefined;bump(S,t,'stab',6);bump(S,t,'ws',-8)}}]};
E.irish={tag:'ENG',when:S=>S.day>=day(1914,7,21)&&!G.inWar(S,'ENG'),pic:'☘️',title:'The Irish question',
 text:'The Home Rule Bill is about to become law. A hundred thousand Ulster Volunteers have armed to resist it, the Irish Volunteers have armed to enforce it, and officers at the Curragh have said they would resign rather than march on Ulster.',
 opts:S=>[
  {label:'Home Rule, with Ulster excluded for now.',tip:'Stability −4.',w:40,fx(S){bump(S,'ENG','stab',-4);set(S,'home_rule')}},
  {label:'Postpone the whole matter.',tip:'Nothing is settled. It will return.',w:50,fx(S){set(S,'irish_grievance')}},
  {label:'Enforce the Act on all Ireland.',tip:'Stability −12. The army is shaken.',w:10,fx(S){bump(S,'ENG','stab',-12);for(const d of S.divs)if(d.o==='ENG')d.org*=.7;set(S,'home_rule')}}]};
E.easter={tag:'ENG',when:S=>has(S,'irish_grievance')&&S.day>=day(1916,4,24)&&G.inWar(S,'ENG'),pic:'📯',title:'Rising in Dublin',
 text:'Irish republicans have seized the General Post Office in Dublin and proclaimed a republic. They are few, and most of the city is against them. What happens to their leaders will matter more than the fighting.',
 opts:S=>[
  {label:'Suppress the rising and execute its leaders.',tip:'Stability −6. Ireland will not forget.',w:65,fx(S){bump(S,'ENG','stab',-6);set(S,'irish_martyrs')}},
  {label:'Suppress the rising and imprison its leaders.',tip:'Stability −2.',w:35,fx(S){bump(S,'ENG','stab',-2)}}]};

/* =====================================================================
   If the peace holds
   ===================================================================== */
E.naval_holiday={tag:'ENG',when:S=>has(S,'london_peace',120)&&!war(S,'ENG','GER'),pic:'⚓',title:'A naval holiday',
 text:'With the summer crisis settled in London, Berlin revives Churchill\'s old idea: both navies stop laying down battleships for a year. The Admiralty suspects a trick. The Treasury would be delighted.',
 opts:S=>[
  {label:'Agree.',tip:'Germany +25, France −15. Tension −8.',w:55,fx(S){set(S,'naval_treaty');G.op(S,'ENG','GER',25);G.op(S,'ENG','FRA',-15);G.tension(S,-8);G.news(S,'Britain and Germany agree to a one-year halt in battleship building.','dip');G.say(S,'FRA','Quoi? Britain is of friends with HIM?')}},
  {label:'Decline.',tip:'',w:45,fx(S){G.op(S,'ENG','GER',-5)}}]};
E.second_crisis={tag:'SER',when:S=>has(S,'crisis_over',240)&&!G.inWar(S,'SER')&&!G.inWar(S,'AUS')&&alive(S,'ALB'),pic:'⛰️',title:'The road to the sea',
 text:'Albania is collapsing into civil war and Serbian troops have crossed the border "to restore order". They are a day\'s march from the Adriatic. Vienna has always said a Serbian port would mean war.',
 opts:S=>[
  {label:'Withdraw.',tip:'Stability −5.',w:45,fx(S){bump(S,'SER','stab',-5);G.tension(S,-3)}},
  {label:'Stay. Serbia needs a port.',tip:'War with Albania. Austria-Hungary must respond.',w:55,fx(S){G.tension(S,12);G.declareWar(S,'SER','ALB');S.sched.push({day:S.day+12,id:'second_crisis_aus',tag:'AUS'})}}]};
E.second_crisis_aus={pic:'⚔️',title:'Serbia on the Adriatic',
 text:'Serbian troops are in Albania and will soon hold the coast. The General Staff says the moment that was missed last year has come again.',
 opts:S=>[
  {label:'Declare war on Serbia.',tip:'',w:55+S.tension*.3,fx(S){G.declareWar(S,'AUS','SER')}},
  {label:'Protest, and do nothing.',tip:'Stability −8.',w:35,fx(S){bump(S,'AUS','stab',-8)}}]};
E.alsace={tag:'FRA',when:S=>S.day>=day(1915,5,1)&&!G.inWar(S,'FRA')&&!G.inWar(S,'GER'),pic:'🥖',title:'The lost provinces',
 text:'A German officer has insulted Alsatian recruits and the affair fills the Paris newspapers. The nationalist leagues want the government to make the return of Alsace-Lorraine a public demand.',
 opts:S=>[
  {label:'Take up the cause.',tip:'War support +8, Germany −20, tension +8.',w:45,fx(S){bump(S,'FRA','ws',8);G.op(S,'FRA','GER',-20);G.tension(S,8)}},
  {label:'Calm the press.',tip:'Stability −3.',w:55,fx(S){bump(S,'FRA','stab',-3)}}]};

/* =====================================================================
   Standing telegrams: alliances, guarantees, peace
   ===================================================================== */
E._allycall={pic:'📣',title:'A call to arms',
 text:(S,t,d)=>nm(S,d.ally)+' is at war with '+nm(S,d.enemy)+(d.def?' and invokes our alliance.':' and asks us to join.')+' Our word is pledged. So are the lives of our soldiers.',
 opts:(S,t,d)=>[
  {label:'Honour the alliance.',tip:'War with '+nm(S,d.enemy)+'.',fx(S){if(!war(S,t,d.enemy)){G.setWar(S,t,d.enemy,d.def?d.enemy:d.ally);G.news(S,nm(S,t)+' declares war on '+nm(S,d.enemy)+'.','war');G.tension(S,8)}G.spread(S)}},
  {label:'Break with our allies.',tip:'Leave the alliance. Stability −10. They will not forgive it.',fx(S){G.leaveFaction(S,t);bump(S,t,'stab',-10);G.op(S,t,d.ally,-40)}}]};
E._guarantee={pic:'🛡️',title:'A guarantee falls due',
 text:(S,t,d)=>nm(S,d.enemy)+' has attacked '+nm(S,d.victim)+', whose independence we guaranteed.',
 opts:(S,t,d)=>[
  {label:'Honour the guarantee.',tip:'War with '+nm(S,d.enemy)+'.',fx(S){G.honour(S,t,d.victim,d.enemy)}},
  {label:'It was only a scrap of paper.',tip:'Stability −8. No one will trust our word.',fx(S){bump(S,t,'stab',-8);S.guar=S.guar.filter(g=>!(g[0]===t&&g[1]===d.victim));for(const x of G.TAGS)if(x!==t)G.op(S,x,t,-10);G.op(S,d.victim,t,-40)}}]};
E._treaty={pic:'🖋️',title:'The peace conference',evenIfDown:true,
 text:(S,t,d)=>d.losers.map(x=>nm(S,x)).join(', ')+' can fight no longer. The victors, '+d.winners.map(x=>nm(S,x)).join(', ')+', meet to decide the peace. As the leading power your voice carries the table. What kind of peace will it be?',
 opts:(S,t,d)=>[
  {label:'A peace of reconciliation.',tip:'Only provinces the victors claim change hands. The defeated bear a small grudge.',fx(S){G.treaty(S,d.losers,d.winners,0)}},
  {label:'A victor\'s peace.',tip:'Claims, plus occupied border provinces. The defeated alliance is dissolved. A lasting grudge.',fx(S){G.treaty(S,d.losers,d.winners,1)}},
  {label:'A dictated peace.',tip:'The victors keep everything they occupy except the enemy capitals. Industry dismantled. The defeated will want revenge.',fx(S){G.treaty(S,d.losers,d.winners,2)}}]};
E._armistice={pic:'🏳️',title:'A request for an armistice',
 text:(S,t,d)=>nm(S,d.from)+' asks for terms. Its government says it can no longer answer for order at home.',
 opts:(S,t,d)=>{const w=()=>G.enemies(S,d.from).filter(x=>alive(S,x));return[
  {label:'Grant generous terms.',tip:nm(S,d.from)+' leaves the war. Only claimed provinces change hands.',fx(S){G.treaty(S,[d.from],w(),0)}},
  {label:'Grant hard terms.',tip:nm(S,d.from)+' leaves the war and loses its occupied border provinces.',fx(S){G.treaty(S,[d.from],w(),1)}},
  {label:'Refuse. Only unconditional surrender.',tip:'The war goes on.',fx(S){bump(S,d.from,'ws',5)}}]}};

/* =====================================================================
   Fate cards
   ===================================================================== */
const fate=(id,pic,title,text,opts,ok)=>{E[id]={fate:true,pic,title,text,opts,ok}};
fate('f_harvest','🌾','A bumper harvest','The weather has been kind and the granaries are full. Bread is cheap this year.',(S,t)=>[{label:'A blessing.',tip:'Stability +3.',fx(S){bump(S,t,'stab',3)}}]);
fate('f_blight','🌧️','The harvest fails','Rain through the summer has rotted the grain in the fields. Prices in the cities are climbing.',(S,t)=>[
  {label:'Buy grain abroad.',tip:'Political power −25.',w:50,fx(S){S.nat[t].pp-=25}},{label:'Let the market settle it.',tip:'Stability −5.',w:50,fx(S){bump(S,t,'stab',-5)}}]);
fate('f_strike','⚒️','A general strike','Miners, dockers and railwaymen have walked out together. They want an eight-hour day.',(S,t)=>[
  {label:'Negotiate.',tip:'Political power −20, stability +2.',w:55,fx(S){S.nat[t].pp-=20;bump(S,t,'stab',2)}},{label:'Send in the troops.',tip:'Stability −6.',w:45,fx(S){bump(S,t,'stab',-6)}}]);
fate('f_scandal','🗞️','A ministerial scandal','A minister\'s private letters have reached the newspapers. The opposition smells blood.',(S,t)=>[
  {label:'He resigns.',tip:'Political power −25.',w:60,fx(S){S.nat[t].pp-=25}},{label:'Deny everything.',tip:'An even chance of stability −7.',w:40,fx(S){if(G.rnd(S)<.5)bump(S,t,'stab',-7)}}]);
fate('f_invention','💡','A breakthrough in the laboratory','One of our research teams reports results a year ahead of schedule.',(S,t)=>[{label:'Excellent.',tip:'Current research leaps forward.',fx(S){const r=S.nat[t].research[0];if(r)r.prog+=.35}}],(S,t)=>S.nat[t].research.length>0);
fate('f_officer','🎖️','A gifted staff officer','A young colonel\'s training reforms are spreading through the army.',(S,t)=>[{label:'Promote him.',tip:'All divisions gain experience.',fx(S){for(const d of S.divs)if(d.o===t)d.xp=Math.min(1,d.xp+.04)}}]);
fate('f_spy','🕵️','A spy is caught',(S,t)=>{const r=rival(S,t);return'Counter-intelligence has arrested a clerk in the War Ministry who was selling mobilisation tables to '+nm(S,r)+'.'},(S,t)=>{const r=rival(S,t);return[
  {label:'Expel their attaché quietly.',tip:nm(S,r)+' −5.',w:60,fx(S){G.op(S,t,r,-5)}},{label:'A public trial.',tip:nm(S,r)+' −20, war support +4, tension +3.',w:40,fx(S){G.op(S,t,r,-20);bump(S,t,'ws',4);G.tension(S,3)}}]},(S,t)=>!!rival(S,t));
fate('f_border','🚧','Shots on the frontier',(S,t)=>{const r=border(S,t);return'A patrol has exchanged fire with '+G.adj(S,r)+' border guards. Each side says the other crossed the line. Two men are dead.'},(S,t)=>{const r=border(S,t);return[
  {label:'Express regret.',tip:'Political power −10, '+nm(S,r)+' +6.',w:30+dial(t,'cau')*50,fx(S){S.nat[t].pp-=10;G.op(S,t,r,6)}},{label:'Demand an apology.',tip:nm(S,r)+' −15, tension +4.',w:20+dial(t,'amb')*50,fx(S){G.op(S,t,r,-15);G.tension(S,4)}}]},(S,t)=>!!border(S,t));
fate('f_bank','🏦','A run on the banks','A great bank has suspended payments and depositors are queuing in the streets.',(S,t)=>[
  {label:'The treasury stands behind it.',tip:'Political power −30.',w:55,fx(S){S.nat[t].pp-=30}},{label:'Let it fail.',tip:'Stability −5, one civilian factory lost.',w:45,fx(S){bump(S,t,'stab',-5);S.nat[t].builtCiv-=1}}]);
fate('f_colony','🌍','Unrest in the colonies','A rising overseas has cut off a garrison. The governor asks for troops.',(S,t)=>[
  {label:'Send an expedition.',tip:'8,000 men will not come back.',w:60,fx(S){S.nat[t].lost+=8000}},{label:'Offer concessions.',tip:'Political power −20.',w:40,fx(S){S.nat[t].pp-=20}}],(S,t)=>t==='ENG'||t==='FRA');
fate('f_mutiny','🪖','Trouble in the ranks','Men back from the front are refusing orders at the depots. Their complaints are leave, food and letters from home.',(S,t)=>[
  {label:'Improve their conditions.',tip:'Political power −25, war support +5.',w:60,fx(S){S.nat[t].pp-=25;bump(S,t,'ws',5)}},{label:'Make examples.',tip:'Stability −4.',w:40,fx(S){bump(S,t,'stab',-4)}}],(S,t)=>G.inWar(S,t)&&S.nat[t].ws<38);
fate('f_flu','😷','The influenza','A fever is passing through the army camps and the cities. It kills the young and strong within days.',(S,t)=>[{label:'Bury the dead.',tip:'Heavy loss of manpower. Stability −3.',fx(S){S.nat[t].lost+=D.NATIONS[t].pop*1e6*.002;bump(S,t,'stab',-3)}}],(S,t)=>G.date(S.day).y>=1918);
fate('f_shells','💣','The shell scandal','The guns at the front are rationed to four rounds a day. A newspaper has printed the figures.',(S,t)=>[
  {label:'Create a Ministry of Munitions.',tip:'Political power −30.',w:60,fx(S){S.nat[t].pp-=30}},{label:'Blame the generals.',tip:'A fifth of the field guns in store are found to be useless.',w:40,fx(S){S.nat[t].stock.guns*=.8}}],(S,t)=>G.inWar(S,t));
fate('f_press','📰','War fever','The popular newspapers have found an enemy and are selling a million copies a day on the strength of it.',(S,t)=>[
  {label:'Let them print.',tip:'War support +4, tension +2.',w:60,fx(S){bump(S,t,'ws',4);G.tension(S,2)}},{label:'Censor them.',tip:'Stability −2.',w:40,fx(S){bump(S,t,'stab',-2)}}]);
fate('f_visit','👑','A state visit',(S,t)=>{const r=friend(S,t);return'The court of '+nm(S,r)+' has proposed a state visit, with all the uniforms, banquets and naval reviews that entails.'},(S,t)=>{const r=friend(S,t);return[
  {label:'Roll out the carpet.',tip:nm(S,r)+' +12.',fx(S){G.op(S,t,r,12)}}]},(S,t)=>!!friend(S,t));
function rival(S,t){return G.TAGS.filter(x=>x!==t&&D.NATIONS[x].major&&alive(S,x)&&!G.friendly(S,t,x)).sort((a,b)=>G.opinion(S,t,a)-G.opinion(S,t,b))[0]}
function border(S,t){return neighbours(S,t).filter(x=>!war(S,t,x)&&!G.friendly(S,t,x)).sort((a,b)=>G.opinion(S,t,a)-G.opinion(S,t,b))[0]}
function friend(S,t){return G.TAGS.filter(x=>x!==t&&alive(S,x)&&!war(S,t,x)&&G.opinion(S,t,x)>=0&&G.opinion(S,t,x)<80).sort((a,b)=>(D.NATIONS[b].major-D.NATIONS[a].major)||G.opinion(S,t,b)-G.opinion(S,t,a))[0]}

/* =====================================================================
   Checks the simulation runs for itself
   ===================================================================== */
/* the player is asked before being pulled into an ally's war */
G.checkCalls=function(S){const p=S.player;if(!S.nat[p])return;const f=S.nat[p].faction;if(!f||!alive(S,p))return;for(const m of G.members(S,f)){if(m===p||!alive(S,m))continue;
  for(const e of G.activeEnemies(S,m)){if(war(S,p,e)||G.friendly(S,p,e)||S.flags['call_'+e]!==undefined)continue;S.flags['call_'+e]=S.day;S.pending.push({id:'_allycall',tag:p,data:{ally:m,enemy:e,def:S.wars[m<e?m+'|'+e:e+'|'+m].agg===e}})}}};
/* ambitious powers pick fights when the world is tense and the odds are good */
G.aiAmbition=function(S){for(const t of G.TAGS){const C=D.NATIONS[t],N=S.nat[t];if(t===S.player||!alive(S,t)||G.inWar(S,t)||C.dials.amb<.55||S.tension<55||S.grudge[t]||N.ws<40)continue;if(G.rnd(S)>.07*C.dials.amb)continue;
  const targets=neighbours(S,t).filter(x=>!G.friendly(S,t,x)&&alive(S,x)&&(D.CLAIMS[t]||[]).some(k=>S.prov[G.KEY[k]].owner===x));if(!targets.length)continue;
  const x=targets.sort((a,b)=>odds(S,t,b)-odds(S,t,a))[0];if(odds(S,t,x)<1.25+C.dials.cau*.5)continue;
  if(S.cb[t+'>'+x]===undefined){S.cb[t+'>'+x]=S.day+45;G.tension(S,4);G.op(S,x,t,-20);G.news(S,'The '+G.adj(S,t)+' press turns on '+nm(S,x)+'. Diplomats fear a pretext for war is being prepared.','dip')}
  else if(S.cb[t+'>'+x]<=S.day)G.declareWar(S,t,x)}};
})(globalThis.PK=globalThis.PK||{});
