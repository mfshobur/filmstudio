
/* ================= LOOKS =================
   A look is a style guide in code: palette, background painter, effects and motion feel. Scenes ask for one with
   scene({ look: 'wayang' }) (or per shot with params.look) and paint on top of it: c.pal has its colours, its bg(c) is painted before draw. */
scLook('plain',{desc:'A neutral dark stage. Use when the scene paints its own world.',bright:0,
  pal:{bg:'#0b1020',bg2:'#151a3a',ink:'#f3ead9',main:'#ffae5c',accent:'#86e6ff',soft:'#9aa4c7'},
  bg:function(c){c.clear(c.pal.bg)}});
scLook('wayang',{desc:'Wayang kulit: black perforated leather puppets against a lit cloth screen, a flickering oil lamp, jointed arms on rods.',bright:0,
  pal:{bg:'#e9a93a',bg2:'#b8661b',glow:'#ffe7a3',ink:'#0b0603',main:'#0b0603',accent:'#7a1f10',gold:'#f4c95d',soft:'#5b2d0b'},
  fx:[{n:'flicker',a:.07,rate:7},{n:'vignette',a:.6}],
  bg:function(c){
    var fl=1+(c.noise(c.t*6,2,1)-.5)*.1,lx=c.cx+(c.noise(c.t*2,5,1)-.5)*c.W*.02,ly=c.H*.1;
    c.clear(c.radial(lx,ly,0,Math.max(c.W,c.H)*.95*fl,[[0,c.pal.glow],[.32,c.pal.bg],[1,c.pal.bg2]]));
    for(var x=0;x<c.W;x+=Math.max(3,c.W/320)){c.line(x,0,x,c.H,{stroke:'rgba(90,40,0,'+(.04+c.hash(x|0,1,2)*.05)+')',lw:1})}
    c.rect(0,c.H*.9,c.W,c.H*.1,{fill:'#2a1306'});c.rect(0,c.H*.9,c.W,Math.max(2,c.H*.006),{fill:'#5b2d0b'});
  }});
