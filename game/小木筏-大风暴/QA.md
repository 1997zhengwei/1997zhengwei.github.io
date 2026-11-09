# Local draft verification — 2026-11-02

Tested with real native UI input in the connected browser at the local HTTP URL. No state injection, test-mode victory or backend completion was used.

- Collected wood and scrap using the projected supply controls and observed the actual hook animation and inventory changes. Built the net: 3 wood and 2 rope were consumed, then the working net added usable wood and rope over active time.
- Built all four facilities. The deck visibly expanded from four to nine tiles; braces and sail appeared as geometry. Built buttons became non-repeatable. The upgraded hull capacity was used by the storm calculation.
- Started the storm with a completed raft. All four waves completed. Hull was 69/125, displayed as 55%. Raised the sail; the raft moved toward the lighthouse and reached the result screen. The recorded run gathered 112 resources because it remained active during other inspection work; that count is not a speed or balance benchmark.
- Win → replay: materials and facilities reset to zero, hull to 100%, camera and position restored. Started a new storm with no upgrades. The third wave reduced hull to zero and produced the loss result, with no false survival transition.
- Loss → replay → a real collection awarded 3 wood. Pause disabled gameplay controls. Resume retained the 3 wood, and building a deck spent them and produced the expanded raft again.
- Observed a narrow 394×684 CSS viewport with no document overflow (scroll height 684). The main action was y=612.8–655.6, fully inside the viewport. The requested viewport override did not resize this existing tab; reported dimensions are the measured ones rather than the requested size.
- Automated: six meaningful rules tests passed. Module syntax checks passed. Rules cover real resource spending, dependency requirements, net benefits, unprotected loss priority, protected survival/departure, repairs and reset isolation.

Evidence is stored locally beside the source: `proof-built.png`, `proof-win.png`, `proof-loss.png`, and final preview captures. Gameplay rules, visual code and vendored libraries are uploaded; temporary local screenshots are not dependencies.

Not verified: a physical phone, prolonged GPU performance, subjective audio listening, Loopit module/shader integration, or exhibition publication. This first draft uses authored build slots and deterministic wave damage, not freeform construction or fluid simulation.
