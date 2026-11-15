# filmstudio

You describe a short film to an AI coding agent. The agent uses filmstudio to make it: it writes the script, **draws a scene for every beat of it** in the visual style you want (wayang shadow puppets, ink wash, paper cut-out, clay, pixel art...), records the narration, builds the film, looks at screenshots of every shot to check them, and measures the audio.

The result is one HTML file. Open it in a browser and it plays: animated scenes cut to a score that is generated live in the page, with a voice reading the narration. If you need a video file, `export` renders an MP4 (slow on small machines, but it resumes if it is interrupted).

I started this to make one film, "The Only Limit" (it's in `examples/`), and then turned the pieces into something other people can reuse. Most of it was built and tested on an Android phone with 4 GB of RAM, which is why it copes with slow machines and jobs getting killed halfway.

## What it can and can't do

It draws everything itself with canvas graphics: 2D scenes made of shapes, paths, gradients, light and text, puppets with jointed parts, simple 3D charts. It cannot make photos, real people, or a specific product. If you need those, this is the wrong tool.

### Scenes and looks: the agent draws; the styles are style guides
The point of the tool is that an agent can **define a custom scene for each beat of a script**. If the narration is about a rabbit crossing a bridge, the agent writes `scenes/rabbit-bridge.js`: it draws the rabbit and the bridge, with a rig of jointed parts for the rabbit, in a *look* such as `wayang`.

```
filmstudio scene new rabbit-bridge --look wayang   # a working starter scene
filmstudio scene preview rabbit-bridge             # frames and a strip the agent looks at
filmstudio scene check rabbit-bridge               # errors, blank or frozen scenes, determinism, speed
```

A **look** is a style guide in code (palette, background, effects, motion feel) taken from the built-in styles: 29 of them, from `atom` and `ink` to `wayang`, `clay`, `pixel` and `vapor` (`filmstudio look list`, [the guide](docs/agent-guide/22-looks.md)). Scenes are code, so they are checked: drawing must depend only on time (preview, scrubbing and MP4 export give identical frames) and may not touch the network or the page. The studio's Scenes tab plays them live while the agent edits. Scenes, puppet rigs and looks can be saved to a shared library and reused across films. Start with `filmstudio guide scenes`.

### Built-in styles
There are also thirty ready-made styles with a few variants each. They are finished abstract pictures (a galaxy, a city of bars, a terminal): fine where an abstract visual is right for a beat, but they know nothing about your story. A picture of every variant is in [docs/gallery](docs/gallery/README.md).

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

There are two music scores, both 46 bars in A minor with no piano: `anthem-46` (energetic) and `calm-46` (no hard drums). The score is 46 bars by default; set `bars` to any even number from 24 to 78. Longer films stretch the drum-driven middle section; below 40 bars a shorter arrangement drops the first half of the build, the break and the early climax. Film length is bars x 240 / bpm (`filmstudio length 60` suggests the numbers). The shortest film at a natural tempo is 24 bars, about 45 s; 30 s means 192 bpm. You can transpose the key. For a film with parts that need different moods (a tense setup, a bright turn, a hard montage, a big finish), `spec.score.parts` gives each stretch its own music: four styles (`ambient`, `pulse`, `drive`, `anthem`), your own chord progressions and an energy curve per part (`filmstudio guide score-parts`). More styles, characters and scores are the next things to build. See the roadmap below.

## Install

You need Node 18 or newer. For the checking tools you also need ffmpeg and Chromium (through `playwright-core`). For free local narration you need Python with `kokoro-onnx`.

```
git clone https://github.com/mfshobur/filmstudio
cd filmstudio
node bin/filmstudio.js doctor
```

`doctor` tells you what's missing and how to install it. You can build a film with only Node; the rest is for narration and checking.

### Setting up review, MP4 export and narration (optional)
Each needs one install, and filmstudio finds it through an environment variable, so the pieces can live anywhere. This layout keeps everything under `~/.filmstudio`, outside the repo:

```
# a browser, for `review`, `audio-check` and `export`
npm install --prefix ~/.filmstudio playwright-core
export FILMSTUDIO_PW=$HOME/.filmstudio/node_modules
export FILMSTUDIO_CHROMIUM="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # path to your own Chrome or Chromium

# free local narration (kokoro) for `voice`
python3 -m venv ~/.filmstudio/venv && ~/.filmstudio/venv/bin/pip install kokoro-onnx soundfile
export FILMSTUDIO_PYTHON=$HOME/.filmstudio/venv/bin/python
mkdir -p ~/.filmstudio/models      # then download the two model files below into it
```

The kokoro model files are `kokoro-v1.0.onnx` (about 326 MB) and `voices-v1.0.bin` (about 28 MB), from the `model-files-v1.0` release at https://github.com/thewh1teagle/kokoro-onnx/releases. Set `FILMSTUDIO_KOKORO_MODEL` and `FILMSTUDIO_KOKORO_VOICES` if you keep them elsewhere. Without `FILMSTUDIO_CHROMIUM`, run `npx playwright-core install chromium` to download a browser instead. The `export` lines are not saved: put them in your shell profile, or `review`, `export` and `voice` will report the tools as missing in a new shell. Run `filmstudio doctor` to confirm.

### Use it from another project
To let an agent in any repo make a film (for example a video that explains that repo):

```
cd filmstudio
npm link                          # optional: puts `filmstudio` on your PATH
filmstudio install-skill          # copies the Claude Code skill to ~/.claude/skills/film-maker
```

`install-skill` also prints a ready-to-paste MCP command and an `AGENTS.md` snippet that use this clone's real path. Keep films in one workspace folder (the `--root` in those snippets), not inside the other repo. The guide for this is `filmstudio guide explain-a-codebase`.

## Try the example

```
node bin/filmstudio.js new my-copy --example the-only-limit
cd my-copy
node ../bin/filmstudio.js validate
node ../bin/filmstudio.js build
```

Then open `build/film.html` in a browser and press Begin. Use headphones.

## Viewing your films in the browser (the studio)

Keep all your films in one workspace folder (default `~/filmstudio-projects`; set another with `--root` or `FILMSTUDIO_ROOT`) and serve it:

```
filmstudio                                       # opens the studio on ~/filmstudio-projects; Ctrl+C stops it
```

Then open **http://127.0.0.1:4173/**. It only listens on your own machine.

| address | what you get |
|---|---|
| `http://127.0.0.1:4173/` | the project picker: one card per film (title, length, format, last edited and built, a "changed since build" flag) and a New project form |
| `http://127.0.0.1:4173/p/<name>/` | the studio for one film. Tabs: Idea, Storyboard, **Timeline**, Voice, Preview, Review, Status |
| `http://127.0.0.1:4173/p/<name>/film.html` | just the film, full page: press Begin, use headphones |

`<name>` is the project's folder name. Use `--port 5000` for another port. To serve a single film instead, run `filmstudio serve path/to/film` (the folder with `spec.json`); its address is then `http://127.0.0.1:4173/`.

**The Timeline tab** shows music, video shots, narration and prompts on a ruler. Drag the handle between two shots to retime the cut, drag narration lines or prompts to move them, press `S` to split the shot under the playhead, `Delete` to remove the selected shot or prompt, and `Ctrl/Cmd+Z` to undo. It follows your agent live: when the agent changes `spec.json` the page redraws within about two seconds, and if you and the agent both change the file the page asks whether to load the agent's version or keep yours, instead of overwriting. Narration lines can only move between their neighbours, because voice clips are matched to lines by position.

Details and the HTTP endpoints for tools: `filmstudio guide studio`.

## Making your own

If you'd rather type than talk, run `node bin/filmstudio.js serve my-film` and open the address it prints. It's a plain page for the brief, the storyboard, the voice and notes; your agent sees everything you change because it's all files.

The normal way is to point an agent (Claude Code, Codex CLI, Gemini CLI, Cursor, anything that can run shell commands) at this repo and tell it what you want. The agent reads `AGENTS.md`, which sends it to a written guide in `docs/agent-guide/`. With Claude Code, `filmstudio install-skill` installs the `film-maker` skill so it works from any folder.

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
| `scene new\|preview\|check\|list` | write, look at and test the scenes you draw for each beat (`rig new`, `lib new`, `look list\|show\|new` for puppets, shared code and style guides) |
| `library list\|save\|use` | keep scenes, rigs, looks and libs for reuse across films (`~/.filmstudio/library`) |
| `validate` | check `spec.json` |
| `voice` | generate narration with Kokoro, or import your own audio (`--provider file`) |
| `export` | render `build/film.mp4` (frames from the real engine, offline-mixed audio); `--fps`, `--size`, `--from-bar/--to-bar` |
| `voice-check` | measure narration clips for clipping, glitches, silence, pace and flat delivery |
| `build` | write `build/film.html` |
| `review` | screenshot each shot, make contact sheets; `--size 400x800` for portrait, `--motion` to check shots animate |
| `audio-check` | render the score offline and report loudness, clipping, dynamics |
| `list` | list the projects in your workspace folder (default `~/filmstudio-projects`) |
| `serve` | open a local web page: a project picker for the workspace, and per project an editor for the storyboard, narration, preview and notes |
| `mcp` | run an MCP server (19 tools, the guide as resources) for agent tools that prefer native tool calls |
| `length <seconds>` | suggest `bars` and `bpm` for a target film length |
| `install-skill` | install the Claude Code skill; print MCP and `AGENTS.md` snippets for use from another repo |
| `doctor` | check this machine |
| `styles` | list the styles and variants |
| `guide [topic]` | print the agent guide |

Developing: `npm test` runs the fast checks (no browser). `npm run test:browser` tests export, the studio page, and the project picker and timeline (drag, undo, live updates, conflict notice). The last one, `test/timeline-ui.test.js`, drives Chrome over the DevTools protocol (Node 22 or newer) and skips itself if there is no browser. To run it in a browser that is already open with remote debugging (for example Arc on port 9223), open a tab and pass its DevTools address: `FILMSTUDIO_CDP_WS=ws://localhost:9223/devtools/page/<id> node test/timeline-ui.test.js`. Known flake: in headless Chrome about 3 runs in 40 fail because the browser cancels a request before it reaches the server (a bare page doing only fetches shows the same; the cause is not found). It did not happen in 11 runs in Arc. `npm run qa` draws every style and variant in a headless browser and reports errors and static shots.

## Voices

Narration is Kokoro by default: free, runs locally, slow on weak hardware (about 40 seconds per short clip on a phone). You can supply your own recorded audio, or use ElevenLabs (paid; set `ELEVENLABS_API_KEY`, add a `voiceId` to the spec; the tool shows the character count and waits for `--yes` before spending anything). The ElevenLabs path is tested against a local mock of the documented API, not the live service. If you use a cloned or celebrity voice, get the speaker's consent, and say the narration is AI-generated when you publish.

## An agent can't hear

The review tools can look at pictures and measure audio levels. They can't tell you whether the voice sounds good or the music moves anyone. A person has to listen. The guide tells agents to say this and to ask for timecodes of anything that sounds wrong.

## Roadmap

- more character options (hands, outfits, more animals, lip-sync from the audio itself)
- imported images and logos as shots; more variants of the styles above
- other scores, with length and key as settings

## License

MIT. Kokoro is Apache-2.0. Fonts load from Google Fonts when the film opens in a browser.
