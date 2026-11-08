# 05 Voice

Providers: `kokoro` (free, local, slow on small devices), `elevenlabs` (paid cloud voice, better emotion, word timings), `file` (you or the user supplies audio).

## kokoro
`filmstudio voice` generates `voice/NN.mp3` and `voice/durations.json`, updates `spec.json` (`file`, `dur`). It resumes after a crash: run it again. Speed 0.8 to 0.9 reads dramatic and clear; 0.9 to 1.0 is brisk. English voices: `bf_emma`, `bf_isabella`, `bm_fable`, `bm_george`, `af_heart`, `am_michael`. Per-line `speed` or `voice` overrides go on the narration entry.
Requires model files: run `filmstudio doctor` for the exact setup steps.

## elevenlabs (paid)
1. The user needs an ElevenLabs account and API key. The key goes in the environment only: `export ELEVENLABS_API_KEY=...`. Never write it into spec.json or any project file.
2. Choose a voice id (the user can copy one from their ElevenLabs voice library, or list voices with `GET https://api.elevenlabs.io/v1/voices`). Put it in the spec:
   `"voice": { "provider": "elevenlabs", "voiceId": "<id>", "model": "eleven_multilingual_v2", "stability": 0.5, "similarity": 0.75, "style": 0, "speed": 1 }`
   A single line can override with `narration[i].voiceId` or `narration[i].speed`.
3. `filmstudio voice --provider elevenlabs` first only **reports the character count and stops** (`NEEDS_CONFIRMATION`). It spends the user's paid quota, so ask the user, then re-run with `--yes`.
4. Clips are mastered like the others. For each clip it also saves `voice/NN.words.json` with start and end seconds of every word (useful for checking where emphasis falls). Re-running skips clips that already exist; use `--force` to redo one.
Voice cloning or celebrity voices need the speaker's consent and a licence; tell the user to check ElevenLabs' terms and to disclose AI narration. This provider was tested against a local mock of the documented API; it has not been run against the live service by the authors, so report any error message you get verbatim.

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
