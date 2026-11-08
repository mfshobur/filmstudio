'use strict';
// The studio server: a small dependency-free HTTP API over a project folder, plus the single-page UI in studio/.
// The project files are the shared state: whatever the user edits here is what an agent reads from disk (and vice versa).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { compile } = require('./build');
const { validate } = require('./validate');
const { STYLES, SCORES } = require('./registry');
const { sampleParams } = require('./samples');
const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'filmstudio.js');
const MAX_BODY = 5 * 1024 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml' };

function createStudio(opts) {
  const dir = path.resolve(opts.dir), host = opts.host || '127.0.0.1', token = opts.token || null;
  const local = ['127.0.0.1', 'localhost', '::1'].includes(host);
  if (!local && !token) throw new Error('A token is required when serving on a non-local address (--token).');
  const f = n => path.join(dir, n);
  const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } };
  const writeJson = (p, o) => { fs.writeFileSync(p + '.tmp', JSON.stringify(o, null, 1)); fs.renameSync(p + '.tmp', p); };
  const jobs = new Map(); let running = null;

  function project() {
    const spec = readJson(f('spec.json'), null);
    return {
      dir, spec, brief: readJson(f('brief.json'), {}), treatment: fs.existsSync(f('treatment.md')) ? fs.readFileSync(f('treatment.md'), 'utf8') : '',
      feedback: readJson(f('feedback.json'), []), validation: spec ? validate(spec, dir) : null,
      hasFilm: fs.existsSync(f('build/film.html')), hasMp4: fs.existsSync(f('build/film.mp4')),
      voiceFiles: fs.existsSync(f('voice')) ? fs.readdirSync(f('voice')).filter(x => /\.(mp3|wav|m4a|ogg)$/.test(x)).sort() : [],
      styles: Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, { variants: v.variants, moods: v.moods || [], use: v.use, params: !!v.params }])), scores: SCORES,
      samples: Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, Object.fromEntries(v.variants.map(x => [x, sampleParams(k, x)]))])),
    };
  }
  function safeJoin(base, rel) { const p = path.resolve(base, '.' + path.sep + decodeURIComponent(rel)); const r = path.relative(base, p); return r.startsWith('..') || path.isAbsolute(r) ? null : p; }
  function startJob(cmd, a) {
    if (running) return { error: 'another job is running (' + running.cmd + ')', code: 409 };
    const allowed = { build: [], voice: ['provider', 'yes', 'force'], 'voice-check': [], review: ['size', 'motion'], 'audio-check': [], export: ['fps', 'size', 'from-bar', 'to-bar', 'no-audio', 'no-bars'] };
    if (!allowed[cmd]) return { error: 'command not allowed: ' + cmd, code: 400 };
    const args = [cmd, dir];
    for (const [k, v] of Object.entries(a || {})) {
      if (!allowed[cmd].includes(k)) return { error: 'option not allowed for ' + cmd + ': ' + k, code: 400 };
      if (typeof v === 'boolean') { if (v) args.push('--' + k); } else if (/^[\w.x-]{1,20}$/.test(String(v))) args.push('--' + k, String(v)); else return { error: 'bad value for ' + k, code: 400 };
    }
    const id = crypto.randomBytes(4).toString('hex'), job = { id, cmd, args: args.slice(2), status: 'running', started: Date.now(), log: '', result: null };
    jobs.set(id, job); running = job;
    const p = spawn(process.execPath, [CLI].concat(args), { env: process.env });
    p.stdout.on('data', d => { job.out = (job.out || '') + d; }); p.stderr.on('data', d => { job.log = (job.log + d).slice(-20000); });
    p.on('close', code => { job.status = code === 0 ? 'done' : 'failed'; job.code = code; job.ended = Date.now(); try { job.result = JSON.parse(job.out || 'null'); } catch (e) { job.result = (job.out || '').slice(-4000); } delete job.out; running = null; writeJson(f('studio-status.json'), { lastJob: { id, cmd, status: job.status, ended: job.ended } }); });
    p.on('error', e => { job.status = 'failed'; job.log += String(e); running = null; });
    return { job };
  }

  const server = http.createServer((req, res) => {
    const send = (code, body, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    try {
      /* DNS-rebinding guard: only accept our own host names */
      const hostHdr = String(req.headers.host || '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
      const okHosts = ['127.0.0.1', 'localhost', '::1'].concat(opts.allowHosts || [], local ? [] : [host]);
      if (!okHosts.includes(hostHdr)) return send(403, { error: 'host not allowed' });
      const url = new URL(req.url, 'http://x'), p = url.pathname;
      /* token (only required when serving beyond localhost): Authorization: Bearer, ?token=, or cookie */
      if (token) {
        const cookie = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith('fs_token=')), given = (req.headers.authorization || '').replace(/^Bearer /, '') || url.searchParams.get('token') || (cookie && cookie.slice(9));
        const a = Buffer.from(String(given || '')), b = Buffer.from(token);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(401, { error: 'token required' });
        if (url.searchParams.get('token')) res.setHeader('Set-Cookie', 'fs_token=' + token + '; HttpOnly; SameSite=Strict; Path=/');
      }
      const mutating = req.method !== 'GET' && req.method !== 'HEAD';
      if (mutating && req.headers['x-filmstudio'] !== '1') return send(403, { error: 'missing X-Filmstudio header' });
      const body = () => new Promise((resolve, reject) => { let n = 0; const ch = []; req.on('data', d => { n += d.length; if (n > MAX_BODY) { reject(Object.assign(new Error('body too large'), { code: 413 })); req.destroy(); } else ch.push(d); }); req.on('end', () => resolve(Buffer.concat(ch).toString('utf8'))); req.on('error', reject); });
      const json = async () => { const t = await body(); try { return JSON.parse(t || 'null'); } catch (e) { throw Object.assign(new Error('invalid JSON'), { code: 400 }); } };
      const handle = async () => {
        if (p === '/api/project' && req.method === 'GET') return send(200, project());
        if (p === '/api/spec' && req.method === 'PUT') { const s = await json(); if (!s || typeof s !== 'object' || Array.isArray(s)) return send(400, { error: 'spec must be a JSON object' }); if (fs.existsSync(f('spec.json')) && !fs.existsSync(f('spec.json.bak'))) fs.copyFileSync(f('spec.json'), f('spec.json.bak')); writeJson(f('spec.json'), s); return send(200, { saved: true, validation: validate(s, dir) }); }
        if (p === '/api/validate' && req.method === 'POST') { const s = await json(); return send(200, validate(s, dir)); }
        if (p === '/api/brief' && req.method === 'PUT') { const b = await json(); if (!b || typeof b !== 'object') return send(400, { error: 'brief must be an object' }); writeJson(f('brief.json'), b); return send(200, { saved: true }); }
        if (p === '/api/treatment' && req.method === 'PUT') { const t = await body(); fs.writeFileSync(f('treatment.md'), t); return send(200, { saved: true }); }
        if (p === '/api/feedback' && req.method === 'POST') { const n = await json(); if (!n || !String(n.text || '').trim()) return send(400, { error: 'text required' }); const list = readJson(f('feedback.json'), []); const note = { id: crypto.randomBytes(3).toString('hex'), text: String(n.text).slice(0, 2000), shot: Number.isInteger(n.shot) ? n.shot : null, bar: typeof n.bar === 'number' ? n.bar : null, status: 'open', created: new Date().toISOString() }; list.push(note); writeJson(f('feedback.json'), list); return send(200, note); }
        const fb = /^\/api\/feedback\/([\w]+)$/.exec(p);
        if (fb && req.method === 'PATCH') { const list = readJson(f('feedback.json'), []), n = list.find(x => x.id === fb[1]); if (!n) return send(404, { error: 'no such note' }); const u = await json(); if (u && ['open', 'done'].includes(u.status)) n.status = u.status; if (u && typeof u.reply === 'string') n.reply = u.reply.slice(0, 2000); writeJson(f('feedback.json'), list); return send(200, n); }
        if (fb && req.method === 'DELETE') { const list = readJson(f('feedback.json'), []).filter(x => x.id !== fb[1]); writeJson(f('feedback.json'), list); return send(200, { deleted: true }); }
        if (p === '/api/build' && req.method === 'POST') { const spec = readJson(f('spec.json'), null); if (!spec) return send(400, { error: 'no spec.json' }); const v = validate(spec, dir); if (!v.ok) return send(422, { error: 'spec has errors', errors: v.errors }); const html = compile(spec, dir); fs.mkdirSync(f('build'), { recursive: true }); fs.writeFileSync(f('build/film.html'), html); return send(200, { ok: true, bytes: html.length, warnings: v.warnings }); }
        if (p === '/api/job' && req.method === 'POST') { const j = await json(); const r = startJob(j && j.cmd, j && j.args); return r.error ? send(r.code, { error: r.error }) : send(200, r.job); }
        const jb = /^\/api\/job\/(\w+)$/.exec(p);
        if (jb && req.method === 'GET') { const j = jobs.get(jb[1]); return j ? send(200, j) : send(404, { error: 'no such job' }); }
        if (p === '/api/jobs' && req.method === 'GET') return send(200, [...jobs.values()].slice(-10));
        if (p === '/api/guide' && req.method === 'GET') return send(200, { topics: fs.readdirSync(path.join(ROOT, 'docs', 'agent-guide')).filter(x => x.endsWith('.md')).sort().map(x => x.replace(/\.md$/, '')) });
        const gd = /^\/api\/guide\/([\w-]+)$/.exec(p);
        if (gd && req.method === 'GET') { const g = path.join(ROOT, 'docs', 'agent-guide', gd[1] + '.md'); return fs.existsSync(g) ? send(200, fs.readFileSync(g), MIME['.md']) : send(404, { error: 'no such topic' }); }
        /* files */
        if (req.method === 'GET' || req.method === 'HEAD') {
          let file = null;
          if (p === '/' || p === '/index.html') file = path.join(ROOT, 'studio', 'index.html');
          else if (p === '/film.html') file = f('build/film.html');
          else if (p === '/download/film.mp4') file = f('build/film.mp4');
          else if (p.startsWith('/voice/')) file = safeJoin(f('voice'), p.slice(7));
          else if (p.startsWith('/assets/')) file = safeJoin(f('assets'), p.slice(8));
          else if (p.startsWith('/review/')) file = safeJoin(f('build/review'), p.slice(8));
          else if (p.startsWith('/gallery/')) file = safeJoin(path.join(ROOT, 'docs', 'gallery'), p.slice(9));
          if (file && fs.existsSync(file) && fs.statSync(file).isFile()) { const ext = path.extname(file).toLowerCase(); res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Length': fs.statSync(file).size }); return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res); }
        }
        return send(404, { error: 'not found' });
      };
      handle().catch(e => send(e.code === 413 || e.code === 400 ? e.code : 500, { error: String(e.message) }));
    } catch (e) { send(500, { error: String(e.message) }); }
  });
  return { server, dir, host, token, listen: (port) => new Promise((r, j) => { server.once('error', j); server.listen(port || 0, host, () => r(server.address().port)); }), close: () => new Promise(r => server.close(r)) };
}
module.exports = { createStudio };
