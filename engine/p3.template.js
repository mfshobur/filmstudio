
/* ================= TIMELINE (bars, 128 BPM) ================= */
var BPM={{BPM}},SPB=60/BPM,TOTAL_BARS={{BARS}};
var TITLE_LINES={{TITLE_LINES}},TITLE_ACCENT={{TITLE_ACCENT}},SCORE={{SCORE}};
function bb(bar){return (bar-1)*4}
var SH={{SHOTS}};
var BRIGHT={paper:1,cartoon:1,iso:.5,board:1,shadow:.5,ink:1,comic:1,pixel:.5,image:.5,memphis:1,poster:1,clay:1,origami:1,voxel:1,multiplane:1,map:.5};
function isBright(sh){
  if(sh[2]==='board')return !(sh[4]&&sh[4].palette&&sh[4].palette.bg&&lum(sh[4].palette.bg)<.4);
  if(sh[2]==='type'&&sh[4]&&sh[4].palette&&sh[4].palette.bg)return lum(sh[4].palette.bg)>.6;
  if(sh[2]==='stage'&&sh[4]&&sh[4].background)return BRIGHT[sh[4].background[0]]>.9;
  return BRIGHT[sh[2]]>.9;
}
function lum(hex){var m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex||'');if(!m)return .5;return (parseInt(m[1],16)*.299+parseInt(m[2],16)*.587+parseInt(m[3],16)*.114)/255}
var DRAW={
  stage:function(v){stage()},
  type:function(v){kinetic(v)},
  board:function(v){whiteboard(v)},
  shadow:function(v){shadowScene(v)},
  image:function(v){imageScene(v)},
  pixel:function(v){pixelScene(v)},
  glitch:function(v){glitchScene(v)},
  ink:function(v){inkScene(v)},
  comic:function(v){comicScene(v)},
  gen:function(v){genScene(v)},
  vapor:function(v){vaporScene(v)},
  memphis:function(v){memphisScene(v)},
  poster:function(v){posterScene(v)},
  ascii:function(v){asciiScene(v)},
  clay:function(v){clayScene(v)},
  origami:function(v){origamiScene(v)},
  lowpoly:function(v){lowpolyScene(v)},
  voxel:function(v){voxelScene(v)},
  map:function(v){mapScene(v)},
  multiplane:function(v){multiplaneScene(v)},
  stopmo:function(v){stopmoScene(v)},
  atom:atom,
  math:function(v){v==='descent'?mathDescent():v==='prompt'?mathPrompt():mathSine()},
  cartoon:function(v){v==='heart'?cartoonHeart():v==='wonder'?cartoonWonder():cartoonFollow()},
  chart:chart3d,explainer:explainer,iso:iso,paper:paper,synth:synth,domino:domino
};
/* narration: [bar, beat offset] for each clip, in order */
var VO_AT={{VO_AT}};
var VO_TXT={{VO_TXT}};
var VO_DUR={{VO_DUR}};
var PROMPTS={{PROMPTS}};
var VO={{VO}};
var VOB=[];

