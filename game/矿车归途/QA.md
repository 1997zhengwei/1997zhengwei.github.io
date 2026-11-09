# Version 2.1 clarity pass

This revision addresses the confusing green junction in 1-5. Ordinary joins now have slate-grey sleepers and flat white flow arrows, with no lever or switch interaction. Clicking one explains that it joins automatically and leaves Undo disabled when no edit was made. Only the explicitly tagged switch in 2-4 is interactive; its larger gold button visibly reads SHORT or LONG. Gate labels state AUTO +N; lower rocks, no trees on blocked tiles, and open tunnel mouths improve rail visibility. The ten maps and rail budgets are unchanged.

Validation: **23 rule tests passed**, including all ten authored solutions and a regression that ordinary joins ignore legacy switch settings. In 390×780 UI testing, tapping 1-5’s join showed the automatic-join explanation without editing the layout, then the level completed with Coupled 2 of 2. In the standalone 2-4 build, the gold button changed the branch and the layout completed; playback disabled that button. The final SHORT/LONG wording and Undo restoration were checked through the interface. The bundled script and stylesheet parsed successfully.

The public HTTPS file returned status 200 and exactly matched the new local bundle: **664,199 bytes**, SHA-256 `efe89e6639e338cd4d7ed091c13201a63c5713f4910b870a6c5542db9577abb4`.

The following record is the earlier version 2.0 baseline; its previous artifact hash is retained as history.

# Version 2 validation record

Date: 2026-11-09, Asia/Shanghai. This report covers the rebuilt local **Junction Railway** implementation. The first prototype's 8-journey/18-test results do not apply to this version.

## Rule checks

`npm test`: **22 passed, 0 failed**. Ten authored layouts finish within their editable-tile budgets and couple all carriages in the required order. Independent regressions cover equal-time junction collision, a connected but wrong-order network, head-on edge swaps, safe following, reciprocal rail ends, switch choice, necessary waiting-gate delay, tunnel travel, tile inventory, loop termination, determinism and non-mutation.

## Current UI acceptance

- 1-1: actual single pointer drag filled the three missing tiles; Play completed with **Coupled 1 of 1** and **All connected!**.
- 1-2: three separate pointer drags created two connected bends; the six-tile route completed with **All connected!**.
- 1-3: a connected shorter route for car 2 produced **Car 1 needs to arrive first**. Replacing it with the planned detour completed with **Coupled 2 of 2**.
- 1-4: equal-length approaches produced **Mind the junction!**; the longer southern approach completed with **Coupled 2 of 2**.
- 1-5 and 2-1 through 2-5: all completed through ordinary interface controls, including both three-car puzzles. The puzzle map displayed **10 of 10 puzzles connected**.
- 2-4: the unchanged default switch produced a collision. A real coordinate tap on the gold lever at 390×780 changed the branch; the same track layout then completed.
- Reset cleared the editable layout, Undo restored it. Deleting a tile returned one rail to stock; Undo restored the tile. Play/Stop returned to editing without losing the layout. Sound preference and the layout survived reload.
- The standalone bundle opened directly at `?puzzle=1-3`. At 400×580, header, instruction and bottom controls stayed inside the viewport. A real coordinate tap with the eraser removed an orange tile, returned one rail to stock and could be undone. The bundled level then completed with **Coupled 2 of 2**.
- At 390×780, the public HTTPS page showed the current numbered-carriage game and accepted a complete layout through ordinary input. The viewport override was reset after responsive checks.

UI tests use `?qa=1`, which the code implements with separate storage. Authored normal keyboard input fixtures are used to exercise later layouts through the real interface; no hidden application-state mutation is used. The first two routes are also painted with actual pointer drags.

## Delivered artifact

The standalone HTML contains its JavaScript, stylesheet, favicon and full Three.js MIT notice; syntax and stylesheet parsing passed. No external script or stylesheet is required at runtime. The temporary HTTPS response returned status 200 and exactly matched the local HTML's SHA-256: `cf95671ea9ca786af0f435602dfff9f0fea3432a139161d882b3b11d000a586c` (661,805 bytes).

Saved screenshots in the outputs folder show the current portrait layout, an example completed track network, wrong-order and collision feedback, and the ten-puzzle completion map. These are game captures, not generated concept images.

## Scope and limitations

The test environment can throttle background animation frames. Functional outcomes and UI state are distinguished from foreground device frame-rate/hand-feel claims. Physical-phone performance and listening quality need user playtesting. The temporary HTTPS preview serves only the bundled game file, not the local workspace.

The reference's core planning principles and comic-style scene layout guide this adaptation. Level layouts and artwork are newly authored. The explicit gate and tunnel rules are documented in README; this is not represented as a pixel-perfect or complete reproduction of the commercial reference.

GitHub upload and Loopit integration remain deferred by the user.
