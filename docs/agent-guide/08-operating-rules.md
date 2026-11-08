# 08 Operating rules for agents

1. **Ask before** paid API calls (ElevenLabs: the tool stops at `NEEDS_CONFIRMATION` until you pass `--yes`, and you should only do that after the user agrees), downloading model files, starting a server reachable from other devices, deleting or overwriting user files.
2. **Secrets:** read keys from environment variables only. Never write them into `spec.json`, logs, or the generated film.
3. **Honesty:** you cannot hear audio or judge taste. Report measurements, name what you could not verify.
4. **Scope:** do your work inside the project folder. Do not edit the engine unless the user asked for a new style.
5. **Resumability:** if something is killed, rerun the same command; do not start from scratch.
6. **Respect cultural styles** (shadow puppets, ink wash, patterns): credit the tradition in the film's text when you use them.
7. **Report plainly:** what you made, where the file is, what you checked, what is untested, what to look at.
