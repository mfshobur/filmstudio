---
name: film-maker
description: Make a short generated film (animated 2D/3D visuals, generated music, narration) from an idea. Use when the user wants to create a video, short film, explainer, animation, trailer or motion-graphics piece. Drives the filmstudio command-line toolkit.
---

# film-maker

This skill drives **filmstudio**. The full instructions live in the repo's agent guide so they never go stale.

1. Find filmstudio: a clone of https://github.com/mfshobur/filmstudio. Look for `filmstudio` on PATH, then `~/filmstudio`, then ask the user where it is. Run it as `node <clone>/bin/filmstudio.js <command>`. If it is not installed, tell the user to clone the repo and run `node bin/filmstudio.js doctor`.
2. Read the guide: run `filmstudio guide all` (or `guide quick-start` first). Follow it exactly.
3. On an Android phone (Termux), browser and voice tools run inside a proot Ubuntu: use `<clone>/tools/fs-proot.sh <project-dir> <command...>`.
4. You cannot hear audio. Report measurements and ask the user to listen.
5. Ask at most 3 questions, in one message. Ask before paid APIs, model downloads or exposing a server.
