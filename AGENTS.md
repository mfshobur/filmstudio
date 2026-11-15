# AGENTS.md: how to use filmstudio (read me first)

`filmstudio` makes short films (animation drawn by code, a generated score, spoken narration) from a project folder. You drive it with shell commands that print JSON, and with files you write.

## The idea you must hold: you draw the scenes
A film here is a script, and **every beat of the script is shown by a scene you draw for it**, as code, in `scenes/<name>.js`. If the narration is about a rabbit crossing a bridge, the viewer sees a rabbit crossing a bridge: you draw the rabbit and the bridge. You do not choose pictures from a menu.
- **Scenes** (`filmstudio guide scenes`): your drawing code, one per beat. This is the main way to make a film.
- **Looks** (`filmstudio guide looks`): style guides (palette, background, effects, feel) such as wayang, ink, paper cut-out, clay, pixel. A scene uses a look so everything you draw shares one visual world. Pick the look from the story, not from a list of nice pictures.
- **Puppet rigs** (`filmstudio guide puppet-rigs`): characters made of jointed parts, reused across scenes.
- **Built-in styles** (`filmstudio styles`) are ready-made abstract pictures (a galaxy, a city of bars, a terminal). They know nothing about your story. Use one only where an abstract visual is genuinely right for the beat. Tiling built-in styles across a film is not making a film for the script.

**Start here:** `filmstudio guide quick-start`, then `filmstudio guide scenes`. Load everything with `filmstudio guide all`.

## Essential loop
```
filmstudio new my-film                 # keep films in your workspace folder, not in the user's source repo
# write brief.json, treatment.md, then the SCRIPT (narration lines with timing) in spec.json   (guide: interview, storyboard)
filmstudio scene new beat-name --look wayang    # for each beat: a scene file you draw
filmstudio scene preview beat-name     # look at build/scenes/beat-name/strip.png, then fix and repeat
filmstudio scene check beat-name       # errors, blank or frozen scenes, determinism, speed
# in spec.json each beat is a shot: [startBar, endBar, "scene", "beat-name", { }]
filmstudio validate                    # fix every error using its "fix" hint
filmstudio voice                       # narration (kokoro), resumable
filmstudio voice-check                 # measure the clips: clipping, glitches, pace, flat delivery
filmstudio build                       # -> build/film.html (self-contained)
filmstudio review                      # look at build/review/sheet*.png: does every shot show what its line says?
filmstudio audio-check                 # loudness, clipping, dynamics
filmstudio export                      # optional: render build/film.mp4 (slow on small devices, resumable; test with --from-bar 1 --to-bar 3 first)
```
The user may keep the studio open (`filmstudio`, or `filmstudio serve --root <workspace>` for another folder): its Scenes tab previews your scenes live as you edit them. Reuse what you make: `filmstudio library save scene|rig|look|lib <name>`.

## Length and music (decide this early)
Length: **seconds = bars x 240 / bpm**. Run `filmstudio length <seconds> [--preset calm-46]` and put the `bars` and `bpm` it suggests into spec.json. Music: the two built-in presets, or **a different piece of music for each part of the film** with `score.parts` (`filmstudio guide score-parts`). Details: `filmstudio guide storyboard`.

## Rules
- You cannot hear audio or judge taste: say so, use measurements, ask the user to listen and report timecodes. You can look at images (`scene preview`, `review`): do, and fix what you see.
- Ask before paid APIs, model downloads, exposing a server, deleting files. Never write secrets into files.
- Ask the user at most 3 questions, in one message; default the rest.
- Honest limits: 2D drawing by code, not photoreal footage, no 3D, no screen recordings, complex organic art is out of reach (your own pictures and logos work through the `image` style or `c.image`). Say so when it matters.
- If anything fails to start: `filmstudio doctor`.

Read `feedback.json` for the user's notes (`filmstudio guide studio`). Prefer native tools? `filmstudio mcp` exposes the same commands over MCP, including scene tools (see `filmstudio guide harnesses`).

## Where things are
`bin/filmstudio.js` CLI, `src/` commands, `engine/` browser engine, drawing kit (`pscene.js`), looks (`plooks.js`) and score, `examples/the-only-limit/` a finished project, `docs/agent-guide/` the guide, `skills/film-maker/` the Claude Code skill.
