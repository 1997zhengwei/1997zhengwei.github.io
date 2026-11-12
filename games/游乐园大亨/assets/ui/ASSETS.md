# UI resources

- `Nunito.ttf`: Nunito variable font, SIL Open Font License; see `NUNITO_OFL.txt`.
- Outline SVG icons: official Tabler Icons, MIT; see `TABLER_LICENSE.txt`. Copied from the licensed local `games/car-wash/assets/ui` collection. Only the icons used by this game are included.
- No images, characters, logos or sounds from the reference commercial games are bundled.
- Facility thumbnails, text labels and soft particle sprites are rendered by this game's own code at runtime.

The v0.2.0 stone, grass and roof surface textures are generated locally by `src/surface.mjs`; architecture and ride decorations are source geometry in `src/scenery.mjs`. The HDR/depth post-processing in `src/rendering.mjs` runs in the actual game. No commercial reference assets are used.


v0.3.0：新增四种设施、吊链、座椅、车辆、游客面部及第一人称手臂，均由本项目使用 Three.js 程序生成，无新增第三方美术资源。


v0.3.1：ride-*.svg 乘坐操作、仪表和返回图标由本项目绘制，使用同一描边和配色；不依赖外部图标服务。


v0.3.2：ride-stabilize.svg 为本项目绘制的相机水平稳定图标，替换误导性的盾牌入口。
