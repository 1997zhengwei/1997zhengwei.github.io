# Krusty Lunch Rush

A character-led kitchen arcade game: hold to aim, release to flip, and serve six orders before three misses. Double orders take two patties; later plates move. The green meter and dotted arc show the same landing calculation used by the game. Perfect flips and consecutive catches earn extra tips.

## Play locally

Open `index.html` directly, or run `python -m http.server 8767` in this folder. No package install, build, remote fonts, CDN, API keys, analytics or backend. Pointer/touch and Space are supported. Escape pauses; tab switching pauses automatically. Sound is optional. Reduced-motion preferences suppress ambient motion, spins and confetti.

Run `node test-rules.cjs` for deterministic gameplay checks. See `QA.md` for actual browser verification, separately from rules tests and platform verification.

## Visual direction

The supplied WorkBuddy action pack contributes eight transparent character frames and one kitchen background. They are copied unchanged. Each character uses a shared 1024-pixel canvas with foot anchor `(512, 980)`; frames are not resized independently by their visible bounds. Read-only alpha inspection found rendered foot pixels reaching y=981 in all eight frames. The action height difference is under 1% for SpongeBob and zero for each customer's pair.

SpongeBob switches between ready, flip, cheer and miss. Patrick and Squidward switch from waiting to served only after a complete order. The burger is a separate sprite animated from the plate toward the customer. Soft light, shadows, steam and particles are bounded decorative layers; they never alter collisions. This is a 2D layered illustration game with frame-based performances, not a skeletal or 3D animation system.

`assets/burger.png` and `assets/patty.png` come from the existing user-supplied generated prop collection. The other nine PNGs come from the user-supplied WorkBuddy action pack. Fan-made artwork, not official assets; the supplied pack is marked for noncommercial fan practice. No original soundtrack is included; the optional sound feedback is synthesized.

## Code ownership

- `rules.js`: charge, trajectory, future moving-plate position, scoring, doubles and finite game states.
- `game.js`: presentation, loading, pointer/keyboard lifecycle, pause, synthesized audio and best score persistence.
- `index.html` / `style.css`: English player UI and responsive controls.
- `LOOPIT_IMPORT.md`: concrete adapter contract for a later Loopit draft.

The earlier `games/krabby-patty-flip/` remains a separate working game. This new directory does not alter the academic site's main branch or deployment.
