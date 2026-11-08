# 07 Environment and troubleshooting

Run `filmstudio doctor` (`--deep` also launches Chromium). It reports what is missing and the fix.

## Requirements
Node 18+, ffmpeg, `playwright-core` + Chromium (for `review`, `audio-check`), and for Kokoro: Python venv with `kokoro-onnx soundfile`, plus the two model files in `~/.filmstudio/models/` (or env `FILMSTUDIO_KOKORO_MODEL`, `FILMSTUDIO_KOKORO_VOICES`, `FILMSTUDIO_PYTHON`).

## Small or phone-class devices
- Kokoro takes about 40 s per short clip on 4 GB phones; run it and wait. It resumes if killed.
- Do heavy rendering in chunks; `audio-check` already renders 6 bars at a time (one-shot renders ran out of memory).
- Background processes may be killed by the OS. Prefer foreground runs, or tmux with the battery manager allowing background activity.
- On Android/Termux, browser tools run best inside a proot Ubuntu: set `FILMSTUDIO_PW=/path/to/node_modules`.

## Common errors
| Error | Fix |
|---|---|
| `playwright-core not found` | `npm i playwright-core && npx playwright-core install chromium` |
| `Kokoro model files not found` | follow `doctor` hint |
| `spec has errors` | run `validate`, apply each `fix` |
| review frames all dark | wait longer: `--settle` is not needed normally; check `pageErrors` |
