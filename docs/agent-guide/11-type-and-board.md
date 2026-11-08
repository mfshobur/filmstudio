# 11 Kinetic typography (`type`) and whiteboard (`board`)

Unlike the first nine styles, these two take their content from the storyboard, so they fit any subject. They need a 5th shot element with params (`validate` tells you what is missing).

## `type` : words animate on the beat
`[5, 6, "type", "words", { "text": "Ask bigger questions", "emphasize": [2] }]`
- variants: `words` (one big word at a time), `stack` (lines build up word by word), `wave` (letters ripple), `focus` (current word big, earlier words echo behind).
- params: `text` (required), `palette` `{bg, fg, accent}` (defaults to dark navy, bone, ember), `font` `serif` | `sans` | `mono`, `emphasize` (zero-based word indexes drawn in the accent colour), `perBeat` (beats per word; default 0.6; set 1 to 1.5 for slow, weighty reads).
- Use for: the key message, a statistic, a quote, a title. Keep to 3 to 9 words. Pair with narration that says the same words, or use it silently as a beat of pure text.
- A light `palette.bg` (like `#f7f4ea`) gives a calm printed look; dark gives drama.

## `board` : hand-drawn whiteboard
`[7, 9, "board", "icons", { "title": "How a good idea grows", "items": [ {"icon":"bulb","label":"idea"}, {"icon":"book","label":"learn"} ] }]`
`[9, 11, "board", "equation", { "title": "A tiny proof", "text": "2 + 2 = 4\nso 4 - 2 = 2" }]`
- `icons`: items are drawn one after another with a marker, each with a handwritten label. Icons: `bulb heart house book rocket chart person tree cloud star gear check`. 2 to 6 items fit well.
- `equation`: lines of text are written out one by one; the last line gets an underline in the accent colour. Separate lines with `\n`.
- Optional `title` (written first), `palette` `{bg, ink, accent}`.
- Use for: steps, lists, definitions, simple maths, "how it works" in plain language.

## Timing
Items appear evenly across the shot by default. Give them room: about 1.5 to 2 beats per icon or per word group. If a shot feels rushed, make it longer or reduce items.

## With characters
`board` and `type` can be a `stage` background? No: `stage` backgrounds take the original nine styles. Use `type`/`board` as full shots between character shots.
