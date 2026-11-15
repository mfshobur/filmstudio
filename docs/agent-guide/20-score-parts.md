# 20 Score parts: different music for different parts of the film

The built-in presets (`anthem-46`, `calm-46`) are one continuous piece. When a film has parts with different moods (a tense setup, then a bright turn, then a hard montage, then a big finish), give each part its own music with `spec.score.parts`. A part is a stretch of film bars plus a style, a chord progression and an energy curve. Everything else (the player, `audio-check`, the MP4 export) works unchanged.

```json
"score": { "parts": [
  { "name": "Setup",  "from": 1,  "to": 10, "style": "ambient", "chords": ["Am","Am","F","E"], "energy": [0.6, 1.1] },
  { "name": "Turn",   "from": 11, "to": 22, "style": "pulse",   "chords": ["C","G","Am","F"],  "energy": [0.7, 1] },
  { "name": "Reel",   "from": 23, "to": 38, "style": "drive",   "chords": ["Am","F","C","G"],  "energy": [0.95, 1.1] },
  { "name": "Finish", "from": 39, "to": 48, "style": "anthem",  "chords": ["F","G","Am","C"],  "energy": [0.9, 1.15], "drop": true }
] }
```

## Rules (`validate` checks all of them)
- Parts must **tile the film**: the first starts at bar 1, each starts the bar after the previous one ends, the last ends at `bars`. `from` and `to` are film bars, both inclusive.
- With parts, `bars` can be any whole number from 8 to 200 (the built-in 46-bar lengths do not apply). Seconds = bars x 240 / bpm, as always. One tempo for the whole film.
- `chords`: one chord per bar, the list repeats. Names: a letter A-G, optional `#` or `b`, optional `m`, `7`, `m7`, `maj7`, `dim`, `sus2`, `sus4` (`Am`, `F#m`, `Bb`, `G7`, `Dm7`). `score.transpose` still shifts everything.

## The four styles
| style | character | what plays | measured on a 90 s test film |
|---|---|---|---|
| `ambient` | tense, quiet, curious | drone, soft heartbeat, ticking clock, bowed glass, a distant ping | darkest (centroid about 540 Hz), sparse (1.2 onsets/s), quietest |
| `pulse` | bright, light, hopeful | soft backbeat, bouncing bass, plucked eighths, bell notes | brighter (about 1400 Hz), 3.7 onsets/s |
| `drive` | hard, electronic, fast | four on the floor, offbeat hats, rolling bass and cello, sixteenth arps | brightest (about 2000 Hz), loud |
| `anthem` | open, rising, emotional | huge chords, half-time kick, long bass, strings, a lead melody | full and warm (about 1200 Hz), loudest |

Use a minor key for tension, a major key for hope, and end a film on a major chord that resolves (for example `...,"C"` as the last chord of the last part).

## Shaping a part
- `energy`: one number, or `[start, end]` for a crescendo across the part (0 to 1.5). It scales how loud each voice plays.
- `vol`: overall level of the part (default 1).
- `into`: the build at the end of the part: `riser` (a one-bar rise), `roll` (a snare roll), `none`. Defaults: `riser` for ambient and pulse, `roll` for drive, `none` for anthem.
- `hit`: the impact on the first beat of the part: `none`, `crash`, `boom`, `both`. Defaults: drive `crash`, anthem `boom`.
- `drop: true`: the last beat before this part is silent, then the part lands with its hit. Use it once, for the big moment.
- `cuts`: scales the small whoosh played on each cut (0 to 2). Defaults: ambient 0, pulse 0.5, drive 0.7, anthem 0.
- `flash`: how strongly the picture pulses on the beat (0 to 1). Defaults follow the style.
- `lead: false` removes the anthem's lead melody.

## A good arc
Quietest first, loudest last. Put the idea you want remembered in the loudest part. Change style only where the story changes (a part is a mood, not a decoration). A part of 8 to 16 bars (15 to 30 s at 128 bpm) feels like a section; under 4 bars is a jolt. Plan the cuts so a style change lands on a part boundary: the `hit` and the `into` build are timed to it.

## Check it
`filmstudio audio-check` reports loudness, clipping and dynamics per bar. `filmstudio build` and open the film to hear it, or export. You cannot hear the result: report the measurements and ask the user to listen and send timecodes. The timeline's music track shows the parts by name.
