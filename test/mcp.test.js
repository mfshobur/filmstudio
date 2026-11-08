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
  await t('tools/list exposes the film tools with schemas', async () => { const r = await rpc('tools/list'); const names = r.result.tools.map(x => x.name); ['filmstudio_new', 'filmstudio_validate', 'filmstudio_build', 'filmstudio_voice', 'filmstudio_voice_check', 'filmstudio_review', 'filmstudio_audio_check', 'filmstudio_export', 'filmstudio_styles', 'filmstudio_guide', 'filmstudio_doctor'].forEach(n => assert.ok(names.includes(n), 'missing ' + n)); r.result.tools.forEach(x => { assert.strictEqual(x.inputSchema.type, 'object'); assert.ok(x.description.length > 10); }); });
  await t('validate runs on a project inside the root', async () => { const r = await call('filmstudio_validate', { dir: 'proj' }); assert.ok(!r.result.isError, JSON.stringify(r.result)); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(j.info.seconds > 80); });
  await t('build runs and reports the output', async () => { const r = await call('filmstudio_build', { dir: 'proj' }); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(fs.existsSync(path.join(work, 'proj', 'build', 'film.html'))); });
  await t('new creates a starter project inside the root', async () => { const r = await call('filmstudio_new', { dir: 'fresh' }); const j = JSON.parse(r.result.content[0].text); assert.strictEqual(j.ok, true); assert.ok(fs.existsSync(path.join(work, 'fresh', 'spec.json'))); const v = await call('filmstudio_validate', { dir: 'fresh' }); assert.strictEqual(JSON.parse(v.result.content[0].text).ok, true); });
  await t('paths outside the workspace root are refused', async () => { for (const d of ['../outside', '/etc', '../../tmp/x']) { const r = await call('filmstudio_build', { dir: d }); assert.strictEqual(r.result.isError, true, d); assert.ok(/outside the workspace/.test(r.result.content[0].text), d); } });
  await t('a failing command is reported as an error with the CLI message', async () => { const r = await call('filmstudio_validate', { dir: 'nope' }); assert.strictEqual(r.result.isError, true); assert.ok(/spec.json not found/.test(r.result.content[0].text)); });
  await t('missing required argument is reported', async () => { const r = await call('filmstudio_validate', {}); assert.strictEqual(r.result.isError, true); assert.ok(/missing required argument: dir/.test(r.result.content[0].text)); });
  await t('styles filters by mood', async () => { const r = await call('filmstudio_styles', { mood: 'calm' }); const j = JSON.parse(r.result.content[0].text); assert.ok(j.ink && j.paper && !j.pixel); });
  await t('guide lists topics and returns a topic', async () => { const a = await call('filmstudio_guide', {}); assert.ok(JSON.parse(a.result.content[0].text).topics.length >= 14); const b = await call('filmstudio_guide', { topic: 'quick-start' }); assert.ok(/Quick start/.test(b.result.content[0].text)); });
  await t('unknown tool is an error', async () => { const r = await call('filmstudio_nope', {}); assert.strictEqual(r.result.isError, true); });
  await t('resources list the guide and can be read', async () => { const l = await rpc('resources/list'); assert.ok(l.result.resources.some(x => x.uri === 'filmstudio://guide/01-quick-start')); const r = await rpc('resources/read', { uri: 'filmstudio://guide/01-quick-start' }); assert.ok(/Quick start/.test(r.result.contents[0].text)); const bad = await rpc('resources/read', { uri: 'filmstudio://guide/../../etc/passwd' }); assert.ok(bad.error, 'path traversal must fail'); });
  await t('unknown method returns a JSON-RPC error', async () => { const r = await rpc('bogus/method'); assert.strictEqual(r.error.code, -32601); });
  p.stdin.end(); console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
