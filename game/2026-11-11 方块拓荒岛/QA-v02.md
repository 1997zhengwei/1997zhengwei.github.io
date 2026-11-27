# Local QA — v0.2, 2026-11-10

Local URL: <http://127.0.0.1:8898/?v=2>. Previous evidence is retained in `QA-v01.md`; it does not certify this revision.

## Rules

`npm test`: **20 / 20 passed**. Includes the complete main route at two simulation frequencies, all optional sites, real partial hex opening / reload, geometry bounds, exact inventory spending, resource regeneration, stone / iron tool gates, smelting, feeding, barter, one-time treasure, prerequisite recovery, legacy save migration, and each construction point remaining escapable when new solid props appear.

## Actual browser checks

- **Normal pointer control, 390×780:** native drag moved the explorer toward the tree; visible Wood progressed to **8**. Clicking the actual **Woodland** world marker walked to the pad, paid **8**, left **0 Wood**, revealed the woodland and advanced the objective to Stone tools. The new curved-surface control mapping was used. No inventory injection or teleport was used.
- **Final campaign in browser:** clicked the visible **Run legal campaign** test control in a separate `qa=v02-acceptance` save. The legal driver uses ordinary movement / harvesting / crafting / waiting. Terminal result: **PASS — 12 sites, 72 land hexes, 672 gathered, 38 recipes, 340 simulated seconds**. Actual result dialog showed the restored world and continuation / new-world controls. `qa/v02-complete.jpg` records the result.
- **Console:** final campaign tab reported no JavaScript or shader errors. The newly exposed arrival portal initially surfaced a reserved GLSL identifier in inherited v0.1 code; it was renamed before the final run.
- **320×568, completed save:** all seven material counters restored. Opened the menu, sound toggle and new-world confirmation; confirmation and cancellation controls fitted. Confirmed new world: Wood / Stone **0 / 0**, **LVL 1**, initial objective and first construction footprint returned. Clicking the actual objective control then gathered **8 Wood** again. Sound selection was preserved.
- **Persistence:** v0.1 data migrates into the revised logical hex map, preserving balances, payments and unlocks. QA saves are isolated from the normal `skyblock-frontier.v1` namespace. A normal save is not reset to make a screenshot.
- **Visual evidence:** `qa/v02-mobile-final.jpg` at 390×780 and `qa/v02-landscape-final.jpg` at 1536×864. The early mining state was reached through the legal checkpoint UI; no fabricated resource balances were used. Developer controls were hidden through their normal UI before capture. `design-qa.md` records comparison to the source frame and intentional differences.

QA time acceleration is for correctness checks. It is not a human completion-time measurement. A separate collection checkpoint can pause at 24 Wood for inspecting the real backpack stack. It does not grant materials.

## Material fixes verified

- Planetary curvature, raised hexes, water shadows, direct construction counts and compact HUD.
- Real partial-payment terrain, with corresponding collision / resource access.
- Foreground resource fade and the larger swaying material stack.
- Construction trigger corresponds to the visible footprint; moved a forest-adjacent pasture pad.
- Moved the portal off the ruins reveal point and tested all construction anchors for trapping.
- Service pads remain visible at their actual interaction locations.
- Map has a return shortcut after the ruins, instead of an entirely straight out-and-back corridor.

## Limits

No physical phone, true multi-touch, battery / sustained mobile GPU profiling or subjective audio quality review has been performed. Browser viewport emulation and pointer input are separate evidence. No GitHub upload or Loopit import was performed in this revision.
