# 同源码合并接入入口

v0.4.0 使用工作区现有 esbuild 合并 src/app.mjs 并保持 vendor 为外部同级模块，内联原 CSS。字体路径从 ../assets 改为 ./assets；FilmLibrary 在原 src 模块中以 import.meta.url 解析 ../assets/films，合并后入口位于游戏根目录，因此仅在合并副本中改为 ./assets/films。维护 src 不变。模型、规则、配色与语言不变。

LOOPIT_SINGLE.html 可以作为平台 index.html，必须完整复制 vendor/ 和 assets/。它直接运行原生三维代码，不含外链 iframe。SOURCE_FILES.json 记录实际 SHA-256 与 Git blob；本机存档、日志、缓存、历史ZIP、dist重复副本和凭据不上传。平台最终资源路径与宿主支持另行验证。
