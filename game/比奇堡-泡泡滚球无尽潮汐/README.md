# Bubble Roll: Endless Tide

A 3D SpongeBob fan-game: roll, grow, explore randomized streets and defeat four rotating bosses. This standalone folder contains all runtime dependencies.

## Play

From this game directory, run `python -m http.server 8768 --bind 127.0.0.1`, then open http://127.0.0.1:8768/ . Serve over HTTP; do not open as a file URL.

No build step or remote CDN is required. The local Three.js files and their license are in `vendor/`.

## Controls

- Move: WASD / arrows, the onscreen joystick, or tap the ground.
- Dash: Space / yellow Dash button.
- Active power: E / green power button.
- Switch owned active powers: Q / swap button. Cooldown is shared.
- Pause: Escape / top-right button. Switching away from the page pauses play.

## Loop

Collect props to grow, then roll up smaller robots. Dash through similarly sized robots; dodge larger ones or use Mega Bubble. Robot ground rings and nearby text show the current relationship.

Level-ups pause time and offer powers: Magnet, Pinball Dash, Bubble Decoy and Mega Bubble. Each has five upgrade levels; fully upgraded runs receive recovery and score bonuses instead of more selection screens.

Explore each randomized street and roll into three supply caches. Their positions appear on the minimap, and the directional guide points to the nearest unopened cache. Collected caches disappear from the scene and minimap and cannot pay twice. After all three open, approach the beacon and press **Challenge** when ready. There is no automatic timed boss spawn. Ordinary robots retreat and environmental jelly hazards pause during the encounter.

Defeat the boss to remove it immediately and open the Street cleared result. Rewards (+30 size, +1,800 points, boss XP and up to 20 HP) are credited automatically once. Choose Next street to generate another route; no exit search is needed. Any earned level-up is offered upon entry. Size, powers and score carry over; entering the next street restores 20 HP. Resource clusters, road patterns, caches, hazard positions, current location/direction and landmark sides vary by seed. The four route families are Coral Crossroads, Drift Lanes, Market Pockets and Shell Ring.

### Health and survival

The prominent health bar displays 100 HP at full health. Each damaging hit removes 20 HP, with brief protection against repeated contact. Medical pickups restore 20 HP, capped at 100; the medical cache also restores 20 HP. At 40 HP the bar warns of low health, and at 20 HP it turns red with a gentle edge tint. At zero HP the run ends and must be restarted. The internal health counter uses five units, displayed as 20 HP each. Size and health are independent.

### Four bosses

- **Plankton's Truck:** dodge the marked charge lane and land three separate dashes.
- **King Jellyfish:** escape the three lightning circles, then dash into the green exhausted phase; four hits.
- **Mega Vacuum:** leave the suction cone, then dash into the cooling motor; four hits. Standing at its suction origin is dangerous.
- **Claw Crusher:** leave the locked landing zone and attack after it lands; four hits.

The first expedition starts with the truck. The other three appear in shuffled order; later four-boss bags reshuffle without an immediate repeat at the boundary. Armoured bosses only take damage during their green opening.

**Boss practice** on the opening screen lets players choose any of the four immediately, with full health, size 260 and Mega Bubble. Practice scores do not affect the expedition best score. A practice defeat can be retried; practice victory returns to the boss selection.

Conch Street, Jellyfish Fields and Krusty Backlot cycle indefinitely. Later streets have faster enemies and new spawns scale partly with current size; already spawned robots do not automatically grow with the player. Health, enemy count, particles and visual bubble size are bounded to preserve readability.

### Visible growth and expanded arena

Normal bubble radius now grows smoothly from 1.1 toward 4.1 world units (about 3.7× starting diameter). Mega Bubble temporarily adds 25%, up to about 4.7× starting diameter. The character retains its scale as a visual reference. The camera backs off only slightly as the bubble grows, and the HUD displays the diameter multiplier.

The arena spans 50 × 50 units instead of 32.8 × 32.8, approximately 2.3× the area. An outer ring of loot, relocated landmarks, larger floor and matching minimap fill the expansion. Pickup reach and collision use the growing radius; magnet reach expands beyond the bubble. Boundary clearance keeps even a stretched Mega dash on the floor.

## Verification

```powershell
node test-rules.mjs
```

See `QA.md` for the scope of automated checks and actual browser playtesting. Best score is stored locally; an unfinished run is not saved across reloads. See `LOOPIT_HANDOFF.md` for platform integration. Local QA does not imply Loopit acceptance.

## Loopit Lab draft

[Open the correct Lab editor](https://lab.loopit.me/pgc/workbench/01a19fca-93ad-7565-a97e-0d9d9192cca6?kind=draft) · [Play V2](https://cdn-cf.loopit.me/public/game/01a19fca-93ad-7565-a97e-0d9d9192cca6/2117486811075842048/workspace/dist/index.html?loopit_preview=draft)

Unpublished draft. Imported from commit `20c7ac638a69e0d2a9e70de0431f81027de4ba99`. V1 passed an actual first-street clear/next-street and death/restart playthrough. V2 fixes embedded preview, prioritizes boss navigation, and adds opt-in haptics; changed paths were checked separately. See [platform QA](PLATFORM_QA.md). Platform host adaptations are not a claim of byte-identical source synchronization. Evidence screenshots remain in the local release QA folder.
