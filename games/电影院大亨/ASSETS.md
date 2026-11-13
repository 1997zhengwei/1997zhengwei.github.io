# 素材与生成记录

原始三部影片素材记录。v0.4 新增三张独立画面、主题和完整提示词见 [ASSETS_V040.md](ASSETS_V040.md)。三张关键画面使用 **内置 image_gen** 生成，非第三方游戏截图。模型、品牌、角色、图标、音效与界面为本项目原创实现。未复制参考游戏的角色、贴图、商标或源码。

## 交付文件

| 游戏内路径 | 用途 | 生成来源文件 |
| --- | --- | --- |
| `assets/films/moonlight-express.png` | 星月列车灯箱 / 银幕 | `exec-ba1faf7c-ef48-474d-9d30-3837b2f5a85c.png` |
| `assets/films/island-wings.png` | 海岛飞翼灯箱 / 银幕 | `exec-82a2da1b-211c-4a76-8c6d-bacf2ab5ce7c.png` |
| `assets/films/rainy-detective.png` | 雨夜猫探灯箱 / 银幕 | `exec-cbc46f26-e270-4127-9e71-54630044346b.png` |

生成模式：全新图片，`transparent_background: false`，无参考图片。下列为提交到工具的完整提示词。生成后复制原始 PNG 到本项目，代码用 canvas 生成带片名的灯箱、动画投影；原始 PNG 未通过脚本修图。

### 星月列车

```text
Use case: stylized-concept. Asset type: an original illustrated movie key art used as a cinema tycoon game's poster and illuminated projection screen texture. Create a polished cinematic 3D animated film key art, original characters, no existing franchise. Subject: a small expressive orange fox in a midnight blue conductor jacket standing with a tiny round teal service robot on the brass front of a whimsical cobalt blue express train floating toward a luminous crescent moon above a jewel-colored futuristic seaside city. Train has glowing amber windows, graceful curved brass trim, a star-shaped headlamp, rich physically shaded surfaces. Sweeping curved train tracks over turquoise clouds lead the eye into a violet starry sky. Art direction: high-end family animation, crisp rounded forms, charming expressive faces, detailed materials, dramatic indigo / ultramarine / turquoise / golden amber palette, saturated but balanced, beautifully lit, strong silhouette, sharp professional illustration. Composition: landscape 16:9, hero fox and robot in central third, train extends lower right, moon in upper left, generous readable dark sky along upper edge and outer sides; the central composition also works cropped to vertical poster. No text, no letters, no logos, no watermark, no frame, no UI. Not a game screenshot. A finished original movie scene.
```

### 海岛飞翼

```text
Use case: stylized-concept. Asset type: original movie key art for a polished 3D cinema management game, to be shown in a poster lightbox and on a projection screen. Create a finished high-end animated family adventure film scene with entirely original characters: a tiny brave capybara pilot wearing a warm yellow scarf and brown leather aviator goggles, with an expressive green parrot friend perched on a bright coral-orange vintage seaplane. They skim a pristine turquoise lagoon between towering emerald jungle islands, ancient stone arch over a waterfall, luminous golden sunbeams, clouds and sparkling water. Charming expressive faces, meticulously shaded stylized 3D forms, tropical lushness, precise rich material textures, cinematic depth and gorgeous soft sunlight. Composition landscape 16:9, capybara and parrot in central third, plane toward lower right, epic islands in background and open sky along upper edge; central composition works cropped vertically for a movie poster. Cohesive teal / vibrant leaf green / coral orange / sunny golden cream palette. Original cinematic animation still, professional film artwork, not a game screenshot. No text, no letters, no logos, no watermark, no frame, no UI.
```

### 雨夜猫探

```text
Use case: stylized-concept. Asset type: an original movie key art texture for a stylish 3D cinema tycoon game, projected onto a movie screen and cropped on a poster. Entirely original high-end animated mystery movie scene: an expressive charcoal grey cat detective with bright amber eyes, cream muzzle, plum purple trenchcoat, a small brass magnifying glass, and a warm caramel mouse assistant in a blue cap, standing beneath an enormous blue umbrella on a rainy neon-lit old town cobblestone street. Behind them a charming vintage teal tram, art deco cinema marquee with glowing blank amber panels, plum and midnight-blue buildings, magical reflections of cyan, rose and amber lights in the wet pavement, distant lanterns and thin mist. Warm clever expressions, family friendly atmosphere, intriguing rather than scary. Professional cinematic 3D animated-film quality, detailed fur, elegant stylized proportions, stunning lighting and rich reflective surfaces, crisp readable silhouettes. Composition: landscape 16:9, both characters in central third with a broad epic city backdrop, clean dark sky along upper edge, composition can crop centrally to vertical. No text, no letters, no logos, no watermarks, no frame, no UI, no existing franchise. Finished original movie artwork, not a game screenshot.
```

## 代码素材与依赖

- Three.js r186：本地 `vendor/three.module.js`、`vendor/three.core.js`，随附 `vendor/LICENSE`，MIT。无需外部 CDN。
- Nunito：本地 `assets/ui/Nunito.ttf`，许可 `assets/ui/NUNITO_OFL.txt`。中文由系统中文字体回退。
- 模型：`src/world.mjs`、`src/characters.mjs`、`src/geometry.mjs` 生成影厅、阶梯椅、柜台、钱堆、人物、灯光及玻璃。
- 图标：`src/icons.mjs` 的原创 SVG 路径。
- 音效与背景乐：`src/audio.mjs` 实时 Web Audio 合成，默认静音；未使用商业录音。
- 原始图片散列见 `qa/asset-manifest.json`。

## 参考来源

[Idle Cinema Empire Idle Games 官方商店](https://play.google.com/store/apps/details?hl=en_US&id=com.idle.cinema.empire.sim.tycoon) 的截图、介绍及嵌入演示，用于研究空间配色与经营反馈。没有把参考素材打包进游戏，也没有安装原作或声称逐项复刻其经济数值。