/* ================= AUDIO ================= */
var A={ctx:null,ok:false,music:true,voice:true,srcs:[],timer:null,M:null,t0:0};
A.init=function(){
  if(A.ctx){if(A.ctx.state==='suspended')A.ctx.resume();return}
  try{
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;var c;try{c=A.ctx=new AC({latencyHint:'playback'})}catch(e){c=A.ctx=new AC()}
    A.master=c.createGain();A.master.gain.value=.9;
    A.comp=c.createDynamicsCompressor();A.comp.threshold.value=-16;A.comp.ratio.value=3;A.comp.attack.value=.01;A.comp.release.value=.2;
    var lim=c.createWaveShaper(),cur=new Float32Array(1024);for(var i=0;i<1024;i++){var x=i/512-1;cur[i]=Math.tanh(x*1.3)/Math.tanh(1.3)}lim.curve=cur;
    A.duck=c.createGain();A.vgain=c.createGain();A.vgain.gain.value=1.25;
    A.comp.connect(lim);lim.connect(A.master);A.master.connect(c.destination);A.duck.connect(A.comp);A.vgain.connect(A.comp);
    var vc=c.createConvolver(),len=Math.floor(c.sampleRate*.9),b=c.createBuffer(1,len,c.sampleRate);var d=b.getChannelData(0);for(var j=0;j<len;j++)d[j]=(Math.random()*2-1)*Math.pow(1-j/len,3)
    vc.buffer=b;var vw=c.createGain();vw.gain.value=.14;A.vgain.connect(vc);vc.connect(vw);vw.connect(A.comp);
    A.musicOut=c.createGain();A.musicOut.gain.value=.42;A.musicOut.connect(A.duck);A.ok=true;
  }catch(e){A.ok=false}
};
A.decode=function(){
  if(!A.ok||VOB.length||!VO)return Promise.resolve();
  return Promise.all(VO.map(function(b64){return new Promise(function(res){try{var bin=atob(b64),u=new Uint8Array(bin.length);for(var k=0;k<bin.length;k++)u[k]=bin.charCodeAt(k);A.ctx.decodeAudioData(u.buffer,function(buf){res(buf)},function(){res(null)})}catch(e){res(null)}})})).then(function(a){VOB=a});
};
A.stopAll=function(){
  clearInterval(A.timer);A.timer=null;
  A.srcs.forEach(function(s){try{s.stop()}catch(e){}});A.srcs=[];
  if(A.ok){try{A.musicOut.disconnect()}catch(e){}A.musicOut=A.ctx.createGain();A.musicOut.gain.value=A.music?.42:0;A.musicOut.connect(A.duck);A.duck.gain.cancelScheduledValues(0);A.duck.gain.value=1}
};
A.run=function(cuts){
  var c=A.ctx;A.t0=c.currentTime+.8;
  A.M=createMusic(c,A.musicOut,BPM,SCORE);A.M.cuts=cuts;
  var next=0,M=A.M;
  function pump(){while(next<M.steps&&A.t0+next*M.s16<c.currentTime+1.4){try{M.step(next,A.t0+next*M.s16)}catch(e){}next++}if(next>=M.steps){clearInterval(A.timer);A.timer=null}}
  pump();A.timer=setInterval(pump,60);
  for(var i=0;i<VOB.length;i++){
    if(!VOB[i])continue;var s=c.createBufferSource();s.buffer=VOB[i];s.connect(A.vgain);
    var t=A.t0+(bb(VO_AT[i][0])+VO_AT[i][1])*SPB;s.start(t);A.srcs.push(s);
    A.duck.gain.setTargetAtTime(.5,Math.max(c.currentTime,t-.08),.07);A.duck.gain.setTargetAtTime(1,t+VOB[i].duration,.3);
  }
};
A.setMusic=function(on){A.music=on;if(A.ok)A.musicOut.gain.setTargetAtTime(on?.42:0,A.ctx.currentTime,.2)};
A.setVoice=function(on){A.voice=on;if(A.ok)A.vgain.gain.setTargetAtTime(on?1.25:0,A.ctx.currentTime,.1)};

