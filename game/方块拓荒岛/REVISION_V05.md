# v0.5.0 · Resource clarity and planet art

User request (2026-11-11): resource graphics are too rough, especially the circled trees and rocks; improve the planet as well. This revision changes rendering only.

- Rebuilt scene trees with layered chamfered canopies, inlaid leaf pixels, bark, knots, branches and roots. Ordinary stone uses pale irregular cut faces; iron ore has a slate body and copper/gold veins; obsidian is a dark, pointed violet crystal cluster. Wheat fields, logs, ingots, sheaves and emerald gems were redrawn as 3D geometry.
- Seven inventory resources and cost/recipe icons now render from the same new pickup meshes at 192×192, displayed at the existing compact HUD sizes. The resource names, recipes and item identities stay the same.
- The visible backpack is capped at 24 mixed samples, preventing a tall single-material column from hiding the explorer. Actual inventory remains unlimited within the existing saved-value bounds; no capacity or yield rule changed.
- Planet art now has chamfered tile lids, subtle surface inlays, grass caps and soil strata, cyan shallow-water coastal strips, soft animated water lines, an atmosphere, a gradient night sky and block clouds kept away from local play.
- Whole-planet views use camera-facing illumination and instanced trees/resource miniatures so a completed sphere remains legible and populated. Normal play uses full nearby models. Geometry prototypes and baked material-color batches are shared rather than allocating all detailed geometry per resource node.
- Full planet, ending reveal and next planet were checked in the browser. All five rule/QA-driver source files match v0.4.0 hashes. Save schema remains 4; package version is 0.5.0.

Checkpoint before this art pass: `qa/checkpoint-v04-visual.zip` (ignored from uploads). It contains the previous directly edited visual source files, not a standalone game or a save backup.

No GitHub or Loopit upload was requested or performed. Evidence and limitations: QA-v05.md.
