# 04 Style grammar: choose styles by story function

Run `filmstudio styles` for the live list. Rule: **change style when the idea changes**; keep one style when elaborating.

| Story function | Best styles (style/variant) |
|---|---|
| Opening, wonder, a beginning | atom/spark, atom/universe |
| "How it works", logic, learning | math/sine, math/descent, explainer/neural, cartoon/follow |
| Growth, data, scale | chart/learn, chart/skyline, chart/skyline2 |
| Building, products, progress | iso/city, iso/city2, iso/cubes |
| Human warmth, nature, art | paper/land1, paper/land2, paper/window |
| Energy, music, nostalgia | synth/sun, synth/eq |
| Health, care, friendliness | cartoon/heart |
| Curiosity, a question | cartoon/wonder, math/prompt, atom/wait |
| Tension, waiting | atom/wait, domino/topple |
| Chain reaction, fast energy | domino/cascade, domino/wave |
| Final reveal of the message | domino/title (uses meta.titleLines) |
| A key sentence, statistic or quote | type/words, type/stack, type/focus |
| Steps, lists, definitions, simple maths | board/icons, board/equation |
| Playful rhythm on the beat | type/wave |
| Myth, folk tale, ceremonial or timeless feel | shadow/scene, shadow/gunungan |
| Calm, nature, wisdom, philosophy | ink/mountains, ink/bamboo, ink/calligraphy |
| Games, retro tech, nostalgia | pixel/city, pixel/hero, pixel/text |
| Action, humour, impact words | comic/panels, comic/burst, comic/speed |
| A break, an error, violent cut | glitch/vhs, glitch/rgb, glitch/corrupt |
| A feeling or idea with no literal picture | gen/flow, gen/voronoi, gen/mandala, gen/blobs |
| Dreamlike nostalgia, internet culture | vapor/grid, vapor/windows |
| Bold graphic statement | poster/swiss, poster/bauhaus, memphis/pattern |
| Code, hackers, data | ascii/rain, ascii/text, ascii/plasma |
| Friendly product feel | clay/shapes, clay/text |
| Journeys, craft, transformation | origami/boat, origami/fold, map/route |
| Time and milestones | map/timeline |
| Games, worlds, building | voxel/island, pixel/hero |
| Landscapes, planets | lowpoly/terrain, lowpoly/orb |
| Gentle, poetic depth | multiplane/forest |
| Handmade stop-motion charm over another style | stopmo/boil |
| Calm ending | atom/prompt |
| Night, sleep, moon, stillness | paper/land2, paper/window, ink/mountains, multiplane/forest, shadow/scene (tone cool), gen/flow |
| The user's own picture or logo | image/kenburns, image/pop, image/polaroid, image/cutout, image/logo |

## Pacing rules (`validate` warns on these)
- Do not hold one shot longer than 12 beats, except the last shot and the domino title reveal. Prefer 8 or fewer.
- Do not repeat the same style/variant twice in a row.
- Use about 12 or fewer different styles in one film.
- The montage (bars 13-20) needs at least 6 shots; 8 to 16 is typical.
- Alternate warm (paper, cartoon, clay) and cool (synth, atom, math) shots so adjacent cuts contrast.

## Choosing by mood
Run `filmstudio styles --mood calm` (moods: calm, energetic, playful, serious, warm, nostalgic, mysterious, techy, night, nature, bold, retro, dreamy, friendly, tense). For a calm or night film (sleep, bedtime, meditation) start from: `paper/land2`, `paper/window`, `ink/mountains`, `multiplane/forest`, `gen/flow`, `atom/wait`, `shadow/scene` (cool tone), `origami/boat`, `lowpoly/terrain`, `clay/shapes`, `board/icons`. Pair with `calm-46`. A picture of every variant is in `docs/gallery/` (`docs/gallery/<style>-<variant>.jpg`, indexed in `docs/gallery/README.md`); open the ones you are considering before you choose.

## Characters
Optional. Add a `stage` shot (see `guide characters`) only when the story needs a figure. Never required.

## Not available yet
Genuinely photographic or realistic content, real maps, logos and user images (asset import is planned). If the user asks for one, say so and pick the nearest existing style.
