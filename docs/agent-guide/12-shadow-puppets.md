# 12 Shadow puppets (`shadow`)

Black pierced cut-out figures in front of a lamp-lit cloth screen. Inspired by **wayang kulit** (Indonesian leather shadow puppets) and by Lotte Reiniger's silhouette films. The lamp flickers and the cloth has a faint weave.

`[12, 16, "shadow", "scene", { "tone": "warm", "puppets": [ {"kind":"hero","x":-0.35}, {"kind":"demon","x":0.35,"flip":true}, {"kind":"mountain","x":-0.5,"scale":0.9} ], "title": "optional caption" }]`

- variants: `scene` (the puppets you list), `gunungan` (the tree-of-life shape, sways; with no puppets it appears alone, good for openings, closings, scene changes).
- `tone`: `warm` (amber, default), `cool` (moonlit blue), `red` (tension, battle, dusk).
- puppet `kind`: `hero demon clown gunungan bird tree mountain house deer`. Per puppet: `x` (-1..1), `y`, `scale`, `flip`, `move` (`sway` default, `walk`, `bow`), `walkTo` (x to walk to during the shot).
- `title`: a small caption on the base of the screen.

## Use it for
Myth, origin stories, folk tales, "once upon a time", history, anything with a timeless or ceremonial feel. Two figures facing each other reads as a conversation or a confrontation. Pair with a slow, low narration.

## Cultural note
This is a respectful stylisation, not an authentic puppet. If the film leans on the wayang tradition, say so in the film's text (for example in `meta.lede` or the end card) and do not use the figures for jokes at the tradition's expense. The `gunungan` marks the start and end of a wayang performance and changes of scene; use it that way.

## Limits
Figures are simple: no moving mouths, limited arm poses, one profile design per kind. Do not promise named characters (Arjuna, Bima ...).
