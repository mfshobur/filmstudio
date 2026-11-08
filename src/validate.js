'use strict';
const fs = require('fs');
const path = require('path');
const { STYLES, SCORES } = require('./registry');

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
  else if (SCORES[preset].bars !== bars) err('bars', 'score preset "' + preset + '" is ' + SCORES[preset].bars + ' bars long, spec has ' + bars, 'Set bars to ' + SCORES[preset].bars + ' (parametric scores arrive in a later phase).');
  if (!spec.meta || !spec.meta.title) err('meta.title', 'meta.title is required', 'Add a short title.');
  if (spec.meta && spec.meta.titleLines && !Array.isArray(spec.meta.titleLines)) err('meta.titleLines', 'must be an array of strings', 'e.g. ["The only limit","is the","human mind."]');
  // shots
  const sh = spec.shots;
  if (!Array.isArray(sh) || !sh.length) err('shots', 'shots must be a non-empty array of [startBar,endBar,style,variant]', 'See `filmstudio guide storyboard`.');
  else {
    let prev = 1;
    sh.forEach((s, i) => {
      const p = 'shots[' + i + ']';
      if (!Array.isArray(s) || s.length !== 4) return err(p, 'each shot must be [startBar,endBar,style,variant]', 'Example: [13,13.5,"synth","sun"]');
      const [a, b, st, v] = s;
      if (typeof a !== 'number' || typeof b !== 'number') return err(p, 'start and end must be numbers (bars)', 'Bars are 1-based; 0.25 = one beat.');
      if (Math.abs(a - prev) > 1e-9) err(p, 'starts at bar ' + a + ' but the previous shot ended at ' + prev, 'Shots must be contiguous: set start to ' + prev + '.');
      if (!(b > a)) err(p, 'end must be greater than start', '');
      if (((b - a) * 4) % 1 !== 0) err(p, 'shot length must be a whole number of beats (multiples of 0.25 bar)', 'Round to the nearest 0.25.');
      if (!STYLES[st]) err(p, 'unknown style "' + st + '"', 'Known styles: ' + Object.keys(STYLES).join(', '));
      else if (!STYLES[st].variants.includes(v)) err(p, 'unknown variant "' + v + '" for style "' + st + '"', 'Variants of ' + st + ': ' + STYLES[st].variants.join(', '));
      prev = b;
    });
    if (Number.isInteger(bars) && Math.abs(prev - (bars + 1)) > 1e-9) err('shots', 'last shot ends at bar ' + prev + ' but the film is ' + bars + ' bars (should end at ' + (bars + 1) + ')', 'Extend or trim the last shot.');
    const longest = Math.max(...sh.filter(Array.isArray).map(s => (s[1] - s[0]) * 4));
    if (longest > 24) warn('shots', 'a shot lasts ' + longest + ' beats; long shots lose attention', 'Cut away at least every 8 beats.');
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
  return { ok: errors.length === 0, errors, warnings };
}
module.exports = { validate };
