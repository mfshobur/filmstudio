# AGENTS.md: how to use filmstudio (read me first)

`filmstudio` makes short generated films (procedural 2D/3D animation, a generated score at 128 BPM, spoken narration) from a project folder. You drive it with shell commands that print JSON, and with files you write.

**Start here:** `filmstudio guide quick-start` (or read `docs/agent-guide/01-quick-start.md`). Load everything with `filmstudio guide all`.

## Essential loop
```
filmstudio new my-film            # or: --example the-only-limit
# write brief.json, treatment.md, spec.json   (guide: interview, storyboard, style-grammar)
filmstudio validate               # fix every error using its "fix" hint
filmstudio voice                  # narration (kokoro), resumable
filmstudio voice-check            # measure the clips: clipping, glitches, pace, flat delivery
filmstudio build                  # -> build/film.html (self-contained)
filmstudio review                 # look at build/review/sheet*.png
filmstudio audio-check            # loudness, clipping, dynamics
```
## Length and music (decide this early)
Scores are 46 bars: **seconds = 11040 / bpm** (bpm 128 = 86 s, 184 = 60 s, 100 = 110 s). Change `bpm`, never `bars`. Presets: `anthem-46` (energetic) and `calm-46` (no hard drums). Details: `filmstudio guide storyboard`.

## Rules
- You cannot hear audio or judge taste: say so, use measurements, ask the user to listen and report timecodes.
- Ask before paid APIs, model downloads, exposing a server, deleting files. Never write secrets into files.
- Ask the user at most 3 questions, in one message; default the rest.
- Honest limits: procedural graphics only, not photoreal footage, no real maps, no user images yet. See `filmstudio styles` for the 28 styles and `guide style-grammar` for when to use each.
- If anything fails to start: `filmstudio doctor`.

## Where things are
`bin/filmstudio.js` CLI, `src/` commands, `engine/` browser engine and score, `examples/the-only-limit/` a finished project, `docs/agent-guide/` the guide, `skills/film-maker/` the Claude Code skill.
