# 13 More styles: pixel, glitch, ink, comic, gen

Most of these need no params. Where params are needed, `validate` says so.

## `pixel` : 16-colour pixel art, scaled up with scanlines
`[a, b, "pixel", "city"]`, `"hero"`, or `"text"` with `{ "text": "LEVEL UP\nPRESS START", "color": "#00e436" }`.
- `city`: night skyline, parallax buildings, blinking windows, twinkling stars. `hero`: a pixel runner on scrolling ground. `text`: typed text on a CRT (use `\n` for a second line).
- Use for: games, retro tech, nostalgia, countdowns, "loading" beats.

## `glitch` : a distortion laid over any other style
`[a, b, "glitch", "vhs", { "background": ["synth","sun"], "intensity": 0.7, "text": "SIGNAL LOST" }]`
- variants: `vhs` (tracking bar, PLAY timestamp), `rgb` (colour split that pulses on the beat), `corrupt` (block displacement and colour blocks).
- `background` is any non-glitch `[style, variant]`; `intensity` 0 to 1; `text` optional.
- Use for: a break in the story, an error, tension, a "cut" that should feel violent. Keep it to 1 to 4 beats; long glitch shots tire the eye.

## `ink` : Chinese ink wash on rice paper
`[a, b, "ink", "mountains"]`, `"bamboo"`, or `"calligraphy"` with `{ "text": "still water" }`.
- Misty layered mountains with a drifting haze and a red moon; bamboo that grows stalk by stalk with leaves; brushed text that reveals left to right. A small red seal marks each.
- Use for: calm, nature, wisdom, philosophy, endings. Leave negative space; do not stack other effects on top.
- Cultural note: this borrows the look of shuimo (ink wash) painting and animation. Credit the tradition if the film leans on it. The seal is a decorative mark, not a real name.

## `comic` : halftone comic book
`[a, b, "comic", "panels", { "captions": ["Once...","then...","boom!"] }]`, `"burst"` with `{ "sfx": "WOW!" }`, `"speed"` with `{ "sfx": "ZOOM!" }`.
- Optional `palette: { a, b, paper }` (default pink, teal, cream).
- Use for: action, humour, impact words, "and then everything changed". `panels` pops three panels in on the beat.

## `gen` : generative patterns
`[a, b, "gen", "flow"]`, `"voronoi"`, `"mandala"`, `"blobs"`. Optional `{ "palette": { "bg": "#070a1a", "a": "#ffae5c", "b": "#86e6ff", "c": "#ff4f81" } }`.
- `flow`: streamlines through a moving noise field. `voronoi`: moving cells. `mandala`: rotating radial petals. `blobs`: merging metaballs (lava-lamp).
- Use for: abstract transitions, mood beats, backgrounds for an idea that has no literal picture (thinking, networks, growth, sound).

## Choosing between styles
Need a quote? `type`. A list or steps? `board`. A myth? `shadow`. Calm? `ink`. Retro/games? `pixel`. Energy or humour? `comic`. A break or error? `glitch`. A feeling with no picture? `gen`.
