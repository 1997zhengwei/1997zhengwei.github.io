# Design QA — v0.2

## Comparison target

Reference: older mobile My Little Universe first-world gameplay, [video](https://www.youtube.com/watch?v=-nAI_6GPg7w), around 4:27. Research image: `reference/original-mobile-4m27.jpg` (1536×864).

Implementation: `qa/v02-landscape-final.jpg` (1536×864), plus `qa/v02-mobile-final.jpg` at 390×780. The reference and final landscape implementation were both opened together in one image-comparison input after the fixes, not assessed from code or memory alone.

Both landscape captures show the early forest-to-mining stage. The local scene has the first tool upgrade / bridge; it does not reproduce the commercial level's exact geometry, resource balances or character. This is a Minecraft adaptation, as required by the user's brief. The comparison therefore checks composition, planetary geometry, color hierarchy, world-space construction cues and HUD structure; it cannot establish pixel-perfect map or asset reproduction.

## Findings and fixes

| Priority | v0.1 / early v0.2 observation | Implemented fix and post-fix evidence |
|---|---|---|
| P1 | Flat rectangular slab against an unbroken striped sea did not communicate the reference's planetary world. | Spherical cyan-blue planet, purple sky, curved raised hexes and shadows cast onto water. Final landscape capture shows the same broad planet / sky hierarchy as the reference. |
| P1 | Large logo, objective card and lower context card dominated the playable view. | Removed the cards; resource column is at upper right, tools at lower left, costs next to ground footprints. Both final captures show the game scene as the dominant content. |
| P1 | Long straight geography and all-at-once reveals gave a different spatial / construction rhythm. | Compact connected regions around the planet, a ruins return route, and real walkable partial hex reveals during payments. Full legal campaign completes 72 hexes. |
| P1 | A foreground canopy could obscure the explorer. | Occluding resources fade. The final mining frame shows the explorer's head / torso through the foreground crown. |
| P2 | Camera placed the player too low and the planet was too large to reveal a recognizable horizon. | Adjusted planet radius and normal-based camera elevation / tracking; reference and final landscape now have a visible curved horizon near the upper portion and the active player near the visual center. |
| P2 | Tiny abstract backpack pieces did not show the reference's accumulating materials. | Uses actual collectible meshes in a swaying stack, with arcing pickup / delivery, up to 45 visible items. Separate legal collection capture reached 24 Wood; no resource grants were used. |
| P2 | Terrain depth and lack of planetary shadows made it read as a flat board. | Raised terrain sidewalls and a spherical shadow receiver. Final images show blue cast shadows under the land and forests. |
| P2 | Glyph buttons / bespoke SVG placeholders and generic type did not match the visual language. | Local Nunito; actual 3D model thumbnails; licensed Lucide controls. No source-game raster artwork was used as a replacement for gameplay. |
| P2 | Adjacent cost labels could overlap or enter the resource HUD. | Label spacing, HUD avoidance and small leaders remain in place; 390px final scene has separated costs and accessible controls. |
| P0 | A newly revealed portal could trap the player paying for ruins. | Moved it away from the reveal pad, tightened activation to visible ground area, and added a test for every construction point. All construction anchors are escapable. |

## Required fidelity surfaces

- **Fonts / typography:** the source uses heavy rounded white numbers. Exact commercial font is unknown. Nunito 800–900 is a locally served close family; paid / required hierarchy, white counters, small tool labels and shadows were inspected in final captures. At 320px the confirmation dialog and its buttons remain readable.
- **Spacing / hierarchy:** compact right resource column and lower-left tools match the source hierarchy. Cards are absent. The 1536×864 comparison and 390×780 capture show the curved world occupying the active scene. HUD positions adapt to portrait; source publisher badges and recording overlays are excluded.
- **Colors / tokens:** cyan-blue water, dark violet sky, lime forest, pale path, coral-brown mining land and lilac stone retain the source's main separations. Ground / actor shadows are present. Minecraft wood / iron / emerald colors follow their item identity.
- **Image / asset quality:** genuine interactive 3D geometry is used for terrain, actors, resources and buildings. Inventory images are renders of those same models. Voxel actors / trees are a deliberate Minecraft requirement rather than a claim that the commercial assets are reproduced. No placeholder image tiles or screenshots are used as the game world.
- **Copy / content:** principal game copy is English. Costs show paid / required, not an unlabeled remaining number. Main loop, workbench tiers, smelting and portal ending are interactive; literal commercial planet names, campaign, rocket and combat roster are outside this local adaptation.

## Remaining intentional differences / P3 follow-ups

- The player, vegetation, ores and arrival portal use Minecraft-style block models, with a larger readable player silhouette. The source uses a smooth orange character and other models.
- The exact map, cost table, density of resource clusters and commercial progression systems differ. This report does **not** certify an exact clone or a port of the original game.
- Physical phone performance, true multi-touch and subjective listening remain untested. Browser viewport and pointer checks are recorded separately in `QA.md`.

## Acceptance

All P0/P1/P2 issues listed for this reference-led Minecraft revision have post-fix visual or interaction evidence. The remaining asset / content differences are explicitly bounded by the adaptation brief. User aesthetic acceptance remains the user's judgment; passing this internal review is not a claim of complete likeness.

final result: passed
