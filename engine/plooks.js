
/* ================= LOOKS =================
   A look is a style guide in code: palette, background painter, effects and motion feel. Scenes ask for one with
   scene({ look: 'wayang' }) (or per shot with params.look) and draw their own subjects on top: c.pal has the colours, the look's
   bg(c) is painted first, its fx run after. The looks follow the built-in styles (palettes measured from the gallery images) but
   they are guides, not subjects: nothing here draws a rabbit, a robot or a city; the scene does, in this look.
   Keys: desc, family (the built-in style it follows), bright (1 for light backgrounds), pal, fx, fps, boil, pixelate, levels, guide. */
function scLkStars(c,n,seed,col,size,tw){c.each(n,seed,function(i,r){var x=r()*c.W,y=r()*c.H*.85,t=.45+.55*Math.sin(c.t*(1+r()*3)+r()*6);c.circle(x,y,Math.max(.6,c.u*(size||.18)*(.5+r())),{fill:col,alpha:(tw===false?.8:t)*.85})})}
function scLkGrid(c,step,col,lw){for(var x=0;x<=c.W;x+=step)c.line(x,0,x,c.H,{stroke:col,lw:lw||1});for(var y=0;y<=c.H;y+=step)c.line(0,y,c.W,y,{stroke:col,lw:lw||1})}
function scLkHills(c,layers){layers.forEach(function(L,li){var pts=[[0,c.H]],x,y,n=Math.ceil(c.W/22);for(var i=0;i<=n;i++){x=i*22;y=c.H*L.y+(Math.sin(x*(L.freq||3)*.0035+(L.seed||0)*2.7+c.t*(L.sp||0))*.6+(c.noise(x*.003*(L.freq||3),L.seed||0,0)-.5)*.8)*c.H*(L.amp||.05);pts.push([x,y])}pts.push([c.W,c.H]);c.poly(pts,{fill:L.col,shadow:L.shadow?['rgba(0,0,0,.28)',c.u*1.6,0,-c.u*.5]:null})})}
function scLkSun(c,x,y,r,a,b){c.circle(x,y,r,{fill:c.radial(x,y-r,0,r*1.2,[[0,a],[1,b]])})}
function scLkFloor(c,hy,col,rows,cols,speed){var i,t=(c.t*(speed||.4))%1;for(i=0;i<rows;i++){var u=(i+t)/rows,y=hy+(c.H-hy)*u*u;c.line(0,y,c.W,y,{stroke:col,lw:1+u*2,alpha:.25+u*.75})}for(i=-cols;i<=cols;i++){c.line(c.cx+i*c.W*.02,hy,c.cx+i*c.W*.3,c.H,{stroke:col,lw:1.2,alpha:.7})}}
function scLkIsoGrid(c,col,step){var s=step||c.u*7,x,y,ox=c.cx%(s*2);for(y=-s;y<c.H+s;y+=s){for(x=-s*2;x<c.W+s*2;x+=s*2){var cx=x+ox+((Math.round(y/s)%2)?s:0);c.poly([[cx,y],[cx+s,y+s/2],[cx,y+s],[cx-s,y+s/2]],{stroke:col,lw:1,alpha:.5})}}}
function scLkDots(c,col,step,fn){for(var y=step/2;y<c.H;y+=step)for(var x=step/2;x<c.W;x+=step){var r=fn(x,y);if(r>.4)c.circle(x,y,r,{fill:col})}}

scLook('plain',{desc:'A neutral dark stage. Use when the scene paints its own whole world.',family:null,bright:0,
  pal:{bg:'#0b1020',bg2:'#151a3a',ink:'#f3ead9',main:'#ffae5c',accent:'#86e6ff',soft:'#9aa4c7'},
  guide:'No opinion. A dark navy field with the house palette: bone text, ember, ice. Choose it when your scene draws its own background.',
  bg:function(c){c.clear(c.pal.bg)}});

