'use strict';
// Derives the timeline (tracks with bar and second positions) from spec.json. Read-only; edits live in edits.js.
// Music sections come from engine/music.js itself (filmScoreSeq and sec are read from its source), so they cannot drift.
const fs = require('fs');
const path = require('path');
const MUSIC_SRC = fs.readFileSync(path.join(__dirname, '..', 'engine', 'music.js'), 'utf8');
const seqSrc = MUSIC_SRC.slice(MUSIC_SRC.indexOf('function filmScoreSeq'), MUSIC_SRC.indexOf('function createMusic'));
const secSrc = (/function sec\(bar\)\{[^}]*\}/.exec(MUSIC_SRC) || [])[0];
if (!seqSrc || !secSrc) throw new Error('engine/music.js changed shape: cannot read filmScoreSeq / sec');
const filmScoreSeq = new Function(seqSrc + '; return filmScoreSeq;')();
const sec = new Function(secSrc + '; return sec;')();

/* [{name,startBar,endBar}] covering bars 1..bars+1 (endBar exclusive). Empty if the length has no arrangement. */
function musicSections(bars) {
  if (!Number.isInteger(bars)) return [];
  const seq = filmScoreSeq(bars); if (seq.length !== bars) return [];
  const out = [];
  seq.forEach((scoreBar, i) => { const name = sec(scoreBar), last = out[out.length - 1]; if (last && last.name === name) last.endBar = i + 2; else out.push({ name, startBar: i + 1, endBar: i + 2 }); });
  return out;
}

const pos = (bar, beat) => bar + (beat || 0) / 4; // decimal bar position of [bar, beat offset in beats]

function buildTimeline(spec, dir) {
  /* refuse malformed entries rather than drawing them at a made-up position (validate explains the fix) */
  (spec.shots || []).forEach((s, i) => { if (!Array.isArray(s) || typeof s[0] !== 'number' || typeof s[1] !== 'number') throw new Error('shots[' + i + '] is not [startBar,endBar,style,variant]'); });
  (spec.narration || []).forEach((n, i) => { if (!n || !Array.isArray(n.at) || typeof n.at[0] !== 'number') throw new Error('narration[' + i + '].at must be [bar,beat]'); });
  (spec.prompts || []).forEach((p, i) => { if (!p || typeof p.bar !== 'number') throw new Error('prompts[' + i + '].bar must be a number'); });
  const bpm = spec.bpm, bars = spec.bars, spBar = 240 / bpm;
  let durations = null; try { durations = JSON.parse(fs.readFileSync(path.join(dir, 'voice', 'durations.json'), 'utf8')); } catch (e) { /* optional */ }
  const shots = (spec.shots || []).map((s, i) => ({ i, start: s[0], end: s[1], style: s[2], variant: s[3], beats: (s[1] - s[0]) * 4, hasParams: s.length > 4 }));
  const narration = (spec.narration || []).map((n, i) => {
    const at = n.at, measured = durations && durations[i], given = n.dur;
    const sec_ = measured || given || Math.max(1, String(n.text || '').split(/\s+/).filter(Boolean).length / 2.5);
    const start = pos(at[0], at[1]);
    return { i, text: n.text || '', startBar: start, endBar: start + sec_ / spBar, seconds: Math.round(sec_ * 100) / 100, durSource: measured ? 'measured' : given ? 'spec' : 'estimate', hasAudio: !!n.file };
  });
  const prompts = (spec.prompts || []).map((p, i) => ({ i, bar: pos(p.bar, p.beat), text: p.text || '', big: !!p.big, hide: !!p.hide }));
  return { bpm, bars, secPerBar: spBar, seconds: Math.round(bars * spBar * 10) / 10, endCardBar: spec.endCardBar == null ? null : spec.endCardBar, tracks: { shots, narration, prompts, music: musicSections(bars) } };
}
module.exports = { buildTimeline, musicSections, pos };
