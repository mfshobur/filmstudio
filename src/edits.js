'use strict';
// Timeline edit operations on a spec, as pure functions: applyOps(spec, ops) -> { spec } or { error, fix }.
// The server re-reads spec.json, applies the ops, validates, and only then writes (see studio.js PATCH /api/spec).
const { validate } = require('./validate');

const snap = (x, step) => Math.round(x / step) * step;
const clone = o => JSON.parse(JSON.stringify(o));
const bad = (error, fix) => ({ error, fix });
const num = x => typeof x === 'number' && isFinite(x);
const idx = (arr, i) => Number.isInteger(i) && Array.isArray(arr) && i >= 0 && i < arr.length;
/* a time in beats from the film start -> [bar, beat offset], bar 1-based */
const barBeat = beats => [Math.floor(beats / 4 + 1e-9) + 1, Math.round((beats - Math.floor(beats / 4 + 1e-9) * 4) * 100) / 100];
const beatsOf = at => (at[0] - 1) * 4 + at[1];

const OPS = {
  // Move the cut between shot i and shot i+1 to a bar (snapped to a beat = 0.25 bar). Shots stay contiguous.
  'shot.boundary'(s, o) {
    if (!idx(s.shots, o.index) || !idx(s.shots, o.index + 1) || !num(o.bar)) return bad('shot.boundary needs index (not the last shot) and bar');
    const bar = snap(o.bar, 0.25), a = s.shots[o.index], b = s.shots[o.index + 1];
    if (!(bar > a[0] && bar < b[1])) return bad('that cut would leave a shot with no length (allowed: ' + (a[0] + 0.25) + ' to ' + (b[1] - 0.25) + ')', 'Drag the cut between its neighbours, or delete the shot.');
    a[1] = bar; b[0] = bar;
  },
  // Cut shot i in two at a bar; the new second half is a copy of the shot (same style and params).
  'shot.split'(s, o) {
    if (!idx(s.shots, o.index) || !num(o.bar)) return bad('shot.split needs index and bar');
    const bar = snap(o.bar, 0.25), a = s.shots[o.index];
    if (!(bar > a[0] && bar < a[1])) return bad('cut point must be inside the shot (' + a[0] + ' to ' + a[1] + ')', 'Put the playhead inside the shot you want to split.');
    const b = clone(a); b[0] = bar; a[1] = bar; s.shots.splice(o.index + 1, 0, b);
  },
  // Remove a shot; the previous shot (or the next, for the first) stretches to cover the gap.
  'shot.delete'(s, o) {
    if (!idx(s.shots, o.index)) return bad('no such shot');
    if (s.shots.length < 2) return bad('a film needs at least one shot');
    const [cut] = s.shots.splice(o.index, 1);
    if (o.index > 0) s.shots[o.index - 1][1] = cut[1]; else s.shots[0][0] = cut[0];
  },
  // Move a narration line. `beats` is the new start in beats from the film start (snapped to a whole beat).
  // It must stay between its neighbours: voice clips and durations.json are matched to lines by position.
  'narration.move'(s, o) {
    if (!idx(s.narration, o.index) || !num(o.beats)) return bad('narration.move needs index and beats');
    const b = Math.max(0, snap(o.beats, 1)), n = s.narration, prev = n[o.index - 1], next = n[o.index + 1];
    if (prev && Array.isArray(prev.at) && b < beatsOf(prev.at)) return bad('that would move line ' + (o.index + 1) + ' before the line above it', 'Lines keep their order because voice clips are matched by position. Reorder in the Storyboard tab and re-run `filmstudio voice`.');
    if (next && Array.isArray(next.at) && b > beatsOf(next.at)) return bad('that would move line ' + (o.index + 1) + ' after the line below it', 'Lines keep their order because voice clips are matched by position. Reorder in the Storyboard tab and re-run `filmstudio voice`.');
    n[o.index].at = barBeat(b);
  },
  // Move an on-screen prompt (snapped to half a beat).
  'prompt.move'(s, o) {
    if (!idx(s.prompts, o.index) || !num(o.beats)) return bad('prompt.move needs index and beats');
    const [bar, beat] = barBeat(Math.max(0, snap(o.beats, 0.5))); s.prompts[o.index].bar = bar; if (beat) s.prompts[o.index].beat = beat; else delete s.prompts[o.index].beat;
  },
  'prompt.delete'(s, o) {
    if (!idx(s.prompts, o.index)) return bad('no such prompt');
    s.prompts.splice(o.index, 1);
  },
};

const key = e => e.path + '|' + e.message;
/* Apply ops to a copy of spec. Refuses an edit that introduces a validation error the spec did not already have,
   so dragging can never make a valid film invalid (existing errors are not blamed on the drag). */
function applyOps(spec, ops, dir) {
  if (!Array.isArray(ops) || !ops.length || ops.length > 50) return bad('ops must be a list of 1 to 50 edits');
  const next = clone(spec);
  for (const o of ops) {
    const f = o && OPS[o.op]; if (!f) return bad('unknown edit "' + (o && o.op) + '"', 'Known: ' + Object.keys(OPS).join(', '));
    const r = f(next, o); if (r && r.error) return r;
  }
  const before = new Set(validate(spec, dir).errors.map(key)), added = validate(next, dir).errors.filter(e => !before.has(key(e)));
  if (added.length) return bad(added[0].message, added[0].fix || undefined);
  return { spec: next };
}
module.exports = { applyOps, OPS, barBeat };
