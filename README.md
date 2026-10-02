# Space Attack

A Galaxian-inspired browser arcade game made with TypeScript and Phaser. Defend Earth against an alien invasion: enemy fleets breach orbit through a persistent wormhole in the top-left corner. It swells as each wave deploys, then contracts to its idle size after the aliens have arrived. Enemies emerge one by one and fan out into formation before attacking. The future of humanity is in your hands.

All game artwork is bundled as smooth SVG illustrations and rasterised at double resolution by Phaser, with no image downloads required. Aliens have shaded bodies and expressive faces; the player ship has cockpit glass, gentle banking, and an animated engine plume above a subtle Earth horizon. Player and alien missiles have distinct shaded bodies and glowing tips, without exhaust trails. Instructions use larger, higher-contrast text with a stacked layout on smaller screens.

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

The playfield is 1200 × 720 and scales to the available screen width. You have three shields and a brief immunity period after taking damage. Diving enemies award bonus points. Wave 1 starts gently with 12 aliens; the first six waves have 12, 14, 21, 24, 32, and 36 enemies. Counts grow to a maximum of 50, while movement, diving, and firing become faster.

Four silhouettes have distinct flight profiles: scouts, slower weaving crabs, fast wide-sweeping mantas (wave 2 onward), and squids (wave 4 onward). Formations sway sideways, with individual aliens weaving within them. Mantas and squids sweep across the playfield during attacks and bounce at its edges; some scouts and crabs also sweep. Enemies that escape below the player re-enter above the screen and visibly descend back into formation.

Species and armour are independent: wave 3 introduces two-hit orange enemies; wave 5 introduces three-hit green enemies. Colours always indicate remaining health: green → orange → red → destroyed. Best scores are saved locally when available. Sound is optional and starts muted.
