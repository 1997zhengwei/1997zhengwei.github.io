# Code → GitHub → Loopit experiment

Date: 2026-11-02 (Asia/Shanghai)

## Current result: accepted playable draft

Source folder: `games/krabby-patty-flip/`. Source organization commit: `035953d8731f6c79965aa6b6c607f2c667d1c296`.

Verified Loopit version: **V2 / 2116938131159674880**.

Play: https://cdn-cf.loopit.me/public/game/01a19801-816d-7c71-9da9-949e6aaa19b8/2116938131159674880/workspace/dist/index.html?loopit_preview=draft

- Independent Chrome preview: three real held inputs (about 605/1035/795 ms) completed three perfect orders at **450 points** with three hearts. The result was visible, and restart reset to 0/3, 0 points, three hearts. A new 605 ms Space action after restart scored 150.
- Release-time charge regression fixed: a roughly 605 ms hold showed 44–45%, within native-input timing overhead, and caught the first bun. V1 had shown about 4% and missed under throttling.
- Small preview: actual CSS viewport **364×527** (browser zoom affected the requested 400×580 override), document size matched, scrollX/Y both zero; pause and main controls were fully inside the viewport. Win/restart was tested at this size.
- Pause disabled flip input; Resume restored it and retained score/order state.
- Editor iframe **390×677**: all assets rendered; three short Space actions produced the expected three-miss loss. The result's restart button worked and a new input was accepted afterward.
- Temporary viewport overrides were restored. The project is named **Krabby Patty Flip** and remains an unpublished draft.
- No measured audience retention, physical-phone test or exhaustive browser compatibility claim is made. PNG props are generated illustrations; character sprites are not included.

## Chronological experiment notes

- Source commit: `19bb162801f27a5e31da0d37fef34279c4a04b0b`
- Branch: `codex/krabby-patty-flip`
- Repository folder: `experiments/krabby-patty-flip`
- GitHub compare verified exactly 14 added files in that folder, with no changes to the parent site's app or deployment.
- Raw `LOOPIT_IMPORT.md` was fetched successfully after commit.
- Loopit draft: https://lab.loopit.me/pgc/workbench/01a19801-816d-7c71-9da9-949e6aaa19b8?kind=draft
- Platform generation submitted with commit-pinned source and PNG URLs. Platform output not yet accepted; see later entries.

Local automated checks: trajectory, exact hit boundaries, three-order win, three-miss loss, no double scoring, pause/cancel/resume and fresh restart all pass. The DOM input layer derives charge from a monotonic clock, so dropped frames do not change hold power. Simulation pauses on visibility/focus loss.

Local visual checks: all seven PNGs rendered; big hold control, green window, predicted arc and order tray visible. 400×650 portrait checked. Browser background throttling was observed; automated background timing is not evidence of foreground game feel.

Local browser acceptance: Chrome completed all three orders at 450 points, displayed the natural win result, and restarted to 0/3, 0 points, three hearts. A Space-key flip after restart scored 150. Short throws produced the correct guidance and removed one heart. Native input actions can return before their visible feedback; only settled states were counted.

Repository organization update: user requested a dedicated game folder for many future games. Commit `035953d8731f6c79965aa6b6c607f2c667d1c296` moves the same 14 files to `games/krabby-patty-flip/` and adds `games/README.md`. Compare against academic main confirms all 15 additions are under `games/`. The original commit-pinned Loopit input remains valid and its game contents are unchanged. No main-branch or academic-site deployment changes were made.

Local acceptance completed: three perfect orders → 450-point win → restart → successful Space-key flip; then short/long/short misses → zero-heart loss → restart. Pause disables the flip button and Resume restores it. All actions were performed through the browser UI; no state injection. Portrait 400×580 and 400×650 layouts show the main controls within the viewport. Background throttling limits timing conclusions, but foreground interaction was also exercised after user confirmation.

Loopit V1 (2116934952158248960) generated and rendered the same seven props. Page resource inventory confirms seven packaged platform-CDN images. The agent reported it read the fixed GitHub source. Actual testing found adapter regressions: 605ms Space hold yielded 4% under throttling, and the small viewport had 14.55px horizontal / 13.82px vertical scroll with clipped top controls. Submitted V2 focused on release-time monotonic charge and correct host/root sizing at 00:59 Asia/Shanghai; no gameplay redesign requested. Editor preview initially failed but retry loaded it. Project title renamed to Krabby Patty Flip and verified in the workbench.
