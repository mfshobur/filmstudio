#!/usr/bin/env node
'use strict';
// Fast regression tests (no browser). node test/run.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const { compile } = require('../src/build');
const { validate } = require('../src/validate');
const { STYLES } = require('../src/registry');
const { sampleParams, SAMPLE_CHARACTERS } = require('../src/samples');
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('ok   ' + name); } catch (e) { fail++; console.log('FAIL ' + name + '\n     ' + e.message); } };
const examples = fs.readdirSync(path.join(ROOT, 'examples'));
examples.forEach(ex => {
  const dir = path.join(ROOT, 'examples', ex), spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
  t('example validates: ' + ex, () => { const r = validate(spec, dir); assert.ok(r.ok, JSON.stringify(r.errors)); });
  t('example builds and its script parses: ' + ex, () => {
    const html = compile(spec, dir), js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
    new Function(js); assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), 'unfilled placeholder');
  });
});
const base = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'the-only-limit', 'spec.json'), 'utf8'));
const dir0 = path.join(ROOT, 'examples', 'the-only-limit');
const os = require('os'), { testPicture } = require('../src/png');
const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-test-')); fs.mkdirSync(path.join(tmpProj, 'assets')); fs.writeFileSync(path.join(tmpProj, 'assets', 'qa.png'), testPicture(64, 40)); fs.writeFileSync(path.join(tmpProj, 'assets', 'big.png'), Buffer.alloc(9e6, 1)); fs.writeFileSync(path.join(tmpProj, 'assets', 'x.bmp'), Buffer.alloc(10));
const bad = (name, mut, re) => t('rejects: ' + name, () => { const s = base(); mut(s); const r = validate(s, dir0); assert.ok(!r.ok, 'should be invalid'); assert.ok(r.errors.some(e => re.test(e.message)), 'wrong error: ' + JSON.stringify(r.errors.map(e => e.message))); assert.ok(r.errors.every(e => e.fix !== undefined), 'error without fix hint'); });
bad('unknown style', s => { s.shots[3][2] = 'nope'; }, /unknown style/);
bad('unknown variant', s => { s.shots[3][3] = 'zzz'; }, /unknown variant/);
bad('gap between shots', s => { s.shots[5][0] += 0.25; }, /previous shot ended/);
bad('last shot short', s => { s.shots[s.shots.length - 1][1] = 40; }, /last shot ends/);
bad('fractional beat', s => { s.shots[1][1] = s.shots[1][1] + 0.1; s.shots[2][0] = s.shots[1][1]; }, /whole number of beats/);
bad('bars mismatch with score', s => { s.bars = 30; }, /preset/);
bad('bpm out of range', s => { s.bpm = 500; }, /bpm/);
bad('narration out of order', s => { s.narration[3].at = [1, 0]; }, /time order/);
bad('narration overlap', s => { s.narration[0].dur = 30; }, /into the next line/);
bad('type without params', s => { s.shots[0] = [1, 3, 'type', 'words']; }, /5th element/);
bad('board unknown icon', s => { s.shots[0] = [1, 3, 'board', 'icons', { items: [{ icon: 'banana' }] }]; }, /unknown icon/);
bad('stage unknown character', s => { s.shots[0] = [1, 3, 'stage', 'scene', { cast: [{ char: 'ghost' }] }]; }, /unknown character/);
bad('stage unknown action', s => { s.characters = SAMPLE_CHARACTERS; s.shots[0] = [1, 3, 'stage', 'scene', { cast: [{ char: 'mira', action: 'fly' }] }]; }, /unknown action/);
bad('bad character skin', s => { s.characters = { x: { type: 'human', skin: 'neon-pink' } }; }, /unknown skin/);
bad('shadow unknown puppet', s => { s.shots[0] = [1, 3, 'shadow', 'scene', { puppets: [{ kind: 'dragon' }] }]; }, /unknown puppet/);
bad('stopmo without background', s => { s.shots[0] = [1, 3, 'stopmo', 'boil', {}]; }, /background/);
bad('timeline without events', s => { s.shots[0] = [1, 3, 'map', 'timeline', {}]; }, /events/);
bad('calligraphy without text', s => { s.shots[0] = [1, 3, 'ink', 'calligraphy']; }, /text/);
t('every style/variant has a sample that validates', () => {
  Object.entries(STYLES).forEach(([st, def]) => def.variants.forEach(v => {
    const s = base(); s.characters = SAMPLE_CHARACTERS; const p = sampleParams(st, v); s.shots = [[1, 47, st, v].concat(p ? [p] : [])]; s.narration = []; s.prompts = [];
    const r = validate(s, tmpProj); const errs = r.errors.filter(e => !/last shot|longest/.test(e.message)); assert.deepStrictEqual(errs, [], st + '/' + v + ' ' + JSON.stringify(errs));
  }));
});
const imgShot = p => { const s = base(); s.shots = [[1, 47, 'image', 'pop', p]]; s.narration = []; s.prompts = []; return s; };
t('image: missing params rejected', () => { const r = validate(imgShot(undefined), tmpProj); assert.ok(r.errors.some(e => /params\.src/.test(e.message))); });
t('image: missing file rejected', () => { const r = validate(imgShot({ src: 'assets/nope.png' }), tmpProj); assert.ok(r.errors.some(e => /file not found/.test(e.message))); });
t('image: bad extension rejected', () => { const r = validate(imgShot({ src: 'assets/x.bmp' }), tmpProj); assert.ok(r.errors.some(e => /unsupported image type/.test(e.message))); });
t('image: oversize rejected', () => { const r = validate(imgShot({ src: 'assets/big.png' }), tmpProj); assert.ok(r.errors.some(e => /limit 8 MB/.test(e.message))); });
t('image: build embeds the file as a data URI', () => { const s = imgShot({ src: 'assets/qa.png' }); const html = compile(s, tmpProj); assert.ok(html.includes('data:image/png;base64,')); });
t('every registered style has an engine handler', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'engine', 'p3.template.js'), 'utf8'), body = tpl.slice(tpl.indexOf('var DRAW={'), tpl.indexOf('};', tpl.indexOf('var DRAW={')));
  Object.keys(STYLES).forEach(st => assert.ok(new RegExp('\\b' + st + ':').test(body), 'no DRAW handler for ' + st));
});
t('guide topics exist and have content', () => { const d = path.join(ROOT, 'docs', 'agent-guide'); const f = fs.readdirSync(d).filter(x => x.endsWith('.md')); assert.ok(f.length >= 14); f.forEach(x => assert.ok(fs.readFileSync(path.join(d, x), 'utf8').length > 300, x + ' too short')); });
t('every style is mentioned in the guide', () => { const all = fs.readdirSync(path.join(ROOT, 'docs', 'agent-guide')).map(x => fs.readFileSync(path.join(ROOT, 'docs', 'agent-guide', x), 'utf8')).join('\n'); Object.keys(STYLES).forEach(st => assert.ok(all.includes('`' + st + '`') || all.includes(st + '/'), 'style not in guide: ' + st)); });
t('README mentions every style', () => { const r = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'); Object.keys(STYLES).forEach(st => assert.ok(r.includes('`' + st + '`'), 'README missing ' + st)); });
t('no secrets in the repo', () => { const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === 'node_modules' || e.name === '.git' || e.name === 'build' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); walk(ROOT).filter(f => !/\.(mp3|png|jpg)$/.test(f) && !f.endsWith('test/run.js')).forEach(f => { const s = fs.readFileSync(f, 'utf8'); assert.ok(!/authtoken\s*[:=]|sk-[A-Za-z0-9]{20,}|xi-api-key|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}/.test(s), 'possible secret in ' + f); }); });
t('validate reports film length from bpm', () => { const s = base(); let r = validate(s, dir0); assert.ok(Math.abs(r.info.seconds - 86.3) < .1); s.bpm = 184; r = validate(s, dir0); assert.ok(Math.abs(r.info.seconds - 60) < .1, r.info.seconds); });
t('bars error tells the agent to change bpm', () => { const s = base(); s.bars = 30; const r = validate(s, dir0); assert.ok(r.errors.some(e => /change bpm/.test(e.fix))); });
t('calm preset validates and builds with calm flag', () => { const s = base(); s.score = { preset: 'calm-46', transpose: 3 }; s.bpm = 100; const r = validate(s, dir0); assert.ok(r.ok, JSON.stringify(r.errors)); const html = compile(s, dir0); assert.ok(html.includes('{"calm":true,"transpose":3}')); });
t('default score is not calm', () => { const html = compile(base(), dir0); assert.ok(html.includes('{"calm":false,"transpose":0}')); });
t('transpose out of range rejected', () => { const s = base(); s.score = { preset: 'anthem-46', transpose: 9 }; const r = validate(s, dir0); assert.ok(r.errors.some(e => /transpose/.test(e.message))); });
t('warns on the same style/variant twice in a row', () => { const s = base(); s.shots[1][2] = s.shots[0][2]; s.shots[1][3] = s.shots[0][3]; const r = validate(s, dir0); assert.ok(r.warnings.some(w => /twice in a row/.test(w.message))); });
t('warns when the montage is thin', () => { const s = base(); s.shots = [[1, 13, 'atom', 'spark'], [13, 21, 'paper', 'land1'], [21, 47, 'atom', 'wait']]; const r = validate(s, dir0); assert.ok(r.warnings.some(w => /montage/.test(w.message))); });
t('every style has mood tags', () => { Object.entries(STYLES).forEach(([k, v]) => assert.ok(Array.isArray(v.moods) && v.moods.length, 'no moods: ' + k)); });
t('the starter spec has no narration and is valid', () => { const d = path.join(ROOT, 'examples', 'starter'), sp = JSON.parse(fs.readFileSync(path.join(d, 'spec.json'), 'utf8')); assert.deepStrictEqual(sp.narration, []); assert.ok(validate(sp, d).ok); });
console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
