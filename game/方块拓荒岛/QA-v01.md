# Local QA — 2026-11-10

Build: Skyblock Frontier 0.1.0. Local server `http://127.0.0.1:8898/`.

## Rules / complete campaign

`npm test`: **17/17 passed** under Node 24.16.0. Coverage includes edge/diagonal collision, regenerating resources, no regrowth around a player, exact partial payments, tool gating and real yield multipliers, furnace fuel, cow feeding, renewable villager barter, one-time treasure, connected terrain, legal paths, malformed save recovery, prerequisites, one-shot ending and three complete legal-action routes (main route, all optional sites, and main route at 60 Hz).

Latest deterministic full routes, using only the same movement / gathering / crafting APIs as a player:

| Route | Result | Land blocks | Gathered | Simulated time |
|---|---|---:|---:|---:|
| Main route, no pasture | Portal restored; 9 sites | 50 | 745 | 355s |
| All branches | Portal restored; all 12 sites, treasury | 70 | 574 | 329s |

The driver deliberately optimizes routes and accelerates simulated time in the browser QA mode. These are correctness results, not measured human completion times or difficulty ratings.

## Actual browser observations

- IAB, 390×780: native drag on the actual canvas moved the player into tree range. Normal auto-harvest collected 12 Wood in the initial manual-test build. Tapping the **Woodland** world marker walked to its pad and paid exactly 8 Wood, leaving **4 Wood**, revealing the woodland, workbench, Stone tools, pasture and bridge markers. No inventory grant or hidden state injection was used. Current first tree provides 8 Wood to avoid a forced first-step regeneration wait.
- Chrome: clicked the visible objective card; actual pathing and automatic collection produced **8 Wood**, changing the objective to **Grow the woodland**. This was an isolated QA save.
- IAB, final core rules, 320×568: after menu restart, ran the visible **Run legal campaign** QA control. It moved, gathered, paid and waited using normal core rules. Result **PASS — 12 sites, 574 gathered, 38 crafting/trade operations, 329 simulated seconds**, with **70 land blocks** in the actual ending dialog. Sound remained **off** after restart, as selected in the menu. Evidence: `qa/portal-complete-320.jpg`.
- 400×580 and 320×568: all seven resource types, objective, movement area, help and reset controls fit the viewport. Clicked menu, sound toggle, new-world request and its confirmation. Inventory reset to 0/0, Wood tools restored, Chapter I resumed; full campaign subsequently completed again. Confirmed-world UI and result dialog were readable at 320px.
- Reloaded a completed QA save: Iron tools, portal completion and bag balances restored. Reloaded the normal manual save: **4 Wood**, woodland terrain and next objective persisted. QA and normal localStorage keys are separate.
- Final 390×780 woodland screen: measured the three visible world-label rectangles after automatic spacing; **zero overlapping pairs**. Slightly displaced labels retain a dotted line to their pad. Screenshot: `qa/woodland-390.jpg`. Returned the normal entry to a fresh world using the actual menu confirmation after saving this evidence.

## Fixed during validation

- Kept workbench / furnace / portal solids behind their delivery pad so newly built structures cannot trap the player who paid for them.
- Prevented solid resource regrowth around a player standing on a depleted node.
- Moved a wheat plot away from the cow pad to keep gathering and feeding distinct.
- Made first tree supply the first expansion's full cost.
- Added depletion / regrowth countdown text, and repathing when a regenerated resource blocks a tap-to-walk route.
- Spaced neighboring world-label costs automatically so the workbench and bridge requirements no longer overlap.
- Reject impossible dependency combinations during save recovery; delayed victory dialog cannot reopen in a different restarted world.

## Boundaries

Browser viewport and native mouse/pointer emulation were tested. No physical phone, actual multi-touch, battery / sustained mobile GPU profiling or subjective listening test has been performed. Background preview throttling is not treated as a measured phone frame rate. No GitHub upload or Loopit import has been done in this task.
