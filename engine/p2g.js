
/* ================= helpers shared by the planned-styles pack ================= */
function tri(a,b,c,col){g.fillStyle=col;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.closePath();g.fill()}
function rgbStr(c,k){return 'rgb('+Math.min(255,c[0]*k|0)+','+Math.min(255,c[1]*k|0)+','+Math.min(255,c[2]*k|0)+')'}
function spaced(s){return String(s).split('').join(' ')}

/* ================= VAPORWAVE ("vapor") : grid, windows ================= */
function vaporScene(v){
  var P=F.params||{},t=F.T,i,j;reset();
  if(v==='windows'){
    var gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#ff71ce');gr.addColorStop(.5,'#b967ff');gr.addColorStop(1,'#01cdfe');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,.18)';for(i=0;i<W;i+=U*.1)for(j=0;j<H;j+=U*.1)g.fillRect(i,j,1.5,1.5);
    var wins=[[-.55,-.2,.95,.7,'ERROR'],[.45,.1,.9,.62,'a e s t h e t i c'],[-.15,.35,.75,.5,'']];
    wins.forEach(function(w,k){var pop=easeBack((F.tb-k*.9)/.6);if(pop<=0)return;var ww=U*w[2],hh=U*w[3],x=CX+w[0]*U-ww/2+Math.sin(t*.7+k)*U*.03,y=CY+w[1]*U-hh/2+Math.cos(t*.6+k)*U*.03;g.save();g.translate(x+ww/2,y+hh/2);g.scale(pop,pop);g.translate(-ww/2,-hh/2);
      g.fillStyle='rgba(0,0,0,.25)';g.fillRect(U*.03,U*.03,ww,hh);g.fillStyle='#e8e8f4';g.fillRect(0,0,ww,hh);g.strokeStyle='#111';g.lineWidth=Math.max(2,U*.012);g.strokeRect(0,0,ww,hh);
      var tg=g.createLinearGradient(0,0,ww,0);tg.addColorStop(0,'#2b55ff');tg.addColorStop(1,'#ff71ce');g.fillStyle=tg;g.fillRect(0,0,ww,U*.1);txt(w[4]||'',U*.04,U*.05,Math.max(9,U*.06),'#fff','left',MONO,'500');
      ['_','□','x'].forEach(function(b,q){g.fillStyle='#c0c0d8';g.fillRect(ww-U*.12*(3-q)+U*.02,U*.02,U*.1,U*.06);txt(b,ww-U*.12*(3-q)+U*.07,U*.05,Math.max(8,U*.05),'#111','center',MONO)});
      if(k===0){g.fillStyle='#ff3d6b';g.beginPath();g.arc(U*.2,hh*.58,U*.13,0,6.2832);g.fill();txt('!',U*.2,hh*.58,U*.2,'#fff','center',SANS,'800');var msg=P.text||'mind not found',mf=Math.max(8,Math.min(U*.08,(ww*.5)/(msg.length*.62)));txt(msg,ww*.64,hh*.52,mf,'#111','center',MONO)}
      if(k===1){g.fillStyle='#ffe66d';g.beginPath();g.arc(ww/2,hh*.6,U*.18,0,6.2832);g.fill();g.fillStyle='#ff71ce';g.fillRect(ww/2-U*.18,hh*.6+U*.02,U*.36,U*.025);g.fillRect(ww/2-U*.18,hh*.6+U*.08,U*.36,U*.035)}
      if(k===2){var bw=ww*(.2+.8*easeIO((F.tb*.3)%1));g.fillStyle='#b967ff';g.fillRect(U*.05,hh*.55,bw-U*.1,U*.07);g.strokeRect(U*.05,hh*.55,ww-U*.1,U*.07);txt('loading dreams...',ww/2,hh*.3,Math.max(9,U*.07),'#111','center',MONO)}
      g.restore()});
    g.fillStyle='#fff';g.strokeStyle='#111';g.lineWidth=2;var cx=CX+Math.sin(t*.9)*U*.5+U*.2,cy=CY+Math.cos(t*.7)*U*.3;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy+U*.16);g.lineTo(cx+U*.045,cy+U*.12);g.lineTo(cx+U*.08,cy+U*.19);g.lineTo(cx+U*.105,cy+U*.18);g.lineTo(cx+U*.07,cy+U*.11);g.lineTo(cx+U*.12,cy+U*.1);g.closePath();g.fill();g.stroke();
    return;
  }
  var hy=CY+U*.05,sk=g.createLinearGradient(0,0,0,hy);sk.addColorStop(0,'#b967ff');sk.addColorStop(.6,'#ff71ce');sk.addColorStop(1,'#ffd1f5');g.fillStyle=sk;g.fillRect(0,0,W,hy);
  var sr=U*.55,sy=hy-sr*.35,sg=g.createLinearGradient(0,sy-sr,0,sy+sr);sg.addColorStop(0,'#fffb96');sg.addColorStop(1,'#ff71ce');g.save();g.beginPath();g.rect(0,0,W,hy);g.clip();g.fillStyle=sg;g.beginPath();g.arc(CX,sy,sr,0,6.2832);g.fill();g.fillStyle='#d98af0';for(i=0;i<7;i++)g.fillRect(CX-sr,sy+sr*(.0+i*.14),sr*2,sr*.014*(i+1));g.restore();
  g.fillStyle='#3a0f66';g.fillRect(0,hy,W,H-hy);var sc=(F.tb*.4)%1,rows=11,cols=40;for(j=0;j<rows;j++){var u0=(j+sc)/rows,u1=(j+1+sc)/rows,y0=hy+Math.pow(u0,2)*(H-hy),y1=hy+Math.pow(Math.min(1,u1),2)*(H-hy);for(i=-cols/2;i<cols/2;i++){var x00=CX+i*U*.1*(.15+u0*5),x01=CX+(i+1)*U*.1*(.15+u0*5),x10=CX+i*U*.1*(.15+u1*5),x11=CX+(i+1)*U*.1*(.15+u1*5);g.fillStyle=((i+j+(F.tb*.4|0))%2)?'#01cdfe':'#b967ff';g.beginPath();g.moveTo(x00,y0);g.lineTo(x01,y0);g.lineTo(x11,y1);g.lineTo(x10,y1);g.closePath();g.fill()}}
  [-1,1].forEach(function(sd){var bx=CX+sd*U*1.25,by=H*.92;g.strokeStyle='#05ffa1';g.lineWidth=Math.max(3,U*.03);g.beginPath();g.moveTo(bx,by);g.quadraticCurveTo(bx-sd*U*.1,by-U*.5,bx-sd*U*.2,by-U*.85);g.stroke();for(var f=0;f<7;f++){var fa=(-1.4+f*.45)*sd+(sd<0?3.14:0),fl=U*.42;g.lineWidth=Math.max(2,U*.018);g.beginPath();g.moveTo(bx-sd*U*.2,by-U*.85);g.quadraticCurveTo(bx-sd*U*.2+Math.cos(fa)*fl*.6,by-U*.85+Math.sin(fa)*fl*.6-U*.1,bx-sd*U*.2+Math.cos(fa)*fl,by-U*.85+Math.sin(fa)*fl+U*.08+Math.sin(t*2+f)*U*.02);g.stroke()}});
  var an=t*.8;g.strokeStyle='#fffb96';g.lineWidth=Math.max(2,U*.012);var pv=[[0,-1],[1,.7],[-1,.7]].map(function(p){return [CX+(Math.cos(an)*p[0])*U*.28,CY-U*.55+p[1]*U*.25+Math.sin(t*1.2)*U*.03]});g.beginPath();g.moveTo(pv[0][0],pv[0][1]);g.lineTo(pv[1][0],pv[1][1]);g.lineTo(pv[2][0],pv[2][1]);g.closePath();g.stroke();
  if(P.text)txt(spaced(String(P.text).toUpperCase()),CX,H*.86,Math.max(14,U*.14),'#fffb96','center',SANS,'800');
}

