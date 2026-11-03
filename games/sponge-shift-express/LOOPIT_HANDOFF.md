# Sponge Shift Express — source integration

Title: Sponge Shift Express. Topic: SpongeBob. English UI, real 3D, single-player.
Repository: 1997zhengwei/1997zhengwei.github.io, existing games branch codex/krabby-patty-flip. Import ONLY games/sponge-shift-express at the commit in the creation prompt. Do not build or change the root academic website.

## Runtime
Entry index.html -> app.mjs. Entire game and vendor/three.module.js, vendor/three.core.js and MIT LICENSE are in this folder. No install/build/backend/remote asset dependency. Serve over HTTP. Copy this folder's contents to the platform's actual dist root with relative imports preserved; no remote-site iframe and preferably no nested game iframe. Follow the actual host readiness protocol. Run node test-rules.mjs.

## Preserve exactly
Three 514-unit districts (Jellyfish Fields, Goo Lagoon, Krusty Harbor), 24 obstacle rows each, nine deliveries total (~5 minutes of driving). Each of three lanes has its own obstacle or safe OPEN option. FLAT ducks bars, BALL breaks foam, SPRING automatically jumps gaps. First three gates teach by waiting. A/D, arrows, swipe or lane cards move lanes; 1/2/3 morph. Space/the ability button triggers Slip Dash, Power Roll or Super Bounce. Powers consume energy (60, upgraded45), rewarded gates and spatulas recharge it. Enemies have visible DODGE/ENEMY lane warnings; bot/jelly collision, health and invulnerability must remain real.

Patrick, Squidward and Gary deliveries require reaching the marked lane; wait safely before the stop if wrong lane. Delivery gives points, healing and energy, plus choice of shield/magnet/efficiency/bonus. Save checkpoint after completion. Failure at0HP freezes play; Retry restores latest delivery checkpoint and its score/pickups/upgrades, not the beginning. Completed deliveries remain done and cannot pay twice. End district transitions, final9/9 result, rating, Express remix and pause/resume must work. Keep local best score only; no claim of cloud persistence. Preserve recognizable procedural characters, moving water, shape deformation, foam destruction, character visibility and close phone framing.

## Host fit / audio
Fill the real iframe, 100%/100dvh, min-height0, resize observer; no desktop-sized page squeezed into a tiny thumbnail. Verify390x780 and400x580, no overflow, all controls reachable and character large. Keep clear route/danger/delivery cues; preserve English names. Keep audio user-gesture gated, mute and pause lifecycle. Do not add unrelated features or extra Power until this baseline is verified.

## Acceptance
Read rules.mjs, scene.mjs, app.mjs and helpers, not just this file. Verify source access and report exact commit. Real UI: start/tutorial, all shapes, lane-dependent outcomes, energy ability, enemy damage, delivery+upgrade,0HP+checkpoint retry, district transition,9/9 result and Express replay. Check embedded Lab preview as well as standalone. Local QA.md records real4:50 completion; it is not platform evidence. Report inaccessible files honestly instead of recreating from a description.
