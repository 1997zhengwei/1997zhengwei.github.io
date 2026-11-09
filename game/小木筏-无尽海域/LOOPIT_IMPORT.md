# Loopit adapter contract

Import the complete `games/tiny-raft-endless/` directory from the game branch, including `vendor/`, rather than rewriting the rules from a screenshot. Preserve ES-module relative paths and serve `index.html` over HTTP. Source and progression checks are the reference implementation.

Required behavior:

1. No fixed final storm or win screen. Survive → reward → prepare next forecast, retaining all structures and resources.
2. Repeatable deck, net, brace and rigging upgrades with their actual costs and effects.
3. Forecast variation, rising average strength, directional bow protection, persistent repairable leaks and loss priority.
4. Visible character movement and increasing 3D deck footprint; large-deck rendering stays bounded.
5. Touch-friendly supply/build/turn/repair controls; rotate camera and toggle overview independently of bow heading.
6. Optional sound, pause, failure summary, fresh-voyage reset and browser-local saved continuation. If the host blocks storage, show Save unavailable without breaking play.

After import, replay collection → construction → storm → repair → next round, then loss/restart and save/reload on the hosted build. Check touch layout and sound on an actual phone. Local tests do not prove platform acceptance.

Title: **Tiny Raft: Endless Seas**

Topic: **SurvivalSandbox**

Recommendation: **Hook supplies, grow your raft, patch leaks and face ever-changing storms. How many can your floating home survive?**

This document is an integration handoff, not authorization to publish an exhibition entry. Keep the academic site and the other game folders independent.
