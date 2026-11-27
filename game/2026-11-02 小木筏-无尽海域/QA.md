# Local verification — 2026-11-02

## Automated rules

`node test-rules.mjs`: 11 checks passed. Covers 100 repeat deck expansions (102×102 tiles), repeat facilities and costs, seeded weather diversity/rising average strength, successive rounds without a final win, 100 simulated storm survivals with a prepared raft and repairs, heading/rigging protection, leak drain/repair cost, failure priority, timed preparation/net collection, save restoration and fresh-state isolation. `node --check game.mjs` passed.

These are rule simulations, not 100 rounds of browser or phone performance testing.

## Browser observations

Tested the local HTTP build in the in-app browser at a narrow 394×684 viewport. The 3D scene and primary controls fit; no captured console errors/warnings after reload.

- Hooked supplies, built a net and repeated deck upgrades, braces and rigging. Observed 2×2, 3×3, 5×5, 6×6 and 9×9 footprints during the session.
- Survived storms into subsequent preparation periods with structures/resources retained. Forecasts changed between Rolling Swell, Heavy Squall and Crosswind; directions and peak values changed.
- Turned the bow to the forecast direction; the HUD showed BOW ALIGNED. Wave impacts reduced hull and produced repairable leaks. A repair moved the sailor to a leak, removed it and restored hull.
- A neglected voyage sank during storm 4 after surviving 3 storms. The result retained the record and offered a new raft. Restart reset inventory, levels, footprint, leaks and survival count.
- Found and fixed restart bookkeeping: reset HUD/autosave/water timestamps with the new voyage clock and update the HUD immediately. Reused sail/jet materials instead of creating new materials on repeated rebuilds.
- Saved at storm 3, 9×9 deck, 100% hull, 7 wood / 44 rope / 26 scrap and 34 seconds preparation remaining. Reload restored the same displayed values and started paused. Continue resumed play. Overview displayed the enlarged raft.

Proof images are retained with the local delivery: `proof-storm.png`, `proof-loss.png`, `proof-expanded.png`.

## Remaining scope

No physical-phone endurance test or extreme-size WebGL benchmark was performed. Local storage depends on host/browser permissions. The game is not yet imported, accepted or published in Loopit; repeat the core playthrough on that hosted build before submission. Optional synthesized audio is wired to the shared sound system; audible output still needs the user's listening check.
