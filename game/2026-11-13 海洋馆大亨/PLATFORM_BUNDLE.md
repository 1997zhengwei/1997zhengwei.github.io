# 同源码单入口适配包

v0.4.0 使用工作区已有 esbuild 合并 src/app.mjs，保留 vendor 为同级外部模块，再内联原 CSS，字体路径调整为 ./assets/。不修改状态规则、画面、语言或模型。LOOPIT_SINGLE.html 可以作为平台静态入口，与 vendor/、assets/ 一起使用。维护源码仍在 src/。

包中不含本机存档、日志、缓存、dist 重复副本、旧版本备份或凭据。SOURCE_FILES.json 记录实际 SHA-256 和 Git blob；平台实际验收另行记录。
