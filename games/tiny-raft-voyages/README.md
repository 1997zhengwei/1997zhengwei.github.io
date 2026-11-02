# Tiny Raft: Far Horizons

A 3D raft-building voyage with places to reach. Choose a coastal passage or a salvage run, gather supplies while sailing, cross one weather system, then arrive at an island. Four landfalls complete an expedition; your existing raft continues into the next sea.

## Run and controls

Serve this folder over HTTP. No npm build, account, API key or external CDN is required. Three.js 0.186.0 and its MIT license are bundled in `vendor/`. Open `index.html` through the server, not as a file URL.

- **Map / Chart route:** choose your next passage while moored. Coastal passages are longer with 0.75× wave strength; salvage routes are shorter with 1.28× strength and richer arrival cargo. Once underway, the route stays fixed until landfall.
- **Trim sails:** seven seconds of extra speed, with a seventeen-second cooldown. Rigging upgrades also increase actual distance travelled per active second. Storms slow the raft.
- Tap floating supplies to hook them. Tap the deck to walk, or use WASD / arrow keys. Build and upgrade during calm sailing or at harbor.
- Turn the bow into the displayed incoming-wave direction. Tap red leaks to send the sailor to repair them for two wood.
- A floating cache appears early in each passage and drifts away near landfall. Salvaging gives scrap and rope but stops the raft for six seconds; it can only be claimed once per passage.
- **Pause / Continue:** saves locally and freezes progress. Reload starts paused. Sound is optional.

## Destinations and continuation

1. **Shell Bay:** palm island and repair harbor, restores 35% of hull capacity.
2. **Wreck Reef:** shipwreck and fittings depot, gives six extra scrap.
3. **Stormgate:** stone sea arch and sailmakers, gives six extra rope.
4. **Dawn Lighthouse:** expedition finish, full hull restoration and chapter completion.

Each port grants the chosen route cargo, seals remaining leaks and offers safe time to expand. Non-repair specialty ports restore 15% hull. After the lighthouse, a new sea begins while deck, facilities, inventory, records and storm progression remain. The four destination archetypes repeat in later seas; this first draft does not generate an unlimited variety of island models. Storm sequence and difficulty continue progressing.

The chart shows visited stops, current destination, leg completion and accumulated nautical miles (compressed game-time units). Water streaks and supply drift move with actual travel, while destination scenery approaches the raft. On arrival a short landfall reveal precedes the harbor result. Camera overview helps inspect larger rafts.

## Save compatibility and scope

Save key: `tiny-raft-voyages-v1`. On first load, a valid non-sunken `tiny-raft-endless-v1` save on the same browser origin is copied into the departure harbor. The original save is not overwritten. A new voyage resets only this version. Local storage is browser/origin-specific, with no offline progress or cloud sync.

`rules.mjs` retains the tested expansion, resources and wave mechanics. `journey.mjs` controls departures, distance, encounters, ports and chapters; its scheduler supersedes the old automatic storm countdown. The scene uses procedural models, repeated deck textures and bounded instanced detail. No extra artwork download is needed. Very large worlds and physical-phone endurance have not been benchmarked.

Tests: `node test-rules.mjs` and `node test-journey.mjs`.

Recommendation: **Build your floating home, choose a passage, brave the weather and reach the next island. A new horizon waits beyond every lighthouse.**

Status: local review draft with GitHub source; not yet imported or published in Loopit.
