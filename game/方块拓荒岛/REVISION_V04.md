# v0.4.0 · Planet as the main game / completion secret

User request, 2026-11-11: start directly with the whole-planet assembly game, and provide a surprise after the final piece.

## Direct entry

The normal entry now promotes/restores to planet mode before rendering. New adventures begin with 19 connected cells out of a closed 642-cell sphere, the explorer kit, all renewable raw inputs and three repeatable exchanges. There is no prerequisite island campaign or portal completion. Existing backpack balances, frontier investment and original island data are kept. Existing island progress can still be visited through the pause menu. QA-only legacy campaign entry: `?qa=<id>&legacy=1`.

## Ending (implementation spoilers)

The last paid piece triggers a camera reveal, luminous orbit lines, a hatching voxel egg, a flying guardian and a close greeting. It remains in the established voxel style and uses the existing renderer. Claiming welcomes the companion, unlocks cyan Diamond tools with an actual permanent +1 harvest yield, and grants 12 Emeralds. A world-awakening star is recorded per claim. The guardian follows in subsequent play and on new planets.

The cinematic hides/inerts normal controls and pauses resource simulation. Skip goes to its reward stage; it does not grant the reward. A native claim is required. Reloading before claiming reopens the ending; after claiming it returns to play. Replay is cosmetic and cannot repeat the grant. NEXT PLANET is available after claiming. The original game font, palette, renewable inputs and base controls remain.

Reduced-motion preferences select the static greeting and permit claiming immediately. This is implemented but requires separate browser preference validation before claiming it was tested on a device.

## Delivery boundary

Local v0.4.0 only. No GitHub or Loopit upload was requested or performed. Browser and rules acceptance are recorded in QA-v04.md.
