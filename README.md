# Space Attack

A Galaxian-inspired browser arcade game made with TypeScript and Phaser 3. All game artwork is drawn procedurally, with no image downloads required.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` checks TypeScript and creates the production site in `dist`; `npm run preview` serves that build.

## Play

- Left/right arrows or A/D: move
- Space: fire (hold for continuous fire)
- Enter: start, restart, or resume
- P or Escape: pause/resume
- On-screen buttons provide touch controls on small screens

You have three shields and a brief immunity period after taking damage. Diving enemies award bonus points. Waves become faster and larger. Wave 3 introduces two-hit orange enemies; wave 5 introduces three-hit green enemies. Colours always indicate remaining health: green → orange → red → destroyed. Best scores are saved locally when available. Sound is optional and starts muted.
