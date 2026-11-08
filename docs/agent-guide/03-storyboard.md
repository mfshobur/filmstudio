# 03 Brief -> treatment -> storyboard (spec.json)

## spec.json fields
```json
{
  "version": 1,
  "meta": { "title": "", "eyebrow": "", "lede": "", "fine": "", "endTitle": "", "endLede": "",
            "titleLines": ["line 1", "line 2", "line 3"], "titleAccent": 1 },
  "bpm": 128, "bars": 46, "endCardBar": 44.6, "score": { "preset": "anthem-46" },
  "voice": { "provider": "kokoro", "voice": "bf_emma", "speed": 0.86 },
  "shots": [ [startBar, endBar, "style", "variant"], ... ],
  "narration": [ { "text": "...", "at": [bar, beatOffset], "speed": 0.86 } ],
  "prompts": [ { "bar": 1, "beat": 1, "text": "what if", "big": true }, { "bar": 3, "hide": true } ]
}
```
- **Bars are 1-based. 0.25 = one beat.** Shots must be contiguous, from bar 1 to bars+1, whole beats.
- `titleLines` are the words flipped onto the domino "title" shot (use 2 to 3 short lines; `titleAccent` is the index drawn in the accent colour).
- `prompts` are the typed "human voice" text lines shown over the picture. `big:true` centres them. `hide:true` removes the current one. Optional.
- `narration[].at = [bar, beatOffset]`: where the clip starts. Clip lengths come from `voice` (run it, then `validate` catches overlaps).

## The built-in score `anthem-46` (46 bars, 128 BPM, A minor)
| Bars | Section | Cut rhythm to use | Narration |
|---|---|---|---|
| 1-4 | intro, suspense, quiet | 2 bars per shot | 1 to 2 lines |
| 5-12 | build | 2 bars per shot, last 2 bars 1 bar each | 3 to 4 lines |
| 13-20 | montage, full drums | every 2 beats (0.5 bar); last 2 bars every beat | short single words on downbeats |
| 21-28 | breakdown, calm, heartbeat | 1 to 3 bars per shot | emotional lines; bar 28's last beat is silent |
| 29-40 | drop and climax | beats at first (bars 29-30), then 2 beats, then long shots | the key message around bars 36-38 |
| 41-46 | outro | one long calm shot | a closing line or question |
Put the single most important line at about bar 36 (the emotional peak).

## Writing narration that works
- 3 to 10 words per line. One idea per line. Use "..." for a dramatic pause.
- Start lines on downbeats (`[bar,0]`) or beat 1. Leave air; silence is rhythm.
- Montage words ("Paint.", "Compose.") each get their own bar and their own cut.

## Treatment template (treatment.md)
Hook (bars 1-4) / Build (5-12) / Montage of possibilities (13-20) / Turn (21-28: what the machine lacks, the human question) / Payoff (29-40) / Last image (41-46).