scLook('atom',{desc:'Dark space and science: glowing points and thin orbit lines on near-black, warm glow against cool light.',family:'atom',bright:0,
  pal:{bg:'#0b0c12',bg2:'#15151c',ink:'#e8e3d6',main:'#ffb25c',accent:'#8fd8ff',soft:'#6e635a',hi:'#fff3d0'},fx:[{n:'vignette',a:.5}],
  guide:'Near-black field, a handful of luminous things. Everything glows: use c.glow with the ember warm tone for the subject and ice-blue for the thin lines around it. Lines are 1-2 px, never filled. Motion is slow orbiting and breathing, nothing snaps. Leave most of the frame empty.',
  bg:function(c){c.clear(c.radial(c.cx,c.cy,0,Math.max(c.W,c.H)*.7,[[0,c.pal.bg2],[1,c.pal.bg]]));scLkStars(c,60,3,'#d8d2c0',.14)}});

scLook('math',{desc:'Blueprint: deep blue graph paper with fine white-blue lines, one orange curve being drawn.',family:'math',bright:0,
  pal:{bg:'#101f38',bg2:'#152641',ink:'#cfe6ff',main:'#ffb25c',accent:'#6fd2ff',soft:'#4c6a96'},fx:[{n:'vignette',a:.4}],
  guide:'Navy graph paper: a faint minor grid, a stronger major grid, thin cyan-white linework and one warm orange line that does the telling. Draw lines being traced (animate a path length from c.t). Labels are small mono text. Keep shapes geometric and exact.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,c.pal.bg2],[1,c.pal.bg]]));scLkGrid(c,c.u*4,'rgba(111,210,255,.07)',1);scLkGrid(c,c.u*20,'rgba(111,210,255,.16)',1.2)}});

scLook('cartoon',{desc:'Friendly flat cartoon: warm yellow room, chunky outlines, rounded shapes, a mascot with big eyes.',family:'cartoon',bright:1,
  pal:{bg:'#f2c85e',bg2:'#e09b3a',ink:'#1a2444',main:'#3a5bd9',accent:'#ff6f91',soft:'#fff1c9',hi:'#ffffff'},fx:[{n:'paper',a:.07}],
  guide:'Flat colour, no gradients on subjects. Everything has a dark navy outline of one consistent width (about 0.5% of the height) and rounded ends. Characters are simple stacks of circles and rounded rectangles with big white eyes. Motion is squash and stretch with overshoot (c.ease.back or c.ease.elastic). Speech and thought go in white rounded bubbles.',
  bg:function(c){c.clear(c.pal.bg);c.rect(0,c.H*.78,c.W,c.H*.22,{fill:c.pal.bg2});c.rect(0,c.H*.78,c.W,c.u*.6,{fill:c.pal.ink,alpha:.3})}});

scLook('chart',{desc:'Data in 3D: navy stage with a floor grid, cream and amber bars rising, counters ticking up.',family:'chart',bright:0,
  pal:{bg:'#0f1322',bg2:'#1a2040',ink:'#d8d3ba',main:'#e8d9b0',accent:'#ffb25c',soft:'#8d8778'},fx:[{n:'vignette',a:.5}],
  guide:'A dark stage lit from above. Bars and blocks are cream with a darker side face and an amber highlight on the top edge. Numbers count up in mono with thousands separators. A single curve in amber traces the trend. Bars grow with ease.out, staggered, never all at once.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,c.pal.bg2],[1,c.pal.bg]]));scLkFloor(c,c.H*.62,'rgba(216,211,186,.18)',9,10,.1)}});

scLook('explainer',{desc:'Technical explainer: dark panel, labelled nodes and cubes in violet and amber, soft glow, small callout labels.',family:'explainer',bright:0,
  pal:{bg:'#12192e',bg2:'#0c101d',ink:'#c6cac5',main:'#8f7bff',accent:'#ffb25c',soft:'#81837d',node:'#6fb1ff'},fx:[{n:'vignette',a:.45}],
  guide:'Dark slate with glowing spheres (violet, blue, amber) joined by hairlines. Callouts are small white pills with a short uppercase label and a leader line. Show structure first, then data flowing through it (small bright dots travelling along the lines). Calm, precise motion.',
  bg:function(c){c.clear(c.radial(c.cx,c.cy,0,Math.max(c.W,c.H)*.75,[[0,c.pal.bg],[1,c.pal.bg2]]));scLkStars(c,40,9,'#7a86b8',.12,false)}});

scLook('iso',{desc:'Isometric miniature: a diamond floor, small coloured blocks in teal, coral and sand, soft top light.',family:'iso',bright:0,
  pal:{bg:'#172641',bg2:'#0f1729',ink:'#e6eef2',main:'#e8825f',accent:'#3b8681',hi:'#8ecec8',soft:'#ffd9a8',sand:'#e9c78b'},fx:[{n:'vignette',a:.4}],
  guide:'Everything sits on a 2:1 isometric grid (x step 2, y step 1). Blocks have three faces: top lightest, left mid, right darkest, in teal, coral, sand and white. Buildings grow from the ground with ease.out and tiny staggers. A soft round light glows above the scene. No outlines, only the face shading.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,c.pal.bg],[1,c.pal.bg2]]));scLkIsoGrid(c,'rgba(142,206,200,.1)',c.u*6)}});

scLook('paper',{desc:'Layered paper cut-out: warm sky, a sun disc, hills stacked like cut paper with soft shadows between layers.',family:'paper',bright:1,
  pal:{bg:'#f7d6a8',bg2:'#f4a672',ink:'#264653',main:'#e76f51',accent:'#2a9d8f',soft:'#f4a261',gold:'#f2cc8f',deep:'#264653'},fx:[{n:'paper',a:.1}],
  guide:'Shapes are flat paper cut-outs stacked in layers. Each layer casts a soft shadow onto the one behind (use the shadow option). Palette is sunset: peach sky, coral, teal, deep blue-green. No outlines. Motion is parallax: far layers move slower (c.layer(depth)). Add a few small bird marks and a pale sun disc.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#f9dcb0'],[1,c.pal.bg2]]));scLkSun(c,c.W*.68,c.H*.34,c.u*13,'#fff6d8','#f9d27a');scLkHills(c,[{y:.62,amp:.05,freq:2,seed:1,col:'#f08a64',shadow:1},{y:.72,amp:.06,freq:2.6,seed:2,col:'#2a9d8f',shadow:1},{y:.85,amp:.05,freq:3.2,seed:3,col:'#264653',shadow:1}])}});

scLook('synth',{desc:'Synthwave: purple-pink sky, striped sun, mountain silhouettes, a neon perspective grid scrolling toward you.',family:'synth',bright:0,
  pal:{bg:'#1a0f2b',bg2:'#403363',ink:'#ffe9f5',main:'#d350ad',accent:'#6be3ff',soft:'#8a6fb0',hi:'#f0cea1',violet:'#732a91'},fx:[{n:'vignette',a:.45}],
  guide:'Night gradient from violet to magenta, a big sun split by dark horizontal bars, black mountain triangles on the horizon, then a magenta grid floor with cyan highlights moving toward the camera. Neon outlines glow (draw each line twice, wide and faint, then thin and bright). Motion is steady forward travel at a constant speed.',
  bg:function(c){var hy=c.H*.58;c.clear(c.grad(0,0,0,hy,[[0,c.pal.bg],[.6,c.pal.violet],[1,c.pal.main]]));scLkSun(c,c.cx,hy-c.u*6,c.u*17,'#f0cea1','#d350ad');for(var i=0;i<6;i++)c.rect(c.cx-c.u*18,hy-c.u*14+i*c.u*3.4,c.u*36,c.u*(.5+i*.35),{fill:c.pal.bg});c.poly([[0,hy],[c.W*.18,hy-c.u*7],[c.W*.3,hy],[c.W*.7,hy],[c.W*.85,hy-c.u*9],[c.W,hy]],{fill:'#1a0f2b'});c.rect(0,hy,c.W,c.H-hy,{fill:'#1a0f2b'});scLkFloor(c,hy,c.pal.main,12,14,.5)}});

scLook('type',{desc:'Kinetic typography: dark slate, big serif italic words in bone with one ember accent, motion blur on arrival.',family:'type',bright:0,
  pal:{bg:'#282b38',bg2:'#1a1e28',ink:'#f3ead9',main:'#ffae5c',accent:'#86e6ff',soft:'#655f5d'},fx:[{n:'vignette',a:.5}],
  guide:'Words are the picture. Big italic serif, bone coloured, one word per beat in the accent ember. Each word arrives with ease.out from slightly below with a faint blur trail and settles; earlier words fade to 30%. Mono for small supporting labels. Lots of empty slate around the words.',
  bg:function(c){c.clear(c.radial(c.cx,c.cy,0,Math.max(c.W,c.H)*.7,[[0,c.pal.bg],[1,c.pal.bg2]]))}});

scLook('board',{desc:'Whiteboard: off-white board, black marker handwriting, red and blue marker accents, things drawn stroke by stroke.',family:'board',bright:1,
  pal:{bg:'#ebeae0',bg2:'#d8d7cc',ink:'#1a1a1a',main:'#d1495b',accent:'#2e86ab',soft:'#a8a6a1'},fx:[{n:'paper',a:.08}],
  guide:'Everything is drawn by hand, in marker. Strokes have round caps and a slight wobble (c.wob). Reveal by drawing: animate a path from 0 to full length. Black for structure, red for the thing that matters, blue for the second thing. Underline the key word last. Keep it sparse; never fill large areas.',
  bg:function(c){c.clear(c.pal.bg);scLkGrid(c,c.u*5,'rgba(120,120,110,.08)',1)}});

scLook('wayang',{desc:'Wayang kulit: black perforated leather puppets against a lit cloth screen, a flickering oil lamp, jointed arms on rods.',family:'shadow',bright:0,
  pal:{bg:'#e9a93a',bg2:'#b8661b',glow:'#ffe7a3',ink:'#0b0603',main:'#0b0603',accent:'#7a1f10',gold:'#f4c95d',soft:'#5b2d0b'},
  fx:[{n:'flicker',a:.07,rate:7},{n:'vignette',a:.6}],
  guide:'A lit cloth screen (kelir) with the lamp (blencong) high and slightly off-centre, flickering. Puppets are pure black silhouettes, in profile, with jointed arms on thin rods; their ornament is perforation (holes the light shows through: c.holes.diamonds, dots, slits, scallops), not painted detail. Stage them on the banana-trunk line at the bottom. Motion is stiff and ceremonial: puppets slide, turn by flipping, arms swing from the shoulder; no squash and stretch. The gunungan (tree of life) opens and closes scenes.',
  bg:function(c){
    var fl=1+(c.noise(c.t*6,2,1)-.5)*.1,lx=c.cx+(c.noise(c.t*2,5,1)-.5)*c.W*.02,ly=c.H*.1;
    c.clear(c.radial(lx,ly,0,Math.max(c.W,c.H)*.95*fl,[[0,c.pal.glow],[.32,c.pal.bg],[1,c.pal.bg2]]));
    for(var x=0;x<c.W;x+=Math.max(3,c.W/320)){c.line(x,0,x,c.H,{stroke:'rgba(90,40,0,'+(.04+c.hash(x|0,1,2)*.05)+')',lw:1})}
    c.rect(0,c.H*.9,c.W,c.H*.1,{fill:'#2a1306'});c.rect(0,c.H*.9,c.W,Math.max(2,c.H*.006),{fill:'#5b2d0b'});
  }});
SC_LOOKS.shadow=SC_LOOKS.wayang;

scLook('pixel',{desc:'Pixel art: chunky low-resolution pixels, a limited palette, hard edges, 8-bit text.',family:'pixel',bright:0,
  pal:{bg:'#1b2a3f',bg2:'#111421',ink:'#e8f0ff',main:'#2bd36e',accent:'#2b8fcc',hi:'#ffd166',red:'#e84a5f',soft:'#806d87'},pixelate:4,levels:6,fx:[{n:'scan',a:.07,step:4}],
  guide:'The scene is drawn at 1/4 resolution and scaled up with no smoothing, then reduced to 6 levels per channel, so every shape is blocky automatically. Design on a coarse grid: sprites of 8-16 cells, no anti-aliased curves, no gradients. A small palette: navy, green, blue, gold, red. Text is a chunky monospace. Motion steps in whole pixels.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#26405f'],[1,c.pal.bg]]));c.rect(0,c.H*.82,c.W,c.H*.18,{fill:'#12a05a'});c.rect(0,c.H*.82,c.W,c.u*1.6,{fill:'#7ae582'})}});

