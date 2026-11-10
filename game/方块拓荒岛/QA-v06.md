# v0.6.0 acceptance · 2026-11-11

Local preview: http://127.0.0.1:8898/?v=6 (the computer running the server).

## Rule verification

`npm test`: **39/39 passed**, including all prior tests and five additional cases for departure-based renewal (all five resource types), old-save migration and solid anti-respawn protection, exhausted-only routing recovery, ordinary/key pricing, and partial key-piece payments across reload. The legal planner fills all 642 cells from zero resources, processes actual recipes, pays actual costs, survives reload and continues on planet 2 without inventory grants.

## Actual browser acceptance

- Isolated fresh `?qa=v06-balance` started on planet 1 at 19/642 with zero inventory. The public **Run full planet (642 tiles)** planner reported **PASS · 642/642 · planet 1**, 3943 simulated seconds. This is accelerated QA time, not measured human playtime.
- Completion reveal appeared at 642/642. The native reward button granted the guardian and Diamond +1 yield, then the native overview button showed the actual completed sphere. `qa/v06-complete-world.jpg` is a real **1280×720** default-viewport game capture, not an artist impression or a fabricated save.
- NEXT PLANET entered planet 2 at 19/642, preserving the backpack, guardian and Diamond ×4 yield. At an actual **390×780** viewport, the depletion message, contextual hint, recipes, GOAL and HUD remained readable with no horizontal overflow. Resource values stayed at Wood233 / Stone1147 / Ore4933 / Iron0 / Wheat3878 / Emerald12 / Obsidian4343 across two stationary observations after exhaustion; the depleted deposit did not refill. Evidence: `qa/v06-phone-depleted.jpg`.
- Browser console checks returned no errors or warnings. Temporary viewport override was reset and the QA tab closed.
- Normal `?v=5` user save had 66/642 cells, Wood313 / Stone178 / Ore134 / Iron3 / Wheat2149 / Emerald1. It loaded `?v=6` with those values and cell count retained. Obsidian grew through normal old-version idle harvesting from2612 to2636 before the reload. After update it remained2636 while stationary with the explicit move-away hint. No normal save was reset or replaced by a QA save. The normal version6 tab remains the deliverable.

## Limits

Physical phone GPU, battery and frame rate were not measured. This is a balance/feedback adjustment, not a claim about retention or a measured human completion duration. Existing rich backpacks are intentionally kept. Prior visual acceptance: QA-v05.md. No remote upload occurred.
