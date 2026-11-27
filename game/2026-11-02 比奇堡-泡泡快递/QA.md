# Local draft verification — 2026-11-02

Real native pointer holds and slider keyboard input were used in the connected browser. Gameplay state was never injected.

- Initial full route: delivered all three parcels to Patrick, Gary and Squidward, earning 550 tips with two perfect deliveries and all four chances retained.
- At 400×580 CSS pixels, repeatedly inflated an oversized bubble toward Patrick. The actual bubble hit the arch; the UI identified the arch crown. Four failures removed exactly four chances, awarded no tips and led to the loss result with a visible replay button.
- Loss → replay restored all four chances, zero score, first parcel and zero direction. A follow-up attempt was exercised. Later final-file checks successfully delivered Patrick's parcel with the UI showing 33% air, then Gary's at 58% air.
- Paused Gary's actual flight at score 200 / one delivery. Score and chances remained unchanged while paused. Resuming completed exactly one delivery, reaching 400 tips / two deliveries with four chances intact.
- Final controls fit in a measured 400×580 viewport, document scroll height 580. Main button bounds y=519.8–572. Slider, direction buttons and pause remained reachable. Camera framing was adjusted to expose receiver labels below the instruction card.
- Five rule checks passed, including complete 600-point perfect route, bubble-size clearance, mass-dependent lift, true 3D endpoint positions, four-miss loss, isolated restart and clamped input. Syntax checks passed. The final inspected page logged no JavaScript errors.

Corrections during review: moved gameplay timers to elapsed active time instead of frame count; updated the shadow-map constant for the bundled library; made a collision pop at the sampled obstacle time; retained the specific miss hint after the reaction; added last inflation percentage so players can adjust their next try; clarified that the four dots are chances.

Local screenshots include `proof-win.png`, `proof-loss-mobile.png` and final preview captures. The first win screenshot precedes the later collision timing and explanatory-label fixes; affected collision, pause and delivery paths were rechecked afterward.

Not verified: physical mobile hardware, long-session GPU performance, subjective audio listening or a Loopit-hosted build. The characters are procedural stylized fan models and rigid-part performances, not official assets or fully rigged production models. Collision uses sampled paths against simplified spherical volumes.

Final follow-up: the final 400x580 build completed all three deliveries for 600 tips / three perfect deliveries / all four chances retained. The third throw displayed 90% air. Saved as proof-win-final-mobile.png.

