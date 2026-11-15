#!/usr/bin/env node
'use strict';
// Timeline data, edit operations, conflict-safe saving and live events (no browser).
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), assert = require('assert');
const { buildTimeline, musicSections } = require('../src/timeline');
const { applyOps, barBeat } = require('../src/edits');
const { validate } = require('../src/validate');
const { createStudio } = require('../src/studio');
const ROOT = path.join(__dirname, '..'), EX = path.join(ROOT, 'examples', 'the-only-limit');
const mk = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-tl-')); fs.cpSync(EX, d, { recursive: true, filter: s => !s.includes(path.sep + 'build') }); return d; };
const base = () => JSON.parse(fs.readFileSync(path.join(EX, 'spec.json'), 'utf8'));
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.stack || e).split('\n').slice(0, 3).join('\n     ')); } };
const H = { 'X-Filmstudio': '1', 'Content-Type': 'application/json' };
const beatsOf = at => (at[0] - 1) * 4 + at[1];

(async () => {
  /* ---------- timeline data ---------- */
  await t('music sections: the 46-bar score has the six named sections, contiguous from bar 1 to the end', () => {
    const m = musicSections(46); assert.deepStrictEqual(m.map(x => x.name), ['intro', 'build', 'montage', 'break', 'climax', 'outro']);
    assert.strictEqual(m[0].startBar, 1); assert.strictEqual(m[m.length - 1].endBar, 47); m.forEach((x, i) => { assert.ok(x.endBar > x.startBar); if (i) assert.strictEqual(x.startBar, m[i - 1].endBar); });
  });
  await t('music sections: every supported length (24..78, even) is contiguous and covers the whole film', () => {
    for (let b = 24; b <= 78; b += 2) { const m = musicSections(b); assert.ok(m.length >= 3, 'bars ' + b); assert.strictEqual(m[0].startBar, 1, 'bars ' + b); assert.strictEqual(m[m.length - 1].endBar, b + 1, 'bars ' + b); m.forEach((x, i) => { if (i) assert.strictEqual(x.startBar, m[i - 1].endBar, 'gap at bars ' + b); }); }
  });
  await t('music sections: a length with no arrangement gives no sections instead of wrong ones', () => { assert.deepStrictEqual(musicSections(null), []); assert.deepStrictEqual(musicSections(46.5), []); });
  await t('buildTimeline: shots, narration, prompts and music for the example film (no durations yet, so lines are estimated)', () => {
    const s = base(), tl = buildTimeline(s, EX); assert.strictEqual(tl.bars, 46); assert.strictEqual(tl.seconds, 86.3);
    assert.strictEqual(tl.tracks.shots.length, s.shots.length); assert.strictEqual(tl.tracks.shots[0].start, 1); assert.strictEqual(tl.tracks.shots[tl.tracks.shots.length - 1].end, 47);
    assert.strictEqual(tl.tracks.narration.length, s.narration.length); const n0 = tl.tracks.narration[0]; assert.strictEqual(n0.startBar, 1.25); assert.strictEqual(n0.durSource, 'estimate'); assert.ok(n0.endBar > n0.startBar && n0.seconds >= 1);
    assert.strictEqual(tl.tracks.prompts[0].bar, 1.25); assert.ok(tl.tracks.music.length >= 5);
  });
  await t('buildTimeline: duration comes from voice/durations.json first, then the line\'s dur, then an estimate', () => {
    const d = mk(), s = base(); fs.writeFileSync(path.join(d, 'voice', 'durations.json'), JSON.stringify(s.narration.map((n, i) => i === 0 ? 3.5 : null))); s.narration[1].dur = 2.25;
    const tl = buildTimeline(s, d), n = tl.tracks.narration; assert.deepStrictEqual([n[0].durSource, n[0].seconds], ['measured', 3.5]); assert.deepStrictEqual([n[1].durSource, n[1].seconds], ['spec', 2.25]); assert.strictEqual(n[2].durSource, 'estimate');
    assert.ok(Math.abs((n[0].endBar - n[0].startBar) - 3.5 / (240 / 128)) < 1e-9, 'width in bars = seconds / seconds per bar');
  });
  await t('buildTimeline refuses malformed shots, narration and prompts instead of drawing them at a made-up place', () => {
    for (const [mut, re] of [[s => { s.shots[2] = 5; }, /shots\[2\]/], [s => { s.shots[2] = ['a', 'b']; }, /shots\[2\]/], [s => { delete s.narration[1].at; }, /narration\[1\]/], [s => { s.prompts[0].bar = 'x'; }, /prompts\[0\]/]]) { const s = base(); mut(s); assert.throws(() => buildTimeline(s, EX), re); }
  });

  /* ---------- edit operations ---------- */
  await t('barBeat converts beats from the start into [bar, beat offset]', () => { assert.deepStrictEqual(barBeat(0), [1, 0]); assert.deepStrictEqual(barBeat(5), [2, 1]); assert.deepStrictEqual(barBeat(7.5), [2, 3.5]); assert.deepStrictEqual(barBeat(4), [2, 0]); });
  await t('shot.boundary moves a cut, snaps to a beat, keeps shots contiguous and valid, and does not touch the input', () => {
    const s = base(), i = 10, a = s.shots[i], b = s.shots[i + 1], before = JSON.stringify(s), target = a[0] + (a[1] - a[0]) / 2 + 0.07;
    const r = applyOps(s, [{ op: 'shot.boundary', index: i, bar: target }], EX); assert.ok(!r.error, r.error);
    const na = r.spec.shots[i], nb = r.spec.shots[i + 1]; assert.strictEqual(na[1], nb[0]); assert.strictEqual((na[1] * 4) % 1, 0, 'snapped to a beat'); assert.ok(Math.abs(na[1] - target) <= 0.125 + 1e-9); assert.strictEqual(nb[1], b[1]); assert.ok(validate(r.spec, EX).ok); assert.strictEqual(JSON.stringify(s), before);
  });
  await t('shot.boundary refuses a cut that leaves a shot with no length', () => { const s = base(), r = applyOps(s, [{ op: 'shot.boundary', index: 10, bar: s.shots[11][1] }], EX); assert.ok(/no length/.test(r.error), r.error); assert.ok(r.fix); assert.ok(applyOps(s, [{ op: 'shot.boundary', index: s.shots.length - 1, bar: 3 }], EX).error, 'last shot has no right neighbour'); });
  await t('shot.split cuts a shot in two copies; shot.delete gives its time to the previous shot (or the next, for the first)', () => {
    const s = base(), i = 12, a = s.shots[i], mid = a[0] + (a[1] - a[0]) / 2; const sp = applyOps(s, [{ op: 'shot.split', index: i, bar: mid }], EX); assert.ok(!sp.error, sp.error);
    assert.strictEqual(sp.spec.shots.length, s.shots.length + 1); assert.strictEqual(sp.spec.shots[i][1], sp.spec.shots[i + 1][0]); assert.strictEqual(sp.spec.shots[i + 1][2], a[2]); assert.ok(validate(sp.spec, EX).ok);
    assert.ok(applyOps(s, [{ op: 'shot.split', index: i, bar: a[0] }], EX).error, 'split must be inside the shot');
    const d = applyOps(s, [{ op: 'shot.delete', index: i }], EX); assert.ok(!d.error, d.error); assert.strictEqual(d.spec.shots[i - 1][1], a[1]); assert.ok(validate(d.spec, EX).ok);
    const d0 = applyOps(s, [{ op: 'shot.delete', index: 0 }], EX); assert.ok(!d0.error, d0.error); assert.strictEqual(d0.spec.shots[0][0], 1);
    assert.ok(applyOps({ shots: [[1, 2, 'atom', 'spark']] }, [{ op: 'shot.delete', index: 0 }]).error, 'cannot delete the only shot');
  });
  await t('narration.move snaps to a beat and stays between its neighbours (voice clips are matched by position)', () => {
    const s = base(), n = s.narration, i = 2, lo = beatsOf(n[i - 1].at), hi = beatsOf(n[i + 1].at), mid = Math.round((lo + hi) / 2);
    const ok = applyOps(s, [{ op: 'narration.move', index: i, beats: mid + 0.3 }], EX); assert.ok(!ok.error, ok.error); assert.strictEqual(beatsOf(ok.spec.narration[i].at), mid); assert.strictEqual(ok.spec.narration[i].file, n[i].file);
    assert.ok(/before the line above/.test(applyOps(s, [{ op: 'narration.move', index: i, beats: lo - 3 }], EX).error)); assert.ok(/after the line below/.test(applyOps(s, [{ op: 'narration.move', index: i, beats: hi + 3 }], EX).error));
  });
  await t('an edit that would introduce a validation error is refused (a clip may not run into the next line)', () => {
    const s = base(), n = s.narration; n[0].dur = 2.5; assert.ok(validate(s, EX).ok, 'a 2.5 s clip fits before the next line'); // 2.5 s = 5.3 beats, the next line is 8 beats later
    const r = applyOps(s, [{ op: 'narration.move', index: 0, beats: beatsOf(n[1].at) }], EX); assert.ok(/clip runs/.test(r.error), r.error); assert.ok(r.fix);
    assert.ok(!applyOps(s, [{ op: 'narration.move', index: 0, beats: 2 }], EX).error, 'a small move that still fits is fine');
  });
  await t('errors the spec already had are not blamed on an unrelated edit', () => { const s = base(); s.shots[3][2] = 'nope'; const r = applyOps(s, [{ op: 'prompt.move', index: 0, beats: 6 }], EX); assert.ok(!r.error, r.error); });
  await t('prompt.move and prompt.delete; unknown or malformed ops are refused', () => {
    const s = base(); const m = applyOps(s, [{ op: 'prompt.move', index: 0, beats: 9.3 }], EX); assert.ok(!m.error, m.error); assert.deepStrictEqual([m.spec.prompts[0].bar, m.spec.prompts[0].beat], [3, 1.5]);
    const m0 = applyOps(s, [{ op: 'prompt.move', index: 0, beats: 8 }], EX); assert.strictEqual(m0.spec.prompts[0].bar, 3); assert.ok(!('beat' in m0.spec.prompts[0]));
    assert.strictEqual(applyOps(s, [{ op: 'prompt.delete', index: 0 }], EX).spec.prompts.length, s.prompts.length - 1);
    for (const bad of [[], 'x', [{ op: 'rm -rf' }], [{ op: 'shot.split', index: -1, bar: 3 }], [{ op: 'shot.split', index: 1.5, bar: 3 }], [{ op: 'prompt.move', index: 0, beats: 'soon' }], new Array(51).fill({ op: 'prompt.delete', index: 0 })]) assert.ok(applyOps(s, bad, EX).error, JSON.stringify(bad).slice(0, 40));
  });

  /* ---------- server: rev, conflicts, PATCH, timeline, events ---------- */
  const dir = mk(), st = createStudio({ dir }), port = await st.listen(0), B = 'http://127.0.0.1:' + port;
  const get = u => fetch(B + u), send = (m, u, body, h) => fetch(B + u, { method: m, headers: Object.assign({}, H, h || {}), body: JSON.stringify(body) });
  const specFile = path.join(dir, 'spec.json'), spec = () => JSON.parse(fs.readFileSync(specFile, 'utf8')), agentEdit = f => { const s = spec(); f(s); fs.writeFileSync(specFile, JSON.stringify(s, null, 1)); };
  await t('project and save responses carry a rev that changes only when the file changes', async () => {
    const a = await (await get('/api/project')).json(), a2 = await (await get('/api/project')).json(); assert.ok(/^[0-9a-f]{16}$/.test(a.rev)); assert.strictEqual(a.rev, a2.rev);
    const s = a.spec; s.meta.title = 'Rev test'; const r = await (await send('PUT', '/api/spec', s, { 'If-Match': a.rev })).json(); assert.strictEqual(r.saved, true); assert.notStrictEqual(r.rev, a.rev); assert.strictEqual((await (await get('/api/project')).json()).rev, r.rev);
  });
  await t('PUT with a stale If-Match is refused with 409 and does not overwrite the agent\'s edit; without the header it still saves', async () => {
    const cur = await (await get('/api/project')).json(); agentEdit(s => { s.meta.title = 'Agent was here'; });
    const mine = cur.spec; mine.bpm = 128; mine.meta.title = 'My stale copy'; const r = await send('PUT', '/api/spec', mine, { 'If-Match': cur.rev }); assert.strictEqual(r.status, 409);
    const j = await r.json(); assert.strictEqual(j.spec.meta.title, 'Agent was here'); assert.strictEqual(spec().meta.title, 'Agent was here'); assert.notStrictEqual(j.rev, cur.rev);
    assert.strictEqual((await send('PUT', '/api/spec', Object.assign(mine, { meta: Object.assign({}, mine.meta, { title: 'Forced' }) }))).status, 200);
  });
  await t('PATCH needs the rev, refuses a stale one, applies valid ops, keeps what the agent changed, and rejects invalid ops with a fix hint', async () => {
    assert.strictEqual((await send('PATCH', '/api/spec', { ops: [{ op: 'prompt.delete', index: 0 }] })).status, 400);
    const cur = await (await get('/api/project')).json(); agentEdit(s => { s.meta.title = 'Agent title'; });
    assert.strictEqual((await send('PATCH', '/api/spec', { rev: cur.rev, ops: [{ op: 'prompt.delete', index: 0 }] })).status, 409, 'stale rev');
    const fresh = await (await get('/api/project')).json(), a = fresh.spec.shots[10]; const mid = a[0] + (a[1] - a[0]) / 2;
    const ok = await send('PATCH', '/api/spec', { rev: fresh.rev, ops: [{ op: 'shot.boundary', index: 10, bar: mid }] }); assert.strictEqual(ok.status, 200); const oj = await ok.json(); assert.strictEqual(oj.validation.ok, true);
    assert.strictEqual(spec().meta.title, 'Agent title', 'the agent\'s edit survives'); assert.strictEqual(spec().shots[10][1], oj.spec.shots[10][1]); assert.ok(fs.existsSync(path.join(dir, 'spec.json.bak')));
    const bad = await send('PATCH', '/api/spec', { rev: oj.rev, ops: [{ op: 'shot.boundary', index: 10, bar: 999 }] }); assert.strictEqual(bad.status, 422); const bj = await bad.json(); assert.ok(bj.error && bj.fix); assert.strictEqual(spec().shots[10][1], oj.spec.shots[10][1], 'file unchanged after a refused edit');
  });
  await t('GET /api/timeline returns the tracks; an unusable spec is 422', async () => {
    const tl = await (await get('/api/timeline')).json(); assert.ok(tl.rev && tl.tracks.shots.length > 10 && tl.tracks.music.length >= 5 && tl.secPerBar > 1);
    const keep = fs.readFileSync(specFile, 'utf8');
    try { for (const bad of ['{"version":1}', '{"bpm":128,"bars":46,"shots":[5]}', '{"bpm":128,"bars":46,"shots":[[1,47,"atom","spark"]],"narration":[{"text":"x"}]}']) { fs.writeFileSync(specFile, bad); const r = await get('/api/timeline'); assert.strictEqual(r.status, 422, bad); assert.ok((await r.json()).error); } }
    finally { fs.writeFileSync(specFile, keep); }
  });
  await t('GET /api/events streams a spec event after the file changes on disk, and nothing for a change that does not touch the spec', async () => {
    const got = await new Promise((resolve, reject) => {
      const req = http.get(B + '/api/events', res => { assert.ok(/text\/event-stream/.test(res.headers['content-type'])); let buf = ''; const evs = []; res.setEncoding('utf8');
        res.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n\n')) >= 0) { const blk = buf.slice(0, i); buf = buf.slice(i + 2); const m = /^data: (.*)$/m.exec(blk); if (m) { const ev = JSON.parse(m[1]); evs.push(ev); if (ev.type === 'hello') setTimeout(() => agentEdit(s => { s.meta.title = 'Changed on disk'; }), 150); if (ev.type === 'spec') { req.destroy(); resolve(evs); } } } });
      }); req.on('error', e => { if (e.code !== 'ECONNRESET') reject(e); }); setTimeout(() => { req.destroy(); reject(new Error('no spec event within 6 s')); }, 6000);
    });
    assert.strictEqual(got[0].type, 'hello'); const sp = got.find(e => e.type === 'spec'); assert.ok(sp && /^[0-9a-f]{16}$/.test(sp.rev)); assert.strictEqual(sp.rev, (await (await get('/api/project')).json()).rev);
  });
  await t('closing the studio ends open event streams instead of hanging', async () => {
    const dir2 = mk(), s2 = createStudio({ dir: dir2 }), p2 = await s2.listen(0); await new Promise(res => { const r = http.get('http://127.0.0.1:' + p2 + '/api/events', x => { x.on('data', () => {}); x.on('error', () => {}); res(); }); r.on('error', () => {}); });
    await Promise.race([s2.close(), new Promise((_, rej) => setTimeout(() => rej(new Error('close hung')), 3000))]);
  });
  await st.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