/* ================= CLOCK + FILM LOOP ================= */
var EXPORTING=false,capShown=-2,playing=false,FORCE=null,rt0=0,lastShot=-1,shotStartBeat=0,promptIdx=0,capIdx=-1,capTimer=null,lastBar=0,idleT=performance.now()/1000;
function nowBeat(){
  if(FORCE!==null)return FORCE;
  if(!playing)return -1;
  if(A.ok)return (A.ctx.currentTime-A.t0)/SPB;
  return (performance.now()/1000-rt0)/SPB;
}
function findShot(beat){for(var i=0;i<SH.length;i++)if(beat>=bb(SH[i][0])&&beat<bb(SH[i][1]))return i;return SH.length-1}
var promptEl=$('#prompt'),typeTimer=null;
function prompt(text,big){
  clearInterval(typeTimer);promptEl.classList.toggle('big',!!big);
  if(text===null){promptEl.classList.add('off');return}
  promptEl.classList.remove('off');promptEl.textContent='';if(!text)return;
  var i=0;typeTimer=setInterval(function(){promptEl.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(typeTimer)},big?85:48);
}
function caption(text){
  var el=$('#cap');el.classList.remove('in');clearTimeout(capTimer);
  capTimer=setTimeout(function(){el.innerHTML='';if(!text)return;String(text).split(' ').forEach(function(w,k){var s=document.createElement('span');s.textContent=w+' ';s.style.transitionDelay=(k*70)+'ms';el.appendChild(s)});requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('in')})})},text?60:0);
}
/* export mode: overlays (typed prompt, caption, end card) are computed purely from the beat so frames are reproducible */
function syncOverlays(beat){
  var pi=-1,i,pe=$('#prompt');for(i=0;i<PROMPTS.length;i++)if(beat>=PROMPTS[i][0])pi=i;
  if(pi<0||PROMPTS[pi][1]===null){pe.classList.add('off');pe.textContent=''}
  else{var Pp=PROMPTS[pi],per=(Pp[2]?85:48)/1000,typed=Math.floor((beat-Pp[0])*SPB/per);pe.classList.remove('off');pe.classList.toggle('big',!!Pp[2]);pe.textContent=Pp[1].slice(0,Math.max(0,Math.min(Pp[1].length,typed)))}
  var ci=-1;for(i=0;i<VO_AT.length;i++){var s0=bb(VO_AT[i][0])+VO_AT[i][1],d0=(VO_DUR[i]||2.5)/SPB;if(beat>=s0&&beat<s0+d0+.6)ci=i}
  if(ci!==capShown){capShown=ci;var el=$('#cap');el.innerHTML='';el.classList.remove('in');if(ci>=0){String(VO_TXT[ci]).split(' ').forEach(function(w){var s=document.createElement('span');s.textContent=w+' ';el.appendChild(s)});el.classList.add('in')}}
  var en=$('#end');if(beat>=bb({{END_BAR}}))en.classList.remove('gone');else en.classList.add('gone');
}
var DRAW_ERRS=[];
var GRABC=document.createElement('canvas');GRABC.width=48;GRABC.height=27;
var lastT=performance.now()/1000,ema=.016,slowN=0;
function frame(){
  var now=performance.now()/1000,beat=nowBeat(),idx,sh;
  var dtf=Math.min(.2,now-lastT);lastT=now;ema=ema*.97+dtf*.03;if(!EXPORTING&&ema>.045&&QUAL<2&&++slowN>90){QUAL++;slowN=0;ema=.02;resize()}
  if(!W||!H){resize();requestAnimationFrame(frame);return}
  if(beat<0){idx=0;sh=SH[0];F.tb=3+((now-idleT)/SPB)%5;F.dur=8;F.p=.4;F.beat=0}
  else{idx=findShot(beat);sh=SH[idx];var b0=bb(sh[0]),dur=bb(sh[1])-b0,tb=beat-b0;F.dur=dur;F.p=clamp(tb/dur,0,1);F.tb=tb+(dur<=2?3:0);F.beat=beat}
  F.T=F.tb*SPB;F.params=sh[4]||null;
  var bar=Math.floor(Math.max(0,beat)/4)+1,calm=(bar<5||(bar>=21&&bar<=28)||bar>=41)?.5:1,bf=((beat<0?F.tb:beat)%1+1)%1;
  F.k=Math.exp(-bf*5)*calm;
  if(idx!==lastShot){lastShot=idx;shotStartBeat=beat<0?0:bb(sh[0]);bcv.style.opacity=String(isBright(sh)?.1:BRIGHT[sh[2]]!==undefined?.28:.6);scv.style.opacity=isBright(sh)?'.04':'.22'}
  var age=beat<0?9:beat-shotStartBeat,punch=1+.05*Math.max(0,1-age/.5);
  reset();g.save();g.translate(CX,CY);g.scale(punch,punch);g.translate(-CX,-CY);
  try{DRAW[sh[2]](sh[3])}catch(e){if(DRAW_ERRS.length<40)DRAW_ERRS.push({style:sh[2],variant:sh[3],message:String(e&&e.message||e)})}
  g.restore();reset();
  if(age<.14&&beat>=0){var rn=R(idx*7+3);for(var q=0;q<3;q++){var ys=rn()*H*.8,hs=H*(.04+rn()*.08),off=(rn()-.5)*U*.5;g.drawImage(cv,0,ys*DPR,cv.width,hs*DPR,off,ys,W,hs)}}
  if(age<.3&&beat>=0){g.globalAlpha=(1-age/.3)*(sh[1]-sh[0]>=1?.55:.3);g.fillStyle=PAL.bone;g.fillRect(0,0,W,H);g.globalAlpha=1}
  if(EXPORTING)syncOverlays(beat);
  if(QUAL<2){bg.globalCompositeOperation='copy';bg.drawImage(cv,0,0,bcv.width,bcv.height);sg.globalCompositeOperation='copy';sg.drawImage(cv,0,0,scv.width,scv.height)}
  if(playing&&FORCE===null){
    while(promptIdx<PROMPTS.length&&beat>=PROMPTS[promptIdx][0]){prompt(PROMPTS[promptIdx][1],PROMPTS[promptIdx][2]);promptIdx++}
    var ci=-1;for(var v=0;v<VO_AT.length;v++){var s0=bb(VO_AT[v][0])+VO_AT[v][1],d0=(VOB[v]?VOB[v].duration:(VO_DUR[v]||2.5))/SPB;if(beat>=s0&&beat<s0+d0+.6){ci=v}}
    if(ci!==capIdx){capIdx=ci;caption(ci>=0?VO_TXT[ci]:'')}
    if(bar!==lastBar){lastBar=bar;$('#tc').textContent=BPM+' BPM · BAR '+Math.min(bar,TOTAL_BARS)}
    if(beat>=bb({{END_BAR}})&&$('#end').classList.contains('gone'))$('#end').classList.remove('gone');
  }
  requestAnimationFrame(frame);
}

