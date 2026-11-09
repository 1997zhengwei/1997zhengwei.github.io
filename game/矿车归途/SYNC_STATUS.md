# 矿车归途 · GitHub 与 Loopit 同步记录

更新时间：2026-11-10（Asia/Shanghai）。当前状态：**Loopit V1 初稿已完成并实测；未发布、未送审。**

## 长期入口与版本

- [全部中文游戏](https://github.com/1997zhengwei/1997zhengwei.github.io/tree/main/game)：默认 main 分支根目录 game/；本款为 game/矿车归途/。
- 已批准源码：v2.1.0，固定提交 `98ea4ceefc426515bbf073e625895341078618d6`。该提交中的 21 个清单文件逐一进行了远端字节长度与 SHA-256 核验。
- 单文件 play.html：664,199 字节；SHA-256 `efe89e6639e338cd4d7ed091c13201a63c5713f4910b870a6c5542db9577abb4`。
- [Loopit 创作项目](https://lab.loopit.me/pgc/workbench/01a1c112-5e84-77d9-aeab-9bbb8c587b60?kind=draft)，账号中已命名为 **Minecart Rescue**。
- [Loopit V1 直接试玩](https://cdn-cf.loopit.me/public/game/01a1c112-5e84-77d9-aeab-9bbb8c587b60/2119824706109460480/workspace/dist/index.html?loopit_preview=draft)。
- 平台产物版本：`2119824706109460480`；项目：`01a1c112-5e84-77d9-aeab-9bbb8c587b60`。

## 实际完成的验证

- GitHub 源码包：23 项规则检查通过，含十关可行解、顺序、碰撞、闸门、隧道、道岔与普通合流忽略误存开关状态。这里的 23 项指本地交接包，不冒称平台重新执行过全部测试。
- Loopit 编辑器实际预览：约 330×529；1-1 使用正常键盘铺轨并得到 Coupled 1 of 1 / All connected，控件可操作。
- 独立预览 390×780：1-1 实际指针拖动补三格并通关；1-2 三次实际拖动形成两处转弯并通关；Next 正常。
- 1-3：短路线得到 Car 1 needs to arrive first；Reset 后改铺正确绕路，得到 Coupled 2 of 2。
- 1-4：等长进路实际得到 Mind the junction；没有把这条失败路线记为通关。
- 1-5：实际点击普通交汇处只显示自动合流说明、未产生可撤销编辑；正确布局得到 Coupled 2 of 2。白色箭头、无拨杆的清晰度改动保留。
- 2-4：金色按钮真实切换 SHORT / LONG；Undo 恢复 SHORT；再选 LONG 后通关。运行时按钮禁用。400×580 下实际尺寸与底栏边界检查通过。
- 2-5：三车实际按 1 → 2 → 3 接入，得到 Coupled 3 of 3 / All connected。
- 终关 Reset 返回 18 块库存；Undo 恢复已铺布局。静音后刷新仍保留静音和轨道布局；Play / Stop 回到编辑且不丢轨道。
- 测试使用 qa=1。通过正常界面对照，测试存档已进到后续关卡时，无 qa 的同源页面仍为未铺轨的 1-1，确认二者独立。
- 独立产物 DOM 中无嵌套游戏 iframe；已检查时的错误日志为空。临时 viewport 已恢复默认，交付页为无 qa 的正常入口。

## 验证边界

十关均随初稿交付；平台实际 UI 验证范围如上，未把尚未逐关重新试玩的内容写成平台全关通过。真实手机帧率、触感和主观听感仍由真机试玩判断。

平台通过源码接入请求构建，画面和上述行为已与本地基准对照；本轮未导出平台源码包，不声明平台每个文件与 GitHub 逐字节一致。GitHub 固定提交是接入基线，平台构建包装另行记录。

所有后续新游戏统一放到 main/game/<中文游戏名>/，该约定已写入总目录与 WORKFLOW.md。旧 codex/krabby-patty-flip 分支路径保留兼容。本次没有展厅发布、送审或额外 Power 改动。
