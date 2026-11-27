# Approved source handoff: Junction Railway, version 2.1

This package replaces the rejected single-cart route-and-collect prototype. Do not restore its emerald, three-star, powered-slope, large data-card or continuous-single-path systems.

The user has now approved version 2.1 and authorized GitHub upload under a Chinese directory and a Loopit draft. Create a faithful source integration. Do not publish to the gallery or submit for review. Verified source commit and platform state are recorded in SYNC_STATUS.md.

## Identity

Title: **Minecart Rescue**. Description: **Paint the missing tracks, launch every carriage together, and connect them to the engine in numbered order. Solve ten railway puzzles with tight rail budgets, junctions, redstone gates and tunnels.**

All primary player-facing text is English. Keep the Minecraft passengers and block geology within the comic-style railroad presentation.

## Entry

Serve `index.html` with the unchanged relative `style.css`, `src/`, `assets/` and `vendor/` folders. There are no runtime network assets or package installation requirements. Three.js is 0.187.0; retain its MIT notice.

Read the actual source files before adapting. Do not regenerate from the title or a screenshot, and do not use an external iframe as a substitute for source import. If a file is inaccessible, identify it explicitly.

## Preserve

1. All ten maps, fixed track anchors, editable-tile budgets, carriage starting directions and numbered coupling order.
2. Independent track painting anywhere on the board, automatically formed bends, editable-tile shape cycling, erasing, Undo, Reset and keyboard alternatives.
3. Simultaneous movement. Fully connected but wrong-order paths must fail. Same-junction timing conflicts and head-on edge swaps must collide; safe following must succeed.
4. The distinction between automatic white-arrow joins and explicitly tagged, gold SHORT / LONG switches; the explicit switch stem/branch logic, per-car fixed gate delays, paired tunnel travel and no ping-pong at tunnel exits.
5. Actual numbered carriage movement and engine coupling animation; clear localized failure feedback; returning to edit retains the track network.
6. Full-screen grassy isometric landscape, dappled ground, dark outlines, bright white rails, orange editable sleepers, compact lower-left blue rail stock and lower-right Play/Stop controls.
7. First-interaction audio unlock, mute, 1×/2× playback, visibility handling and locally saved layouts/completion.
8. Responsive control reachability and clear carriage numbers at 390×780 and 400×580. Avoid a second nested game iframe or a shrunken desktop page.

## Future platform acceptance

Run `npm test`, then actually play the imported artifact. At minimum: 1-1 painted straight connection; 1-2 separate strokes forming two bends; 1-3 a shorter car-2 route failing order, then the corrected detour succeeding; 1-4 equal approaches colliding, then the longer approach succeeding; the marked gate; three-car ordered coupling; the tunnel; the switch changed from the failing branch to the successful branch; Stop/edit, Undo, Reset, mute and reload.

Use only necessary platform ready/lifecycle, relative-resource, viewport and input adaptations. Do not publish or submit for review before authorization. Local QA is not platform QA.
