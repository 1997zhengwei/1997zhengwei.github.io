# Pine Ridge Mill · Loopit handoff

## Approved source
This directory is the original, playable Chinese v0.3.1. The patch hides all station controls while the Park is open, including from camera close-ups. Use its exact files. Start at `index.html` and copy all of `src/`, `assets/ui/` and `vendor/`, keeping the relative paths and import map. All 3D art is built in code. Three.js and the Nunito font are vendored with licenses. The runtime needs WebGL, JavaScript modules, pointer events and browser local storage. `node build.mjs` produces static files in `dist/` with no npm dependencies or CDN assets. Use `node server.mjs 8944` for desktop QA. `npm test` covers seven rules and save cases.

## Preserve
- True 3D mill. Log trucks, overhead crane, rolling conveyors, visible log rings and cutting, real stock stacks and forklift loading. Crew stay on marked stands, separate from the truck and forklift routes.
- Call truck, saw, ship and get paid when the truck leaves. Expand storage and machinery in place. Optional crew automate one station each. Keep touch, mouse and desktop Q/W/E/R where supported.
- One navigable 3D Park. Four starter factories lead to new numbered plots without a fixed plot count. Revenue is shared, but stock, contracts, upgrades and workers are site-specific. After site 4, plot 5 needs 36 outgoing beams from site 4 and $7,800. Plot 6 needs 42 goods from site 5 and $12,460. Picking a finished plot opens its detailed playable view.
- Keep the four processing chains, order rollover, coin economy, render views, original compact HUD and 1200×1500 gold honor-card PNG. Fresh game starts with $85. The first completed 12-board order earns $204 and unlocks the $240 opportunity for River Kiln.
- No external account or online features are needed. Preserve save keys, balances, in-progress jobs, and route coordinates.

## English draft
Use **Pine Ridge Mill**. Localize the HTML, tooltips, accessible names, names generated in code, toasts, dialogs, contracts and honor card canvas text. Use compact labels: Logs, Saw, Kiln, Plane, Press, Ship, Park, Crew, Honors, Upgrade, Build, Enter, Next Lot, List, Back. Short sites: Pine Mill, River Kiln, Redwood Shop, Snowridge Works and Mill 05 / Kiln 06. Use compact count and capacity formats, USD values and appropriate English plural forms. Keep primary actions to one or two words.

## Checks
See `qa/QA.md` and the v0.3.0 Park, saw and loading screenshots in `qa/`. Test 320×580 and 400×580, an inbound load, two cuts, shipment, River Kiln opening, Park drag and zoom, reload recovery and English card preview. Report imported source and any host adaptation. Save an editable draft only.
