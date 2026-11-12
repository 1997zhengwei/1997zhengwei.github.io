# Loopit 单入口适配包

基线 v0.3.2。使用工作区已有的 esbuild 0.28.2 合并 src/app.mjs，再内联原 style.css；只改变模块装载形式，不更改模型、经营规则、镜头、操作或语言。原可维护文件继续在 src/。

```powershell
esbuild src/app.mjs --bundle --format=esm --platform=browser --target=es2022 --external:./vendor/* --outfile=LOOPIT_ENTRY.mjs
```

CSS 字体路径从 ../assets 改为 ./assets。合并脚本的 vendor 引用已核对实际存在。LOOPIT_SINGLE.html 保留同级 vendor/ 与 assets/，可作为宿主 index.html；不能用 iframe 或 localhost 外链替代源码接入。

中文隔离目录中 npm test **12/12 通过**，node build.mjs 通过。单入口原生浏览器检查结果由实际交付记录补充，不把规则测试当作平台试玩。

单入口 SHA-256：`353696c5e97ab7157e0782c9a0497184fbfaf78b0a2d43cb95f1c7a87c41c36c`。其他文件与 Git blob 哈希见 SOURCE_FILES.json。完整包不含 dist 重复副本、日志、缓存、用户参考图、旧版本 ZIP 或本机存档。
