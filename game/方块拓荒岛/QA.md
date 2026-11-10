# v0.7.0 visual and ending acceptance · 2026-11-11

## Rules and scope

`npm test`: **39/39 passed**. SHA-256 equality with v0.6 verified for globe.mjs, core.mjs, world.mjs and frontier-pilot.mjs. Four wonder sites were checked on planets1,2,9,91: distinct valid cells with matching biomes. This revision changes complete-world scenery, ending presentation and panorama input, not the economy or save schema.

## Actual browser play

- A fresh isolated `?qa=v07-awakening` save started at19/642 with zero materials. The public legal-action planner completed642/642 on planet1, reporting3943 accelerated simulated seconds. It used real gathering, recipes and paid construction; no grants or teleports. This duration is not measured human playtime.
- Completion automatically ran the camera pullback and revised ending. Native reward claim produced one guardian, Diamond tools and12 Emeralds, then opened the world panorama. The four wonders, extra biome scenery, aurora, orbital rings and fireworks rendered without errors.
- Dragging the actual canvas changed the globe orientation while remaining in the panorama. Native rotation button was also exercised. Back to exploring restored the normal scene and HUD. At100%, VIEW YOUR WORLD and replay stayed available.
- Native replay → Skip → Admire → Back to exploring left Emerald12 and the achievement counter at1 world. Wood and ore increased through ordinary harvesting during normal-scene pauses between views; those were not reward changes. Replaying does not add currency or stars.
- Reloading `?qa=v07-awakening&view=world` reconstructed the actual claimed panorama from the isolated save, hid QA controls and granted nothing. This query does not create a filled world in a new browser without the earned saved state.
- Tested the panorama, rotation button, replay and ending card at an actual390×780 viewport. No horizontal overflow. The ending return/claim control measured312×43px atx39,y690, fully inside the780px viewport and returnedtrue for a center-point hit-test. The full default1280×720 panorama was checked after restoring the viewport override; the globe framing was widened slightly to give its landmarks and footer more room.
- Console inspections of normal play and the full-world demo returned no errors or warnings. The viewport override was reset. Normal preview and completed-world demo remain open as deliverables.
- Normal user save migrated from?v=6 to?v=7 with66/642 cells and all seven visible resource values retained: Wood313, Stone178, Ore155, Iron3, Wheat2167, Emerald1, Obsidian2636. The QA world never replaced the normal storage key.

## Evidence

- qa/v07-world-panorama.jpg — final actual completed-world panorama at1280×720.
- qa/v07-awakening-reward.jpg — actual first completion achievement/reward card.
- qa/v07-world-phone.jpg — actual390×780 panorama after using a native rotation button.
- qa/v07-reward-phone.jpg — actual390×780 replay ending card and return control.

## Limits

Phone layout was checked in the browser; physical phone GPU, battery and frame rate were not measured. The synthesized celebration cues were wired and ran without browser errors; listening quality was not assessed. Reduced-motion behavior was reviewed in source, not exercised through an operating-system preference change. The small final desktop framing adjustment did not change mobile width framing. No remote publication occurred.
