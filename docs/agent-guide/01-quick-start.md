# 01 Quick start (read this first)

You are an AI agent using `filmstudio` to make a short generated film (procedural 2D/3D graphics, a generated score, spoken narration). Everything lives in one **project folder**. Every command prints JSON.

## The 10 steps
1. **Understand the idea.** If the user gave one sentence, that is enough. Ask at most 3 questions (see `guide interview`). Never ask about things you can default.
2. **Create the project:** `filmstudio new my-film` gives a valid starter `spec.json` (shots, no narration) to edit; `--example the-only-limit` copies a finished film.
3. **Write `brief.json`** from what the user said (title, idea, audience, length, tone, avoid, styles, voice).
4. **Write `treatment.md`:** 5 to 10 lines: hook, build, turn, payoff, last image. Pick the message first.
5. **Write the storyboard into `spec.json`** (see `guide storyboard`): shots, narration lines with start times, prompts. Use the style grammar to choose styles.
6. **Validate:** `filmstudio validate`. Fix every error; each has a `fix` hint. Warnings are advice.
7. **Voice:** `filmstudio voice` (default provider kokoro), then `filmstudio voice-check` (fix any flagged clip), then `validate` again, because real clip lengths can overlap.
8. **Build and review:** `filmstudio build`, then `filmstudio review` and LOOK at `build/review/sheet*.png` (see `guide review`). Fix what looks wrong and rebuild.
9. **Check the music:** `filmstudio audio-check`. Fix flags (clipping, flat dynamics).
10. **Deliver:** the finished film is `build/film.html` (self-contained; open in any browser). If the user needs a video file, run `filmstudio export` (see `guide export`). Tell the user what you made, what you could not check (you cannot hear audio), and ask for notes.

## Rules you must follow
- Run `filmstudio doctor` first if anything fails to start.
- You cannot hear. Say so. Use `audio-check` numbers and the user's ears.
- Ask before: paid API calls, downloading models, exposing a server to a network, deleting files.
- Never print or store API keys in project files. Keys come from environment variables.
- Jobs may be killed on small devices. Every long command is resumable: just run it again.
- Keep all work inside the project folder.

## Time and size guide
Length: **seconds = bars x 240 / bpm**. Default 46 bars at bpm 128 = 86 s. Quickest: `filmstudio new my-film --length 60 --format 9:16 [--preset calm-46]` sets bars, bpm, format and squeezes the placeholder shots to fit. Or run `filmstudio length 60` and set the `bars` and `bpm` it suggests (bars: 46, or even 40 to 78; see `guide storyboard`). Ask where it will play: set `format` (`16:9` default, `9:16`, `1:1`, `4:5`) if it is not wide. Pick `score.preset` `anthem-46` (energetic) or `calm-46` (gentle). The starter shots are a generic placeholder montage: replace them with styles that fit the topic (`styles --mood <tone>`, `guide style-grammar`). `new` does not create `treatment.md`; write it yourself. Narration lines should be 2 to 5 seconds (seconds per bar = 240 / bpm); cuts every 2 to 8 beats.

## What this tool cannot do (tell the user honestly)
It makes procedural 2D/3D animation, not photoreal footage or real people. The user's own pictures and logos can be shown with the `image` style (see `guide images`).
