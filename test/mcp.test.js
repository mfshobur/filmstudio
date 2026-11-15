#!/usr/bin/env node
'use strict';
// MCP server tests: spawn `filmstudio mcp` and speak JSON-RPC over stdio.
const { spawn } = require('child_process'), path = require('path'), fs = require('fs'), os = require('os'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-mcp-'));
fs.cpSync(path.join(ROOT, 'examples', 'the-only-limit'), path.join(work, 'proj'), { recursive: true, filter: s => !s.includes(path.sep + 'build') });
const p = spawn(process.execPath, [path.join(ROOT, 'bin', 'filmstudio.js'), 'mcp', '--root', work], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', waiting = {}, nextId = 1; p.stdout.setEncoding('utf8');
p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue; const m = JSON.parse(line); if (waiting[m.id]) { waiting[m.id](m); delete waiting[m.id]; } } });
const rpc = (method, params) => new Promise((res, rej) => { const id = nextId++; waiting[id] = res; p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); setTimeout(() => rej(new Error('timeout ' + method)), 20000); });
const call = (name, args) => rpc('tools/call', { name, arguments: args });
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + e.message); } };
(async () => {
  await t('initialize returns server info and capabilities', async () => { const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } }); assert.strictEqual(r.result.serverInfo.name, 'filmstudio'); assert.ok(r.result.capabilities.tools && r.result.capabilities.resources); assert.strictEqual(r.result.protocolVersion, '2024-11-05'); });
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await t('ping works', async () => { const r = await rpc('ping'); assert.deepStrictEqual(r.result, {}); });
  await t('tools/list exposes the film tools with schemas', async () => { const r = await rpc('tools/list'); const names = r.result.tools.map(x => x.name); ['filmstudio_new', 'filmstudio_validate', 'filmstudio_build', 'filmstudio_voice', 'filmstudio_voice_check', 'filmstudio_review', 'filmstudio_audio_check', 'filmstudio_export', 'filmstudio_styles', 'filmstudio_guide', 'filmstudio_doctor', 'filmstudio_list', 'filmstudio_scene_new', 'filmstudio_scene_list', 'filmstudio_scene_preview', 'filmstudio_scene_check', 'filmstudio_look_list', 'filmstudio_look_show', 'filmstudio_library'].forEach(n => assert.ok(names.includes(n), 'missing ' + n)); r.result.tools.forEach(x => { assert.strictEqual(x.inputSchema.type, 'object'); assert.ok(x.description.length > 10); }); });
  await t('validate runs on a project inside the root', async () => { const r = await call('filmstudio_validate', { dir: 'proj' }); assert.ok(!r.result.isError, JSON.stringify(r.result)); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(j.info.seconds > 80); });
  await t('build runs and reports the output', async () => { const r = await call('filmstudio_build', { dir: 'proj' }); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(fs.existsSync(path.join(work, 'proj', 'build', 'film.html'))); });
  await t('new creates a starter project inside the root', async () => { const r = await call('filmstudio_new', { dir: 'fresh' }); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(fs.existsSync(path.join(work, 'fresh', 'spec.json'))); const v = await call('filmstudio_validate', { dir: 'fresh' }); assert.strictEqual(JSON.parse(v.result.content[0].text).ok, true); });
  await t('new accepts length, preset and format', async () => { const r = await call('filmstudio_new', { dir: 'shorty', length: 45, preset: 'calm-46', format: '9:16' }); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true, r.result.content[0].text); const sp = JSON.parse(fs.readFileSync(path.join(work, 'shorty', 'spec.json'), 'utf8')); assert.strictEqual(sp.format, '9:16'); assert.strictEqual(sp.score.preset, 'calm-46'); assert.ok(Math.abs(sp.bars * 240 / sp.bpm - 45) < 3, sp.bars + ' bars at ' + sp.bpm); });
  await t('list shows the projects inside the server root (and only that root)', async () => { const r = await call('filmstudio_list', {}); assert.ok(!r.result.isError, JSON.stringify(r.result)); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(fs.realpathSync(j.root), fs.realpathSync(work)); const names = j.projects.map(p => p.name); assert.ok(names.includes('proj') && names.includes('fresh'), names.join()); const sneaky = await call('filmstudio_list', { root: '/etc', dir: '/etc' }); assert.strictEqual(fs.realpathSync(JSON.parse(sneaky.result.content[0].text).root), fs.realpathSync(work), 'arguments must not change the root'); });
  await t('scene tools: scaffold a scene, list it, look up looks, and refuse paths outside the root', async () => {
    const n = await call('filmstudio_scene_new', { dir: 'proj', name: 'mcp-demo', look: 'paper' }); assert.ok(!n.result.isError, JSON.stringify(n.result)); assert.ok(fs.existsSync(path.join(work, 'proj', 'scenes', 'mcp-demo.js')));
    const r = await call('filmstudio_scene_new', { dir: 'proj', name: 'mcp-rig', kind: 'rig' }); assert.ok(fs.existsSync(path.join(work, 'proj', 'rigs', 'mcp-rig.js')), JSON.stringify(r.result));
    const l = JSON.parse((await call('filmstudio_scene_list', { dir: 'proj' })).result.content[0].text); assert.ok(l.scenes.includes('mcp-demo') && l.rigs.includes('mcp-rig'));
    const ll = JSON.parse((await call('filmstudio_look_list', {})).result.content[0].text); assert.ok(ll.looks.some(x => x.name === 'wayang') && ll.looks.length >= 29);
    const ls = JSON.parse((await call('filmstudio_look_show', { name: 'shadow' })).result.content[0].text); assert.strictEqual(ls.name, 'wayang'); assert.ok(ls.guide && ls.pal.bg);
    const bad = await call('filmstudio_scene_new', { dir: '../outside', name: 'x' }); assert.strictEqual(bad.result.isError, true); assert.ok(/outside the workspace/.test(bad.result.content[0].text));
  });
  await t('paths outside the workspace root are refused', async () => { for (const d of ['../outside', '/etc', '../../tmp/x']) { const r = await call('filmstudio_build', { dir: d }); assert.strictEqual(r.result.isError, true, d); assert.ok(/outside the workspace/.test(r.result.content[0].text), d); } });
  await t('a failing command is reported as an error with the CLI message', async () => { const r = await call('filmstudio_validate', { dir: 'nope' }); assert.strictEqual(r.result.isError, true); assert.ok(/spec.json not found/.test(r.result.content[0].text)); });
  await t('missing required argument is reported', async () => { const r = await call('filmstudio_validate', {}); assert.strictEqual(r.result.isError, true); assert.ok(/missing required argument: dir/.test(r.result.content[0].text)); });
  await t('styles filters by mood', async () => { const r = await call('filmstudio_styles', { mood: 'calm' }); const j = JSON.parse(r.result.content[0].text); assert.ok(j.ink && j.paper && !j.pixel); });
  await t('guide lists topics and returns a topic', async () => { const a = await call('filmstudio_guide', {}); assert.ok(JSON.parse(a.result.content[0].text).topics.length >= 14); const b = await call('filmstudio_guide', { topic: 'quick-start' }); assert.ok(/Quick start/.test(b.result.content[0].text)); });
  await t('unknown tool is an error', async () => { const r = await call('filmstudio_nope', {}); assert.strictEqual(r.result.isError, true); });
  await t('resources list the guide and can be read', async () => { const l = await rpc('resources/list'); assert.ok(l.result.resources.some(x => x.uri === 'filmstudio://guide/01-quick-start')); const r = await rpc('resources/read', { uri: 'filmstudio://guide/01-quick-start' }); assert.ok(/Quick start/.test(r.result.contents[0].text)); const bad = await rpc('resources/read', { uri: 'filmstudio://guide/../../etc/passwd' }); assert.ok(bad.error, 'path traversal must fail'); });
  await t('initialize carries the full brief as instructions and offers prompts', async () => { const r = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } }); const ins = r.result.instructions; assert.ok(ins.length > 2000 && /filmstudio_guide/.test(ins) && /DRAW|draw/.test(ins) && /cannot hear/.test(ins) && /filmstudio_job/.test(ins)); assert.ok(r.result.capabilities.prompts); });
  await t('prompts/get make_film returns the brief with the idea', async () => { const l = await rpc('prompts/list'); assert.ok(l.result.prompts.some(x => x.name === 'make_film')); const g = await rpc('prompts/get', { name: 'make_film', arguments: { idea: 'a lighthouse', length: '40' } }); const txt = g.result.messages[0].content.text; assert.ok(/a lighthouse/.test(txt) && /40 seconds/.test(txt) && /filmstudio_scene_preview/.test(txt)); const bad = await rpc('prompts/get', { name: 'nope' }); assert.ok(bad.error); });
  await t('file tools: write, read, edit and list a scene without any other file access', async () => {
    const w = await call('filmstudio_write', { dir: 'fresh', path: 'scenes/hop.js', content: "scene({ look: 'plain', draw(c) { c.clear('#123'); } });" }); assert.ok(!w.result.isError, JSON.stringify(w.result));
    assert.ok(/clear/.test((await call('filmstudio_read', { dir: 'fresh', path: 'scenes/hop.js' })).result.content[0].text));
    const e = await call('filmstudio_edit', { dir: 'fresh', path: 'scenes/hop.js', old_text: '#123', new_text: '#456' }); assert.ok(!e.result.isError); assert.ok(/#456/.test(fs.readFileSync(path.join(work, 'fresh', 'scenes', 'hop.js'), 'utf8')));
    assert.ok((await call('filmstudio_edit', { dir: 'fresh', path: 'scenes/hop.js', old_text: 'zzz', new_text: 'x' })).result.isError);
    assert.ok(JSON.parse((await call('filmstudio_files', { dir: 'fresh' })).result.content[0].text).files.some(f => f.path === 'scenes/hop.js'));
    assert.ok((await call('filmstudio_write', { dir: 'fresh', path: 'spec.json', content: '{ nope' })).result.isError, 'invalid spec.json must be refused');
  });
  await t('file tools refuse escapes, odd paths, other file types and symlinks', async () => {
    for (const [dir, pth] of [['fresh', '../x.js'], ['fresh', '/etc/passwd'], ['fresh', 'scenes/../../x.js'], ['fresh', 'run.sh'], ['fresh', '.env'], ['..', 'spec.json'], ['fresh', 'scenes/a b.js']]) assert.ok((await call('filmstudio_write', { dir, path: pth, content: 'x' })).result.isError, 'should refuse ' + pth);
    assert.ok((await call('filmstudio_read', { dir: 'fresh', path: '../../../etc/hosts' })).result.isError);
    try { fs.symlinkSync(os.tmpdir(), path.join(work, 'fresh', 'scenes', 'lnk')); } catch (e) { return; }
    assert.ok((await call('filmstudio_read', { dir: 'fresh', path: 'scenes/lnk/anything' })).result.isError);
    assert.ok((await call('filmstudio_write', { dir: 'fresh', path: 'scenes/lnk/x.js', content: 'x' })).result.isError);
  });
  await t('slow tools run as background jobs that can be polled', async () => {
    const r = await call('filmstudio_export', { dir: 'proj', quality: 'draft', from_bar: 1, to_bar: 2, no_audio: true, wait: 1 }); const txt = r.result.content[0].text;
    if (/browser|playwright|ffmpeg/i.test(txt) && !/"status": "running"/.test(txt)) return;   // no browser here: skip
    const m = /"job": "(j\d+)"/.exec(txt); assert.ok(m, 'expected a job id: ' + txt.slice(0, 200));
    let done = null; for (let i = 0; i < 12 && !done; i++) { const j = await call('filmstudio_job', { id: m[1], wait: 20 }); if (!/"status": "running"/.test(j.result.content[0].text)) done = j.result.content[0].text; }
    assert.ok(done, 'job should finish'); assert.ok((await call('filmstudio_job', {})).result.content[0].text.includes(m[1]));
    assert.ok((await call('filmstudio_job', { id: 'j999' })).result.isError);
  });
  await t('unknown method returns a JSON-RPC error', async () => { const r = await rpc('bogus/method'); assert.strictEqual(r.error.code, -32601); });
  p.stdin.end(); console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
