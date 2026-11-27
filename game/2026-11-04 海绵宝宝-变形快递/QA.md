# Adventure QA — 2026-11-03

Entry: http://127.0.0.1:8768/sponge-shift-express/ . This report supersedes the six-gate/slow-motion version; that report and source remain in the pre-adventure backup zip.

## Real browser tests

Used the connected in-app browser and visible controls/DOM cues only. No hidden game state mutation, direct function calls or accelerated clocks.

- Started at 390×780, passed the waiting shape tutorial, viewed real per-lane foam/bar/gap alternatives and active ability feedback.
- Delivered the first order and chose shield. A subsequent natural failure exhausted hearts. Retry restored 1/9 completed deliveries, 1,705 points, 11 spatulas, three hearts and the delivery checkpoint (next obstacle 22m away), rather than restarting the district.
- Added explicit enemy cues after the initial run exposed insufficient HUD warning. DODGE/ENEMY lane cards now identify the next threat when it comes before the next gate.
- Reloaded the revised game and completed all three districts and all nine orders using shape/lane controls, delivery upgrades and district transitions. Final visible result: **19,665 points, 204 spatulas, 9/9 deliveries, four cumulative hits, 4:50 driving time**. This was a browser playthrough, separate from the rule simulation.
- Chose magnet then efficient abilities at delivery stations; the visible ability cost changed from 60 to 45. Chose district shields. Received delivery healing and energy refill. Pause/resume exercised repeatedly.
- Power Roll activation and energy consumption exercised in the initial run. Super Bounce activation/energy consumption and visual jump feedback exercised in Express replay. All three powers' collision/movement rules have automated coverage; Slip Dash was not separately timed in the UI.
- Express result button reset score/pickups/deliveries/hearts and changed the first row from the guided FLAT tutorial to mixed BALL / SPRING / OPEN choices. Played the remixed opening again.
- Checked 390×780 and 400×580. No horizontal overflow at 400×580; control panel ends at viewport bottom, all three form controls and route cards visible. Result and delivery controls remain accessible.
- Captured browser console errors after complete run: none.

## Automated rules

`node work/sponge-shift-express/test-rules.mjs` passes ten tests: longer traversable seeded districts; teaching hold; lane-dependent reward/damage and idempotence; three ability effects/costs; enemy defeat; delivery hold/reward/save; checkpoint rollback; efficiency and pause; gap-flight trajectory; normal-rule completion of all districts and nine orders. Simulation drive time 283.7 seconds. Syntax checks pass for app, scene and rules.

## Evidence / limitations

Screenshots: `work/qa/sponge-shift-express-20261103/adventure/complete-400x580.png` and `super-bounce-390x780.png`. Browser final screen is the authority for the playthrough result; screenshot is a local artifact outside the release source folder.

This is local browser testing, not Loopit-host or physical-phone certification. Audible quality, real-device swipe/multitouch and sustained device performance remain to be checked on the target host/device. Checkpoints are in-memory, not cross-session saves. Route remix reuses three themes. No GitHub/Loopit writes or publishing occurred.
