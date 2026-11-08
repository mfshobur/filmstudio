
/* ================= STYLE: KINETIC TYPOGRAPHY ("type") ================= */
/* params: {text:"words to say", palette:{bg,fg,accent}, font:"serif|sans|mono", emphasize:[wordIndexes], perBeat:0.5 (beats per word)} */
function tyFont(P,sz){var f=P.font==='sans'?SANS:P.font==='mono'?MONO:SERIF;return (P.font==='sans'?'800 ':P.font==='mono'?'500 ':'italic 400 ')+sz+'px '+f}
function tyBg(P){var pal=P.palette||{};reset();g.fillStyle=pal.bg||'#0c1024';g.fillRect(0,0,W,H);var gr=g.createRadialGradient(CX,CY,0,CX,CY,Math.max(W,H)*.7);gr.addColorStop(0,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
function fitSize(str,P,maxW,maxSz){var s=maxSz;g.font=tyFont(P,s);var w=g.measureText(str).width;if(w>maxW)s=s*maxW/w;return s}
function kinetic(v){
  var P=F.params||{},pal=P.palette||{},fg=pal.fg||PAL.bone,ac=pal.accent||PAL.ember,words=String(P.text||'...').split(/\s+/).filter(Boolean),emph=P.emphasize||[],per=P.perBeat||(v==='wave'?0:.6),n=words.length;
  tyBg(P);g.textAlign='center';g.textBaseline='middle';
  var cur=per>0?Math.min(n-1,Math.max(0,Math.floor(F.tb/per))):n-1,age=per>0?(F.tb-cur*per)/per:1;
  if(v==='words'||v==='focus'){
    var w=words[cur],big=v==='focus'?1.0:.9,sz=fitSize(w,P,W*.86,U*1.3*big),pop=easeBack(age*2.2),sc=.6+.4*pop,col=emph.indexOf(cur)>=0?ac:fg;
    if(v==='focus'){
      for(var i=Math.max(0,cur-3);i<cur;i++){var a=(cur-i),f=fitSize(words[i],P,W*.86,U*.5);g.font=tyFont(P,f);g.fillStyle=fg;g.globalAlpha=.22/a;g.fillText(words[i],CX+(i%2?1:-1)*U*.3*a,CY-U*.35*a);}
      g.globalAlpha=1;
    }
    g.save();g.translate(CX,CY);g.scale(sc,sc);g.rotate((1-pop)*(cur%2?.06:-.06));g.font=tyFont(P,sz);g.fillStyle=col;g.fillText(w,0,0);
    var tw=g.measureText(w).width;g.fillStyle=ac;g.fillRect(-tw/2,sz*.58,tw*easeOut(age*2),Math.max(3,sz*.05));g.restore();
    txt((cur+1)+' / '+n,CX,CY+U*1.05,Math.max(10,U*.07),'rgba(243,234,217,.35)','center',MONO);
  }else if(v==='stack'){
    var lines=[],cl='',mw=W*.84,sz2=Math.min(U*.46,W*.13);g.font=tyFont(P,sz2);
    words.forEach(function(w2){var t=cl?cl+' '+w2:w2;if(g.measureText(t).width>mw&&cl){lines.push(cl);cl=w2}else cl=t});if(cl)lines.push(cl);
    var lh=sz2*1.15,y0=CY-(lines.length-1)*lh/2,idx=0;
    lines.forEach(function(l,li){var xs=l.split(' '),tot=g.measureText(l).width,x=CX-tot/2;xs.forEach(function(w3){var ww=g.measureText(w3).width,st=idx*per,a=easeBack((F.tb-st)/.5),vis=clamp((F.tb-st)/.3,0,1);
      if(vis>0){g.globalAlpha=vis;g.fillStyle=emph.indexOf(idx)>=0?ac:fg;g.textAlign='left';g.fillText(w3,x,y0+li*lh+(1-a)*U*.3);g.textAlign='center'}x+=ww+g.measureText(' ').width;idx++});});
    g.globalAlpha=1;
  }else{ /* wave: whole phrase, letters ride a wave */
    var str=words.join(' '),sz3=fitSize(str,P,W*.88,U*.7),total=0,chars=str.split('');g.font=tyFont(P,sz3);g.textAlign='left';var wid=g.measureText(str).width,x2=CX-wid/2;
    chars.forEach(function(ch,k){var cw=g.measureText(ch).width,t=F.T*3-k*.35,y=CY+Math.sin(t)*sz3*.18,hue=(k/chars.length)*.9;g.fillStyle=ch===' '?fg:rgba(hue,1);g.globalAlpha=clamp((F.tb-k*.05)/.4,0,1);g.fillText(ch,x2,y);x2+=cw});g.globalAlpha=1;
  }
}

/* ================= STYLE: WHITEBOARD ("board") ================= */
/* params: {items:[{icon:"bulb",label:"idea"},...], text:"for equation variant", title:"optional heading", palette:{bg,ink,accent}} */
function circPts(cx,cy,r,a0,a1,n){var o=[];for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}return o}
var ICONS={
  bulb:[circPts(0,-.2,.55,2.35,.8+Math.PI*2,26),[[-.28,.45],[.28,.45]],[[-.22,.6],[.22,.6]],[[-.18,.2],[-.1,-.1],[0,.1],[.1,-.1],[.18,.2]]],
  heart:[(function(){var o=[];for(var i=0;i<=40;i++){var t=i/40*Math.PI*2;o.push([.5*Math.pow(Math.sin(t),3)*1.6,-(.5*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16)*1.6+.05])}return o})()],
  house:[[[-.6,.5],[-.6,-.1],[0,-.65],[.6,-.1],[.6,.5],[-.6,.5]],[[-.15,.5],[-.15,.1],[.15,.1],[.15,.5]],[[.25,-.35],[.25,-.6],[.4,-.6],[.4,-.2]]],
  book:[[[-.65,-.45],[-.05,-.35],[-.05,.5],[-.65,.4],[-.65,-.45]],[[.65,-.45],[.05,-.35],[.05,.5],[.65,.4],[.65,-.45]],[[-.5,-.2],[-.2,-.15]],[[.5,-.2],[.2,-.15]]],
  rocket:[[[0,-.75],[.22,-.3],[.22,.3],[-.22,.3],[-.22,-.3],[0,-.75]],circPts(0,-.1,.09,0,Math.PI*2,12),[[-.22,.1],[-.42,.4],[-.22,.3]],[[.22,.1],[.42,.4],[.22,.3]],[[-.1,.3],[0,.6],[.1,.3]]],
  chart:[[[-.6,.55],[.6,.55]],[[-.6,.55],[-.6,-.55]],[[-.45,.3],[-.15,.0],[.05,.15],[.5,-.4]],[[.35,-.4],[.5,-.4],[.5,-.25]]],
  person:[circPts(0,-.4,.2,0,Math.PI*2,20),[[0,-.2],[0,.25]],[[-.35,0],[0,-.1],[.35,0]],[[0,.25],[-.25,.65]],[[0,.25],[.25,.65]]],
  tree:[circPts(0,-.25,.4,0,Math.PI*2,26),[[0,.15],[0,.65]],[[-.25,.65],[.25,.65]]],
  cloud:[(function(){var o=[];o=o.concat(circPts(-.25,.05,.25,Math.PI*.55,Math.PI*1.5,10));o=o.concat(circPts(-.02,-.2,.3,Math.PI*1.1,Math.PI*1.95,10));o=o.concat(circPts(.3,.0,.25,Math.PI*1.5,Math.PI*2.45,10));o.push([.28,.3]);o.push([-.25,.3]);o.push(o[0]);return o})()],
  star:[(function(){var o=[];for(var i=0;i<=10;i++){var r=i%2?.28:.65,a=i*Math.PI/5-Math.PI/2;o.push([Math.cos(a)*r,Math.sin(a)*r+.05])}return o})()],
  gear:[(function(){var o=[];for(var i=0;i<=48;i++){var k=i%6,r=(k<3)?.62:.5,a=i*Math.PI/24;o.push([Math.cos(a)*r,Math.sin(a)*r])}return o})(),circPts(0,0,.2,0,Math.PI*2,16)],
  check:[circPts(0,0,.6,0,Math.PI*2,28),[[-.28,.02],[-.08,.24],[.3,-.2]]]
};
function strokeLen(s){var L=0;for(var i=1;i<s.length;i++)L+=Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1]);return L}
function drawIconPartial(name,x,y,sz,t,ink,ac){
  var st=ICONS[name]||ICONS.star,tot=0,i,j;st.forEach(function(s){tot+=strokeLen(s)});var left=tot*clamp(t,0,1),tip=null;
  g.lineWidth=Math.max(2.5,sz*.045);g.strokeStyle=ink;g.lineCap='round';g.lineJoin='round';
  for(i=0;i<st.length&&left>0;i++){var s=st[i];g.beginPath();g.moveTo(x+s[0][0]*sz,y+s[0][1]*sz);tip=[x+s[0][0]*sz,y+s[0][1]*sz];
    for(j=1;j<s.length;j++){var d=Math.hypot(s[j][0]-s[j-1][0],s[j][1]-s[j-1][1]);if(left>=d){g.lineTo(x+s[j][0]*sz,y+s[j][1]*sz);tip=[x+s[j][0]*sz,y+s[j][1]*sz];left-=d}else{var f=left/d;tip=[x+(s[j-1][0]+(s[j][0]-s[j-1][0])*f)*sz,y+(s[j-1][1]+(s[j][1]-s[j-1][1])*f)*sz];g.lineTo(tip[0],tip[1]);left=0;break}}
    g.stroke();}
  return t>0&&t<1?tip:null;
}
function whiteboard(v){
  var P=F.params||{},pal=P.palette||{},ink=pal.ink||'#1b1b2f',ac=pal.accent||'#e63946',bgc=pal.bg||'#f7f4ea';
  reset();g.fillStyle=bgc;g.fillRect(0,0,W,H);var gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.06)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(0,0,0,.08)';g.fillRect(0,H*.94,W,H*.06);
  var tips=[];
  if(P.title){var tl=clamp(F.tb/2,0,1);g.save();g.beginPath();g.rect(0,0,W*tl,H);g.clip();txt(P.title,CX,CY-U*.78,Math.max(16,U*.19),ink,'center',SERIF,'italic');g.restore();}
  if(v==='equation'){
    var lines=String(P.text||'a + b = c').split('\n'),sz=fitSize(lines.reduce(function(a,b){return a.length>b.length?a:b},''),{font:'serif'},W*.84,U*.5),lh=sz*1.3,y0=CY+(P.title?U*.15:0)-(lines.length-1)*lh/2,per=P.perLine||Math.max(1.2,F.dur/(lines.length+.5));
    lines.forEach(function(l,k){var t=clamp((F.tb-k*per)/per,0,1);if(t<=0)return;g.font=tyFont({font:'serif'},sz);g.textAlign='center';var wdt=g.measureText(l).width;g.save();g.beginPath();g.rect(CX-wdt/2-4,y0+k*lh-sz,wdt*t+8,sz*1.6);g.clip();g.fillStyle=k===lines.length-1?ac:ink;g.textBaseline='middle';g.fillText(l,CX,y0+k*lh);g.restore();if(t<1)tips.push([CX-wdt/2+wdt*t,y0+k*lh+sz*.1]);
      if(t>=1&&k===lines.length-1){var u=clamp((F.tb-(k+1)*per)/.8,0,1);g.strokeStyle=ac;g.lineWidth=Math.max(2,sz*.05);g.beginPath();g.moveTo(CX-wdt/2,y0+k*lh+sz*.55);g.lineTo(CX-wdt/2+wdt*u,y0+k*lh+sz*.55+Math.sin(u*14)*sz*.03);g.stroke()}});
  }else{
    var items=P.items||[{icon:'star',label:''}],n=items.length,dy=P.title?U*.2:0,cols=Math.min(n,W>H?4:2),rows=Math.ceil(n/cols),cw=Math.min(W*.9/cols,U*1.05),ch=cw*1.15,per2=P.perItem||Math.max(.8,F.dur/(n+.5));
    items.forEach(function(it,k){var c=k%cols,r=Math.floor(k/cols),x=CX+(c-(cols-1)/2)*cw,y=CY+dy+(r-(rows-1)/2)*ch-(it.label?ch*.08:0),t=clamp((F.tb-k*per2)/(per2*.8),0,1);if(t<=0)return;
      var tip=drawIconPartial(it.icon,x,y,cw*.34,t,k%2?ac:ink);if(tip)tips.push(tip);
      if(it.label&&t>=1){var lt=clamp((F.tb-(k*per2+per2*.8))/(per2*.2+.1),0,1),fs=Math.max(12,cw*.17);g.font=tyFont({font:'serif'},fs);var lw=g.measureText(it.label).width;g.save();g.beginPath();g.rect(x-lw/2-3,y+cw*.3,lw*lt+6,fs*1.6);g.clip();g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';g.fillText(it.label,x,y+cw*.42);g.restore()}
    });
  }
  tips.forEach(function(t){g.fillStyle=ac;circ(t[0],t[1],Math.max(3,U*.03));g.fill();g.fillStyle='rgba(0,0,0,.15)';g.fillRect(t[0]+U*.02,t[1]-U*.02,U*.28,U*.045)});
}
