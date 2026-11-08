'use strict';
// Known shot styles. Each style has variants, a one-line description and when to use it.
const STYLES = {
  atom:      { variants: ['spark', 'wait', 'molecule', 'universe', 'prompt'], use: 'wonder, beginnings, science, calm endings. "universe" zooms an atom out to a galaxy; "wait" is dim and tense; "prompt" is a calm closing image.' },
  math:      { variants: ['sine', 'descent', 'prompt'], use: 'how things work, logic, learning. Blueprint look with drawn curves and formulas.' },
  cartoon:   { variants: ['follow', 'heart', 'wonder'], use: 'friendly explanation, characters, health, curiosity. Flat bright colours with a robot mascot.' },
  chart:     { variants: ['learn', 'skyline', 'skyline2'], use: 'growth, data, scale. 3D bars rising; "learn" adds a counter and a trend line.' },
  explainer: { variants: ['neural', 'cube'], use: 'systems, structure, technology. Glossy 3D nodes with labels, or an exploded cube.' },
  iso:       { variants: ['city', 'city2', 'cubes'], use: 'building, cities, products, progress. Isometric blocks that rise in a wave.' },
  paper:     { variants: ['land1', 'land2', 'window'], use: 'warmth, humanity, nature, art. Layered paper landscapes; "window" is a quiet human silhouette scene.' },
  synth:     { variants: ['sun', 'eq'], use: 'energy, music, nightlife, tech nostalgia. Neon sunset grid; "eq" adds an equalizer skyline.' },
  stage:     { variants: ['scene'], optional: true, use: 'OPTIONAL. Characters (defined in spec.characters) in front of any other style as the background. Use only when the story needs a character. 5th shot element carries params: {background:[style,variant], cast:[{char,x,action,emotion,say,walkTo}], props:[...]}.' },
  type:      { variants: ['words', 'stack', 'wave', 'focus'], params: true, use: 'Kinetic typography: the words of a line animate on the beat. Needs params {text, palette?:{bg,fg,accent}, font?:"serif|sans|mono", emphasize?:[wordIndex], perBeat?}. words = one big word at a time, stack = lines build up, wave = letters ripple, focus = current word big with echoes. Great for key messages, stats, quotes.' },
  board:     { variants: ['icons', 'equation'], params: true, use: 'Whiteboard: hand-drawn line icons or handwritten lines drawn live by a marker. Needs params {items:[{icon,label}]} (icons) or {text:"line1\\nline2"} (equation); optional title, palette. Icons: ' + 'bulb heart house book rocket chart person tree cloud star gear check' + '. Great for explainers and lists.' },
  shadow:    { variants: ['scene', 'gunungan'], params: true, use: 'Shadow puppets (wayang kulit / silhouette theatre): black pierced cut-out figures in front of a lamp-lit screen. params {tone?:"warm|cool|red", puppets:[{kind,x,y,scale,flip,move:"sway|walk|bow",walkTo}], title?}. kinds: hero demon clown gunungan bird tree mountain house deer. "gunungan" with no puppets shows the tree of life.' },
  pixel:     { variants: ['city', 'hero', 'text'], params: false, use: 'Pixel art (16-colour, low-res scaled up with scanlines): "city" night skyline, "hero" a runner on scrolling ground, "text" typed text on a CRT (params {text, color?}). Retro games, nostalgia, tech.' },
  glitch:    { variants: ['vhs', 'rgb', 'corrupt'], params: true, use: 'Glitch / VHS effect laid over any other style. params {background:[style,variant], intensity?:0-1, text?}. vhs = tracking bar + PLAY timestamp, rgb = colour split pulsing on the beat, corrupt = block displacement. Use for breaks, errors, tension, cuts.' },
  ink:       { variants: ['mountains', 'bamboo', 'calligraphy'], params: false, use: 'Chinese ink wash (shuimo) on rice paper with one red seal: misty mountains, growing bamboo, or brushed text (calligraphy needs params {text}). Calm, nature, wisdom, philosophy, negative space.' },
  comic:     { variants: ['panels', 'burst', 'speed'], params: false, use: 'Halftone comic book: panels (params {captions:[3 strings]}), burst (params {sfx}), speed lines (params {sfx}); optional palette {a,b,paper}. Energy, action, humour, impact words.' },
  gen:       { variants: ['flow', 'voronoi', 'mandala', 'blobs'], params: false, use: 'Generative patterns: flow-field streamlines, moving Voronoi cells, rotating mandala, metaball blobs. Optional params {palette:{bg,a,b,c}}. Abstract mood shots, transitions, backgrounds for ideas without a literal picture.' },
  vapor:     { variants: ['grid', 'windows'], params: false, use: 'Vaporwave: pastel sunset, checkerboard floor, palms, floating wireframe (grid; optional {text} spaced out), or retro OS windows with an error dialog (windows). Nostalgia, internet culture, dreamlike.' },
  memphis:   { variants: ['pattern'], params: false, use: 'Memphis design: bold 80s shapes (squiggles, triangles, dots) popping on the beat; optional {text, palette:[colours], bg}. Playful, youthful, ads, fashion.' },
  poster:    { variants: ['swiss', 'bauhaus'], params: false, use: 'Typographic poster: swiss (grid, red circle, big sans title; params {title, sub}) or bauhaus (primary-colour geometric composition; optional {title}). Clean statements, design, culture.' },
  ascii:     { variants: ['rain', 'text', 'plasma'], params: false, use: 'ASCII / terminal: falling code rain, typed terminal text (params {text}), or ASCII plasma. Hackers, code, data, retro computing.' },
  clay:      { variants: ['shapes', 'text'], params: false, use: 'Claymorphism: soft puffy pastel shapes bouncing, or puffy text (params {text}); optional {palette:[...], bg}. Friendly, modern app/product feel.' },
  origami:   { variants: ['boat', 'fold'], params: false, use: 'Paper folding: a faceted paper boat on layered waves, or a sheet folding along its diagonals (optional {text}). Patience, craft, journeys, transformation.' },
  lowpoly:   { variants: ['terrain', 'orb'], params: false, use: 'Low-poly 3D: flat-shaded triangle terrain at sunrise, or a rotating faceted orb (optional {color}). Landscapes, planets, modern tech.' },
  voxel:     { variants: ['island'], params: false, use: 'Voxel island of cubes with water, sand, grass, rock, snow and trees that grows outward. Games, worlds, building.' },
  map:       { variants: ['route', 'timeline'], params: true, use: 'Stylised map route from A to B (params {from, to, distance?}) or a timeline (params {events:[{year,label}]}). Travel, logistics, history, progress. Not geographically accurate.' },
  multiplane:{ variants: ['forest'], params: false, use: 'Multiplane glass-layer depth (Norstein-style): painterly misty forest with parallax layers, light shafts, drifting motes; optional {palette:{sky,low,layers:[5 colours]}}. Gentle, nostalgic, poetic.' },
  stopmo:    { variants: ['boil'], params: true, use: 'Stop-motion look over any other style: choppy frame rate and hand-made jitter. params {background:[style,variant], fps?:8, boil?:1}. Handmade charm.' },
  image:     { variants: ['kenburns', 'pop', 'polaroid', 'cutout', 'logo'], params: true, use: 'YOUR OWN picture or logo (png, jpg, webp, gif, svg), embedded in the film. params {src:"assets/photo.jpg", caption?, bg?:"#hex" or [style,variant], pan?:"left|right|up|down"}. kenburns = slow zoom/pan full screen, pop = bounces in with a shadow, polaroid = tilted instant photo (caption written on it), cutout = paper cut-out with white edge, logo = clean centred logo that pulses on the beat.' },
  domino:    { variants: ['wave', 'title', 'topple', 'cascade'], use: 'reveals and chain reactions. "title" flips tiles to reveal meta.titleLines; "topple" is a slow suspense row.' },
};
const FORMATS = { '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:5': [4, 5] };
/* default pixel size for a format; `long` is the longer side */
function sizeFor(format, long) { const f = FORMATS[format] || FORMATS['16:9'], L = long || 640, k = L / Math.max(f[0], f[1]); return [Math.round(f[0] * k / 2) * 2, Math.round(f[1] * k / 2) * 2]; }
const SCORES = {
  'anthem-46': { bars: 46, bpm: 128, note: 'Energetic: suspense intro, build, drum-driven montage, breakdown, drop, outro. A minor. No piano.' },
  'calm-46': { bars: 46, bpm: 100, note: 'Same shape and melody but no hard drums: soft heartbeat pulse, gentle bass and cello, glass lead. For calm, reflective or sleepy films. Try bpm 90 to 105.' },
};
const MOODS = {
  atom: ['wonder', 'calm', 'mysterious', 'science'], math: ['serious', 'techy', 'science'], cartoon: ['playful', 'friendly'], chart: ['serious', 'data', 'energetic'],
  explainer: ['techy', 'serious'], iso: ['friendly', 'techy', 'energetic'], paper: ['warm', 'calm', 'human', 'night'], synth: ['energetic', 'nostalgic', 'night'],
  domino: ['energetic', 'suspense'], stage: ['human'], type: ['serious', 'energetic', 'bold'], board: ['friendly', 'simple', 'calm'], shadow: ['mysterious', 'calm', 'timeless', 'night'],
  pixel: ['nostalgic', 'playful', 'retro'], glitch: ['tense', 'techy', 'energetic'], ink: ['calm', 'timeless', 'nature', 'night'], comic: ['playful', 'energetic', 'bold'],
  gen: ['calm', 'abstract', 'mysterious', 'night'], vapor: ['nostalgic', 'dreamy', 'retro', 'night'], memphis: ['playful', 'bold', 'energetic'], poster: ['bold', 'serious'],
  ascii: ['techy', 'retro'], clay: ['friendly', 'playful', 'warm', 'calm'], origami: ['calm', 'warm', 'craft'], lowpoly: ['calm', 'nature', 'techy'], voxel: ['playful', 'games'],
  map: ['serious', 'travel'], multiplane: ['calm', 'nostalgic', 'nature', 'night'], stopmo: ['warm', 'handmade'], image: ['neutral'],
};
Object.keys(MOODS).forEach(k => { if (STYLES[k]) STYLES[k].moods = MOODS[k]; });
const ICON_NAMES = ['bulb', 'heart', 'house', 'book', 'rocket', 'chart', 'person', 'tree', 'cloud', 'star', 'gear', 'check'];
const PUPPET_KINDS = ['hero', 'demon', 'clown', 'gunungan', 'bird', 'tree', 'mountain', 'house', 'deer'];
module.exports = { FORMATS, sizeFor, STYLES, SCORES, ICON_NAMES, PUPPET_KINDS };
