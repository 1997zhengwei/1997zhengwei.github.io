# Bikini Bottom Bubble Delivery

A small three-dimensional SpongeBob fan game. Aim and inflate a bubble to deliver three parcels to Patrick, Gary and Squidward. Bubble size changes lift and clearance; parcel weight changes the air needed. Match the receiver's direction and height, and avoid the coral arch.

## Run

Serve this directory with `python -m http.server 8768`. Open the server URL; ES modules require HTTP. No npm installation, build, remote CDN or API key is needed. Three.js 0.186.0 is bundled under `vendor/` with its MIT license. Run `node test-rules.mjs` to check trajectory, clearance, delivery, loss and replay rules.

## Controls

- Slider, minus/plus, or A/D: change the horizontal direction.
- Hold the main button or Space: inflate. Release: deliver.
- The dotted 3D path and green height band use the same math as delivery and obstacle checks.
- Bigger bubbles rise farther but occupy more space. The heavier final parcel needs more inflation. Three deliveries complete the route; four failed bubbles end the attempt.
- Camera arrows rotate the view without changing the world-space aim direction. Pause or switch away to freeze gameplay; replay restores the route and four chances.

## Visuals and asset boundaries

`characters.mjs` creates actual three-dimensional stylized figures of SpongeBob, Patrick, Gary and Squidward. Their eyes, noses, outfits, limbs and defining shapes are modeled geometry; the SpongeBob silhouette is a beveled wavy extrusion rather than a single cube. These are first-pass fan interpretations, not official production models or reconstructions from the existing WorkBuddy PNG pack. They can be replaced by approved GLB assets later without changing rules.

The scene includes a pineapple house, Patrick's rock, a stone head house, coral, a sand diorama and a transparent rim-lit iridescent bubble. The bubble uses a small custom shader; no external texture is required. Character reactions use grouped rigid geometry, not a production skeletal animation rig. Swept collision samples test simplified spherical obstacle volumes; this is a readable authored arcade trajectory, not a full fluid simulation.

All player-facing text is English. The fictional character responses are original fan-game dialogue. Optional sound is synthesized, not the show's original audio. This draft is for review; it has not been imported or published to Loopit.

Suggested recommendation: **Aim, inflate and release! Deliver bubbly parcels around Bikini Bottom, dodging coral and matching each neighbor's delivery height.**
