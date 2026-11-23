/* Bundles src/ into one page.
   dist/powder-keg.html  page body only, as a Claude artifact expects it
   index.html            the same page as a complete document, for opening locally or GitHub Pages */
const fs=require('fs'),path=require('path'),src=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
const head='<title>Powder Keg</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'+
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Alegreya+Sans:wght@400;500;700&display=swap">\n';
/* refuse to bundle a file that does not parse */
for(const f of fs.readdirSync(path.join(__dirname,'src')).filter(f=>f.endsWith('.js')))require('child_process').execFileSync(process.execPath,['--check',path.join(__dirname,'src',f)],{stdio:'inherit'});
const js=['mapdata','data','sim','events','plans','scen1936','art','ui'].map(f=>src(f+'.js').replace(/<\/script/g,'<\\/script')).join('\n');
const body=head+'<style>\n'+src('style.css')+'</style>\n'+src('shell.html')+'<script>\n'+js+'\n</script>\n';
fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'dist','powder-keg.html'),body);
fs.writeFileSync(path.join(__dirname,'index.html'),'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'+
 '<link rel="manifest" href="manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Powder Keg"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="theme-color" content="#F1E9D6"><link rel="apple-touch-icon" href="icons/icon-180.png">'+
 '</head><body>\n'+body+'<script>if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0)navigator.serviceWorker.register("sw.js").catch(function(){})</script>\n</body></html>\n');
/* the iOS wrapper carries its own copy of the page */
const ios=path.join(__dirname,'ios','PowderKeg.swiftpm','Resources');if(fs.existsSync(ios))fs.copyFileSync(path.join(__dirname,'index.html'),path.join(ios,'index.html'));
console.log('built',Math.round(body.length/1024)+'KB');
