# 03 Brief -> treatment -> storyboard (spec.json)

Start from the starter: `filmstudio new my-film` copies `examples/starter` (a valid spec with the proven shot rhythm and no narration). For a finished film to imitate, run `filmstudio new copy --example the-only-limit`. Edit the shots, the text and the narration; run `validate` after every change.

## Film length (read this first)
**length in seconds = bars x 240 / bpm.** The built-in scores are 46 bars (86 s at the default 128 bpm). To change the length, run `filmstudio length <seconds>` (add `--preset calm-46` for calm) and put the `bars` and `bpm` it prints into spec.json. `bars` may be 46 or any even number from 40 to 78: the drum-driven montage (film bars 13 onward) stretches or shrinks by 2-bar units while the intro, build, break, climax and outro stay fixed. That means a floor of about 48 s at a tempo near 200 and no film shorter than 40 bars. Shots are placed on the film's own bars, so after changing `bars` move the shots to fit and keep the last shot ending at bars + 1. **Where the sections fall.** Let `d = bars - 46` (negative when shorter). Intro bars 1-4, build 5-12, **montage 13 to 20+d**, break 21+d to 28+d (the silent beat is the last beat of bar 28+d), climax 29+d to 40+d (drop at 36+d), outro 41+d to the end. Example, 40 bars (d = -6): montage 13-14, break 15-22, climax 23-34, drop at 30, outro 35-40. Any "bar 36"-style cue in this guide means 36+d. Plan the shot list from these numbers, not the 46-bar ones.

Changing only `bpm` (with bars 46) still works too; the table below uses that.

| target length | bpm |
|---|---|
| 60 s | 184 |
| 75 s | 147 |
| 90 s | 123 (default 128 = 86 s) |
| 110 s | 100 (the `calm-46` default) |
| 120 s | 92 |

`validate` prints `info.seconds` so you can confirm. The tempo changes with bpm, so very high or low values change the feel; stay between 90 and 150 when you can.

**Seconds per bar = 240 / bpm** (bpm 128: 1.9 s; 184: 1.3 s; 100: 2.4 s). A 2 to 5 second narration line is therefore about 2 bars at 128 bpm but 3 to 4 bars at 184. Space lines by clip length, not a fixed bar count, and run `voice` then `validate` to catch overlaps.

**Energetic and short (Reels, ads):** the shortest films use 40 bars at 160 to 200 bpm. That is fast: 2 to 3 second narration lines become 2 bars, so keep lines to 5 to 8 words, put the hook in the first bar, and let the montage be the product shots. Tell the user you cannot hear how fast it feels, and offer a slower version (`filmstudio length <more seconds>`).

**Calm and short together:** `calm-46` is tuned for 90 to 105 bpm, so a calm film of 60 s (bpm 184) plays the gentle score at nearly double speed. If the user wants calm, prefer a longer film (about 105 to 120 s), or say plainly that 60 s calm will feel brisk and let them choose.

## spec.json fields
```json
{
  "version": 1,
  "meta": { "title": "", "eyebrow": "", "lede": "", "fine": "", "endTitle": "", "endLede": "",
            "titleLines": ["line 1", "line 2", "line 3"], "titleAccent": 1 },
  "bpm": 128, "bars": 46, "endCardBar": 44.6,
  "score": { "preset": "anthem-46", "transpose": 0 },
  "voice": { "provider": "kokoro", "voice": "bf_emma", "speed": 0.86 },
  "shots": [ [startBar, endBar, "style", "variant"], [startBar, endBar, "style", "variant", { "params": "here" }] ],
  "characters": { },
  "narration": [ { "text": "...", "at": [bar, beatOffset], "speed": 0.86 } ],
  "prompts": [ { "bar": 1, "beat": 1, "text": "what if", "big": true }, { "bar": 3, "hide": true } ]
}
```
### Units
- **Bars are 1-based. One bar = 4 beats. 0.25 bar = one beat.** `[13, 13.5, ...]` is a two-beat shot starting at bar 13.
- `narration[].at = [bar, beatOffset]`: the clip starts at that bar plus `beatOffset` **beats** (0 to 3.99). `[21, 1]` = one beat after bar 21 begins. Clip lengths come from `voice`; run `voice`, then `validate` catches overlaps.
- `prompts[]`: `bar` plus `beat` (beats after the bar starts) set when the typed text appears. `big:true` centres it large; `hide:true` removes the current one. Optional.
- `endCardBar`: bar at which the "Watch again" end card fades in; use `bars - 1.4` (44.6).

### meta fields (all text shown on the intro and end screens)
| field | shown where |
|---|---|
| `title` | browser tab, the intro screen heading (required) |
| `eyebrow` | small line above the title on the intro screen ("A short film . 85 seconds") |
| `lede` | one sentence under the title on the intro screen |
| `fine` | small print under the Begin button |
| `endTitle`, `endLede` | the end card heading and the line below it |
| `titleLines`, `titleAccent` | the words flipped onto the `domino/title` shot (2 to 3 short lines), and which line index is drawn in the accent colour |

### Scores (music)
Both presets are 46 bars, A minor, with no piano. Pick by mood:
- `anthem-46`: energetic. Suspense intro, build, drum-driven montage (bars 13-20), calm breakdown (21-28), drop (29-40), outro (41-46).
- `calm-46`: same structure and melody without hard drums (soft heartbeat pulse, gentle bass and cello). For reflective, sleepy or gentle films. Use bpm 90 to 105.
- `score.transpose`: whole semitones -6 to 6 (0 = A minor, 3 = C minor, -2 = G minor).
`brief.json` is for you and the user only: filmstudio never reads it. Only `spec.json` is built.

## The 46-bar plan
| Bars | Section | Cut rhythm | Narration |
|---|---|---|---|
| 1-4 | intro, suspense, quiet | 2 bars per shot | 1 to 2 lines |
| 5-12 | build | 2 bars per shot, last 2 bars 1 bar each | 3 to 4 lines |
| 13-20 | montage | every 2 beats (0.5 bar); last 2 bars every beat | short single words on downbeats |
| 21-28 | breakdown, calm, heartbeat | 1 to 3 bars per shot | emotional lines; bar 28's last beat is silent |
| 29-40 | drop and climax | beats at first, then 2 beats, then long shots | the key message around bars 36-38 |
| 41-46 | outro | one long calm shot | a closing line or question |
Put the most important line at about bar 36 (the emotional peak). `validate` warns when the montage has fewer than 6 shots.

## Writing narration that works
- 3 to 10 words per line. One idea per line. Use "..." for a dramatic pause.
- Start lines on downbeats (`[bar,0]`) or beat 1. Leave air; silence is rhythm.
- Montage words ("Paint.", "Compose.") each get their own bar and their own cut.

## Treatment template (treatment.md)
Hook (bars 1-4) / Build (5-12) / Montage of possibilities (13-20) / Turn (21-28: what the machine lacks, the human question) / Payoff (29-40) / Last image (41-46).

## A minimal complete spec
`examples/starter/spec.json` is a complete, valid spec (47 shots, no narration). Its first shots: `[1,3,"atom","spark"]`, `[3,5,"math","sine"]`, `[5,7,"cartoon","follow"]`. Add narration like `{"text":"Everything begins with a question.","at":[1,1]}`.
