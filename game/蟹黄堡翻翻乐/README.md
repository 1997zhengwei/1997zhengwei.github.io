# Krabby Patty Flip

A small SpongeBob-themed kitchen game made as a code-first Loopit import experiment. Hold the big button (or Space) to charge a flip, then release when the landing arc reaches the bun. Serve three orders before missing three times. Perfect landings earn 150 points; other catches earn 100.

[Play the verified Loopit V2 draft](https://cdn-cf.loopit.me/public/game/01a19801-816d-7c71-9da9-949e6aaa19b8/2116938131159674880/workspace/dist/index.html?loopit_preview=draft) · [Loopit editor](https://lab.loopit.me/pgc/workbench/01a19801-816d-7c71-9da9-949e6aaa19b8?kind=draft)

The source lives in `games/krabby-patty-flip/` on branch `codex/krabby-patty-flip`. No changes were made to the academic website's main branch or deployment. See `EXPERIMENT_LOG.md` for the separate local and platform checks; Loopit V2 is a host adapter of this source, not a claim of byte-identical code.

## Run

Open `index.html` directly, or run `python -m http.server 8766` in this directory. No install, build, CDN or API key is needed. Run `node test-rules.cjs` for gameplay checks.

## Files

- `rules.js`: deterministic charge, trajectory, hit window, scoring and state transitions.
- `game.js`: Canvas rendering, pointer/keyboard input, pause and optional synthesized sound.
- `style.css`, `index.html`: responsive UI and accessible DOM controls.
- `assets/`: seven generated transparent PNG props, copied unchanged from the user's 100-image collection. Fan-made illustrations; not official artwork. No character sprites or original soundtrack are included.

## What was learned from the creator case library

The local Loopit skill's Color Alchemy and Easy Game case notes emphasize that an action should visibly change the world, and failure should teach the next attempt. Here, holding changes the visible predicted arc; releasing launches the patty; a miss says whether to hold longer or release sooner. These are design principles, not claims of measured popularity or retention.

## Constraints

This isolated experiment does not change the parent repository's app or deployment. Local gameplay checks and Loopit-host checks are recorded separately. There is no backend, tracking, purchase, leaderboard or platform publication.
