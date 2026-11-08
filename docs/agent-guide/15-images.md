# 15 Your own pictures and logos (`image`)

Show an image the user gave you. It is embedded in `film.html`, so the film stays one file.

1. Copy the file into the project, e.g. `my-film/assets/logo.png` (png, jpg, webp, gif or svg; under 8 MB, ideally about 1600 px wide).
2. Add a shot: `[9, 11, "image", "pop", { "src": "assets/logo.png", "caption": "Our product" }]`

params: `src` (required, relative to spec.json), `caption` (optional lower-third text), `bg` (`"#0c1024"` or a `[style, variant]` to show behind it), `pan` (kenburns only: `left`, `right`, `up`, `down`).

| variant | look | good for |
|---|---|---|
| `kenburns` | full screen, slow zoom and pan, vignette | photos, scenery, a person, a place |
| `pop` | bounces in with a soft shadow, rounded corners | a product, a screenshot, a diagram |
| `polaroid` | tilted instant photo, caption written on the frame, warm paper bg | memories, travel, people |
| `cutout` | paper cut-out with a white border and shadow | collage, handmade look |
| `logo` | clean centred logo that pulses with the beat | the brand sign-off |

Tips: put a logo on a plain background (`"bg":"#ffffff"` or a dark colour); use `kenburns` for real photographs; keep an image on screen at least 4 beats. If the file is missing or the wrong type, `validate` says so. Only use pictures the user owns or has the right to use.
