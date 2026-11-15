# 21 Scenes: draw each beat of the script yourself

**This is the main way to make a film.** A film is a script, and every beat of the script should be shown by a picture drawn for that beat: if the narration says a rabbit crosses a bridge, the viewer sees a rabbit crossing a bridge. You draw it, as code, in a **scene**. The built-in styles (`filmstudio styles`) are ready-made pictures you may use as they are for abstract moments (a galaxy, a city of bars), but they know nothing about your story. **Looks** (`guide looks`) are the style guides those styles came from: a palette, a background, effects and a feel. A scene uses a look so your drawings share one visual world, e.g. wayang, ink, paper cut-out, clay, pixel.

```
filmstudio scene new rabbit-bridge --look wayang   # scenes/rabbit-bridge.js, a working starter
filmstudio scene preview rabbit-bridge             # renders a strip of frames: LOOK AT IT
filmstudio scene check rabbit-bridge               # errors, blank/frozen scenes, determinism, speed
```
In `spec.json` a scene is a shot: `[startBar, endBar, "scene", "rabbit-bridge", { "look": "ink" }]` (the params are optional; `look` overrides the scene's look for this shot). The studio's **Scenes** tab previews every scene live while you edit.

## The workflow, per scene
1. **Read the line and ask what the eye should get that the words do not already give.** Draw the subject literally. Then the one motion that carries the idea (a thing arriving, a line drawing, a light turning on).
2. **Pick the world.** One look per part of the film (`filmstudio look list`, `look show <name>`). Switch look only when the story changes.
3. **Compose first, animate second.** One clear subject with a readable silhouette, a foreground, a middle and a back layer. Keep the bottom 22% of the frame free of important detail: captions go there.
4. **Write `draw(c)`**, preview, fix, preview again. Check the strip for: is the subject recognisable at a glance? is anything cropped? does it move? is the text readable?
5. **Run `scene check`** before you move on. It cannot judge beauty; you judge that from the preview image.
6. **Reuse.** Characters and props that appear in several scenes go in `rigs/` (puppets, `guide puppet-rigs`); helper code shared between scenes goes in `libs/`; things you want in other films go to the library (`filmstudio library save scene <name>`).

## What a scene file is
```js
// scenes/lantern.js
scene({
  look: 'wayang',                  // palette, background and effects (a look name). bg: false paints your own background.
  setup(c) {                       // optional, runs once: precompute things that never change. Not for animation.
    c.state = { stars: Array.from({ length: 30 }, (_, i) => c.rand(i)()) };
  },
  draw(c) {                        // runs every frame. It MUST be a pure function of c.t.
    const sway = Math.sin(c.t * 1.6) * 6;                                   // degrees
    const arrive = c.ease.out(c.map(c.t, 0, 0.8, 0, 1));                    // 0 -> 1 in 0.8 s
    c.at(c.cx, c.H * 0.1 * arrive, { rot: sway }, () => {                   // a transform scope: move, rotate, scale
      c.line(0, 0, 0, c.H * 0.2, { stroke: '@ink', lw: c.u * 0.4 });        // '@ink' = the look's ink colour
      c.glow(0, c.H * 0.24, c.u * 22, '@gold', 0.9);
      c.ellipse(0, c.H * 0.24, c.u * 4, c.u * 6, { fill: '@gold', stroke: '@ink', lw: c.u * 0.4 });
    });
    c.text(c.type('a lantern in the dark', 0.4, 14), c.cx, c.H * 0.82, c.u * 4.5, '@ink', 'center', 'serif');
  },
});
```
The file runs as a function body with `scene`, `rig`, `look`, `kit` and `c` in scope. **Rules (the linter and `scene check` enforce them):** draw only through `c`; no `Math.random` (use `c.rand(seed)`), no `Date`/`performance.now` (use `c.t`), no network, DOM, timers, `eval` or imports. Why: preview, scrubbing, the timeline and the MP4 export must draw exactly the same frame for the same time, and a film must be safe to open.

## Time, sync and size (read these first)
- `c.t` seconds into the shot; `c.tb` beats into the shot; `c.p` progress 0..1; `c.dur` shot length in beats; `c.durSec` in seconds. One beat is 60/bpm seconds (0.47 s at 128 bpm). Design the motion for the real length of the shot.
- `c.beat` the film's beat; `c.bar` the film's bar; `c.pulse` jumps to 1 on every beat and decays to 0: use it for a bounce, a glow, a flash on the beat.
- `c.speaking` is true while a narration line plays; `c.voiceLine` is its index (or -1); `c.talk(rate)` gives a 0..1 mouth-opening wave while speaking. Use them for lip movement and emphasis.
- `c.W`, `c.H` canvas size in pixels (the film can be 16:9, 9:16, 1:1, 4:5: never hard-code a size); `c.cx`, `c.cy` the centre; `c.u` is 1% of the height; `c.vw` is 1% of the width. Origin is the top-left, y grows downward. For a fixed drawing area use `c.fit(1600, 900, (vw, vh, s) => { ... })` (it letterboxes) or `'cover'` as the 4th argument.
- `c.params` the shot's params; `c.look`, `c.pal` the look and its colours; `c.name` the scene name.

## The drawing kit (everything is on `c`)
Colours anywhere a colour is expected: any CSS colour, a gradient, or `'@role'` for the look's palette (`'@main'`, `'@ink'`, `'@accent'`, `'@soft'`, `'@gold'`...; `filmstudio look show <name>` lists the roles), so a scene recolours itself when the look changes. Every look defines the core roles `bg`, `bg2`, `ink`, `main`, `accent`, `soft`: use those when the scene must work in any look. A role the look does not define (`'@red'` in a look without red) is a draw error that names it, not a silent wrong colour. Style options: `{ fill, stroke, lw, alpha, blend, dash, rule, shadow: [color, blur, dx, dy] }`.

| need | call |
|---|---|
| fill the frame | `c.clear(colorOrGradient)` |
| shapes | `c.circle(x, y, r, o)`, `c.ellipse(x, y, rx, ry, o, rotDeg)`, `c.rect(x, y, w, h, o)`, `c.rrect(x, y, w, h, radius, o)`, `c.poly([[x, y], ...], o)`, `c.line(x1, y1, x2, y2, o)`, `c.curve([[x, y], ...], o)` (smooth) |
| SVG path text | `c.path('M 0 0 C ...')` returns a cached `Path2D`; `c.paint(path, o)` fills/strokes it; `c.fill(color, o)` fills the current path |
| draw a path on, stroke by stroke | `c.trace('M..', 0..1, { stroke, lw })`; `c.pathLen(d)` is its length |
| gradients, glow | `c.grad(x1, y1, x2, y2, [[0, c1], [1, c2]])`, `c.radial(x, y, r0, r1, stops)`, `c.glow(x, y, r, color, alpha)` (additive light) |
| text | `c.text(str, x, y, size, color, align, 'serif'\|'sans'\|'mono', weight)`, `c.type(str, startSec, charsPerSec)` (typewriter substring), `c.measure(str, size, font)` |
| transforms | `c.at(x, y, { rot, s, sx, sy, flip, alpha }, () => { ... })`, `c.save()`, `c.restore()`, `c.fit(vw, vh, fn, mode)`, `c.clip(x, y, w, h, fn, radius)` |
| camera and depth | `c.camera(x, y, zoom, rotDeg)` then `c.layer(depth, () => { ... })` (depth 0 = fixed, 1 = moves with the camera, between = parallax) |
| other looks inside a rectangle | `c.panel(x, y, w, h, 'ink', (p) => { ... })` paints that look's background in the rectangle and draws in its own coordinates (a film strip whose frames are in different looks) |
| puppets | `c.rig('name', opts).pose({ arm: 20 }).draw(x, y, scale, flip)` (`guide puppet-rigs`) |
| images | `c.image('assets/x.svg', x, y, w, h, { center: true, alpha })`, `c.asset('assets/x.svg')`: files you put in the project; mention them as plain string literals so the build embeds them |
| shared code | `c.lib('ui').timeline(c, x, y, w, h)` from `libs/ui.js` (`filmstudio lib new ui`) |
| animation maths | `c.ease.linear\|in\|out\|io\|sine\|expo\|quad\|back\|elastic\|bounce\|steps`, `c.lerp(a, b, t)`, `c.clamp(v, a, b)`, `c.map(v, a, b, x, y, easeName)`, `c.smooth(a, b, v)`, `c.tween(t, [[0, 0], [1, 10, 'out'], [2, 0]])` (keyframes; the ease on a key shapes the segment ending at it) |
| noise and chance | `c.noise(x, y, z)` 0..1 smooth, `c.hash(a, b, c)`, `c.rand(seed)` returns a seeded generator, `c.each(n, seed, (i, rnd) => { ... })` (stateless particles: positions are functions of time and `i`), `c.wob(x, y, amp, speed, seed)` (a hand-drawn wobble offset) |
| perforations | `c.holes.dots/diamonds/slits/scallops/circle/diamond` return SVG path text to cut holes (fill with rule `'evenodd'`) |
| raw canvas | `c.g` is the 2D context; any Canvas2D call works |

## Motion that looks designed
- Everything arrives with an ease (`c.ease.out`, `back`, `elastic`), holds, and ideally leaves. Linear motion looks mechanical except for constant spin and travel.
- Stagger: item `i` starts at `t0 + i * 0.12`. Never animate everything at once.
- One primary motion per scene, two or three small secondary ones (a swaying lantern, drifting dust, a blinking eye). Idle life: breathing, bobbing, `c.noise`-driven drift.
- Time budget: a 4-beat shot at 128 bpm is under 2 seconds. Arrive in 0.3-0.6 s, hold the readable state for at least 1 s.
- Beat sync: multiply a size, glow or offset by `c.pulse`. Sync to speech with `c.speaking`/`c.talk`.

## Hard cases
- **Many objects:** precompute their positions in `setup(c)` with `c.rand(seed)`, draw them in a loop; cache `c.path(d)`; keep a frame under about 16 ms (`scene check` measures it).
- **Reveal by drawing:** `c.trace`. **Text appearing:** `c.type`. **Counting up:** `Math.floor(c.ease.out(c.p) * N)`.
- **A character with limbs:** a rig, not ad hoc code (`guide puppet-rigs`).
- **A different look inside a scene:** `c.panel`. **The same scene in another look:** change `look` in the shot params and use `'@role'` colours.
- **A film in several aspect ratios:** compute from `c.W`/`c.H`, or `c.fit` a fixed drawing.

## Keep the picture clean (the finish)
A film made of scenes you draw gets a **clean finish** by default: crisp text, almost no grain (2%), no bloom or light streaks, a barely-there vignette (looks' vignettes scaled to 20%) and plain hard cuts. Films made of built-in styles keep the older **cinematic** finish (moving grain, strong glow, light streaks, a zoom punch, glitch slices and a white flash at every cut). Tune either in `spec.json`:
```json
"finish": { "preset": "clean", "grain": 1, "bloom": 1, "streak": 1, "vignette": 1, "cuts": 1 }
```
`preset` is `"clean"` or `"cinematic"`; the numbers (0 to 2) multiply the preset and 0 turns a layer off (`"vignette": 0` removes it, `"cuts": 1` brings the cut effects back). **Do not stack your own vignette, grain, blur or glow on top**: a scene that draws a vignette, a heavy text shadow or a glowing halo around every label makes the film murky. Keep small text sharp (shadow blur of a pixel or two at most), keep the important content bright against its background, and check `review`: if you see haze, dark corners or soft text, fix it before exporting.

## Looking at your work
`filmstudio scene preview <name> [--beats 8] [--frames 0.5,2,4,7] [--size 960x540] [--look ink]` writes frames and `build/scenes/<name>/strip.png`. **Open the strip and look.** Through MCP, `filmstudio_scene_preview` returns the image. Then `filmstudio scene check <name>`. In a full film, `filmstudio review` shows every shot, and the studio's Scenes tab plays a scene live.

## Honest limits
Scenes are 2D canvas drawing, drawn by code: vector shapes, paths, gradients, glow, text, images you supply, rigs. There is no 3D, no photoreal rendering, no video input. Complex organic art (a convincing fur coat) is out of reach; stylised, graphic drawing is where this shines. Say so if the user asks for photorealism. You cannot hear audio: report measurements and ask the user to listen.