/* ================= MEMPHIS ("memphis") ================= */
function memphisScene(v){
  var P=F.params||{},pal=P.palette||['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#9b5de5','#ff9ecf'],bgc=P.bg||'#fff1e6',i;
  reset();g.fillStyle=bgc;g.fillRect(0,0,W,H);g.lineWidth=Math.max(2.5,U*.014);g.strokeStyle='#111';g.lineJoin='round';
  for(i=0;i<34;i++){var pop=easeBack((F.tb-i*.12)/.5);if(pop<=0)continue;var x=nHash(i,1)*W,y=nHash(i,2)*H,s=U*(.12+nHash(i,3)*.2),k=i%7,col=pal[i%pal.length],bounce=1+.08*Math.sin(F.T*4+i)*(1+F.k);
    g.save();g.translate(x,y);g.rotate(nHash(i,4)*6.28+F.T*(nHash(i,5)-.5)*.8);g.scale(pop*bounce,pop*bounce);g.fillStyle=col;
    if(k===0){g.beginPath();g.arc(0,0,s*.5,0,6.2832);g.fill();g.stroke()}
    else if(k===1){g.beginPath();g.moveTo(0,-s*.55);g.lineTo(s*.55,s*.45);g.lineTo(-s*.55,s*.45);g.closePath();g.fill();g.stroke()}
    else if(k===2){g.beginPath();for(var q=0;q<=20;q++){var xx=-s*.7+q/20*s*1.4,yy=Math.sin(q*.9)*s*.18;q?g.lineTo(xx,yy):g.moveTo(xx,yy)}g.lineWidth=Math.max(4,U*.03);g.strokeStyle=col;g.stroke();g.strokeStyle='#111';g.lineWidth=Math.max(2.5,U*.014)}
    else if(k===3){g.beginPath();g.moveTo(-s*.6,s*.3);for(var z=0;z<5;z++)g.lineTo(-s*.6+z*s*.3,z%2?s*.3:-s*.3);g.lineWidth=Math.max(4,U*.03);g.strokeStyle=col;g.stroke();g.strokeStyle='#111';g.lineWidth=Math.max(2.5,U*.014)}
    else if(k===4){g.fillStyle='#111';for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){g.beginPath();g.arc(dx*s*.22,dy*s*.22,s*.05,0,6.2832);g.fill()}}
    else if(k===5){g.beginPath();g.arc(0,0,s*.5,Math.PI,0);g.closePath();g.fill();g.stroke()}
    else{g.fillRect(-s*.45,-s*.11,s*.9,s*.22);g.strokeRect(-s*.45,-s*.11,s*.9,s*.22);g.fillRect(-s*.11,-s*.45,s*.22,s*.9);g.strokeRect(-s*.11,-s*.45,s*.22,s*.9)}
    g.restore()}
  if(P.text){var sz=fitSize(String(P.text),{font:'sans'},W*.8,U*.7),pop2=easeBack(F.tb/.7);g.save();g.translate(CX,CY);g.scale(pop2,pop2);g.font=tyFont({font:'sans'},sz);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#111';g.fillText(P.text,U*.03,U*.035);g.lineWidth=sz*.1;g.strokeStyle='#111';g.strokeText(P.text,0,0);g.fillStyle='#fff';g.fillText(P.text,0,0);g.restore()}
}

