# Verification scope — 2026-11-03

## Local approved baseline
- Deterministic rules test: powers, health/death/restart, growing collision radius, 100 procedural layouts, four bosses, shuffled boss bags, rewards once, frozen clear screen, guarded next-street transition and 600-second bounded-population simulation.
- Real browser: explore all three caches, summon and defeat first truck, immediate clear result, Next street reaches Jellyfish Fields with retained size/powers and queued upgrade. Collected cache disappears from scene and minimap.
- Real browser: King Jellyfish practice victory, vacuum death and 100-HP retry; Claw Crusher telegraph/jump/opening observed. Full Claw victory covered by rules test, not claimed as browser playthrough.
- 390 x 780 browser layout checked without page overflow. Physical-phone testing and audible sound-quality review are not claimed.
- Browser background throttling affects elapsed play time. Test active foreground; never retune difficulty using background timing.

## Packaging
Standalone source preserves gameplay. Removed two navigation links to a local-only chapter sibling. Vendor hashes matched existing repository copies. No hidden debug inputs or immortality added.

## Platform
Loopit generation, host input, phone-size UI, audio lifecycle, clear/next-street and death/restart must be tested separately after import. This document is not a claim that those checks have passed.
