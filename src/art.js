/* Powder Keg — countryball art. Canvas only; no game state. */
(function(PK){
const A=PK.ART={};
const K='#1B1B1B',W='#F4F1EA',R='#D2262B',B='#1F3F8F',Y='#F2C230',Gn='#1F8A45';
function cross(bg,fg,inner){return(c,x,y,w,h)=>{c.fillStyle=bg;c.fillRect(x,y,w,h);c.fillStyle=fg;c.fillRect(x+w*.28,y,w*.18,h);c.fillRect(x,y+h*.41,w,h*.18);if(inner){c.fillStyle=inner;c.fillRect(x+w*.33,y,w*.08,h);c.fillRect(x,y+h*.46,w,h*.08)}}}
function dot(base,col,rr){return(c,x,y,w,h)=>{stripes(c,base,x,y,w,h);c.fillStyle=col;c.beginPath();c.arc(x+w/2,y+h/2,w*(rr||.13),0,7);c.fill()}}
function stripes(c,f,x,y,w,h){const a=f.h||f.v,n=a.length;a.forEach((col,i)=>{c.fillStyle=col;if(f.h)c.fillRect(x,y+h*i/n,w,h/n+1);else c.fillRect(x+w*i/n,y,w/n+1,h)})}
const FLAG=A.FLAG={
 GER:{h:[K,W,'#C8201E']},FRA:{v:[B,W,R]},RUS:{h:[W,'#2449A0',R]},AUS:{h:[K,Y]},ITA:{v:[Gn,W,R]},SER:{h:['#C8201E',B,W]},SPA:{h:[R,Y,Y,R]},BEL:{v:[K,Y,R]},ROM:{v:[B,Y,R]},BUL:{h:[W,Gn,R]},
 NED:{h:['#B5262B',W,'#27468F']},LUX:{h:['#D2262B',W,'#4FA8DC']},PER:{h:[Gn,W,R]},GRE:{h:['#2B62B8',W,'#2B62B8',W,'#2B62B8']},POR:{v:[Gn,R,R]},
 POL:{h:[R,W]},HUN:{h:[R,W,Gn]},UKR:{h:['#2B62B8',Y]},LIT:{h:[Y,Gn,R]},LAT:{h:['#8E1D2A','#8E1D2A',W,'#8E1D2A','#8E1D2A']},EST:{h:['#2B62B8',K,W]},IRE:{v:[Gn,W,'#E8873A']},AUT:{h:[R,W,R]},
 FIN:cross(W,'#22408C'),CZE(c,x,y,w,h){c.fillStyle=W;c.fillRect(x,y,w,h/2);c.fillStyle=R;c.fillRect(x,y+h/2,w,h/2);c.fillStyle=B;c.beginPath();c.moveTo(x,y);c.lineTo(x+w*.5,y+h/2);c.lineTo(x,y+h);c.fill()},
 REP:{h:[K,R,Y]},MNT:dot({h:['#C8201E',B,W]},Y,.12),ALB:dot({h:['#C8201E']},K,.2),SOV:dot({h:['#C8201E']},Y,.12),
 SWE:cross('#2A66A8',Y),DEN:cross('#C8201E',W),NOR:cross('#C8201E',W,'#22408C'),
 SWI(c,x,y,w,h){c.fillStyle='#D2262B';c.fillRect(x,y,w,h);c.fillStyle=W;c.fillRect(x+w*.42,y+h*.28,w*.16,h*.44);c.fillRect(x+w*.28,y+h*.42,w*.44,h*.16)},
 OTT(c,x,y,w,h){c.fillStyle='#C8201E';c.fillRect(x,y,w,h);c.fillStyle=W;c.beginPath();c.arc(x+w*.44,y+h*.56,w*.2,0,7);c.fill();c.fillStyle='#C8201E';c.beginPath();c.arc(x+w*.5,y+h*.56,w*.16,0,7);c.fill();c.fillStyle=W;c.beginPath();c.arc(x+w*.67,y+h*.56,w*.05,0,7);c.fill()},
 ENG(c,x,y,w,h){c.fillStyle='#22408C';c.fillRect(x,y,w,h);const d=(lw,col)=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y+h);c.moveTo(x+w,y);c.lineTo(x,y+h);c.stroke()};
   d(w*.16,W);d(w*.06,R);c.fillStyle=W;c.fillRect(x+w*.39,y,w*.22,h);c.fillRect(x,y+h*.39,w,h*.22);c.fillStyle=R;c.fillRect(x+w*.44,y,w*.12,h);c.fillRect(x,y+h*.44,w,h*.12)},
 USA(c,x,y,w,h){for(let i=0;i<7;i++){c.fillStyle=i%2?W:R;c.fillRect(x,y+h*i/7,w,h/7+1)}c.fillStyle='#22408C';c.fillRect(x,y,w*.5,h*.45)}
};
A.paintFlag=function(c,id,x,y,w,h){const f=FLAG[id]||{h:['#888']};if(typeof f==='function')f(c,x,y,w,h);else stripes(c,f,x,y,w,h)};
const HAT={ENG:'tophat',RUS:'ushanka',SOV:'ushanka',OTT:'fez',GER:'pickel',FRA:'beret',AUS:'crown',USA:'shades',SER:'cap',SWI:'none'};
function shape(c,id,x,y,r){c.beginPath();
  if(id==='GER'){const w=r*.74,h=r*1.3,k=r*.2;c.moveTo(x-w+k,y-h);c.lineTo(x+w-k,y-h);c.quadraticCurveTo(x+w,y-h,x+w,y-h+k);c.lineTo(x+w,y+h-k);c.quadraticCurveTo(x+w,y+h,x+w-k,y+h);c.lineTo(x-w+k,y+h);c.quadraticCurveTo(x-w,y+h,x-w,y+h-k);c.lineTo(x-w,y-h+k);c.quadraticCurveTo(x-w,y-h,x-w+k,y-h)}
  else{const s=id.charCodeAt(0)+id.charCodeAt(1);for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,rr=r*(1+.035*Math.sin(3*a+s)+.02*Math.sin(5*a+s*2));c[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr)}}
  c.closePath()}
