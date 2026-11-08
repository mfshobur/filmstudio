# 09 Using filmstudio from different agent tools

The tool is a plain command-line program with JSON output and a project folder, so any agent that can run shell commands and read files can use it.
- **Claude Code:** install the skill in `skills/film-maker/` (copy it to `~/.claude/skills/`). It points the agent at this guide.
- **Codex CLI, Gemini CLI, Cursor, others:** `AGENTS.md` in the repo root is the entry point. Run `filmstudio guide all` to load the whole guide.
- **MCP (planned, phase 3):** a server exposing the same commands as tools.
Whatever the harness, the loop is: write files, `validate`, `voice`, `build`, `review`, `audio-check`, look, fix.
