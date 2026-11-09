# 新旧游戏路径对照

迁移时间：2026-11-10（Asia/Shanghai）。旧目录保留于 `codex/krabby-patty-flip`；新长期位置为默认 `main` 分支的 `game/`。

既有游戏复制源固定为提交 `aaeaf64a6b394782060f0ab4375da2b15d85ff17`；矿车归途来自已获用户认可、尚未向旧目录推送的本地 v2.1 基线。

| 旧分支目录 | main 分支新目录 |
| --- | --- |
| `games/krabby-patty-flip/` | [`game/蟹黄堡翻翻乐/`](./蟹黄堡翻翻乐/) |
| `games/krusty-lunch-rush/` | [`game/蟹堡王午餐高峰/`](./蟹堡王午餐高峰/) |
| `games/tiny-raft-big-storm/` | [`game/小木筏-大风暴/`](./小木筏-大风暴/) |
| `games/bikini-bottom-bubble-delivery/` | [`game/比奇堡-泡泡快递/`](./比奇堡-泡泡快递/) |
| `games/tiny-raft-endless/` | [`game/小木筏-无尽海域/`](./小木筏-无尽海域/) |
| `games/tiny-raft-voyages/` | [`game/小木筏-远方航线/`](./小木筏-远方航线/) |
| `games/bubble-roll-endless/` | [`game/比奇堡-泡泡滚球无尽潮汐/`](./比奇堡-泡泡滚球无尽潮汐/) |
| `games/krusty-lunch-gone-wild/` | [`game/蟹堡王-疯狂午餐/`](./蟹堡王-疯狂午餐/) |
| `games/sponge-shift-express/` | [`game/海绵宝宝-变形快递/`](./海绵宝宝-变形快递/) |
| `games/bikini-bottom-playground/` | [`game/比奇堡-捣蛋游乐场/`](./比奇堡-捣蛋游乐场/) |
| `games/比奇堡-绳索搭档/` | [`game/比奇堡-绳索搭档/`](./比奇堡-绳索搭档/) |
| `games/生存沙盒/涨潮之前/` | [`game/涨潮之前/`](./涨潮之前/) |
| `games/生存沙盒/灰烬街区/` | [`game/灰烬街区/`](./灰烬街区/) |
| `games/生存沙盒/点亮小星球/` | [`game/点亮小星球/`](./点亮小星球/) |
| `games/冲鸭-障碍派对/` | [`game/冲鸭-障碍派对/`](./冲鸭-障碍派对/) |
| `games/黑洞都市-自由吞噬/` | [`game/黑洞都市-自由吞噬/`](./黑洞都市-自由吞噬/) |
| `games/水上飞跃大赛/` | [`game/水上飞跃大赛/`](./水上飞跃大赛/) |
| `games/矿车归途/` | [`game/矿车归途/`](./矿车归途/) |

共 18 款，复制时核对了 554 个文件的字节内容。矿车归途的同步状态文字随后改为新目录，其余游戏内容保持不变。本次是目录迁移，没有把旧游戏的历史测试结果当作本次重新试玩结论。

详细校验清单见 MIGRATION_MANIFEST.json。该清单记录复制瞬间的文件；后续平台同步记录更新由 Git 提交追踪。
