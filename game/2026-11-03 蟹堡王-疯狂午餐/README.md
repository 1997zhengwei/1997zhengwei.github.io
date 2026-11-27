# Krusty Krab: Lunch Gone Wild

A self-contained 3D SpongeBob kitchen game. Cook patties, assemble burgers, serve customers and learn trick deliveries while Patrick, Plankton and Squidward cause lunch-time surprises.

## Run

Serve this directory with a static HTTP server and open `index.html`. No build step, package installation, API key or external asset requests. Three.js 0.186.0 is bundled in `vendor/` with its MIT license. Procedural character meshes and materials are local source code; sound effects are synthesized with Web Audio.

## Controls

- Tap a workstation or order ticket to walk there and interact; or move with the joystick / WASD / arrows.
- The yellow context button / E cooks, takes a patty, assembles, serves, recovers a dropped burger, feeds Patrick or catches Plankton.
- First order has no patience timer. Gold path and a single current instruction teach Cook → Make → Serve.
- After the first order, hold Toss / Space and release to throw. Slide horizontally on Toss to switch targets, or use 1/2/3. A short hold gives a perfect catch; holding too long risks a recoverable miss.
- Stand on the blue pad before tossing for a visible bounce bonus. Dash / Shift gives a burst of speed.
- Complete 4, 6 and 8 orders across three rushes, choosing upgrades between them. Finish lunch, then optionally continue endless overtime.
- Five reputation hearts; leaving customers and escaped Plankton cost hearts. Pause freezes the simulation. Restart begins a fresh run; sound preference persists.

## Checks

`node test-rules.mjs`

See `QA.md` for actual verification scope and `LOOPIT_HANDOFF.md` for source integration. Publication and platform checks are recorded separately.