/* ================= CONTROLS ================= */
function cutsMap(){var m={};SH.forEach(function(s,i){var b=Math.round(bb(s[0]));if(b>0)m[b]=(s[1]-s[0]>=1&&(s[0]===13||s[0]===29||s[0]===21||s[0]===36||s[0]===5))?.34:.2});return m}
function begin(){
  A.init();$('#intro').classList.add('gone');$('#end').classList.add('gone');
  A.stopAll();promptIdx=0;capIdx=-1;lastBar=0;lastShot=-1;
  A.decode().then(function(){
    if(A.ok)A.run(cutsMap());else rt0=performance.now()/1000+.5;
    playing=true;
  });
}
function replay(){playing=false;A.stopAll();prompt(null);caption('');setTimeout(begin,500)}
$('#begin').addEventListener('click',begin);
$('#again').addEventListener('click',replay);
var bM=$('#bMusic'),bV=$('#bVoice');
bM.addEventListener('click',function(){var on=bM.getAttribute('aria-pressed')!=='true';bM.setAttribute('aria-pressed',on);A.setMusic(on)});
bV.addEventListener('click',function(){var on=bV.getAttribute('aria-pressed')!=='true';bV.setAttribute('aria-pressed',on);A.setVoice(on)});
document.addEventListener('visibilitychange',function(){if(!A.ctx)return;if(document.hidden)A.ctx.suspend();else A.ctx.resume()});
window.__film={setBeat:function(b){EXPORTING=true;FORCE=b},spb:SPB,bars:TOTAL_BARS,errors:function(){return DRAW_ERRS},grab:function(){var x=GRABC.getContext('2d');x.drawImage(cv,0,0,48,27);var d=x.getImageData(0,0,48,27).data,o=[];for(var i=0;i<d.length;i+=4)o.push(d[i]+d[i+1]+d[i+2]);return o},seek:function(b){FORCE=b},free:function(){FORCE=null},vready:function(){return VOB.filter(Boolean).length},shots:SH.length};
try{if(document.fonts&&document.fonts.load){document.fonts.load('italic 90px "Instrument Serif"');document.fonts.load('800 20px "Hanken Grotesk"');document.fonts.load('20px "IBM Plex Mono"')}}catch(e){}
requestAnimationFrame(frame);
})();
