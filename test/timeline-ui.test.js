#!/usr/bin/env node
'use strict';
// Real-browser test of the project picker and the timeline (drag, undo, live update, conflict banner).
// Drives Chrome over the DevTools protocol with Node's built-in WebSocket (Node 22+): no playwright needed.
// Skips (exit 0) when there is no Chrome/Chromium or no global WebSocket. Set FILMSTUDIO_CHROMIUM to pick a binary,
// FILMSTUDIO_SHOTS=<dir> to save screenshots.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), { spawn } = require('child_process');
const { createStudio } = require('../src/studio');
const ROOT = path.join(__dirname, '..');

function findChrome() {
  const home = os.homedir(), c = [process.env.FILMSTUDIO_CHROMIUM, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const dir of [path.join(home, 'Library/Caches/ms-playwright'), path.join(home, '.cache/ms-playwright')]) { try { for (const d of fs.readdirSync(dir).filter(x => /^chromium-\d+$/.test(x))) for (const sub of ['chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/chrome']) c.push(path.join(dir, d, sub)); } catch (e) { /* none */ } }
  return c.filter(Boolean).find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
}
const chrome = findChrome();
if (typeof WebSocket === 'undefined' || !chrome) { console.log('skipped: needs Node 22+ (global WebSocket) and Chrome or Chromium' + (chrome ? '' : ' (none found; set FILMSTUDIO_CHROMIUM)')); process.exit(0); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + String(e && e.message).split('\n').slice(0, 4).join('\n     ')); } };

function connect(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url); let id = 0; const pend = new Map(), subs = [];
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } else subs.forEach(f => f(m)); };
    ws.onopen = () => res({ send: (method, params) => new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params })); }), on: f => subs.push(f), close: () => ws.close() });
    ws.onerror = () => rej(new Error('cannot connect to ' + url));
  });
}

