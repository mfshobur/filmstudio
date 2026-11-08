
/* ================= STYLE 5: 3D EXPLAINER ================= */
function sphere3(x,y,r,col){
  var gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(.35,col);gr.addColorStop(1,'rgba(10,14,40,.95)');
  g.fillStyle=gr;circ(x,y,r);g.fill();
}
function label(txt0,x,y,anchorX,anchorY,pop){
  if(pop<=0)return;var fs=Math.max(10,U*.085),w=(txt0.length*fs*.62+fs*1.4)*Math.min(1,pop),h=fs*1.9;
  g.strokeStyle='rgba(243,234,217,.7)';g.lineWidth=1.3;g.beginPath();ln(anchorX,anchorY,x,y);g.stroke();
  g.fillStyle='#f3ead9';rr(x-w/2,y-h/2,w,h,h/2);g.fill();if(pop>.8)txt(txt0,x,y+1,fs,'#0b1a3a','center',SANS,'800');
  g.fillStyle=PAL.ember;circ(anchorX,anchorY,U*.02);g.fill();
}
function explainer(v){
  reset();bgGrad('#0e1738','#070a1e');
  if(v==='neural'){
    var L=[3,5,5,3],yaw=.55+Math.sin(F.T*.5)*.25,pit=-.18,sc=U*1.0,nodes=[],i,j,k,L0=[];
    for(i=0;i<4;i++){L0[i]=[];for(j=0;j<L[i];j++){var y=(j-(L[i]-1)/2)*.34,z=((j*7+i*3)%5-2)*.1;p3((i-1.5)*.62,y,z,yaw,pit,sc);L0[i].push([X3,Y3,Z3])}}
    g.lineWidth=1;g.strokeStyle='rgba(134,230,255,.22)';g.beginPath();
    for(i=0;i<3;i++)for(j=0;j<L0[i].length;j++)for(k=0;k<L0[i+1].length;k++)ln(L0[i][j][0],L0[i][j][1],L0[i+1][k][0],L0[i+1][k][1]);g.stroke();
    g.globalCompositeOperation='lighter';var c=0;
    for(i=0;i<3;i++)for(j=0;j<L0[i].length;j++)for(k=0;k<L0[i+1].length;k++){c++;if(c%3)continue;var f=((F.T*.9+c*.137)%1),a=L0[i][j],b=L0[i+1][k];spr(1,a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,U*.04,.85)}
    reset();
    for(i=0;i<4;i++)for(j=0;j<L0[i].length;j++){var nd=L0[i][j];sphere3(nd[0],nd[1],U*.075*(1+.15*F.k*(i===(Math.floor(F.tb)%4)?1:0)),i===0?'#6ea8ff':i===3?'#ffae5c':'#a98bff')}
    var top=CY-U*.8;label('INPUT',L0[0][0][0],top,L0[0][0][0],L0[0][0][1],easeBack((F.tb-1)/.5));label('HIDDEN',(L0[1][0][0]+L0[2][0][0])/2,top-U*.02,(L0[1][0][0]+L0[2][0][0])/2,L0[1][0][1],easeBack((F.tb-3)/.5));label('OUTPUT',L0[3][0][0],top,L0[3][0][0],L0[3][0][1],easeBack((F.tb-5)/.5));
  }else{
    var yaw2=.6+F.T*.5,pit2=-.45,sc2=U*.9,ex=Math.sin(clamp(F.tb/F.dur,0,1)*Math.PI),list=[],a,b,d;
    for(a=0;a<3;a++)for(b=0;b<3;b++)for(d=0;d<3;d++){var x=(a-1)*.3*(1+ex*1.3),y=(b-1)*.3*(1+ex*1.3),z=(d-1)*.3*(1+ex*1.3);p3(x,y,z,yaw2,pit2,sc2);list.push([Z3,x,y,z,a+b+d])}
    list.sort(function(p,q){return p[0]-q[0]});
    for(var i2=0;i2<list.length;i2++){var Lq=list[i2];box3(Lq[1],Lq[2]+.12,Lq[3],.24,.24,.24,ramp(Lq[4]/6),yaw2,pit2,sc2)}
    label('PARAMETERS',CX,CY-U*.78,CX,CY-U*.35,easeBack((F.tb-1)/.5));
  }
}

