---
name: film-maker
description: Make a short film from an idea: you write the script and draw a custom scene for every beat of it (code, in a chosen visual style such as wayang, ink, paper cut-out, clay), with generated music and narration. Use when the user wants to create a video, short film, explainer, animation, trailer or motion-graphics piece, including a video that explains their own project or codebase. Drives the filmstudio command-line toolkit.
---

# film-maker

This skill drives **filmstudio**. The full instructions live in the repo's agent guide so they never go stale.

1. Find filmstudio. Try, in order: `filmstudio` on PATH; the folder named in the file `CLONE_PATH` next to this SKILL.md (written by `filmstudio install-skill`), run as `node <that folder>/bin/filmstudio.js <command>`; otherwise ask the user where their clone of https://github.com/mfshobur/filmstudio is. If it is not installed, tell the user to clone it and run `node bin/filmstudio.js doctor`, then `node bin/filmstudio.js install-skill`.
2. Read the guide: run `filmstudio guide quick-start`, then `filmstudio guide scenes` (or `guide all`). Follow it exactly. **You draw the scenes yourself**, one per beat of the script, in a look (style guide) that fits the story; the built-in styles are not a menu to pick pictures from. Look at your own previews (`filmstudio scene preview <name>`) and fix what you see. To explain the project you are working in as a video, read `guide explain-a-codebase`.
3. Keep film projects out of the user's source repo: create them in the filmstudio workspace folder (the `--root` the user's MCP or AGENTS.md names, else ask).
4. On an Android phone (Termux), browser and voice tools run inside a proot Ubuntu: use `<clone>/tools/fs-proot.sh <project-dir> <command...>`.
5. You cannot hear audio. Report measurements and ask the user to listen.
6. Ask at most 3 questions, in one message. Ask before paid APIs, model downloads or exposing a server.
