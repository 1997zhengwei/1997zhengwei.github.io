# Loopit 入口兼容文件

`LOOPIT_SINGLE.html` 由已验收源码提交 `d78187cc4fd19c76eb0dbc60c7b99c9f347299c2` 的 src/app.mjs 使用 esbuild 合并而成。只合并自有模块和四份CSS，保留MIT注释；不改动经济、玩法、模型、配色或原模块入口。原 index.html 和全部src/继续作为可维护基线。

供平台多模块入口接入失败时使用：将 LOOPIT_SINGLE.html 复制为目标部署目录的 index.html，连同 vendor/three.module.js、vendor/three.core.js 与 vendor/LICENSE 保持同级 vendor/ 目录。游戏代码和CSS已内联，运行不依赖 .mjs 的静态MIME配置或额外资源下载。仍然是原生3D游戏，不是iframe或外链。

默认普通开局，不能附加showroom参数冒充正常进度。本地独立8801端口已观察原版画面、两个真实入住、60→100首次目标资金，捕获error/warn为空；该记录不是Loopit平台验收。原34项规则测试与构建检查仍属于原源码。
