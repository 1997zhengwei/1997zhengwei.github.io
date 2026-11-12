# Loopit 单入口适配包

此文件是 v0.3.0 原生源码通过 esbuild 0.28.2 合并模块、内联原两份 CSS 的结果；没有更换玩法、配色、模型、奖励或输入。维护入口仍为 index.html/src/app.mjs。

生成命令（在本游戏目录执行）：
`esbuild src/app.mjs --bundle --format=esm --external:./vendor/* --outfile=LOOPIT_ENTRY.mjs`

将原两份 CSS 顺序内联（字体相对目录由 ../assets 改为 ./assets），将合并 JS 内联进原 HTML 后得到 LOOPIT_SINGLE.html。只删除该临时 JS，不删除原模块。保留相邻 vendor/ 和 assets/，可把 LOOPIT_SINGLE.html 原样作为部署 index.html。

单入口 SHA-256：`d3b801295d272553de6e1368eae827298db45536a75622a743d4fdc0487fb261`。完整发布清单见 SOURCE_FILES.json。不要使用 iframe 或 localhost 引用。检查结果需绑定最终实际部署源码；所有配置/标题/文档修改完成后，再进行平台正式构建、检查和交付。
