# Verification — 2026-11-02

## Local browser evidence

Tested the actual page at `http://127.0.0.1:8767/` through native pointer/keyboard input in the connected in-app browser. No gameplay state injection or simulated completion.

- Full shift: six orders / eight catches, 1,550 tips, five perfect flips, streak eight, all three chances retained. Tickets 3 and 6 required two separate throws. Tickets 4–6 used moving plates.
- Win → replay reset score, tickets, stack, streak and chances; subsequent input worked.
- Three deliberately short throws → 0 chances → loss result. Repeated at 400×580 after two successful orders. Loss → replay → real first catch produced 150 tips and ticket 2.
- At 400×580 CSS pixels, document height was exactly 580. Flip button bounds y=515–570.2; result replay button y=342.25–388.65. Both were visible without scrolling. Viewport override was reset after checks.
- Paused a live flight before its landing. During the pause score/ticket remained unchanged. Resume completed precisely one catch for 150 tips, then ticket 2.
- A native Space hold/release completed ticket 2 for 170 additional tips and advanced to ticket 3.
- Browser console captured no warnings or errors during the checked local run.
- Actual PNG dimensions/alpha bounds inspected with Pillow in read-only mode. All eight character frames: 1024×1024, shared lower visible pixel y=981. Kitchen:1600×1200. Eleven assets total; copies were not re-encoded.

Screenshots saved alongside the local source: `proof-win.png`, `proof-loss.png`, `proof-mobile.png`, `proof-mobile-result.png`, `proof-preview.png`. Only source/assets/docs are uploaded to GitHub; local screenshots are delivery evidence.

## Automated rules checks

`node test-rules.cjs`: six checks passed covering exact trajectory endpoints, charge clamping, six-ticket progression requiring eight hits, maximum perfect-run score of 1,700, double-stack retention after a miss, moving-target future-position collision, three-miss loss/reset, and tolerance boundaries. `node --check game.js` passed.

After the main playthrough, only two UI labels and the letterbox background were corrected. The miss label and small-screen loss/replay were rechecked against the final files; rules were unchanged.

## Scope

This is the local/GitHub draft. No new Loopit import, hosted adapter playthrough, exhibition publication, real mobile-device performance benchmark, sound listening test, or reduced-motion device test has been performed. Those remain separate acceptance steps. Keyboard and pointer were exercised; touch follows Pointer Events but has not been tested on physical hardware.
