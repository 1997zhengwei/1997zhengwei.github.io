# v0.5.0 art acceptance · 2026-11-11

Normal local preview: http://127.0.0.1:8898/?v=5 (the computer running the server).

## Preserved gameplay

`npm test`: **34/34 passed**. SHA-256 comparison with `qa/source-manifest-v04.json` confirms `core.mjs`, `world.mjs`, `globe.mjs`, `frontier-pilot.mjs` and `autoplay.mjs` are unchanged. No economy, collision, unlock, reward, migration or save-schema changes were made. New files are renderer helpers, plus a save-free art review page.

## Browser checks

- Saved a real v0.4 game view at the 30-cell checkpoint, then viewed the revised assets at the same stage. Automatic regrowth/harvesting between reloads means inventory and depletion are not claimed to be frame-identical.
- Reviewed all four scene models and all seven resource icons in `qa/art-review.html`. The page imports actual game geometry and icon rendering; it never reads or writes game progress. It is an asset sheet, not a gameplay screenshot. A deprecated shadow-map option in this review page was replaced before the final sheet.
- At an actual 390×780 game viewport, verified all seven HUD images have natural dimensions **192×192** and a **25 px** displayed footprint. Looked at the tree/ore/stone/crystal silhouettes, mixed backpack and coastline in a real running scene.
- The isolated public legal-action planner completed planet 1 at **642/642**, reporting 3557 simulated seconds for that phase. Actual native buttons claimed the completion reward and entered planet 2 without rendering errors. No materials or land were granted by QA.
- After adding shared distant props and fixing overview illumination, the same isolated planet 2 completed at **642/642** (3083 simulated seconds for its phase). Reload → Skip reveal → Claim → whole-planet overview verified the final scene, including its instanced forest, clouds and outline. These accelerated durations are not human playtime measurements.
- The normal user preview retained **40/642 cells (6.2%)**, player location and resource balances while navigating from `?v=4` to `?v=5`. Wood403 / Stone172 / Ore128 / Iron8 / Emerald4 remained; Wheat and Obsidian continued to increase through ordinary auto-harvest while standing. No normal-save reset or test inventory was used.
- Fresh main-game console inspection returned no errors/warnings. The normal preview remains open. Agent-created QA/review tabs were closed and viewport overrides reset.

## Files

- `qa/v05-before.jpg`: pre-edit 30-cell checkpoint, actual v0.4 capture.
- `qa/v05-user-before.jpg`: the user's original view before updating its tab.
- `qa/v05-user-after.jpg`: the user's 40-cell map with v0.5 art, actual default viewport **706×686**.
- `qa/v05-resource-review.jpg`: final close-up sheet of the actual meshes and 25 px icons.
- `qa/v05-complete-globe-final.jpg`: actual final v0.5 whole-planet overview, after legal completion (contains completion HUD text).
- `qa/v05-complete-globe.jpg`: earlier v0.5 overview before illumination/distant-prop improvements; historical only.

## Limits

Phone-sized browser layout was tested; physical phone GPU/battery, frame rate and sustained memory usage were not measured. Geometry sharing/instancing is implemented but is not a measured device-performance claim. Sound and the unchanged reward economy were not redesigned. No remote publication occurred. Prior acceptance: QA-v04.md.