(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-chrome-'));
  const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((res, rej) => { let buf = ''; proc.stderr.on('data', d => { buf += d; const m = /DevTools listening on ws:\/\/([\d.:]+)\//.exec(buf); if (m) res(m[1]); }); proc.on('exit', c => rej(new Error('chrome exited early: ' + c))); setTimeout(() => rej(new Error('chrome did not start')), 20000); });
  const target = await (await fetch('http://' + endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
  const c = await connect(target.webSocketDebuggerUrl), errors = [];
  c.on(m => { if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' ')); });
  const netFails = [], reqUrl = new Map(); c.on(m => { if (m.method === 'Network.requestWillBeSent') reqUrl.set(m.params.requestId, m.params.request.method + ' ' + m.params.request.url.replace(/^http:\/\/[^/]+/, '')); if (m.method === 'Network.loadingFailed' && !/favicon/.test(reqUrl.get(m.params.requestId) || '')) netFails.push((reqUrl.get(m.params.requestId) || '?') + ' -> ' + m.params.errorText + (m.params.canceled ? ' (canceled)' : '')); });
  await c.send('Network.enable'); await c.send('Runtime.enable'); await c.send('Page.enable'); await c.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
  const ev = async expr => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('page: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text)); return r.result.value; };
  const waitFor = async (expr, what, ms = 8000) => { const end = Date.now() + ms; let last; while (Date.now() < end) { try { last = await ev(expr); if (last) return last; } catch (e) { last = e.message; } await sleep(100); } const snap = await ev('({tab:(document.querySelector("[aria-selected=true]")||{}).textContent,banner:(document.querySelector("#banner")||{}).innerText,msg:(document.querySelector(".tl-msg")||{}).textContent,state:(document.querySelector("#state")||{}).textContent,view:(document.querySelector("#view")||{}).innerText.slice(0,100),shots:[].map.call(document.querySelectorAll(".tl-shot"),function(e){return e.textContent}).slice(0,3)})').catch(() => null); throw new Error('timed out waiting for ' + what + (last ? ' (last: ' + String(last).slice(0, 120) + ')' : '') + ' | page: ' + JSON.stringify(snap) + ' | failed requests: ' + JSON.stringify(netFails)); };
  const go = async url => { await c.send('Page.navigate', { url }); await sleep(150); await waitFor('location.href.indexOf("http")===0&&document.readyState!=="loading"', 'page load'); /* not "complete": that waits for the offline Google Fonts request */ };
  const shot = async name => { if (!process.env.FILMSTUDIO_SHOTS) return; fs.mkdirSync(process.env.FILMSTUDIO_SHOTS, { recursive: true }); fs.writeFileSync(path.join(process.env.FILMSTUDIO_SHOTS, name + '.png'), Buffer.from((await c.send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const mouse = (type, x, y) => c.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  const dragBy = async (x, y, dx) => { await mouse('mouseMoved', x, y); await mouse('mousePressed', x, y); for (let i = 1; i <= 8; i++) await mouse('mouseMoved', x + dx * i / 8, y); await mouse('mouseReleased', x + dx, y); await sleep(500); };
  const rect = sel => ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return null;e.scrollIntoView({block:"center",inline:"center"});var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,l:r.left}})()');
  const key = (k, mods) => c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: 'Key' + k.toUpperCase(), modifiers: mods || 0, windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) });

  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-uiproj-')); fs.cpSync(path.join(ROOT, 'examples', 'the-only-limit'), proj, { recursive: true, filter: s => !s.includes(path.sep + 'build') });
  const st = createStudio({ dir: proj }), port = await st.listen(0), URL0 = 'http://127.0.0.1:' + port + '/';
  const specFile = path.join(proj, 'spec.json'), spec = () => JSON.parse(fs.readFileSync(specFile, 'utf8')), agentWrite = f => { const s = spec(); f(s); fs.writeFileSync(specFile, JSON.stringify(s, null, 1)); };
  const orig = spec();
  try {
    await t('timeline tab draws every track from spec.json without page errors', async () => {
      await go(URL0); await waitFor('document.querySelector("#tabs button")', 'tabs'); await ev('document.querySelector("[data-tab=timeline]").click()'); await waitFor('document.querySelectorAll(".tl-shot").length>0', 'timeline blocks');
      const n = await ev('({shots:document.querySelectorAll(".tl-shot").length,nar:document.querySelectorAll(".tl-nar").length,pr:document.querySelectorAll(".tl-pr").length,mus:document.querySelectorAll(".tl-mus").length,handles:document.querySelectorAll(".tl-h").length,ticks:document.querySelectorAll(".tl-tick").length,ph:!!document.querySelector(".tl-ph")})');
      assert.deepStrictEqual([n.shots, n.nar, n.pr, n.handles], [orig.shots.length, orig.narration.length, orig.prompts.length, orig.shots.length - 1]); assert.ok(n.mus >= 5 && n.ticks > 5 && n.ph, JSON.stringify(n)); await shot('timeline'); assert.deepStrictEqual(errors, []);
    });
    await t('the ruler moves the playhead and the readout says which shot is under it', async () => {
      const r = await rect('.tl-ruler'); await mouse('mousePressed', r.l + 200, r.y); await mouse('mouseReleased', r.l + 200, r.y); await sleep(200);
      const txt = await ev('document.querySelector(".tl-read").textContent'); assert.ok(/^bar \d/.test(txt) && /shot #\d+ /.test(txt) && /s of 86\.3 s/.test(txt), txt);
    });
    let i0, bar0;
    await t('dragging a cut handle retimes two shots in spec.json, snapped to a beat, and the film stays valid', async () => {
      i0 = orig.shots.findIndex((s, i) => i > 3 && i < orig.shots.length - 2 && s[1] - s[0] >= 1 && orig.shots[i + 1][1] - orig.shots[i + 1][0] >= 1); bar0 = orig.shots[i0][1];
      const hs = await ev('(function(){var hs=document.querySelectorAll(".tl-h");var h=hs[' + i0 + '];h.scrollIntoView({block:"center",inline:"center"});var r=h.getBoundingClientRect();var z=document.querySelector(".tl-shot").parentNode.getBoundingClientRect().width/' + orig.bars + ';return {x:r.left+r.width/2,y:r.top+r.height/2,z:z}})()');
      await dragBy(hs.x, hs.y, hs.z * 0.5 + 1); await waitFor('/saved/.test(document.querySelector(".tl-msg").textContent)', 'save message');
      const s = spec(); assert.strictEqual(s.shots[i0][1], bar0 + 0.5); assert.strictEqual(s.shots[i0 + 1][0], bar0 + 0.5); assert.strictEqual(s.shots[i0 + 1][1], orig.shots[i0 + 1][1]); assert.strictEqual(s.shots.length, orig.shots.length);
      assert.ok(require('../src/validate').validate(s, proj).ok, 'spec still valid'); assert.ok(/valid/.test(await ev('document.querySelector("#side").textContent')), 'check panel updated'); await shot('after-drag');
    });
    await t('Ctrl/Cmd+Z undoes the drag and restores the original shots', async () => { await ev('document.activeElement&&document.activeElement.blur()'); await key('z', 4 | 2); await waitFor('/Undid/.test(document.querySelector(".tl-msg").textContent)', 'undo message'); assert.deepStrictEqual(spec().shots, orig.shots); });
    await t('dragging a narration block moves that line inside its neighbours and keeps its voice file', async () => {
      const n = 2, hs = await ev('(function(){var e=document.querySelectorAll(".tl-nar")[' + n + '];e.scrollIntoView({block:"center",inline:"center"});var r=e.getBoundingClientRect();var z=document.querySelector(".tl-shot").parentNode.getBoundingClientRect().width/' + orig.bars + ';return {x:r.left+Math.min(10,r.width/2),y:r.top+r.height/2,z:z}})()');
      await dragBy(hs.x, hs.y, hs.z * 0.5); await waitFor('/saved/.test(document.querySelector(".tl-msg").textContent)', 'save message');
      const was = (orig.narration[n].at[0] - 1) * 4 + orig.narration[n].at[1], now = spec().narration[n]; assert.strictEqual((now.at[0] - 1) * 4 + now.at[1], was + 2); assert.strictEqual(now.file, orig.narration[n].file); assert.ok(require('../src/validate').validate(spec(), proj).ok);
      await ev('document.activeElement&&document.activeElement.blur()'); await key('z', 4 | 2); await waitFor('/Undid/.test(document.querySelector(".tl-msg").textContent)', 'undo'); assert.deepStrictEqual(spec().narration, orig.narration);
    });
    await t('S splits the shot under the playhead; Delete on the selected shot removes it again', async () => {
      const r = await rect('.tl-shot[data-i="' + i0 + '"]'); await mouse('mousePressed', r.l + 6, r.y); await mouse('mouseReleased', r.l + 6, r.y); await sleep(200);
      await key('s'); await waitFor('spec=1&&/Split/.test(document.querySelector(".tl-msg").textContent)'.replace('spec=1&&', ''), 'split message'); assert.strictEqual(spec().shots.length, orig.shots.length + 1);
      await waitFor('document.querySelectorAll(".tl-shot").length===' + (orig.shots.length + 1), 'redraw with the extra shot');
      await ev('document.querySelector(".tl-shot[data-i=\\"' + (i0 + 1) + '\\"]").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,clientX:5,clientY:5}))'); await key('Delete'); await waitFor('spec=1&&/Deleted/.test(document.querySelector(".tl-msg").textContent)'.replace('spec=1&&', ''), 'delete message');
      assert.strictEqual(spec().shots.length, orig.shots.length); assert.ok(require('../src/validate').validate(spec(), proj).ok);
    });
    await t('an edit made to spec.json on disk (an agent) shows up in the open timeline without a reload', async () => {
      const before = await ev('document.querySelectorAll(".tl-shot")[1].textContent'); await ev('window.__marker=1');
      agentWrite(s => { s.shots[1][2] = 'paper'; s.shots[1][3] = 'land1'; }); await waitFor('document.querySelectorAll(".tl-shot")[1].textContent==="paper/land1"', 'live update (poll is 2 s)', 6000);
      assert.notStrictEqual(before, 'paper/land1'); assert.strictEqual(await ev('window.__marker'), 1, 'page was not reloaded'); assert.strictEqual(await ev('document.querySelector(".tl-live").classList.contains("on")'), true, 'live dot is on');
      assert.ok(!(await ev('document.querySelector("#banner").style.display!=="none"')), 'no conflict banner when nothing was pending'); agentWrite(s => { s.shots[1][2] = orig.shots[1][2]; s.shots[1][3] = orig.shots[1][3]; }); await waitFor('document.querySelectorAll(".tl-shot")[1].textContent===' + JSON.stringify(orig.shots[1][2] + '/' + orig.shots[1][3]), 'restore', 6000);
    });
    await t('a pending page edit plus an agent edit gives a conflict notice, not a silent overwrite; "Load their version" resolves it', async () => {
      await ev('document.querySelector("[data-tab=story]").click()'); await waitFor('document.querySelector(".shot input[data-f=\\"0\\"]")', 'storyboard');
      await ev('(function(){var e=document.querySelector(".shot textarea[data-nf],.shot input[data-pf],.shot input[data-nf]");var i=document.querySelector("input[data-nf=text],textarea[data-nf=text]");i.value=i.value+" (page edit)";i.dispatchEvent(new Event("input",{bubbles:true}))})()');
      agentWrite(s => { s.meta.title = 'Agent title'; });
      await waitFor('document.querySelector("#banner").style.display!=="none"&&/changed on disk/.test(document.querySelector("#banner").textContent)', 'conflict banner'); await shot('conflict');
      assert.strictEqual(spec().meta.title, 'Agent title'); assert.ok(!/page edit/.test(JSON.stringify(spec().narration)), 'the stale page copy was not written over the agent\'s file');
      await ev('document.querySelector("#banner [data-act=reload]").click()'); await waitFor('document.querySelector("#banner").style.display==="none"', 'banner closes'); await sleep(300); assert.ok(!/page edit/.test(await ev('document.querySelector("#view").innerHTML')), 'page now shows the file, not the unsaved edit');
    });
    await t('no page errors across all of the above', () => assert.deepStrictEqual(errors, []));
  } finally { /* the workspace checks below reuse the browser */ }

  /* ---------- project picker + a project page under /p/<name>/ ---------- */
  const wsroot = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-uiws-'));
  for (const n of ['alpha-film', 'beta-film']) fs.cpSync(path.join(ROOT, 'examples', 'the-only-limit'), path.join(wsroot, n), { recursive: true, filter: s => !s.includes(path.sep + 'build') });
  agentWriteTo(path.join(wsroot, 'beta-film', 'spec.json'), s => { s.meta.title = 'Beta Title'; });
  function agentWriteTo(f, fn) { const s = JSON.parse(fs.readFileSync(f, 'utf8')); fn(s); fs.writeFileSync(f, JSON.stringify(s, null, 1)); }
  const ws = createStudio({ root: wsroot }), wp = await ws.listen(0), WB = 'http://127.0.0.1:' + wp;
  errors.length = 0;
  await t('the project picker shows a card per project and opens one; its timeline loads under /p/<name>/', async () => {
    await go(WB + '/'); await waitFor('document.querySelectorAll(".pcard").length===2', 'two project cards'); await shot('picker');
    const names = await ev('[].map.call(document.querySelectorAll(".pcard b"),function(e){return e.textContent}).sort().join("|")'); assert.strictEqual(names, 'Beta Title|The Only Limit');
    assert.ok(/New project/.test(await ev('document.querySelector("#view").textContent')));
    await ev('document.querySelector(".pcard[data-name=beta-film]").click()'); await waitFor('/^\\/p\\/beta-film\\/$/.test(location.pathname)&&document.querySelector("#tabs button")', 'project page');
    assert.ok(/beta-film/.test(await ev('document.querySelector("#dir").textContent'))); assert.ok(await ev('!!document.querySelector("h1 a")'), 'back link to all projects');
    await ev('document.querySelector("[data-tab=timeline]").click()'); await waitFor('document.querySelectorAll(".tl-shot").length>0', 'timeline under /p/'); assert.deepStrictEqual(errors, []);
  });
  await t('creating a project from the picker lands in the new project', async () => {
    await go(WB + '/'); await waitFor('document.querySelector("#newp")', 'new project form');
    await ev('(function(){var f=document.querySelector("#newp");f.name.value="made-in-ui";f.length.value="45";f.requestSubmit()})()'); await waitFor('/^\\/p\\/made-in-ui\\/$/.test(location.pathname)&&document.querySelector("#tabs button")', 'new project page');
    const sp = JSON.parse(fs.readFileSync(path.join(wsroot, 'made-in-ui', 'spec.json'), 'utf8')); assert.ok(Math.abs(sp.bars * 240 / sp.bpm - 45) < 3); assert.deepStrictEqual(errors, []);
  });
  await ws.close(); await st.close(); c.close(); proc.kill();
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
