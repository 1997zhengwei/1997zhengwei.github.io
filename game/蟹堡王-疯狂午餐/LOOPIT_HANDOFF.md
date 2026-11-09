# Loopit source integration contract

Title: **Krusty Krab: Lunch Gone Wild**. Topic: **SpongeBob**.

This is an approved local game, not a prompt to invent a new kitchen game. Read and import every runtime file in this directory. `index.html` is the standalone entry. All imports and assets are relative and local. `rules.mjs` is pure simulation, `scene.mjs` renders Three.js, `app.mjs` owns inputs/UI/audio; `world.mjs`, `characters.mjs`, `common.mjs`, `polish.mjs` and `vendor/` are required. No npm build required; use the host build adapter only if necessary.

Mount the game at the actual root preview, not a nested iframe containing a tiny desktop page. Preserve the 3D kitchen, recognizable procedural characters, gold next-action path, English copy, first-order grace period, contextual actions, click-to-walk and touch joystick, two-item prep, hold/release toss with target switching, real blue-pad bounce, dash, dropped-food recovery, Patrick feeding/helper, Plankton chase, Squidward temporary lane closure, 4/6/8-order progression, upgrade choice, 5-heart loss/retry and optional endless overtime.

Prefer viewport adaptation over changing gameplay. Validate 390×780 and 400×580 with controls large enough to tap, no page overflow or hidden CTA, and enough room to see the kitchen. All three orders, carry contents and current action must remain understandable. Keep Web Audio effects, mute persistence and pause/visibility lifecycle. Do not add unrelated mechanics or permissions. Music and optional event haptics can be assessed after core integration.

Run `node test-rules.mjs` where available and perform real input-driven checks. Never replace verification with forced win/state edits. Confirm source commit and disclose any inaccessible file. If GitHub retrieval fails, report it rather than hallucinating source contents.

Suggested recommendation: 帮海绵宝宝烤制蟹堡，冲刺抛餐赚小费，应对搞怪伙伴，挑战午餐高峰！
