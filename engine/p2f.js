
/* ================= SHARED: noise ================= */
function nHash(x,y){var s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function vnoise(x,y){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return cLerp(cLerp(nHash(xi,yi),nHash(xi+1,yi),u),cLerp(nHash(xi,yi+1),nHash(xi+1,yi+1),u),v)}

/* ================= STYLE: PIXEL ART ("pixel") ================= */
/* variants: city (parallax night skyline), hero (a runner on scrolling ground), text (params.text on a CRT). */
var PXC=document.createElement('canvas'),PXG=PXC.getContext('2d');
var P8=['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'];
var SPR=[["..hhhh..",".hhhhhh.",".hssssh.",".sskssk.",".ssssss.","..rrrr..",".rrrrrr.","srrrrrrs","s.rrrr.s","..pppp..",".pp..pp.","pp....pp"],["..hhhh..",".hhhhhh.",".hssssh.",".sskssk.",".ssssss.","..rrrr..",".rrrrrr.","srrrrrrs","s.rrrr.s","..pppp..","..pppp..","..kk.kk."]];
var SPC={h:'#ab5236',s:'#ffccaa',k:'#000000',r:'#ff004d',p:'#1d2b53'};
var PXF={A:[14,17,17,31,17,17,17],B:[30,17,17,30,17,17,30],C:[14,17,16,16,16,17,14],D:[30,17,17,17,17,17,30],E:[31,16,16,30,16,16,31],F:[31,16,16,30,16,16,16],G:[14,17,16,23,17,17,15],H:[17,17,17,31,17,17,17],I:[14,4,4,4,4,4,14],J:[7,2,2,2,2,18,12],K:[17,18,20,24,20,18,17],L:[16,16,16,16,16,16,31],M:[17,27,21,21,17,17,17],N:[17,17,25,21,19,17,17],O:[14,17,17,17,17,17,14],P:[30,17,17,30,16,16,16],Q:[14,17,17,17,21,18,13],R:[30,17,17,30,20,18,17],S:[15,16,16,14,1,1,30],T:[31,4,4,4,4,4,4],U:[17,17,17,17,17,17,14],V:[17,17,17,17,17,10,4],W:[17,17,17,21,21,21,10],X:[17,17,10,4,10,17,17],Y:[17,17,17,10,4,4,4],Z:[31,1,2,4,8,16,31],'0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],'2':[14,17,1,2,4,8,31],'3':[31,2,4,2,1,17,14],'4':[2,6,10,18,31,2,2],'5':[31,16,30,1,1,17,14],'6':[6,8,16,30,17,17,14],'7':[31,1,2,4,8,8,8],'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,2,12],'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4],'.':[0,0,0,0,0,12,12],',':[0,0,0,0,12,4,8],':':[0,12,12,0,12,12,0],'-':[0,0,0,31,0,0,0],'_':[0,0,0,0,0,0,31],'+':[0,4,4,31,4,4,0],'/':[1,2,2,4,8,8,16],' ':[0,0,0,0,0,0,0]};
function pxText(c,str,x,y,sc,col){for(var i=0;i<str.length;i++){var gl=PXF[str[i].toUpperCase()]||PXF['?'];for(var r=0;r<7;r++)for(var b=0;b<5;b++)if(gl[r]&(16>>b)){c.fillStyle=col;c.fillRect(x+(i*6+b)*sc,y+r*sc,sc,sc)}}}
function pixelScene(v){
  var P=F.params||{},pw=clamp(Math.round(W/Math.max(3,U*.034)),90,200),ph=Math.round(pw*H/W);
  if(PXC.width!==pw||PXC.height!==ph){PXC.width=pw;PXC.height=ph}
  var c=PXG,t=F.T,i,j;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
  function R_(x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
  if(v==='city'){
    var bands=['#0b1030','#1d2b53','#3a2a6a','#7e2553','#ab5236','#ffa300'];for(i=0;i<bands.length;i++)R_(0,ph*i/bands.length*.8,pw,ph*.8/bands.length+1,bands[i]);R_(0,ph*.8,pw,ph*.2,'#000');
    for(i=0;i<40;i++){var sx=nHash(i,1)*pw,sy=nHash(i,2)*ph*.5;if(Math.sin(t*3+i*7)>-.4)R_(sx,sy,1,1,i%5?'#c2c3c7':'#fff1e8')}
    R_(pw*.78,ph*.12,ph*.14,ph*.14,'#fff1e8');R_(pw*.78+ph*.03,ph*.12+ph*.04,ph*.03,ph*.03,'#c2c3c7');
    var layers=[['#5f574f',.12,.5],['#2a2a4a',.25,.65],['#0b0b18',.5,.8]];
    layers.forEach(function(L,li){var sp=t*pw*.02*(li+1),bw=Math.round(pw*.09);for(var b=-1;b<pw/bw+2;b++){var idx=b+Math.floor(sp/bw),h=ph*(.18+nHash(idx,li)*L[1]*1.3),x=b*bw-(sp%bw);R_(x,ph*.8-h,bw-1,h,L[0]);
      if(li>0)for(var wy=ph*.8-h+2;wy<ph*.8-2;wy+=3)for(var wx=x+1;wx<x+bw-2;wx+=3)if(nHash(wx*3+idx,wy+Math.floor(t*1.5+li))>.62)R_(wx,wy,1,1,'#ffec27')}});
  }else if(v==='hero'){
    R_(0,0,pw,ph,'#29adff');R_(0,ph*.55,pw,ph*.45,'#008751');R_(0,ph*.55,pw,2,'#00e436');
    for(i=0;i<6;i++){var mx=((i*pw/4-t*pw*.03)%(pw*1.3)+pw*1.3)%(pw*1.3)-pw*.15,mh=ph*(.2+nHash(i,9)*.2);c.fillStyle='#83769c';c.beginPath();c.moveTo(mx-mh,ph*.55);c.lineTo(mx,ph*.55-mh);c.lineTo(mx+mh,ph*.55);c.fill()}
    for(i=0;i<4;i++){var cx=((i*pw/3-t*pw*.06)%(pw*1.2)+pw*1.2)%(pw*1.2)-pw*.1,cy=ph*(.12+nHash(i,4)*.2);R_(cx,cy,pw*.1,3,'#fff1e8');R_(cx+3,cy-2,pw*.05,2,'#fff1e8')}
    for(i=0;i<20;i++){var gx=((i*pw/10-t*pw*.5)%(pw*1.1)+pw*1.1)%(pw*1.1);R_(gx,ph*.55+4+nHash(i,3)*ph*.35,3,1,'#00e436')}
    var fr=Math.floor(t*8)%2,spr=SPR[fr],sc=Math.max(1,Math.round(ph/46)),ox=Math.round(pw*.3),oy=Math.round(ph*.55-spr.length*sc+(fr?0:sc));
    spr.forEach(function(row,ry){for(var rx=0;rx<row.length;rx++){var ch=row[rx];if(ch!=='.')R_(ox+rx*sc,oy+ry*sc,sc,sc,SPC[ch])}});
  }else{ /* text on a CRT */
    R_(0,0,pw,ph,'#0b1030');for(i=0;i<ph;i+=2)R_(0,i,pw,1,'#101845');
    var str=String(P.text||'HELLO'),cut=Math.floor(F.tb*4),lines=str.split('\n'),maxc=Math.max.apply(null,lines.map(function(l){return l.length+1})),sc=Math.max(1,Math.floor(Math.min(pw*.9/(maxc*6),ph*.6/(lines.length*9)))),shown=0;
    lines.forEach(function(l,k){var part=l.slice(0,Math.max(0,cut-shown));shown+=l.length;var cur=(k===lines.length-1||part.length<l.length)&&(Math.floor(t*3)%2)?'_':'';var tx=Math.round(pw/2-(l.length*6*sc)/2),ty=Math.round(ph/2+(k-(lines.length-1)/2)*8*sc-3.5*sc);pxText(c,part+cur,tx,ty,sc,P.color||'#00e436')});
  }
  reset();g.imageSmoothingEnabled=false;g.drawImage(PXC,0,0,W,H);g.imageSmoothingEnabled=true;
  g.fillStyle='rgba(0,0,0,.14)';for(var sy=0;sy<H;sy+=3)g.fillRect(0,sy,W,1);
}

/* ================= STYLE: GLITCH / VHS ("glitch") ================= */
/* params: {background:[style,variant], intensity:0..1, text:"SIGNAL LOST"}; variants: vhs, rgb, corrupt */
var GT=document.createElement('canvas'),GTX=GT.getContext('2d'),GT2=document.createElement('canvas'),GT2X=GT2.getContext('2d');
function glitchScene(v){
  var P=F.params||{},bg=P.background||['synth','sun'],I=P.intensity==null?.7:P.intensity;
  if(DRAW[bg[0]]&&bg[0]!=='glitch')DRAW[bg[0]](bg[1]);else{reset();g.fillStyle='#050510';g.fillRect(0,0,W,H)}
  reset();var cw=cv.width,ch=cv.height,seed=Math.floor(F.T*12),pulse=Math.pow(F.k,1.4),i;
  var gs=QUAL>=1?.5:.7,gw2=Math.max(2,Math.round(cw*gs)),gh2=Math.max(2,Math.round(ch*gs));if(GT.width!==gw2||GT.height!==gh2){GT.width=GT2.width=gw2;GT.height=GT2.height=gh2}
  GTX.setTransform(1,0,0,1,0,0);GTX.globalCompositeOperation='copy';GTX.drawImage(cv,0,0,gw2,gh2);
  g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,cw,ch);
  var off=Math.max(1,U*.02*DPR)*(.3+pulse*2.4)*(.4+I);
  if(QUAL>=2){g.globalCompositeOperation='source-over';g.drawImage(GT,0,0,cw,ch)}else[['#ff0000',-off],['#00ff00',0],['#0000ff',off]].forEach(function(cc){GT2X.globalCompositeOperation='copy';GT2X.drawImage(GT,0,0);GT2X.globalCompositeOperation='multiply';GT2X.fillStyle=cc[0];GT2X.fillRect(0,0,gw2,gh2);g.globalCompositeOperation='lighter';g.drawImage(GT2,cc[1],0,cw,ch)});
  g.globalCompositeOperation='source-over';
  var ns=v==='rgb'?0:Math.round(2+I*7);
  for(i=0;i<ns;i++){var sy=nHash(seed,i)*ch,sh=ch*(.01+nHash(seed,i+9)*.07*I),dx=(nHash(seed,i+3)-.5)*cw*.18*I*(1+pulse);g.drawImage(cv,0,sy,cw,sh,dx,sy,cw,sh)}
  if(v==='corrupt'){for(i=0;i<14*I;i++){var bx=nHash(seed,i+20)*cw,by=nHash(seed,i+30)*ch,bw=cw*(.04+nHash(seed,i+40)*.2),bh=ch*(.01+nHash(seed,i+50)*.05);g.fillStyle=['#ff004d','#00e4ff','#ffec27','#fff'][i%4];g.globalAlpha=.55;g.fillRect(bx,by,bw,bh)}g.globalAlpha=1}
  if(v==='vhs'){var ty=((F.T*.35)%1)*ch;g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,ty,cw,ch*.05);g.drawImage(cv,0,ty,cw,ch*.05,(nHash(seed,3)-.5)*cw*.06,ty,cw,ch*.05)}
  g.fillStyle='rgba(0,0,0,.2)';for(i=0;i<ch;i+=3*DPR)g.fillRect(0,i,cw,DPR);
  g.fillStyle='rgba(255,255,255,.08)';for(i=0;i<260*I;i++)g.fillRect(nHash(seed,i+70)*cw,nHash(seed,i+90)*ch,DPR*2,DPR);
  g.restore();
  if(v==='vhs'){txt('PLAY ▶',W*.06,H*.12,Math.max(11,U*.1),'#fff','left',MONO,'500');var sec=Math.floor(F.T);txt('00:'+('0'+(sec%60)).slice(-2)+':'+('0'+Math.floor((F.T%1)*30)).slice(-2),W*.94,H*.12,Math.max(11,U*.09),'#fff','right',MONO)}
  if(P.text)txt(P.text,CX,CY,Math.max(18,U*.32),'#fff','center',MONO,'500');
}

