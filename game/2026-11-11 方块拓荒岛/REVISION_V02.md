# v0.2 — reference-led rebuild

The user rejected v0.1 as substantially different from My Little Universe. The previous claim of similarity was too broad: a comparable collection loop did not establish visual or overall gameplay fidelity.

## Sources actually inspected

- [Publisher's official overview](https://say.games/games/my-little-universe/).
- [Mobile first-world walkthrough](https://www.youtube.com/watch?v=-nAI_6GPg7w), observed around 0:30, 1:52–1:56 and 4:27. This is an older mobile version recorded by a third party, not our own installed playthrough and not evidence of the latest version's complete behavior.
- Previously inspected official mobile store images remain context for portrait HUD density.

Observed: a curved blue planetary surface against purple space, thin raised hex terrain, a pale path across green forest, coral-brown stone areas, tall clustered deposits, white construction footprints, unboxed paid/required counts, a small resource column at the upper right and tool-level buttons at the lower left. The game centers the active character and nearby frontier instead of filling the screen with explanation cards.

Local observation image `reference/original-mobile-4m27.jpg` is a research capture; it is not used as a game asset and is excluded from future upload by `.gitignore`.

## Implemented

- Replaced the flat rectangular floating island / striped sea with a true spherical blue planet, curved hex surfaces, coral stone patches, a forest path, cyan horizon and dark sky. Land casts shadows onto the planet.
- Replaced the long map with compact connected regions around the planet. Ruins complete a walkable return shortcut. Full optional exploration now yields 72 land hexes across the existing 12 construction / upgrade nodes.
- Terrain is opened progressively during material delivery. Each newly visible hex is real walkable ground, and its resources become available when their ground opens. Partial progress survives reload.
- Removed large brand, objective and context cards. Added compact resource column, actual 3D collectible thumbnails, Nunito typography, small tool-level controls and direct paid/required labels.
- Back materials visibly stack up to 45 rendered units, sway with movement and fly into the visible construction pad. Pickup models are batched to one draw per resource unit. No item balance is faked for appearance.
- Raised forest silhouettes, improved player/tool contrast, added a visible strike arc and resource breakup. Foreground resources fade when they cover the explorer.
- Matched camera tracking and elevation to the local planetary normal, with input mapped back from screen direction onto the curved surface.
- Tightened construction activation to its visible footprint, moved a forest-adjacent pad and moved the portal away from the ruins reveal point to prevent accidental payments and player trapping. Service locations retain visible ground pads.
- Migrated old balances, partial payments and unlocks, including old square-grid positions when possible. Normal save namespace is preserved. QA controls use separate save keys.

## Deliberate adaptation boundaries

Steve-like voxel actors, block trees / ores / workbench / furnace, emerald barter and the final obsidian portal retain the user's Minecraft requirement. They are original game assets. The commercial game's orange character, exact models, literal map, industrial chains, campaign length and combat roster have not been reproduced. This build should be described as a revised Minecraft adaptation, not as a pixel-perfect or content-complete port.

## Verification

See [QA.md](QA.md) for current rules / actual browser checks and [design-qa.md](design-qa.md) for reference comparison. Earlier evidence remains in [QA-v01.md](QA-v01.md). v0.1 source checkpoint is in the ignored `baseline-v01/` directory; restoring those files into the active game folder is necessary to run that version.

All changes remain local. No GitHub or Loopit write has been performed in this revision.
