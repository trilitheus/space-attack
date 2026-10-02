# Space Attack

A Galaxian-inspired browser arcade game made with TypeScript and Phaser. Defend Earth against an alien invasion: enemy fleets breach orbit through a persistent wormhole in the top-left corner. It swells as each wave deploys, then contracts to its idle size after the aliens have arrived. Enemies emerge one by one and fan out into formation before attacking. The future of humanity is in your hands.

The campaign has **10 levels**. Survive nine invasion waves, then defeat the alien overlord and its escorts in the final battle to save Earth.

All game artwork is bundled as smooth SVG illustrations and rasterised at double resolution by Phaser, with no image downloads required. Aliens have shaded bodies and expressive faces; the player ship has cockpit glass, gentle banking, and an animated engine plume above a subtle Earth horizon. A sparse, dim star field drifts slowly in three layers behind the action. Player and alien missiles have distinct shaded bodies and glowing tips, without exhaust trails. Instructions use larger, higher-contrast text with a stacked layout on smaller screens.

## Requirements

- **Node.js 24 LTS**, including npm, is recommended. This project was built with Node.js 24.13.1 and npm 11.8.0. The installed Vite version requires Node.js 20.19+ or 22.12+; Node.js 18 is too old.
- **Git** to clone the repository, or download and extract its ZIP from GitHub.
- A modern browser with JavaScript enabled, such as Chrome, Firefox, Safari, or Edge.
- Internet access for the initial dependency installation. No backend, database, API keys, or environment variables are needed.

## Run on Linux