/* ================= POSTER ("poster") : Swiss / Bauhaus ================= */
function posterScene(v){
  var P=F.params||{},t=F.T;reset();
  if(v==='bauhaus'){
    g.fillStyle='#efe6d2';g.fillRect(0,0,W,H);var e=easeOut(F.tb/2),r=U*.55*e;
    g.fillStyle='#f2b705';g.beginPath();g.arc(CX-U*.35,CY-U*.1,r,0,6.2832);g.fill();
    g.save();g.translate(CX+U*.45,CY+U*.1);g.rotate(t*.3);g.fillStyle='#d62828';g.beginPath();g.moveTo(0,-U*.6*e);g.lineTo(U*.55*e,U*.4*e);g.lineTo(-U*.55*e,U*.4*e);g.closePath();g.fill();g.restore();
    g.save();g.translate(CX,CY+U*.45);g.rotate(-t*.2);g.fillStyle='#1d3557';g.fillRect(-U*.3*e,-U*.3*e,U*.6*e,U*.6*e);g.restore();
    g.strokeStyle='#111';g.lineWidth=Math.max(3,U*.035);g.beginPath();g.moveTo(CX-U*1.2,CY+U*.7);g.lineTo(CX-U*1.2+U*2.4*e,CY-U*.7);g.stroke();
    if(P.title)txt(String(P.title).toUpperCase(),CX,H*.9,Math.max(14,U*.13),'#111','center',SANS,'800');
    return;
  }
  g.fillStyle='#f2efe6';g.fillRect(0,0,W,H);g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=1;g.beginPath();for(var i=1;i<6;i++){ln(W*i/6,0,W*i/6,H);ln(0,H*i/6,W,H*i/6)}g.stroke();
  var e2=easeOut(F.tb/1.5);g.fillStyle='#e63946';g.beginPath();g.arc(W*.72,H*.4,U*.62*e2,0,6.2832);g.fill();
  g.fillStyle='#111';g.fillRect(W*.08,H*.1,W*.5*e2,U*.05);g.fillRect(W*.08,H*.86,W*.84*easeOut((F.tb-.4)/1.5),U*.03);
  var title=String(P.title||'Less, but better'),lines=title.split(' '),sz=Math.min(fitSize(lines.reduce(function(a,b){return a.length>b.length?a:b},''),{font:'sans'},W*.5,U*.62),H*.52/(lines.length*.95)),k2=clamp((F.tb-.3)/1,0,1);
  g.font=tyFont({font:'sans'},sz);g.textAlign='left';g.textBaseline='top';g.fillStyle='#111';lines.forEach(function(l,q){g.globalAlpha=clamp(k2*3-q*.6,0,1);g.fillText(l,W*.08+(1-k2)*-U*.3,H*.2+q*sz*.95)});g.globalAlpha=1;
  if(P.sub)txt(String(P.sub),W*.08,H*.8,Math.max(11,U*.09),'#111','left',SANS,'400');
}

