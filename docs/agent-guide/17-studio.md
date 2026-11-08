# The studio page (`filmstudio serve`)

A small local web page the user can keep open next to the agent chat. It edits the same files you do, so nothing is hidden from you.

```
filmstudio serve path/to/project            # http://127.0.0.1:4173
filmstudio serve path/to/project --port 5000
```

Tell the user the URL it prints. The server listens on localhost only. To reach it from another device use `--host 0.0.0.0`; a token is then required (the URL printed includes it). To reach it through a tunnel (ngrok, cloudflared), add `--allow-host <the tunnel's host name>`; that also forces a token. Never expose it to the internet without the user's say-so, and don't print the token anywhere else.

## What the user can do there
- **Idea**: fill in the brief (title, what it's about, tone, styles), tempo/length, music preset, voice. Saved to `brief.json` and `spec.json`.
- **Storyboard**: edit shots (style, variant, bars, params), add/move/delete, edit narration and prompts. Each shot shows the gallery picture of its variant. The side panel shows `validate` results live; click a message to jump to the shot.
- **Voice**: generate narration, listen to every clip, run `voice-check`. ElevenLabs asks for confirmation with the character count before spending.
- **Preview**: build and play `film.html` in the page.
- **Review**: the user writes notes (optionally tied to a shot). They land in `feedback.json`.
- **Status**: audio check, per-shot review, MP4 export, with logs.

## What you do
- Read `feedback.json` at the start of each turn. Each note has `id, text, shot (0-based index or null), status (open|done), created`. After you act on a note, set `status` to `done` and add a short `reply` string.
- If the user edited `spec.json` in the page, re-run `validate` before building. The page keeps one backup of the spec as `spec.json.bak` the first time it saves.
- Jobs started from the page (one at a time) write `studio-status.json`; read it to see what is running.
- Don't edit `spec.json` while the user is mid-edit in the page without telling them; the page saves its whole copy when they type.

## Limits
Local and single user. No accounts, no live sync (reload the page after you change files). The page can't do what the machine can't: review and export need a headless browser and ffmpeg.
