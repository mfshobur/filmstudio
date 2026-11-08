# 10 Characters (optional)

Characters are **optional**. Most scenes should not have one unless the story needs a person, mascot or narrator figure. A film can use none, some shots, or all shots. If the user does not mention characters, do not add them.

A character is plain data in `spec.characters`. Nothing is locked: describe the look the project needs. Then use it in `stage` shots.

## Define a character
```json
"characters": {
  "mira": {
    "type": "human",            // human | robot | blob | stick | animal
    "skin": "outline",          // outline | flat | paper | silhouette | glow | sketch
    "hair": "bob",              // none | bob | spiky | long | bun   (human only)
    "ears": "cat",              // cat | bear | rabbit               (animal only)
    "face": { "eyes": "round", "blush": true, "brows": true },   // eyes: round | dot | anime | sleepy
    "accessories": ["glasses"], // glasses | hat | scarf
    "build": { "height": 1, "head": 1.1, "body": 1, "limb": 1 }, // multipliers
    "palette": { "skin": "#f2c9a0", "hair": "#3a2a2a", "top": "#e76f51",
                 "bottom": "#264653", "shoes": "#2b2d42", "accent": "#ffd166", "eyes": "#3a86ff" }
  }
}
```
- `type` is the body plan. `skin` is how it is drawn, and is independent: the same body can be a cartoon (`outline`), a paper cut-out (`paper`), a shadow-puppet (`silhouette`), a neon wireframe (`glow`) or hand-drawn (`sketch`). Match the skin to the film's mood and to the background style.
- Choose the look from the user's brief (age, mood, culture, brand colours). Do not reuse the same character design in every film.

## Use it: a `stage` shot (the optional style)
Shots take a 5th element with params:
```json
[5, 7, "stage", "scene", {
  "background": ["paper", "land1"],
  "cast": [
    { "char": "mira", "x": -0.5, "action": "talk", "emotion": "happy", "say": true },
    { "char": "bolt", "x": 0.5, "action": "think", "emotion": "thinking", "flip": true }
  ],
  "props": [ { "type": "bubble", "text": "why?", "x": -0.45, "y": -0.75 } ]
}]
```
- `background`: any other style/variant, drawn behind the cast.
- `cast[]`: `x` is across the screen (-1 left to 1 right), `scale`, `flip` to face left, `walkTo` for a walk across the shot (the action becomes `walk` automatically), `say: true` makes the mouth move **while narration is playing**, `look` (-1..1) moves the eyes.
- actions: `idle walk wave point think celebrate talk`. emotions: `happy sad surprised thinking angry neutral`.
- props: `bubble` (text), `bulb` (`on`), `qmark`, `heart`, `star`, `arrow`.

## Tips
- Two characters per shot is plenty; keep 3 as a maximum.
- Give each shot one clear action. Change the action or emotion when the story beat changes.
- A character looking small is fine; use `scale` 1.2 to 1.5 for close-ups.
- Silhouette characters read best on bright or paper backgrounds; glow characters on dark ones.
- Run `filmstudio review` and check hands, ears and faces at each skin; report anything odd to the user.

## Limits
These are stylised puppets, not realistic people or animation-studio rigs. No hands/fingers yet, no hair physics, limited costumes. Say so if the user asks for realism.