/* ================= ASCII ("ascii") : rain, text, plasma ================= */
function asciiScene(v){
  var P=F.params||{},t=F.T,cw=Math.max(7,U*.075),chh=cw*1.7,cols=Math.floor(W/cw),rows=Math.floor(H/chh),i,j;
  reset();g.fillStyle='#02060a';g.fillRect(0,0,W,H);g.font='500 '+Math.round(chh*.85)+'px '+MONO;g.textBaseline='top';g.textAlign='left';
  var glyphs='01#$%&@*+=<>/\\|{}[]ABCDEFxyz';
  if(v==='rain'){for(i=0;i<cols;i++){var sp=3+nHash(i,1)*6,head=((t*sp+nHash(i,2)*rows*2)%(rows+14))-2;for(j=0;j<rows;j++){var d=head-j;if(d<0||d>12)continue;var ch=glyphs[Math.floor(nHash(i*7+j,Math.floor(t*(d<1?20:3))+1)*glyphs.length)];g.fillStyle=d<1?'#d6ffe0':'rgba(0,'+Math.round(255-d*17)+','+Math.round(70-d*4)+','+(1-d/13)+')';g.fillText(ch,i*cw,j*chh)}}}
  else if(v==='plasma'){var ramp=' .:-=+*#%@',pal=[PAL.ember,PAL.ice,'#ff4f81'];for(j=0;j<rows;j++)for(i=0;i<cols;i++){var val=Math.sin(i*.18+t)+Math.sin(j*.3+t*1.3)+Math.sin((i+j)*.12+t*.7)+Math.sin(Math.hypot(i-cols/2,(j-rows/2)*1.7)*.22-t*2);val=(val+4)/8;var k=Math.floor(clamp(val,0,.999)*ramp.length),c=ramp[k];if(c===' ')continue;g.fillStyle=pal[Math.floor(val*3)%3];g.fillText(c,i*cw,j*chh)}}
  else{var lines=['> '+String(P.text||'hello, world').split('\n').join('\n> ')].join('').split('\n'),cut=Math.floor(F.tb*7),shown=0,y0=Math.max(1,Math.floor(rows/2-lines.length/2));g.fillStyle='#00e436';lines.forEach(function(l,k){var part=l.slice(0,Math.max(0,cut-shown));shown+=l.length;var cur=(k===lines.length-1)&&(Math.floor(t*3)%2)?'█':'';g.fillText(part+cur,cw*2,(y0+k*2)*chh)});g.fillStyle='rgba(0,255,100,.05)';for(j=0;j<H;j+=3)g.fillRect(0,j,W,1)}
}

/* ================= CLAY ("clay") ================= */
function clayShape(x,y,w,h,r,col,sq){
  var c=hexRgb(col);g.save();g.translate(x,y);g.scale(1+.1*sq,1-.12*sq);
  g.shadowColor='rgba(60,30,90,.28)';g.shadowBlur=U*.08;g.shadowOffsetY=U*.05;g.fillStyle=col;rr(-w/2,-h/2,w,h,r);g.fill();g.shadowColor='transparent';
  var gr=g.createLinearGradient(-w/2,-h/2,w/2,h/2);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(40,10,70,.28)');g.fillStyle=gr;rr(-w/2,-h/2,w,h,r);g.fill();
  g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(-w*.22,-h*.28,w*.14,h*.07,-.5,0,6.2832);g.fill();g.restore();
}
function clayScene(v){
  var P=F.params||{},pal=P.palette||['#ff9ecf','#9be7ff','#ffe28a','#b8f2c9','#c9b6ff'],bgc=P.bg||'#f4e9ff',i;reset();g.fillStyle=bgc;g.fillRect(0,0,W,H);
  if(v==='text'){var str=String(P.text||'hello'),sz=fitSize(str,{font:'sans'},W*.82,U*.9);g.font=tyFont({font:'sans'},sz);g.textAlign='center';g.textBaseline='middle';var pop=easeBack(F.tb/.7)*(1+.04*F.k);g.save();g.translate(CX,CY);g.scale(pop,pop);
    g.fillStyle='rgba(60,30,90,.25)';g.fillText(str,U*.03,U*.06);g.fillStyle=pal[0];g.fillText(str,0,0);g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=Math.max(2,sz*.03);g.strokeText(str,-sz*.01,-sz*.015);g.restore();return}
  for(i=0;i<7;i++){var pop2=easeBack((F.tb-i*.35)/.6);if(pop2<=0)continue;var bx=CX+(i-3)*U*.34,by=CY+Math.sin(i*2.1)*U*.25-Math.abs(Math.sin(F.T*2.2+i))*U*.18,sz2=U*(.3+.1*(i%3)),sq=Math.pow(Math.abs(Math.sin(F.T*2.2+i)),8);
    g.save();g.translate(bx,by);g.scale(pop2,pop2);clayShape(0,0,sz2,sz2*(i%2?1.0:.8),i%3===0?sz2*.5:sz2*.28,pal[i%pal.length],sq);g.restore()}
}

