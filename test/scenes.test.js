#!/usr/bin/env node
'use strict';
// Custom scenes without a browser: the linter, collecting files into the film, validation, scaffolds, the look catalog and the shared library.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');
const { lintSource, collect, checkShot } = require('../src/scenes');
const T = require('../src/scenetools');
const { validate } = require('../src/validate');
const { compile } = require('../src/build');
let pass = 0, fail = 0; const t = (n, f) => { try { f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.message)); } };
const tmp = p => fs.mkdtempSync(path.join(os.tmpdir(), p));
const GOOD = "scene({ look: 'plain', draw(c) { c.circle(c.cx, c.cy, 40 + 10 * Math.sin(c.t), { fill: c.pal.main }); } });";
const msgs = (src, kind) => lintSource(src, kind || 'scene').errors.map(e => e.message);

t('a normal scene lints clean', () => assert.deepStrictEqual(lintSource(GOOD, 'scene').errors, []));
t('the linter refuses everything that would make frames differ, leak, or hang, and says how to fix it', () => {
  const cases = [['Math.random()', /Math\.random/], ['Date.now()', /wall-clock/], ['new Date()', /wall-clock/], ['performance.now()', /wall-clock/], ['fetch("x")', /network/], ['new XMLHttpRequest()', /network/], ['document.title = "x"', /DOM or global/], ['window.x = 1', /DOM or global/], ['eval("1")', /dynamic code/], ['new Function("return 1")', /dynamic code/], ['import("x")', /imports/], ['require("fs")', /imports/], ['setTimeout(f, 1)', /timers/], ['requestAnimationFrame(f)', /timers/], ['while (true) {}', /endless loop/]];
  for (const [bad, re] of cases) { const m = msgs("scene({ draw(c) { " + bad + "; } });"); assert.ok(m.some(x => re.test(x)), bad + ' -> ' + m.join('|')); }
  assert.ok(lintSource("scene({ draw(c) { Math.random(); } });", 'scene').errors.every(e => e.fix), 'every error carries a fix');
});
t('forbidden words inside comments are ignored; a method named like a global is fine', () => assert.deepStrictEqual(msgs("// no Math.random() here, no fetch\n/* document.title */\nscene({ draw(c) { c.fetch = 1; c.text('Math.random in a string is fine', 0, 0, 10); } });"), []));
t('syntax errors report a line; a file without scene() or draw is refused', () => {
  const m = lintSource("scene({\n draw(c) {\n c.circle(1,2,3;\n } });", 'scene').errors[0]; assert.ok(/syntax error/.test(m.message) && m.line >= 1);
  assert.ok(msgs('var x = 1;').some(x => /never calls scene/.test(x))); assert.ok(msgs("scene({ look: 'plain' });").some(x => /no draw/.test(x)));
  assert.ok(msgs('var x = 1;', 'rig').some(x => /never calls rig/.test(x))); assert.ok(msgs('var x = 1;', 'look').some(x => /never calls look/.test(x)));
  assert.ok(msgs('scene({draw(c){}});' + ' '.repeat(310 * 1024)).some(x => /limit/.test(x)));
});

