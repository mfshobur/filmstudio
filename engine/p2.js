
/* ================= STYLE 1: GLOW ATOM ================= */
var gal=null;
function atom(v){
  var s=v==='spark'?easeOut(F.tb/6):v==='wait'?.5+.06*F.k:v==='prompt'?.7:1;
  reset();g.fillStyle=PAL.ink;g.fillRect(0,0,W,H);g.globalCompositeOperation='lighter';
  var gs=U*(.5+1.3*s+(v==='wait'?0:.25*F.k));
  g.globalAlpha=v==='wait'?.2+.4*F.p:.5;g.drawImage(glowWarm,CX-gs,CY-gs,gs*2,gs*2);
  if(v==='molecule'){molecule();return}
  if(v==='universe'){universe();return}
  var nOrb=v==='wait'?1:3,i,j;
  for(i=0;i<nOrb;i++){
    var rot=i*1.0472+F.T*(.14+.05*i),rx=U*.92*s,ry=U*.34*s;
    g.save();g.translate(CX,CY);g.rotate(rot);
    g.globalAlpha=.34;g.strokeStyle='rgba(134,230,255,1)';g.lineWidth=1.3;g.beginPath();g.ellipse(0,0,Math.max(1,rx),Math.max(1,ry),0,0,6.2832);g.stroke();
    var th=F.T*(1.45+i*.42)+i*2.1;
    for(j=0;j<18;j++){var a=th-j*.075,al=Math.pow(1-j/18,2);spr(j<1?7:5,Math.cos(a)*rx,Math.sin(a)*ry,U*(j<1?.055:.03)*(1-j/30),al*(v==='wait'?.6:1))}
    g.restore();
  }
  for(i=0;i<7;i++){var a2=i*.9+F.T*.7,r2=U*.045*(1+i%3)*s;spr(i%2?0:3,CX+Math.cos(a2)*r2,CY+Math.sin(a2*1.3)*r2,U*(.07+.02*F.k)*Math.min(1,s*6),.9)}
  if(s<.2)spr(3,CX,CY,U*.14*(s*5+.35),1);
}
function molecule(){
  var yaw=F.T*.9,pit=.55,sc=U*1.35,pts=[],bonds=[],i,a;
  pts.push([0,0,0,3]);
  for(i=0;i<6;i++){a=i*1.0472;pts.push([Math.cos(a)*.42,0,Math.sin(a)*.42,i%2?0:6]);bonds.push([0,i+1]);bonds.push([i+1,(i+1)%6+1])}
  for(i=0;i<6;i++){a=i*1.0472;pts.push([Math.cos(a)*.82,(i%2?.3:-.3),Math.sin(a)*.82,i%2?5:1]);bonds.push([i+1,7+i])}
  pts.push([0,-.75,0,4]);bonds.push([0,13]);pts.push([0,.75,0,2]);bonds.push([0,14]);
  var sx=[],sy=[],sz=[],sf=[];
  for(i=0;i<pts.length;i++){var f=p3(pts[i][0],pts[i][1],pts[i][2],yaw,pit,sc);sx[i]=X3;sy[i]=Y3;sz[i]=Z3;sf[i]=f}
  g.lineWidth=2;g.strokeStyle='rgba(243,234,217,.55)';g.globalAlpha=1;g.beginPath();
  for(i=0;i<bonds.length;i++)ln(sx[bonds[i][0]],sy[bonds[i][0]],sx[bonds[i][1]],sy[bonds[i][1]]);
  g.stroke();
  for(i=0;i<pts.length;i++)spr(pts[i][3],sx[i],sy[i],U*(i===0?.26:.15)*sf[i]*(1+.25*F.k),1);
}
function universe(){
  if(!gal){var rn=R(7);gal=[];for(var i=0;i<700;i++){var r=Math.pow(rn(),.6)*1.7;gal.push([r,(i%3)*2.094+r*3+(rn()-.5)*.55,rn()])}}
  var sc=lerp(.1,1.45,easeIO(F.p));
  for(var i=0;i<gal.length;i++){var q=gal[i],th=q[1]+F.T*.12*(1.3-q[0]*.4),x=Math.cos(th)*q[0],z=Math.sin(th)*q[0]*.45;
    spr(q[0]<.5?2:q[2]<.5?5:6,CX+x*U*sc,CY+z*U*sc,U*(.02+.03*q[2])*Math.min(1.6,sc+.3),(.25+.55*q[2])*clamp(F.p*3+.3,0,1))}
  spr(2,CX,CY,U*.5*(1-F.p*.5),1);
  if(F.p<.5){g.globalAlpha=1-F.p*2;g.strokeStyle='rgba(134,230,255,.5)';g.lineWidth=1.2;for(var o=0;o<3;o++){g.save();g.translate(CX,CY);g.rotate(o*1.0472+F.T*.2);g.beginPath();g.ellipse(0,0,U*.9*(1-F.p),U*.33*(1-F.p),0,0,6.2832);g.stroke();g.restore()}}
}

