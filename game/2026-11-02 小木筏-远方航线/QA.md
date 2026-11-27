# Far Horizons — local QA, 2026-11-02

## Rules

- 11 existing resource, expansion, storm and save checks pass in `test-rules.mjs`.
- 8 voyage checks pass in `test-journey.mjs`: safe harbor; route consequences and route locking; rigging/trim distance and cooldown; cache reward and delay; one encounter and one arrival reward per leg; four-port chapter completion and retained growth; exact mid-storm save restoration; failure priority and fresh reset.
- JavaScript syntax checks pass for the modified modules.

The old rules' automatic preparation countdown is bypassed by the voyage scheduler. Actual travel distance schedules the weather encounter. The original hundred-round rules simulation is not a benchmark of this version's WebGL endurance.

## Actual browser playthrough

Tested at a narrow 394×684 in-app browser viewport. Started from a real existing 21×21 raft save (deck 19, net 11, braces 18, rigging 20), copied into the new version's separate save key.

- Completed all four passages: Driftwood Anchorage → Shell Bay (Coastal) → Wreck Reef (Salvage) → Stormgate (Salvage) → Dawn Lighthouse (Salvage).
- Chart marked each visited port. Selected routes changed forecast strength, displayed distance and actual arrival cargo. Trim sails showed its cooldown and advanced the passage. Weather caused leaks and hull damage; port arrival sealed leaks and applied rewards.
- Reached Dawn Lighthouse after 292 displayed nautical miles. The chart read SEA 1 / CHARTED with four completed stops; the result read EXPEDITION COMPLETE and offered Sea 2 routes.
- Continued into Sea 2 with the same 21×21 raft, facilities and inventory, then reached its Shell Bay at 362 nautical miles.
- Reloaded at Shell Bay, Wreck Reef and the lighthouse. Stops, distance, inventory and structure levels persisted; loading began paused.
- A separate localhost-origin test exercised Start a new voyage: zero ports/distance, initial four/two/two resources, 2×2 raft and level-zero structures returned. Built a net and departed again.
- No captured console errors/warnings in the main voyage tab after the chapter playthrough.

## Visual and scope notes

Route/results panel was moved from the small 3D stage to the whole app overlay so routes and the stay/upgrade button fit comfortably. Arrival now reveals the island briefly before the result. The deck and islands are procedural geometry; full-fluid physics and walking ashore are not implemented. Later seas reuse four destination archetypes with continued storm progression.

Proof screenshot `proof-lighthouse.png` is retained in the local delivery. Physical-phone endurance, audible sound output and Loopit-hosted behavior still require verification. This is not an exhibition submission.

Additional fresh-voyage interaction: the first coastal storm left the original 2x2 raft at 47% hull. Claimed a cache at 81% route completion; scrap increased by five and Salvaging 6s held the route at 57 nm. Started a walking leak repair during the stop. The earlier cache window was extended to 85% of the passage to make this optional decision easier to notice.

The fresh 2x2 voyage subsequently reached Shell Bay at 70 nm with 100% hull, zero remaining leaks and its net intact. The harbor was also visually checked at 1280x720 (760px centered game); proof-shell-bay.png records the island, pier and raft.


## Visual revision — continuous deck and six route environments

User screenshot showed a rectangular central patch on a 41x41 raft. The near-board mesh window and far-plane texture used visibly different surfaces. Replaced both with one continuous textured, raycastable deck surface; removed per-cell detail rebuilds. The full footprint remains walkable. Scaled ocean coverage with camera extent/aspect to remove the square water boundary at large overview sizes.

Added six deterministic route environments in `biomes.mjs`: Coral Keys, Amber Archipelago, Glacier Passage, Wreckwood Reach, Ember Strait and Moonlit Ruins. Scenery pools change the actual surrounding geometry, water palette, sky, haze and sunlight. Harbor keeps the completed route environment. Route cards preview the next environment. Existing resource/wave/journey rules and save format were not changed.

Actual checks on the user's 43x43 / 1,849-tile saved raft: loaded with all levels and inventory intact; visually confirmed continuous deck and covered ocean in overview; Glacier Passage displayed icebergs and pale-blue water. Selected the Wreckwood Reach salvage route, observed grey-green water, mist and broken-mast wreck geometry, then completed the passage and reached Wreck Reef at 428 nautical miles. Reload kept the same port/raft and correct scenery. Clicked a clear deck point in follow view and received the walking feedback. No captured console errors/warnings during initial scene review; syntax checks passed for all changed modules.

Screenshots: `proof-ice-deck.png`, `proof-wreck-route.png`. The six environment pools are constructed in the tested scene; individual playthroughs of all six were not performed. Real-phone performance and extreme-size endurance remain unverified. Rendering detail was reduced rather than expanding geometry with deck tile count.


## Crew visibility revision

Follow camera now stays at a fixed close scale and tracks the sailor on any deck size. Whole raft view retains the fit-to-raft overview and adds a 48px-wide clickable YOU pin; both the pin and Follow crew control return to close view. Supply labels steer clear of the character in follow mode. Large-raft roll is scaled down by deck size to reduce calm-water intersections with the deck.

Verified in the actual saved 48x48 / 2,304-tile raft at Dawn Lighthouse (8 ports, 596 nm): reload/continue preserves progress; Whole raft shows the pin; clicking YOU returns to close view; deck clicks move the character while the camera follows. Checked supply label clearance and captured follow/overview screenshots. No captured console errors/warnings. Syntax check passed. Real-phone checks and extremely large raft performance remain unverified.

Evidence: proof-crew-follow.png, proof-crew-overview.png.
