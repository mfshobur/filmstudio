# 05 Voice

Providers: `kokoro` (free, local, slow on small devices), `file` (you or the user supplies audio), `elevenlabs` (paid; arrives in phase 3).

## kokoro
`filmstudio voice` generates `voice/NN.mp3` and `voice/durations.json`, updates `spec.json` (`file`, `dur`). It resumes after a crash: run it again. Speed 0.8 to 0.9 reads dramatic and clear; 0.9 to 1.0 is brisk. English voices: `bf_emma`, `bf_isabella`, `bm_fable`, `bm_george`, `af_heart`, `am_michael`. Per-line `speed` or `voice` overrides go on the narration entry.
Requires model files: run `filmstudio doctor` for the exact setup steps.

## file (bring your own audio)
Put `voice/00.mp3`, `voice/01.mp3` ... (one per narration line, mp3/wav/m4a/ogg), then `filmstudio voice --provider file`.

## Judging a voice (you cannot hear)
Audio language models are poor judges. Use `filmstudio voice-check` plus the user.

`voice-check` measures every clip and flags: clipping or a peak near full scale; isolated clicks and glitches; very quiet clips; long silence at the start, end or inside a clip; very slow (under 1.0 words/s) or very fast (over 4.2) reading; flat delivery (pitch varies under 0.9 semitones); a clip whose loudness differs by more than 6 dB from the others; a clip whose pitch is far from the others (the voice drifted). Typical healthy Kokoro clips: peak -2 to -5 dB, median pitch about 180 Hz with 2 to 4 semitones of variation, 2 to 3.9 words/s.

It cannot judge taste, accent or emotion. After it passes, ask the user to play the film with headphones and name the line and the symptom (crackle, cut-out, robotic, too quiet). Re-run `voice --force` for a flagged clip, or change that line's `speed`/text.
- clip lengths are in `voice/durations.json`; `validate` catches clips that overlap the next line.
- Not built yet: word-error-rate and predicted-naturalness scores (they need large models).

## Safety and licensing
Voice cloning and celebrity voices need the speaker's consent. Mention AI-generated narration to viewers when publishing. Kokoro is Apache-2.0.
