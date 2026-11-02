# Loopit handoff — Far Horizons

Import the complete `games/tiny-raft-voyages/` folder, including bundled vendor modules and license. Serve `index.html` over HTTP and preserve relative module paths. Treat `journey.mjs` as the voyage scheduler; do not reintroduce the old endless-mode automatic storm timer.

Required acceptance:

- A route choice changes distance, weather power and arrival reward. It cannot be changed halfway through the passage.
- Trim sails and rigging alter travelled distance; scenery and wake reflect movement.
- A passage contains a weather encounter, then a visible island approach, landfall reveal and harbor result. Never award arrival after sinking, or award the same port twice on reload.
- Four ports finish a chapter at Dawn Lighthouse. Departing again retains the actual raft and inventory.
- Harbor is safe until departure. Collection/build/repair controls and local save continuation work on touch layouts.
- Optional sound, pause, failure/restart and existing-save migration remain functional.

Title: **Tiny Raft: Far Horizons**

Topic: **SurvivalSandbox**

Recommendation: **Build your floating home, choose a passage, brave the weather and reach the next island. A new horizon waits beyond every lighthouse.**

Repeat a full hosted playthrough and an actual-phone input/audio check before exhibition submission. Local validation does not establish hosted acceptance. This delivery does not publish an exhibition entry or modify the academic site.