scLook('glitch',{desc:'Digital glitch: dark violet field, RGB channel splitting, scanlines, tearing and static on beats.',family:'glitch',bright:0,
  pal:{bg:'#110b1a',bg2:'#251e3a',ink:'#f5efff',main:'#d9a065',accent:'#a1376a',soft:'#6b5a8a',violet:'#4a1b5d',cyan:'#4b697f'},fx:[{n:'chroma',px:3,pulse:1,a:.5},{n:'scan',a:.16,step:3},{n:'flicker',a:.05,rate:13}],
  guide:'A clean image that keeps failing. Draw the subject normally, then break it on the beat: horizontal slices shifted sideways (use c.pulse to trigger), colour channels split (the chroma effect does this), scanlines, a block of static. Use short bursts, then go clean again; constant glitch is just noise. Text is mono, uppercase, with a stuttering cursor.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,c.pal.bg2],[1,c.pal.bg]]))}});

scLook('ink',{desc:'Ink wash (sumi-e): warm rice paper, soft grey mist, a few confident black brush strokes, one red seal.',family:'ink',bright:1,
  pal:{bg:'#e6e3d3',bg2:'#bab7ab',ink:'#161615',main:'#3a3a38',accent:'#b23a2a',soft:'#99978d'},fx:[{n:'paper',a:.14}],
  guide:'Mostly empty paper. A few strokes of varying width (thick on the press, thin on the lift): c.curve with a stroke width that changes along the line. Greys are washes: layer several low-alpha shapes with soft shadow blur for mist. Exactly one red seal (a small square) as the signature. Motion is slow: strokes are painted on over time and mist drifts. Never fill the frame.',
  bg:function(c){c.clear(c.pal.bg);for(var i=0;i<3;i++){var y=c.H*(.55+i*.12);c.rect(0,y,c.W,c.H*.1,{fill:c.grad(0,y,0,y+c.H*.1,[[0,'rgba(120,118,108,0)'],[.5,'rgba(120,118,108,'+(.1+i*.04)+')'],[1,'rgba(120,118,108,0)']])})}}});

scLook('comic',{desc:'Pop-art comic: cream paper with halftone dots, thick black outlines, hot pink and yellow, bursts and sound effects.',family:'comic',bright:1,
  pal:{bg:'#f4ead3',bg2:'#ddcfbe',ink:'#1c1c1a',main:'#e8548c',accent:'#2fb8c9',yellow:'#ffd23f',soft:'#ddcfbe'},fx:[{n:'paper',a:.08}],
  guide:'Thick black outlines (about 1% of the height), flat saturated fills, halftone dot shading (dots whose size follows a gradient). Panels have hard borders and slight rotation. Impact is a jagged burst shape with a big hand-lettered word (POW, ZAP). Motion snaps: scale in with ease.back and hold. Speech is in white ovals with a tail.',
  bg:function(c){c.clear(c.pal.bg);scLkDots(c,'rgba(232,84,140,.45)',c.u*3.2,function(x,y){var d=Math.hypot(x-c.W*.9,y-c.H*.1)/Math.max(c.W,c.H);return c.u*1.15*Math.max(0,1.1-d*1.6)})}});

scLook('gen',{desc:'Generative abstract: dark field, flowing lines and soft blobs in muted teal, rose and sand, slow and hypnotic.',family:'gen',bright:0,
  pal:{bg:'#0f111c',bg2:'#201f2b',ink:'#e8e3d6',main:'#a1bbbf',accent:'#d86f9a',hi:'#e6c7a0',soft:'#86776d'},fx:[{n:'vignette',a:.5}],
  guide:'No objects, only fields: flowing lines driven by c.noise, Voronoi cells, radial petals, soft blobs. Muted teal, rose and sand on near-black. Many thin low-alpha strokes accumulate into form. Everything moves slowly and continuously (noise advancing with c.t), nothing repeats exactly.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,c.pal.bg2],[1,c.pal.bg]]))}});

scLook('vapor',{desc:'Vaporwave: pink-to-blue gradient sky, a striped sun, a checkered floor, retro windows and palm silhouettes.',family:'vapor',bright:0,
  pal:{bg:'#7b4a8f',bg2:'#558cdc',ink:'#ffffff',main:'#ff71ce',accent:'#01cdfe',soft:'#e4beca',mint:'#05ffa1',violet:'#b967ff',yellow:'#fffb96'},fx:[{n:'scan',a:.07,step:3}],
  guide:'Pastel neon: hot pink, cyan, mint, violet. A pink-violet gradient sky, a pale yellow sun, a magenta-cyan checkered floor receding to the horizon. Retro desktop windows (grey bevelled title bars, tiny dialog text) float in the sky. Slow drifting motion; text in a wide spaced sans. Nostalgia, not irony.',
  bg:function(c){var hy=c.H*.6;c.clear(c.grad(0,0,0,hy,[[0,c.pal.violet],[1,c.pal.main]]));scLkSun(c,c.cx,hy-c.u*8,c.u*14,'#fffb96','#ff71ce');c.rect(0,hy,c.W,c.H-hy,{fill:'#2b1a5e'});for(var i=0;i<14;i++){var u=i/14,y=hy+(c.H-hy)*u*u;c.line(0,y,c.W,y,{stroke:'#01cdfe',lw:1+u*2,alpha:.7})}for(i=-12;i<=12;i++)c.line(c.cx+i*c.W*.02,hy,c.cx+i*c.W*.3,c.H,{stroke:'#ff71ce',lw:1.3,alpha:.8})}});

scLook('memphis',{desc:'Memphis pattern: off-white ground, scattered squiggles, triangles, dots and half-circles in pink, teal, yellow and blue.',family:'memphis',bright:1,
  pal:{bg:'#f2e7dc',bg2:'#cec5bd',ink:'#141211',main:'#ff5d8f',accent:'#2ec4b6',yellow:'#ffd166',blue:'#3a86ff',soft:'#aaa29e'},fx:[{n:'paper',a:.06}],
  guide:'A busy, playful 1980s pattern. Scatter small geometric confetti (squiggles, triangles, half circles, plus signs, dot grids) in four bright colours over off-white, each with a thin black outline. Place by c.each(n, seed) so the arrangement is stable. Shapes bob and rotate slowly on beats. The main subject is bold black sans text.',
  bg:function(c){c.clear(c.pal.bg);var cols=[c.pal.main,c.pal.accent,c.pal.yellow,c.pal.blue];c.each(34,7,function(i,r){var x=r()*c.W,y=r()*c.H,s=c.u*(1.6+r()*2.6),k=Math.floor(r()*4),col=cols[i%4],rot=(r()-.5)*60+Math.sin(c.t*.8+i)*8;c.at(x,y+Math.sin(c.t+i)*c.u*.6,{rot:rot},function(){if(k===0)c.circle(0,0,s,{fill:col});else if(k===1)c.poly([[-s,s],[s,s],[0,-s]],{fill:col,stroke:c.pal.ink,lw:1.5});else if(k===2)c.curve([[-s*1.4,0],[-s*.7,-s],[0,0],[s*.7,s],[s*1.4,0]],{stroke:col,lw:c.u*.55});else{c.rect(-s*.2,-s,s*.4,s*2,{fill:col});c.rect(-s,-s*.2,s*2,s*.4,{fill:col})}})})}});

scLook('poster',{desc:'Swiss / Bauhaus poster: bone paper, big flat geometric shapes in red, yellow and blue, tight sans typography.',family:'poster',bright:1,
  pal:{bg:'#dfdbcd',bg2:'#a8a49a',ink:'#222427',main:'#c9383e',accent:'#e6b211',blue:'#1d4e89',soft:'#a8a49a'},fx:[{n:'paper',a:.12}],
  guide:'A grid and a few big shapes. Flat red, yellow, blue and black on bone paper, no gradients, no outlines. Shapes overlap with multiply-style crossings. Type is bold grotesque, flush left, very large, with a tiny caption set far away for tension. Composition is asymmetric with deliberate emptiness. Motion is a clean slide or scale into place and a hold.',
  bg:function(c){c.clear(c.pal.bg);scLkGrid(c,c.u*10,'rgba(34,36,39,.06)',1)}});

scLook('ascii',{desc:'Terminal / ASCII: black screen, green phosphor monospace, falling code, typed lines with a block cursor.',family:'ascii',bright:0,
  pal:{bg:'#0a1112',bg2:'#0c1313',ink:'#c6ffe0',main:'#27e07a',accent:'#9cf0c0',soft:'#0f3d28'},fx:[{n:'scan',a:.12,step:3},{n:'flicker',a:.04,rate:11},{n:'vignette',a:.5}],
  guide:'A terminal. Monospace only, green phosphor on black with a soft glow on bright characters. Things are made of characters: density ramps (" .:-=+*#%@") for shading, rain columns for texture. Text is typed (c.type) with a block cursor that blinks on the beat; commands start with "> ". Static, deliberate, a little ominous.',
  bg:function(c){c.clear(c.pal.bg)}});

scLook('clay',{desc:'Claymation soft: pastel lavender, plump rounded shapes with soft shading and a gentle drop shadow, candy colours.',family:'clay',bright:1,
  pal:{bg:'#e6ddf0',bg2:'#cfbed0',ink:'#5b4b6b',main:'#ff8fb8',accent:'#7fd8ff',yellow:'#ffe08a',mint:'#9be8c4',soft:'#a7a1b0'},fx:[{n:'vignette',a:.18}],
  guide:'Everything looks like soft modelling clay: plump rounded shapes with a radial highlight (bright top-left, darker bottom-right), a soft contact shadow, no outlines. Candy pastels. Letters are fat rounded. Motion is squishy: ease.elastic on arrival, a slow wobble while idle.',
  bg:function(c){c.clear(c.radial(c.cx,c.cy*.8,0,Math.max(c.W,c.H)*.8,[[0,'#f3ecf8'],[1,c.pal.bg2]]))}});

scLook('origami',{desc:'Origami: warm cream paper, crisp folded facets in blue, teal and coral with visible creases, quiet and precise.',family:'origami',bright:1,
  pal:{bg:'#e9ddc4',bg2:'#beb19c',ink:'#2b2b2b',main:'#e07a5f',accent:'#375769',light:'#69a2b3',teal:'#3d9a8b',soft:'#918677'},fx:[{n:'paper',a:.14}],
  guide:'Shapes are folded paper: flat polygons with two tones per fold (lit and shadowed side) and a hairline crease. Only straight edges and 45-degree angles. A restrained palette on cream. Motion is folding itself: a polygon rotates about its edge (scale one axis through zero) to reveal its other face.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#efe5cf'],[1,c.pal.bg]]))}});

