'use strict';
// Minimal valid params for every style/variant. Used by the QA script and as copy-paste examples.
const SAMPLE_CHARACTERS = { mira: { type: 'human', skin: 'outline', hair: 'bob', face: { eyes: 'round', blush: true }, accessories: ['glasses'], palette: { skin: '#f2c9a0', hair: '#3a2a2a', top: '#e76f51', bottom: '#264653', shoes: '#2b2d42', accent: '#ffd166' } } };
const P = {
  type: () => ({ text: 'Ask bigger questions today', emphasize: [2] }),
  board: v => v === 'equation' ? { title: 'Proof', text: '2 + 2 = 4\nso 4 - 2 = 2' } : { title: 'Steps', items: [{ icon: 'bulb', label: 'idea' }, { icon: 'rocket', label: 'launch' }] },
  stage: () => ({ background: ['paper', 'land1'], cast: [{ char: 'mira', x: 0, action: 'wave', emotion: 'happy', say: true }], props: [{ type: 'bubble', text: 'hi', x: .3, y: -.7 }] }),
  shadow: v => v === 'gunungan' ? null : { tone: 'warm', puppets: [{ kind: 'hero', x: -.3 }, { kind: 'demon', x: .3, flip: true }] },
  glitch: () => ({ background: ['synth', 'sun'], intensity: .7, text: 'SIGNAL' }),
  stopmo: () => ({ background: ['paper', 'land1'], fps: 8 }),
  map: v => v === 'timeline' ? { events: [{ year: '2020', label: 'start' }, { year: '2026', label: 'now' }] } : { from: 'A', to: 'B', distance: '12 km' },
  ink: v => v === 'calligraphy' ? { text: 'still water' } : null,
  pixel: v => v === 'text' ? { text: 'LEVEL UP\nREADY' } : null,
  comic: v => v === 'panels' ? { captions: ['One', 'Two', 'Three'] } : { sfx: 'WOW!' },
  poster: v => v === 'swiss' ? { title: 'Less but better', sub: 'note' } : { title: 'Form follows idea' },
  vapor: v => v === 'grid' ? { text: 'dream' } : { text: 'mind not found' },
  memphis: () => ({ text: 'POP' }),
  ascii: v => v === 'text' ? { text: 'hello\nworld' } : null,
  clay: v => v === 'text' ? { text: 'hello' } : null,
  origami: v => v === 'fold' ? { text: 'fold' } : null,
};
function sampleParams(style, variant) { const f = P[style]; return f ? f(variant) : null; }
module.exports = { sampleParams, SAMPLE_CHARACTERS };