/* ================= STYLE: INK WASH ("ink") ================= */
/* variants: mountains (misty layered peaks), bamboo (stalks and leaves grow), calligraphy (params.text brushed in). Rice paper, negative space, one red seal. */
function inkPaper(){reset();g.fillStyle='#efe9d8';g.fillRect(0,0,W,H);g.strokeStyle='rgba(120,100,70,.07)';g.lineWidth=1;g.beginPath();for(var i=0;i<140;i++){var x=nHash(i,1)*W,y=nHash(i,2)*H,a=nHash(i,3)*6.28,l=U*.05+nHash(i,4)*U*.08;ln(x,y,x+Math.cos(a)*l,y+Math.sin(a)*l)}g.stroke()}
function inkSeal(x,y,s){g.fillStyle='#b8322a';rr(x,y,s,s,s*.12);g.fill();g.strokeStyle='#efe9d8';g.lineWidth=Math.max(2,s*.09);g.lineCap='square';g.beginPath();g.moveTo(x+s*.25,y+s*.25);g.lineTo(x+s*.75,y+s*.25);g.moveTo(x+s*.5,y+s*.25);g.lineTo(x+s*.5,y+s*.78);g.moveTo(x+s*.25,y+s*.55);g.lineTo(x+s*.75,y+s*.55);g.stroke()}
function inkScene(v){
  var P=F.params||{};inkPaper();var i,t=F.T;
  if(v==='mountains'){
    var moon=easeOut(F.tb/3);g.fillStyle='rgba(180,60,50,'+(.0+.5*moon)+')';circ(W*.74,H*.26,U*.2);g.fill();
    for(var L=0;L<4;L++){var base=H*(.5+L*.11),amp=U*(.75-L*.12),a=.42+L*.2,sc=.0035-L*.0004,drift=t*(.4+L*.25);
      var gr=g.createLinearGradient(0,base-amp,0,base+U*.25);gr.addColorStop(0,'rgba(16,18,22,'+Math.min(.95,a)+')');gr.addColorStop(.7,'rgba(16,18,22,'+a*.3+')');gr.addColorStop(1,'rgba(24,26,30,0)');
      g.fillStyle=gr;g.beginPath();g.moveTo(0,H);for(var x=0;x<=W;x+=6){var n=vnoise(x*sc+L*9+drift*.02,L*3)*1.5+vnoise(x*sc*2.7+L,L)*.4,y=base-n*amp*.8+(L?0:-amp*.2);g.lineTo(x,y)}g.lineTo(W,H);g.closePath();g.fill();
      var mg=g.createLinearGradient(0,base,0,base+U*.2);mg.addColorStop(0,'rgba(239,233,216,0)');mg.addColorStop(.5,'rgba(239,233,216,.75)');mg.addColorStop(1,'rgba(239,233,216,0)');g.fillStyle=mg;g.fillRect(((t*U*.03*(L+1))%W)-W,base-U*.02,W*2,U*.22)}
    g.strokeStyle='rgba(20,22,26,.8)';g.lineWidth=Math.max(2,U*.014);g.beginPath();g.moveTo(W*.3,H*.84);g.quadraticCurveTo(W*.34,H*.87,W*.4,H*.84);g.stroke();g.beginPath();ln(W*.35,H*.84,W*.35,H*.79);g.stroke();
    inkSeal(W*.86,H*.76,U*.16);
  }else if(v==='bamboo'){
    var grow=easeOut(F.tb/5);
    for(var s=0;s<5;s++){var x0=W*(.2+s*.16)+Math.sin(s*2.3)*U*.05,top=H*(.15+(s%3)*.1),hh=(H*.95-top)*grow,w=U*(.075-s%2*.02),dark=.6+s%2*.28;
      g.strokeStyle='rgba(24,32,26,'+dark+')';g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x0,H*.95);g.quadraticCurveTo(x0+Math.sin(t*.8+s)*U*.015,H*.95-hh/2,x0,H*.95-hh);g.stroke();
      for(var j=1;j<7;j++){var jy=H*.95-hh*j/7;g.strokeStyle='rgba(239,233,216,.85)';g.lineWidth=w*.25;g.beginPath();g.moveTo(x0-w*.5,jy);g.lineTo(x0+w*.5,jy);g.stroke()}
      for(var k=0;k<9;k++){var lt=clamp((grow-.4)*2-k*.07,0,1);if(lt<=0)continue;var ly=H*.95-hh*(.35+k*.07),dir=k%2?1:-1,len=U*.55*lt,sw=Math.sin(t*1.5+k+s)*.06;g.fillStyle='rgba(24,40,28,'+(.45+nHash(s,k)*.4)+')';g.save();g.translate(x0,ly);g.rotate(dir*(.9+nHash(s,k)*.5)+sw);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(len*.5,-len*.14,len,0);g.quadraticCurveTo(len*.5,len*.1,0,0);g.fill();g.restore()}}
    inkSeal(W*.84,H*.78,U*.15);
  }else{ /* calligraphy */
    var str=String(P.text||'the only limit'),sz=fitSize(str,{font:'serif'},W*.8,U*1.05),reveal=clamp(F.tb/Math.max(2,F.dur*.75),0,1);
    g.font=tyFont({font:'serif'},sz);g.textAlign='center';g.textBaseline='middle';var wd=g.measureText(str).width;
    g.save();g.beginPath();g.rect(CX-wd/2-10,0,(wd+20)*reveal,H);g.clip();g.fillStyle='rgba(18,20,24,.92)';g.shadowColor='rgba(18,20,24,.45)';g.shadowBlur=U*.025;g.fillText(str,CX,CY);g.shadowBlur=0;g.restore();
    var sx=CX-wd/2+wd*reveal;if(reveal<1){g.fillStyle='rgba(18,20,24,.7)';circ(sx,CY,U*.03);g.fill()}
    g.fillStyle='rgba(18,20,24,.18)';g.beginPath();g.ellipse(CX,CY+sz*.62,wd*.46*reveal,U*.02,0,0,6.2832);g.fill();inkSeal(CX+wd/2*reveal-U*.05,CY+sz*.7,U*.16*Math.min(1,reveal*2));
  }
  var vg=g.createRadialGradient(CX,CY,U*.8,CX,CY,Math.max(W,H)*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(90,70,40,.22)');g.fillStyle=vg;g.fillRect(0,0,W,H);
}