scLook('lowpoly',{desc:'Low poly: peach sky gradient, faceted terrain and shapes made of flat triangles in teal, slate and clay.',family:'lowpoly',bright:1,
  pal:{bg:'#f4ccac',bg2:'#e4aa8b',ink:'#3a2b2a',main:'#679998',accent:'#a87463',slate:'#4c606a',soft:'#e4aa8b'},fx:[{n:'vignette',a:.18}],
  guide:'Surfaces are meshes of flat-shaded triangles: each triangle one solid colour, neighbours differing slightly in lightness, lit from the upper left. Build terrain from a jittered grid (c.rand) triangulated by hand; never smooth. Warm peach sky, cool teal and slate land. Motion is a slow orbit or drift of the whole mesh.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#f8d8bd'],[1,c.pal.bg2]]))}});

scLook('voxel',{desc:'Voxel world: bright sky blue, a chunky isometric island of cubes in grass green, sand and water blue.',family:'voxel',bright:1,
  pal:{bg:'#9fc6e0',bg2:'#476569',ink:'#19221f',main:'#72bb67',accent:'#4ba0d7',sand:'#ddd09e',stone:'#8d8f98',soft:'#c9e2f0'},fx:[{n:'vignette',a:.12}],
  guide:'Built from cubes only, isometric, with three flat face tones (top bright, left mid, right dark). Grass green, sand, water blue, stone grey, tiny trees of stacked cubes. Water rises and falls in whole-cube steps. Motion is stepwise: blocks pop in one at a time on beats.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#7fb4d9'],[1,c.pal.soft]]))}});