/* ================= STYLE 2: MATHS DIAGRAM ================= */
function blueprint(){
  reset();bgGrad('#0a1c40','#06122c');var st=U*.13,x,y;
  g.lineWidth=1;g.strokeStyle='rgba(134,230,255,'+(.09+.05*F.k)+')';g.beginPath();
  for(x=CX%st;x<W;x+=st)ln(x,0,x,H);for(y=CY%st;y<H;y+=st)ln(0,y,W,y);g.stroke();
  g.strokeStyle='rgba(134,230,255,.2)';g.beginPath();for(x=CX%(st*5);x<W;x+=st*5)ln(x,0,x,H);for(y=CY%(st*5);y<H;y+=st*5)ln(0,y,W,y);g.stroke();
}
function mathSine(){
  blueprint();
  var r=U*.36,ox=CX-U*.52,oy=CY,th=F.T*2.1+.4,px=ox+Math.cos(th)*r,py=oy-Math.sin(th)*r;
  var gx0=ox+r*1.55,gw=Math.max(U*.9,W-gx0-Math.max(16,W*.05));
  g.strokeStyle='rgba(243,234,217,.6)';g.lineWidth=1.4;g.beginPath();ln(ox-r*1.3,oy,ox+r*1.3,oy);ln(ox,oy-r*1.3,ox,oy+r*1.3);ln(gx0,oy,gx0+gw,oy);ln(gx0,oy-r*1.3,gx0,oy+r*1.3);g.stroke();
  g.strokeStyle=PAL.ice;g.lineWidth=2;circ(ox,oy,r);g.stroke();
  g.strokeStyle=PAL.ember;g.lineWidth=2.6;g.beginPath();ln(ox,oy,px,py);g.stroke();
  g.strokeStyle='rgba(243,234,217,.7)';g.lineWidth=1.4;g.beginPath();var a;
  for(a=0;a<=th;a+=.05){var xx=gx0+a/(4*Math.PI)*gw,yy=oy-Math.sin(a)*r;if(a===0)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.stroke();
  g.strokeStyle=PAL.ember;g.lineWidth=3;g.beginPath();for(a=Math.max(0,th-1.4);a<=th;a+=.05){var x2=gx0+a/(4*Math.PI)*gw,y2=oy-Math.sin(a)*r;if(a===Math.max(0,th-1.4))g.moveTo(x2,y2);else g.lineTo(x2,y2)}g.stroke();
  var hx=gx0+th/(4*Math.PI)*gw;g.setLineDash([4,5]);g.strokeStyle='rgba(255,174,92,.8)';g.lineWidth=1.3;g.beginPath();ln(px,py,hx,py);g.stroke();g.setLineDash([]);
  g.fillStyle=PAL.ember;circ(px,py,U*.035);g.fill();circ(hx,py,U*.035);g.fill();
  var fs=Math.max(11,U*.07);txt('sin θ',gx0+gw*.62,oy-r*1.15,fs,PAL.ice);txt('θ',gx0+gw+2,oy+fs,fs,'rgba(243,234,217,.7)','right');txt('y',ox+4,oy-r*1.25,fs,'rgba(243,234,217,.7)');
  var f='f(x) = Wx + b',n=clamp(Math.floor((F.tb-2.5)*7),0,f.length);if(n>0)txt(f.slice(0,n),CX,CY+U*.8,Math.max(13,U*.1),PAL.bone,'center');
}
function mathDescent(){
  blueprint();var i,t=clamp(F.tb/(F.dur*.85),0,1);
  g.save();g.translate(CX,CY);g.rotate(-.4);g.strokeStyle='rgba(134,230,255,.4)';g.lineWidth=1.3;
  for(i=1;i<=7;i++){g.beginPath();g.ellipse(0,0,U*.13*i*1.1,U*.09*i*1.1,0,0,6.2832);g.stroke()}g.restore();
  function pos(u){var r=U*.88*(1-u),a=u*8.5+.6,x=Math.cos(a)*r*1.1,y=Math.sin(a)*r*.75,c=Math.cos(-.4),s=Math.sin(-.4);return [CX+x*c-y*s,CY+x*s+y*c]}
  g.strokeStyle=PAL.ember;g.lineWidth=2.6;g.beginPath();for(i=0;i<=60;i++){var u=t*i/60,q=pos(u);if(i===0)g.moveTo(q[0],q[1]);else g.lineTo(q[0],q[1])}g.stroke();
  var h=pos(t);g.fillStyle=PAL.bone;circ(h[0],h[1],U*.05*(1+.2*F.k));g.fill();g.fillStyle='rgba(255,174,92,.35)';circ(h[0],h[1],U*.1);g.fill();
  var f='θ ← θ − η∇L(θ)',n=clamp(Math.floor(F.tb*5),0,f.length);if(n>0)txt(f.slice(0,n),CX,CY+U*.9,Math.max(13,U*.1),PAL.bone,'center');
}
function mathPrompt(){
  blueprint();var t=easeIO(F.p*1.3);g.strokeStyle=PAL.ember;g.lineWidth=Math.max(3,U*.035);g.beginPath();
  var cx=CX,cy=CY-U*.15,r=U*.38,a1=Math.PI*1.05,a2=a1+Math.PI*1.65*t;if(t>0)g.arc(cx,cy-r*.35,r*.62,a1,a2);g.stroke();
  if(t>.8){var u=(t-.8)/.2;g.beginPath();ln(cx+r*.12,cy+r*.1,cx+r*.12,cy+r*.1+(r*.4)*u);g.stroke()}
  if(t>.95){g.fillStyle=PAL.ember;circ(cx+r*.12,cy+r*.78,U*.045*(1+.3*F.k));g.fill()}
  g.strokeStyle='rgba(134,230,255,.4)';g.setLineDash([3,6]);g.lineWidth=1.2;circ(cx,cy-r*.35,r*.62);g.stroke();g.setLineDash([]);
}

/* ================= STYLE 3: CARTOON EXPLAINER ================= */
function outline(){g.lineWidth=Math.max(2,U*.022);g.strokeStyle='#1b1b2f';g.lineJoin='round';g.lineCap='round'}
function cbg(c1,c2){bgGrad(c1,c2);g.fillStyle='rgba(0,0,0,.05)';var st=U*.1;for(var y=st/2;y<H;y+=st)for(var x=((y/st)%2?st/2:0);x<W;x+=st){g.beginPath();g.arc(x,y,st*.12,0,6.2832);g.fill()}}
function robot(x,y,s,sq,lx,ly,walk,arm){
  g.save();g.translate(x,y);g.scale(1+.08*sq,1-.1*sq);outline();var lg=Math.sin(walk)*s*.07;
  g.fillStyle='#2b2d42';rr(-s*.3+lg,-s*.3,s*.2,s*.3,s*.06);g.fill();g.stroke();rr(s*.1-lg,-s*.3,s*.2,s*.3,s*.06);g.fill();g.stroke();
  g.fillStyle='#4361ee';rr(-s*.36,-s*.92,s*.72,s*.65,s*.12);g.fill();g.stroke();
  g.fillStyle=PAL.yel;circ(0,-s*.6,s*.12);g.fill();g.stroke();
  g.fillStyle='#4361ee';g.beginPath();ln(-s*.36,-s*.78,-s*.55,-s*.55+Math.sin(walk+1)*s*.05);g.stroke();
  g.beginPath();ln(s*.36,-s*.78,s*.55,-s*(.8+arm*.3));g.stroke();
  g.fillStyle='#e8eefc';rr(-s*.4,-s*1.52,s*.8,s*.55,s*.16);g.fill();g.stroke();
  g.beginPath();ln(0,-s*1.52,0,-s*1.68);g.stroke();g.fillStyle=PAL.coral;circ(0,-s*1.72,s*.06);g.fill();g.stroke();
  var bl=(F.T%3.1)<.12?.15:1;
  for(var e=-1;e<=1;e+=2){g.fillStyle='#fff';g.save();g.translate(e*s*.17,-s*1.25);g.scale(1,bl);circ(0,0,s*.11);g.fill();g.stroke();g.fillStyle='#1b1b2f';circ(lx*s*.05,ly*s*.05,s*.05);g.fill();g.restore()}
  g.beginPath();g.arc(0,-s*1.1,s*.1,.2,Math.PI-.2);g.stroke();
  g.restore();
}
function cartoonFollow(){
  cbg('#ffe08a','#ffc857');var fl=CY+U*.55;g.fillStyle='#fb8500';g.fillRect(0,fl,W,H-fl);outline();g.beginPath();ln(0,fl,W,fl);g.stroke();
  var i,tw=U*.3,xs=[-.75,-.25,.25,.75],gl=['→','→','↑','→'];
  for(i=0;i<4;i++){var pop=easeBack((F.tb-i*.9)/.8);if(pop<=0)continue;var x=CX+xs[i]*U,w=tw*pop;g.fillStyle='#fff';rr(x-w/2,fl-w*.15-w,w,w,w*.2);g.fill();outline();g.stroke();txt(gl[i],x,fl-w*.15-w/2,w*.7,'#1b1b2f','center',SANS,'800')}
  var step=clamp((F.tb-.8)/.9,0,3),idx=Math.floor(step),fr=step-idx,x0=CX+xs[Math.min(3,idx)]*U,x1=CX+xs[Math.min(3,idx+1)]*U,rx=lerp(x0,x1,easeIO(fr)),hop=Math.abs(Math.sin(fr*Math.PI))*U*.12;
  robot(rx,fl-hop,U*.5,F.k,1,0,F.T*9,Math.max(0,Math.sin(F.T*5)));
  var bw=U*.95,bx=clamp(rx,bw/2+10,W-bw/2-10),by=CY-U*.75;g.fillStyle='#fff';outline();rr(bx-bw/2,by-U*.17,bw,U*.34,U*.1);g.fill();g.stroke();
  txt('IF path THEN step',bx,by,Math.max(11,U*.1),'#1b1b2f','center',SANS,'800');
}
function cartoonHeart(){
  cbg('#ffd6e0','#ff8fab');var s=U*.62*(1+.1*F.k)*easeBack(F.tb/.6);outline();
  g.save();g.translate(CX,CY-U*.05);g.fillStyle='#ef233c';g.beginPath();g.moveTo(0,s*.9);g.bezierCurveTo(-s*1.3,s*.1,-s*.8,-s*.9,0,-s*.35);g.bezierCurveTo(s*.8,-s*.9,s*1.3,s*.1,0,s*.9);g.closePath();g.fill();g.stroke();
  g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(-s*.45,-s*.3,s*.14,s*.08,-.6,0,6.2832);g.fill();
  g.fillStyle='#fff';g.rotate(F.T*.4);rr(-s*.09,-s*.34,s*.18,s*.68,s*.04);g.fill();g.stroke();rr(-s*.34,-s*.09,s*.68,s*.18,s*.04);g.fill();g.stroke();g.restore();
  var rn=R(11),i;for(i=0;i<7;i++){var a=rn()*6.28,d=U*(.7+rn()*.35),sp=easeBack((F.tb-i*.35)/.5),sx=CX+Math.cos(a)*d,sy=CY+Math.sin(a)*d*.8,z=U*.07*sp;if(sp<=0)continue;g.fillStyle=PAL.yel;g.beginPath();g.moveTo(sx,sy-z*1.6);g.lineTo(sx+z*.4,sy-z*.4);g.lineTo(sx+z*1.6,sy);g.lineTo(sx+z*.4,sy+z*.4);g.lineTo(sx,sy+z*1.6);g.lineTo(sx-z*.4,sy+z*.4);g.lineTo(sx-z*1.6,sy);g.lineTo(sx-z*.4,sy-z*.4);g.closePath();g.fill();g.stroke()}
  var y0=CY+U*.82;g.strokeStyle='#1b1b2f';g.lineWidth=Math.max(2,U*.025);g.beginPath();var n=Math.floor(clamp(F.tb/F.dur*1.4,0,1)*40);for(i=0;i<=n;i++){var x=CX-U*1.1+i/40*U*2.2,m=i%10,y=y0-(m===3?U*.2:m===4?-U*.14:m===5?U*.34:0);if(i===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke();
}
function cartoonWonder(){
  cbg('#16275a','#0b1a3a');g.fillStyle='rgba(255,255,255,.0)';var rn=R(5),i;for(i=0;i<16;i++){g.fillStyle=i%3?'#ffd166':'#fff';circ(rn()*W,rn()*H*.7,U*.012*(1+(i%3)));g.fill()}
  g.fillStyle='#fff3c4';circ(W*.82,H*.2,U*.14);g.fill();outline();g.stroke();
  var fl=CY+U*.6;g.fillStyle='#1d2f6f';g.fillRect(0,fl,W,H-fl);outline();g.beginPath();ln(0,fl,W,fl);g.stroke();
  robot(CX-U*.25,fl,U*.55,F.k*.4,.6,-1,0,0);
  var on=F.tb>3.05,bx=CX+U*.5,by=CY-U*.45;g.fillStyle=on?'#ffe066':'#8d99ae';outline();circ(bx,by,U*.2);g.fill();g.stroke();g.fillStyle='#6c757d';rr(bx-U*.09,by+U*.18,U*.18,U*.1,U*.03);g.fill();g.stroke();
  if(on){g.globalCompositeOperation='lighter';g.globalAlpha=.7;g.drawImage(glowWarm,bx-U*.7,by-U*.7,U*1.4,U*1.4);reset()}
  var q=U*.2*(1+.08*Math.sin(F.T*3));g.fillStyle='#fff';outline();rr(CX-U*.9,CY-U*.78,U*.5,U*.4,U*.12);g.fill();g.stroke();txt('?',CX-U*.65,CY-U*.58,q*1.5,'#1b1b2f','center',SANS,'800');
}

/* ================= STYLE 4: 3D DATA CHART ================= */
var BX=[[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]],BN=[[0,0,-1],[0,0,1],[0,1,0],[0,-1,0],[-1,0,0],[1,0,0]];
function box3(x,y,z,w,h,d,col,yaw,pit,sc){
  var P=[],i,j;for(i=0;i<8;i++){var bx=(i&1)?w:0,by=(i&2)?-h:0,bz=(i&4)?d:0;p3(x+bx-w/2,y+by,z+bz-d/2,yaw,pit,sc);P.push([X3,Y3])}
  var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit);
  for(i=0;i<6;i++){var n=BN[i],x1=n[0]*cy-n[2]*sy,z1=n[0]*sy+n[2]*cy,z2=n[1]*sp+z1*cp;if(i===2||z2<=.02)continue;
    var shade=i===3?1.15:i%2?.62:.8;g.fillStyle=shadeCol(col,shade);g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;g.beginPath();for(j=0;j<4;j++){var q=P[BX[i][j]];if(j===0)g.moveTo(q[0],q[1]);else g.lineTo(q[0],q[1])}g.closePath();g.fill();g.stroke()}
}
function shadeCol(c,k){var r=Math.min(255,c[0]*k|0),gg=Math.min(255,c[1]*k|0),b=Math.min(255,c[2]*k|0);return 'rgb('+r+','+gg+','+b+')'}
function chart3d(v){
  reset();bgGrad('#0a0f26','#050714');var n=v==='learn'?5:9,rn=R(v==='skyline2'?9:v==='skyline'?4:2),cell=(v==='learn'?.3:.18),i,j;
  var yaw=.7+F.T*.12+(v==='skyline'?F.p*.5:0),pit=-.7,sc=U*(v==='learn'?.68:.84)*(1+(v==='skyline'?F.p*.15:0)),list=[],half=(n-1)/2;
  g.strokeStyle='rgba(134,230,255,.2)';g.lineWidth=1;g.beginPath();for(i=-1;i<=n;i++){var a=(i-half)*cell;p3(a,0,(-1-half)*cell,yaw,pit,sc);var x0=X3,y0=Y3;p3(a,0,(n-half)*cell,yaw,pit,sc);ln(x0,y0,X3,Y3);p3((-1-half)*cell,0,a,yaw,pit,sc);x0=X3;y0=Y3;p3((n-half)*cell,0,a,yaw,pit,sc);ln(x0,y0,X3,Y3)}g.stroke();
  for(i=0;i<n;i++)for(j=0;j<n;j++){var hh=(.2+rn()*.8)*(v==='learn'?.75:.85),delay=(i+j)*.28,gr=easeBack((F.tb-delay)/1.2);if(v==='skyline2')hh*=.6+.4*Math.sin(F.T*3+i+j);
    var x=(i-half)*cell,z=(j-half)*cell;p3(x,0,z,yaw,pit,sc);list.push([Z3,x,z,Math.max(0,hh*gr),hh])}
  list.sort(function(a,b){return a[0]-b[0]});
  for(i=0;i<list.length;i++){var L=list[i],t=clamp(L[4]/1.2,0,1);box3(L[1],0,L[2],cell*.78,L[3],cell*.78,ramp(t*.9+.05),yaw,pit,sc)}
  if(v==='learn'){var gx=CX-U*.9,gw=U*1.8,gy=CY+U*.85,pts=Math.floor(clamp(F.tb/F.dur*1.2,0,1)*30);g.strokeStyle=PAL.ember;g.lineWidth=Math.max(2,U*.025);g.beginPath();for(i=0;i<=pts;i++){var xx=gx+i/30*gw,yy=gy-Math.pow(i/30,.6)*U*.5;if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.stroke();
    var c=Math.floor(Math.pow(clamp(F.tb/F.dur,0,1),1.6)*1e9);txt(String(c).replace(/\B(?=(\d{3})+(?!\d))/g,','),CX-U*.95,CY-U*.88,Math.max(14,U*.14),PAL.bone,'left');txt('examples',CX-U*.95,CY-U*.7,Math.max(10,U*.07),'rgba(243,234,217,.6)','left')}
}
