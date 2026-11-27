# Tiny Raft, Big Storm

A compact 3D survival sandbox. Hook drifting wood, rope and scrap; expand a four-tile raft into a nine-tile home; add a collector net, storm braces and a working sail; survive four waves and sail toward the lighthouse.

## Run

Serve this directory with `python -m http.server 8768` and open the server URL. ES modules require an HTTP server. No npm install, build, API key or external CDN is needed. Three.js 0.186.0 is bundled under `vendor/` with its MIT license. `node test-rules.mjs` checks the resource and progression rules.

## Controls and progression

- Tap a labeled floating supply to cast the hook. The character moves toward the relevant raft edge; the supply travels along the hook line into the inventory. Tap deck boards to walk, or use WASD / arrow keys. Movement is bounded by the actual current deck footprint.
- Deck: 3 wood; expands four tiles to nine and raises hull capacity from 100 to 125.
- Catch net: 3 wood + 2 rope; collects 2 wood and 1 rope every 6 active seconds during gathering.
- Braces: 3 wood + 2 scrap; reduces each wave hit from 36 to 14 hull.
- Sail: 2 wood + 2 rope, requires a deck; enables travel after the storm.
- Start the storm when ready. Four waves arrive at 4/8/12/16 seconds; the sea calms at 18 seconds. Repair for 2 wood restores 30 hull. An unprepared raft fails on wave three.
- Survive, finish a sail if needed, and choose Raise sail. A brief actual scene movement ends the voyage. Replay resets materials, structures, hull, camera and timers.

## Implementation and scope

This is a real WebGL scene with procedural 3D models, perspective-independent orthographic camera, lighting, shadows, a deformed ocean surface, moving sail cloth and mesh-based character animation. The wave damage and build rules are deterministic game mechanics, not a fluid or structural physics simulation. Facilities occupy authored slots; the first draft does not include arbitrary free placement, a large open world or a hunger system.

Pause freezes progress and resumes with a new clock baseline. Sound is optional and synthesized. Input, resource costs, build effects, storm failure priority and replay are separated in `rules.mjs`. Visual effects do not award resources or decide survival.

The first-pass art is a cohesive miniature-diorama style created from code. No paid assets, private images or remote services are required. Local and GitHub delivery do not certify Loopit-hosted behavior. See `QA.md` and `LOOPIT_IMPORT.md`.

Suggested recommendation: **Hook supplies, grow your tiny raft, and build the sheltering strength to survive a storm and reach the lighthouse.**
