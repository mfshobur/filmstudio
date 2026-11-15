# 19 Explain a project or codebase as a film

Use this when you are working in some repo ("project A") and the user wants a short video that explains something about it: what it does, how one feature works, an architecture, a release. The film is procedural graphics plus narration, not a screen recording, so you explain **ideas**, not pixels.

## Before you start
- **Keep the film out of the user's source tree.** Create it in the filmstudio workspace folder (the `--root` named in the MCP config or the AGENTS.md snippet; `filmstudio install-skill` prints it). Example: `filmstudio new <workspace>/<repo>-explainer --length 60`. If you do not know the workspace, ask once.
- Ask at most 3 questions, in one message: who is it for (new users, teammates, investors), how long (default 45 to 60 s), where it plays (sets `format`: `16:9`, `9:16`, `1:1`, `4:5`). Default the rest.

## 1. Read just enough of the repo
README, the entry point, the directory layout, and the one flow you are explaining (follow a single request or command end to end). Do not read everything. Write down 3 to 5 facts you can point to in files. **Every claim in the film must come from something you read.** Never invent features, numbers or names.

## 2. One message, 3 to 5 concepts
Write the one sentence the viewer should leave with (this is `treatment.md`'s payoff). Then pick 3 to 5 concepts that build to it: the problem, the idea, the parts, how they connect, the result. About 2 to 4 bars per concept at 128 BPM.

## 3. Map concepts to shots
Change style when the idea changes (see `guide style-grammar`). What works for software:

| You want to show | Use |
|---|---|
| A one-line promise, a number, a key term | `type/words`, `type/stack` (use `font: "mono"` for code-like text) |
| Steps, parts of a system, a checklist (2 to 6 items) | `board/icons` (icons: bulb heart house book rocket chart person tree cloud star gear check) |
| How a thing works at a high level, learning, a pipeline | `explainer/neural`, `math/descent`, `cartoon/follow` |
| Code, a terminal, a command | `ascii/text` with `{"text":"npm test\nok 42 passed"}`, `type/stack` with mono |
| Growth, usage, performance numbers | `chart/learn`, `chart/skyline` |
| A screenshot, diagram or logo the user owns | `image/pop` (see `guide images`; copy the file into `assets/`) |
| History, releases, a roadmap | `map/timeline` |
| A system "building up" | `iso/city`, `iso/cubes` |
| The closing line | `type/words` then `atom/prompt` |

Params for each style: `filmstudio guide params`. `validate` tells you what a shot is missing.

## 4. Write narration for the ear
- 2 to 5 seconds per line, plain words, one idea each. Define a term the first time.
- Do not read code or paths aloud. Say "the config file", not `src/config/loader.ts`. Put the exact text on screen (`type` or `ascii`) while you speak about it.
- Spell hard names how they should sound (`Postgres` is fine, `kubectl` may not be: write "kube control").
- Narration is the same as on-screen text for key phrases, so the viewer reads and hears the same words.

## 5. Build, review, fact-check
Follow the loop in `guide quick-start`: `validate`, `voice`, `voice-check`, `build`, `review` (look at the sheets), `audio-check`. Then hand over `build/film.html` and say plainly: you cannot hear it, and you cannot confirm the technical claims beyond the files you read. **Ask the user, who knows the project, to check the facts and the pronunciation of names**, and report back timecodes for anything to fix. Only run `export` if they want an `.mp4`.

## Honest limits
No real UI recordings, no live code highlighting, no photoreal footage. Screenshots only through the `image` style, and only ones the user owns. If the user wants a screen recording, say this tool does not do that.
