# Loopit adapter contract

Import this directory's actual source, not just its screenshots or a new interpretation of the concept. Keep the title `Krabby Patty Flip` and English player text. Use a native Loopit project and adapt the outer entry point to the current host. Do not iframe localhost or GitHub blob pages.

1. Read `index.html`, `style.css`, `rules.js`, `game.js` and this file.
2. Preserve the tested rules: 1.4-second charge; landing x = 190 + 358q; trajectory duration 0.9 seconds; gravity 820; start (106,303); target x 345,457,395 in that order; catch +/-31; perfect +/-11; scores 100/150; three misses end shift; three orders win; no double scoring.
3. Fetch all seven PNGs in assets/. Preserve alpha. If relative paths cannot be packaged, use commit-pinned raw GitHub asset URLs. Do not invent unavailable character art.
4. Keep pointer hold/release + Space, predicted dotted arc and green landing window. Pause when backgrounded; resume must be explicit; cancel a held charge when losing focus. Restart resets all round state and keeps the sound preference.
5. Fit the actual portrait preview, including result and restart controls. Keep renderer scaling separate from logical coordinates (600x450).
6. State whether the GitHub source was actually read and list any host adaptations. If fetching fails, say so instead of claiming import success.
7. Do not publish to the exhibition. Produce a playable draft for review.

Acceptance: play all three orders to a result, restart and flip again; miss three times; pause and resume a flying patty; ensure assets render and the restart button is visible in the real preview.