scLook('map',{desc:'Cartographic: cream map paper with a faint grid, soft green land and blue water, a red route drawn between pins.',family:'map',bright:1,
  pal:{bg:'#e9e5d0',bg2:'#d7d7c3',ink:'#3a3a3a',main:'#d1495b',accent:'#2e86ab',land:'#bcd9b0',water:'#8fc0dc',soft:'#a2a79c'},fx:[{n:'paper',a:.1}],
  guide:'A paper map: cream ground, a fine grid, big soft blobs of green land and blue water, thin dark labels in italic serif. The story is a red route drawn along its length (animate the path), with a pin at each end and a small label. Camera moves like a hand dragging the map (c.camera).',
  bg:function(c){c.clear(c.pal.bg);c.ellipse(c.W*.22,c.H*.3,c.W*.2,c.H*.22,{fill:c.pal.land,alpha:.8});c.ellipse(c.W*.8,c.H*.75,c.W*.22,c.H*.2,{fill:c.pal.land,alpha:.8});c.curve([[0,c.H*.55],[c.W*.3,c.H*.45],[c.W*.55,c.H*.62],[c.W,c.H*.5]],{stroke:c.pal.water,lw:c.u*2.4});scLkGrid(c,c.u*8,'rgba(60,60,50,.07)',1)}});