/* ================= STYLE: HALFTONE COMIC ("comic") ================= */
/* variants: panels (3 panels, params.captions[]), burst (params.sfx), speed (radial speed lines, params.sfx). params.palette {a,b,paper}. */
function htDots(x,y,w,h,col,sp,fn){g.fillStyle=col;for(var py=y+sp/2,r=0;py<y+h;py+=sp*.866,r++)for(var px=x+(r%2?sp/2:0)+sp/2;px<x+w;px+=sp){var k=clamp(fn((px-x)/w,(py-y)/h),0,1);if(k>.05){g.beginPath();g.arc(px,py,sp*.55*Math.sqrt(k),0,6.2832);g.fill()}}}
function comicScene(v){
  var P=F.params||{},pal=P.palette||{},A=pal.a||'#ff4f81',B=pal.b||'#2ab7ca',paper=pal.paper||'#f6efdc',sp=Math.max(5,U*.065);
  reset();g.fillStyle=paper;g.fillRect(0,0,W,H);var bw=Math.max(3,U*.03);g.lineJoin='round';
  if(v==='panels'){
    var cap=P.captions||['Once...','then...','boom!'],pw=W*.9/3,gap=W*.012,ph2=H*.6,py=CY-ph2/2,i;
    for(i=0;i<3;i++){var pop=easeBack((F.tb-i*1.1)/.6);if(pop<=0)continue;var x=W*.05+i*(pw+gap/2),cx=x+pw/2;g.save();g.translate(cx,CY);g.scale(pop,pop);g.translate(-cx,-CY);
      g.save();g.beginPath();g.rect(x,py,pw-gap,ph2);g.clip();g.fillStyle=i===1?'#fde8a6':'#fff7e4';g.fillRect(x,py,pw-gap,ph2);
      htDots(x,py,pw-gap,ph2,i===1?B:A,sp,function(u,vv){return i===0?(1-vv)*(.4+u*.6):i===1?vv*(1-Math.abs(u-.5)):Math.hypot(u-.5,vv-.5)*1.5});
      g.fillStyle='#111';if(i===0){g.beginPath();g.arc(x+pw*.5,py+ph2*.45,pw*.22,0,6.2832);g.fillStyle='#ffd23f';g.fill();g.stroke()}
      if(i===1){g.fillStyle='#111';for(var b=0;b<5;b++){var bh=ph2*(.25+nHash(b,3)*.4);g.fillRect(x+b*pw*.19,py+ph2-bh,pw*.17,bh)}}
      if(i===2){g.fillStyle='#ffd23f';g.beginPath();for(var q=0;q<16;q++){var rad=q%2?pw*.14:pw*.3,an=q*Math.PI/8;g.lineTo(x+pw*.5+Math.cos(an)*rad,py+ph2*.5+Math.sin(an)*rad)}g.closePath();g.fill();g.strokeStyle='#111';g.lineWidth=bw;g.stroke()}
      g.restore();g.strokeStyle='#111';g.lineWidth=bw;g.strokeRect(x,py,pw-gap,ph2);
      g.fillStyle='#ffe66d';g.fillRect(x+bw,py+bw,Math.min(pw-gap-bw*2,U*.1*cap[i].length+U*.12),U*.2);g.strokeRect(x+bw,py+bw,Math.min(pw-gap-bw*2,U*.1*cap[i].length+U*.12),U*.2);txt(cap[i],x+bw+U*.06,py+bw+U*.1,Math.max(11,U*.1),'#111','left',SANS,'800');g.restore()}
  }else{
    var cx2=CX,cy2=CY;
    if(v==='speed'){g.strokeStyle='#111';for(var s2=0;s2<70;s2++){var an2=s2/70*6.2832+nHash(s2,1)*.05,r0=U*(.35+nHash(s2,2)*.3),r1=U*(2+nHash(s2,3)),jit=Math.sin(F.T*30+s2)*.01;g.lineWidth=Math.max(1,U*(.004+nHash(s2,4)*.012));g.beginPath();g.moveTo(cx2+Math.cos(an2+jit)*r0,cy2+Math.sin(an2+jit)*r0);g.lineTo(cx2+Math.cos(an2)*r1,cy2+Math.sin(an2)*r1);g.stroke()}htDots(0,0,W,H,B,sp,function(u,vv){return Math.hypot(u-.5,vv-.5)*1.2-.15})}
    else{htDots(0,0,W,H,A,sp,function(u,vv){return 1.1-Math.hypot((u-.5)*W/H,vv-.5)*1.4});g.fillStyle='#ffd23f';g.strokeStyle='#111';g.lineWidth=bw*1.2;var sc=easeBack(F.tb/.6)*(1+.06*F.k);g.beginPath();for(var q2=0;q2<28;q2++){var rd=(q2%2?U*.55:U*1.0)*sc*(1+.04*Math.sin(F.T*20+q2)),a3=q2*Math.PI/14;g.lineTo(cx2+Math.cos(a3)*rd,cy2+Math.sin(a3)*rd*.8)}g.closePath();g.fill();g.stroke()}
    var sfx=P.sfx||'BOOM!',sz=fitSize(sfx,{font:'sans'},W*.8,U*.75)*(.85+.15*easeBack(F.tb/.5));g.save();g.translate(cx2,cy2);g.rotate(-.08);g.font=tyFont({font:'sans'},sz);g.textAlign='center';g.textBaseline='middle';g.lineWidth=sz*.14;g.strokeStyle='#111';g.fillStyle=v==='speed'?'#ffe66d':A;g.strokeText(sfx,3,5);g.strokeText(sfx,0,0);g.fillText(sfx,0,0);g.restore();
  }
}