/* ================= ORIGAMI ("origami") : boat, fold ================= */
function reflectPt(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy,t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L,fx=a[0]+t*dx,fy=a[1]+t*dy;return [2*fx-p[0],2*fy-p[1]]}
function origamiScene(v){
  var P=F.params||{},t=F.T,i;reset();var bgg=g.createLinearGradient(0,0,0,H);bgg.addColorStop(0,'#fdf3e0');bgg.addColorStop(1,'#f3d9b1');g.fillStyle=bgg;g.fillRect(0,0,W,H);
  if(v==='boat'){
    for(i=0;i<5;i++){var wy=H*(.62+i*.07);g.fillStyle=['#8ecae6','#6fb3d9','#4f9ac7','#3a82b3','#2b6a9a'][i];g.beginPath();g.moveTo(0,H);for(var x=0;x<=W;x+=8){g.lineTo(x,wy+Math.sin(x*.012+t*(1+i*.3)+i)*U*.03*(1+i*.2))}g.lineTo(W,H);g.closePath();g.fill()}
    var by=H*.6+Math.sin(t*1.4)*U*.03,rot=Math.sin(t*1.1)*.05,s=U*.8;g.save();g.translate(CX,by);g.rotate(rot);
    tri([-s*.55,0],[s*.55,0],[0,s*.28],'#e07a5f');tri([-s*.55,0],[0,-s*.0],[0,s*.28],'#c8553d');
    tri([0,-s*.8],[0,-s*.02],[s*.4,-s*.02],'#fffaf0');tri([0,-s*.8],[-s*.42,-s*.02],[0,-s*.02],'#efe3cc');
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;g.beginPath();ln(0,-s*.8,0,s*.28);g.stroke();g.restore();return;
  }
  var s2=U*1.05,A=[CX-s2/2,CY-s2/2],B=[CX+s2/2,CY-s2/2],C=[CX+s2/2,CY+s2/2],D=[CX-s2/2,CY+s2/2],ph=clamp(F.p*2.2,0,2.2),first=clamp(ph,0,1),second=clamp(ph-1,0,1);
  /* fold 1: lower-left triangle (A,D,C) folds over the diagonal A-C */
  var ang1=easeIO(first)*Math.PI,k1=(1-Math.cos(ang1))/2,fold=function(p,a,b,k){var r=reflectPt(p,a,b);return [p[0]+(r[0]-p[0])*k,p[1]+(r[1]-p[1])*k]};
  tri(A,B,C,'#e76f51');var D1=fold(D,A,C,k1);tri(A,D1,C,ang1>Math.PI/2?'#f4a261':'#e9c46a');
  if(second>0){var ang2=easeIO(second)*Math.PI,k2=(1-Math.cos(ang2))/2,M=[(A[0]+C[0])/2,(A[1]+C[1])/2],T2=fold(B,M,[M[0]+(C[1]-A[1]),M[1]-(C[0]-A[0])],k2);g.globalAlpha=.9;tri(M,T2,C,'#2a9d8f');g.globalAlpha=1}
  g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1.2;g.beginPath();ln(A[0],A[1],C[0],C[1]);g.stroke();
  if(P.text)txt(String(P.text),CX,H*.9,Math.max(14,U*.12),'#5a3a22','center',SERIF,'italic');
}

