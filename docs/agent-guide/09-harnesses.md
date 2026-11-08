# 09 Using filmstudio from different agent tools

filmstudio is a command-line program with JSON output and a project folder, so any agent that can run shell commands and read files can use it directly. It also speaks MCP, so tools that prefer native tool calls can use it that way.

## Option A: shell (works everywhere)
Run `node <clone>/bin/filmstudio.js <command>` (or `filmstudio <command>` if you linked it). Read `AGENTS.md`, then `filmstudio guide all`.

## Option B: MCP server
`filmstudio mcp [--root <workspace>]` runs an MCP server on stdio. It offers 11 tools (`filmstudio_new`, `_validate`, `_build`, `_voice`, `_voice_check`, `_review`, `_audio_check`, `_export`, `_styles`, `_guide`, `_doctor`) and the whole guide as resources (`filmstudio://guide/<topic>`). Project paths are confined to `--root` (default: the folder the server starts in); anything outside it is refused.

Typical registrations (check your tool's current docs, the file formats change between versions):
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
Copy `skills/film-maker` to `~/.claude/skills/`. It tells the agent where filmstudio is and to read the guide.

Whatever the harness, the loop is: write files, `validate`, `voice`, `voice-check`, `build`, `review`, `audio-check`, look, fix; `export` if a video file is wanted.
