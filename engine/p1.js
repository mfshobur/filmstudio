(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var QUAL=0,REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function R(seed){var s=(seed>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function easeOut(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3)}
function easeIO(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function easeIn(t){t=clamp(t,0,1);return t*t*t}
function easeBack(t){t=clamp(t,0,1);var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
var PAL={ink:'#04050c',bone:'#f3ead9',ember:'#ffae5c',ice:'#86e6ff',mag:'#ff3d9a',vio:'#7a5cff',teal:'#2ec4b6',coral:'#ff6b57',yel:'#ffd166',navy:'#0b1a3a'};
var MONO='"IBM Plex Mono",ui-monospace,Menlo,monospace',SANS='"Hanken Grotesk",system-ui,sans-serif',SERIF='"Instrument Serif",Georgia,serif';

/* film grain tile */
(function(){try{var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');var d=x.createImageData(128,128);for(var i=0;i<d.data.length;i+=4){var v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);$('#grain').style.backgroundImage='url('+c.toDataURL()+')'}catch(e){}})();

/* canvases: main + bloom + anamorphic streak */
var cv=$('#c'),g=cv.getContext('2d',{alpha:false});
var bcv=$('#bloom'),bg=bcv.getContext('2d'),scv=$('#streak'),sg=scv.getContext('2d');
var W=0,H=0,DPR=1,U=100,CX=0,CY=0,titleCv=null;
function resize(){
  DPR=QUAL>=1?1:Math.min(window.devicePixelRatio||1,1.5);
  W=cv.clientWidth;H=cv.clientHeight;if(!W||!H)return;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);g.setTransform(DPR,0,0,DPR,0,0);
  bcv.width=Math.max(16,Math.round(W/9));bcv.height=Math.max(16,Math.round(H/9));
  scv.width=Math.max(8,Math.round(W/46));scv.height=Math.max(16,Math.round(H/3));
  U=Math.min(W*.46,H*.40);CX=W/2;CY=H*.5;titleCv=null;
}
window.addEventListener('resize',resize);resize();

/* colour sprites: ember -> bone -> ice */
function ramp(t){var a=[255,174,92],b=[243,234,217],c=[134,230,255],u,p,q;t=clamp(t,0,1);if(t<.5){u=t*2;p=a;q=b}else{u=(t-.5)*2;p=b;q=c}return [p[0]+(q[0]-p[0])*u|0,p[1]+(q[1]-p[1])*u|0,p[2]+(q[2]-p[2])*u|0]}
function rgba(t,a){var c=ramp(t);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}
var sprites=[];
for(var si=0;si<8;si++){var cc=document.createElement('canvas');cc.width=cc.height=48;var x=cc.getContext('2d');var col=ramp(si/7),gr=x.createRadialGradient(24,24,0,24,24,24);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba('+col[0]+','+col[1]+','+col[2]+',.9)');gr.addColorStop(.55,'rgba('+col[0]+','+col[1]+','+col[2]+',.18)');gr.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)');x.fillStyle=gr;x.fillRect(0,0,48,48);sprites.push(cc)}
function mkGlow(c0,c1){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');var gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,c0);gr.addColorStop(.35,c1);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);return c}
var glowWarm=mkGlow('rgba(255,224,180,.9)','rgba(255,150,70,.22)'),glowCool=mkGlow('rgba(220,245,255,.8)','rgba(90,170,255,.18)');

/* drawing helpers */
var F={tb:0,dur:1,p:0,T:0,k:0,beat:0};
function spr(i,x,y,r,a){g.globalAlpha=a;g.drawImage(sprites[i],x-r,y-r,r*2,r*2)}
function circ(x,y,r){g.beginPath();g.arc(x,y,r,0,6.2832)}
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function ln(a,b,c,d){g.moveTo(a,b);g.lineTo(c,d)}
function txt(s,x,y,sz,col,al,fam,w){g.font=(w||'')+' '+sz+'px '+(fam||MONO);g.fillStyle=col;g.textAlign=al||'left';g.textBaseline='middle';g.fillText(s,x,y)}
function bgGrad(a,b){var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,W,H)}
function reset(){g.globalCompositeOperation='source-over';g.globalAlpha=1;g.lineCap='round';g.lineJoin='round'}
var X3=0,Y3=0,Z3=0;
function p3(x,y,z,yaw,pit,sc){var cy=Math.cos(yaw),sy=Math.sin(yaw),x1=x*cy-z*sy,z1=x*sy+z*cy,cp=Math.cos(pit),sp=Math.sin(pit),y1=y*cp-z1*sp,z2=y*sp+z1*cp,f=1/(1-z2*.14);X3=CX+x1*sc*f;Y3=CY+y1*sc*f;Z3=z2;return f}