/* ================= LOW-POLY ("lowpoly") : terrain, orb ================= */
function lowpolyScene(v){
  var P=F.params||{},t=F.T,i,j;reset();var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,'#ffcf9e');sk.addColorStop(.6,'#ff8a6b');sk.addColorStop(1,'#3a1c4a');g.fillStyle=sk;g.fillRect(0,0,W,H);
  if(v==='orb'){
    var LA=9,LO=14,pts=[],yaw=t*.5,tilt=.35;for(i=0;i<=LA;i++){pts[i]=[];for(j=0;j<=LO;j++){var th=i/LA*Math.PI,ph=j/LO*6.2832,r=1+.08*Math.sin(th*5+ph*3+t),x=Math.sin(th)*Math.cos(ph)*r,y=Math.cos(th)*r,z=Math.sin(th)*Math.sin(ph)*r,cx2=x*Math.cos(yaw)-z*Math.sin(yaw),cz2=x*Math.sin(yaw)+z*Math.cos(yaw),cy2=y*Math.cos(tilt)-cz2*Math.sin(tilt),cz3=y*Math.sin(tilt)+cz2*Math.cos(tilt);pts[i][j]=[CX+cx2*U*.8,CY+cy2*U*.8,cz3,x,y,z]}}
    var quads=[];for(i=0;i<LA;i++)for(j=0;j<LO;j++)quads.push([i,j]);quads.sort(function(a,b){return (pts[a[0]][a[1]][2]+pts[a[0]+1][a[1]+1][2])-(pts[b[0]][b[1]][2]+pts[b[0]+1][b[1]+1][2])});
    var base=hexRgb(P.color||'#ff7b54');quads.forEach(function(q){var a=pts[q[0]][q[1]],b=pts[q[0]][q[1]+1],c=pts[q[0]+1][q[1]+1],d=pts[q[0]+1][q[1]];if((a[2]+b[2]+c[2]+d[2])<-.2)return;
      [[a,b,c],[a,c,d]].forEach(function(T,k){var nx=(T[0][3]+T[1][3]+T[2][3])/3,ny=(T[0][4]+T[1][4]+T[2][4])/3,nz=(T[0][5]+T[1][5]+T[2][5])/3,l=Math.max(0,(nx*Math.cos(yaw)*.5+ny*.7-nz*Math.sin(yaw)*.3))+.5+(k?.06:0);tri(T[0],T[1],T[2],rgbStr(base,Math.min(1.25,l)))})});return;
  }
  var GX=24,GZ=16,hs=[],cam=t*.25;for(j=0;j<=GZ;j++){hs[j]=[];for(i=0;i<=GX;i++)hs[j][i]=vnoise(i*.28+cam,j*.3+3)*1.4+vnoise(i*.7,j*.7+cam)*.3}
  function pr(i,j,h){var d=1.15+(j-(cam%1))*.5,x=CX+(i-GX/2)*U*.78/d,y=CY-U*.1+U*1.0/d-h*U*.75/d;return [x,y]}
  for(j=GZ-1;j>=0;j--)for(i=0;i<GX;i++){var p00=pr(i,j,hs[j][i]),p10=pr(i+1,j,hs[j][i+1]),p01=pr(i,j+1,hs[j+1][i]),p11=pr(i+1,j+1,hs[j+1][i+1]),h=(hs[j][i]+hs[j][i+1]+hs[j+1][i]+hs[j+1][i+1])/4,fog=clamp(j/GZ,0,1),pal=h<.45?[60,110,170]:h<.9?[90,150,100]:h<1.25?[140,120,100]:[240,240,250];
    var l1=.7+(hs[j][i]-hs[j][i+1])*.5,l2=.75+(hs[j][i+1]-hs[j+1][i+1])*.4;tri(p00,p10,p11,rgbStr(pal,l1*(1-fog*.5)+fog*.4));tri(p00,p11,p01,rgbStr(pal,l2*(1-fog*.5)+fog*.4))}
  g.fillStyle='#ffe3b3';g.globalAlpha=.9;circ(W*.72,H*.28,U*.22);g.fill();g.globalAlpha=1;
}

/* ================= VOXEL ("voxel") : island ================= */
function voxelScene(v){
  reset();var P=F.params||{},t=F.T,n=13,s=U*.2,i,j,cells=[];var bgg=g.createLinearGradient(0,0,0,H);bgg.addColorStop(0,'#bfe8ff');bgg.addColorStop(1,'#e8f6ff');g.fillStyle=bgg;g.fillRect(0,0,W,H);
  for(i=0;i<n;i++)for(j=0;j<n;j++){var dx=i-n/2+.5,dz=j-n/2+.5,d=Math.hypot(dx,dz),h=Math.round(Math.max(0,(vnoise(i*.45,j*.45)*3.2+1.8)-d*.38)),grow=easeBack((F.tb-d*.22)/.8);if(h<=0&&d>n*.33)continue;cells.push([i+j,dx,dz,h,Math.max(0,grow),d])}
  cells.sort(function(a,b){return a[0]-b[0]});
  cells.forEach(function(c){var h=c[3],wave=.06*Math.sin(t*2+c[1]+c[2]);if(h<=1){isoBlock(c[1],c[2],0,.98,.98,(1+wave)*c[4],[70,160,230],s)}
    else{for(var z=0;z<h;z++){var col=z>=4?[245,245,250]:z>=3?[130,130,140]:z>=2?[90,185,90]:[222,200,140];isoBlock(c[1],c[2],z*.5*c[4]*0+z*.5,.98,.98,.5*Math.min(1,c[4]*2),col,s)}
      if(h===2&&nHash(c[1]*9,c[2]*7)>.78&&c[4]>.9){isoBlock(c[1]+.35,c[2]+.35,h*.5,.25,.25,.7,[110,70,40],s);isoBlock(c[1]+.2,c[2]+.2,h*.5+.7,.55,.55,.55,[40,130,60],s)}}});
}