/* ================= STYLE: GENERATIVE PATTERNS ("gen") ================= */
/* variants: flow (flow-field streamlines), voronoi (moving cells), mandala (radial symmetry), blobs (metaballs). params.palette {bg,a,b,c}. */
var GC=document.createElement('canvas'),GCG=GC.getContext('2d');
function genScene(v){
  var P=F.params||{},pal=P.palette||{},bg=pal.bg||'#070a1a',ca=pal.a||PAL.ember,cb=pal.b||PAL.ice,cc=pal.c||'#ff4f81',t=F.T,i,j;
  reset();g.fillStyle=bg;g.fillRect(0,0,W,H);
  if(v==='flow'){
    g.globalCompositeOperation='lighter';g.lineWidth=Math.max(1.2,U*.008);var N=Math.round(clamp(W*H/1100,260,700)),steps=26,cols=[ca,cb,cc];
    for(i=0;i<N;i++){var x=nHash(i,5)*W,y=nHash(i,7)*H;g.strokeStyle=cols[i%3];g.globalAlpha=.3+.3*nHash(i,2);g.beginPath();g.moveTo(x,y);
      for(j=0;j<steps;j++){var an=vnoise(x*.0026+t*.06,y*.0026+t*.03)*12.566;x+=Math.cos(an)*U*.045;y+=Math.sin(an)*U*.045;g.lineTo(x,y)}g.stroke()}
    g.globalAlpha=1;
  }else if(v==='voronoi'){
    var gw=clamp(Math.round(W/Math.max(4,U*.045)),60,150),gh=Math.round(gw*H/W);if(GC.width!==gw||GC.height!==gh){GC.width=gw;GC.height=gh}
    var np=22,px=[],py=[];for(i=0;i<np;i++){px.push((.5+.5*Math.sin(t*(.25+nHash(i,1)*.4)+i*3))*gw);py.push((.5+.5*Math.cos(t*(.2+nHash(i,2)*.4)+i*5))*gh)}
    var img=GCG.createImageData(gw,gh),d=img.data,rc=[hexRgb(ca),hexRgb(cb),hexRgb(cc),hexRgb(bg)];
    for(var y2=0;y2<gh;y2++)for(var x2=0;x2<gw;x2++){var best=1e9,second=1e9,bi=0;for(i=0;i<np;i++){var dd=(x2-px[i])*(x2-px[i])+(y2-py[i])*(y2-py[i]);if(dd<best){second=best;best=dd;bi=i}else if(dd<second)second=dd}
      var edge=Math.sqrt(second)-Math.sqrt(best),k=edge<1.3?1:0,col=rc[bi%3],sh=1-Math.min(1,Math.sqrt(best)/(gw*.2)),o=(y2*gw+x2)*4;d[o]=k?255:col[0]*(.35+.65*sh);d[o+1]=k?255:col[1]*(.35+.65*sh);d[o+2]=k?255:col[2]*(.35+.65*sh);d[o+3]=255}
    GCG.putImageData(img,0,0);g.imageSmoothingEnabled=true;g.drawImage(GC,0,0,W,H);
  }else if(v==='mandala'){
    g.globalCompositeOperation='lighter';g.lineWidth=Math.max(1.2,U*.008);var n=12;
    for(var ring=0;ring<7;ring++){var r=U*(.22+ring*.2),pet=n*(1+(ring%3)),rot=t*(.12+ring*.03)*(ring%2?-1:1),col=[ca,cb,cc][ring%3];g.strokeStyle=col;g.globalAlpha=.55;
      for(i=0;i<pet;i++){var a0=rot+i/pet*6.2832;g.save();g.translate(CX,CY);g.rotate(a0);g.beginPath();g.moveTo(r,0);g.quadraticCurveTo(r+U*.11,U*.07*(1+Math.sin(t+ring)*.2),r+U*.22,0);g.quadraticCurveTo(r+U*.11,-U*.07*(1+Math.sin(t+ring)*.2),r,0);g.stroke();g.restore()}}
    g.globalAlpha=.9;g.fillStyle=ca;circ(CX,CY,U*.05*(1+.15*F.k));g.fill();g.globalAlpha=1;
  }else{ /* blobs */
    var bw=clamp(Math.round(W/Math.max(4,U*.05)),70,170),bh=Math.round(bw*H/W);if(GC.width!==bw||GC.height!==bh){GC.width=bw;GC.height=bh}
    var nb=11,bx=[],by=[],br=[];for(i=0;i<nb;i++){bx.push((.5+.4*Math.sin(t*(.4+nHash(i,1)*.5)+i*2.3))*bw);by.push((.5+.36*Math.cos(t*(.35+nHash(i,2)*.5)+i*3.7))*bh);br.push(bh*(.05+nHash(i,3)*.05)*(1+.14*F.k))}
    var im=GCG.createImageData(bw,bh),dd2=im.data,A3=hexRgb(ca),B3=hexRgb(cb),C3=hexRgb(cc),BG=hexRgb(bg);
    for(var y3=0;y3<bh;y3++)for(var x3=0;x3<bw;x3++){var f=0;for(i=0;i<nb;i++){var dx=x3-bx[i],dy=y3-by[i];f+=br[i]*br[i]/(dx*dx+dy*dy+1)}var o2=(y3*bw+x3)*4,m=clamp((f-.95)*3,0,1),mix=clamp(f/3,0,1),r2=A3[0]+(B3[0]-A3[0])*mix,g2=A3[1]+(B3[1]-A3[1])*mix,b2=A3[2]+(B3[2]-A3[2])*mix;
      if(f>1.05&&f<1.2){r2=C3[0];g2=C3[1];b2=C3[2]}dd2[o2]=BG[0]+(r2-BG[0])*m;dd2[o2+1]=BG[1]+(g2-BG[1])*m;dd2[o2+2]=BG[2]+(b2-BG[2])*m;dd2[o2+3]=255}
    GCG.putImageData(im,0,0);g.imageSmoothingEnabled=true;g.drawImage(GC,0,0,W,H);
  }
  reset();
}
function hexRgb(h){var m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h||'#000000');return m?[parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)]:[0,0,0]}
