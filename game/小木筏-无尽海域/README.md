# Tiny Raft: Endless Seas

A standalone 3D survival sandbox with no fixed final storm. Hook supplies, expand the actual deck, upgrade collection and protection, repair leaks, and turn the bow into incoming waves. Surviving a storm rewards materials and starts the next preparation period with the same raft and inventory.

## Run

Serve this folder over HTTP (`python -m http.server 8768`) and open the server URL. No npm build, account, API key or external CDN is needed. Three.js 0.186.0 and its MIT license are bundled in `vendor/`. Run `node test-rules.mjs` for the progression checks.

## Play

- Tap floating supplies to hook them. Tap the deck to walk, or use WASD / arrow keys.
- Expand grows 2×2 to 3×3, 4×4 and beyond. Every added tile increases hull capacity. Upgrade costs increase with level.
- Nets repeatedly collect wood, rope and occasional scrap, including during storms. More levels improve their yield and collection speed.
- Braces reduce wave damage and leakage. Rigging improves aligned-bow protection and repair speed.
- The forecast shows weather, wave count, peak strength and duration. Rotate the bow with the bottom button to match the next incoming direction. Camera rotation is independent of bow direction.
- Tap a red leak, or Patch, to send the sailor to repair it for 2 wood. Moving or hooking another supply interrupts that job without spending repair materials. Repairs restore hull and remove one leak.
- Preparation has a countdown. Face storm starts early. Surviving grants resources; there is no lighthouse ending in this version. Sinking shows the record and offers a new voyage with a new weather seed.
- Pause and automatic saves preserve the current voyage in this browser's local storage. Reload starts paused; time away does not advance storms. Save data is per browser and origin, not cloud-synced.

## Endless scope and presentation

The rules have no preset round or upgrade ceiling. Five weather profiles vary intensity, direction, timing and leakage; later storms become stronger on average. Each individual storm stays short (up to eight waves). This is a game-rule simulation, not fluid or structural physics.

The deck footprint really grows. Near boards use instancing; after 24 tiles per side only a local detail window is rendered, while a repeated wood surface represents the whole deck. Camera follow and an overview toggle support larger rafts. Facility models have bounded visual detail while their upgrade effects continue. This controls geometry growth but does not promise unlimited hardware capacity or floating-point precision.

Procedural models, moving cloth, ocean deformation, rain, foam, soft shadows and optional synthesized sound require no external image assets. All primary UI text is English. The original `tiny-raft-big-storm` remains a separate short experience.

Recommendation: **Hook supplies, grow your raft, patch leaks and face ever-changing storms. How many can your floating home survive?**

Review status: local draft, not imported or published to Loopit. See `QA.md` and `LOOPIT_IMPORT.md`.
