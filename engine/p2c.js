
/* ================= CHARACTERS (data-driven rig) + STAGE SHOT ================= */
/* A character is plain data (spec.characters). Skin controls how it is drawn; type controls the body plan. */
var CHARS=CHARS_DATA;                       /* injected by the build: object id -> character */
function cLerp(a,b,t){return a+(b-a)*t}
function skinFill(ch,col,partDark){
  var s=ch.skin||'outline';
  if(s==='silhouette'){g.fillStyle=(ch.palette&&ch.palette.silhouette)||'#0a0a12';g.strokeStyle=g.fillStyle;g.lineWidth=1;return}
  if(s==='glow'){g.fillStyle='rgba(0,0,0,0)';g.strokeStyle=col;g.lineWidth=Math.max(1.5,U*.012);return}
  g.fillStyle=col;
  if(s==='outline'||s==='sketch'){g.strokeStyle='#1b1b2f';g.lineWidth=Math.max(2,U*.018)}
  else if(s==='paper'){g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1}
  else{g.strokeStyle='rgba(0,0,0,0)';g.lineWidth=0}
}
function skinDone(ch,noStroke){
  var s=ch.skin||'outline';
  if(s==='glow'){g.stroke();return}
  if(s==='paper'&&!noStroke){g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=0;g.shadowOffsetX=U*.012;g.shadowOffsetY=U*.016;g.fill();g.restore()}
  g.fill();if(s!=='flat'&&s!=='silhouette'&&!noStroke)g.stroke();
}
function jit(ch,v){return (ch.skin==='sketch')?v+Math.sin(F.T*14+v*7)*U*.004:v}
function capsule(ch,x1,y1,x2,y2,w,col){
  var dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx);
  skinFill(ch,col);g.beginPath();g.moveTo(x1,y1);
  g.save();g.translate(x1,y1);g.rotate(a);rr(-w/2,-w/2,L+w,w,w/2);g.restore();skinDone(ch);
}
var EMO={happy:{m:1,b:.0},sad:{m:-1,b:.35},surprised:{m:0,b:-.4,o:1},thinking:{m:.2,b:-.15},angry:{m:-.6,b:.5},neutral:{m:.1,b:0}};
function poseFor(action,t,p){
  /* angles in radians. arms: 0 = hanging down, + = forward/up. legs: swing. */
  var P={bob:0,lean:0,aU:[.08,.08],aL:[.1,.1],lU:[0,0],lL:[0,0],head:0,jump:0};
  var br=Math.sin(t*2.2)*.012;P.bob=br;
  if(action==='walk'){var w=Math.sin(t*7);P.bob=Math.abs(Math.cos(t*7))*.025;P.lU=[w*.6,-w*.6];P.lL=[Math.max(0,-w)*.5,Math.max(0,w)*.5];P.aU=[-w*.5,w*.5];P.aL=[.25,.25];P.lean=.04}
  else if(action==='wave'){P.aU[1]=2.5;P.aL[1]=.5+Math.sin(t*9)*.55;P.head=.06}
  else if(action==='point'){P.aU[1]=1.45;P.aL[1]=.05;P.lean=.04}
  else if(action==='think'){P.aU[1]=2.2;P.aL[1]=2.0;P.head=-.1}
  else if(action==='celebrate'){var j=Math.abs(Math.sin(t*5));P.jump=j*.08;P.aU=[2.7+Math.sin(t*10)*.15,2.7-Math.sin(t*10)*.15];P.aL=[.2,.2];P.lU=[j*.3,-j*.3];P.lL=[j*.4,j*.4]}
  else if(action==='talk'){P.aU[1]=.5+Math.sin(t*3.3)*.3;P.aL[1]=.7+Math.sin(t*4)*.3}
  return P;
}
function drawCharacter(ch,x,y,sc,opt){
  var T=F.T,action=opt.action||'idle',emo=EMO[opt.emotion||'happy']||EMO.happy,talk=opt.talk,flip=opt.flip?-1:1,pal=ch.palette||{},b=ch.build||{},type=ch.type||'human';
  var P=poseFor(action,T+(opt.phase||0),F.p),h=U*1.25*sc*(b.height||1),hs=b.head||1,bw=b.body||1;
  var legL=h*.36,torL=h*.3,headR=h*.15*hs,armU=h*.15,armL=h*.15,lw=h*.075*(b.limb||1);
  if(type==='stick'){legL=h*.4;torL=h*.34;headR=h*.1*hs;lw=Math.max(2.5,h*.03)}
  if(type==='blob'){legL=h*.1;torL=h*.5;headR=0}
  var skin=pal.skin||'#f2c9a0',top=pal.top||'#4361ee',bot=pal.bottom||'#2b2d42',shoe=pal.shoes||'#1b1b2f',hair=pal.hair||'#3a2a2a',acc=pal.accent||'#ffd166';
  if(type==='robot'){skin=pal.skin||'#e8eefc';top=pal.top||'#4361ee'}
  if(type==='animal'){skin=pal.skin||'#e9b872'}
  var hipY=-legL-P.jump*h,hip=[0,hipY],sh=[Math.sin(P.lean)*torL*.3,hipY-torL],neck=[sh[0],sh[1]-headR*.1],hc=[neck[0]+Math.sin(P.head)*headR*.2,neck[1]-headR-P.bob*h];
  hip[1]+=P.bob*h;sh[1]+=P.bob*h;
  g.save();g.translate(x,y);g.scale(flip,1);
  /* ground shadow */
  if(ch.skin!=='glow'){g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(0,2,h*.2*(1-P.jump*3),h*.03,0,0,6.2832);g.fill()}
  var sk=ch.skin==='silhouette'?null:1;
  function limb(joint,uA,lA,len1,len2,col,swing){var a1=uA*(swing||1),ex=joint[0]+Math.sin(a1)*len1,ey=joint[1]+Math.cos(a1)*len1,a2=a1+lA,fx=ex+Math.sin(a2)*len2,fy=ey+Math.cos(a2)*len2;capsule(ch,joint[0],joint[1],ex,ey,lw,col);capsule(ch,ex,ey,fx,fy,lw*.92,col);return [fx,fy]}
  /* back arm + back leg */
  var hipB=[hip[0]-h*.03,hip[1]],hipF=[hip[0]+h*.03,hip[1]];
  if(type!=='blob'){
    var fb=limb(hipB,P.lU[0],P.lL[0],legL*.52,legL*.5,bot,1);capsule(ch,fb[0],fb[1],fb[0]+h*.07,fb[1],lw*.9,shoe);
    var shB=[sh[0]-h*.07*bw,sh[1]+h*.02],hb=limb(shB,P.aU[0]*-1,P.aL[0]*-1,armU,armL,skin,1);
  }
  /* torso */
  if(type==='blob'){skinFill(ch,top);g.beginPath();g.ellipse(0,-torL*.5+P.bob*h,h*.2*bw,torL*.5,0,0,6.2832);skinDone(ch)}
  else if(type==='robot'){skinFill(ch,top);rr(-h*.11*bw,sh[1],h*.22*bw,torL+h*.02,h*.04);skinDone(ch);skinFill(ch,acc);circ(0,sh[1]+torL*.45,h*.03);skinDone(ch)}
  else if(type==='stick'){capsule(ch,hip[0],hip[1],sh[0],sh[1],lw,top)}
  else{skinFill(ch,top);g.beginPath();g.moveTo(sh[0]-h*.1*bw,sh[1]);g.lineTo(sh[0]+h*.1*bw,sh[1]);g.lineTo(hip[0]+h*.085*bw,hip[1]+h*.01);g.lineTo(hip[0]-h*.085*bw,hip[1]+h*.01);g.closePath();skinDone(ch);
    skinFill(ch,bot);rr(hip[0]-h*.09*bw,hip[1]-h*.02,h*.18*bw,h*.05,h*.02);skinDone(ch)}
  if(type!=='blob'){
    var ff=limb(hipF,P.lU[1],P.lL[1],legL*.52,legL*.5,bot,1);capsule(ch,ff[0],ff[1],ff[0]+h*.07,ff[1],lw*.9,shoe);
  }
  /* head */
  var hx=hc[0],hy=type==='blob'?-torL+h*.0:hc[1];
  if(type==='blob'){hx=0;hy=-torL*.6;headR=h*.18*hs}
  /* neck */
  if(type==='human'||type==='animal'){capsule(ch,neck[0],neck[1]+headR*.2,hx,hy+headR*.6,lw*.8,skin)}
  /* animal ears + tail behind head */
  if(type==='animal'){var ek=ch.ears||'cat';skinFill(ch,skin);for(var e=-1;e<=1;e+=2){g.beginPath();if(ek==='bear'){g.arc(hx+e*headR*.75,hy-headR*.7,headR*.32,0,6.2832)}else if(ek==='rabbit'){g.ellipse(hx+e*headR*.45,hy-headR*1.5,headR*.22,headR*.75,e*.15,0,6.2832)}else{g.moveTo(hx+e*headR*.9,hy-headR*.3);g.lineTo(hx+e*headR*.7,hy-headR*1.35);g.lineTo(hx+e*headR*.15,hy-headR*.9);g.closePath()}skinDone(ch)}}
  /* head shape */
  if(type==='robot'){skinFill(ch,skin);rr(hx-headR*1.05,hy-headR*.9,headR*2.1,headR*1.8,headR*.35);skinDone(ch);capsule(ch,hx,hy-headR*.9,hx,hy-headR*1.4,lw*.35,acc);skinFill(ch,pal.accent||'#ff6b57');circ(hx,hy-headR*1.45,headR*.14);skinDone(ch)}
  else if(type==='stick'){skinFill(ch,skin);circ(hx,hy,headR);skinDone(ch)}
  else{skinFill(ch,skin);g.beginPath();g.ellipse(hx,hy,headR*(type==='blob'?1.1:1),headR*(type==='blob'?1.0:1.08),0,0,6.2832);skinDone(ch)}
  /* hair */
  var hr=ch.hair;if(hr&&hr!=='none'&&type==='human'){skinFill(ch,hair);g.beginPath();
    if(hr==='bob'){g.ellipse(hx,hy-headR*.1,headR*1.12,headR*1.15,0,Math.PI*.95,Math.PI*2.05);g.lineTo(hx+headR*1.1,hy+headR*.55);g.lineTo(hx+headR*.7,hy+headR*.55);g.lineTo(hx+headR*.7,hy-headR*.1);g.lineTo(hx-headR*.7,hy-headR*.1);g.lineTo(hx-headR*.7,hy+headR*.55);g.lineTo(hx-headR*1.1,hy+headR*.55);g.closePath()}
    else if(hr==='spiky'){g.moveTo(hx-headR*1.05,hy-headR*.1);for(var s=0;s<6;s++){g.lineTo(hx-headR*1.05+s*headR*.42+headR*.2,hy-headR*(1.6+(s%2)*.35));g.lineTo(hx-headR*1.05+(s+1)*headR*.42,hy-headR*.75)}g.lineTo(hx+headR*1.05,hy-headR*.1);g.closePath()}
    else if(hr==='long'){g.ellipse(hx,hy-headR*.1,headR*1.15,headR*1.2,0,Math.PI,Math.PI*2);g.lineTo(hx+headR*1.1,hy+headR*1.6);g.lineTo(hx+headR*.65,hy+headR*1.6);g.lineTo(hx+headR*.65,hy-headR*.2);g.lineTo(hx-headR*.65,hy-headR*.2);g.lineTo(hx-headR*.65,hy+headR*1.6);g.lineTo(hx-headR*1.1,hy+headR*1.6);g.closePath()}
    else if(hr==='bun'){g.ellipse(hx,hy-headR*.15,headR*1.08,headR*1.0,0,Math.PI,Math.PI*2);g.closePath();skinDone(ch);skinFill(ch,hair);g.beginPath();g.arc(hx,hy-headR*1.2,headR*.4,0,6.2832)}
    else{g.ellipse(hx,hy-headR*.2,headR*1.08,headR*.95,0,Math.PI,Math.PI*2);g.closePath()}
    skinDone(ch)}
  /* face */
  if(ch.skin!=='silhouette'&&type!=='blob'||(type==='blob'&&ch.skin!=='silhouette')){
    var fc=ch.skin==='glow'?(pal.accent||'#86e6ff'):'#1b1b2f',f=ch.face||{},ey=f.eyes||'round',es=headR*.2,exo=headR*.42,eyY=hy-headR*.05,look=opt.look||0,blink=(F.T%3.4)<.12?.12:1;
    if(emo.o)es*=1.25;
    for(var q=-1;q<=1;q+=2){var ex=hx+q*exo+look*headR*.1;
      if(ey==='dot'){g.fillStyle=fc;g.beginPath();g.ellipse(ex,eyY,es*.55,es*.55*blink,0,0,6.2832);g.fill()}
      else if(ey==='sleepy'){g.strokeStyle=fc;g.lineWidth=Math.max(2,headR*.1);g.beginPath();g.arc(ex,eyY,es*.8,.15,Math.PI-.15);g.stroke()}
      else if(ey==='anime'){g.fillStyle='#fff';g.strokeStyle=fc;g.lineWidth=Math.max(1.5,headR*.06);g.beginPath();g.ellipse(ex,eyY,es*1.0,es*1.35*blink,0,0,6.2832);g.fill();g.stroke();g.fillStyle=pal.eyes||'#3a86ff';g.beginPath();g.ellipse(ex+look*es*.2,eyY+es*.1,es*.7,es*1.0*blink,0,0,6.2832);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(ex-es*.2,eyY-es*.3,es*.22,0,6.2832);g.fill()}
      else{g.fillStyle=ch.skin==='glow'?'rgba(0,0,0,0)':'#fff';g.strokeStyle=fc;g.lineWidth=Math.max(1.5,headR*.07);g.beginPath();g.ellipse(ex,eyY,es,es*1.1*blink,0,0,6.2832);g.fill();g.stroke();g.fillStyle=fc;g.beginPath();g.arc(ex+look*es*.35,eyY+es*.05,es*.5,0,6.2832);g.fill()}
      if(f.brows!==false){g.strokeStyle=fc;g.lineWidth=Math.max(2,headR*.08);g.beginPath();var by=eyY-es*1.7,tilt=emo.b*headR*.25*q;g.moveTo(ex-es*.9,by+tilt);g.lineTo(ex+es*.9,by-tilt);g.stroke()}
      if(f.blush&&ch.skin!=='glow'){g.fillStyle='rgba(255,107,87,.28)';g.beginPath();g.ellipse(ex+q*es*.2,eyY+es*2.1,es*.9,es*.55,0,0,6.2832);g.fill()}
    }
    var mY=hy+headR*.5,open=talk?(.15+.85*Math.abs(Math.sin(F.T*12+Math.sin(F.T*5))))*headR*.34:(emo.o?headR*.25:0);
    g.strokeStyle=fc;g.fillStyle='#4a1d1d';g.lineWidth=Math.max(2,headR*.08);g.beginPath();
    if(open>headR*.02){g.ellipse(hx,mY,headR*.28,open,0,0,6.2832);g.fill();g.stroke()}
    else{var cv0=emo.m*headR*.22;g.moveTo(hx-headR*.3,mY);g.quadraticCurveTo(hx,mY+cv0*2,hx+headR*.3,mY);g.stroke()}
    var acs=ch.accessories||[];
    if(acs.indexOf('glasses')>=0){g.strokeStyle=ch.skin==='glow'?fc:'#1b1b2f';g.lineWidth=Math.max(2,headR*.07);g.beginPath();g.ellipse(hx-exo,eyY,es*1.5,es*1.5,0,0,6.2832);g.stroke();g.beginPath();g.ellipse(hx+exo,eyY,es*1.5,es*1.5,0,0,6.2832);g.stroke();g.beginPath();ln(hx-exo+es*1.5,eyY,hx+exo-es*1.5,eyY);g.stroke()}
  }
  var acs2=ch.accessories||[];
  if(acs2.indexOf('hat')>=0){skinFill(ch,acc);rr(hx-headR*1.2,hy-headR*1.05,headR*2.4,headR*.2,headR*.08);skinDone(ch);rr(hx-headR*.75,hy-headR*1.75,headR*1.5,headR*.8,headR*.2);skinDone(ch)}
  if(acs2.indexOf('scarf')>=0){skinFill(ch,acc);rr(sh[0]-h*.11,sh[1]-h*.02,h*.22,h*.05,h*.025);skinDone(ch);rr(sh[0]+h*.05,sh[1],h*.05,h*.16,h*.02);skinDone(ch)}
  /* front arm */
  if(type!=='blob'){var shF=[sh[0]+h*.07*bw,sh[1]+h*.02];limb(shF,P.aU[1],P.aL[1],armU,armL,type==='robot'?skin:skin,1)}
  else{capsule(ch,h*.18*bw,-torL*.5,h*.3*bw,-torL*.3+Math.sin(F.T*3)*h*.03,lw,top)}
  g.restore();
}
var PROPS={
  bubble:function(p,x,y){var w=U*(.3+.045*String(p.text||'').length*.9),hh=U*.26;g.fillStyle='#fff';g.strokeStyle='#1b1b2f';g.lineWidth=Math.max(2,U*.016);rr(x-w/2,y-hh/2,w,hh,U*.1);g.fill();g.stroke();g.beginPath();g.moveTo(x-U*.06,y+hh/2-1);g.lineTo(x-U*.02,y+hh/2+U*.1);g.lineTo(x+U*.06,y+hh/2-1);g.fill();txt(String(p.text||''),x,y,Math.max(11,U*.1),'#1b1b2f','center',SANS,'800')},
  bulb:function(p,x,y){var on=p.on!==false;g.fillStyle=on?'#ffe066':'#8d99ae';g.strokeStyle='#1b1b2f';g.lineWidth=Math.max(2,U*.016);circ(x,y,U*.14);g.fill();g.stroke();g.fillStyle='#6c757d';rr(x-U*.06,y+U*.12,U*.12,U*.08,U*.02);g.fill();g.stroke();if(on){g.globalCompositeOperation='lighter';g.globalAlpha=.6;g.drawImage(glowWarm,x-U*.5,y-U*.5,U,U);reset()}},
  qmark:function(p,x,y){txt('?',x,y,U*.5*(1+.06*Math.sin(F.T*4)),p.color||PAL.ember,'center',SERIF,'italic')},
  heart:function(p,x,y){var s=U*.16*(1+.1*F.k);g.fillStyle='#ef233c';g.strokeStyle='#1b1b2f';g.lineWidth=Math.max(2,U*.014);g.beginPath();g.moveTo(x,y+s);g.bezierCurveTo(x-s*1.5,y-s*.1,x-s*.9,y-s*1.1,x,y-s*.45);g.bezierCurveTo(x+s*.9,y-s*1.1,x+s*1.5,y-s*.1,x,y+s);g.fill();g.stroke()},
  star:function(p,x,y){var s=U*.1*(1+.2*Math.sin(F.T*5));g.fillStyle=PAL.yel;g.beginPath();for(var i=0;i<10;i++){var r=i%2?s*.45:s,a=i*Math.PI/5-Math.PI/2;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.closePath();g.fill()},
  arrow:function(p,x,y){g.strokeStyle=p.color||PAL.ember;g.fillStyle=g.strokeStyle;g.lineWidth=Math.max(3,U*.03);g.beginPath();ln(x-U*.2,y,x+U*.15,y);g.stroke();g.beginPath();g.moveTo(x+U*.22,y);g.lineTo(x+U*.1,y-U*.08);g.lineTo(x+U*.1,y+U*.08);g.closePath();g.fill()}
};
function talkingAt(beat){
  for(var i=0;i<VO_AT.length;i++){var s=(VO_AT[i][0]-1)*4+VO_AT[i][1],d=((VOB[i]&&VOB[i].duration)||VO_DUR[i]||2)/SPB;if(beat>=s&&beat<s+d)return i}
  return -1;
}
function stage(){
  var P=F.params||{},bgs=P.background;
  if(bgs&&DRAW[bgs[0]]){DRAW[bgs[0]](bgs[1])}else{reset();bgGrad(P.bg1||'#1c2340',P.bg2||'#0a0e22')}
  reset();var cast=P.cast||[],i;var talk=talkingAt(F.beat)>=0;
  var ground=CY+U*(P.ground==null?.62:P.ground);
  if(P.floor!==false){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,ground,W,H-ground)}
  for(i=0;i<cast.length;i++){var c=cast[i],ch=CHARS[c.char];if(!ch)continue;
    var x=CX+(c.x||0)*U,x2=c.walkTo==null?x:CX+c.walkTo*U,tt=c.walkTo==null?0:easeIO(F.p),px=cLerp(x,x2,tt),act=c.action||(c.walkTo!=null?'walk':'idle');
    if(c.walkTo!=null&&F.p>=.98)act='idle';
    drawCharacter(ch,px,ground+(c.y||0)*U,c.scale||1,{action:act,emotion:c.emotion,talk:(c.say?talk:false),flip:c.flip||(c.walkTo!=null&&c.walkTo<(c.x||0)),phase:i*.7,look:c.look||0});
  }
  (P.props||[]).forEach(function(pr){var f=PROPS[pr.type];if(f)f(pr,CX+(pr.x||0)*U,CY+(pr.y||0)*U)});
}
