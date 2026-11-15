#!/usr/bin/env node
'use strict';
// .claude/skills/film-maker is a real copy of skills/film-maker (symlinks break on Windows clones).
// This fails if they differ. Fix: node test/skill-sync.test.js --fix
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'skills', 'film-maker'), DST = path.join(ROOT, '.claude', 'skills', 'film-maker');
const list = d => fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).sort() : [];
const same = () => { const a = list(SRC), b = list(DST); return a.join('\n') === b.join('\n') && a.every(f => fs.readFileSync(path.join(SRC, f)).equals(fs.readFileSync(path.join(DST, f)))); };
if (process.argv.includes('--fix')) { fs.rmSync(DST, { recursive: true, force: true }); fs.cpSync(SRC, DST, { recursive: true }); console.log('synced'); }
if (!same()) { console.log('FAIL .claude/skills/film-maker differs from skills/film-maker (run: node test/skill-sync.test.js --fix)'); process.exit(1); }
console.log('ok   .claude/skills/film-maker matches skills/film-maker');
