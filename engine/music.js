/* ---------- the score: 128 BPM, A minor, 46 bars ---------- */
function createMusic(c, out, BPM){
  var spb=60/BPM, s16=spb/4, M={BPM:BPM,spb:spb,s16:s16,bars:46,steps:46*16};
  function mtof(m){return 440*Math.pow(2,(m-69)/12)}
  /* buses */
  var master=c.createGain();master.gain.value=1;master.connect(out);
  var dry=c.createGain();dry.connect(master);
  var conv=c.createConvolver();
  (function(){var len=Math.floor(c.sampleRate*2.2),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);conv.buffer=b})();
  var wet=c.createGain();wet.gain.value=.55;conv.connect(wet);wet.connect(master);
  var pump=c.createGain();pump.gain.value=1;pump.connect(dry);
  var pumpRev=c.createGain();pumpRev.gain.value=.45;pump.connect(pumpRev);pumpRev.connect(conv);
  var arpBus=c.createGain();arpBus.gain.value=1;arpBus.connect(pump);
  var dly=c.createDelay(2);dly.delayTime.value=spb*.75;var fb=c.createGain();fb.gain.value=.38;var dlp=c.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=2600;
  arpBus.connect(dly);dly.connect(dlp);dlp.connect(fb);fb.connect(dly);var dout=c.createGain();dout.gain.value=.42;dlp.connect(dout);dout.connect(pump);
  var nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  function send(node,rev){node.connect(dry);if(rev){var g=c.createGain();g.gain.value=rev;node.connect(g);g.connect(conv)}}
  function noise(t,dur){var s=c.createBufferSource();s.buffer=nb;s.loop=true;s.start(t,Math.random()*1.5);s.stop(t+dur+.05);return s}
  function env(g,t,a,v,d){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}

  /* drums */
  function kick(t,v,soft){
    var o=c.createOscillator(),g=c.createGain();o.type='sine';
    o.frequency.setValueAtTime(soft?105:155,t);o.frequency.exponentialRampToValueAtTime(soft?40:46,t+(soft?.16:.11));
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(soft?.55:.4));o.connect(g);send(g,soft?.25:0);o.start(t);o.stop(t+.6);
    if(!soft){var n=noise(t,.02),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=2500;ng.gain.setValueAtTime(v*.25,t);ng.gain.exponentialRampToValueAtTime(.001,t+.015);n.connect(hp);hp.connect(ng);ng.connect(dry)}
    if(!soft){pump.gain.cancelScheduledValues(t);pump.gain.setValueAtTime(.4,t);pump.gain.linearRampToValueAtTime(1,t+spb*.55)}
  }
  function clap(t,v){
    for(var k=0;k<3;k++){var tt=t+k*.011,n=noise(tt,.2),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.9;g.gain.setValueAtTime(.0001,tt);g.gain.linearRampToValueAtTime(v*(k<2?.6:1),tt+.002);g.gain.exponentialRampToValueAtTime(.001,tt+(k<2?.03:.2));n.connect(bp);bp.connect(g);send(g,k===2?.35:0)}
  }
  function snare(t,v){
    var n=noise(t,.2),hp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=1400;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.17);n.connect(hp);hp.connect(g);send(g,.2);
    var o=c.createOscillator(),og=c.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);og.gain.setValueAtTime(v*.5,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(og);og.connect(dry);o.start(t);o.stop(t+.12);
  }
  function hat(t,v,open){var n=noise(t,.2),hp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=7200;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(open?.16:.035));n.connect(hp);hp.connect(g);g.connect(dry)}
  function tick(t,v){var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=1250;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.03);o.connect(g);send(g,.35);o.start(t);o.stop(t+.05)}
  function crash(t,v){var n=noise(t,3),hp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=3200;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+2.6);n.connect(hp);hp.connect(g);send(g,.4)}
  function boom(t,v){var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(26,t+2.2);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+3);o.connect(g);send(g,.3);o.start(t);o.stop(t+3.1)}
  function riser(t,dur,v){
    var n=noise(t,dur),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(300,t);bp.frequency.exponentialRampToValueAtTime(9000,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+dur*.96);g.gain.linearRampToValueAtTime(0,t+dur+.02);n.connect(bp);bp.connect(g);send(g,.3);
    var o=c.createOscillator(),og=c.createGain(),lp=c.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(mtof(45),t);o.frequency.exponentialRampToValueAtTime(mtof(81),t+dur);lp.type='lowpass';lp.frequency.value=1600;og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(v*.22,t+dur*.96);og.gain.linearRampToValueAtTime(0,t+dur+.02);o.connect(lp);lp.connect(og);send(og,.3);o.start(t);o.stop(t+dur+.05);
  }
  /* tonal */
  function bass(t,midi,dur,v){
    var o=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();o.type='sine';o2.type='sawtooth';o.frequency.value=mtof(midi);o2.frequency.value=mtof(midi);lp.type='lowpass';lp.frequency.value=260;
    var g2=c.createGain();g2.gain.value=.35;o.connect(g);o2.connect(g2);g2.connect(lp);lp.connect(g);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.setTargetAtTime(.0001,t+dur*.8,.05);g.connect(pump);o.start(t);o.stop(t+dur+.4);o2.start(t);o2.stop(t+dur+.4);
  }
  function pad(t,notes,dur,v,cut){
    var lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(cut*.5,t);lp.frequency.linearRampToValueAtTime(cut,t+Math.min(dur*.6,1.4));lp.Q.value=.6;
    var g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(.55,dur*.4));g.gain.setValueAtTime(v,t+Math.max(.1,dur-.5));g.gain.linearRampToValueAtTime(.0001,t+dur+.7);
    lp.connect(g);g.connect(pump);
    notes.forEach(function(m,i){[-7,7].forEach(function(dt){var o=c.createOscillator();o.type=i%2?'sawtooth':'triangle';o.frequency.value=mtof(m);o.detune.value=dt;var og=c.createGain();og.gain.value=.12;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.8)})});
  }
  function glass(t,midi,dur,v){
    /* bowed glass: near-sine core, slow bow attack, vibrato, octave shimmer, friction air */
    var f=mtof(midi),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(6000,f*6);
    var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=4.6;lg.gain.value=5;lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+1.8);
    var parts=[[1,1,'sine'],[2.01,.34,'sine'],[3.02,.1,'sine'],[5.4,.035,'sine'],[.5,.22,'sine']];
    parts.forEach(function(h){var o=c.createOscillator(),og=c.createGain();o.type=h[2];o.frequency.value=f*h[0];o.detune.value=(Math.random()-.5)*8;lg.connect(o.detune);og.gain.value=h[1];o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+1.8)});
    lp.connect(g);var att=Math.min(.22,dur*.5);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+att);g.gain.setValueAtTime(v*.9,t+Math.max(att,dur*.8));g.gain.exponentialRampToValueAtTime(.0001,t+dur+1.6);send(g,.78);
    var sh=c.createOscillator(),sg=c.createGain();sh.type='sine';sh.frequency.value=f*2;sh.detune.value=6;sg.gain.setValueAtTime(.0001,t);sg.gain.linearRampToValueAtTime(v*.2,t+att+.25);sg.gain.exponentialRampToValueAtTime(.0001,t+dur+2.2);sh.connect(sg);send(sg,.95);sh.start(t);sh.stop(t+dur+2.3);
    var n=noise(t,dur+.3),bp=c.createBiquadFilter(),ng=c.createGain();bp.type='bandpass';bp.frequency.value=f*3;bp.Q.value=6;ng.gain.setValueAtTime(.0001,t);ng.gain.linearRampToValueAtTime(v*.06,t+att);ng.gain.exponentialRampToValueAtTime(.0001,t+dur+.4);n.connect(bp);bp.connect(ng);ng.connect(dry);
  }
  function cello(t,midi,dur,v,cut){
    var lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.Q.value=1.1;lp.frequency.setValueAtTime(cut*1.8,t);lp.frequency.exponentialRampToValueAtTime(cut,t+.12);
    var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=5.5;lg.gain.value=6;lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+.2);
    [-8,8].forEach(function(dt,i){var o=c.createOscillator();o.type=i?'sawtooth':'triangle';o.frequency.value=mtof(midi);o.detune.value=dt;lg.connect(o.detune);var og=c.createGain();og.gain.value=.5;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.2)});
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.03);g.gain.setTargetAtTime(.0001,t+dur*.7,.05);lp.connect(g);g.connect(pump);
  }
  function cutFx(t,v){
    var n=noise(t,.3),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.Q.value=.9;bp.frequency.setValueAtTime(700,t);bp.frequency.exponentialRampToValueAtTime(5200,t+.2);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.24);n.connect(bp);bp.connect(g);send(g,.25);
    var o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(48,t+.12);og.gain.setValueAtTime(v*1.1,t);og.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(og);og.connect(dry);o.start(t);o.stop(t+.2);
    var q=c.createOscillator(),qg=c.createGain();q.type='square';q.frequency.setValueAtTime(1900+Math.random()*700,t);q.frequency.setValueAtTime(900,t+.012);qg.gain.setValueAtTime(v*.18,t);qg.gain.exponentialRampToValueAtTime(.001,t+.03);q.connect(qg);send(qg,.15);q.start(t);q.stop(t+.04);
  }
  function ping(t,midi,v){var o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();o.type='sine';o.frequency.value=mtof(midi);lp.type='lowpass';lp.frequency.value=2200;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(lp);lp.connect(g);send(g,.8);o.start(t);o.stop(t+.8)}
  function pluck(t,midi,v,cut){
    var o=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o2.type='square';o.frequency.value=mtof(midi);o2.frequency.value=mtof(midi);o2.detune.value=9;
    lp.type='lowpass';lp.Q.value=2;lp.frequency.setValueAtTime(cut*3.2,t);lp.frequency.exponentialRampToValueAtTime(cut,t+.14);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.2);var og=c.createGain();og.gain.value=.5;o.connect(lp);o2.connect(og);og.connect(lp);lp.connect(g);g.connect(arpBus);o.start(t);o.stop(t+.25);o2.start(t);o2.stop(t+.25);
  }
  function lead(t,midi,dur,v){
    var lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.frequency.value=3200;lp.Q.value=.8;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.03);g.gain.setValueAtTime(v,t+Math.max(.05,dur-.1));g.gain.linearRampToValueAtTime(.0001,t+dur+.45);lp.connect(g);send(g,.5);
    var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=5.2;lg.gain.value=7;lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+.5);
    [-10,10].forEach(function(dt){var o=c.createOscillator();o.type='sawtooth';o.frequency.value=mtof(midi);o.detune.value=dt;lg.connect(o.detune);var og=c.createGain();og.gain.value=.5;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.5)});
  }

  /* harmony (MIDI) */
  var CH={
    Am:{pad:[45,52,57,60,64],root:33,tri:[57,60,64]},
    F :{pad:[41,48,53,57,60],root:29,tri:[53,57,60]},
    C :{pad:[48,52,55,60,64],root:36,tri:[55,60,64]},
    G :{pad:[43,50,55,59,62],root:31,tri:[55,59,62]},
    Dm:{pad:[38,50,53,57,62],root:26,tri:[53,57,62]},
    E :{pad:[40,47,52,56,59],root:28,tri:[52,56,59]}
  };
  var MEL={ /* [step, midi, steps] */
    Am:[[0,76,6],[6,81,2],[8,79,4],[12,76,4]],
    F :[[0,77,6],[6,76,2],[8,72,4],[12,69,4]],
    C :[[0,76,6],[6,79,2],[8,84,4],[12,83,4]],
    G :[[0,79,6],[6,74,2],[8,71,4],[12,74,4]],
    Dm:[[0,77,6],[6,74,2],[8,69,4],[12,74,4]],
    E :[[0,80,6],[6,76,2],[8,71,4],[12,68,4]]
  };
  var prog={};
  (function(){
    var s='Am Am F E Am F C G Am F Dm E Am F C G F G Am E Am F C G Am F Dm E Am F C G Am F C G F G Am Am Am F C G Am Am'.split(' ');
    for(var i=0;i<s.length;i++)prog[i+1]=s[i];
  })();
  M.cuts={};
  var ARP=[0,1,2,3,4,3,2,1,0,1,2,3,4,3,2,1];

  function sec(bar){return bar<=4?'intro':bar<=12?'build':bar<=20?'montage':bar<=28?'break':bar<=40?'climax':'outro'}
  M.chordAt=function(bar){return prog[bar]};

  M.step=function(step,t){
    var bar=Math.floor(step/16)+1,st=step%16,beat=st>>2,sub=st&3,S=sec(bar),name=prog[bar],ch=CH[name];
    if(!ch||bar>46)return;
    var barLen=spb*4,dn=st===0;
    /* the breath before the drop: last beat of bar 28 is silent */
    if(bar===28&&st>=12)return;
    var padDur=barLen-(bar===28?spb*1.1:.05);
    var ramp=function(b0,b1,v0,v1){return v0+(v1-v0)*Math.max(0,Math.min(1,(bar-b0)/(b1-b0)))};

    /* ===== pad / drone ===== */
    if(dn){
      if(S==='intro')pad(t,bar<=2?[ch.pad[0],ch.pad[1],ch.pad[2]]:ch.pad,padDur,ramp(1,4,.2,.32),ramp(1,4,420,900));
      else if(S==='build')pad(t,ch.pad,padDur,ramp(5,12,.4,.6),ramp(5,12,900,2000));
      else if(S==='montage')pad(t,ch.pad.slice(0,4),padDur,.6,2600);
      else if(S==='break')pad(t,ch.pad,padDur,ramp(21,28,.34,.58),ramp(21,28,1300,2200));
      else if(S==='climax')pad(t,ch.pad.slice(0,4),padDur,bar>=36?.9:.7,3200);
      else if(S==='outro')pad(t,ch.pad,padDur,bar>=45?.7:ramp(41,46,.75,.55),2000);
    }
    /* sub drone in intro/break */
    if(dn&&(S==='intro'||S==='break'||S==='outro'))bass(t,ch.root,barLen-.1,S==='intro'?.16:S==='break'?.2:.3);

    /* ===== suspense tick ===== */
    if(sub===0&&((S==='intro'&&bar>=2)||(S==='build'&&bar<=8)||(S==='break'&&bar>=25&&bar<=26)))tick(t,.11);

    /* ===== kick / drums ===== */
    var four=(S==='montage'||S==='climax'&&bar<36||S==='build'&&bar>=7);
    if(four&&sub===0)kick(t,S==='build'?ramp(7,12,.55,.85):S==='montage'?.92:.98,false);
    if(S==='build'&&bar<=6&&sub===0&&(beat===0||beat===2))kick(t,.55,false);
    if(S==='intro'&&bar>=3&&sub===0&&beat===0)kick(t,.5,true);
    if(S==='break'&&bar<=24&&(st===0||st===6))kick(t,st===0?.55:.38,true);
    if(S==='climax'&&bar>=36&&st===0)kick(t,.8,false);
    if(S==='climax'&&bar>=36&&st===8)clap(t,.5);
    if(bar===46&&st===0)kick(t,.4,true);
    /* clap / snare */
    if((S==='montage'||S==='climax'&&bar<36)&&sub===0&&(beat===1||beat===3))clap(t,.62);
    if(S==='build'&&bar>=9&&bar<=11&&sub===0&&(beat===1||beat===3))clap(t,ramp(9,11,.35,.6));
    /* hats */
    if(S==='build'&&bar>=8&&bar<=11&&(st&1)===0&&sub===2)hat(t,.16,false);
    if((S==='montage'||S==='climax'&&bar<36)){
      if(sub===2)hat(t,.2,beat===3||beat===1&&bar%2===0);else if((sub===1||sub===3)&&S==='montage')hat(t,.07,false);
    }
    /* rolls */
    var roll=(bar===12)||(bar===20)||(bar===27)||(bar===26&&false);
    if(bar===12){if(sub===0||sub===2)snare(t,.28+beat*.07)}
    if(bar===20){snare(t,.2+beat*.08+(sub&1?.04:0))}
    if(bar===26&&(st&1)===0&&sub!==1)snare(t,.2+beat*.04);
    if(bar===27){snare(t,.24+beat*.08+(sub*.015))}
    if(bar===28&&st<12&&(st&1)===0)snare(t,.5+st*.02);

    /* ===== bass ===== */
    var rolling=(S==='montage'||S==='climax'&&bar<36||S==='build'&&bar>=7);
    if(rolling&&(st&1)===0){
      var up=(st===6||st===14),acc=(st===0||st===8);
      bass(t,ch.root,spb*.45,S==='build'?ramp(7,12,.3,.42):.46);
      cello(t,ch.root+12+(up?12:0),spb*.5*.85,(S==='build'?ramp(7,12,.16,.3):S==='montage'?.34:.4)*(acc?1.15:1),S==='build'?ramp(7,12,500,1100):S==='montage'?1300:1700);
    }
    if(S==='climax'&&bar>=36&&dn){bass(t,ch.root,barLen-.1,.5);cello(t,ch.root+12,barLen*.98,.3,900)}
    /* digital cut effects (set by the film's edit) */
    if(sub===0&&M.cuts&&M.cuts[Math.floor(step/4)])cutFx(t,M.cuts[Math.floor(step/4)]);
    /* sonar pings keep the suspense in the breakdown */
    if(S==='break'&&bar>=21&&bar<=26&&st===12&&bar%2===1)ping(t,ch.tri[2]+24,.07);
    /* ===== arp ===== */
    var arpOn=(S==='build'&&bar>=7)||S==='montage'||(S==='climax'&&bar<36)||(S==='break'&&bar===25);
    if(arpOn){
      var idx=ARP[st],m=ch.pad[idx%5]+12+(st>=8&&S!=='build'?0:0);
      var v=S==='build'?ramp(7,12,.07,.15):S==='montage'?.17:S==='break'?.08:.2;
      var cut=S==='build'?ramp(7,12,900,2400):S==='montage'?2800:3200;
      pluck(t,m,v,cut);
    }

    /* ===== piano theme ===== */
    var pv=0;
    if(S==='intro')pv=bar===2||bar===4?.16:0;
    else if(S==='build')pv=bar>=5&&bar<=8?.14:bar>=9?.2:0;
    else if(S==='montage')pv=.22;
    else if(S==='break')pv=ramp(21,28,.26,.36);
    else if(S==='climax')pv=.32;
    else if(S==='outro')pv=bar===41||bar===43||bar===45?.3:0;
    if(pv>0){
      var mel=MEL[name]||[];
      mel.forEach(function(n){
        if(n[0]!==st)return;
        if(S==='intro'&&n[0]!==0)return;
        if(S==='build'&&bar<=8&&n[0]!==0&&n[0]!==8)return;
        if(S==='outro'&&n[0]!==0&&n[0]!==8)return;
        var shift=(S==='outro'&&bar>=43?-12:0);
        glass(t,n[1]+shift,n[2]*s16,pv);
        if(S==='break'||S==='climax'||S==='outro')glass(t,n[1]-12+shift,n[2]*s16,pv*.45);
      });
    }
    /* ===== lead doubles the theme in the climax ===== */
    if(S==='climax'&&bar>=33){(MEL[name]||[]).forEach(function(n){if(n[0]===st)lead(t,n[1]+(bar>=36?0:12),n[2]*s16,bar>=36?.16:.12)})}

    /* ===== hits ===== */
    if(dn){
      if(bar===13||bar===29){crash(t,.4);if(bar===29)boom(t,.7)}
      if(bar===5||bar===21||bar===41){boom(t,bar===21?.5:.6)}
      if(bar===36)crash(t,.3);
    }
    /* risers */
    if(st===0&&(bar===3||bar===11||bar===19||bar===26))riser(t,bar===3?spb*8:bar===26?spb*10:barLen*(bar===19?2:1),bar===26?.45:.34);
  };
  return M;
}
