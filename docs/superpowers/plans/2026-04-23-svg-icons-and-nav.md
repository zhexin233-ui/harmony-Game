# SVG 图标统一与底部导航收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将运行时代码中的 emoji / 文本图标替换为 SVG，并将底部导航收敛为首页、惩罚、设置三项。

**Architecture:** 使用 `static/icons/*.svg` 作为唯一图标资源来源，`ui/icons.ts` 作为映射表，`UiIcon.uvue` 作为统一渲染组件。导航、主题卡片、游戏列表、首页及具体游戏页改为传递图标 key，而不是直接渲染字符。

**Tech Stack:** uni-app x、uvue、UTS、Vitest、TypeScript

---

### Task 1: 调整纯逻辑测试

**Files:**
- Modify: `tests/ui/navigation.test.ts`
- Modify: `tests/ui/games.test.ts`
- Modify: `tests/ui/theme-cards.test.ts`

- [ ] 将导航测试改为只断言 `home / punishment / settings` 三项，并断言 icon key。
- [ ] 将游戏 UI 测试改为断言分组图标和封面降级使用 SVG key。
- [ ] 将主题卡片测试改为断言主题图标 key。
- [ ] 运行定向测试，确认至少有一处因旧实现仍使用 emoji / 旧导航结构而失败。

### Task 2: 建立 SVG 图标基础设施

**Files:**
- Create: `static/icons/*.svg`
- Create: `ui/icons.ts`
- Create: `components/UiIcon.uvue`

- [ ] 新增导航、主题、首页、游戏页所需的 SVG 资源。
- [ ] 实现图标 key 到资源路径的映射和兜底逻辑。
- [ ] 实现 `UiIcon` 组件，支持尺寸、图片模式和圆角容器内展示。

### Task 3: 收敛导航与纯逻辑模块

**Files:**
- Modify: `ui/navigation.ts`
- Modify: `ui/games.ts`
- Modify: `ui/theme-cards.ts`

- [ ] 删除 `games` 底部导航项并改为 SVG icon key。
- [ ] 允许游戏列表页底部导航不高亮任何项。
- [ ] 将游戏分组图标、游戏封面降级字段、主题卡片图标字段替换为 SVG key。

### Task 4: 替换共享组件和页面图标

**Files:**
- Modify: `components/BottomNavBar.uvue`
- Modify: `components/UiTopBar.uvue`
- Modify: `components/ThemeChoiceCard.uvue`
- Modify: `components/GameImageCard.uvue`
- Modify: `components/GameTile.uvue`
- Modify: `pages/home/index.uvue`
- Modify: `pages/onboarding/index.uvue`
- Modify: `pages/settings/index.uvue`
- Modify: `pages/punishment/index.uvue`
- Modify: `pages/lobby/games.uvue`

- [ ] 引入 `UiIcon`，移除共享组件中的文本图标渲染。
- [ ] 将首页、惩罚页、主题页、游戏列表页改为 SVG 图标。
- [ ] 保持现有文案、跳转和布局关系不变。

### Task 5: 替换具体游戏页图标并验证

**Files:**
- Modify: `pages/game/bomb/index.uvue`
- Modify: `pages/game/crocodile/index.uvue`
- Modify: `pages/game/horse-race/index.uvue`
- Modify: `pages/game/reaction/index.uvue`
- Modify: `pages/game/result.uvue`
- Modify: `pages/game/wheel/index.uvue`

- [ ] 将各游戏页中用于视觉表达的 emoji 图标改为 SVG。
- [ ] 运行 `pnpm exec vitest run tests/ui/navigation.test.ts tests/ui/games.test.ts tests/ui/theme-cards.test.ts`。
- [ ] 运行 `pnpm test`。
- [ ] 运行 `pnpm exec tsc --noEmit --ignoreDeprecations 6.0`。
- [ ] 检索运行时代码，确认不再残留 emoji 图标。
