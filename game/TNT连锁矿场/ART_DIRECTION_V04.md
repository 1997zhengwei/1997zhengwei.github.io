# 0.4 明亮卡通画面 · 素材与制作记录

用户要求：认真学习所提供的 Pocket Mine 参考截图，尽量接近其清新明亮的界面颜色、质感及画面，保留满意的玩法。

## 对照观察与落实

参考依据为用户在本会话提供的两组截图；另查阅了 [Pocket Mine 3 官方商店页面](https://play.google.com/store/apps/details?id=ca.roofdog.pm3)。没有把静态截图观察说成原作实玩。

| 参考图的可见特征 | 本版的实际修改 |
| --- | --- |
| 大面积明亮青绿、金黄、冰蓝洞窟 | 重新绘制三种高明度背景；取消全局暗化曲线；随机种子仅决定装饰配色 |
| 银白岩石与大颗金矿形成强对比 | 新图集使用白底矿石、黑色煤块、明黄金块、青蓝钻石和清楚描边 |
| 卡通角色、粗线条与白色高光 | 新生成方块头矿工，接入场景，保留原有采矿输入和角色反馈时刻 |
| 宝物和爆炸局部发光、星点密集 | 泛光排除大片低饱和银白岩面，只强调有色亮点；引爆增加局部星芒 |
| 场景占主体，界面服务玩法 | HUD 提亮为青绿和柠檬黄；目标提示移到地图名上方，避免遮住角色脸部 |

这是一套按参考方向新制作的美术，没有使用原作游戏素材文件，也不声称逐像素复刻。

## 新增素材与最终保存位置

使用 **内置 image_gen** 生成，未使用 CLI/API 回退。两张图片均保留原始 alpha 通道，并以原文件复制到项目；图集通过游戏里的 CanvasTexture 按 4×2 单元取样，不依赖开发机的生成目录。

- 矿块图集：`C:/Users/Administrator/Documents/ChatGPT/Loopit爆款游戏/games/tnt-mine-rush/assets/mine-atlas-v04.png`
- 矿工角色：`C:/Users/Administrator/Documents/ChatGPT/Loopit爆款游戏/games/tnt-mine-rush/assets/miner-v04.png`
- 最终完整提示词：`C:/Users/Administrator/Documents/ChatGPT/Loopit爆款游戏/games/tnt-mine-rush/assets/generation-v04.json`

图集包含泥土、普通岩石、煤矿、金矿、钻石矿、TNT、基岩和宝箱。角色是透明底、橙黄安全帽、青蓝上衣、深蓝裤子、棕色靴子及矿镐的原创卡通矿工。

## 实现与保留范围

新增 `art.js` 和 `fresh.css`，调整 `scene.js` / `visuals.js` 的正面材质、背景及局部反馈。图集加载失败时保留原程序材质回退，游戏逻辑不依赖图片加载结果。

`core.mjs`、`app.js`、`audio.js` 与 0.3 的 SHA-256 一致：地图、随机布局、耐久、3×3 连锁、分数、目标、输入、存档键及声音均未改。镜头及方块的点击碰撞几何参数也未改。

0.3 的渲染文件已在 `work/tnt-visual-v04-baseline/` 留存本地备份，供需要时对照。

实际截图与验收记录见 `QA.md`。没有上传 GitHub 或写入 Loopit。
