'use strict';
const fs = require('fs');
const path = require('path');
const { STYLES, SCORES, ICON_NAMES, PUPPET_KINDS } = require('./registry');

const ACTIONS = ['idle', 'walk', 'wave', 'point', 'think', 'celebrate', 'talk'];
const EMOTIONS = ['happy', 'sad', 'surprised', 'thinking', 'angry', 'neutral'];
const TYPES = ['human', 'robot', 'blob', 'stick', 'animal'];
const SKINS = ['outline', 'flat', 'paper', 'silhouette', 'glow', 'sketch'];
function validate(spec, dir) {
  const errors = [], warnings = [];
  const err = (p, message, fix) => errors.push({ path: p, message, fix });
  const warn = (p, message, fix) => warnings.push({ path: p, message, fix });
  if (!spec || typeof spec !== 'object') { err('', 'spec.json is missing or not an object', 'Run `filmstudio new` or create spec.json (see `filmstudio guide spec`).'); return { ok: false, errors, warnings }; }
  if (spec.version !== 1) err('version', 'version must be 1', 'Set "version": 1.');
  const bpm = spec.bpm, bars = spec.bars;
  if (!(bpm >= 60 && bpm <= 200)) err('bpm', 'bpm must be between 60 and 200', 'Use 128 for the built-in score.');
  if (!(Number.isInteger(bars) && bars >= 8 && bars <= 200)) err('bars', 'bars must be an integer from 8 to 200', 'bars = film length in seconds * bpm / 240.');
  const preset = (spec.score && spec.score.preset) || 'anthem-46';
  if (!SCORES[preset]) err('score.preset', 'unknown score preset "' + preset + '"', 'Available: ' + Object.keys(SCORES).join(', '));
  else if (bars !== SCORES[preset].bars && !require('./registry').barsOk(bars)) err('bars', 'the built-in scores support 46 bars or any even number from 24 to 78, spec has ' + bars, 'Pick bars from 24 to 78 (even) and a bpm to match: seconds = bars x 240 / bpm. `filmstudio length <seconds>` suggests both.');
  if (spec.format != null && !require('./registry').FORMATS[spec.format]) err('format', 'unknown format "' + spec.format + '"', 'Use one of: ' + Object.keys(require('./registry').FORMATS).join(', ') + '. Leave it out for 16:9.');
  if (spec.score && spec.score.transpose != null && !(Number.isInteger(spec.score.transpose) && spec.score.transpose >= -6 && spec.score.transpose <= 6)) err('score.transpose', 'transpose must be a whole number of semitones from -6 to 6', 'Use 0 for the default A minor; +3 gives C minor.');
  if (!spec.meta || !spec.meta.title) err('meta.title', 'meta.title is required', 'Add a short title.');
  if (spec.meta && spec.meta.titleLines && !Array.isArray(spec.meta.titleLines)) err('meta.titleLines', 'must be an array of strings', 'e.g. ["The only limit","is the","human mind."]');
  // characters (optional)
  Object.entries(spec.characters || {}).forEach(([id, c]) => {
    const p = 'characters.' + id;
    if (c.type && !TYPES.includes(c.type)) err(p + '.type', 'unknown type "' + c.type + '"', 'Types: ' + TYPES.join(', '));
    if (c.skin && !SKINS.includes(c.skin)) err(p + '.skin', 'unknown skin "' + c.skin + '"', 'Skins: ' + SKINS.join(', '));
  });
  // shots
  const sh = spec.shots;
  if (!Array.isArray(sh) || !sh.length) err('shots', 'shots must be a non-empty array of [startBar,endBar,style,variant]', 'See `filmstudio guide storyboard`.');
  else {
    let prev = 1;
    sh.forEach((s, i) => {
      const p = 'shots[' + i + ']';
      if (!Array.isArray(s) || (s.length !== 4 && s.length !== 5)) return err(p, 'each shot must be [startBar,endBar,style,variant] (a 5th element holds params for "stage")', 'Example: [13,13.5,"synth","sun"]');
      const [a, b, st, v] = s;
      if (typeof a !== 'number' || typeof b !== 'number') return err(p, 'start and end must be numbers (bars)', 'Bars are 1-based; 0.25 = one beat.');
      if (Math.abs(a - prev) > 1e-9) err(p, 'starts at bar ' + a + ' but the previous shot ended at ' + prev, 'Shots must be contiguous: set start to ' + prev + '.');
      if (!(b > a)) err(p, 'end must be greater than start', '');
      if (((b - a) * 4) % 1 !== 0) err(p, 'shot length must be a whole number of beats (multiples of 0.25 bar)', 'Round to the nearest 0.25.');
      if (!STYLES[st]) err(p, 'unknown style "' + st + '"', 'Known styles: ' + Object.keys(STYLES).join(', '));
      else if (!STYLES[st].variants.includes(v)) err(p, 'unknown variant "' + v + '" for style "' + st + '"', 'Variants of ' + st + ': ' + STYLES[st].variants.join(', '));
      if (st === 'glitch' && s[4] && s[4].background && !(Array.isArray(s[4].background) && STYLES[s[4].background[0]] && s[4].background[0] !== 'glitch' && STYLES[s[4].background[0]].variants.includes(s[4].background[1]))) err(p + '[4].background', 'background must be [style,variant] of a non-glitch style', 'e.g. ["synth","sun"]');
      if (st === 'stopmo') { const bgp = s[4] && s[4].background; if (!(Array.isArray(bgp) && STYLES[bgp[0]] && bgp[0] !== 'stopmo' && STYLES[bgp[0]].variants.includes(bgp[1]))) err(p + '[4].background', 'stopmo needs params.background = [style,variant] of another style', 'e.g. [5,7,"stopmo","boil",{"background":["paper","land1"]}]'); }
      if (st === 'map') { const mp = s[4]; if (v === 'timeline' && !(mp && Array.isArray(mp.events) && mp.events.length)) err(p + '[4].events', 'timeline needs params.events', 'e.g. {"events":[{"year":"2020","label":"start"}]}'); }
      if (st === 'ink' && v === 'calligraphy' && !(s[4] && String(s[4].text || '').trim())) err(p, 'calligraphy needs a 5th element {text}', 'Example: [5,7,"ink","calligraphy",{"text":"still water"}]');
      if (st === 'type' || st === 'board') {
        const pr = s[4];
        if (!pr || typeof pr !== 'object') err(p, st + ' shots need a 5th element with params', st === 'type' ? 'Example: [5,6,"type","words",{"text":"Ask bigger questions"}]' : 'Example: [5,7,"board","icons",{"items":[{"icon":"bulb","label":"idea"}]}]');
        else if (st === 'type' && !String(pr.text || '').trim()) err(p + '[4].text', 'type shots need params.text', 'Give the words to animate.');
        else if (st === 'board') {
          if (v === 'icons') { if (!Array.isArray(pr.items) || !pr.items.length) err(p + '[4].items', 'icons needs params.items', 'Example: [{"icon":"bulb","label":"idea"}]'); else pr.items.forEach((it, k) => { if (!ICON_NAMES.includes(it.icon)) err(p + '[4].items[' + k + '].icon', 'unknown icon "' + it.icon + '"', 'Icons: ' + ICON_NAMES.join(', ')); }); }
          else if (!String(pr.text || '').trim()) err(p + '[4].text', 'equation needs params.text', 'Lines separated by \n.');
        }
      }
      if (st === 'shadow' && s[4] && Array.isArray(s[4].puppets)) s[4].puppets.forEach((pp, k) => { if (!PUPPET_KINDS.includes(pp.kind)) err(p + '[4].puppets[' + k + '].kind', 'unknown puppet kind "' + pp.kind + '"', 'Kinds: ' + PUPPET_KINDS.join(', ')); });
      if (st === 'image') {
        const ip = s[4], ext = ip && ip.src ? path.extname(String(ip.src)).toLowerCase() : '';
        if (!ip || !ip.src) err(p, 'image shots need params.src', 'Put the file in the project (e.g. assets/photo.jpg) and use {"src":"assets/photo.jpg"}.');
        else if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) err(p + '[4].src', 'unsupported image type "' + ext + '"', 'Use png, jpg, webp, gif or svg.');
        else if (!fs.existsSync(path.resolve(dir, ip.src))) err(p + '[4].src', 'file not found: ' + ip.src, 'Copy the image into the project folder, relative to spec.json.');
        else { const sz = fs.statSync(path.resolve(dir, ip.src)).size; if (sz > 8e6) err(p + '[4].src', 'image is ' + (sz / 1e6).toFixed(1) + ' MB (limit 8 MB)', 'Resize or compress it; the film embeds every image.'); else if (sz > 2e6) warn(p + '[4].src', 'image is ' + (sz / 1e6).toFixed(1) + ' MB; the film file will be large', 'Resize to about 1600 px wide.'); }
      }
      if (st === 'stage') {
        const params = s[4], chars = spec.characters || {};
        if (!params || typeof params !== 'object') err(p, 'stage shots need a 5th element with params', 'Example: [5,7,"stage","scene",{"background":["paper","land1"],"cast":[{"char":"mira","x":0,"action":"wave"}]}]');
        else {
          if (params.background && !(Array.isArray(params.background) && STYLES[params.background[0]] && STYLES[params.background[0]].variants.includes(params.background[1]) && params.background[0] !== 'stage')) err(p + '[4].background', 'background must be [style,variant] of a non-stage style', 'e.g. ["paper","land1"]');
          (params.cast || []).forEach((c, k) => { if (!chars[c.char]) err(p + '[4].cast[' + k + '].char', 'unknown character "' + c.char + '"', 'Define it under spec.characters (see `filmstudio guide characters`).'); if (c.action && !ACTIONS.includes(c.action)) err(p + '[4].cast[' + k + '].action', 'unknown action "' + c.action + '"', 'Actions: ' + ACTIONS.join(', ')); if (c.emotion && !EMOTIONS.includes(c.emotion)) err(p + '[4].cast[' + k + '].emotion', 'unknown emotion "' + c.emotion + '"', 'Emotions: ' + EMOTIONS.join(', ')); });
        }
      }
      prev = b;
    });
    if (Number.isInteger(bars) && Math.abs(prev - (bars + 1)) > 1e-9) err('shots', 'last shot ends at bar ' + prev + ' but the film is ' + bars + ' bars (should end at ' + (bars + 1) + ')', 'Extend or trim the last shot.');
    const real = sh.filter(Array.isArray);
    real.forEach((s, i) => { const beats = (s[1] - s[0]) * 4; if (beats > 12 && i < real.length - 1 && !(s[2] === 'domino' && s[3] === 'title')) warn('shots[' + i + ']', 'shot lasts ' + beats + ' beats; long holds lose attention', 'Cut away at least every 8 to 12 beats (the final shot may be longer).'); });
    real.forEach((s, i) => { if (i && real[i - 1][2] === s[2] && real[i - 1][3] === s[3] && s[2] !== 'stage') warn('shots[' + i + ']', 'same style/variant "' + s[2] + '/' + s[3] + '" twice in a row', 'Alternate styles so each cut reads as a change.'); });
    const distinct = new Set(real.map(s => s[2])).size; if (distinct > 12) warn('shots', distinct + ' different styles in one film looks scattered', 'Keep it to about 12 or fewer, chosen to fit the story.');
    if (preset === 'anthem-46' || preset === 'calm-46') { const m0 = bars < 40 ? 9 : 13, mb = bars < 40 ? bars - 22 : 8 + (bars - 46), mont = real.filter(s => s[0] >= m0 && s[0] < m0 + mb).length, need = Math.min(6, Math.ceil(mb * 0.75)); if (mb > 0 && mont < need) warn('shots', 'only ' + mont + ' shots in the montage (bars ' + m0 + ' to ' + (m0 + mb - 1) + '); the score builds to quick cuts there', 'Use ' + Math.ceil(mb * 1.5) + ' to ' + mb * 2 + ' shots of 0.25 to 0.5 bar in bars ' + m0 + '-' + (m0 + mb - 1) + '.'); }
  }
  // narration
  let durations = null;
  try { durations = JSON.parse(fs.readFileSync(path.join(dir, 'voice', 'durations.json'), 'utf8')); } catch (e) { /* optional */ }
  const n = spec.narration || [];
  if (!Array.isArray(n)) err('narration', 'narration must be an array', '');
  else {
    const spb = 60 / (bpm || 128);
    n.forEach((x, i) => {
      const p = 'narration[' + i + ']';
      if (!x.text) err(p + '.text', 'text is required', '');
      if (!Array.isArray(x.at) || x.at.length !== 2) return err(p + '.at', 'at must be [bar,beatOffset]', 'Example: [13,0] = start of bar 13.');
      if (!(x.at[0] >= 1 && x.at[0] <= bars)) err(p + '.at', 'bar ' + x.at[0] + ' is outside 1..' + bars, '');
      if (!(x.at[1] >= 0 && x.at[1] < 4)) err(p + '.at', 'beat offset must be 0 to <4', '');
      if (x.file && !fs.existsSync(path.resolve(dir, x.file))) warn(p + '.file', x.file + ' does not exist yet', 'Run `filmstudio voice`.');
      const d = (durations && durations[i]) || x.dur;
      if (d && n[i + 1] && Array.isArray(n[i + 1].at)) {
        const startBeat = (x.at[0] - 1) * 4 + x.at[1], endBeat = startBeat + d / spb, nextBeat = (n[i + 1].at[0] - 1) * 4 + n[i + 1].at[1];
        if (endBeat > nextBeat + 0.05) err(p, 'clip runs ' + (endBeat - nextBeat).toFixed(1) + ' beats into the next line', 'Move the next line later, shorten the text, or raise voice speed.');
      }
      if (d && (x.at[0] - 1) * 4 + x.at[1] + d / spb > bars * 4) err(p, 'clip ends after the film does', 'Start it earlier or shorten it.');
    });
    for (let i = 1; i < n.length; i++) if (Array.isArray(n[i].at) && Array.isArray(n[i - 1].at) && ((n[i].at[0] - 1) * 4 + n[i].at[1]) < ((n[i - 1].at[0] - 1) * 4 + n[i - 1].at[1])) err('narration[' + i + '].at', 'narration must be in time order', 'Sort by start time.');
  }
  (spec.prompts || []).forEach((p, i) => { if (!(p.bar >= 1 && p.bar <= bars)) err('prompts[' + i + '].bar', 'bar outside 1..' + bars, ''); });
  if (spec.endCardBar != null && !(spec.endCardBar >= bars - 4 && spec.endCardBar <= bars + 1)) warn('endCardBar', 'end card should appear near the end', 'Use about ' + (bars - 1.4) + '.');
  const info = Number.isInteger(bars) && bpm ? { seconds: Math.round(bars * 240 / bpm * 10) / 10, bars, bpm, shots: Array.isArray(sh) ? sh.length : 0, narrationLines: n.length, preset, format: spec.format || '16:9' } : null;
  return { ok: errors.length === 0, info, errors, warnings };
}
module.exports = { validate };
