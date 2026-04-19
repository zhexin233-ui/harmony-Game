# 鸿蒙派对小游戏（hwgame）

聚会小游戏 · 鸿蒙 6 优先 · 单机共玩 · 无需联网。

## 5 款游戏

| 类型 | 游戏 | 支持人数 |
|---|---|---|
| 🎲 运气派 | 💣 定时炸弹 | 2–8 |
| 🎲 运气派 | 🐊 鳄鱼拔牙 | 2–8 |
| 🎲 运气派 | 🎯 指尖大轮盘 | 2–5 |
| ⚔️ 实力派 | 🐎 摇一摇赛马 | 2–8 |
| ⚔️ 实力派 | 👆 同屏反应大比拼 | 2–5 |

## 双主题

- 🎈 **Q 版卡通**：浅暖色调 · 圆润按钮 · 漫画感硬阴影。
- ⚡ **霓虹电玩**：深海蓝底 · 青色主色 · 柔和发光。

首次启动引导选择，可在设置页随时切换。

## 截图

| 首页 | 游戏大厅 | 炸弹 | 结算 |
|---|---|---|---|
| ![home](docs/screenshots/home.png) | ![lobby](docs/screenshots/lobby.png) | ![bomb](docs/screenshots/bomb.png) | ![result](docs/screenshots/result.png) |

> 截图待 Phase 6 Task 6.9 补齐。

## 开发与测试

```bash
pnpm install
pnpm test           # 运行 Vitest
pnpm exec vitest run --coverage
```

## 鸿蒙打包

1. 安装 HBuilderX（3.8+，支持 uni-app x）。
2. 用 HBuilderX 打开本仓库根目录。
3. 菜单 → 运行 → 运行到鸿蒙 → 选择模拟器或真机（已开发者模式）。
4. 菜单 → 发行 → 原生 App-云端打包 / 本地打包 → 选 HarmonyOS，选证书（需先在华为联盟申请）。
5. 产物：`unpackage/release/harmony/*.hap`。

详细证书与上架流程见 `docs/release.md`（待补）。

## 架构与设计

- Spec：`docs/superpowers/specs/2026-04-18-party-games-design.md`
- 分阶段实施计划：`docs/superpowers/plans/2026-04-19-*.md`
- E2E 日志：`docs/superpowers/e2e-log.md`

## 许可

Private / MIT（TBD）。
