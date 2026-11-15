/* Studio film player: a video-player style control bar (play/pause, draggable seek bar, time, volume, fullscreen)
   around the built film. The film page (an iframe) only draws frames and plays sound on request, through window.__film:
   drawAt(beat), audioStart(beat), audioStop(), audioBeat(), setVolume(v). */
(function () {
  'use strict';
  var CSSED = false, CUR = null;
  var css = function () {
    if (CSSED) return; CSSED = true;
    var st = document.createElement('style');
    st.textContent = [
      '.fp{max-width:100%;outline:none}',
      '.fp-stage{position:relative;margin:0 auto;background:#000;border-radius:10px 10px 0 0;overflow:hidden;cursor:pointer}',
      '.fp-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none}',
      '.fp-big{position:absolute;left:50%;top:50%;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;background:rgba(6,7,13,.62);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;transition:opacity .2s;pointer-events:none}',
      '.fp.playing .fp-big{opacity:0}',
      '.fp-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;margin:0 auto;background:var(--panel2,#0a0d1b);border:1px solid var(--line,#242a44);border-top:0;border-radius:0 0 10px 10px}',
      '.fp-b{background:none;border:0;color:var(--bone,#f3ead9);font-size:18px;line-height:1;cursor:pointer;padding:6px 8px;border-radius:8px;min-width:34px}',
      '.fp-b:hover,.fp-b:focus-visible{background:rgba(255,255,255,.1)}',
      '.fp-time{font:12px var(--mono,ui-monospace,monospace);white-space:nowrap;opacity:.85;min-width:92px}',
      '.fp-seek{flex:1;min-width:60px;accent-color:var(--ember,#ffae5c);height:18px;cursor:pointer}',
      '.fp-vol{width:70px;accent-color:var(--ember,#ffae5c);cursor:pointer}',
      '@media(max-width:560px){.fp-vol{display:none}}'
    ].join('\n');
    document.head.appendChild(st);
  };
  var fmt = function (t) { t = Math.max(0, t); var m = Math.floor(t / 60); return m + ':' + ('0' + Math.floor(t % 60)).slice(-2); };
  var h = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  };

  function mount(el, opts) {
    css(); if (CUR) CUR.destroy();
    var ratio = opts.ratio || 16 / 9, film = null, total = 0, spb = 0.47, pos = 0, playing = false, timer = null, scrubbing = false, resume = false, vol = 1, muted = false;
    var frame = h('iframe', { title: 'Film', allow: 'autoplay', 'aria-hidden': 'true', tabindex: '-1' });
    var big = h('div', { class: 'fp-big', text: '▶' });
    var stage = h('div', { class: 'fp-stage', style: 'aspect-ratio:' + ratio + ';width:min(100%,calc(72vh * ' + ratio + '))' }, [frame, big]);
    var pb = h('button', { class: 'fp-b', type: 'button', title: 'Play (Space)', 'aria-label': 'Play', text: '▶' });
    var time = h('span', { class: 'fp-time', text: '0:00 / 0:00' });
    var seek = h('input', { class: 'fp-seek', type: 'range', min: 0, max: 1000, value: 0, step: 1, 'aria-label': 'Seek' });
    var mb = h('button', { class: 'fp-b', type: 'button', title: 'Mute (M)', 'aria-label': 'Mute', text: '🔊' });
    var vs = h('input', { class: 'fp-vol', type: 'range', min: 0, max: 100, value: 100, 'aria-label': 'Volume' });
    var fb = h('button', { class: 'fp-b', type: 'button', title: 'Fullscreen (F)', 'aria-label': 'Fullscreen', text: '⛶' });
    var bar = h('div', { class: 'fp-bar', style: 'width:min(100%,calc(72vh * ' + ratio + '))' }, [pb, time, seek, mb, vs, fb]);
    var wrap = h('div', { class: 'fp', tabindex: '0' }, [stage, bar]);
    el.textContent = ''; el.appendChild(wrap);

    var secs = function () { return total * spb; };
    var label = function () { time.textContent = fmt(pos * spb) + ' / ' + fmt(secs()); seek.value = total ? Math.round(pos / total * 1000) : 0; };
    var draw = function () { if (film) { try { film.drawAt(pos); } catch (e) { /* film not ready */ } } label(); };
    var ui = function () { wrap.classList.toggle('playing', playing); pb.textContent = playing ? '⏸' : (pos >= total - 0.01 && total ? '↻' : '▶'); pb.title = playing ? 'Pause (Space)' : 'Play (Space)'; big.textContent = pos >= total - 0.01 && total ? '↻' : '▶'; };
    var stopTimer = function () { if (timer) { clearInterval(timer); timer = null; } };
    function pause() { playing = false; stopTimer(); if (film) { try { film.audioStop(); } catch (e) {} } ui(); }
    function play() {
      if (!film) return;
      if (pos >= total - 0.01) pos = 0;
      Promise.resolve(film.audioStart(pos)).then(function () {
        playing = true; ui(); stopTimer();
        timer = setInterval(function () {
          var b = film.audioBeat();
          if (b === null || b === undefined || b >= total) { pos = total; draw(); pause(); return; }
          pos = Math.max(pos, b); draw();
        }, 40);
      });
    }
    var toggle = function () { playing ? pause() : play(); };
    stage.addEventListener('click', function () { wrap.focus({ preventScroll: true }); toggle(); });
    pb.addEventListener('click', toggle);
    seek.addEventListener('input', function () {
      if (!scrubbing) { scrubbing = true; resume = playing; if (playing) pause(); }
      pos = total * seek.value / 1000; draw();
    });
    seek.addEventListener('change', function () { scrubbing = false; if (resume) { resume = false; play(); } else ui(); });
    var applyVol = function () { if (film) { try { film.setVolume(muted ? 0 : vol); } catch (e) {} } mb.textContent = muted || vol === 0 ? '🔇' : '🔊'; };
    mb.addEventListener('click', function () { muted = !muted; applyVol(); });
    vs.addEventListener('input', function () { vol = vs.value / 100; muted = false; applyVol(); });
    var full = function () { try { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen(); } catch (e) {} };
    fb.addEventListener('click', full);
    stage.addEventListener('dblclick', full);
    wrap.addEventListener('keydown', function (e) {
      var t = e.target && e.target.tagName; if (t === 'INPUT' && e.key !== ' ') { if (e.key.indexOf('Arrow') === 0) return; }
      var k = e.key;
      if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); var was = playing; if (was) pause(); pos = Math.max(0, Math.min(total, pos + (k === 'ArrowLeft' ? -1 : 1) * 5 / spb)); draw(); if (was) play(); else ui(); }
      else if (k === 'm' || k === 'M') { muted = !muted; applyVol(); }
      else if (k === 'f' || k === 'F') full();
      else if (k === 'Home') { var w2 = playing; if (w2) pause(); pos = 0; draw(); if (w2) play(); }
    });

    frame.addEventListener('load', function () {
      var w = frame.contentWindow, tries = 0;
      (function ready() {
        if (!(w.__film && w.__film.drawAt) && tries++ < 80) return setTimeout(ready, 100);
        if (!(w.__film && w.__film.drawAt)) { time.textContent = 'Rebuild the film to enable the player'; return; }
        try { var st = w.document.createElement('style'); st.textContent = '#intro,#bMusic,#bVoice,#tc{display:none!important}'; w.document.head.appendChild(st); } catch (e) {}
        film = w.__film; total = film.bars * 4; spb = film.spb; applyVol(); draw(); ui();
      })();
    });
    frame.src = opts.src;
    CUR = { destroy: function () { pause(); stopTimer(); CUR = null; } };
    return CUR;
  }
  window.FilmPlayer = { mount: mount };
})();
