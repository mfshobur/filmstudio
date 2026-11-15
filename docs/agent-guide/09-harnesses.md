# 09 Using filmstudio from different agent tools

filmstudio is a command-line program with JSON output and a project folder, so any agent that can run shell commands and read files can use it directly. It also speaks MCP, so tools that prefer native tool calls can use it that way.

## Option A: shell (works everywhere)
Run `node <clone>/bin/filmstudio.js <command>` (or `filmstudio <command>` if you linked it). Read `AGENTS.md`, then `filmstudio guide all`.

## Option B: MCP server
`filmstudio mcp [--root <workspace>]` runs an MCP server on stdio. It offers 24 tools (`filmstudio_new`, `_list`, `_scene_new`, `_scene_list`, `_scene_preview` (returns the strip as an image), `_scene_check`, `_look_list`, `_look_show`, `_library`, `_validate`, `_build`, `_voice`, `_voice_check`, `_review`, `_audio_check`, `_export`, `_styles`, `_guide`, `_doctor`, and for agents without file access `_files`, `_read`, `_write`, `_edit`, `_job`) and the whole guide as resources (`filmstudio://guide/<topic>`). On connect the server sends the complete brief as its `instructions` (workflow, rules, limits), and a `make_film` prompt (arguments `idea`, `length`) returns the same brief as a message, so an agent needs nothing else. `_write`, `_edit` and `_read` can only touch project files (spec.json, brief.json, treatment.md, scenes/rigs/libs/looks `*.js`, assets, notes), never outside the project, and `_scene_preview` and `_review` return images. Slow steps (`_voice`, `_review`, `_export`) run as background jobs: if one is not finished within `wait` seconds (default 45) it returns a job id, and `_job` waits and reports progress. Review, export and Kokoro find the browser, Python and models in `~/.filmstudio` on their own; the `FILMSTUDIO_*` variables only override that. Project paths are confined to `--root` (default: the folder the server starts in); anything outside it is refused.

Verified: Claude Code (non-interactive run with `--mcp-config`) started the server, called `filmstudio_styles` and got the correct list. The other registrations below are from memory of those tools' formats; check their current docs, because the file formats change between versions.
- **Claude Code:** `claude mcp add filmstudio -- node /path/to/filmstudio/bin/filmstudio.js mcp --root /path/to/workspace`
- **Codex CLI** (`~/.codex/config.toml`): 
  ```toml
  [mcp_servers.filmstudio]
  command = "node"
  args = ["/path/to/filmstudio/bin/filmstudio.js", "mcp", "--root", "/path/to/workspace"]
  ```
- **Gemini CLI / Cursor / others** (a JSON `mcpServers` entry): `{ "filmstudio": { "command": "node", "args": ["/path/to/filmstudio/bin/filmstudio.js", "mcp", "--root", "/path/to/workspace"] } }`

Long tools (`voice`, `review`, `export`) can run for minutes; if your client has a tool timeout, use the shell for those and MCP for the quick ones. The paid-voice guard works the same over MCP: `filmstudio_voice` with provider `elevenlabs` returns `NEEDS_CONFIRMATION` until `yes` is true.

## Option C: Claude Code skill
Run `filmstudio install-skill` (or `node <clone>/bin/filmstudio.js install-skill`). It copies `skills/film-maker` to `~/.claude/skills/` and records the clone path in a `CLONE_PATH` file next to the skill, so the agent can find filmstudio from any repo. It also prints the exact MCP command and an `AGENTS.md` snippet for the repo you want films about; see `guide explain-a-codebase`. Use `--to <dir>` for another skills folder and `--force` to replace an existing install.

Whatever the harness, the loop is: write files, `validate`, `voice`, `voice-check`, `build`, `review`, `audio-check`, look, fix; `export` if a video file is wanted.
