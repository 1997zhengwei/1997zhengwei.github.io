# v0.6.0 · Move between deposits, light key-piece challenges

User request (2026-11-11): require moving to another spot after harvesting; keep ordinary pieces easy and key nodes mildly challenging; show the actual completed planet.

- A depleted node now waits for the player to leave a 2.2-unit radius before starting the existing five-second recovery. This applies to crops too. Solid props still cannot regrow around the explorer. A small stump or rubble trace marks the empty spot. Depletion has a toast and a contextual explanation.
- GOAL and the legal-action planner share resource routing. They prefer ready deposits, can wait for a recovering deposit, and route away from an exhausted spot when none are ready.
- Ordinary piece costs are unchanged. Planet 1 has 29 golden key pieces out of 642, first appearing at depth 4. They require four extra Wood, three extra Stone and two or three special materials; at most three input types. Totals are 17–24 items versus 8–16 for ordinary pieces. They have a gold star label/pad, a completion toast and a fine gold edge in completed terrain.
- Existing inventory, owned pieces, partial payments, free coverage bonuses, crafting recipes, completion surprise and next-planet rewards remain. Save schema stays 4; a missing depletion flag in an old depleted save is safely treated as awaiting departure.
- No resource staging, paid tool upgrades, stamina, combat, capacity system or other pacing systems were added. The previous visual art is retained.

Actual complete-world image: `qa/v06-complete-world.jpg`. Acceptance and limits: QA-v06.md. Local only; no GitHub or Loopit publication.
