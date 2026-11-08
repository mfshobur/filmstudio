
/* ================= IMPORTED IMAGES ("image") : kenburns, pop, polaroid, cutout, logo ================= */
/* params: {src, data (filled at build time), caption?, bg?: "#hex" | [style,variant], pan?: left|right|up|down} */
var IMGS={};
function imgFor(P){var k=P.src||'?';if(!IMGS[k]){var o={ok:0,im:new Image()};o.im.onload=function(){o.ok=1};o.im.onerror=function(){o.ok=-1};o.im.src=P.data||P.src||'';IMGS[k]=o}return IMGS[k]}
function imgFit(o,bw,bh,cover){var iw=o.im.naturalWidth||1,ih=o.im.naturalHeight||1,s=cover?Math.max(bw/iw,bh/ih):Math.min(bw/iw,bh/ih);return {w:iw*s,h:ih*s}}
function imgCaption(P){if(P.caption){var sz=Math.max(13,U*.13),a=clamp((F.tb-1)/1,0,1);g.globalAlpha=a;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,H*.78,W,H*.12);txt(String(P.caption),CX,H*.84,sz,'#fff','center',SERIF,'italic');g.globalAlpha=1}}
function imageScene(v){
  var P=F.params||{},o=imgFor(P),bg=P.bg;reset();
  if(Array.isArray(bg)&&DRAW[bg[0]]&&bg[0]!=='image'){DRAW[bg[0]](bg[1]);reset()}else{g.fillStyle=(typeof bg==='string'&&bg)||(v==='polaroid'||v==='cutout'?'#e8dcc4':'#0c1024');g.fillRect(0,0,W,H)}
  if(o.ok!==1){txt(o.ok<0?'image failed to load':'loading image...',CX,CY,Math.max(12,U*.1),'rgba(255,255,255,.6)','center',MONO);return}
  var t=F.T,p=F.p;
  if(v==='kenburns'){
    var f=imgFit(o,W,H,true),z=1.0+.2*easeIO(p),pan=P.pan||'left',dx=(pan==='left'?-1:pan==='right'?1:0)*(f.w*z-W)/2*(1-2*easeIO(p))*.8,dy=(pan==='up'?-1:pan==='down'?1:0)*(f.h*z-H)/2*(1-2*easeIO(p))*.8;
    g.drawImage(o.im,CX-f.w*z/2+dx,CY-f.h*z/2+dy,f.w*z,f.h*z);
    var vg=g.createRadialGradient(CX,CY,U*.6,CX,CY,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  }else if(v==='pop'){
    var f2=imgFit(o,W*.78,H*.62,false),pp=easeBack(F.tb/.7),fl=Math.sin(t*1.6)*U*.02;g.save();g.translate(CX,CY+fl);g.scale(pp,pp);g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=U*.12;g.shadowOffsetY=U*.06;rr(-f2.w/2,-f2.h/2,f2.w,f2.h,U*.05);g.save();g.clip();g.drawImage(o.im,-f2.w/2,-f2.h/2,f2.w,f2.h);g.restore();g.restore();
  }else if(v==='polaroid'){
    var f3=imgFit(o,W*.5,H*.48,true),fw=f3.w+U*.18,fh=f3.h+U*.42,rot=-.07+Math.sin(t*.9)*.015,pp3=easeBack(F.tb/.7);
    g.save();g.translate(CX,CY);g.rotate(rot);g.scale(pp3,pp3);g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=U*.1;g.shadowOffsetY=U*.05;g.fillStyle='#fffdf7';g.fillRect(-fw/2,-fh/2,fw,fh);g.shadowColor='transparent';
    g.save();g.beginPath();g.rect(-f3.w/2,-fh/2+U*.09,f3.w,f3.h);g.clip();var cf=imgFit(o,f3.w,f3.h,true);g.drawImage(o.im,-cf.w/2,-fh/2+U*.09+f3.h/2-cf.h/2,cf.w,cf.h);g.restore();
    if(P.caption)txt(String(P.caption),0,fh/2-U*.15,Math.max(12,U*.12),'#33261a','center',SERIF,'italic');g.fillStyle='rgba(255,230,150,.75)';g.fillRect(-U*.18,-fh/2-U*.05,U*.36,U*.1);g.restore();return;
  }else if(v==='cutout'){
    var f4=imgFit(o,W*.62,H*.6,false),pp4=easeBack(F.tb/.7),rot4=.04+Math.sin(t*.8)*.01;g.save();g.translate(CX,CY);g.rotate(rot4);g.scale(pp4,pp4);
    g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=U*.08;g.shadowOffsetX=U*.04;g.shadowOffsetY=U*.06;g.fillStyle='#fff';g.fillRect(-f4.w/2-U*.05,-f4.h/2-U*.05,f4.w+U*.1,f4.h+U*.1);g.shadowColor='transparent';g.drawImage(o.im,-f4.w/2,-f4.h/2,f4.w,f4.h);g.restore();
  }else{ /* logo */
    var f5=imgFit(o,W*.5,H*.4,false),pp5=easeOut(F.tb/.8)*(1+.03*F.k);g.save();g.translate(CX,CY);g.scale(pp5,pp5);g.shadowColor='rgba(255,255,255,'+(.25+.25*F.k)+')';g.shadowBlur=U*.2;g.drawImage(o.im,-f5.w/2,-f5.h/2,f5.w,f5.h);g.restore();
  }
  imgCaption(P);
}
