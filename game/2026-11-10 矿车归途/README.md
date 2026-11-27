# 矿车归途 · Minecart Rescue — Junction Railway

十关三维铁路拼图：用有限轨道安排编号矿车同时出发，避开碰撞，按 1 → 2 → 3 接入车头。普通交汇处自动合流；只有金色 SHORT / LONG 按钮需要操作。

本地运行：在本目录执行 `npm start`；测试：`npm test`（无需安装依赖）。也可直接打开 `play.html` 试玩。英文为游戏内主要文案。

Version 2.1 clarifies automatic junctions and interactive switches. Version 2 replaces the first single-cart touring prototype with simultaneous numbered-carriage railway puzzles. The requested reference is Afterburn's **Railbound**: limited rail tiles, independent track networks, ordered coupling, shared junctions, collisions, switches, waiting gates and tunnels. All ten layouts, source code, models and interface assets are original to this project. Minecraft appears in block geology, villagers, Steve in the engine, and redstone-themed gates.

## Play

Open `play.html` for the approved self-contained preview. `index.html` is the editable modular entry. The editable source folder needs only Node.js 20+:

```sh
npm start
```

Open `http://127.0.0.1:4173`. No npm installation is needed: Three.js 0.187.0 is vendored. `npm test` runs the railway-rule regressions.

## How the game works

- Drag anywhere on the grid to paint rails. Independent strokes can connect different parts of the network. White rail ends must meet. Grey sleepers are fixed; orange sleepers are editable and consume the limited tile stock.
- Tap an orange rail to change its shape. Toggle the eraser to remove player rails. Undo reverses a placement or stroke; Reset clears player rails and switch choices. Fixed rails stay in place.
- All numbered carriages depart at the same time and travel at the same speed. They must reach the engine in the order **1, 2, 3**. A fully connected network can still fail if a later-numbered carriage arrives first.
- Cars occupying one junction on the same beat, or swapping an edge head-on, collide. Following safely one tile apart is allowed. A longer detour changes arrival timing.
- Ordinary three-port joins are automatic: the white arrows lead both approaches toward the engine. They have no lever and cannot be toggled. Only explicitly authored gold switches marked SHORT / LONG choose a branch. Tap the lever tile or its larger label before departure to change it. Saved switch settings on ordinary joins are ignored.
- Redstone gates labeled AUTO +N hold each passing carriage once for the indicated number of movement beats. Paired tunnel mouths transport carriages to the other end. These are the explicit implementations of this adaptation, rather than a claim that every detail matches every release of the reference.
- Play launches the whole simulation; the button becomes Stop. Stop returns all cars to their starting positions while preserving the track layout. Playback speed can be 1× or 2×.
- Puzzle selection is available from the top-left grid button. Completion, each puzzle's layout and sound preference are saved locally. There are no stars, emerald collection, powered uphill rails or single-path restrictions from the rejected first prototype.

The 2.1 clarity pass also changes fixed sleepers from olive green to slate grey, lowers on-board rocks, removes trees from blocked tiles, opens tunnel mouths so rails remain visible, and explains the automatic join directly in 1-3 and 1-5. Puzzle maps, tile budgets and arrival timings are unchanged.

## Keyboard alternatives

Arrow keys move a visible grid cursor. Keys `1–6` place **EW, NS, NE, ES, SW, NW** track shapes. `T` toggles a junction; `E` toggles the eraser; `Delete` removes the selected editable tile; `Z` undoes; `R` resets; `Space` plays/stops when the canvas is focused; `H` shows a hint. Escape closes a modal.

`?qa=1` selects a genuinely separate local-storage key for repeatable UI testing without changing the player's layouts or completion records.

## Files

- `src/rail-engine.mjs`: pure simultaneous simulation, routing, collisions and ordered coupling.
- `src/puzzles.mjs`: ten original puzzle layouts, fixed anchors, budgets, test solutions and hints.
- `src/rail-world.mjs`: full-screen orthographic cartoon landscape, outlined models, white rails, numbered carriages and engine animation.
- `src/main.mjs`: painting, history, keyboard controls, simulation playback, save state and interface.
- `src/audio.mjs`: locally synthesized sound and quiet original ambience.
- `tests/rules.test.mjs`: positive and negative railway regressions.
- `vendor/three.module.min.js`, `vendor/THREE-LICENSE.txt`: Three.js 0.187.0 and its full MIT notice.
- `QA.md`: actual validation evidence and limits.

## Attribution and stage

Design reference: [Railbound](https://afterburn.itch.io/railbound), including its comic-inspired presentation and track-planning principles. No reference screenshots, level layouts, source code, music or models are distributed as game assets. Minecraft-inspired fan work; not an official Minecraft or Railbound product.

The user approved version 2.1 and authorized GitHub upload under a Chinese game directory plus creation of a Loopit draft. Gallery publication and review submission are outside this handoff. See SYNC_STATUS.md for the verified remote state.