/* ================= STYLE 6: ISOMETRIC ================= */
function isoBlock(x,y,z,w,d,h,col,s){
  var ox=CX+(x-y)*.866*s,oy=CY+(x+y)*.5*s-z*s+U*.25,wx=w*.866*s,wy=w*.5*s,dx=d*.866*s,dy=d*.5*s,hh=h*s;
  g.fillStyle=shadeCol(col,1.15);g.beginPath();g.moveTo(ox,oy-hh);g.lineTo(ox+wx,oy-hh+wy);g.lineTo(ox+wx-dx,oy-hh+wy+dy);g.lineTo(ox-dx,oy-hh+dy);g.closePath();g.fill();
  g.fillStyle=shadeCol(col,.8);g.beginPath();g.moveTo(ox-dx,oy-hh+dy);g.lineTo(ox+wx-dx,oy-hh+wy+dy);g.lineTo(ox+wx-dx,oy+wy+dy);g.lineTo(ox-dx,oy+dy);g.closePath();g.fill();
  g.fillStyle=shadeCol(col,.55);g.beginPath();g.moveTo(ox+wx-dx,oy-hh+wy+dy);g.lineTo(ox+wx,oy-hh+wy);g.lineTo(ox+wx,oy+wy);g.lineTo(ox+wx-dx,oy+wy+dy);g.closePath();g.fill();
  return [ox,oy,hh,wx,wy,dx,dy];
}
function iso(v){
  reset();bgGrad('#14274e','#0a1330');var n=v==='cubes'?6:7,rn=R(v==='city2'?31:17),s=U*.2,i,j,cells=[],pal=[[255,174,92],[134,230,255],[255,107,87],[46,196,182],[243,234,217]];
  g.strokeStyle='rgba(134,230,255,.15)';g.lineWidth=1;g.beginPath();for(i=-1;i<=n;i++){var a=(i-n/2)*1,b=(-1-n/2)*1;var x0=CX+(a-b)*.866*s,y0=CY+(a+b)*.5*s+U*.25;var c=(n-n/2),x1=CX+(a-c)*.866*s,y1=CY+(a+c)*.5*s+U*.25;ln(x0,y0,x1,y1);x0=CX+(b-a)*.866*s;y0=CY+(b+a)*.5*s+U*.25;x1=CX+(c-a)*.866*s;y1=CY+(c+a)*.5*s+U*.25;ln(x0,y0,x1,y1)}g.stroke();
  for(i=0;i<n;i++)for(j=0;j<n;j++){var dist=Math.hypot(i-n/2+.5,j-n/2+.5),hmax=.5+rn()*(v==='cubes'?1.2:2.2)*(1.2-dist/n*.7),gr=v==='cubes'?(.5+.5*Math.sin(F.T*3.2-dist*1.2)):easeBack((F.tb-dist*.28)/.9);cells.push([i+j,i-n/2+.5,j-n/2+.5,Math.max(0,hmax*gr),pal[(i*3+j*5)%5],hmax])}
  cells.sort(function(p,q){return p[0]-q[0]});
  for(i=0;i<cells.length;i++){var C=cells[i];if(C[3]<.02)continue;var r=isoBlock(C[1],C[2],0,.8,.8,C[3],C[4],s);
    if(C[3]>.9&&v!=='cubes'){g.fillStyle='rgba(255,236,170,.9)';for(var w=0;w<Math.floor(C[3]*1.4);w++){g.fillRect(r[0]-r[5]*.7,r[1]-w*s*.6-s*.1+r[6]*.5,s*.12,s*.18)}}}
  if(v!=='cubes'){g.globalCompositeOperation='lighter';spr(3,CX+U*.7,CY-U*.85,U*.35,.55+.2*F.k);reset()}
}

