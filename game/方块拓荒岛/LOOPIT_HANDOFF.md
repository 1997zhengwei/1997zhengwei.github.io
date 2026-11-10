# Skyblock Frontier · 方块拓荒岛 · Loopit source handoff

Approved source baseline: **v0.7.0** (2026-11-11). User explicitly authorized GitHub `main`, `game/方块拓荒岛/`, and a Loopit draft. No public exhibition/review submission is requested.

## Import exact source

This is a working original Three.js browser game, not a request to regenerate a simpler game from a screenshot. Copy the supplied modules and assets. Entry is index.html; static ES modules with an import map, no local build/install required. If Loopit requires bundling, adapt imports/entry/assets in its supported pipeline, keeping the rule and art modules. Do not iframe GitHub Pages or localhost. SOURCE_BUNDLE.json contains the UTF-8 runtime files plus fixed-commit asset download URLs and SHA-256 values. Both vendor/three.module.js AND vendor/three.core.js are required, plus Nunito.ttf and local SVG UI icons. Keep licenses.

Main modules: app.mjs, globe.mjs, core.mjs, world.mjs, frontier-pilot.mjs, autoplay.mjs, frontier-art.mjs, frontier-ui.mjs, crafted-resources.mjs, models.mjs, planet.mjs, planet-scenery.mjs, world-wonders.mjs, awakened-world.mjs, guardian.mjs, sound.mjs, style.css. Keep every module, including the preserved original-island support used by existing saves. No remote game art, music service, login, server backend or online gameplay dependency.

## Must preserve

1. Normal entry starts directly on a real closed geodesic sphere: 642 cells, 19 starting cells, five renewable raw resources, three exchanges. Drag/tap ground to walk; approach resources for automatic gathering. Camera parallel-transports across poles. Water and solid resource collision remain real. Principal player copy is English; Minecraft-style original voxel geometry and seven clear 3D resource icons remain.
2. Cost labels show the remaining items. Tap a border price, reach its glowing pad and pay from the actual backpack; each piece builds once. Partial contributions persist. GOAL routes to materials or construction. Raw inputs are available from the beginning. No stamina, bag-capacity penalty, combat or paid upgrade tree.
3. Depletion waits until the explorer leaves a2.2-unit radius before starting five-second recovery, including wheat. Staying on the same exhausted spot cannot farm indefinitely. Keep the depletion toast, stump/rubble, recovery hint and GOAL fallback. Solid props cannot respawn around the explorer.
4. Ordinary prices stay light. Planet1 has29 golden key pieces, first at depth4: ordinary base cost plus4 Wood,3 Stone and2–3 special items, at most3 ingredient types. Keep the gold star label, pad, completed rim and completion toast.
5. Repeatable ↻ exchanges:2 Ore+1 Wood→1 Iron,3 Wheat→1 Emerald,6 Wood+6 Stone→1 Emerald. Actual recipe payment, processing timer, stop on missing inputs. Every25/50/75% coverage improves gathering and trade speed for free.
6. Actual642/642 completion: pullback → four biome wonders awaken → voxel guardian → World Builder achievement card. Rewards once per planet:12 Emeralds, a guardian and Diamond tools granting permanent+1 yield. Replay/Skip must work without extra currency/stars. NEXT PLANET creates a different complete sphere and retains inventory/guardian/tool benefit; coverage bonuses restart.
7. The completed-world panorama has the Heartwood Sanctuary, Sun Temple, Amethyst Citadel and Winter Crown, village/garden/peak scenery, gold key paths, atmosphere, star rings, aurora and bounded fireworks. These are completion scenery, not new interactive buildings. Keep VIEW YOUR WORLD, actual drag-to-rotate yaw/pitch, rotation buttons, back to exploring and replay. Preserve the bright voxel art and complete-world framing; do not replace it with a flat circular island.
8. Autosave schema4, normal and QA key isolation, old saves, pause/help, confirmed restart, sound toggle, background pause, safe-area layout and reduced-motion behavior. Never start normal players with granted land/materials. Normal entry hides QA. ?qa=<isolated-name> exposes a legal planner (walking/gathering/recipes/payment, no grants or teleports) for validation only.

## Acceptance on Loopit

Local:39 rule tests passed. Actual browser legal run reached642/642 from zero materials; reward, replay without duplicate currency, panorama rotation, reload, and actual390×780 layout checked. QA.md gives exact scope; these are not human completion-time or phone-performance claims. Compare qa/v07-world-panorama.jpg and qa/v07-world-phone.jpg with the platform render.

Verify actual completed platform output: normal initial19/642 and no QA → touch movement and automatic harvest → depletion/no idle regrowth → GOAL/cost delivery with exact budget → ↻ exchange → partial-save reload → pause and confirmed restart. In an isolated QA URL run30-cell checkpoint then full642, verify the four-wonder ending, claim once, rotate panorama, replay, next planet and restart. Check actual embedded host plus portrait390×780 and400×580. A generation report is not proof of these checks. Report exact source commit, runtime files copied, compatibility changes and any missing files. Add no unrelated Power or music during this first import.
