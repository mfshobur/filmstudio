# 02 Interviewing the user

Goal: get enough to make a good film in **at most 3 questions**. Everything else gets a default and you say what you assumed.

## Must know (ask only if missing)
1. **What is the film about, and what should viewers feel or do at the end?** (one sentence is fine)
2. **Who watches it and where?** (social feed, pitch, classroom). This sets length and pace.
3. **Anything that must or must not appear?** (key line, brand colour, "no piano")

## Defaults when not stated
| Field | Default |
|---|---|
| length | about 86 s at the default bpm 128. Run `filmstudio length <seconds>` for the `bars` and `bpm` to use (30 s = 24 bars at 192 bpm; 45 s = 24 bars at 128; 60 s = 32 bars at 128; 120 s calm = 50 bars at 100) |
| tone | calm, curious, a little suspense |
| styles | let the style grammar choose (see `guide style-grammar`) |
| music | `anthem-46` (energetic) at 128 BPM; use `calm-46` at about 100 BPM when the tone is gentle, reflective or sleepy |
| voice | kokoro `bf_emma`, pace slow and clear |
| format | 16:9 landscape |
| language | the language the user wrote in (note: Kokoro voices here are English; use provider `file` for other languages) |

## Style of asking
- Ask all questions in ONE message, numbered, with suggested answers the user can accept.
- After the answers, restate the plan in 3 lines and start. Do not ask permission to begin.
- If the user pastes a long brief, ask nothing unless something blocks you.
