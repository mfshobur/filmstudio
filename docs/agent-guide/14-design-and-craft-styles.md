# 14 Design, craft and tech styles: vapor, memphis, poster, ascii, clay, origami, lowpoly, voxel, map, multiplane, stopmo

Params are optional unless stated. `validate` tells you what is missing.

| style / variants | params | good for |
|---|---|---|
| `vapor` grid, windows | `text` (grid: spaced caption; windows: the error message) | nostalgia, internet culture, dreamlike |
| `memphis` pattern | `text`, `palette` (array of colours), `bg` | playful, youthful, ads, fashion |
| `poster` swiss, bauhaus | `title`, `sub` (swiss); `title` (bauhaus) | bold statements, design, culture |
| `ascii` rain, text, plasma | `text` (for `text`; use `\n`) | code, data, hackers, retro computing |
| `clay` shapes, text | `text`, `palette`, `bg` | friendly, modern product feel |
| `origami` boat, fold | `text` (fold) | patience, craft, journeys, transformation |
| `lowpoly` terrain, orb | `color` (orb) | landscapes, planets, modern tech |
| `voxel` island | none | games, worlds, building |
| `map` route, timeline | route: `from`, `to`, `distance`; timeline: `events` **required** `[{year,label}]` | travel, logistics, history, progress |
| `multiplane` forest | `palette: {sky, low, layers:[5 colours]}` | gentle, nostalgic, poetic (glass-layer depth) |
| `stopmo` boil | `background` **required** `[style,variant]`, `fps` (default 8), `boil` (jitter amount, default 1) | handmade stop-motion charm over any other style |

## Notes
- `map` is stylised, not geographic: do not use it to show a real route. The timeline is the better tool for a sequence of dates.
- `stopmo` re-draws the chosen background at a low frame rate with a little jitter; it is a look, not a clay animation.
- `poster/swiss` stacks the title one word per line, so keep titles to 2 to 4 short words.
- `ascii/text` writes the text out like a terminal; keep it to 2 or 3 short lines.
- `multiplane` is inspired by Yuri Norstein's glass-layer technique (soft layers moving at different speeds with mist and light shafts); credit the inspiration if the film leans on it.
- `vapor/windows` shows fake OS windows; the text is decoration, not a real interface.

## Choosing between similar styles
Calm nature: `ink`, `multiplane`, `lowpoly/terrain`. Friendly product: `clay`, `cartoon`, `board`. Retro: `pixel`, `vapor`, `ascii`, `synth`. Bold graphic statement: `poster`, `memphis`, `comic`, `type`. Journeys and time: `map`, `origami/boat`, `iso`.
