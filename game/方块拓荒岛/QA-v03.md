# v0.3.0 local acceptance · 2026-11-10

Current local URL: http://127.0.0.1:8898/?v=3 (this computer only). No remote publication.

## Rules and integration

`npm test`: 30/30 passed. The 20 existing campaign checks remain, with 10 globe checks covering:

- Closed 642-cell topology, 12 pentagons, reciprocal neighbors and reachability on both sides.
- 19 starting cells with every renewable raw input and all three exchange stations, across multiple planet seeds.
- Existing v1/v2 saves, portal entitlement, backpack/tool carryover, home return, partial investment, bounded and connected save recovery.
- Water and resource collision; reachable resource-cell centers; no builder trapped by new land.
- All three recipes repeat with exact ingredient consumption and stop when inputs run out. Reload cannot grant extra outputs.
- 25/50/75% collection increases; next planet is locked before 100% and retains the backpack and tool tier afterward.
- A QA planner fills all 642 cells using normal movement, regeneration, recipes and actual payments, then reloads and builds on planet 2. No granted inventory or unlocked terrain.

## Actual browser operations

In-app browser, isolated key `skyblock-frontier.qa.v03-planet-final`:

1. The original 12-site campaign finished: 72 hexes, 672 collected, 38 recipes, 344 simulated seconds. A native click on the new ending action entered the frontier.
2. A legal movement planner reached 30/642 cells and then 642/642 on planet 1. Its full-coverage phase reported 3500 simulated seconds. This is accelerated QA time, not human playtime or a measured session-length claim.
3. A native NEXT PLANET click created planet 2 with all existing material balances. Layout/colors changed; current-planet yield reset to 3, while iron tools remained.
4. At 390×780, native clicks on the loop-marked furnace walked to the pad and produced repeated iron. Observed 24 Wood → 13 Wood, 4239 Ore → 4217 Ore, 0 Iron → 11 Iron. Context showed “↻ REPEATS WHILE STANDING” and the full recipe.
5. A native border-label click delivered 5 Wood + 3 Stone and changed coverage from 19 to 20 cells. No QA planner ran for this click.
6. Home return → reload → re-enter retained planet 2 and its 20 cells. The 320×568 pause menu showed all actions in the viewport.
7. Planet 2 also reached 642/642 through the legal planner (3278 simulated seconds for that phase). A native NEXT PLANET click reached planet 3 with the backpack preserved. At 1280×720 the rotating globe overview showed the complete sphere; the local resource props sleep in this view.
8. Native menu reset, with its confirmation, returned the isolated test save to Wood 0 / Stone 0, LVL 1, first Woodland objective, and no frontier entitlement. The other open tab of that isolated save adopted the reset through the storage event.
9. The user's normal save was updated separately: portal complete, LVL 3, Wood 14 / Stone 208 / Ore 60 / Iron 8 / Wheat 70 / Emerald 5 / Obsidian 101 retained on first reload. One subsequent ordinary obsidian hit raised that last count to 104. No normal-save reset or QA inventory was used. The normal tab remains at `?v=3`, with EXPAND PLANET ready.
10. Fresh console inspection: no errors or warnings. Temporary test tabs were closed; viewport overrides were reset.

## Evidence

- `qa/v03-full-planet-pass.jpg`: planet 1 terminal QA result, 642/642.
- `qa/v03-mobile-exchange.jpg`: actual 390×780 exchange/frontier view.
- `qa/v03-complete-globe-final.jpg`: actual 1280×720 planet 2 complete overview, final UI. Terrain earned through legal QA actions, not a concept illustration.
- Earlier `qa/v03-complete-globe.jpg` predates the overview framing adjustment and is historical.

## Limits

Physical phone hardware, sustained mobile GPU/battery performance, multi-touch and subjective audio listening were not tested. The short and tall phone sizes were browser viewport checks. The current frontier and original home are persisted; older completed globes are counted by planet number rather than retained as revisitable maps. There is no claim of infinitely many simultaneously stored worlds or a literal commercial-game port.

Previous reference adaptation checks: QA-v02.md; earlier v0.1: QA-v01.md.