/* ================= MAP ("map") : route, timeline ================= */
function mapScene(v){
  var P=F.params||{},t=F.T,i;reset();
  if(v==='timeline'){
    g.fillStyle='#10162e';g.fillRect(0,0,W,H);var ev=P.events||[{label:'start',year:'2020'},{label:'growth',year:'2022'},{label:'now',year:'2026'}],n=ev.length,x0=W*.1,x1=W*.9,ly=CY;
    g.strokeStyle='rgba(243,234,217,.5)';g.lineWidth=Math.max(2,U*.012);g.beginPath();g.moveTo(x0,ly);g.lineTo(x0+(x1-x0)*easeOut(F.tb/Math.max(2,F.dur*.8)),ly);g.stroke();
    ev.forEach(function(e,k){var x=x0+(x1-x0)*(n===1?.5:k/(n-1)),st=(k+.3)*F.dur*.8/n,a=easeBack((F.tb-st)/.7);if(a<=0)return;var up=k%2===0,len=U*.4*a;g.strokeStyle=PAL.ember;g.lineWidth=Math.max(2,U*.012);g.beginPath();g.moveTo(x,ly);g.lineTo(x,ly+(up?-len:len));g.stroke();g.fillStyle=PAL.ember;circ(x,ly,U*.05*a);g.fill();
      txt(String(e.year||''),x,ly+(up?-len-U*.1:len+U*.1),Math.max(12,U*.12*a),PAL.bone,'center',SERIF,'italic');txt(String(e.label||''),x,ly+(up?-len-U*.26:len+U*.26),Math.max(9,U*.075),'rgba(243,234,217,.7)','center',MONO)});
    return;
  }
  g.fillStyle='#efe7d2';g.fillRect(0,0,W,H);g.strokeStyle='rgba(120,110,90,.35)';g.lineWidth=Math.max(1.5,U*.01);g.beginPath();for(i=-6;i<14;i++){var gx=i*U*.35;ln(gx,0,gx+H*.3,H);ln(0,i*U*.35,W,i*U*.35-H*.15)}g.stroke();
  g.fillStyle='#bfe0c0';[[.2,.3,.5],[.75,.7,.65],[.55,.2,.35]].forEach(function(p){g.beginPath();g.ellipse(W*p[0],H*p[1],U*p[2],U*p[2]*.6,.3,0,6.2832);g.fill()});
  g.strokeStyle='#9fd3f0';g.lineWidth=U*.13;g.beginPath();for(var x=0;x<=W;x+=10){var y=H*.55+Math.sin(x*.006)*U*.45;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
  var A=[W*.18,H*.7],B=[W*.84,H*.28],C1=[W*.4,H*.2],C2=[W*.6,H*.8],pr=easeIO(clamp(F.tb/Math.max(2,F.dur*.8),0,1));
  function bz(u){var m=1-u;return [m*m*m*A[0]+3*m*m*u*C1[0]+3*m*u*u*C2[0]+u*u*u*B[0],m*m*m*A[1]+3*m*m*u*C1[1]+3*m*u*u*C2[1]+u*u*u*B[1]]}
  g.strokeStyle='#e63946';g.lineWidth=Math.max(4,U*.035);g.lineCap='round';g.beginPath();for(i=0;i<=60;i++){var q=bz(pr*i/60);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])}g.stroke();
  var hd=bz(pr);g.fillStyle='#fff';g.strokeStyle='#e63946';g.lineWidth=Math.max(3,U*.02);circ(hd[0],hd[1],U*.05);g.fill();g.stroke();
  function pin(p,lab,col){g.fillStyle=col;g.strokeStyle='#111';g.lineWidth=Math.max(2,U*.012);g.beginPath();g.arc(p[0],p[1]-U*.12,U*.09,Math.PI*.85,Math.PI*2.15);g.lineTo(p[0],p[1]);g.closePath();g.fill();g.stroke();g.fillStyle='#fff';circ(p[0],p[1]-U*.12,U*.035);g.fill();txt(lab,p[0],p[1]+U*.1,Math.max(11,U*.09),'#111','center',SANS,'800')}
  pin(A,P.from||'A','#2a9d8f');pin(B,P.to||'B','#e63946');
  if(P.distance)txt(String(P.distance),CX,H*.2,Math.max(16,U*.2),'#111','center',SERIF,'italic');
}

