# Bikini Bottom: Tiny Trouble

Local 3D playground, expanded 2026-11-04. Preserves the three procedural character models from `quiet-party-operation`, while replacing stealth with building and playful physical interactions.

## Run

From this game directory: `python -m http.server 8768 --bind 127.0.0.1`

Open http://127.0.0.1:8768/ . No build step, network assets, package install, or account required; Three.js is vendored with its license.

## Play

- Build: drag a toy onto sand, or choose a toy then tap the ground. Drag an existing toy or character to reposition it. Rotate directional toys, stack up to four boxes, remove, and undo.
- Play: select SpongeBob, Patrick or Squidward. Tap the ground, use WASD/arrows, or drag the on-screen stick. Space/Jump hops. Close view follows the active character; Area view shows the bounded park or a wider region of DIY.
- Fourteen toys: wave slide, spiral slide, jump slide, trampoline, fan, bubble lift, slide, box, Krabby Patty, cannon, conveyor, geyser, paired portals and dance floor. A fixed pool is part of the scene. Slides/Classic/New tabs keep the palette compact.
- Uncontrolled Patrick follows patties; SpongeBob wanders; Squidward seeks his quiet spot and relocates after a strong disturbance. Mass affects fan and box responses.
- Eight optional discoveries provide ideas without gating free play. Three different toy types within seven seconds form a chain. Layout, character start positions and discoveries save on this browser/device. Reset action restores the saved arrangement.
- Scene ideas offers Slide Carnival, Splash Lab, Portal Parade, Patrick Express and the classic scene. The first pre-switch build is stored in My layout; Save current replaces that slot deliberately. Scene loading is undoable during the session.
- Sound starts muted. The music-note button enables short synthesized interaction sounds. No music track is included yet. Pause, blur and hidden-tab states pause simulation.

## Scope

Park uses a 32 × 28 play area and allows 64 toys. Endless DIY has no fixed park boundary or fixed toy-count cap: nearby terrain/model regions stream with the camera, while distant props sleep. Device memory, GPU capacity, floating-point precision and browser storage still impose practical limits. Custom arcade physics is not a general rigid-body simulation or survival/resource sandbox. Discoveries are optional rather than a campaign. This is the user-approved V3 source release prepared for GitHub and Loopit Lab integration. Platform results are tracked separately from local QA.

Use `?qa=1` for an isolated browser test save. Park and DIY have separate saves. Normal tabs still share those local saves; avoid concurrent editing across them. Character construction illustrations and the full development record live in `docs/tutorials/bikini-bottom-tiny-trouble` at the workspace root. `character-lab.html` is an additional model viewer for explanation.

## Files

`slides.mjs` shares one path for slide geometry and riding; `building.mjs` fits full rides inside Park boundaries. `rules.mjs` contains deterministic gameplay, `scene.mjs` the 3D scene, `app.mjs` UI/input/save/audio, `characters.mjs` the retained character models, and `world.mjs`/`polish.mjs` shared rendering helpers.

Run mechanics checks with `node --test rules.test.mjs v3.test.mjs` from this directory. Browser verification is recorded separately in QA.md.

## V3 building controls

Choose Park or Endless DIY at the top. In Build, drag empty ground or use WASD/arrows to pan; +/− zoom and the home icon returns to origin. Bring friends moves character starting positions to this area. Select a toy and tap the ground; drag existing toys with the original grab offset, rotate, remove or undo. Yellow steps start all three new rides.

Scene ideas → Export layout downloads JSON; Import layout validates it for the current realm and can be undone. Layout, starting positions, discoveries and build focus persist. Far-away layouts belong in DIY. New scene presets preserve the first custom build in My layout.

## Guides and handoff

See [PLAY_GUIDE.md](PLAY_GUIDE.md) for the Chinese step-by-step player guide and [LOOPIT_HANDOFF.md](LOOPIT_HANDOFF.md) for the source integration contract. Visual references are in docs/reference/. Character designs are from SpongeBob SquarePants; this fan prototype implements procedural geometry in code and does not claim official affiliation. Bundled Three.js carries its own license.
