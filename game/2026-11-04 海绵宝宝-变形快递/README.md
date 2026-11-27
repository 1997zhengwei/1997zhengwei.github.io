# Sponge Shift Express — delivery adventure

Local 3D refinement of the fourth SpongeBob prototype. Three districts, nine delivery stops, lane choices, enemies, active abilities and checkpoint upgrades.

## Run

From this game directory: `python -m http.server 8768 --bind 127.0.0.1`.
Open http://127.0.0.1:8768/ . No install or build is needed. Use HTTP, not a file URL.

## Play

- Auto-run; choose FLAT / 1 to duck pink bars, BALL / 2 to break mint foam, SPRING / 3 to automatically jump gaps. The first three tutorial gates wait for you.
- Left/right, A/D, arrow keys, swipes or the three route cards change lanes. Each lane can have a different obstacle. OPEN avoids the gate for 15 points; successful shape gates pay more and charge energy.
- Space / the ability button activates the current shape: Slip Dash gives speed and protection; Power Roll breaks solid obstacles and defeats enemies; Super Bounce makes a long high jump. A use costs 60 energy, reduced to 45 by an upgrade. Gates and spatulas refill energy.
- Jellyfish and Plankton bots have explicit warnings. Choose a DODGE lane, use Power Roll, or leap over them. Three hearts, with a clear failure/retry screen.
- Deliver to Patrick, Squidward and Gary in each district. Move into the marked delivery lane; the stop waits safely if needed. Choose a shield, magnet, efficient abilities or bonus tip. Each delivery gives 300 points, one heart and full energy, and saves a checkpoint.
- Each district contains 24 obstacle rows and three delivery stops, approximately 90–100 seconds of driving. A full run is about five minutes plus menu time. Retry restores the latest delivery checkpoint, score, pickups and upgrades; cumulative hits still affect the rating.
- Complete Jellyfish Fields, Goo Lagoon and Krusty Harbor. Express replay remixes lanes and pickups with bounded speed increases. These are variations of three districts, not unlimited new worlds.
- Pause / switching away stops the game. Mute is available. Only best score persists across page reloads; checkpoints last for the current run.

## Files and verification

`rules.mjs` contains simulation, `scene.mjs` contains Three.js rendering, `app.mjs` contains UI/audio, and `index.html` / `style.css` contain the responsive English interface. `node test-rules.mjs` runs the ten adventure regressions. Read `QA.md` for actual browser evidence and limitations.

Three.js and its MIT license are bundled in `vendor/`. Existing procedural character helpers, local geometry/textures and Web Audio are reused. Character IP is fan-game content; the library license does not license SpongeBob IP.

## Delivery scope

User-approved local game, being handed off to Loopit Lab on 2026-11-04. Stable repository path: games/sponge-shift-express on the existing games branch codex/krabby-patty-flip. The academic website and other games remain independent. See LOOPIT_HANDOFF.md and QA.md. Local test evidence does not assert platform acceptance or publication.
