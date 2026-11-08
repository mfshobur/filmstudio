# 06 Review checklist (learned from real failures)

After `filmstudio review`, open `build/review/sheet1.png` (and sheet2). Look at every tile. Also read `pageErrors` in the JSON (must be empty).

## What to look for
- **Washed-out or blown exposure:** white or very bright frames. Fix by lowering `cfg.alpha` for that style in the engine, not by changing content.
- **Cropped or clipped things:** labels cut off at the top, charts taller than the frame, text off-screen. Check at portrait (400x800) too.
- **Unreadable text:** low contrast, text over busy backgrounds.
- **Shapes that look like something else** (a sun that looks like an eye).
- **Empty frames:** a shot that renders only a background means a style/variant mismatch or a thrown error.
- **Same look twice in a row.**

## Audio (`audio-check`)
- `clippedSamples` must be 0; `peak` below 0.95.
- `nanSamples` must be 0 (a NaN stops the score mid-film).
- Dynamics: intro quietest, breakdown at least 1.5 dB under the montage, drop at least 3 dB over the breakdown. The command reports flags in words.

## Known failure modes
| Symptom | Cause |
|---|---|
| Score stops at one bar | a non-finite number in one note; the scheduler survives but that note is lost |
| Voice crackles near the loud climax | CPU overload on weak phones; reduce effects or enable lower quality |
| Voice too quiet | music too loud; lower master gain or duck more |
| First sound is late | audio start margin (0.8 s) on slow devices |

## You cannot judge
Taste, whether the voice sounds good, whether the music moves people. Report what you measured, then ask the user to watch with headphones and list timecodes of anything wrong.
