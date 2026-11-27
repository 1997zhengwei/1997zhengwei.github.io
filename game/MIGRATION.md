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

迁移后再次按旧提交的 Git blob 核对，消除了 Windows 检出时的换行转换；既有游戏在新路径下保留原提交的文件字节。矿车归途固定基线仍为 98ea4ceefc426515bbf073e625895341078618d6，其已验收运行文件未改动。

## 2026-11-28 补齐游戏总目录

从 [旧分支固定提交](https://github.com/1997zhengwei/1997zhengwei.github.io/tree/6e8d993f0a7dcc48b85df371342fe68ee3707b1f/games/) 补入 `main` 下 `game/` 尚缺的 26 款作品。每个目录沿用源 Git 子树，原来的 `games/<中文游戏名>/` 变为长期入口下的 `game/<中文游戏名>/`。两边共有的 17 款作品子树一致。

[整理前的主分支索引](https://github.com/1997zhengwei/1997zhengwei.github.io/blob/d566ddc3a29d8149ae28edf18848fce251feee44/game/README.md) 保存此前汇总的介绍与试玩记录。2026-11-28 起，以 [游戏作品总目录](./README.md) 为入口。总目录日期取原路径的最早 GitHub 记录，按北京时间换算，其中《蟹黄堡翻翻乐》追溯至最初的 `experiments/` 提交。
