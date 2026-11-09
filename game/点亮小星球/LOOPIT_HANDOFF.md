# v0.9.0 · Existing multiplayer project migration

Target project: https://create.loopit.me/project/01a1aa3c-9c3b-77c9-a9d8-31a44893b4bd
Previous internal artifact: 2118319818129022976. Preserve its history. Update the draft only; no Publish/Post.

## Source is the approved game
Read actual index.html, starpath-main.mjs, starpath-rules.mjs, frontier-balance.mjs, boss-combat.mjs, starfall-rules.mjs, outpost-storage.mjs and the renderer/art modules. Reuse all geometry, palette, UI and authoritative gameplay. Do not recreate the game from this brief. Assets are procedural meshes; vendor/three.module.js imports vendor/three.core.js, both with vendor/LICENSE.

Keep native portrait 3D occupying the available preview viewport. Joystick/WASD movement, auto-fire, contextual Gather/Build, Overview left bottom, Base top right. No Ready, matchmaking wait, Dash, role classes, 10-wave completion, fake online players or three display heroes. An individual enters a public lobby immediately; room capacity8, ninth gets a new lobby. Map remains long/depth-based so veteran difficulty never changes a newcomer's region.

## Transport and persistence adaptation
starpath-server.mjs is a LOCAL reference only (HTTP /api/enter, SSE /api/stream, /api/command). Port8820 and localhost are not remotely deployed services. Inspect the CURRENT platform multiplayer/persistence guides and existing project Colyseus bindings first. Reuse existing platform-supported backend infrastructure; replace only transport/identity/storage adapters. Server runs FrontierWorld steps and validates all actions, costs, rewards, ownership, positions, rates, distance and progression. Client only sends input/actions and renders personalized snapshots, never accepts client-supplied XP/resources/HP.

Bind stable platform guest/user identity to permanent profile using supported durable storage. Keep public fields separate from private wallets/credentials. Preserve existing old game records; new chapter profile schema needs a separate namespace or validated migration, not treating old 10-wave scores as completed chapters. Personal fields:1–60XP, resources, weapons/ranks, modules/suit, chapter flags/checkpoints, station blueprints, companion growth. Room outpost snapshot: real tower/station type, pad, level, tier, damagedHP and historical station builds. Use snapshotOutpost/restoreOutpost to validate. Save flush on checkpoint, disconnect and before disposal; use only documented persistence. Do not use process memory or localStorage as a pretend cross-device server save.

Short reconnect <=20min same room resumes position/HP/O2/pouch/down without heal/bank. Long absence/different room/invalid position applies normal evacuation (35% unbanked loss). Normal base then repairs and banks. No O2 station healing. Save unavailable must be visible. Active enemies, hazards/projectiles are transient, not saved. Same-room destroyed station costs to rebuild; a personal blueprint may restore a station on first visit to another room. Do not duplicate whole room towers per user. Command sequence/idempotency prevents repeated charges.

## Preserve the latest six balance changes
1. Starcrown24k soloHP, distant locked2.7s sweep /2.8s starfall, normal walking can dodge, no retarget after warning. Break2rings; core only open in3.5s recovery. Do not reduce companion or endgame electric cadence to hide attack gaps.
2. Towers: separate repair atLv5; chapter advances MkII(Lv31/Aurora)/MkIII(Lv46/Starfall), exact prices, visual armor/gold changes, actual range/damage/HP from frontier-balance.mjs. Frost MkII gives bounded12% boss vulnerability.
3. Persist infrastructure and short field journeys; no reconnect exploit.
4. Staged Aurora mission XP/checkpoints. Keep three bases consistent, correct three-chapter completion, repeat Aegis first reward only once; final summary at safe harbor.
5. Region O2 factors1/1.4/1.7/2/2.4/2.8/3.2 as source. Base-only HP repair; safe spawn distance, buffers,2s arrival warnings and1s materialization unchanged.
6. Actual nearby eligible crew counts smoothly scale bossHP after3s grace preserving health percentage/broken rings; coefficient1+.45*(crew-1), max8. Regional packs and global budget retained. Independent wallets and eligible personal rewards, not old shared starting resources.

## Platform acceptance; execute, don't only describe
- Build and bind a new real multiplayer backend, upload this exact client build and record version/binding.
- Open2 independent platform visitor clients in same lobby. Both see actual2/8, distinct identities, matching world. Move each through real joystick or WASD and observe the OTHER client. Verify simultaneous movement/collision, gather, one authoritative tower build charged once, visible shared station/towerHP, upgrades/repair, damage/death/rescue.
- Join/leave/reconnect: no duplicate avatar, progress and injury retained, late join sees structures, wallet not shared. Test durable restart using documented storage; explicitly distinguish any untested cross-device boundary.
- Test room capacity8 with9th in another room using actual backend integration tests. This does not replace browser two-client QA or8-human endurance.
- Play a fresh gathering→O2→combat loop. In separate clearly marked QA rooms only, prepare31/60 gear for staged scan, damagedLv5 repair/advances, and real Starcrown dodging. Never label fixture setup as natural progression.
-400×680 and390×780 portrait: no clipped text or controls, stick and action buttons usable. Reconnect retry/pause do not create extra inputs. No console errors/assets missing.
- Preserve procedural art, no unrelated music/Powers before core integration. Report source commit, changed adapter files, test results, actual preview/version and untested limitations. If source cannot be read, stop and identify missing files rather than inventing an equivalent.
