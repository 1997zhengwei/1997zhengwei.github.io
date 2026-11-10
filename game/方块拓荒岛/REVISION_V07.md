# v0.7.0 · A world worth celebrating

User request: the completed sphere still looks plain; make it richer and give completion more surprise and achievement. Local visual/ending refinement only.

## Changes

- Completion panorama now reveals four original voxel wonders: Heartwood Sanctuary with a great tree and hanging lanterns, Temple of the Sun, Amethyst Citadel and Crown of Winter. They occupy deterministic matching biomes and sit on floating islands with little cascades. They are reward scenery in the complete-world panorama, not new gameplay buildings or collision obstacles.
- The completed diorama gains small villages, flower groves, larger distant trees, crystal gardens, snowy peaks, fine gold connections between key pieces, a soft atmospheric halo, orbiting star rings, an aurora ribbon and bounded fireworks. Static voxel parts use baked color meshes; there are no imported game assets or image-generation dependencies.
- The ending now pulls back from the final piece, lets the wonders emerge, introduces the guardian and presents a World Builder achievement card. Native Skip, reward claim and replay remain available. Claims still use the existing once-per-world rule and reward amounts.
- Claiming opens a saved-world panorama. VIEW YOUR WORLD returns there later. Drag the canvas to rotate yaw and pitch; native rotation buttons are also available. Back to exploring restores the original controls. The panorama hides busy resource HUD elements and retains a clear saved-world caption.
- Reduced-motion preference stops new orbiting, floating, ribbons and firework motion; the ending jumps to its completed composition. Visual scenery is not instantiated until a complete planet is viewed. Old complete saves can replay the new ending without paying or earning the reward twice.

## Preserved

`globe.mjs`, `core.mjs`, `world.mjs` and `frontier-pilot.mjs` match v0.6 SHA-256 hashes. No material prices, departure/recovery rules, coverage bonuses, rewards, inventory, save schema or map size changed. Package version is 0.7.0; saves remain schema4.

Normal local play: http://127.0.0.1:8898/?v=7
Actual legally completed independent demo: http://127.0.0.1:8898/?qa=v07-awakening&view=world
The view query only opens a panorama when that browser save is already complete and claimed; it grants nothing. It is not an independently hosted public demo or a portable filled save.

Evidence: QA-v07.md; actual screenshot `qa/v07-world-panorama.jpg`. Pre-change source checkpoint: ignored `qa/checkpoint-v06-ending.zip`. No GitHub or Loopit upload.