scLook('multiplane',{desc:'Multiplane forest: deep green misty layers, tall dark trunks in front, pale light behind, slow parallax drift.',family:'multiplane',bright:0,
  pal:{bg:'#293e3a',bg2:'#192826',ink:'#e8f0e4',main:'#6c8077',accent:'#f2d9a0',mist:'#b6beb2',soft:'#3f5a53'},fx:[{n:'vignette',a:.5}],
  guide:'Five or more flat layers, back to front, each darker and more contrasty than the one behind, with mist (a pale low-alpha gradient) between them. The camera drifts sideways and each layer moves by its depth (c.layer(depth)), the near ones fastest. Light comes from behind the trees. Calm, immersive, slow.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#8fa79c'],[.5,c.pal.bg],[1,c.pal.bg2]]))}});

scLook('stopmo',{desc:'Stop-motion: paper craft at 8 frames per second, slightly jittering edges, handmade warmth.',family:'stopmo',bright:1,
  pal:{bg:'#efccac',bg2:'#bb9d85',ink:'#151d20',main:'#da7854',accent:'#247067',brown:'#996751',soft:'#f6dcc0'},fps:8,boil:3,fx:[{n:'paper',a:.14}],
  guide:'Time is quantized: everything updates 8 times a second (the look sets c.t accordingly) and each frame the whole drawing shifts a pixel or two (boil), as if photographed one frame at a time. Cut-paper shapes with a little drop shadow, craft colours (peach, terracotta, teal, brown). Movement is in small steps and never perfectly smooth.',
  bg:function(c){c.clear(c.grad(0,0,0,c.H,[[0,'#f6dcc0'],[1,c.pal.bg]]))}});

scLook('domino',{desc:'Domino run: a dark floor, white tiles in long lines, a soft pool of light, chain reactions that read from left to right.',family:'domino',bright:0,
  pal:{bg:'#131825',bg2:'#0e111b',ink:'#cad3c8',main:'#e8eee4',accent:'#ffb25c',soft:'#898e85'},fx:[{n:'vignette',a:.55}],
  guide:'A glossy dark floor and ivory tiles. One long diagonal or horizontal line of tiles, a single pool of top light, a thin reflection under each tile. The action is a wave: tile i falls at time i * delay. Never more than one thing moving except the wave. Pays off with the tiles revealing a word or shape.',
  bg:function(c){c.clear(c.pal.bg2);c.rect(0,c.H*.62,c.W,c.H*.38,{fill:c.grad(0,c.H*.62,0,c.H,[[0,'#1b2233'],[1,c.pal.bg2]])});c.glow(c.cx,c.H*.55,c.W*.5,'rgba(255,240,210,.18)',1)}});
