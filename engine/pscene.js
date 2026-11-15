
/* ================= CUSTOM SCENES ("scene") =================
   A scene is code an agent writes for one beat of the script: [startBar, endBar, "scene", "<name>", {params}] runs
   scenes/<name>.js. The file registers an object with `scene({ look, setup(c), draw(c) })`; draw runs every frame and
   must be a pure function of c.t (seconds into the shot) so preview, scrubbing and MP4 export give identical frames.
   Everything below is the kit those files draw with (`c` in draw). Names here are prefixed sc/SC_ to stay clear of the other styles. */
var SC_LOOKS={},SC_RIGS={},SC_PATHS={},SC_DEFS={},SC_C={},SC_ASSETS={},SC_OFF={};
function scLook(name,o){o.name=name;SC_LOOKS[name]=o;return o}
function scGetLook(name){return SC_LOOKS[name]||(typeof SC_USER_LOOKS!=='undefined'&&SC_USER_LOOKS[name])||SC_LOOKS.plain||{name:'plain',pal:{bg:'#0b1020',ink:'#f3ead9',main:'#ffae5c',accent:'#86e6ff'}}}

/* ---- maths ---- */
var SC_EASE={
  linear:function(t){return clamp(t,0,1)},in:easeIn,out:easeOut,io:easeIO,back:easeBack,
  sine:function(t){t=clamp(t,0,1);return .5-.5*Math.cos(Math.PI*t)},
  expo:function(t){t=clamp(t,0,1);return t>=1?1:1-Math.pow(2,-10*t)},
  quad:function(t){t=clamp(t,0,1);return t*t},
  elastic:function(t){t=clamp(t,0,1);if(t===0||t===1)return t;return Math.pow(2,-10*t)*Math.sin((t*10-.75)*(2*Math.PI/3))+1},
  bounce:function(t){t=clamp(t,0,1);var n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375}t-=2.625/d;return n*t*t+.984375},
  steps:function(t){return Math.floor(clamp(t,0,1)*4)/4}
};
function scHash(x,y,z){var h=(x*374761393+y*668265263+z*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296}
function scNoise(x,y,z){
  x=x||0;y=y||0;z=z||0;var xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  function L(a,b,t){return a+(b-a)*t}
  return L(L(L(scHash(xi,yi,zi),scHash(xi+1,yi,zi),u),L(scHash(xi,yi+1,zi),scHash(xi+1,yi+1,zi),u),v),L(L(scHash(xi,yi,zi+1),scHash(xi+1,yi,zi+1),u),L(scHash(xi,yi+1,zi+1),scHash(xi+1,yi+1,zi+1),u),v),w);
}
/* keyframes: scTween(t,[[0,0],[1,10,'out'],[2,0]]) -> value (numbers, or arrays of numbers). The ease on a key shapes the segment that ends at it. */
function scTween(t,keys,ease){
  if(!keys||!keys.length)return 0;if(t<=keys[0][0])return keys[0][1];
  for(var i=1;i<keys.length;i++){
    if(t<=keys[i][0]){
      var a=keys[i-1],b=keys[i],u=(t-a[0])/Math.max(1e-9,b[0]-a[0]),e=SC_EASE[b[2]||ease||'linear']||SC_EASE.linear;u=e(u);
      if(Array.isArray(a[1]))return a[1].map(function(x,k){return x+(b[1][k]-x)*u});
      return a[1]+(b[1]-a[1])*u;
    }
  }
  return keys[keys.length-1][1];
}
function scP2D(d){return d instanceof Path2D?d:(SC_PATHS[d]||(SC_PATHS[d]=new Path2D(d)))}
function scFont(f){return f==='serif'?SERIF:f==='sans'?SANS:f==='mono'||!f?MONO:f}
/* paint the current path (or a Path2D) with an options object: {fill,stroke,lw,alpha,blend,dash,rule,shadow:[color,blur,dx,dy]} */
function scCol(v){
  if(typeof v!=='string'||v.charAt(0)!=='@')return v;
  var r=v.slice(1),col=SC_C.pal&&SC_C.pal[r];
  if(!col)throw new Error("colour role '@"+r+"' is not defined in the look '"+(SC_C.look&&SC_C.look.name)+"' (it has: "+Object.keys(SC_C.pal||{}).join(', ')+"). Use a role it has, or a plain colour.");
  return col;
}
function scPaint(path,o){
  o=o||{};var a0=g.globalAlpha,c0=g.globalCompositeOperation;
  if(o.alpha!=null)g.globalAlpha=a0*o.alpha;if(o.blend)g.globalCompositeOperation=o.blend;
  if(o.shadow){g.shadowColor=scCol(o.shadow[0]);g.shadowBlur=o.shadow[1]||0;g.shadowOffsetX=o.shadow[2]||0;g.shadowOffsetY=o.shadow[3]||0}
  if(o.fill){g.fillStyle=scCol(o.fill);if(path)g.fill(path,o.rule||'nonzero');else g.fill(o.rule||'nonzero')}
  if(o.shadow){g.shadowColor='rgba(0,0,0,0)';g.shadowBlur=0}
  if(o.stroke){g.strokeStyle=scCol(o.stroke);g.lineWidth=o.lw||2;if(o.dash)g.setLineDash(o.dash);if(path)g.stroke(path);else g.stroke();if(o.dash)g.setLineDash([])}
  g.globalAlpha=a0;g.globalCompositeOperation=c0;
}
function scAt(x,y,o,fn){
  if(typeof o==='function'){fn=o;o={}}o=o||{};g.save();g.translate(x,y);
  if(o.rot)g.rotate(o.rot*Math.PI/180);var sx=(o.sx!=null?o.sx:(o.s!=null?o.s:1)),sy=(o.sy!=null?o.sy:(o.s!=null?o.s:1));if(o.flip)sx=-sx;g.scale(sx,sy);
  if(o.alpha!=null)g.globalAlpha*=o.alpha;fn();g.restore();
}
/* perforation generators (return SVG path text; add them to a part's path and fill with rule 'evenodd' to cut holes) */
var SC_HOLES={
  circle:function(x,y,r){return'M'+(x-r)+' '+y+'a'+r+' '+r+' 0 1 0 '+2*r+' 0a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0Z'},
  diamond:function(x,y,r){return'M'+x+' '+(y-r)+'L'+(x+r)+' '+y+'L'+x+' '+(y+r)+'L'+(x-r)+' '+y+'Z'},
  dots:function(x,y,w,h,r,gap){var d='',i,j,s=r*2+gap;for(j=0;j*s<=h-r*2;j++)for(i=0;i*s<=w-r*2;i++)d+=SC_HOLES.circle(x+r+i*s,y+r+j*s,r);return d},
  diamonds:function(x,y,w,h,r,gap){var d='',i,j,s=r*2+gap;for(j=0;j*s<=h-r*2;j++)for(i=0;i*s<=w-r*2;i++)d+=SC_HOLES.diamond(x+r+i*s+(j%2?s/2:0),y+r+j*s,r);return d},
  slits:function(x,y,w,h,sw,gap){var d='',i,s=sw+gap;for(i=0;i*s<=w-sw;i++)d+='M'+(x+i*s)+' '+y+'h'+sw+'v'+h+'h'+(-sw)+'Z';return d},
  scallops:function(x,y,w,r,rows){var d='',i,j,s=r*2;for(j=0;j<(rows||1);j++)for(i=0;i*s<=w-s;i++)d+=SC_HOLES.circle(x+r+i*s+(j%2?r:0),y+r+j*r*1.4,r*.7);return d}
};
/* ---- puppet rigs: parts drawn in rest-pose coordinates, each rotating about its own pivot, children following their parent ----
   scRig('rabbit',{ parts:[{id:'body',d:'M..Z',fill:'#000'},{id:'arm',parent:'body',pivot:[x,y],d:'M..Z',behind:true}], pose:{arm:0} })
   c.rig('rabbit').pose({arm:-30}).draw(x,y,scale,flip)   (angles in degrees; pose values may also be {r,x,y,s}) */
function scRig(name,def){SC_RIGS[name]=def;return def}
function scRigDraw(def,pose,x,y,s,flip,opts){
  var parts=def.parts||[],byId={},kids={},roots=[],i;
  for(i=0;i<parts.length;i++){byId[parts[i].id]=parts[i];if(parts[i].parent){(kids[parts[i].parent]=kids[parts[i].parent]||[]).push(parts[i])}else roots.push(parts[i])}
  function one(p,col){
    var po=pose[p.id],r=0,ox=0,oy=0,ps=1;
    if(typeof po==='number')r=po;else if(po){r=po.r||0;ox=po.x||0;oy=po.y||0;ps=po.s!=null?po.s:1}
    var pv=p.pivot||[0,0],ch=kids[p.id]||[],k;
    g.save();g.translate(pv[0]+ox,pv[1]+oy);if(r)g.rotate(r*Math.PI/180);if(ps!==1)g.scale(ps,ps);g.translate(-pv[0],-pv[1]);
    for(k=0;k<ch.length;k++)if(ch[k].behind)one(ch[k]);
    if(p.d){
      var d=p.d;if(p.holes)d+=' '+(Array.isArray(p.holes)?p.holes.join(' '):p.holes);
      var path=scP2D(d),fill=p.fill||(def.fill||(opts&&opts.fill)||'#000');
      scPaint(path,{fill:fill,rule:p.holes?'evenodd':'nonzero',stroke:p.stroke,lw:p.lw,alpha:p.alpha});
    }
    if(p.draw)p.draw(g,SC_C);
    for(k=0;k<ch.length;k++)if(!ch[k].behind)one(ch[k]);
    g.restore();
  }
  g.save();g.translate(x,y);g.scale((flip?-1:1)*s,s);
  if(def.origin)g.translate(-def.origin[0],-def.origin[1]);
  for(i=0;i<roots.length;i++)one(roots[i]);
  g.restore();
}
/* ---- libs: shared helper code between scenes (libs/<name>.js calls lib('name', { fn(c, ...) {...} })); scenes use c.lib('name') ---- */
var SC_LIBS={};
function scLibDef(name,o){SC_LIBS[name]=o;return o}
/* path length (for draw-on effects), measured with a hidden SVG path */
var SC_PLEN={},SC_SVGP=null;
function scPathLen(d){
  if(SC_PLEN[d]!=null)return SC_PLEN[d];
  if(!SC_SVGP){var sv=document.createElementNS('http://www.w3.org/2000/svg','svg');SC_SVGP=document.createElementNS('http://www.w3.org/2000/svg','path');sv.appendChild(SC_SVGP)}
  SC_SVGP.setAttribute('d',d);var L=SC_SVGP.getTotalLength();SC_PLEN[d]=L;return L;
}
/* ---- assets embedded at build (scene files mention them as c.asset('assets/x.svg')) ---- */
function scAsset(src){
  var o=SC_ASSETS[src];
  if(!o){o={ok:0,im:new Image()};o.im.onload=function(){o.ok=1};o.im.onerror=function(){o.ok=-1};o.im.src=(typeof SC_DATA!=='undefined'&&SC_DATA[src])||src;SC_ASSETS[src]=o}
  return o;
}
/* ---- the per-frame context handed to setup(c) and draw(c) ---- */
function scBuildCtx(){
  var c=SC_C;
  c.ease=SC_EASE;c.holes=SC_HOLES;c.noise=scNoise;c.tween=scTween;c.lerp=lerp;c.clamp=clamp;
  c.map=function(v,a,b,x,y,e){var u=clamp((v-a)/(b-a||1),0,1);if(e)u=(SC_EASE[e]||SC_EASE.linear)(u);return x+(y-x)*u};
  c.smooth=function(a,b,v){return easeIO((v-a)/(b-a||1))};
  c.rand=function(seed){return R((seed|0)+1)};
  c.hash=scHash;
  c.each=function(n,seed,fn){for(var i=0;i<n;i++)fn(i,R((seed|0)*7919+i*104729+1))};
  c.path=scP2D;
  c.paint=function(path,o){scPaint(path,o)};
  c.clear=function(col){g.fillStyle=scCol(col);g.fillRect(0,0,c.W,c.H)};
  c.fill=function(col,o){scPaint(null,Object.assign({fill:col},o||{}))};
  c.circle=function(x,y,r,o){g.beginPath();g.arc(x,y,Math.max(0,r),0,6.2832);scPaint(null,o)};
  c.ellipse=function(x,y,rx,ry,o,rot){g.beginPath();g.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),(rot||0)*Math.PI/180,0,6.2832);scPaint(null,o)};
  c.rect=function(x,y,w,h,o){g.beginPath();g.rect(x,y,w,h);scPaint(null,o)};
  c.rrect=function(x,y,w,h,r,o){rr(x,y,w,h,r);scPaint(null,o)};
  c.poly=function(pts,o,closed){g.beginPath();for(var i=0;i<pts.length;i++){if(i)g.lineTo(pts[i][0],pts[i][1]);else g.moveTo(pts[i][0],pts[i][1])}if(closed!==false)g.closePath();scPaint(null,o)};
  c.line=function(x1,y1,x2,y2,o){g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);scPaint(null,Object.assign({stroke:'#fff'},o||{}))};
  c.curve=function(pts,o){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length-1;i++){var mx=(pts[i][0]+pts[i+1][0])/2,my=(pts[i][1]+pts[i+1][1])/2;g.quadraticCurveTo(pts[i][0],pts[i][1],mx,my)}var l=pts[pts.length-1];g.lineTo(l[0],l[1]);scPaint(null,Object.assign({stroke:'#fff'},o||{}))};
  c.grad=function(x1,y1,x2,y2,stops){var gr=g.createLinearGradient(x1,y1,x2,y2);stops.forEach(function(s){gr.addColorStop(s[0],scCol(s[1]))});return gr};
  c.radial=function(x,y,r0,r1,stops){var gr=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach(function(s){gr.addColorStop(s[0],scCol(s[1]))});return gr};
  c.glow=function(x,y,r,col,a){var gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,scCol(col));gr.addColorStop(1,'rgba(0,0,0,0)');var a0=g.globalAlpha;g.globalAlpha=a0*(a==null?1:a);g.fillStyle=gr;g.globalCompositeOperation='lighter';g.fillRect(x-r,y-r,r*2,r*2);g.globalCompositeOperation='source-over';g.globalAlpha=a0};
  c.text=function(s,x,y,size,col,align,font,weight){txt(String(s),x,y,size,scCol(col||'@ink'),align||'center',scFont(font),weight)};
  c.type=function(s,t0,cps){s=String(s);return s.slice(0,Math.max(0,Math.min(s.length,Math.floor((c.t-(t0||0))*(cps||14)))))};
  c.at=scAt;
  c.save=function(){g.save()};c.restore=function(){g.restore()};
  c.fit=function(vw,vh,fn,mode){var s=mode==='cover'?Math.max(c.W/vw,c.H/vh):Math.min(c.W/vw,c.H/vh);g.save();g.translate((c.W-vw*s)/2,(c.H-vh*s)/2);g.scale(s,s);fn(vw,vh,s);g.restore()};
  c.camera=function(x,y,zoom,rot){c.cam={x:x||0,y:y||0,z:zoom||1,r:rot||0}};
  c.layer=function(depth,fn){var k=c.cam||{x:0,y:0,z:1,r:0},z=1+(k.z-1)*depth;g.save();g.translate(c.cx,c.cy);if(k.r)g.rotate(k.r*depth*Math.PI/180);g.scale(z,z);g.translate(-c.cx-k.x*depth,-c.cy-k.y*depth);fn();g.restore()};
  c.rig=function(name,opts){
    var def=SC_RIGS[name];if(!def)throw new Error('no rig "'+name+'" (rigs/'+name+'.js)');var pose=Object.assign({},def.pose||{}),api={};
    api.pose=function(p){if(p)for(var k in p)pose[k]=p[k];return api};
    api.draw=function(x,y,s,flip){scRigDraw(def,pose,x,y,s==null?1:s,flip,opts);return api};
    return api;
  };
  c.lib=function(name){var L=SC_LIBS[name];if(!L)throw new Error('no lib "'+name+'" (libs/'+name+'.js)');return L};
  c.measure=function(str,size,font,weight){g.font=(weight||'')+' '+size+'px '+scFont(font);return g.measureText(String(str)).width};
  c.clip=function(x,y,w,h,fn,r){g.save();if(r)rr(x,y,w,h,r);else{g.beginPath();g.rect(x,y,w,h)}g.clip();fn();g.restore()};
  /* draw an SVG path text being traced: c.trace('M..', 0..1, {stroke, lw}) */
  c.trace=function(d,t,o){t=clamp(t,0,1);if(t<=0)return;var L=scPathLen(d);g.save();g.setLineDash([L*t+.01,L+1]);g.lineCap='round';scPaint(scP2D(d),Object.assign({stroke:'@ink',lw:2},o||{}));g.restore()};
  c.pathLen=scPathLen;
  /* a rectangle that shows another look: its background is painted inside, then fn(c) draws in the panel's own coordinates */
  c.panel=function(x,y,w,h,lookName,fn){
    var sv={W:c.W,H:c.H,cx:c.cx,cy:c.cy,u:c.u,vw:c.vw,look:c.look,pal:c.pal},lk=scGetLook(lookName);
    g.save();g.translate(x,y);g.beginPath();g.rect(0,0,w,h);g.clip();
    c.W=w;c.H=h;c.cx=w/2;c.cy=h/2;c.u=h/100;c.vw=w/100;c.look=lk;c.pal=lk.pal||{};
    if(lk.bg)lk.bg(c);if(fn)fn(c);
    c.W=sv.W;c.H=sv.H;c.cx=sv.cx;c.cy=sv.cy;c.u=sv.u;c.vw=sv.vw;c.look=sv.look;c.pal=sv.pal;g.restore();
  };
  c.asset=scAsset;
  c.image=function(src,x,y,w,h,o){var a=scAsset(src);if(a.ok!==1)return;o=o||{};var iw=a.im.naturalWidth||1,ih=a.im.naturalHeight||1;if(w==null){w=iw;h=ih}else if(h==null)h=w*ih/iw;var a0=g.globalAlpha;if(o.alpha!=null)g.globalAlpha=a0*o.alpha;g.drawImage(a.im,x-(o.center?w/2:0),y-(o.center?h/2:0),w,h);g.globalAlpha=a0};
  c.talk=function(rate){return c.speaking?.5+.5*Math.sin(c.t*(rate||14)):0};
  c.wob=function(x,y,amp,speed,seed){var t=c.t*(speed||1);return [(scNoise(x*.01+t,y*.01,seed||1)-.5)*2*amp,(scNoise(x*.01,y*.01+t,(seed||1)+9)-.5)*2*amp]};
  return c;
}
scBuildCtx();
/* which clip is speaking now (works from the beat alone, so scrubbing and export agree) */
function scSpeaking(beat){
  if(typeof VO_AT==='undefined')return -1;
  for(var i=0;i<VO_AT.length;i++){var s0=bb(VO_AT[i][0])+VO_AT[i][1],d0=((VOB&&VOB[i])?VOB[i].duration:(VO_DUR[i]||2.5))/SPB;if(beat>=s0&&beat<s0+d0)return i}
  return -1;
}
function scCompile(name){
  var d=SC_DEFS[name];if(d)return d;
  var S=typeof SCENES!=='undefined'&&SCENES[name];if(!S||S.src==null)throw new Error('scene "'+name+'" has no source: write scenes/'+name+'.js');
  var def=null;
  try{new Function('scene','rig','look','kit','c',S.src)(function(o){def=o},scRig,scLook,{ease:SC_EASE,holes:SC_HOLES,noise:scNoise,tween:scTween},SC_C)}catch(e){throw new Error('scene "'+name+'": '+(e&&e.message||e))}
  if(!def||typeof def.draw!=='function')throw new Error('scene "'+name+'" must call scene({ draw(c){ ... } })');
  SC_DEFS[name]=def;return def;
}
function scOffscreen(key,w,h){var o=SC_OFF[key];if(!o||o.width!==w||o.height!==h){o=SC_OFF[key]=document.createElement('canvas');o.width=w;o.height=h}return o}
function scFx(lk,c,pre){
  var fx=lk.fx||[],i,k,gr;
  for(i=0;i<fx.length;i++){
    k=fx[i];if(typeof k==='string')k={n:k};
    if(!!k.pre!==!!pre)continue;
    if(k.n==='vignette'){gr=g.createRadialGradient(c.cx,c.cy,Math.min(c.W,c.H)*.35,c.cx,c.cy,Math.max(c.W,c.H)*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+((k.a!=null?k.a:.5)*(typeof FIN_VIG==='number'?FIN_VIG:1))+')');g.fillStyle=gr;g.fillRect(0,0,c.W,c.H)}
    else if(k.n==='scan'){g.fillStyle='rgba(0,0,0,'+(k.a!=null?k.a:.12)+')';var st=k.step||3;for(var y=0;y<c.H;y+=st)g.fillRect(0,y,c.W,1)}
    else if(k.n==='flicker'){var fl=(scNoise(c.t*(k.rate||9),3,1)-.5)*(k.a!=null?k.a:.12);g.fillStyle=fl>0?'rgba(255,230,180,'+fl+')':'rgba(0,0,0,'+(-fl)+')';g.fillRect(0,0,c.W,c.H)}
    else if(k.n==='paper'){var nt=scNoiseTile();g.save();g.globalCompositeOperation='multiply';g.globalAlpha=k.a!=null?k.a:.16;g.fillStyle=g.createPattern(nt,'repeat');g.fillRect(0,0,c.W,c.H);g.restore()}
    else if(k.n==='chroma'){
      var dx=(k.px||3)*(1+(k.pulse?c.pulse*2:0)),o=scOffscreen('ch0',cv.width,cv.height),og=o.getContext('2d');og.setTransform(1,0,0,1,0,0);og.globalCompositeOperation='copy';og.drawImage(cv,0,0);
      var t2=scOffscreen('ch1',cv.width,cv.height),tg=t2.getContext('2d');tg.setTransform(1,0,0,1,0,0);
      [['#ff0000',-dx],['#00ffff',dx]].forEach(function(q){tg.globalCompositeOperation='copy';tg.drawImage(o,0,0);tg.globalCompositeOperation='multiply';tg.fillStyle=q[0];tg.fillRect(0,0,t2.width,t2.height);g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='lighter';g.globalAlpha=k.a!=null?k.a:.45;g.drawImage(t2,q[1]*DPR,0);g.restore()});
    }
    else if(k.n==='tint'){g.globalCompositeOperation=k.mode||'multiply';g.fillStyle=k.c;g.fillRect(0,0,c.W,c.H);g.globalCompositeOperation='source-over'}
  }
}
var SC_NOISE_TILE=null;
function scNoiseTile(){if(!SC_NOISE_TILE){var q=document.createElement('canvas');q.width=q.height=96;var x=q.getContext('2d'),id=x.createImageData(96,96),i,v;for(i=0;i<id.data.length;i+=4){v=150+(scHash(i,7,3)-.5)*100;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}x.putImageData(id,0,0);SC_NOISE_TILE=q}return SC_NOISE_TILE}
var SC_MS={n:0,sum:0,max:0};
function scDraw(name){
  var scT0=performance.now(),P=F.params||{},def=scCompile(name),lk=scGetLook(P.look||def.look),c=SC_C,tb=F.p*F.dur,fps=lk.fps||P.fps||def.fps;
  c.W=W;c.H=H;c.cx=CX;c.cy=H*.5;c.u=H/100;c.vw=W/100;c.params=P;c.look=lk;c.pal=lk.pal||{};c.name=name;
  c.tb=tb;c.dur=F.dur;c.p=F.p;c.t=tb*SPB;if(fps)c.t=Math.floor(c.t*fps)/fps;c.durSec=F.dur*SPB;
  c.beat=F.beat;c.bar=F.beat/4+1;c.pulse=F.k;var sp=scSpeaking(F.beat);c.speaking=sp>=0;c.voiceLine=sp;
  c.cam={x:0,y:0,z:1,r:0};
  var pix=lk.pixelate>1,saved=g,off=null;
  if(pix){var kx=lk.pixelate;off=scOffscreen('pix',Math.max(8,Math.round(W/kx)),Math.max(8,Math.round(H/kx)));g=off.getContext('2d');g.setTransform(off.width/W,0,0,off.height/H,0,0);g.imageSmoothingEnabled=false}
  reset();c.g=g;
  if(!def._ready){def._ready=1;if(def.setup)def.setup(c)}
  if(lk.bg&&def.bg!==false&&P.bg!==false)lk.bg(c);
  scFx(lk,c,true);
  var boil=lk.boil||0;if(boil){var bt=Math.floor(c.t*(lk.fps||8));g.save();g.translate((scHash(bt,1,1)-.5)*boil,(scHash(bt,2,1)-.5)*boil);g.rotate((scHash(bt,3,1)-.5)*.004)}
  def.draw(c);
  if(boil)g.restore();
  if(pix&&lk.levels){var id=g.getImageData(0,0,off.width,off.height),dd=id.data,L=lk.levels-1,q;for(q=0;q<dd.length;q++){if((q&3)!==3)dd[q]=Math.round(dd[q]/255*L)*255/L}g.putImageData(id,0,0)}
  if(pix){g=saved;g.imageSmoothingEnabled=false;g.drawImage(off,0,0,W,H);g.imageSmoothingEnabled=true}
  reset();scFx(lk,c,false);
  var ms=performance.now()-scT0;SC_MS.n++;SC_MS.sum+=ms;if(ms>SC_MS.max)SC_MS.max=ms;
}
function scIsBright(sh){var P=sh[4]||{},d=null;try{d=scCompile(sh[3])}catch(e){}return scGetLook(P.look||(d&&d.look)).bright?1:0}
/* project rigs/*.js and looks/*.js (embedded by the build) run once at start; returns the load errors */
function scLoadUser(rigs,looks,libs){
  var k={ease:SC_EASE,holes:SC_HOLES,noise:scNoise,tween:scTween},n,errs=[];
  for(n in rigs){try{new Function('rig','kit',rigs[n])(scRig,k)}catch(e){errs.push('rigs/'+n+'.js: '+(e&&e.message||e))}}
  for(n in looks){try{new Function('look','kit',looks[n])(scLook,k)}catch(e){errs.push('looks/'+n+'.js: '+(e&&e.message||e))}}
  for(n in (libs||{})){try{new Function('lib','kit',libs[n])(scLibDef,k)}catch(e){errs.push('libs/'+n+'.js: '+(e&&e.message||e))}}
  return errs;
}
