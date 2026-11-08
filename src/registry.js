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
  domino:    { variants: ['wave', 'title', 'topple', 'cascade'], use: 'reveals and chain reactions. "title" flips tiles to reveal meta.titleLines; "topple" is a slow suspense row.' },
};
const SCORES = { 'anthem-46': { bars: 46, bpm: 128, note: 'Suspense intro, build, montage, breakdown, drop, outro. A minor. No piano.' } };
module.exports = { STYLES, SCORES };
