# Local QA — 2026-11-04

## Expansion V2

- Fifteen deterministic mechanics tests pass. New tests cover cannon countdown/pool landing, portal pairing/lockout, conveyor movement of actors and boxes, timed geyser, Squidward dance reaction frequency, distinct-type chain expiry, Portal Parade's three-step combination and preset validity.
- Real UI: Splash Lab cannon entry led to the splash-delivery discovery. Portal Parade produced teleport, bounce and Chain ×3 via actual W input. Four new discoveries were obtained on top of the four retained first-version discoveries (8/8 before the separate QA save was introduced).
- Patrick Express loaded and Patrick followed the burger route through the tower; screenshots record the scene after action.
- At 400×580, placed first portal: count 10→11 and “Place one more” message. Placed second: 11→12 and “Portal pair linked”. My layout restored the original 8-object starter build after testing other scenes and placing portals.
- Build UI checked at 390×780 and 400×580; the latter had document/client widths 400 and heights 580. New categories keep the palette on a single row.
- Corrected device rotation from +rot to -rot to match the gameplay forward vector. Saved before/after illustrations and observed cannon-to-pool play.
- Later changes to the speech-label horizontal clamp and Squidward's preset start location were source checked; a dedicated final screenshot rerun was blocked by the screenshot interface timing out. Existing screenshots are labelled by capture stage rather than falsely presented as every final-state detail.
- Multiple tabs were observed sharing the save; later tests use `?qa=1` to avoid interfering with the normal playground. This is test isolation, not a multi-tab conflict-resolution system.
- The character viewer initially rendered successfully. Later browser screenshot attempts timed out; three explanatory PNGs were instead generated offline from the exact shared geometry and visually inspected. They are explicitly labelled as diagrams, not browser captures.

The entries below retain the original V1 evidence.

## Real UI actions in the in-app browser

- Fresh-load intro → Try playground → tap trampoline: visible launch and height discovery.
- Uncontrolled Patrick walked toward the pool patty, entered the pool and ate it; visible reaction and discovery.
- Build: placed a box, stacked it, rotated, removed and undid removal. Object count changed 8→9→10→9→10 and geometry matched.
- Dragged SpongeBob beside the bubble machine; Play produced a bubble ride and Bubble passenger discovery.
- Dragged Patrick in front of the box tower; controlled him with W held for 1.2 seconds. Tower collapsed and Oops! All boxes unlocked. All four discoveries were obtained via UI before the final persistence polish.
- Switched to Patrick, held the mobile stick upward for 1.8 seconds, then used Jump; position changed and airborne Patrick was visible.
- Pause/Keep playing and Starter scene/Load starter scene worked. Reload preserved edited layout and character starting position.
- Sound button toggled its accessible label from Enable sound to Mute sound, without console errors. Actual speaker output was not independently listened to.
- Responsive screenshots at 390×780 and 400×580. At 400×580 DOM width/scroll width both 400; document height/body height both 580. Controls remain visible.
- Close view enlarges/follows the selected character; Whole yard and returning to Build restore the overview. Final camera includes vertical tracking for airborne characters.
- Final-version regression: obtained pool and trampoline discoveries, reloaded, and saw 2/4 retained with the starter layout. No error-level browser console entries were captured during this verification.

## Automated checks

All module syntax checks passed. Seven mechanics tests passed: invalid layout rejection; trampoline launch/height/landing; bubble lift/pop; mass-dependent wind; Patrick food-seeking and pool entry without repeated stationary splashes; lower-box displacement and loss of support above; reset with no mutations to the build data.

## Boundaries

Browser viewport emulation is not a physical-phone performance test. Rule tests are not substitutes for UI testing. Audio quality, long-session memory/performance, Loopit embedding and final music/Power selection remain future platform-stage checks.


## V3 larger park / endless DIY — 2026-11-04

- 33 rules tests pass, including the original 15. New coverage: >64 props and remote coordinates in DIY; invalid/duplicate data; crossing the Park fence only in DIY; three slide types at four rotations, climbing through exit and landing; 500-unit portal travel; far crate sleep/resume; complete slide footprint at every Park corner; reset mid-ride.
- Actual QA URL: switched Park → DIY; panned past x≈40, placed a wave slide, brought all three characters and played it. Walking into the yellow entrance produced the ride; afterwards SpongeBob was beyond the exit and Best chain became 1.
- At 400×580, placed a spiral slide, rotated, removed and undid removal. Count restored to 2. Added the jump slide and saw 3 toys in DIY. Panned to x≈125, dragged empty sand to x≈137, returned and the existing props reappeared.
- After saving at x≈44, reload showed 44 / 0 with the same toy and character starts. Switching back to Park restored the previous 8-object scene and its own discoveries; returning to DIY retained 3 props.
- Exported an 8-object Park JSON through the actual download button. Loaded Classic playground, imported that JSON through the browser file chooser, and saw the 8-object layout restored with Undo enabled.
- 400×580 Build: document and scroll dimensions both 400×580, 3D stage ~275 px high. 390×780 Play: document and scroll dimensions both 390×780. Actually entered wave-slide steps with W and captured Up the steps!; models, controls and palette fit.
- All three slide models were visually checked. Full progression for every rotated slide is covered by deterministic simulation; the most directly captured continuous UI ride is the wave slide. No claim of a complete physical-phone or every-combination playthrough.
- Fixed legacy hardcoded placement boundary, complete rotated-slide fitting, drag grab offset, independent realm save messages and restoring remote camera focus. Added geometry/line/material disposal during terrain and prop streaming. Replaced the deprecated PCFSoftShadowMap alias after observing its warning.
- Four V3 screenshots, source snapshot, test output and detailed Chinese change/bug log are in docs/tutorials/bikini-bottom-tiny-trouble. Existing V2 evidence and archives remain unchanged.
- No physical-device endurance, storage-exhaustion, thousands-of-dense-props, final audio listening or Loopit-host validation was performed. Browser capacity is finite despite removal of fixed DIY map/count boundaries.
