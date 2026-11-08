# 05 Voice

Providers: `kokoro` (free, local, slow on small devices), `file` (you or the user supplies audio), `elevenlabs` (paid; arrives in phase 3).

## kokoro
`filmstudio voice` generates `voice/NN.mp3` and `voice/durations.json`, updates `spec.json` (`file`, `dur`). It resumes after a crash: run it again. Speed 0.8 to 0.9 reads dramatic and clear; 0.9 to 1.0 is brisk. English voices: `bf_emma`, `bf_isabella`, `bm_fable`, `bm_george`, `af_heart`, `am_michael`. Per-line `speed` or `voice` overrides go on the narration entry.
Requires model files: run `filmstudio doctor` for the exact setup steps.

## file (bring your own audio)
Put `voice/00.mp3`, `voice/01.mp3` ... (one per narration line, mp3/wav/m4a/ogg), then `filmstudio voice --provider file`.

## Judging a voice (you cannot hear)
Audio language models are poor judges. Use numbers plus the user:
- clip lengths from `durations.json`: text of N words should take about N x 0.35 to 0.5 s at speed 0.86. Much longer means a stall; much shorter means clipped.
- run `audio-check` and listen with the user: ask them to play the film and name the line and the symptom (crackle, cut-out, robotic, too quiet).
- Phase 3 adds automatic checks (word error rate, predicted naturalness, emotion).

## Safety and licensing
Voice cloning and celebrity voices need the speaker's consent. Mention AI-generated narration to viewers when publishing. Kokoro is Apache-2.0.
