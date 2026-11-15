# 23 Puppet rigs: characters that move

A **rig** is a character or prop made of parts that rotate about joints, defined once in `rigs/<name>.js` and posed from any scene. Use a rig when something has limbs, or when the same figure appears in several scenes. (For a single shape that just moves, draw it directly with `c.at`.)

```
filmstudio rig new heron            # rigs/heron.js with a working starter
```
In a scene: `c.rig('heron').pose({ neck: 12, wing: -35 }).draw(x, y, scale, flip)`. Angles are degrees, positive is clockwise. `flip: true` mirrors the whole puppet (turning a puppet around is a flip, which is exactly how shadow puppets turn).

## The format
```js
rig('heron', {
  origin: [0, 0],                         // the point in rest-pose coordinates that draw(x, y) puts at x, y (here: the feet)
  fill: '@ink',                           // default colour of parts ('@role' follows the look); parts can override
  parts: [
    { id: 'body',  d: 'M-30 -60 C -30 -120 30 -120 40 -70 L 30 0 L -10 0 Z' },
    { id: 'neck',  parent: 'body', pivot: [30, -90], d: 'M26 -92 C 40 -150 50 -170 60 -176 L 66 -168 C 56 -150 50 -120 40 -90 Z' },
    { id: 'head',  parent: 'neck', pivot: [62, -172], d: 'M58 -180 L 130 -172 L 60 -164 Z' },
    { id: 'wing',  parent: 'body', pivot: [0, -90], behind: true, d: 'M-5 -100 C -60 -90 -90 -40 -70 -10 C -40 -40 -10 -60 5 -80 Z',
      holes: [kit.holes.diamonds(-60, -70, 40, 40, 3, 3)] },
  ],
  pose: { neck: 0, wing: 0 },             // the default pose
});
```
- **Rest pose coordinates.** Draw every part where it sits in the neutral pose, in one shared coordinate system (units are free: scale with the `scale` argument of `draw`). `pivot` is the joint, in the same coordinates. Rotating a part rotates it about its pivot.
- **Hierarchy.** A part with `parent` follows its parent's rotation (and its parent's parent). The head turns with the neck.
- **Order.** Parts draw in list order; a child draws right after its parent. `behind: true` draws a child *before* its parent, for the far arm or the back wing.
- **Pose values.** `pose({ neck: 12 })` is a rotation. `pose({ neck: { r: 12, x: 0, y: 3, s: 1.05 } })` adds an offset and scale for squash, stretch or a breathing chest.
- **Holes (perforations).** `holes: [path text, ...]` are cut out of the part (even-odd fill), so what is behind shows through. Generators: `kit.holes.dots(x, y, w, h, r, gap)`, `diamonds`, `slits(x, y, w, h, slitW, gap)`, `scallops(x, y, w, r, rows)`, `circle(x, y, r)`, `diamond(x, y, r)`. Holes are inside the rig file as `kit.holes...`, in scenes as `c.holes...`.
- **Custom drawing.** A part may have `draw(g, c)` instead of or as well as `d`: draw an eye that blinks, a mouth that opens with `c.talk()`. It runs inside the part's transform.
- **Part style.** `fill`, `stroke`, `lw`, `alpha` per part.

## Designing a character that reads
1. **Silhouette first.** At small size the outline must say what it is. Exaggerate the telling feature (a neck, a tail, ears).
2. **Few parts.** Body, head, one or two limbs per side, a tail or accessory. Each part is one SVG path (`M L C Q Z`). Eight parts is plenty.
3. **Pick joints where the body bends** (shoulder, hip, neck base, wrist) and put the pivot exactly there; a wrong pivot makes limbs slide off the body.
4. **Test the extremes**: preview with the largest angles you will use (`scene preview` with a scene that sweeps them) and fix any gap at a joint by overlapping the parts.
5. **Look follows the palette.** Use `'@ink'`, `'@main'`, `'@accent'` so the same rig works in every look. Outlines: give parts a `stroke: '@ink'` in looks that have outlines (cartoon, comic), omit it for silhouettes (wayang).
6. **Life.** Idle motion even when nothing happens: a breathing offset, a slow sway, a blink on `c.noise` time.

## Wayang kulit (shadow puppets)
The `wayang` look gives you the screen, the lamp and the dark floor; the puppets are yours.
- Pure black silhouettes (the look's `@ink`), in **profile**, with the ornament made of **perforations** rather than painted detail: use `diamonds`/`dots` on the body, `scallops` on a crown or hem, `slits` for hair or a cloak.
- The arms are separate parts on shoulder pivots; real puppets move the arms with thin rods, so the arm angles are the main acting. Keep the body mostly rigid.
- Turn a puppet around with `flip`, never by squashing. Moves are slide and tilt, no squash and stretch.
- Light and shadow: the lamp is above and slightly off-centre; a soft darker shadow is not needed (the screen is the shadow). A tree of life (gunungan, a leaf-shaped screen-opener) starts and ends scenes.
- Characters in a story are different silhouettes: change the body proportions, crown, and perforation pattern per character.

## Sharing
`filmstudio library save rig heron` stores the rig (and any assets it names) in `~/.filmstudio/library`; `filmstudio library use rig heron` copies it into another film's `rigs/`.
