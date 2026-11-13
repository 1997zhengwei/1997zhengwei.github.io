# v0.4.0 独立电影素材

使用内置 image_gen 全新生成，非参考游戏截图；本轮无编辑目标、无参考图片、无透明背景。原有三张素材保持不变。最后三部沿用存档影片 ID、价格、解锁条件和票价系数，替换为独立故事和独立画面。

| 影片 | 最终运行原图 | 生成源文件 |
| --- | --- | --- |
| 珊瑚奇遇 | [coral-kingdom.png](./assets/films/coral-kingdom.png) | exec-06bb9406-37d9-405c-9d21-1d9a918fb672.png |
| 逐日飞车 | [sunrise-racers.png](./assets/films/sunrise-racers.png) | exec-6ffd5027-eae2-41cb-b771-764dec14e205.png |
| 雪境来信 | [snowbound-letters.png](./assets/films/snowbound-letters.png) | exec-859b8ba9-0da2-492b-931e-7f0999d7cab7.png |

均以生成原始 PNG 接入，没有脚本修图；1536×1024。以下为三次工具调用的完整提示词。

## 珊瑚奇遇

- 运行文件：`assets/films/coral-kingdom.png`
- 类型：家庭 · 海底探险
- 生成模式：内置 image_gen；`transparent_background: false`

完整提示词：

```text
Use case: illustration-story. Asset type: original animated movie key art for a cinema management game's film library, posters and movie screen. Create one polished wide landscape 3D animated family adventure image, approximately 3:2, full bleed, no text or logos. A brave little sea otter explorer wearing a cream diving jacket and an elegant gold-rimmed bubble helmet, accompanied by a tiny pink seahorse, discovering an extraordinary submerged coral kingdom. The otter is clearly visible in the middle foreground with an expressive, appealing face; a friendly immense whale silhouette glides behind transparent turquoise palace domes and luminous coral towers. Sunbeams penetrate crystal-clear teal water, fuchsia and orange corals, sparkling schools of tiny fish, glowing pearl treasures. Cinematic depth, convincing 3D materials, detailed fur and glass, crisp vibrant illumination, richly composed but readable as a small thumbnail. The main character and visual storytelling should remain inside the central 65 percent for cropping to both wide cinema screens and portrait posters. A distinct underwater world, no trains, airplanes, cats, detectives, rain, snow, existing copyrighted characters or franchises. No letters, typography, watermark, borders, mockup or split panels.
```

## 逐日飞车

- 运行文件：`assets/films/sunrise-racers.png`
- 类型：冒险 · 云端竞速
- 生成模式：内置 image_gen；`transparent_background: false`

完整提示词：

```text
Use case: illustration-story. Asset type: original animated movie key art for a cinema management game's film library, posters and movie screen. Create one polished wide landscape 3D animated adventure racing movie image, approximately 3:2, full bleed, no text or logos. A daring red panda racing pilot with flight goggles and a brilliant orange scarf drives a sleek small cobalt-and-orange open-cockpit hover racecar, banking dramatically on a suspended luminous racetrack above a futuristic floating city at sunrise. The red panda's face, front wheel forms and car cockpit are clearly readable in the central foreground; two tiny rival futuristic cars follow a twisting elevated road through cloud bridges and glass skyscrapers in the background. Dynamic motion trails, bright golden sunrise rim light, cerulean sky, gleaming metallic surfaces, volumetric white clouds, cinematic deep 3D perspective and high-end animated feature film detail. Keep the main character and car inside the central 65 percent so the art works on wide movie screens and portrait posters. Distinct aerial racing subject: no aircraft, propellers, trains, ocean islands, underwater setting, cats or detectives. Original characters and designs, no existing film franchise. No lettering, titles, watermark, frame, UI or multiple panels.
```

## 雪境来信

- 运行文件：`assets/films/snowbound-letters.png`
- 类型：悬疑 · 雪境探案
- 生成模式：内置 image_gen；`transparent_background: false`

完整提示词：

```text
Use case: illustration-story. Asset type: original animated movie key art for a cinema management game's film library, posters and movie screen. Create one polished wide landscape 3D animated mystery movie image, approximately 3:2, full bleed, no text or logos. An observant snowy owl investigator wearing a deep burgundy wool scarf and navy winter cape holds a mysterious glowing wax-sealed envelope beside a brass lantern on the snow-covered steps of an extraordinary old mountain observatory. The owl's expressive intelligent face and the amber-lit sealed letter are central and clear. Behind, a winding snowy path leads through dark fir trees to an illuminated clock tower beneath luminous green-and-violet aurora curtains and an immense starry polar sky. Quiet intriguing, warm and inviting rather than horror; brilliant white and icy blue snow, deep midnight indigo, amber glass windows. Fine feather and knitted cloth detail, snow sparkles, soft volumetric lighting, believable layered 3D depth, premium animated feature movie polish. Main subject in central 65 percent for landscape and portrait crops. Visually distinct from a rainy city detective scene: no cats, umbrellas, rain, cars or trains. Original character and world, no existing franchise. No titles, text, logos, watermark, framing, UI or split panels.
```

