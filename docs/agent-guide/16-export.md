# 16 Exporting an MP4

`filmstudio export` renders `build/film.mp4` from the real engine: every frame is drawn at an exact beat (no real-time capture), captions, typed prompts and the end card included, then the score and narration are mixed offline (music dips under speech like in the player) and muxed with ffmpeg.

```
filmstudio export                                   # whole film, 640x360, 12 fps
filmstudio export --fps 24 --size 1280x720          # smoother and sharper (much slower)
filmstudio export --from-bar 13 --to-bar 21         # only bars 13 to 20 (good for a test or a teaser)
filmstudio export --no-audio                        # silent video
filmstudio export --no-bars                         # remove the cinematic letterbox bars
```
## How long it takes
Measured on a 4 GB Android phone (proot, software rendering): a 5.6 s range at 360x640, 8 fps took 76 s including the audio mix, so budget roughly 12 to 15 times the film length at that setting. The whole 86 s example at 640x360 and 8 fps took 14 minutes in one run (8 MB, h264 + aac, duration matched to the frame). A laptop is much faster. Always test with `--from-bar 1 --to-bar 3` first.

## Video shape
Set `"format"` in spec.json: `"16:9"` (default, wide), `"9:16"` (Reels/TikTok/Shorts), `"1:1"` or `"4:5"`. `export` and `review` then default to that shape (`--size` still overrides). The shot styles adapt to any shape; when the user wants a vertical film, run `review` and check titles and charts at that shape before exporting. The studio page has a picker on the Idea tab.

Needs ffmpeg and the browser tools (`filmstudio doctor` shows `can.review`). Narration clips must already exist (`filmstudio voice`); clips that are missing are simply absent from the mix.

## Time and size
- Cost is about one browser screenshot per frame. A laptop does 10 to 30 frames a second; a 4 GB phone about 0.5 to 1. A 86 s film at 12 fps is about 1030 frames.
- Always test with `--from-bar 1 --to-bar 3` first (about 4 seconds of film) and look at the result, then run the whole film.
- 12 fps is fine for the graphic styles but looks choppy for fast motion; use 24 when the machine can afford it. Width and height are rounded down to even numbers.

## Resumable
Frames are written to `build/export/frames/` and the music to cached chunks in `build/export/`. If the process is killed (phones do this), run the same command again: only the missing frames and chunks are redone. Changing size, fps, range or the spec starts frames over automatically.

## What to tell the user
The MP4 uses a fixed offline mix, close to but not identical to the live page (no live reverb on the voice). Say that it was not heard by you, give the path (`build/film.mp4`) and the duration. The film.html remains the highest quality version.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `ffmpeg is required for export` | install ffmpeg |
| `browser kept failing while rendering frames` | the OS killed the browser repeatedly; re-run (it resumes) or lower `--size` |
| `draw errors while exporting` | a shot threw an error; run `filmstudio review` to find which |
| video shorter than expected by one frame | normal: the muxer trims the video to the audio length |
