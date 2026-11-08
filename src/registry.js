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
  domino:    { variants: ['wave', 'title', 'topple', 'cascade'], use: 'reveals and chain reactions. "title" flips tiles to reveal meta.titleLines; "topple" is a slow suspense row.' },
};
const SCORES = { 'anthem-46': { bars: 46, bpm: 128, note: 'Suspense intro, build, montage, breakdown, drop, outro. A minor. No piano.' } };
const ICON_NAMES = ['bulb', 'heart', 'house', 'book', 'rocket', 'chart', 'person', 'tree', 'cloud', 'star', 'gear', 'check'];
const PUPPET_KINDS = ['hero', 'demon', 'clown', 'gunungan', 'bird', 'tree', 'mountain', 'house', 'deer'];
module.exports = { STYLES, SCORES, ICON_NAMES, PUPPET_KINDS };
