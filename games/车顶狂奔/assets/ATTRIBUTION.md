# 素材与许可证

- Three.js r186、GLTFLoader、SkeletonUtils、BufferGeometryUtils、RoundedBoxGeometry：MIT，原文随 `vendor/LICENSE` 提供。来源：https://github.com/mrdoob/three.js 。复用工作区已有的本地发行文件。
- `courier-rig.json`：从原 CC0 素材提取的动作骨架变换数据，只有骨骼名称、层级及初始变换，不含旧人物网格或服装。数据来源 Kasper Olesen / CharacterCreator，固定提交 `852e48f316b90a0937234886630e4fb4cdfd1f78`，底层为 MakeHuman CC0 素材。许可证与逐资产记录在 `CHARACTER-LICENSE.md`、`character-asset-licenses.json`。来源：https://github.com/kblood/CharacterCreator 。未包含其插件或运行时代码。历史 `runner.glb` 保留供 v0.1/v0.2 测试和旧基线追溯，v0.4 运行时不加载。
- `src/courier.mjs`：本项目新创作的人物几何与装备。全覆式头盔、风镜、夹克、护具、手套、靴子、机械陀螺背架、腕表及线盘均由程序几何独立制作，不使用旧人物的可见网格和服装。人物沿用上述 CC0 骨架与下述动作数据，未声称动作捕捉素材为本项目原创。
- `motion-clips.json`：工作区已有的重定向动作数据，来源为 Quaternius Universal Animation Library 1/2 Standard（CC0）。原文在 `MOTION-LICENSE.txt`。使用 Jog/Sprint、Jump、Land、Slide 等片段做混合；原人体的呼吸待机亦为 CC0 数据。来源：https://quaternius.itch.io/universal-animation-library 和 https://quaternius.itch.io/universal-animation-library-2 。
- 卡车、轮胎、侧镜、车厢硬件、石柱、山体、雪树、桥梁、摆锤、标识、天空着色、界面与合成音效：本项目本地代码创作。没有导入参考游戏的任何运行素材。

Clustertruck / Landfall / tinyBuild 仅作为风格及玩法研究参考。本项目使用自己的标题和标识。参考地址：https://store.steampowered.com/app/397950/Clustertruck/ 。
