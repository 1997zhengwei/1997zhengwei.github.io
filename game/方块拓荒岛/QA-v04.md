# v0.4.0 local acceptance · 2026-11-11

Play: http://127.0.0.1:8898/?v=4 (the computer running the server).

## Main-game change

Normal boot and confirmed new adventure enter planet mode directly. They do not mark the original island campaign complete. Existing inventory and frontier investments are preserved. Starting planet: 19 connected cells out of 642, all renewable raw inputs, three exchanges and an explorer kit. There is no portal prerequisite in the main flow.

## Rules checks

`npm test`: **34/34 passed** on final source. This includes the original 20 island checks and globe checks for closed topology, paid expansion, collision, regeneration, exact repeating recipes, save recovery and legal-action full coverage. New checks verify direct planet entry, v3 migration, claim only after completion, exactly one reward per planet, reload/replay safety, next-planet gating and real +1 harvest on the next planet.

The legacy campaign is retained behind the QA-only `legacy=1` route and remains covered by its original rule tests; it was not replayed in the browser for this revision.

## Browser acceptance

In-app browser with isolated saves:

- `qa=v04-direct-planet`: fresh game opened at 19/642 without the island campaign. The public legal-play QA planner reached 642/642 using ordinary movement, renewable harvesting, exchange recipes and actual payments; no inventory or land grants. It reported 3582 simulated seconds for its coverage run. Accelerated QA duration is not human playtime.
- Completion automatically entered the reveal. Normal HUD became inert/hidden and resource simulation paused. Reloading before claim resumed an unclaimed reveal. The native Skip button reached the reward stage; it did not award items.
- A native Welcome click produced Emerald 12, one awakened-world star and Diamond yield ×7 on the full planet. Reload retained those values. Native replay → Keep exploring left Emerald 12 and the star count at 1. Native NEXT PLANET opened planet 2 at 19/642, preserved inventory and displayed actual base yield ×4. Fresh console inspection had no errors/warnings.
- `qa=v04-mobile-start`: at an actual 390×780 viewport, native GOAL walked to renewable stone. A native border label spent 5 Wood + 3 Stone and changed coverage from 19 to 20 cells. This was ordinary UI play, without the planner.
- That isolated phone save then completed through the public legal planner (3560 simulated seconds). At actual 320×568, the completion claim button occupied x32.8–287.2, y499–542.2, entirely within the viewport. A real screenshot confirmed the ending and reward fit. The pause/confirmed-restart card also fit (top32.3, bottom535.7).
- Native confirmed restart restored zero inventory, no star/reward, normal tools and **19/642 planet cells**, with no return to the original tree tutorial. The inert ending controls were cleared.
- The normal user save, opened separately at `?v=4`, retained Wood14 / Stone208 / Ore60 / Iron8 / Wheat70 / Emerald5 / Obsidian104 on entry and entered the planet at 19/642. Wood subsequently increased through ordinary stationary auto-harvest; no QA grant or normal-save reset was used.
- The normal playable tab is retained. Temporary test tabs were closed and viewport overrides reset. The first attempted tab encountered the stopped local server; it was restarted before the successful runs.

## Evidence

- `qa/v04-main-mobile-final.jpg`: actual normal-save 390×780 starting planet, final source, no ending spoiler.
- `qa/v04-main-mobile.jpg`: earlier isolated 390×780 starting view.
- `qa/v04-reveal-verified.jpg`: actual desktop completion greeting/reward after legal coverage (spoiler).
- `qa/v04-reveal-short-screen.jpg`: actual 320×568 completion greeting/reward (spoiler).
- `qa/source-manifest-v04.json`: hashes for the local source/test baseline.

## Boundaries

Physical phone GPU/battery behavior, actual multi-touch and subjective audio listening were not tested. Reduced-motion behavior is implemented (static greeting and immediate reward-stage access) but the browser preference was not independently exercised. Screenshots are actual game captures, not mockups. Previous versions: QA-v03.md / QA-v02.md / QA-v01.md. No GitHub or Loopit upload was performed.