/* ================= MULTIPLANE GLASS DEPTH ("multiplane") ================= */
function multiplaneScene(v){
  var P=F.params||{},pal=P.palette||{},t=F.T,i,L;reset();var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,pal.sky||'#cfe3df');sk.addColorStop(1,pal.low||'#f2eadb');g.fillStyle=sk;g.fillRect(0,0,W,H);
  var cols=pal.layers||['#9db8b0','#7a9b92','#557a72','#355c55','#1d3a35'],N=cols.length;
  g.globalAlpha=.35;g.fillStyle='#fff7d6';for(i=0;i<4;i++){var sx=W*(.2+i*.2)+Math.sin(t*.2+i)*U*.1;g.beginPath();g.moveTo(sx,0);g.lineTo(sx+U*.35,0);g.lineTo(sx+U*.9,H);g.lineTo(sx+U*.3,H);g.closePath();g.fill()}g.globalAlpha=1;
  for(L=0;L<N;L++){var depth=(L+1)/N,shift=-(t*U*.06*depth*depth)+U*.1*depth,cnt=8+L*3;g.fillStyle=cols[L];g.shadowColor=cols[L];g.shadowBlur=U*.04*(1-depth);
    for(i=0;i<cnt;i++){var bx=((nHash(i,L+10)*1.4-.2)*W+shift+W*3)%(W*1.4)-W*.2,w=U*(.05+depth*.1)*(.7+nHash(i,L)*.6),h=H*(.35+depth*.55)*(.7+nHash(i,L+3)*.5),sway=Math.sin(t*.8+i+L)*U*.01*depth;
      g.beginPath();g.moveTo(bx-w/2,H);g.lineTo(bx-w*.35+sway,H-h);g.lineTo(bx+w*.35+sway,H-h);g.lineTo(bx+w/2,H);g.closePath();g.fill();
      if(L<N-1){g.beginPath();g.ellipse(bx+sway,H-h,w*(1.8+depth),h*.15,0,0,6.2832);g.fill()}}
    g.shadowBlur=0;var mg=g.createLinearGradient(0,H*.45,0,H*.8);mg.addColorStop(0,'rgba(242,234,219,0)');mg.addColorStop(.5,'rgba(242,234,219,'+(.25-L*.03)+')');mg.addColorStop(1,'rgba(242,234,219,0)');g.fillStyle=mg;g.fillRect(0,H*.4,W,H*.45)}
  g.fillStyle='#fff7d6';for(i=0;i<14;i++){var lx=((nHash(i,40)*W+t*U*.1*(.4+nHash(i,41)))%(W+40))-20,ly=((nHash(i,42)*H+t*U*.18*(.5+nHash(i,43)))%H);g.globalAlpha=.4+.3*Math.sin(t+i);g.beginPath();g.ellipse(lx,ly,U*.012,U*.006,t+i,0,6.2832);g.fill()}g.globalAlpha=1;
  var vg=g.createRadialGradient(CX,CY,U*.7,CX,CY,Math.max(W,H)*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(30,40,30,.35)');g.fillStyle=vg;g.fillRect(0,0,W,H);
}

/* ================= STOP-MOTION BOIL ("stopmo") ================= */
function stopmoScene(v){
  var P=F.params||{},bg=P.background||['paper','land1'],fps=P.fps||8,step=1/fps,qT=Math.floor(F.T/step)*step,seed=Math.floor(F.T/step);
  var oT=F.T,oTb=F.tb;F.T=qT;F.tb=oTb-(oT-qT)/SPB;
  if(DRAW[bg[0]]&&bg[0]!=='stopmo')DRAW[bg[0]](bg[1]);else{reset();g.fillStyle='#ddd';g.fillRect(0,0,W,H)}
  F.T=oT;F.tb=oTb;reset();
  var cw=cv.width,ch=cv.height;if(GT.width!==cw||GT.height!==ch){GT.width=cw;GT.height=ch}GTX.setTransform(1,0,0,1,0,0);GTX.globalCompositeOperation='copy';GTX.drawImage(cv,0,0);
  var jx=(nHash(seed,1)-.5)*U*.02*(P.boil||1),jy=(nHash(seed,2)-.5)*U*.02*(P.boil||1),jr=(nHash(seed,3)-.5)*.012*(P.boil||1);
  g.save();g.setTransform(1,0,0,1,0,0);g.translate(cw/2,ch/2);g.rotate(jr);g.scale(1.03,1.03);g.drawImage(GT,-cw/2+jx*DPR,-ch/2+jy*DPR);g.restore();
  g.globalAlpha=.1;g.fillStyle='#704d2b';for(var i=0;i<60;i++){g.fillRect(nHash(seed,i+5)*W,nHash(seed,i+99)*H,U*.02,U*.003)}g.globalAlpha=1;
}
