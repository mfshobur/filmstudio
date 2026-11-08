
/* ================= STYLE: SHADOW PUPPETS ("shadow") ================= */
/* Inspired by wayang kulit (Indonesia) and Lotte Reiniger's silhouette films. Black cut-out figures with pierced ornament
   in front of a lamp-lit screen. params: {tone:"warm|cool|red", puppets:[{kind,x,y,scale,flip,move:"sway|walk|bow",walkTo}], title?} */
var PUP=document.createElement('canvas'),PG=PUP.getContext('2d');
function pPoly(pts,s){PG.beginPath();pts.forEach(function(p,i){i?PG.lineTo(p[0]*s,p[1]*s):PG.moveTo(p[0]*s,p[1]*s)});PG.closePath();PG.fill()}
function pHole(x,y,r,s){PG.beginPath();PG.arc(x*s,y*s,Math.max(.8,r*s),0,6.2832);PG.fill()}
function pHoles(x0,y0,x1,y1,dx,dy,r,s,shape){for(var y=y0;y<=y1;y+=dy)for(var x=x0+((Math.round((y-y0)/dy)%2)?dx/2:0);x<=x1;x+=dx)pHole(x,y,r,s)}
function pArm(sx,sy,a1,l1,a2,l2,s,w){var ex=sx+Math.sin(a1)*l1,ey=sy+Math.cos(a1)*l1,fx=ex+Math.sin(a2)*l2,fy=ey+Math.cos(a2)*l2;PG.lineCap='round';PG.lineJoin='round';PG.lineWidth=w*s;PG.beginPath();PG.moveTo(sx*s,sy*s);PG.lineTo(ex*s,ey*s);PG.lineTo(fx*s,fy*s);PG.stroke();pHoleFill(fx,fy,w*.9,s);return [fx,fy]}
function pHoleFill(x,y,r,s){PG.beginPath();PG.arc(x*s,y*s,r*s,0,6.2832);PG.fill()}
/* draws puppet of height h (px) onto PUP; feet at bottom-center. returns {w,h} */
function buildPuppet(kind,h,t,move){
  var s=h,cw=Math.ceil(h*1.1),ch=Math.ceil(h*1.12);if(PUP.width!==cw||PUP.height!==ch){PUP.width=cw;PUP.height=ch}
  PG.setTransform(1,0,0,1,0,0);PG.clearRect(0,0,cw,ch);PG.globalCompositeOperation='source-over';PG.fillStyle='#050302';PG.strokeStyle='#050302';
  PG.translate(cw*.5,ch*.99);
  var sw=Math.sin(t*(move==='walk'?6:2.2)),bob=move==='walk'?Math.abs(Math.cos(t*6))*.012:Math.sin(t*2.2)*.004;
  if(kind==='hero'||kind==='demon'){
    var dm=kind==='demon',k=dm?1.12:1;
    PG.save();PG.translate(0,-bob*s);
    /* legs and feet */
    pPoly([[-.06,-.07],[.0,-.07],[.0,-.0],[-.1,.0],[-.12,-.02]],s);pPoly([[.02,-.07],[.09,-.07],[.15,-.015],[.15,0],[.03,0]],s);
    /* kain (skirt) */
    pPoly([[-.11,-.55],[.11,-.55],[.17,-.2],[.15,-.07],[-.13,-.07],[-.17,-.2]],s);
    /* torso + sash */
    pPoly([[-.09,-.8],[.1,-.8],[.115,-.55],[-.1,-.55]],s);
    /* neck + head (profile facing right) */
    pPoly([[-.025,-.86],[.035,-.86],[.04,-.79],[-.03,-.79]],s);
    pPoly([[-.05,-.86],[-.055,-.93],[-.02,-.965],[.04,-.965],[.075,-.94],[.1,-.915],[.145*k,-.9],[.105,-.885],[.1,-.87],[.07,-.855],[.05,-.85],[0,-.85]],s);
    /* crown */
    var cr=dm?[[-.07,-.945],[-.09,-1.04],[-.045,-1.0],[-.03,-1.09],[0,-1.03],[.03,-1.1],[.045,-1.0],[.085,-1.05],[.075,-.945]]:[[-.065,-.95],[-.055,-1.02],[-.02,-1.0],[0,-1.07],[.025,-1.0],[.055,-1.03],[.065,-.95]];
    pPoly(cr,s);
    /* back arm (static) + front arm (animated) with pointer stick */
    var base=move==='bow'?.9:.0;
    pArm(-.05,-.78,-.55+sw*.05,.17,.35,.15,s,.018);
    var hand=pArm(.07,-.78,1.15+sw*.15+base,.18,.7+sw*.2,.16,s,.018);
    PG.lineWidth=.008*s;PG.beginPath();PG.moveTo(hand[0]*s,hand[1]*s);PG.lineTo((hand[0]+.06)*s,(hand[1]+.28)*s);PG.stroke();
    /* pierced ornament (holes cut out) */
    PG.globalCompositeOperation='destination-out';
    pHole(.075,-.915,.011,s);                                   /* eye */
    pHoles(-.14,-.5,.14,-.12,.04,.05,.009,s);                   /* kain pattern */
    pHoles(-.07,-.78,.08,-.58,.035,.045,.007,s);                /* torso */
    pHoles(-.05,-1.0,.05,-.97,.03,.03,.007,s);                  /* crown */
    PG.beginPath();PG.moveTo(-.1*s,-.57*s);PG.lineTo(.115*s,-.64*s);PG.lineTo(.115*s,-.61*s);PG.lineTo(-.1*s,-.54*s);PG.fill();
    PG.globalCompositeOperation='source-over';
    PG.restore();
  }else if(kind==='clown'){ /* punakawan (Semar-like): round belly, short */
    PG.save();PG.translate(0,-bob*s);
    pPoly([[-.05,-.04],[.0,-.04],[.0,0],[-.08,0]],s);pPoly([[.02,-.04],[.07,-.04],[.11,0],[.02,0]],s);
    PG.beginPath();PG.ellipse(0,-.25*s,.15*s,.2*s,0,0,6.2832);PG.fill();
    PG.beginPath();PG.ellipse(.0,-.52*s,.085*s,.1*s,0,0,6.2832);PG.fill();
    pPoly([[.05,-.55],[.12,-.52],[.075,-.49]],s);
    pArm(-.04,-.4,.5+sw*.1,.1,.2,.09,s,.022);pArm(.05,-.4,-.4+sw*.2,.1,-.5,.09,s,.022);
    PG.globalCompositeOperation='destination-out';pHole(.04,-.54,.009,s);pHoles(-.1,-.35,.1,-.08,.04,.05,.008,s);PG.globalCompositeOperation='source-over';
    PG.restore();
  }else if(kind==='gunungan'){ /* tree of life */
    var sy=Math.sin(t*1.6)*.015;
    PG.save();PG.translate(sy*s,0);
    PG.beginPath();PG.moveTo(0,-.98*s);PG.bezierCurveTo(.32*s,-.7*s,.34*s,-.3*s,.2*s,0);PG.lineTo(-.2*s,0);PG.bezierCurveTo(-.34*s,-.3*s,-.32*s,-.7*s,0,-.98*s);PG.fill();
    PG.globalCompositeOperation='destination-out';
    PG.beginPath();PG.moveTo(0,-.12*s);PG.lineTo(.09*s,-.12*s);PG.lineTo(.09*s,-.3*s);PG.lineTo(-.09*s,-.3*s);PG.lineTo(-.09*s,-.12*s);PG.fill();
    for(var i=0;i<6;i++){var yy=-.42-i*.095,lw=.13-i*.016;PG.beginPath();PG.ellipse(-lw*s*.8,yy*s,lw*s*.35,.03*s,-.5,0,6.2832);PG.fill();PG.beginPath();PG.ellipse(lw*s*.8,yy*s,lw*s*.35,.03*s,.5,0,6.2832);PG.fill();pHole(0,yy,.011,s)}
    PG.globalCompositeOperation='source-over';PG.restore();
  }else if(kind==='bird'){
    var fl=Math.sin(t*7)*.22;PG.save();PG.translate(0,-.5*s);
    PG.beginPath();PG.ellipse(0,0,.09*s,.045*s,0,0,6.2832);PG.fill();pPoly([[.07,-.01],[.15,-.03],[.075,.025]],s);
    PG.beginPath();PG.moveTo(-.02*s,-.01*s);PG.quadraticCurveTo(-.05*s,(-.2-fl)*s,.1*s,(-.15-fl)*s);PG.quadraticCurveTo(.03*s,(-.06)*s,.03*s,-.01*s);PG.fill();
    PG.beginPath();PG.moveTo(-.08*s,0);PG.lineTo(-.22*s,.03*s);PG.lineTo(-.08*s,.03*s);PG.fill();PG.restore();
  }else if(kind==='tree'){
    PG.fillRect(-.012*s,-.55*s,.024*s,.55*s);
    for(var j=0;j<7;j++){var a=-1.3+j*.43,l=.22+(j%2)*.08;PG.lineWidth=.012*s;PG.beginPath();PG.moveTo(0,-.5*s);PG.quadraticCurveTo(Math.sin(a)*l*.5*s,-(.5+Math.cos(a)*l*.5)*s,Math.sin(a)*l*s,-(.5+Math.cos(a)*l)*s);PG.stroke();PG.beginPath();PG.ellipse(Math.sin(a)*l*s,-(.5+Math.cos(a)*l)*s,.05*s,.03*s,a,0,6.2832);PG.fill()}
    PG.beginPath();PG.ellipse(0,-.72*s,.2*s,.17*s,0,0,6.2832);PG.fill();
  }else if(kind==='mountain'){
    PG.beginPath();PG.moveTo(-.55*s,0);PG.lineTo(-.18*s,-.62*s);PG.lineTo(-.05*s,-.45*s);PG.lineTo(.12*s,-.8*s);PG.lineTo(.5*s,0);PG.fill();
  }else if(kind==='house'){ /* joglo-like roof */
    PG.fillRect(-.22*s,-.2*s,.44*s,.2*s);pPoly([[-.32,-.2],[-.12,-.42],[.12,-.42],[.32,-.2]],s);pPoly([[-.18,-.42],[-.06,-.56],[.06,-.56],[.18,-.42]],s);pPoly([[-.012,-.56],[.012,-.56],[0,-.66]],s);
    PG.globalCompositeOperation='destination-out';pHole(-.1,-.1,.02,s);pHole(.1,-.1,.02,s);pHoles(-.14,-.38,.14,-.3,.04,.04,.006,s);PG.globalCompositeOperation='source-over';
  }else{ /* deer */
    PG.beginPath();PG.ellipse(0,-.28*s,.17*s,.08*s,0,0,6.2832);PG.fill();pPoly([[.12,-.3],[.2,-.5],[.25,-.48],[.22,-.34]],s);PG.beginPath();PG.ellipse(.24*s,-.5*s,.045*s,.03*s,.3,0,6.2832);PG.fill();
    [-.13,-.07,.08,.14].forEach(function(lx,i){PG.fillRect((lx-.008)*s,-.25*s,.016*s,.25*s+Math.sin(t*5+i)*.01*s)});
    PG.lineWidth=.008*s;PG.beginPath();PG.moveTo(.25*s,-.54*s);PG.lineTo(.22*s,-.68*s);PG.lineTo(.27*s,-.62*s);PG.moveTo(.22*s,-.68*s);PG.lineTo(.17*s,-.62*s);PG.stroke();
  }
  return {w:cw,h:ch};
}
function shadowScene(v){
  var P=F.params||{},tone=P.tone||'warm',cols={warm:['#ffd58a','#e0852f','#3b1a08'],cool:['#cfe6ff','#5b8bd0','#0c1630'],red:['#ffb08a','#c8442b','#2a0a08']}[tone]||[];
  var fl=1+Math.sin(F.T*11)*.025+Math.sin(F.T*23.7)*.018;
  reset();g.fillStyle=cols[2];g.fillRect(0,0,W,H);
  var lamp=[CX,H*.12],gr=g.createRadialGradient(lamp[0],lamp[1],0,lamp[0],lamp[1],Math.max(W,H)*.95*fl);gr.addColorStop(0,cols[0]);gr.addColorStop(.35,cols[1]);gr.addColorStop(1,cols[2]);g.fillStyle=gr;g.fillRect(0,0,W,H);
  /* cloth weave */
  g.globalAlpha=.07;g.strokeStyle='#000';g.lineWidth=1;g.beginPath();for(var x=0;x<W;x+=5){ln(x,0,x,H)}for(var y=0;y<H;y+=5){ln(0,y,W,y)}g.stroke();g.globalAlpha=1;
  var ground=CY+U*(P.ground==null?.62:P.ground),puppets=P.puppets||[];
  if(v==='gunungan'&&!puppets.length)puppets=[{kind:'gunungan',x:0,scale:1.15}];
  puppets.forEach(function(pp,i){
    var h=U*1.12*(pp.scale||1)*(pp.kind==='mountain'?1.3:pp.kind==='bird'?.6:1),x=CX+(pp.x||0)*U,x2=pp.walkTo==null?x:CX+pp.walkTo*U,px=cLerp(x,x2,pp.walkTo==null?0:easeIO(F.p)),move=pp.move||(pp.walkTo!=null?'walk':'sway');
    buildPuppet(pp.kind||'hero',h,F.T+i*.9,move);
    var py=ground+(pp.y||0)*U-(pp.kind==='bird'?U*.9+Math.sin(F.T*2+i)*U*.1:0);
    g.save();g.translate(px,py);if(pp.flip||(pp.walkTo!=null&&pp.walkTo<(pp.x||0)))g.scale(-1,1);
    g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=Math.max(2,U*.03);g.drawImage(PUP,-PUP.width/2,-PUP.height*.99);g.restore();
  });
  /* banana-trunk base (gedebog) */
  g.fillStyle='#0b0503';g.fillRect(0,ground,W,H-ground);var tg=g.createLinearGradient(0,ground,0,ground+U*.12);tg.addColorStop(0,'rgba(255,200,120,.35)');tg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=tg;g.fillRect(0,ground,W,U*.12);
  /* lamp flame + edge vignette */
  g.globalCompositeOperation='lighter';g.globalAlpha=.55*fl;g.drawImage(glowWarm,lamp[0]-U*.5,lamp[1]-U*.5,U,U);reset();
  var vg=g.createRadialGradient(CX,CY,U*.6,CX,CY,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  if(P.title){txt(P.title,CX,ground+U*.17,Math.max(14,U*.15),'rgba(255,220,170,.85)','center',SERIF,'italic')}
}
