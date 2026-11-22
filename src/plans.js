/* Powder Keg — national plans. One plan runs at a time and takes about 70 days.
   req: plans that must be finished first. x: plans this one rules out (and is ruled out by).
   only: the one nation that has it. war: only in wartime. w: weight for computer-run nations. */
(function(PK){
const D=PK.DATA,G=PK.SIM,M=PK.MAP,L=PK.PLANS={};
const st=(S,t,k,v)=>{S.nat[t][k]=Math.max(0,Math.min(100,S.nat[t][k]+v))};
const mod=(S,t,k,v)=>{const m=S.nat[t].mod;m[k]=(m[k]||0)+v};
const fac=(S,t,c,m)=>{S.nat[t].builtCiv+=c;S.nat[t].builtMil+=m};
const op=(S,t,o,v)=>{if(S.nat[o]&&!S.nat[o].dead)G.op(S,o,t,v)};
const raise=(S,t,n,name,str)=>{const N=S.nat[t];if(N.cap>=0&&S.prov[N.cap].ctrl===t){G.spawn(S,t,N.cap,0,n,.15,name,str||.8);G.index(S)}};
const rail=(S,t,keys)=>{for(const k of keys){const i=G.KEY[k];if(i!==undefined&&S.prov[i].ctrl===t)S.prov[i].rail=Math.min(3,S.prov[i].rail+1)}};
const cb=(S,t,o)=>{if(S.nat[o]&&!S.nat[o].dead)S.cb[t+'>'+o]=S.day};
function P(id,group,name,desc,fx,o){L[id]=Object.assign({id,group,name,desc,fx,days:70},o||{})}

/* ---- every nation ---- */
P('g_ind1','Industry','Public works','+2 civilian factories.',(S,t)=>fac(S,t,2,0));
P('g_ind2','Industry','Armaments contracts','+2 military factories.',(S,t)=>fac(S,t,0,2),{req:['g_ind1']});
P('g_ind3','Industry','Technical schools','Factory output +5%. Current research leaps forward.',(S,t)=>{mod(S,t,'prod',.05);for(const r of S.nat[t].research)r.prog+=.25},{req:['g_ind1']});
P('g_ind4','Industry','National railways','Movement +10%, supply +10%, construction +10%.',(S,t)=>{mod(S,t,'move',.1);mod(S,t,'supply',.1);mod(S,t,'build',.1)},{req:['g_ind2']});
P('g_army1','Army','General staff reform','Organisation recovers 10% faster. Every division gains experience.',(S,t)=>{mod(S,t,'org',.1);for(const d of S.divs)if(d.o===t)d.xp=Math.min(1,d.xp+.05)});
P('g_army2a','Army','Doctrine of the offensive','Infantry attack +8%, breakthrough +40%. Losses +5%.',(S,t)=>{mod(S,t,'infAtt',.08);mod(S,t,'infBrk',.4);mod(S,t,'loss',.05)},{req:['g_army1'],x:['g_army2b'],w:(S,t)=>.5+D.NATIONS[t].dials.amb});
P('g_army2b','Army','Doctrine of firepower','Artillery attack +8%, infantry defence +6%.',(S,t)=>{mod(S,t,'artAtt',.08);mod(S,t,'infDef',.06)},{req:['g_army1'],x:['g_army2a'],w:(S,t)=>.5+D.NATIONS[t].dials.cau});
P('g_army3','Army','Reserve system','Reservists form new divisions at the capital.',(S,t)=>raise(S,t,Math.max(2,Math.round(S.nat[t].divs0*.1))),{req:['g_army1']});
P('g_army4','Army','Fortify the frontier','+1 fort level in every border province, up to level 3.',(S,t)=>{for(let i=0;i<M.provs.length;i++){const pr=S.prov[i];if(pr.ctrl!==t||pr.fort>=3)continue;if(M.adj[i].some(j=>!G.friendly(S,t,S.prov[j].ctrl)))pr.fort++}},{req:['g_army3']});
P('g_pol1','Politics','Press bureau','War support +6.',(S,t)=>st(S,t,'ws',6));
P('g_pol2a','Politics','Social reform','Stability +10, war support −3.',(S,t)=>{st(S,t,'stab',10);st(S,t,'ws',-3)},{req:['g_pol1'],x:['g_pol2b']});
P('g_pol2b','Politics','Law and order','Stability +4, war support +5.',(S,t)=>{st(S,t,'stab',4);st(S,t,'ws',5)},{req:['g_pol1'],x:['g_pol2a']});
P('g_pol3','Politics','Diplomatic corps','+60 political power. Every great power thinks a little better of us.',(S,t)=>{S.nat[t].pp+=60;for(const o of G.TAGS)if(o!==t&&D.NATIONS[o].major)op(S,t,o,5)},{req:['g_pol1']});

/* ---- German Empire ---- */
P('ger_welt','Empire','Weltpolitik','A place in the sun. Fleet +15, war support +4, Britain −20.',(S,t)=>{S.nat[t].navy+=15;st(S,t,'ws',4);op(S,t,'ENG',-20)},{scen:'1914',only:'GER',x:['ger_cont'],w:()=>1.5});
P('ger_cont','Empire','Continental policy','Give up the naval race. Britain +25, +2 military factories, fleet −10.',(S,t)=>{S.nat[t].navy=Math.max(10,S.nat[t].navy-10);fac(S,t,0,2);op(S,t,'ENG',25)},{scen:'1914',only:'GER',x:['ger_welt']});
P('ger_mittel','Empire','Mitteleuropa','A customs union under German leadership. +2 civilian factories, Austria +20.',(S,t)=>{fac(S,t,2,0);op(S,t,'AUS',20)},{scen:'1914',only:'GER'});
P('ger_reins','Empire','A new Reinsurance Treaty','Bismarck\'s policy revived. Russia +30, Austria −15, tension −5.',(S,t)=>{op(S,t,'RUS',30);op(S,t,'AUS',-15);G.tension(S,-5)},{scen:'1914',only:'GER',req:['ger_cont'],x:['ger_nibel']});
P('ger_nibel','Empire','Nibelungen loyalty','Stand by Vienna without conditions. Austria +25, Russia −10, war support +5.',(S,t)=>{op(S,t,'AUS',25);op(S,t,'RUS',-10);st(S,t,'ws',5)},{scen:'1914',only:'GER',x:['ger_reins'],w:()=>1.5});
P('ger_hind','Empire','The Hindenburg Programme','Total war production. +5 military factories, stability −5.',(S,t)=>{fac(S,t,0,5);st(S,t,'stab',-5)},{scen:'1914',only:'GER',war:true,req:['g_ind2']});

/* ---- French Republic ---- */
P('fra_3yr','Republic','The Three-Year Law','Longer service fills the ranks. 5 new divisions, stability −3.',(S,t)=>{raise(S,t,5);st(S,t,'stab',-3)},{scen:'1914',only:'FRA'});
P('fra_rev','Republic','Revanche','Alsace-Lorraine above all. War support +10, a case for war against Germany, Germany −15.',(S,t)=>{st(S,t,'ws',10);cb(S,t,'GER');op(S,t,'GER',-15)},{scen:'1914',only:'FRA',x:['fra_det'],w:()=>1.6});
P('fra_det','Republic','Rapprochement with Berlin','Caillaux\'s policy. Germany +25, tension −6, war support −5, Russia −10.',(S,t)=>{op(S,t,'GER',25);G.tension(S,-6);st(S,t,'ws',-5);op(S,t,'RUS',-10)},{scen:'1914',only:'FRA',x:['fra_rev']});
P('fra_brit','Republic','Bind Britain','Staff talks and naval agreements. Britain +25.',(S,t)=>op(S,t,'ENG',25),{scen:'1914',only:'FRA'});
P('fra_union','Republic','Union sacrée','All parties behind the war. Stability +10, war support +8.',(S,t)=>{st(S,t,'stab',10);st(S,t,'ws',8)},{scen:'1914',only:'FRA',war:true});

/* ---- British Empire ---- */
P('eng_iso','Empire','Splendid isolation','No continental entanglements. Stability +6, tension −4, Germany +10, France −15.',(S,t)=>{st(S,t,'stab',6);G.tension(S,-4);op(S,t,'GER',10);op(S,t,'FRA',-15)},{scen:'1914',only:'ENG',x:['eng_cont']});
P('eng_cont','Empire','The continental commitment','Plan openly to fight beside France. France +25, war support +10, 4 new divisions.',(S,t)=>{op(S,t,'FRA',25);st(S,t,'ws',10);raise(S,t,4)},{scen:'1914',only:'ENG',x:['eng_iso'],w:()=>1.4});
P('eng_dread','Empire','The two-power standard','Fleet +20, Germany −10.',(S,t)=>{S.nat[t].navy+=20;op(S,t,'GER',-10)},{scen:'1914',only:'ENG'});
P('eng_kit','Empire','Kitchener\'s New Army','"Your country needs you." 10 volunteer divisions at half strength, war support +5.',(S,t)=>{raise(S,t,10,null,.5);st(S,t,'ws',5)},{scen:'1914',only:'ENG',war:true});
P('eng_dom','Empire','Call on the Dominions','Canada, Australia, New Zealand, South Africa and India send 6 divisions.',(S,t)=>raise(S,t,6,'# Dominion Division',.9),{scen:'1914',only:'ENG',war:true});

/* ---- Russian Empire ---- */
P('rus_prog','Tsardom','The Great Programme','The army expansion planned for 1917, brought forward. 8 new divisions and 200 field guns.',(S,t)=>{raise(S,t,8);S.nat[t].stock.guns+=200},{scen:'1914',only:'RUS'});
P('rus_duma','Tsardom','Work with the Duma','A government the country can trust. Stability +12, war support −2.',(S,t)=>{st(S,t,'stab',12);st(S,t,'ws',-2)},{scen:'1914',only:'RUS',x:['rus_auto']});
P('rus_auto','Tsardom','Autocracy, Orthodoxy, Nationality','War support +8, stability −4.',(S,t)=>{st(S,t,'ws',8);st(S,t,'stab',-4)},{scen:'1914',only:'RUS',x:['rus_duma'],w:()=>1.5});
P('rus_slav','Tsardom','Protector of the Slavs','Serbia +20, Bulgaria +20, Austria −15.',(S,t)=>{op(S,t,'SER',20);op(S,t,'BUL',20);op(S,t,'AUS',-15)},{scen:'1914',only:'RUS',x:['rus_bjorko'],w:()=>1.5});
P('rus_bjorko','Tsardom','The Björkö understanding','The cousins\' treaty of 1905, signed in earnest this time. Germany +30, France −25, tension −5.',(S,t)=>{op(S,t,'GER',30);op(S,t,'FRA',-25);G.tension(S,-5)},{scen:'1914',only:'RUS',x:['rus_slav']});
P('rus_rail','Tsardom','Strategic railways','French loans build lines to the western frontier. Rail +1 in Warsaw, Brest-Litovsk, Vilna and Kiev; movement +10%.',(S,t)=>{rail(S,t,['warsaw','brestlitovsk','vilna','kiev']);mod(S,t,'move',.1)},{scen:'1914',only:'RUS'});

/* ---- Austria-Hungary ---- */
P('aus_trial','Monarchy','Trialism','A third, South Slav crown beside Austria and Hungary. Stability +14, Serbia +10, war support −3.',(S,t)=>{st(S,t,'stab',14);op(S,t,'SER',10);st(S,t,'ws',-3)},{scen:'1914',only:'AUS',x:['aus_magyar']});
P('aus_magyar','Monarchy','Hold to the Compromise','Budapest keeps its veto. Stability +4, war support +6.',(S,t)=>{st(S,t,'stab',4);st(S,t,'ws',6)},{scen:'1914',only:'AUS',x:['aus_trial'],w:()=>1.5});
P('aus_skoda','Monarchy','The Škoda works','+3 military factories, artillery attack +5%.',(S,t)=>{fac(S,t,0,3);mod(S,t,'artAtt',.05)},{scen:'1914',only:'AUS'});
P('aus_serb','Monarchy','Settle accounts with Serbia','A case for war against Serbia, at once. Tension +6.',(S,t)=>{cb(S,t,'SER');G.tension(S,6)},{scen:'1914',only:'AUS'});
P('aus_conrad','Monarchy','Conrad\'s army bill','5 new divisions.',(S,t)=>raise(S,t,5),{scen:'1914',only:'AUS'});

/* ---- Kingdom of Italy ---- */
P('ita_triple','Kingdom','Renew the Triple Alliance','Germany +20, Austria +20, France −15.',(S,t)=>{op(S,t,'GER',20);op(S,t,'AUS',20);op(S,t,'FRA',-15)},{scen:'1914',only:'ITA',x:['ita_ent']});
P('ita_ent','Kingdom','Look to London and Paris','Britain +20, France +20, Austria −20.',(S,t)=>{op(S,t,'ENG',20);op(S,t,'FRA',20);op(S,t,'AUS',-20)},{scen:'1914',only:'ITA',x:['ita_triple'],w:()=>1.4});
P('ita_irr','Kingdom','Italia irredenta','Trento and Trieste. War support +10, a case for war against Austria-Hungary, Austria −20.',(S,t)=>{st(S,t,'ws',10);cb(S,t,'AUS');op(S,t,'AUS',-20)},{scen:'1914',only:'ITA'});
P('ita_alp','Kingdom','The Alpini','Mountain troops. Infantry defence +6%, 3 new divisions.',(S,t)=>{mod(S,t,'infDef',.06);raise(S,t,3)},{scen:'1914',only:'ITA'});
P('ita_ind','Kingdom','The industrial triangle','Turin, Milan, Genoa. +2 civilian and +2 military factories.',(S,t)=>fac(S,t,2,2),{scen:'1914',only:'ITA'});

/* ---- Ottoman Empire ---- */
P('ott_ger','Sublime Porte','The German military mission','Liman von Sanders retrains the army. Germany +25, Russia −10, every division gains experience.',(S,t)=>{op(S,t,'GER',25);op(S,t,'RUS',-10);for(const d of S.divs)if(d.o===t)d.xp=Math.min(1,d.xp+.08)},{scen:'1914',only:'OTT',x:['ott_eng'],w:()=>1.6});
P('ott_eng','Sublime Porte','The British naval mission','Britain +25, fleet +6.',(S,t)=>{op(S,t,'ENG',25);S.nat[t].navy+=6},{scen:'1914',only:'OTT',x:['ott_ger']});
P('ott_rail','Sublime Porte','The Baghdad Railway','+2 civilian factories. Rail +1 in Angora, Adana and Aleppo.',(S,t)=>{fac(S,t,2,0);rail(S,t,['ankara','adana','aleppo'])},{scen:'1914',only:'OTT'});
P('ott_cap','Sublime Porte','Abolish the Capitulations','End the foreigners\' privileges. Stability +8, +40 political power, Britain −10, France −10.',(S,t)=>{st(S,t,'stab',8);S.nat[t].pp+=40;op(S,t,'ENG',-10);op(S,t,'FRA',-10)},{scen:'1914',only:'OTT'});
P('ott_jihad','Sublime Porte','Proclaim holy war','The Sultan-Caliph calls the faithful to arms. War support +10. Britain and France lose stability.',(S,t)=>{st(S,t,'ws',10);if(G.atWar(S,t,'ENG'))st(S,'ENG','stab',-3);if(G.atWar(S,t,'FRA'))st(S,'FRA','stab',-2)},{scen:'1914',only:'OTT',war:true});
})(globalThis.PK=globalThis.PK||{});