function eye(c,cx,cy,rx,ry,mood,side){
  if(mood==='sleep'){c.beginPath();c.moveTo(cx-rx,cy);c.quadraticCurveTo(cx,cy+ry*.5,cx+rx,cy);c.stroke();return}
  const ox=cx+side*rx*1.5,ix=cx-side*rx*1.5;let a=null;
  if(mood==='angry')a=[ox,cy-ry*1.05,ix,cy-ry*.02];if(mood==='worried')a=[ox,cy-ry*.05,ix,cy-ry*1.05];
  c.save();c.beginPath();
  if(a){c.moveTo(a[0],a[1]);c.lineTo(a[2],a[3]);c.lineTo(a[2],cy+ry*2);c.lineTo(a[0],cy+ry*2)}else if(mood==='happy')c.rect(cx-rx*2,cy-ry*2,rx*4,ry*2.15);else c.rect(cx-rx*2,cy-ry*2,rx*4,ry*4);
  c.clip();c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,7);c.fillStyle='#fff';c.fill();c.stroke();c.restore();
  if(a){c.beginPath();c.moveTo(cx+side*rx*1.15,a[1]+(a[3]-a[1])*.12);c.lineTo(cx-side*rx*1.15,a[1]+(a[3]-a[1])*.88);c.stroke()}
  else if(mood==='happy'){c.beginPath();c.moveTo(cx-rx*.95,cy+ry*.15);c.lineTo(cx+rx*.95,cy+ry*.15);c.stroke()}}
