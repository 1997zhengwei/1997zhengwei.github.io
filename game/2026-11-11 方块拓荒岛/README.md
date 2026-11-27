# 方块拓荒岛 / Skyblock Frontier

A complete local 3D exploration / resource gathering game, inspired by the mobile interaction loop of **My Little Universe**, with original voxel geometry and Minecraft themed actions. Approved source baseline **0.7.0**. GitHub delivery and Loopit draft status are recorded in SYNC_STATUS.md.

## Play

Double-click **启动试玩.cmd**, or run `python serve.py --open` from this folder.

Local address: <http://127.0.0.1:8898/> (the computer running the server).

- Drag anywhere on the scene to move. The joystick shows the direction. WASD / arrow keys also work.
- Stop near a tree, stone or crop to automatically harvest. Materials visibly stack on your back. When a deposit is exhausted, move outside its gathering range (2.2 units) to start its five-second recovery. Empty spots leave a small stump or rubble trace; GOAL can find another deposit. Waiting on the same spot does not regenerate it.
- Tap a floating frontier cost and stand on its ground pad to deliver the remaining materials. Payments persist. Ordinary planet pieces keep their light prices; 29 of the first planet's 642 pieces have a golden **★ KEY PIECE** label, a gold pad and a gold completed edge. These ask for four extra Wood, three extra Stone and two or three extra refined/special materials, using at most three ingredient types. There is no timer or penalty.
- Tap ground to walk there, a floating label to reach its pad, or the objective card to walk toward your next goal. Manual movement takes over immediately.
- The main game now starts directly on the spherical planet: **collect → repeat exchanges → pay for connected pieces → fill 642 cells → discover the ending**. You begin with an explorer kit, all renewable resource types and three trading stations. The old island campaign is retained for existing-save visits through the pause menu, and remains testable with `?qa=<name>&legacy=1`.
- Stone tools: ×2 collection and iron ore access. Iron tools: ×3 collection and obsidian access.
- Furnace: 2 Iron ore + 1 Wood → 1 Iron. Cow: 3 Wheat → 1 Emerald. Villager: 6 Wood + 6 Stone → 1 Emerald. The rotating **↻** marker and input → output recipe identify each exchange. Stand at the pad to process repeatedly while ingredients last; walk away to stop.
- Reach 100% to trigger the completion reveal. It supports skipping to the reward and replaying afterward. Claim once per completed planet: a voxel guardian companion, Diamond tools (+1 permanent collection yield) and 12 Emeralds. Rewards and claims persist across reloads; replay grants nothing extra. After claiming, NEXT PLANET creates a new layout with your backpack, tools and guardian. Planet-specific 25/50/75% bonuses start again; the permanent +1 remains.
- Completing the last piece now awakens four biome wonders, illuminated key-piece paths, star rings, an aurora and fireworks. Claiming opens a permanent **VIEW YOUR WORLD** panorama: drag to rotate, use the rotation buttons, replay the awakening or return to exploring. These wonders are completion scenery; material costs and rewards are unchanged.
- Existing saves enter the planet directly while preserving inventory, paid frontier cells and the original island data. A new adventure starts on the planet, without fabricating an island victory. The pause menu supports a confirmed restart.

All harvestable resources regenerate after departure. There is no limited stamina or finite resource budget. The pasture is optional: villager barter supplies all required emeralds. Tool upgrades and crafting are paid with real inventory.

## Implementation and verification

`world.mjs` defines the terrain, costs and resource tiers. `core.mjs` owns economy, collision, progression and persistence. `planet.mjs` and `models.mjs` render original game geometry with local Three.js; `app.mjs` handles actual pointer input, UI and the game loop. The compact map wraps around a curved planet and opens a shortcut through the ruins. `crafted-resources.mjs` shares detailed resource geometry and compact backpack samples. `planet-scenery.mjs` supplies water, coastal strata, atmosphere and instanced overview props. `guardian.mjs` supplies the original completion reveal and companion. `world-wonders.mjs` places the four biome wonders; `awakened-world.mjs` renders their completion-only scenery and bounded celebration effects. `globe.mjs` supplies the closed geodesic world and renewable economy; `frontier-art.mjs` and `frontier-ui.mjs` provide its renderer, camera and controls. Terrain is batched into a single mesh and distant resource props sleep. No runtime CDN, build step or network dependency.

Run `npm test` for economy, reachability, collision, recipe and end-to-end legal-action campaign tests. `autoplay.mjs` is a QA-only legal movement driver, enabled in the UI only by an explicit `?qa=<test-name>` URL. It uses a separate localStorage key; it cannot grant materials or teleport. Simulated time is accelerated in that QA mode, so its displayed completion time is **not** a measured human session length. Normal game speed is unaffected.

See [QA.md](QA.md) for actual browser evidence and limits. Reference evidence and exact scope are in [BRIEF.md](BRIEF.md). All player-facing principal copy is English.

## Attribution

Three.js (MIT): license and unmodified library files in `vendor/`. Nunito (OFL) and Lucide (ISC): local files and licenses in `assets/ui/`. Inventory thumbnails are rendered from the actual collectible models, not a hand-drawn SVG replacement. All game-specific source, geometry, model-derived resource icons and synthesized audio are created for this project. The reference game's artwork and source have not been copied. No official Minecraft affiliation is implied.

## Local → GitHub → Loopit

The user authorized this version's GitHub upload and Loopit draft integration on2026-11-11. Intended collection convention: a Chinese game folder under repository root `game/`. The local build is the gameplay and visual baseline for a later Loopit import, rather than a prompt to generate a different simplified game.

Current ending revision: [REVISION_V07.md](REVISION_V07.md). Current pacing revision: [REVISION_V06.md](REVISION_V06.md). Current art revision: [REVISION_V05.md](REVISION_V05.md). Main-flow revision: [REVISION_V04.md](REVISION_V04.md). Previous extension: [REVISION_V03.md](REVISION_V03.md).

Revision notes and reference limits: [REVISION_V02.md](REVISION_V02.md). The game is a Minecraft themed adaptation of the reference loop, not a reproduction of its original map or commercial character assets.