Install Node.js 24 with npm using the [official Node.js download instructions](https://nodejs.org/en/download) for Linux. Install Git using your distribution's package manager or the [Git Linux instructions](https://git-scm.com/install/linux).

Open a terminal and run:

```bash
node --version
npm --version
git clone https://github.com/trilitheus/space-attack.git
cd space-attack
npm ci
npm run dev
```

Open **http://localhost:5173/** in your browser, or use the Local URL printed by Vite if that port is already in use. Leave the terminal running while you play. Press **Ctrl+C** to stop the server.

## Run on Windows

Install Node.js 24 using the Windows installer from the [official Node.js download page](https://nodejs.org/en/download), keeping npm and the PATH option enabled. Install [Git for Windows](https://git-scm.com/install/windows), then open a new **PowerShell** or **Command Prompt** window so it picks up the installed commands.

Run the following in either shell. Using `npm.cmd` also avoids PowerShell's script execution policy blocking `npm.ps1`.

```powershell
node --version
npm.cmd --version
git clone https://github.com/trilitheus/space-attack.git
cd space-attack
npm.cmd ci
npm.cmd run dev
```

Open **http://localhost:5173/** in your browser, or the Local URL printed by Vite. Keep the terminal open while playing. Press **Ctrl+C** to stop the server; Command Prompt may also ask you to confirm termination.

## Run on macOS

Install Node.js 24 using the macOS installer from the [official Node.js download page](https://nodejs.org/en/download). Install Git using the [Git macOS instructions](https://git-scm.com/install/mac), then open a new **Terminal** window.

```bash
node --version
npm --version
git clone https://github.com/trilitheus/space-attack.git
cd space-attack
npm ci
npm run dev
```

Open **http://localhost:5173/** in Safari or another modern browser, or use the Local URL printed by Vite. Leave Terminal running while playing, and press **Ctrl+C** to stop the server.

### If you already have the project

Skip the `git clone` step and change into your existing `space-attack` folder instead. If you downloaded a ZIP, extract it first and open a terminal in the extracted folder containing `package.json`.

Run `npm ci` once to install the versions recorded in `package-lock.json`, and again after pulling changes to that file. For later play sessions, just run `npm run dev` from the project folder. On Windows, use `npm.cmd` in place of `npm` in these instructions.

## Build and preview the production version

From the project folder, with dependencies installed:

```bash
npm run build
npm run preview
```

The build checks TypeScript and writes the production website to **`dist/`**. Preview normally serves it at **http://localhost:4173/**; use the URL printed in the terminal. On Windows, run `npm.cmd run build` and `npm.cmd run preview`.

To publish the game, upload the contents of `dist/` to a static web host. The preview command is for checking the build locally. Serve the game over HTTP rather than double-clicking `index.html`.

## Troubleshooting

- **`node`, `npm`, or `git` not found:** install the missing tool and reopen your terminal. Check `node --version` and `npm --version` before installing dependencies.
- **Unsupported Node.js version:** install Node.js 24, reopen the terminal, and run `npm ci` again.
- **PowerShell says scripts are disabled:** use `npm.cmd` as shown above, or run the commands in Command Prompt.
- **`package.json` cannot be found:** change into the project folder before running npm commands.
- **Port 5173 is occupied:** Vite chooses another available port. Open the Local URL it prints, or request one explicitly with `npm run dev -- --port 5174`.
- **Dependency installation fails:** check your internet connection and access to the npm registry, then retry `npm ci`.
- **Changes are not visible:** keep the dev server running and refresh the page. Use a hard refresh if the browser has cached an older version.

## Play

- Arrow keys or W/A/S/D: move horizontally and vertically
- Space: fire (hold for continuous fire)
- Enter: start, restart, or resume
- P or Escape: pause/resume
- On-screen directional buttons and a fire button provide touch controls on small screens

The playfield is 1200 × 720 and scales to the available screen width. You can evade in all directions within its bottom third; the ship and its engine remain inside the screen. Diagonal input is normalised to prevent a speed boost. You have three shields and a brief immunity period after taking damage. Diving enemies award bonus points.

Choose **Easy**, **Medium**, or **Hard** on the start or game-over screen before launching. Difficulty stays fixed during a mission and is shown beside the wave number in the HUD.

| Difficulty | First-wave aliens | Enemy speed | Attack frequency |
| --- | --- | --- | --- |
| Easy | 10 | 80% of Medium | Less frequent |
| Medium | 12 | Original balance | Original balance |
| Hard | 14 | 125% of Medium | More frequent |

Enemy movement, dives, sweeping attacks, and missiles all follow the selected difficulty. Every mode retains three shields and introduces two-hit enemies on wave 3 and three-hit enemies on wave 5. Enemy counts and speeds increase across waves, with counts capped at 50. On Medium, the first six waves have 12, 14, 21, 24, 32, and 36 enemies.

### Final boss and victory

Level 10 features a large alien overlord defended by two rows of regular aliens. The boss enters through the wormhole, sweeps across the upper playfield, and fires aimed missile fans. Its health bar shows exactly how many hits remain: **24 on Easy, 36 on Medium, and 48 on Hard**. Each player missile removes one health point. Below half health, the boss fires wider, more frequent volleys.

Defeating the boss immediately ends the invasion, clears the remaining threats, and awards **5,000 bonus points**. The victory screen congratulates you for saving Earth, and a victory jingle plays when sound is enabled. There is no level 11. Choose a difficulty and click **PLAY AGAIN**, or press Enter, to start a new campaign from level 1.

Four silhouettes have distinct flight profiles: scouts, slower weaving crabs, fast wide-sweeping mantas (wave 2 onward), and squids (wave 4 onward). Formations sway sideways, with individual aliens weaving within them. Mantas and squids sweep across the playfield during attacks and bounce at its edges; some scouts and crabs also sweep. Enemies that escape below the player re-enter above the screen and visibly descend back into formation.

Species and armour are independent. Colours always indicate remaining health: green → orange → red → destroyed. Best scores are saved locally for each difficulty when storage is available. Existing best scores from before the difficulty picker are retained under Medium.

Sound starts muted; click **SOUND OFF** in the game HUD to enable it. Layered effects distinguish player and alien weapons, armour impacts, explosions, shield damage, launch, wormhole waves, and sector clears. Losing your last shield plays a defeat jingle with a descending minor melody; saving Earth plays a triumphant victory jingle. Both respect the sound toggle, and restarting stops the previous ending's audio. Sounds are synthesised locally using Web Audio, with controlled volume and slight pitch variation for repeated effects. There are no audio downloads or background music. Muting or pausing stops currently playing effects.

## Development checks

```bash
npm test
npm run build
```

On Windows, use `npm.cmd test` and `npm.cmd run build`. The campaign tests use Node.js 24 and exercise the actual scene logic with rendering and input stubs: progression through all 10 levels, boss damage and health display, victory, defeat, difficulty settings, and restarting. They also check boss volleys and the generated victory audio. Browser rendering and play feel still need manual play-testing.
