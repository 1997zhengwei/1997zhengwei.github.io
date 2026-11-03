# Loopit source integration contract

Title: Bubble Roll: Endless Tide. Topic: SpongeBob. Single-player, real 3D, English UI.
Repository: 1997zhengwei/1997zhengwei.github.io; games branch codex/krabby-patty-flip; game path games/bubble-roll-endless. Import the fixed commit linked in the creation prompt. Do not build the repository root academic website.

## Runtime
Entry index.html loads app.mjs. All runtime files are in this directory, including vendor/three.module.js, vendor/three.core.js and the MIT LICENSE. No npm dependencies, remote CDN, backend, secrets or build step. Serve this folder over HTTP. For a host build, copy the folder intact to dist and preserve relative imports, or wrap the existing entry using the platform-supported adapter. Test rules with node test-rules.mjs.

## Preserve
Use the actual source, not a title-based rewrite. Preserve procedural SpongeBob/Patrick/Plankton models, iridescent growing bubble, 50x50 arena, three environments and four randomized layout families. Size grows visibly with a bounded radius; camera keeps the player readable.
Move with stick/tap/WASD/arrows; Space dash; E active power; Q swap. Four upgradeable powers: Magnet, Pinball, Decoy and Mega. Size is independent of 100 HP; damage is 20 with brief invulnerability; healing caps at 100. Zero HP ends the run. Pause, hidden-tab pause, mute, local best and restart remain.
Explore three supply caches; claimed caches disappear immediately and pay once. Summon boss voluntarily at beacon after all three. Four rotating bosses: Plankton truck, King Jellyfish, Mega Vacuum and Claw Crusher. Preserve tell/attack/green vulnerability phases, hazards paused during fights and enemy retreat. No automatic timed boss.
Boss death immediately removes model/warnings and opens Street cleared, freezes play, credits rewards once (+30 size, +1800 points, XP, up to20 HP). Next street generates a new layout/environment and preserves growth/powers/score; restores20 HP; handles pending upgrade. No exit search. Boss Practice preserves distinct scores and retry/menu flow.

## Host adaptation
Fit the actual Loopit phone iframe using 100dvh, min-height:0 and resize observation; no outer website chrome or desktop-sized canvas shrunk to a thumbnail. Keep playfield dominant and player, 100-HP bar, telegraphs and 44px touch targets legible. Test 390x780 and compact 400x580. Menus may scroll internally; page must not overflow. Retain English copy and all existing control affordances. Do not add multiplayer or unrelated Powers. Start synthesized sound only after user action; mute/pause/hidden-tab stops playback.

## Acceptance
Read rules.mjs, bosses.mjs, layouts.mjs, app.mjs, scene.mjs and boss-visuals.mjs before adapting. Run node test-rules.mjs. Check real rendering, move/dash, growth, upgrade, cache disappearance, boss hit/death, clear/next-street, zero-HP/restart, pause/resume and mobile UI in the actual output. Report commit and missing/inaccessible files honestly. See QA.md for local-only evidence. No exhibition publishing is authorized by this handoff.