const proj = () => { const d = tmp('fs-scene-'); fs.mkdirSync(path.join(d, 'scenes')); fs.mkdirSync(path.join(d, 'rigs')); fs.mkdirSync(path.join(d, 'assets')); return d; };
const spec = (extra) => Object.assign({ version: 1, meta: { title: 'T' }, bpm: 128, bars: 24, endCardBar: 22.6, score: { preset: 'anthem-46' }, shots: [[1, 25, 'scene', 'one']], narration: [], prompts: [] }, extra || {});
t('validate: a scene shot needs its file, a valid name, clean code and existing assets; "scene" is a known style', () => {
  const d = proj(), v = s => validate(s, d).errors.map(e => e.message);
  assert.ok(v(spec()).some(m => /scenes\/one\.js does not exist/.test(m)), 'missing file'); assert.ok(!v(spec()).some(m => /unknown style/.test(m)));
  assert.ok(v(spec({ shots: [[1, 25, 'scene', '../evil']] })).some(m => /not valid/.test(m)));
  fs.writeFileSync(path.join(d, 'scenes', 'one.js'), GOOD); assert.deepStrictEqual(v(spec()).filter(m => /scene/.test(m)), []);
  fs.writeFileSync(path.join(d, 'scenes', 'one.js'), "scene({ draw(c) { Math.random(); c.image('assets/missing.svg', 0, 0); } });");
  const m = v(spec()).join('|'); assert.ok(/Math\.random/.test(m) && /missing\.svg/.test(m), m);
});
t('collect embeds the scenes in use, every rig and look, and only the assets they mention (never outside the project)', () => {
  const d = proj(); fs.writeFileSync(path.join(d, 'assets', 'a.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>'); fs.writeFileSync(path.join(d, 'assets', 'unused.svg'), '<svg/>'); fs.writeFileSync(path.join(path.dirname(d), 'outside.svg'), '<svg/>');
  fs.writeFileSync(path.join(d, 'scenes', 'one.js'), "scene({ draw(c) { c.image('assets/a.svg', 0, 0); c.image('../outside.svg', 0, 0); } });"); fs.writeFileSync(path.join(d, 'scenes', 'other.js'), GOOD);
  fs.writeFileSync(path.join(d, 'rigs', 'r.js'), "rig('r', { parts: [] });");
  const c = collect(spec(), d); assert.deepStrictEqual(Object.keys(c.scenes), ['one']); assert.ok(c.rigs.r); assert.deepStrictEqual(Object.keys(c.data), ['assets/a.svg']); assert.ok(/^data:image\/svg\+xml;base64,/.test(c.data['assets/a.svg']));
});
t('compile puts scenes, rigs, looks and the runtime into the film, and the script parses', () => {
  const d = proj(); fs.writeFileSync(path.join(d, 'scenes', 'one.js'), GOOD); fs.writeFileSync(path.join(d, 'rigs', 'r.js'), "rig('r', { parts: [] });"); fs.mkdirSync(path.join(d, 'looks')); fs.writeFileSync(path.join(d, 'looks', 'mine.js'), "look('mine', { pal: { bg: '#000' } });");
  const html = compile(spec(), d), js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>')); new Function(js);
  assert.ok(html.includes('"one":{"src"') && html.includes('function scDraw') && html.includes("scene:function(v){scDraw(v)}")); assert.ok(!/\{\{[A-Z_]+\}\}/.test(html));
});
t('a film without scenes builds exactly as before (empty scene tables)', () => { const html = compile(spec({ shots: [[1, 25, 'atom', 'spark']] }), proj()); assert.ok(html.includes('var SCENES={},SC_DATA={},RIGS_SRC={},LOOKS_SRC={};')); });
t('scaffolds: scene, rig and look are created, lint clean, refuse to overwrite, and reject bad names', () => {
  const d = tmp('fs-scaf-');
  for (const k of ['scene', 'rig', 'look']) { const f = T.scaffold(d, k, 'demo', { look: 'wayang' }); assert.deepStrictEqual(lintSource(fs.readFileSync(f, 'utf8'), k).errors, [], k); assert.throws(() => T.scaffold(d, k, 'demo'), /already exists/); }
  assert.ok(/look: 'wayang'/.test(fs.readFileSync(path.join(d, 'scenes', 'demo.js'), 'utf8'))); assert.throws(() => T.scaffold(d, 'scene', '../x'), /not valid/); assert.throws(() => T.scaffold(d, 'scene', ''), /not valid/);
});
t('the look catalog lists the built-in looks with palettes and picks up project looks', () => {
  const d = proj(); fs.mkdirSync(path.join(d, 'looks')); fs.writeFileSync(path.join(d, 'looks', 'mine.js'), "look('mine', { desc: 'my look', pal: { bg: '#123456' }, fx: [{ n: 'vignette' }], bg(c) { c.clear(c.pal.bg); } });");
  const cat = T.lookCatalog(d); assert.ok(cat.plain && cat.wayang && cat.wayang.pal.bg && cat.wayang.desc && cat.wayang.source === 'built-in'); assert.deepStrictEqual([cat.mine.desc, cat.mine.pal.bg, cat.mine.fx, cat.mine.source.startsWith('project')], ['my look', '#123456', ['vignette'], true]);
});
t('the shared library: save checks lint, use copies the file and its assets, and nothing is overwritten silently', () => {
  const lib = tmp('fs-lib-'); process.env.FILMSTUDIO_LIBRARY = lib; const a = proj(), b = proj();
  fs.writeFileSync(path.join(a, 'assets', 'logo.svg'), '<svg/>'); fs.writeFileSync(path.join(a, 'scenes', 'sc.js'), "scene({ draw(c) { c.image('assets/logo.svg', 0, 0); } });"); fs.writeFileSync(path.join(a, 'scenes', 'bad.js'), 'scene({ draw(c) { Math.random(); } });');
  assert.throws(() => T.libSave(a, 'scene', 'bad'), /lint errors/); const s = T.libSave(a, 'scene', 'sc'); assert.deepStrictEqual(s.assets, ['assets/logo.svg']); assert.deepStrictEqual(T.libList(), [{ kind: 'scene', name: 'sc' }]);
  const u = T.libUse(b, 'scene', 'sc'); assert.ok(fs.existsSync(path.join(b, 'scenes', 'sc.js')) && fs.existsSync(path.join(b, 'assets', 'logo.svg')) && u.assetsCopied.length === 1);
  assert.throws(() => T.libUse(b, 'scene', 'sc'), /already exists/); const again = T.libUse(b, 'scene', 'sc', { as: 'sc2' }); assert.deepStrictEqual(again.assetsAlreadyThere, ['assets/logo.svg']); assert.throws(() => T.libUse(b, 'scene', 'nope'), /no scene "nope"/); delete process.env.FILMSTUDIO_LIBRARY;
});
console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