/* ================= STYLE 7: PAPER CUT ================= */
function paperLayer(col,base,amp,fr,ph,sp,shadow){
  var x,steps=Math.ceil(W/8);
  function path(dy){g.beginPath();g.moveTo(0,H);for(var i=0;i<=steps;i++){x=i*8;var y=base+dy+amp*Math.sin(x*fr+ph+F.T*sp)+amp*.45*Math.sin(x*fr*2.3+ph*1.7+F.T*sp*1.3);g.lineTo(x,y)}g.lineTo(W,H);g.closePath()}
  if(shadow){g.fillStyle='rgba(0,0,0,.32)';path(U*.05);g.fill()}g.fillStyle=col;path(0);g.fill();
}
function paper(v){
  reset();var night=v==='land2'||v==='window',i;
  if(v==='window')return paperWindow();
  bgGrad(night?'#1b1f5e':'#ffe0c2',night?'#4b3a8c':'#ffb88c');
  var sx=CX+Math.sin(F.T*.2)*U*.1,sy=CY-U*.35;
  g.fillStyle=night?'rgba(255,244,214,.25)':'rgba(255,255,255,.35)';circ(sx,sy,U*.55);g.fill();
  g.fillStyle=night?'#fff3c4':'#fff6e5';circ(sx,sy,U*.3);g.fill();g.fillStyle=night?'#ffe08a':'#ffd29a';circ(sx,sy,U*.2*(1+.04*F.k));g.fill();
  var cols=night?['#5e4aa5','#3b3b8f','#2d2a6e','#1d1b4a','#0f0d2b']:['#f4a261','#e76f51','#2a9d8f','#264653','#1b2a35'];
  for(i=0;i<5;i++)paperLayer(cols[i],H*(.5+i*.1),U*(.12+i*.02),.006+i*.0008,i*1.7,.25+i*.08,true);
  var rn=R(3);g.fillStyle=night?'#fff':'#1b2a35';for(i=0;i<5;i++){var bx=((rn()*W+F.T*U*.25*(1+i*.2))%(W+60))-30,by=H*.22+rn()*H*.18+Math.sin(F.T*3+i)*U*.02,s=U*.05,fl=Math.sin(F.T*8+i)*s*.4;g.beginPath();g.moveTo(bx-s,by-fl);g.lineTo(bx,by+s*.3);g.lineTo(bx+s,by-fl);g.lineTo(bx,by+s*.8);g.closePath();g.fill()}
}
function paperWindow(){
  reset();g.fillStyle='#14101c';g.fillRect(0,0,W,H);var z=1+F.p*.12,ww=U*1.25,wh=U*1.45,wx=CX-ww/2+U*.15,wy=CY-wh/2-U*.05;
  g.save();g.translate(CX,CY);g.scale(z,z);g.translate(-CX,-CY);
  g.fillStyle='rgba(0,0,0,.4)';rr(wx+U*.03,wy+U*.05,ww,wh,U*.04);g.fill();
  var gr=g.createLinearGradient(0,wy,0,wy+wh);gr.addColorStop(0,'#1f2a6b');gr.addColorStop(.7,'#7b4b9a');gr.addColorStop(1,'#e76f51');g.fillStyle=gr;rr(wx,wy,ww,wh,U*.04);g.fill();
  g.save();rr(wx,wy,ww,wh,U*.04);g.clip();g.fillStyle='#fff3c4';circ(wx+ww*.7,wy+wh*.25,U*.12);g.fill();
  var lc=['#4a2c6f','#2a1b4a','#150f2b'];for(var i=0;i<3;i++){g.fillStyle='rgba(0,0,0,.3)';var y0=wy+wh*(.55+i*.14);g.beginPath();g.moveTo(wx,wy+wh);for(var x=0;x<=ww;x+=8){var yy=y0+U*.05*Math.sin(x*.02+i*2+F.T*.2)+U*.03*Math.sin(x*.05+i);g.lineTo(wx+x,yy+U*.03)}g.lineTo(wx+ww,wy+wh);g.fill();g.fillStyle=lc[i];g.beginPath();g.moveTo(wx,wy+wh);for(x=0;x<=ww;x+=8){yy=y0+U*.05*Math.sin(x*.02+i*2+F.T*.2)+U*.03*Math.sin(x*.05+i);g.lineTo(wx+x,yy)}g.lineTo(wx+ww,wy+wh);g.fill()}
  g.restore();g.strokeStyle='#2b2233';g.lineWidth=U*.05;rr(wx,wy,ww,wh,U*.04);g.stroke();g.beginPath();ln(wx+ww/2,wy,wx+ww/2,wy+wh);ln(wx,wy+wh*.45,wx+ww,wy+wh*.45);g.stroke();
  var px=CX-U*.5,py=CY+U*.95,hr=U*.27;g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(px+U*.04,py+U*.07,U*.75,U*.6,0,Math.PI,0);g.fill();circ(px+U*.04,py-U*.62+U*.05,hr);g.fill();
  g.fillStyle='#0a0710';g.beginPath();g.ellipse(px,py,U*.75,U*.6,0,Math.PI,0);g.fill();g.fillRect(px-hr*.38,py-U*.68,hr*.76,U*.2);circ(px,py-U*.62,hr);g.fill();
  if(F.p>.5){var q=easeOut((F.p-.5)/.5);g.globalCompositeOperation='lighter';spr(0,px,py-U*.62,U*.3*q*(1+.2*F.k),q);spr(7,px,py-U*.62,U*.09*q,q);reset()}
  g.restore();
}

