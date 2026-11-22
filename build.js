/* Bundles src/ into one page.
   dist/powder-keg.html  page body only, as a Claude artifact expects it
   index.html            the same page as a complete document, for opening locally or GitHub Pages */
const fs=require('fs'),path=require('path'),src=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
const head='<title>Powder Keg</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'+
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Alegreya+Sans:wght@400;500;700&display=swap">\n';
const js=['mapdata','data','sim','events','plans','art','ui'].map(f=>src(f+'.js').replace(/<\/script/g,'<\\/script')).join('\n');
const body=head+'<style>\n'+src('style.css')+'</style>\n'+src('shell.html')+'<script>\n'+js+'\n</script>\n';
fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'dist','powder-keg.html'),body);
fs.writeFileSync(path.join(__dirname,'index.html'),'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n'+body+'</body></html>\n');
console.log('built',Math.round(body.length/1024)+'KB');
