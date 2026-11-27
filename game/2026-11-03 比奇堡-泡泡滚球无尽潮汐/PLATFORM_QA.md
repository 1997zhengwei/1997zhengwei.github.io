# Correct Loopit Lab integration QA — 2026-11-03

Project: https://lab.loopit.me/pgc/workbench/01a19fca-93ad-7565-a97e-0d9d9192cca6?kind=draft

## V1
Playable: https://cdn-cf.loopit.me/public/game/01a19fca-93ad-7565-a97e-0d9d9192cca6/2117482803351257088/workspace/dist/index.html?loopit_preview=draft

Platform reports source commit 20c7ac638a69e0d2a9e70de0431f81027de4ba99. Real playable visibly preserves imported game UI, exact rules, four-power upgrades and source game path. Root entry embeds games/bubble-roll-endless/index.html. No byte-identical platform-source claim.

Actual input-driven testing in IAB:
- 390x780: move, collect, visible size growth, Mega activation, upgrade selection, HP damage and medical recovery. No fake state injection or debug win.
- Death at 0HP, result score1912, Explore again restores100HP, starts fresh0/3 caches and randomized Market Pockets. Move after restart works. Pause freezes state.
- New run collects three caches, medical cache restores80->100HP. Challenge unlocks only near beacon after all3. Truck spawns and ordinary robots retreat.
- Three independent truck dash hits. At1:00, Street cleared result, +30size/+1800pts/+20HP shown, HP20->40, boss panel/model gone. Next street reaches Jellyfish Fields, Shell Ring layout, 60HP, preserves MegaLv2 and bubble growth. Initial new-area pickups/growth bonus can change size/score immediately after entry.
- 400x580 actual new-area screen fills host with compact overlay HUD and touch controls; no entire desktop page thumbnail. Saved screenshots lab-v1-death.png, lab-v1-clear.png, lab-v1-next-street-compact.png.

Issues found:
1. Lab editor preview says product temporarily cannot load, even after Retry. Standalone works. Request wrapper/readiness fix; suspect nested iframe but not proven.
2. At<=40HP during boss fight, bottom guide points to medical pickup instead of boss. Request prioritize live boss while leaving low-health bar/minimap medical markers.

V2 request submitted with official Power Add Vibration to Events: meaningful cache/hurt/bossHit/clear events only; opt-in toggle, unsupported-device no-op; no per-frame spam. Preserve existing synthesized effects/mute; no new external BGM. Power card selected and attached to submitted request. Actual physical haptics untested.

Project catalog title changed through UI from Int to Bubble Roll: Endless Tide (success toast). Not published.

Limitations: audible sound quality and physical-phone feel not assessed. V1 input-driven complete loop proves first truck route; full four-boss browser victory not repeated on host. V2 must be tested separately.

## V2 — final draft
Playable: https://cdn-cf.loopit.me/public/game/01a19fca-93ad-7565-a97e-0d9d9192cca6/2117486811075842048/workspace/dist/index.html?loopit_preview=draft

- Platform removed nested game iframe; actual V2 root renders the imported game directly. Editor preview now loads and accepts Start, Dash and Pause: size12, score22, Dashing4s then Paused. Confirmed at the correct Lab project, not create.loopit.me.
- V2 at390x780: haptics opt-in toggles Off->On, persists to pause, switches backOff without changing run. Unsupported desktop remains playable. Actual device sensation not claimed.
- Vacuum practice: real movement and damage100->60->40. At40HP bottom guide remains Mega Vacuum direction/distance plus SUCTION instruction, while HP bar warns lowhealth. Screenshot lab-v2-low-health-boss.png.
- Real damage to0HP ends practice; Try this boss again restores100HP, size260, score0, four bossHP. Another boss menu works.
- V2 at400x580: DOM width/height400x580 and scrollWidth/scrollHeight400x580. Menus and controls remain reachable. Root console error log empty during standalone checks.
- V1 sound toggle enable/mute checked while paused with unchanged1:06 clock/score. V2 preserves existing sounds; no new BGM introduced. Audio listening and physical-phone haptics still unverified.

V2 source adaptations remain in the platform artifact. GitHub fixed commit is the approved local baseline; do not claim byte-identical V2 or synchronize by overwriting local source blindly. Core clear/nextstreet was played end-to-end on V1; V2 regression focused on wrapper, input, navigation, toggle and death/retry changes.