/* ================= STYLE 8: SYNTHWAVE ================= */
function synth(v){
  reset();var hy=CY-U*.05,i;var gr=g.createLinearGradient(0,0,0,hy);gr.addColorStop(0,'#10002b');gr.addColorStop(.55,'#5b0f8a');gr.addColorStop(.85,'#ff2e88');gr.addColorStop(1,'#ff9e4a');g.fillStyle=gr;g.fillRect(0,0,W,hy);
  var rn=R(9);g.fillStyle='#fff';for(i=0;i<40;i++){g.globalAlpha=.3+.5*Math.abs(Math.sin(F.T*2+i));g.fillRect(rn()*W,rn()*hy*.7,1.4,1.4)}g.globalAlpha=1;
  var sr=U*.62*(1+.03*F.k),sy=hy-sr*.5,sg=g.createLinearGradient(0,sy-sr,0,sy+sr);sg.addColorStop(0,'#ffe66d');sg.addColorStop(.5,'#ff8a4a');sg.addColorStop(1,'#ff2e88');
  g.save();g.beginPath();g.rect(0,0,W,hy);g.clip();g.fillStyle=sg;circ(CX,sy,sr);g.fill();
  g.fillStyle='#5b0f8a';for(i=0;i<8;i++){var yy=sy+sr*(.05+i*.12),hh=sr*.012*(i+1)*1.3;g.fillRect(CX-sr,yy,sr*2,hh)}g.restore();
  g.fillStyle='#16002e';g.strokeStyle='#ff3d9a';g.lineWidth=1.6;
  var mt=[[-1.3,.0],[-1.0,.3],[-.8,.12],[-.55,.34],[-.3,.05],[.3,.05],[.55,.3],[.8,.1],[1.1,.35],[1.4,.0]];g.beginPath();g.moveTo(CX+mt[0][0]*U,hy);for(i=0;i<mt.length;i++)g.lineTo(CX+mt[i][0]*U*1.15,hy-mt[i][1]*U);g.lineTo(CX+1.6*U,hy);g.closePath();g.fill();g.stroke();
  g.fillStyle='#0b001d';g.fillRect(0,hy,W,H-hy);
  g.strokeStyle='#ff3d9a';g.lineWidth=1.5;g.beginPath();var sc=((F.tb*.5)%1);
  for(i=0;i<14;i++){var u=(i+sc)/14,y=hy+Math.pow(u,2.2)*(H-hy);g.globalAlpha=.25+.75*u;ln(0,y,W,y);g.stroke();g.beginPath()}
  g.globalAlpha=1;g.strokeStyle='#2ee6ff';g.beginPath();for(i=-12;i<=12;i++){ln(CX+i*U*.06,hy,CX+i*U*.65,H)}g.stroke();
  if(v==='eq'){var n=Math.max(14,Math.floor(W/(U*.12)));for(i=0;i<n;i++){var h=U*(.1+.55*Math.abs(Math.sin(F.T*5+i*.7+F.k*2)))*(1-Math.abs(i/n-.5)*1.2),x=i/n*W;g.fillStyle=i%2?'#2ee6ff':'#ff3d9a';g.fillRect(x,hy-h,W/n*.7,h)}}
  g.globalCompositeOperation='lighter';g.globalAlpha=.3;g.drawImage(glowWarm,CX-U*1.4,sy-U*1.4,U*2.8,U*2.8);reset();
}

