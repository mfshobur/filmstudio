# filmstudio

You describe a short film to an AI coding agent. The agent uses filmstudio to make it: it writes a storyboard, records the narration, builds the film, takes screenshots of every shot to check them, and measures the audio.

The result is one HTML file. Open it in a browser and it plays: animated scenes cut to a score that is generated live in the page, with a voice reading the narration.

I started this to make one film, "The Only Limit" (it's in `examples/`), and then turned the pieces into something other people can reuse. Most of it was built and tested on an Android phone with 4 GB of RAM, which is why it copes with slow machines and jobs getting killed halfway.

## What it can and can't do

It draws everything itself with canvas graphics. That means flat or glowing 2D scenes, simple 3D charts and shapes, paper-cut and isometric looks, a robot mascot. It cannot make photos, real people, or a specific product. If you need those, this is the wrong tool.

Right now there are twenty-nine visual styles, with a few variants of each:

| style | what it looks like |
|---|---|
| `atom` | glowing atom, molecule, galaxy zoom |
| `math` | blueprint grid, sine wave, gradient descent |
| `cartoon` | flat colours, a robot mascot, a heart |
| `chart` | 3D bars rising, counters |
| `explainer` | a neural net with labels, an exploded cube |
| `iso` | isometric city blocks |
| `paper` | layered paper landscapes, a window scene |
| `synth` | neon sunset grid |
| `domino` | tiles flipping to reveal a title |
| `type` | kinetic typography: your words animate on the beat |
| `board` | whiteboard: icons and handwriting drawn by a marker |
| `shadow` | shadow puppets: pierced silhouettes on a lamp-lit screen (wayang kulit, Reiniger) |
| `pixel` | 16-colour pixel art: skyline, runner, CRT text |
| `glitch` | VHS and RGB-split distortion over any other style |
| `ink` | Chinese ink wash: mountains, bamboo, brushed text |
| `comic` | halftone comic panels, bursts, speed lines |
| `gen` | flow fields, Voronoi, mandala, metaballs |
| `vapor` | vaporwave: pastel sunset grid, retro OS windows |
| `memphis` | bold 80s shapes that pop on the beat |
| `poster` | Swiss and Bauhaus typographic posters |
| `ascii` | code rain, terminal text, ASCII plasma |
| `clay` | soft puffy claymorphism shapes and text |
| `origami` | a paper boat, a sheet folding |
| `lowpoly` | flat-shaded terrain and a faceted orb |
| `voxel` | a cube-built island |
| `map` | a stylised route or a timeline |
| `multiplane` | misty layered forest with glass-layer depth |
| `stopmo` | stop-motion jitter over any other style |
| `image` | your own pictures and logos (Ken Burns, pop, polaroid, cut-out, logo) |
| `stage` | optional: characters in front of any of the above |

Characters are optional. If your story needs one, you describe it in the project (body type, colors, hair, face, accessories) and pick how it's drawn: cartoon outline, flat, paper cut-out, shadow-puppet silhouette, neon glow or hand-drawn. `examples/character-demo` shows six. A film that doesn't use characters never has one.

There are two music scores, both 46 bars in A minor with no piano: `anthem-46` (energetic) and `calm-46` (no hard drums). Film length comes from the tempo: seconds = 11040 / bpm, so 128 BPM is 86 s and 184 BPM is 60 s. You can transpose the key. More styles, characters and scores are the next things to build. See the roadmap below.

## Install

You need Node 18 or newer. For the checking tools you also need ffmpeg and Chromium (through `playwright-core`). For free local narration you need Python with `kokoro-onnx`.

```
git clone https://github.com/mfshobur/filmstudio
cd filmstudio
node bin/filmstudio.js doctor
```

`doctor` tells you what's missing and how to install it. You can build a film with only Node; the rest is for narration and checking.

## Try the example

```
node bin/filmstudio.js new my-copy --example the-only-limit
cd my-copy
node ../bin/filmstudio.js validate
node ../bin/filmstudio.js build
```

Then open `build/film.html` in a browser and press Begin. Use headphones.

## Making your own

The normal way is to point an agent (Claude Code, Codex CLI, Gemini CLI, Cursor, anything that can run shell commands) at this repo and tell it what you want. The agent reads `AGENTS.md`, which sends it to a written guide in `docs/agent-guide/`. With Claude Code you can also copy `skills/film-maker` into `~/.claude/skills/`.

You can do it by hand too. A film is a folder:

```
my-film/
  brief.json     what you asked for
  spec.json      the storyboard: shots, narration, timing
  voice/         narration clips
  build/         film.html and review screenshots
```

`spec.json` lists shots as `[startBar, endBar, style, variant]` and narration lines with a start time. Start from the example and change it. `validate` explains every mistake and says how to fix it.

## Commands

All commands print JSON.

| command | does |
|---|---|
| `new <dir> [--example name]` | create a project folder |
| `validate` | check `spec.json` |
| `voice` | generate narration with Kokoro, or import your own audio (`--provider file`) |
| `build` | write `build/film.html` |
| `review` | screenshot each shot, make contact sheets; `--size 400x800` for portrait, `--motion` to check shots animate |
| `audio-check` | render the score offline and report loudness, clipping, dynamics |
| `doctor` | check this machine |

Developing: `npm test` runs the fast checks (no browser). `npm run qa` draws every style and variant in a headless browser and reports errors and static shots.
| `styles` | list the styles and variants |
| `guide [topic]` | print the agent guide |

## Voices

Narration is Kokoro by default: free, runs locally, slow on weak hardware (about 40 seconds per short clip on a phone). You can also supply your own recorded audio. ElevenLabs support is planned. If you use a cloned or celebrity voice, get the speaker's consent, and say the narration is AI-generated when you publish.

## An agent can't hear

The review tools can look at pictures and measure audio levels. They can't tell you whether the voice sounds good or the music moves anyone. A person has to listen. The guide tells agents to say this and to ask for timecodes of anything that sounds wrong.

## Roadmap

- more character options (hands, outfits, more animals, lip-sync from the audio itself)
- imported images and logos as shots; more variants of the styles above
- a small local web page to edit the storyboard with live preview
- other scores, with length and key as settings
- ElevenLabs voices, MP4 export, an MCP server

## License

MIT. Kokoro is Apache-2.0. Fonts load from Google Fonts when the film opens in a browser.
