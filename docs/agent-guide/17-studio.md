# The studio page (`filmstudio serve`)

A small local web page the user can keep open next to the agent chat. It edits the same files you do, so nothing is hidden from you.

```
filmstudio serve path/to/project            # http://127.0.0.1:4173
filmstudio serve path/to/project --port 5000
```

## Many projects: the workspace
Keep all films in one **workspace folder** (default `~/filmstudio-projects`; set it with `--root <dir>` or `FILMSTUDIO_ROOT`). A project is any subfolder of it that has `spec.json`.
```
filmstudio list                        # JSON: every project with title, length, format, last edited/built
filmstudio serve                       # no spec.json here: opens the project picker for the workspace
filmstudio serve --root ~/films        # same, explicit workspace
```
The picker shows a card per project (title, length, format, edited/built times, a "changed since build" flag, the review contact sheet as thumbnail) and a New project form. Opening a card goes to `/p/<name>/`, the normal studio for that project; "all projects" in the header goes back. `filmstudio serve <dir>` still serves one project when `<dir>` has `spec.json`. Create projects inside the workspace (`filmstudio new <workspace>/<name>`, or the MCP tool with the server rooted there) so the picker finds them. Over MCP, `filmstudio_list` shows what exists.

Tell the user the URL it prints. The server listens on localhost only. To reach it from another device use `--host 0.0.0.0`; a token is then required (the URL printed includes it). To reach it through a tunnel (ngrok, cloudflared), add `--allow-host <the tunnel's host name>`; that also forces a token. Never expose it to the internet without the user's say-so, and don't print the token anywhere else.

## What the user can do there
- **Idea**: fill in the brief (title, what it's about, tone, styles), tempo/length, music preset, voice. Saved to `brief.json` and `spec.json`.
- **Storyboard**: edit shots (style, variant, bars, params), add/move/delete, edit narration and prompts. Each shot shows the gallery picture of its variant. The side panel shows `validate` results live; click a message to jump to the shot.
- **Voice**: generate narration, listen to every clip, run `voice-check`. ElevenLabs asks for confirmation with the character count before spending.
- **Preview**: build and play `film.html` in the page.
- **Review**: the user writes notes (optionally tied to a shot). They land in `feedback.json`.
- **Timeline**: a multi-track view (music, video shots, narration, prompts) with a playhead and zoom. Drag the handle between two shots to retime the cut, drag narration lines and prompts, `S` splits the shot under the playhead, `Delete` removes the selected shot or prompt, `Ctrl/Cmd+Z` undoes. It is live: when you change `spec.json` the page redraws within about 2 seconds. Narration lines can only move between their neighbours (voice clips are matched to lines by position). Dashed narration blocks have an estimated length until `voice` measures the clips.
- **Status**: audio check, per-shot review, MP4 export, with logs.

## What you do
- Read `feedback.json` at the start of each turn. Each note has `id, text, shot (0-based index or null), status (open|done), created`. After you act on a note, set `status` to `done` and add a short `reply` string.
- If the user edited `spec.json` in the page, re-run `validate` before building. The page keeps one backup of the spec as `spec.json.bak` the first time it saves.
- Jobs started from the page (one at a time) write `studio-status.json`; read it to see what is running.
- Editing `spec.json` while the page is open is safe now: the page follows your changes live, and its saves carry the version it loaded, so if you changed the file first the server refuses (409) and the page asks the user whether to load your version or overwrite it. If the user has an unsaved edit in the page when you save, they get that choice. Tell them anyway when you restructure the storyboard.
- Over HTTP (for tools): `GET /api/project` returns `rev` (a hash of `spec.json`); `PUT /api/spec` with an `If-Match: <rev>` header is refused with 409 if the file changed; `PATCH /api/spec` with `{rev, ops}` applies timeline edits (`shot.boundary`, `shot.split`, `shot.delete`, `narration.move`, `prompt.move`, `prompt.delete`; see `src/edits.js`) and refuses any edit that would add a validation error; `GET /api/timeline` returns the tracks with bar and second positions; `GET /api/events` is a server-sent event stream (`spec`, `build`, `voice`, `feedback`).

## Limits
Local and single user. No accounts. The page follows file changes live (about 2 seconds), but not mid-keystroke: if the user is typing in a field it shows a notice instead of reloading. The page can't do what the machine can't: review and export need a headless browser and ffmpeg.
