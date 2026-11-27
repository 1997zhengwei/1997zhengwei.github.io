# Art sources for Rooftop Flow v0.3.0

## New authored motion and architecture (CC0)

- Quaternius / Gonzalo Furnier, **Universal Animation Library Standard** and **Universal Animation Library 2 Standard**: https://quaternius.itch.io/universal-animation-library and https://quaternius.itch.io/universal-animation-library-2 . Downloaded the official free Standard packages on 2026-11-10; retained non-root-motion GLB animation data and license in `motion-source/`.
- Authored clips used: Jog_Fwd_Loop, Sprint_Loop, Jump_Loop, Jump_Land, Roll, ClimbUp_1m and Slide_Loop. The original MakeHuman idle breathing clip remains the runtime idle. Runtime motion is retargeted to the existing body with `tools/compile_motion.mjs`; the source T pose and target A pose are aligned, body bone lengths are preserved, and world translation is handled by game physics. Front/side flips and obstacle contact corrections are local code.
- Quaternius, **Downtown City MegaKit Standard**, CC0: https://quaternius.itch.io/downtown-city-megakit . Uses six glTF modules/examples and their shared textures; `city-kit/LICENSE.txt` and `city-kit/sources.json` preserve the exact source terms and downloaded file hashes. No engine project scripts or paid Source edition content is included.
- Poly Haven / Greg Zaal, **Venice Sunset 1K HDRI**, CC0: https://polyhaven.com/a/venice_sunset . Used for image based environment lighting; the visible sky is the local shader sky. URL and file hash are in `sources.json`.

The existing Three.js MIT license also covers the added official r186 HDRLoader helper.

## Runner: CC0 mesh and animation data

The human mesh, skin/eye/hair data, hoodie, jeans, shoes and supplied idle/walk/run clips are derived from the CC0-1.0 generated assets of **Kasper Olesen / CharacterCreator**, built from the **MakeHuman system assets CC0 pack**.

- Project: https://github.com/kblood/CharacterCreator
- Fixed source commit: `852e48f316b90a0937234886630e4fb4cdfd1f78`
- Explicit asset license: https://github.com/kblood/CharacterCreator/blob/852e48f316b90a0937234886630e4fb4cdfd1f78/LICENSE-NOTES.md#generated-files-owner-decision-2026-10-03
- Upstream MakeHuman license: https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md
- Original asset-level provenance is preserved in `character-source/asset_licenses.json` and `character-source/LICENSE-NOTES.md`.

Only the generated mesh, textures, rig, clips and license records are used. No CharacterCreator plugin/runtime code is included. The source project's code license and the CC0 output-data license are separate.

`runner.glb` is locally assembled from `base_body_anim.glb`, `clothing_hoodie.glb`, `clothing_jeans.glb`, `clothing_shoes.glb` and `hair_short02.glb`. A fixed athletic body is baked, unused runtime morph data removed, and garments share one 53-bone skeleton. The local compiler is `tools/compile_runner.py`. Animation blending, parkour IK/contact behavior, accessory models and outfit application are authored in this game's `src/human-runner.mjs`. The geometry summary and SHA-256 are in `runner-build.json`.

## Architecture materials: Poly Haven CC0

All sets use the downloaded 1K JPEG diffuse, OpenGL normal, roughness and ambient occlusion maps. They are bundled locally, not fetched from Poly Haven while playing.

- Brick Wall 001: https://polyhaven.com/a/brick_wall_001 — photography: Dimitrios Savva; processing: Rob Tuytel.
- Concrete Floor Worn 001: https://polyhaven.com/a/concrete_floor_worn_001
- Concrete Wall 001: https://polyhaven.com/a/concrete_wall_001
- License: https://polyhaven.com/license — CC0-1.0, including redistribution in games.

Downloaded URLs, pinned source revision, file sizes and SHA-256 values are in `sources.json`.

## Locally authored content

The city layout, procedural architecture, rooftop equipment, water tank, metal structures, road markings, interface, gameplay, parkour contact poses, flips, accessories, procedural secondary textures and Web Audio are original to Rooftop Flow. The additional authored building modules and humanoid clips are credited above. No models, textures, music or animations from Rooftops & Alleys are included.

Three.js and its GLTFLoader, SkeletonUtils, BufferGeometryUtils and RoundedBoxGeometry helpers retain the MIT license in `vendor/LICENSE`.


## v0.5 本地参数化装备

新增机能服装叠层、三款背包、足迹光环/粒子及烟雾为本地代码生成的几何与材质；服装和背包沿用既有人体骨架附着，没有新增外部模型或贴图。基础人体、基础衣物、动画和城市素材的授权继续按上文记录。