/* o: {you, ghost, plain (no hat, no shadow: for small map counters)} */
A.ball=function(c,id,x,y,r,mood,o){o=o||{};const rect=id==='GER',top=rect?y-r*1.3:y-r,ey=rect?y-r*.62:y-r*.12,lw=Math.max(.8,r*.09);
  c.save();c.lineJoin='round';c.lineCap='round';
  if(!o.plain){c.beginPath();c.ellipse(x,rect?y+r*1.3:y+r*.98,r*(o.you?1.15:.8),r*(o.you?.3:.18),0,0,7);c.fillStyle=o.you?'rgba(200,155,60,.8)':'rgba(42,36,28,.22)';c.fill()}
  if(o.ghost)c.globalAlpha=.45;
  shape(c,id,x,y,r);c.save();c.clip();A.paintFlag(c,id,x-r*1.1,y-r*1.4,r*2.2,r*2.8);c.restore();
  c.strokeStyle=K;c.lineWidth=lw;shape(c,id,x,y,r);c.stroke();
  const hat=o.plain?'none':HAT[id];c.lineWidth=lw*.8;
  if(hat==='shades'){c.fillStyle=K;c.beginPath();c.rect(x-r*.66,ey-r*.2,r*.56,r*.38);c.rect(x+r*.1,ey-r*.2,r*.56,r*.38);c.fill();c.beginPath();c.moveTo(x-r*.9,ey-r*.14);c.lineTo(x+r*.9,ey-r*.14);c.stroke()}
  else if(r>=5){const ex=rect?r*.3:r*.36,rx=rect?r*.19:r*.2,ry=rect?r*.24:r*.26;eye(c,x-ex,ey,rx,ry,mood||'neutral',-1);eye(c,x+ex,ey,rx,ry,mood||'neutral',1)}
  c.lineWidth=lw*.7;c.strokeStyle=K;
  if(hat==='tophat'){c.fillStyle=K;c.fillRect(x-r*.42,top-r*.62,r*.84,r*.78);c.fillRect(x-r*.72,top+r*.08,r*1.44,r*.14);c.fillStyle='#8E1D1A';c.fillRect(x-r*.42,top-r*.08,r*.84,r*.13);
    c.strokeStyle='#C89B3C';c.lineWidth=lw*.8;c.beginPath();c.arc(x+r*.36,ey,r*.31,0,7);c.stroke();c.beginPath();c.moveTo(x+r*.6,ey+r*.2);c.lineTo(x+r*.72,y+r*.55);c.stroke()}
  if(hat==='ushanka'){c.fillStyle='#6B4A2B';c.beginPath();c.ellipse(x,top+r*.2,r*.8,r*.5,0,Math.PI,Math.PI*2);c.closePath();c.fill();c.stroke();c.fillStyle='#8A6740';c.beginPath();c.rect(x-r*.58,top+r*.04,r*1.16,r*.17);c.fill();c.stroke();
    c.fillStyle='#6B4A2B';c.beginPath();c.ellipse(x-r*.88,top+r*.5,r*.16,r*.34,.2,0,7);c.fill();c.stroke();c.beginPath();c.ellipse(x+r*.88,top+r*.5,r*.16,r*.34,-.2,0,7);c.fill();c.stroke()}
  if(hat==='fez'){c.fillStyle='#A8201A';c.beginPath();c.moveTo(x-r*.36,top+r*.12);c.lineTo(x-r*.26,top-r*.48);c.lineTo(x+r*.26,top-r*.48);c.lineTo(x+r*.36,top+r*.12);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(x,top-r*.48);c.lineTo(x+r*.42,top-r*.2);c.stroke()}
  if(hat==='pickel'){c.fillStyle='#2B2B2B';c.beginPath();c.ellipse(x,top+r*.1,r*.7,r*.46,0,Math.PI,Math.PI*2);c.closePath();c.fill();c.stroke();c.fillStyle='#C89B3C';c.beginPath();c.moveTo(x-r*.11,top-r*.34);c.lineTo(x,top-r*.86);c.lineTo(x+r*.11,top-r*.34);c.closePath();c.fill();c.stroke()}
  if(hat==='beret'){c.fillStyle='#22315C';c.beginPath();c.ellipse(x+r*.12,top+r*.1,r*.74,r*.25,-.16,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x+r*.1,top-r*.14);c.lineTo(x+r*.16,top-r*.3);c.stroke()}
  if(hat==='crown'){c.fillStyle='#E0B23A';c.beginPath();c.moveTo(x-r*.5,top+r*.16);c.lineTo(x-r*.56,top-r*.42);c.lineTo(x-r*.26,top-r*.12);c.lineTo(x,top-r*.52);c.lineTo(x+r*.26,top-r*.12);c.lineTo(x+r*.56,top-r*.42);c.lineTo(x+r*.5,top+r*.16);c.closePath();c.fill();c.stroke()}
  if(hat==='cap'){c.fillStyle='#5C6B3A';c.beginPath();c.moveTo(x-r*.55,top+r*.2);c.lineTo(x-r*.4,top-r*.3);c.lineTo(x,top-r*.12);c.lineTo(x+r*.4,top-r*.3);c.lineTo(x+r*.55,top+r*.2);c.closePath();c.fill();c.stroke()}
  c.restore()};
/* a small canvas with one ball on it, for menus and panels */
A.icon=function(id,size,mood){const cv=document.createElement('canvas'),s=size||40;cv.width=s*2;cv.height=s*2.3;cv.style.width=s+'px';cv.style.height=s*1.15+'px';const c=cv.getContext('2d');c.scale(2,2);A.ball(c,id,s/2,s*(id==='GER'?.62:.66),s*(id==='GER'?.3:.36),mood);return cv};
})(globalThis.PK=globalThis.PK||{});