/* ================= STYLE 9: DOMINO REVEAL ================= */
function pips(x,y,w,h,n){var pos={1:[[.5,.5]],2:[[.25,.25],[.75,.75]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.25,.2],[.75,.2],[.25,.5],[.75,.5],[.25,.8],[.75,.8]]}[n]||[];g.fillStyle='#f3ead9';for(var i=0;i<pos.length;i++){circ(x+pos[i][0]*w,y+pos[i][1]*h,Math.min(w,h)*.08);g.fill()}}
function mkTitle(){
  var c=document.createElement('canvas');c.width=Math.max(2,W);c.height=Math.max(2,H);var x=c.getContext('2d');x.fillStyle='#0a0f26';x.fillRect(0,0,W,H);
  var n=TITLE_LINES.length,fs=Math.min(U*.55,W*.14)*Math.min(1,3/Math.max(1,n));x.font='italic '+fs+'px '+SERIF;x.textAlign='center';x.textBaseline='middle';
  for(var k=0;k<n;k++){x.fillStyle=k===TITLE_ACCENT?'#ffae5c':'#f3ead9';x.fillText(TITLE_LINES[k],CX,CY+(k-(n-1)/2)*fs);}
  return c;
}
function domino(v){
  reset();bgGrad('#0c1024','#05060f');
  if(v==='topple'||v==='cascade'){
    var n=9,dw=U*.14,dh=U*.52,sp=U*.23,x0=CX-sp*(n-1)/2,by=CY+U*.45,i,slow=v==='topple';
    g.fillStyle='rgba(255,255,255,.06)';g.fillRect(0,by,W,H-by);
    for(i=0;i<n;i++){var ti=(slow?.8:.2)+i*(slow?1.1:.14),ang=easeIn(clamp((F.tb-ti)/(slow?1.6:.9),0,1))*1.35;if(slow&&i>2)ang=0;
      g.save();g.translate(x0+i*sp+dw/2,by);g.rotate(ang);g.fillStyle='#f3ead9';rr(-dw,-dh,dw,dh,dw*.15);g.fill();g.strokeStyle='#0c1024';g.lineWidth=1.4;g.beginPath();ln(-dw,-dh/2,0,-dh/2);g.stroke();pips(-dw,-dh,dw,dh/2,(i%6)+1);pips(-dw,-dh/2,dw,dh/2,((i+2)%6)+1);g.restore()}
    if(!slow){g.globalCompositeOperation='lighter';spr(7,CX,CY,U*1.2,.18);reset()}return;
  }
  var ts=U*(QUAL>=2?.34:.24),cols=Math.ceil(W/ts)+1,rows=Math.ceil(H/ts)+1,i,j,title=v==='title';
  if(title&&!titleCv)titleCv=mkTitle();
  for(i=0;i<cols;i++)for(j=0;j<rows;j++){
    var x=i*ts+ts/2-(cols*ts-W)/2,y=j*ts+ts/2-(rows*ts-H)/2,d=title?Math.hypot(x-CX,y-CY)/ts*.34:i*.16+j*.03,f=clamp((F.tb*(title?1.6:2.2)-d-(title?.4:0))/1.1,0,1);
    var wdt=Math.abs(Math.cos(f*Math.PI))*ts*.92+1;
    if(f<.5){g.fillStyle='#161b34';rr(x-wdt/2,y-ts*.46,wdt,ts*.92,ts*.1);g.fill();g.strokeStyle='#2a3052';g.lineWidth=1;g.stroke();
      if(wdt>ts*.3){g.save();g.beginPath();g.rect(x-wdt/2,y-ts*.46,wdt,ts*.92);g.clip();g.translate(x,y);g.scale(wdt/(ts*.92),1);g.translate(-x,-y);var rv=((i*7+j*13)%6)+1;g.strokeStyle='#2a3052';g.beginPath();ln(x-ts*.4,y,x+ts*.4,y);g.stroke();pips(x-ts*.4,y-ts*.44,ts*.8,ts*.42,rv);pips(x-ts*.4,y+ts*.02,ts*.8,ts*.42,((i+j)%6)+1);g.restore()}}
    else{if(title){g.save();rr(x-wdt/2,y-ts*.46,wdt,ts*.92,ts*.1);g.clip();g.drawImage(titleCv,x-ts/2,y-ts/2,ts,ts,x-wdt/2,y-ts*.46,wdt,ts*.92);g.restore()}else{g.fillStyle=rgba((i/cols+j/rows*.3)%1,1);rr(x-wdt/2,y-ts*.46,wdt,ts*.92,ts*.1);g.fill()}}
  }
}
