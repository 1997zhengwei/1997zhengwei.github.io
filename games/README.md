# Game Workshop

All browser-game experiments live under `games/`, one directory per game. The personal website and academic code elsewhere in this repository remain independent.

| Game | Folder | Status | Engine |
| --- | --- | --- | --- |
| Krabby Patty Flip | [krabby-patty-flip](./krabby-patty-flip/) | Local checks and Loopit V2 playthrough passed; unpublished draft | Vanilla Canvas + JavaScript |
| Krusty Lunch Rush | [krusty-lunch-rush](./krusty-lunch-rush/) | Local six-order win/loss/replay passed; character action draft; not yet imported to Loopit | Vanilla Canvas + JavaScript |
| Tiny Raft, Big Storm | [tiny-raft-big-storm](./tiny-raft-big-storm/) | Local gather/build/storm/win/loss/replay checked; review draft | Three.js 0.186.0, bundled |
| Bikini Bottom Bubble Delivery | [bikini-bottom-bubble-delivery](./bikini-bottom-bubble-delivery/) | Local three-delivery win/collision/loss/replay checked; review draft | Three.js 0.186.0, bundled |
| Tiny Raft: Endless Seas | [tiny-raft-endless](./tiny-raft-endless/) | Endless expansion and varied storms; local play/save/loss/restart checked; review draft | Three.js 0.186.0, bundled |
| Tiny Raft: Far Horizons | [tiny-raft-voyages](./tiny-raft-voyages/) | Route choices, island landfalls and lighthouse chapters; local full expedition and continued voyage checked | Three.js 0.186.0, bundled |
| Bubble Roll: Endless Tide | [bubble-roll-endless](./bubble-roll-endless/) | Loopit Lab V2 draft; first-street clear/next-street and death/restart played on V1, V2 preview/navigation/retry checked | Three.js 0.186.0, bundled |
| Krusty Krab: Lunch Gone Wild | [krusty-lunch-gone-wild](./krusty-lunch-gone-wild/) | User-approved local 3D kitchen; Loopit import in progress | Three.js 0.186.0, bundled |

## Folder convention

```text
games/
  README.md                  # This catalog
  krabby-patty-flip/
    README.md                # How to run and what to play
    LOOPIT_IMPORT.md         # Adapter contract
    index.html
    style.css
    rules.js
    game.js
    test-rules.cjs
    assets/                  # Only assets used by this game
  next-game-slug/             # Future independent games
```

Use short lowercase English folder names with hyphens. Keep each game's assets, rules, tests and setup instructions inside its own directory. Add a catalog row for every new game. Record commit-pinned source links when handing a version to Loopit, and distinguish local checks from platform acceptance. Do not couple these prototypes to the academic site's app, packages or deployment workflow.

The full 100-image source library is maintained locally in the user's Loopit material folder; only the selected game's required PNGs are uploaded here.

See [WORKFLOW.md](./WORKFLOW.md) for the code-first production and verification process.
