/* Studio timeline: a multi-track view of spec.json (music, shots, narration, prompts) with drag editing.
   Loaded on demand by index.html. Data comes from GET /api/timeline; every edit is a small operation sent as
   PATCH /api/spec with the rev the page loaded, so it can never overwrite what an agent saved meanwhile.
   DOM is built with createElement and textContent (spec text is never parsed as HTML). */
(function () {
  'use strict';
  var LABW = 86, ZMIN = 4, ZMAX = 140;
  var T = { zoom: null, sel: null, ph: 1, hist: [], data: null, msg: '', bad: false };
  var CUR = null, KEYS = false;

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  var snap = function (x, s) { return Math.round(x / s) * s; };
  var r1 = function (x) { return Math.round(x * 10) / 10; };

  function css() {
    if (document.getElementById('tl-css')) return;
    var s = document.createElement('style'); s.id = 'tl-css';
    s.textContent = [
      '.tl-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}',
      '.tl-tools .btn{padding:4px 10px;font-size:13px}',
      '.tl-read{font:12px var(--mono);color:var(--dim);margin-left:auto;overflow-wrap:anywhere}',
      '.tl-live{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--dim);margin-right:6px}.tl-live.on{background:var(--ok)}',
      '.tl-scroll{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}',
      '.tl-body{position:relative}',
      '.tl-row{display:flex;border-bottom:1px solid var(--line)}.tl-row:last-child{border-bottom:0}',
      '.tl-lab{flex:0 0 ' + LABW + 'px;position:sticky;left:0;z-index:5;background:var(--panel);border-right:1px solid var(--line);font:11px var(--mono);color:var(--dim);padding:6px 8px;text-transform:uppercase;letter-spacing:.1em}',
      '.tl-lane{position:relative;flex:0 0 auto}',
      '.tl-ruler{cursor:text}',
      '.tl-tick{position:absolute;top:0;bottom:0;border-left:1px solid var(--line);font:10px var(--mono);color:var(--dim);padding:2px 0 0 3px;white-space:nowrap;pointer-events:none}',
      '.tl-end{position:absolute;top:0;bottom:0;border-left:2px dashed var(--ember);pointer-events:none}',
      '.tl-blk{position:absolute;border-radius:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font:11px/1.3 var(--mono);color:#fff;padding:3px 6px;border:1px solid rgba(255,255,255,.28);user-select:none;touch-action:none}',
      '.tl-blk.sel{outline:2px solid var(--ice);z-index:3}',
      '.tl-shot{cursor:pointer;background-size:cover;background-position:center;text-shadow:0 1px 3px #000,0 0 2px #000}',
      '.tl-h{position:absolute;top:0;bottom:0;width:12px;margin-left:-6px;cursor:col-resize;z-index:4;touch-action:none}',
      '.tl-h::after{content:"";position:absolute;left:5px;top:22%;bottom:22%;width:2px;background:rgba(255,255,255,.8);border-radius:1px}',
      '.tl-nar{cursor:grab;background:#2a4a6e}.tl-nar.est{border-style:dashed}.tl-nar.noaudio{opacity:.65}',
      '.tl-pr{cursor:grab;background:#5b3b6e}.tl-pr.hide{opacity:.6;font-style:italic}',
      '.tl-mus{background:#1f3b34;color:#bfe;pointer-events:none}',
      '.tl-ph{position:absolute;top:0;bottom:0;width:2px;background:var(--ember);z-index:4;pointer-events:none}',
      '.tl-ph::before{content:"";position:absolute;top:0;left:-4px;border:5px solid transparent;border-top-color:var(--ember)}',
      '.tl-msg{min-height:20px;font-size:13px;margin:8px 0 0}.tl-msg.bad{color:var(--bad)}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function hue(name) { var n = 0; for (var i = 0; i < name.length; i++) n = (n * 31 + name.charCodeAt(i)) % 360; return n; }
  /* greedy lanes so blocks that overlap in time sit on separate rows: returns a row index per item */
  function rows(items, startPx, endPx) {
    var ends = [], out = [];
    items.forEach(function (it, i) {
      var s = startPx(it), r = 0; while (r < ends.length && ends[r] > s) r++;
      ends[r] = endPx(it) + 2; out[i] = r;
    });
    return { row: out, n: Math.max(1, ends.length) };
  }
  function setMsg(t, bad) { T.msg = t || ''; T.bad = !!bad; if (CUR) { var m = CUR.el.querySelector('.tl-msg'); if (m) { m.textContent = T.msg; m.className = 'tl-msg' + (T.bad ? ' bad' : ''); } } }

  /* ---------- reading what is at the playhead ---------- */
  function readout() {
    var d = T.data; if (!d) return '';
    var sh = d.tracks.shots.filter(function (s) { return T.ph >= s.start && T.ph < s.end; })[0];
    return 'bar ' + (Math.round(T.ph * 100) / 100) + ' · ' + r1((T.ph - 1) * d.secPerBar) + ' s of ' + d.seconds + ' s' + (sh ? ' · shot #' + (sh.i + 1) + ' ' + sh.style + '/' + sh.variant : '');
  }
  function movePH(bar) {
    var d = T.data; T.ph = clamp(snap(bar, 0.25), 1, d.bars + 1);
    if (!CUR) return;
    var ph = CUR.el.querySelector('.tl-ph'); if (ph) ph.style.left = (LABW + (T.ph - 1) * T.zoom) + 'px';
    var rd = CUR.el.querySelector('.tl-read'); if (rd) rd.textContent = readout();
  }

  /* ---------- committing edits ---------- */
  /* A request the browser drops before it reaches the server (no HTTP status) is retried once: it is a harmless read. */
  function fetchTimeline(ctx) {
    var get = function () { return ctx.api('GET', '/api/timeline'); };
    return get().catch(function (e) { if (e.status) throw e; return new Promise(function (r) { setTimeout(r, 200); }).then(get); });
  }
  function refresh() {
    if (!CUR) return Promise.resolve();
    return fetchTimeline(CUR.ctx)
      .then(function (d) { T.data = d; if (document.body.contains(CUR.el)) { render(); loadThumbs(); } })
      .catch(function (e) { CUR.el.textContent = 'Timeline unavailable: ' + e.message; });
  }
  function failed(e) {
    var ctx = CUR.ctx;
    if (e.status === 409) { ctx.conflict(e.data); setMsg('The file changed on disk, so nothing was written. See the notice at the top of the page.', true); }
    else setMsg((e.message || 'edit refused') + (e.data && e.data.fix ? ' — ' + e.data.fix : ''), true);
    return refresh(); /* redraw from the file: this also undoes the drag preview */
  }
  function commit(ops, label) {
    var ctx = CUR.ctx; setMsg('saving...');
    return ctx.flush().then(function () {
      var before = JSON.parse(JSON.stringify(ctx.spec()));
      return ctx.api('PATCH', '/api/spec', { rev: ctx.rev(), ops: ops }).then(function (r) {
        T.hist.push({ spec: before, label: label }); if (T.hist.length > 30) T.hist.shift();
        ctx.applied(r.spec, r.rev, r.validation); setMsg(label + ' saved. Undo with Ctrl/Cmd+Z.'); return refresh();
      });
    }).catch(failed);
  }
  function undo() {
    var ctx = CUR.ctx, e = T.hist.pop(); if (!e) return setMsg('Nothing to undo.');
    setMsg('undoing...');
    return ctx.flush().then(function () { return ctx.api('PUT', '/api/spec', e.spec, { 'If-Match': ctx.rev() }); })
      .then(function (r) { ctx.applied(e.spec, r.rev, r.validation); setMsg('Undid: ' + e.label); return refresh(); })
      .catch(function (err) { T.hist.push(e); return failed(err); });
  }
  function splitAtPlayhead() {
    var d = T.data, sh = d.tracks.shots.filter(function (s) { return T.ph > s.start && T.ph < s.end; })[0];
    if (!sh) return setMsg('Put the playhead inside a shot first (click the ruler or a shot). It cannot sit on a cut.', true);
    return commit([{ op: 'shot.split', index: sh.i, bar: T.ph }], 'Split shot #' + (sh.i + 1));
  }
  function deleteSelected() {
    var s = T.sel; if (!s) return setMsg('Click a shot or prompt first.', true);
    if (s.k === 'nar') return setMsg('Narration lines are not deleted here: voice clips are matched to lines by position. Remove the line in the Storyboard tab, then run voice again.', true);
    if (s.k === 'shot') { T.sel = null; return commit([{ op: 'shot.delete', index: s.i }], 'Deleted shot #' + (s.i + 1)); }
    T.sel = null; return commit([{ op: 'prompt.delete', index: s.i }], 'Deleted prompt #' + (s.i + 1));
  }

  /* ---------- dragging ---------- */
  function drag(ev, move, end) {
    if (ev.button) return;
    ev.preventDefault(); ev.stopPropagation();
    var el = ev.currentTarget, x0 = ev.clientX, moved = false, pid = ev.pointerId;
    try { el.setPointerCapture(pid); } catch (e) { /* capture is only a bonus */ }
    /* listen on window, not on the element: the pointer can leave a 12 px handle (or capture may not be honoured), and the drag must still end */
    function mv(e) { if (e.pointerId !== pid) return; var dx = e.clientX - x0; if (Math.abs(dx) > 3) moved = true; if (moved) move(dx); }
    function up(e) { if (e.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); end(e.clientX - x0, moved, e.type === 'pointercancel'); }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  function select(k, i) {
    T.sel = { k: k, i: i };
    CUR.el.querySelectorAll('.tl-blk[data-k]').forEach(function (e) { e.classList.toggle('sel', e.dataset.k === k && +e.dataset.i === i); });
  }

  /* ---------- thumbnails: a hidden copy of the built film is seeked to the middle of each shot and its canvas copied ---------- */
  var THUMBS = {}, TH = { built: null, busy: false, again: false };
  function thumbKey(s) { return (T.data && T.data.built) + '|' + s.start + '-' + s.end + '|' + s.style + '/' + s.variant; }
  function loadThumbs() {
    var d = T.data; if (!d || !d.built) return;
    if (TH.busy) { TH.again = true; return; }
    var todo = d.tracks.shots.filter(function (s) { return !THUMBS[thumbKey(s)]; }); if (!todo.length) return;
    TH.busy = true;
    var fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
    fr.style.cssText = 'position:fixed;left:-2000px;top:0;width:640px;height:360px;border:0;opacity:0;pointer-events:none';
    var done = function () { try { fr.remove(); } catch (e) {} TH.busy = false; if (TH.again) { TH.again = false; loadThumbs(); } };
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    fr.onload = function () {
      var w = fr.contentWindow, tries = 0;
      (function ready() {
        if (!w.__film && tries++ < 50) return setTimeout(ready, 100);
        if (!w.__film) return done();
        try { var st = w.document.createElement('style'); st.textContent = '#intro{display:none!important}'; w.document.head.appendChild(st); } catch (e) {}
        var cv = w.document.getElementById('c'), q = w.document.createElement('canvas'); q.width = 192; q.height = 108;
        var i = 0;
        (function next() {
          if (i >= todo.length || !document.body.contains(CUR.el)) return done();
          var s = todo[i++], beat = (s.start - 1) * 4 + (s.end - s.start) * 4 * 0.55;
          w.__film.seek(beat);
          wait(450).then(function () {
            try { q.getContext('2d').drawImage(cv, 0, 0, 192, 108); THUMBS[thumbKey(s)] = q.toDataURL('image/jpeg', 0.7);
              var el = CUR.el.querySelector('.tl-shot[data-i="' + s.i + '"]'); if (el) el.style.backgroundImage = 'url(' + THUMBS[thumbKey(s)] + ')'; } catch (e) {}
            next();
          });
        })();
      })();
    };
    fr.src = 'film.html' + (location.search || '');  /* relative: the studio may be mounted at /p/<project>/ */
    document.body.appendChild(fr);
  }

  /* ---------- drawing ---------- */
  function render() {
    var d = T.data, Z = T.zoom, tr = d.tracks, W = Math.round(d.bars * Z), el = CUR.el;
    var old = el.querySelector('.tl-scroll'), sl = old ? old.scrollLeft : 0, nShots = tr.shots.length;
    var body = h('div', { class: 'tl-body', style: 'width:' + (LABW + W) + 'px' });
    var lane = function (label, height, cls) { var l = h('div', { class: 'tl-lane ' + (cls || ''), style: 'width:' + W + 'px;height:' + height + 'px' }); body.appendChild(h('div', { class: 'tl-row' }, [h('div', { class: 'tl-lab', text: label }), l])); return l; };
    var x = function (bar) { return (bar - 1) * Z; };

    /* ruler: click or drag to place the playhead */
    var ruler = lane('bar', 30, 'tl-ruler'), step = [1, 2, 4, 5, 10, 20, 40].filter(function (n) { return n * Z >= 58; })[0] || 40;
    for (var b = 1; b <= d.bars; b += step) ruler.appendChild(h('div', { class: 'tl-tick', style: 'left:' + x(b) + 'px', text: b + ' · ' + Math.round((b - 1) * d.secPerBar) + 's' }));
    if (d.endCardBar != null) ruler.appendChild(h('div', { class: 'tl-end', style: 'left:' + x(d.endCardBar) + 'px', title: 'end card starts at bar ' + d.endCardBar }));
    var rulerBar = function (e) { var r = ruler.getBoundingClientRect(); movePH(1 + (e.clientX - r.left) / Z); };
    ruler.addEventListener('pointerdown', function (e) {
      e.preventDefault(); rulerBar(e);
      var pid = e.pointerId, mv = function (m) { if (m.pointerId === pid) rulerBar(m); }, up = function (u) { if (u.pointerId !== pid) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });

    /* music (read-only) */
    var mus = lane('music', 26);
    tr.music.forEach(function (m) { mus.appendChild(h('div', { class: 'tl-blk tl-mus', style: 'top:3px;bottom:3px;left:' + x(m.startBar) + 'px;width:' + ((m.endBar - m.startBar) * Z - 1) + 'px', text: m.name, title: m.name + ' · bars ' + m.startBar + ' to ' + (m.endBar - 1) + ' (follows the score; not editable)' })); });

    /* shots */
    var sl_ = lane('video', 66), shotEls = [], handleEls = [];
    tr.shots.forEach(function (s, i) {
      var el_ = h('div', { class: 'tl-blk tl-shot' + (T.sel && T.sel.k === 'shot' && T.sel.i === i ? ' sel' : ''), 'data-k': 'shot', 'data-i': i, style: 'top:3px;bottom:3px;left:' + x(s.start) + 'px;width:' + ((s.end - s.start) * Z - 1) + 'px;background:hsl(' + hue(s.style) + ',42%,30%)', text: s.style + '/' + s.variant, title: '#' + (i + 1) + ' ' + s.style + '/' + s.variant + ' · bars ' + s.start + ' to ' + s.end + ' · ' + s.beats + ' beats. Click to select, press S to split at the playhead.' });
      el_.addEventListener('pointerdown', function (e) { var r = sl_.getBoundingClientRect(); select('shot', i); movePH(1 + (e.clientX - r.left) / Z); });
      var th = THUMBS[thumbKey(s)]; if (th) { el_.style.backgroundImage = 'url(' + th + ')'; el_.style.backgroundBlendMode = 'normal'; }
      sl_.appendChild(el_); shotEls.push(el_);
    });
    tr.shots.forEach(function (s, i) {
      if (i === nShots - 1) return;
      var a = s, bb = tr.shots[i + 1], lo = a.start + 0.25, hi = bb.end - 0.25, nb = a.end;
      var hd = h('div', { class: 'tl-h', style: 'left:' + x(a.end) + 'px', title: 'Drag to move the cut between shot #' + (i + 1) + ' and #' + (i + 2) });
      hd.addEventListener('pointerdown', function (ev) {
        drag(ev, function (dx) {
          nb = clamp(snap(a.end + dx / Z, 0.25), lo, hi);
          hd.style.left = x(nb) + 'px'; shotEls[i].style.width = ((nb - a.start) * Z - 1) + 'px'; shotEls[i + 1].style.left = x(nb) + 'px'; shotEls[i + 1].style.width = ((bb.end - nb) * Z - 1) + 'px';
          setMsg('cut at bar ' + nb + ' (' + r1((nb - 1) * d.secPerBar) + ' s) · ' + ((nb - a.start) * 4) + ' + ' + ((bb.end - nb) * 4) + ' beats');
        }, function (dx, moved, cancel) { if (!moved || cancel || nb === a.end) { setMsg(''); return render(); } commit([{ op: 'shot.boundary', index: i, bar: nb }], 'Moved the cut after shot #' + (i + 1)); });
      });
      sl_.appendChild(hd); handleEls.push(hd);
    });

    /* narration */
    var nar = tr.narration, nr = rows(nar, function (n) { return x(n.startBar); }, function (n) { return x(n.endBar); });
    var nl = lane('narration', nr.n * 28 + 6);
    nar.forEach(function (n, i) {
      var top = 3 + nr.row[i] * 28, prev = nar[i - 1], next = nar[i + 1], lo = prev ? (prev.startBar - 1) * 4 : 0, hi = next ? (next.startBar - 1) * 4 : d.bars * 4 - 1, orig = (n.startBar - 1) * 4, nb = orig;
      var el_ = h('div', { class: 'tl-blk tl-nar' + (n.durSource === 'estimate' ? ' est' : '') + (n.hasAudio ? '' : ' noaudio') + (T.sel && T.sel.k === 'nar' && T.sel.i === i ? ' sel' : ''), 'data-k': 'nar', 'data-i': i, style: 'top:' + top + 'px;height:24px;left:' + x(n.startBar) + 'px;width:' + Math.max(8, (n.endBar - n.startBar) * Z - 1) + 'px', text: n.text, title: '#' + (i + 1) + ' "' + n.text + '" · ' + n.seconds + ' s (' + n.durSource + (n.hasAudio ? '' : ', no audio yet') + '). Drag to retime within its neighbours.' });
      el_.addEventListener('pointerdown', function (ev) {
        select('nar', i);
        drag(ev, function (dx) { nb = clamp(snap(orig + dx / Z * 4, 1), lo, hi); el_.style.left = (nb / 4 * Z) + 'px'; setMsg('line #' + (i + 1) + ' starts at bar ' + (Math.floor(nb / 4) + 1) + ' beat ' + (nb % 4) + ' (' + r1(nb / 4 * d.secPerBar) + ' s)'); },
          function (dx, moved, cancel) { if (!moved || cancel || nb === orig) { setMsg(''); return render(); } commit([{ op: 'narration.move', index: i, beats: nb }], 'Moved narration #' + (i + 1)); });
      });
      nl.appendChild(el_);
    });

    /* prompts */
    var pr = tr.prompts, pw = function (p) { return Math.max(30, 14 + (p.text || '(hidden)').length * 6.2); }, prr = rows(pr, function (p) { return x(p.bar); }, function (p) { return x(p.bar) + pw(p); });
    var pl = lane('prompts', prr.n * 24 + 6);
    pr.forEach(function (p, i) {
      var orig = (p.bar - 1) * 4, nb = orig;
      var el_ = h('div', { class: 'tl-blk tl-pr' + (p.hide ? ' hide' : '') + (T.sel && T.sel.k === 'pr' && T.sel.i === i ? ' sel' : ''), 'data-k': 'pr', 'data-i': i, style: 'top:' + (3 + prr.row[i] * 24) + 'px;height:20px;left:' + x(p.bar) + 'px;width:' + pw(p) + 'px', text: p.hide ? '(hide)' : p.text, title: 'prompt #' + (i + 1) + (p.big ? ' (big)' : '') + ' at bar ' + p.bar + '. Drag to retime; Delete removes it.' });
      el_.addEventListener('pointerdown', function (ev) {
        select('pr', i);
        drag(ev, function (dx) { nb = clamp(snap(orig + dx / Z * 4, 0.5), 0, d.bars * 4); el_.style.left = (nb / 4 * Z) + 'px'; setMsg('prompt #' + (i + 1) + ' at bar ' + (nb / 4 + 1) + ' (' + r1(nb / 4 * d.secPerBar) + ' s)'); },
          function (dx, moved, cancel) { if (!moved || cancel || nb === orig) { setMsg(''); return render(); } commit([{ op: 'prompt.move', index: i, beats: nb }], 'Moved prompt #' + (i + 1)); });
      });
      pl.appendChild(el_);
    });

    body.appendChild(h('div', { class: 'tl-ph', style: 'left:' + (LABW + (T.ph - 1) * Z) + 'px' }));

    /* toolbar */
    var btn = function (t, f, title) { return h('button', { class: 'btn', type: 'button', text: t, title: title || '', onclick: f }); };
    var zoomTo = function (z) { T.zoom = clamp(z, ZMIN, ZMAX); render(); };
    var tools = h('div', { class: 'tl-tools' }, [
      h('span', { class: 'tl-live' + (CUR.ctx.live() ? ' on' : ''), title: 'live: the timeline follows changes an agent makes to spec.json' }), h('span', { class: 'dim', text: 'live' }),
      btn('−', function () { zoomTo(T.zoom / 1.3); }, 'Zoom out'), btn('+', function () { zoomTo(T.zoom * 1.3); }, 'Zoom in'),
      btn('Fit', function () { zoomTo((el.clientWidth - LABW - 24) / d.bars); }, 'Fit the whole film in view'),
      btn('Split (S)', splitAtPlayhead, 'Cut the shot under the playhead in two'), btn('Delete', deleteSelected, 'Delete the selected shot or prompt'), btn('Undo', undo, 'Undo the last timeline edit (Ctrl/Cmd+Z)'),
      h('span', { class: 'tl-read', text: readout() })
    ]);
    var scroll = h('div', { class: 'tl-scroll' }, [body]);
    el.textContent = ''; el.appendChild(tools); el.appendChild(scroll);
    el.appendChild(h('div', { class: 'tl-msg' + (T.bad ? ' bad' : ''), role: 'status', text: T.msg }));
    el.appendChild(h('p', { class: 'dim', text: 'Drag a cut handle to retime shots, drag narration or prompts to move them. Dashed outlines are estimated lengths (run voice to measure). Edits save straight into spec.json and show in the Storyboard tab.' }));
    scroll.scrollLeft = sl;
  }

  function keys(e) {
    if (!CUR || !document.body.contains(CUR.el) || !T.data) return;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    var k = e.key, mod = e.metaKey || e.ctrlKey;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); }
    else if (!mod && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); deleteSelected(); }
    else if (!mod && (k === 's' || k === 'S')) { e.preventDefault(); splitAtPlayhead(); }
    else if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); movePH(T.ph + (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 0.25)); }
  }

  function mount(el, ctx) {
    css(); CUR = { el: el, ctx: ctx };
    if (!KEYS) { document.addEventListener('keydown', keys); KEYS = true; }
    return fetchTimeline(ctx).then(function (d) {
      T.data = d; T.ph = clamp(T.ph, 1, d.bars + 1);
      if (!T.zoom) T.zoom = clamp((el.clientWidth - LABW - 24) / d.bars, ZMIN, ZMAX) || 18;
      render(); loadThumbs();
    }).catch(function (e) { el.textContent = ''; el.appendChild(h('p', { class: 'dim', text: 'No timeline yet: ' + e.message + (e.data && e.data.error ? '' : '') + ' Fix it in the Storyboard tab (the Check panel says what is wrong).' })); });
  }
  window.FilmTimeline = { mount: mount };
})();
