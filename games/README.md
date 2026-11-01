# Game Workshop

Browser games are kept here, one self-contained folder per game. Personal homepage and academic code remain independent.

| Game | Status |
| --- | --- |
| [Krabby Patty Flip](./krabby-patty-flip/) | Playable local prototype; Loopit import under review |

## Structure

```
games/
  README.md
  krabby-patty-flip/
    README.md
    LOOPIT_IMPORT.md
    index.html
    style.css
    rules.js
    game.js
    test-rules.cjs
    assets/
  next-game-slug/
```

Use lowercase English slugs. Keep assets, rules, tests and run instructions inside each game. Add a catalog row for every new title. Use commit-pinned links for Loopit handoff; keep local and platform acceptance separate. These games do not depend on or modify the academic site's app, packages or deployment. Only required game PNGs belong here; the complete source material library stays local.
