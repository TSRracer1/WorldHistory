/* Headless run: every nation on AI. Usage: node test/run.js [seed] [days] [player] */
const path=require('path');
for(const f of ['mapdata','data','sim','events'])require(path.join('..','src',f+'.js'));
const {SIM:G,DATA:D,MAP:M}=globalThis.PK;
const seed=+process.argv[2]||1914,days=+process.argv[3]||1600,quiet=process.argv.includes('-q');
const S=G.newGame(process.argv[4]||'XXX',seed);
function check(){for(const d of S.divs){if(!(d.str>=0&&d.str<=1.0001)||!(d.org>=0&&d.org<=1.0001)||isNaN(d.str+d.org+d.prog))throw new Error('bad division '+JSON.stringify(d))}
  for(const t of G.TAGS){const N=S.nat[t];for(const k of['pp','stab','ws','lost','mil','civ'])if(isNaN(N[k]))throw new Error('NaN '+t+'.'+k);for(const e in N.stock)if(isNaN(N.stock[e])||N.stock[e]<-1)throw new Error('stock '+t+' '+e+' '+N.stock[e])}}
let last=0;const t0=Date.now();
for(let i=0;i<days;i++){if(S.pending.length){while(S.pending.length)G.resolve(S,0,0)}G.tick(S);check();
  if(!quiet)for(;last<S.chron.length;last++)console.log(G.date(S.chron[last].day).str.padEnd(18),S.chron[last].text);
  if(!quiet&&i%180===179){const row=G.TAGS.filter(t=>D.NATIONS[t].major).map(t=>{const N=S.nat[t];return t+(N.capit?'x':'')+' d'+S.divs.filter(d=>d.o===t).length+' ws'+Math.round(N.ws)+' st'+Math.round(N.stab)+' L'+Math.round(N.lost/1000)+'k'});console.log('   --',row.join(' | '),'| tension',Math.round(S.tension),'battles',Object.keys(S.battles).length)}}
const str=G.save(S);const S2=G.load(str);if(!S2||S2.divs.length!==S.divs.length)throw new Error('save/load mismatch');
console.log('OK seed',seed,'ended',G.date(S.day).str,'divs',S.divs.length,'wars',Object.keys(S.wars).length,'treaties',S.treaties.length,'save',Math.round(str.length/1024)+'KB',(Date.now()-t0)+'ms');
