# 鸿蒙派对小游戏 · 实施计划 5（Phase 5+6：视觉/音效装配与打包发布）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Phase 0–4（Spike / 骨架 / 逻辑 / 游戏 UI / 惩罚库）已跑通的基础上，把双主题视觉与音效资源彻底装配到每个页面、补齐关键动画、执行 Spec §9.2 的 7 项 E2E 清单、完成鸿蒙打包与发布文档，一次性交付可上市的 v1.0.0。

**Architecture:** 本计划分两段。前段（Phase 5）把主题 Token 下沉到所有游戏页的关键颜色（通过 `computed(() => themes[settings.theme])` 绑定 `:style`，代替 UVue 对 CSS 变量支持不稳定的 `var(--x, fallback)`），在 `uni.scss` 中统一 keyframes，在 `static/sound/` 放入 8 个 CC0 音效并校验 `preload` 通路；后段（Phase 6）清理 `pages.json` 首项、补齐 `manifest.json` 的鸿蒙 icon 与元信息、执行并记录 E2E 清单、写打包文档并产出 v1.0.0 Tag。整份计划以"每步可跑 / 每段可提交"的节奏推进。

**Tech Stack:** uni-app x（UVue + UTS）· Vue 3 组合式 API · Pinia · Vitest · HarmonyOS NEXT（鸿蒙 6）· HBuilderX 打包

**Spec 引用：** `docs/superpowers/specs/2026-04-18-party-games-design.md` §6（主题/视觉/字体）· §7（原生能力与权限） · §8（错误与降级）· §9.2（手动 E2E 清单） · §12 Phase 5 / Phase 6

**前置依赖：**
- Plan 1（骨架）：`theme/tokens.ts` 已定义双主题 token，`theme/apply.ts` 已接入 CSS 变量，`stores/settings.ts` 的 `theme / soundEnabled / vibrationEnabled` 均可读写。
- Plan 2（逻辑）：5 款 `games/*/logic.ts` 状态机稳定，`tests/games/*.test.ts` 全绿。
- Plan 3（游戏 UI）：5 款游戏页已接入 session / audio / vibrator / keepAwake / sensor。
- Plan 4（惩罚库）：`stores/punishment.ts` + 25 条内置 + 结算页真实抽取已落地。

**范围 · Plan 5+6 包含：**
- `theme/tokens.ts` 新增 5 个"状态/视觉效果类"Token（warn / urgent / armedBg / signalBg / emojiShadow），`tests/theme/tokens.test.ts` 覆盖。
- 5 款游戏页的 `<style>` 中硬编码颜色下沉为组件 `computed` + `:style`。
- `onboarding / settings` 两张"主题相关"页面的 pill/卡片响应式绑定。
- `uni.scss` 统一 keyframes（pulse / spin / fade-in / shake）。
- neon 主题的 emoji 发光（`text-shadow`）。
- `static/sound/` 放入 8 个 CC0 mp3 文件 + README 标明来源与许可。
- `pages.json` 启动首项改为 `pages/home/index` 或 `pages/onboarding/index`，移除 `pages/spike/index` 路由条目。
- `manifest.json`：`app-harmony` 分支补 icon、bundleName、versionName/Code、requestPermissions 审计。
- `docs/superpowers/e2e-log.md` 记录 Spec §9.2 的 7 项测试执行结果。
- `README.md` 补玩法说明 + 打包步骤 + 截图占位。
- `CHANGELOG.md` 创建并写入 v1.0.0 条目。
- Git tag `v1.0.0` 与一次性合并 commit。

**范围 · Plan 5+6 不包含（留待 v1.1+）：**
- 原画级 PNG / SVG 插画（MVP 继续用 emoji，Spec §2.2 已把资源打磨列为非目标）。
- 字体自定义包（改用系统默认字体 + neon 的 text-shadow 即可满足 §6.1 的"轻微阴影"要求）。
- 背景乐与主题化音效差异（§6.3 明确"MVP 共用一套音效"）。
- iOS / Android / H5 / 小程序打包。
- 账号、云端、社交分享（Spec §2.2）。
- 应用市场审核流程（不自动化；README 仅给指引）。

---

## 文件结构

> ⚠️ 本仓库采用扁平目录（非 `src/`），目录名即模块名。路径别名 `@/` 映射到仓库根（`tsconfig.json:18` / `vitest.config.ts` 已配好）。

### Phase 5 涉及文件

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `theme/tokens.ts` | 修改 | 新增 `warn / urgent / armedBg / signalBg / emojiShadow` 5 个 Token（两套主题都补齐） |
| `theme/apply.ts` | 修改（可选） | 若 UVue 不兼容 camelCase key → var，增加 key 过滤（多数情况无需改） |
| `tests/theme/tokens.test.ts` | 创建 | 校验两套主题都包含完整 Token（含新增字段） |
| `tests/theme/apply.test.ts` | 修改 | 补测新 Token 会被写入 CSS 变量 |
| `uni.scss` | 修改 | 统一 `@keyframes pulse / spin / fade-in / shake` + `.emoji-glow` class |
| `pages/game/bomb/index.uvue` | 修改 | `.container / .boom / .who / .ticking` 硬编码色下沉到 `computed` + `:style`；`.pulse` 接上 keyframes |
| `pages/game/crocodile/index.uvue` | 修改 | `.container / .bite / .current / .tooth / .bite-text` 下沉；增加咬合 shake 动画 |
| `pages/game/horse-race/index.uvue` | 修改 | `.container / .count / .big-count / .trophy / .skull / .counts` 下沉；`.count / .big-count` 上 pulse |
| `pages/game/wheel/index.uvue` | 修改 | `.container / .wheel / .spin-hint / .result-hint` 下沉；`🎡` emoji 加 spin 动画 |
| `pages/game/reaction/index.uvue` | 修改 | `.container.armed/.signal/.falseStart/.resolved` 状态背景改 `:style` 绑定 |
| `pages/game/result.uvue` | 修改 | `.card` 抽卡 fade-in；`.empty` 空态下沉到 tokens |
| `pages/onboarding/index.uvue` | 修改 | 两张卡片改为用 `themes.cartoon / themes.neon` 的 token 直接渲染，保证展示所见即所得 |
| `pages/settings/index.uvue` | 修改 | `.pill.active` 背景响应式（使用 `computed` + `:style`） |
| `static/sound/click.mp3` | 创建 | CC0 按钮短音效（100-250ms） |
| `static/sound/tick.mp3` | 创建 | 炸弹滴答（60-200ms 单次） |
| `static/sound/explode.mp3` | 创建 | 爆炸（500-1200ms） |
| `static/sound/bite.mp3` | 创建 | 鳄鱼咬合（300-600ms） |
| `static/sound/signal.mp3` | 创建 | 反应游戏信号（150-300ms，尖锐） |
| `static/sound/countdown.mp3` | 创建 | 倒计时提示音（100-200ms） |
| `static/sound/win.mp3` | 创建 | 胜利号角（500-900ms） |
| `static/sound/lose.mp3` | 创建 | 输家哀嚎（400-900ms） |
| `static/sound/README.md` | 修改 | 每个文件列出来源 URL + 许可 + 时长 |
| `tests/native/audio.test.ts` | 修改 | 补一条"preload(GAME_SOUNDS) 会为 8 个 ID 各建一个 audioContext"的断言 |

### Phase 6 涉及文件

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `pages.json` | 修改 | 首项改为 `pages/onboarding/index`（首启）或 `pages/home/index`（冷启），移除 `pages/spike/index` 路由 |
| `pages/spike/index.uvue` | 删除 | Phase 0 遗留 spike 页，已完成使命 |
| `manifest.json` | 修改 | `app-harmony.distribute`：追加 `icons`、bundleName（可选）、requestPermissions 审计；根级 `versionName=1.0.0 / versionCode=100`（维持） |
| `static/icons/icon-72.png` / `icon-114.png` / `icon-216.png` | 创建 | 鸿蒙应用 icon 三档尺寸（由 logo.png 放大/剪裁） |
| `docs/superpowers/e2e-log.md` | 创建 | Spec §9.2 的 7 项测试执行日志，记录通过/失败/待复测 |
| `README.md` | 修改 | 玩法介绍 · 架构图 · 打包步骤 · 截图占位 |
| `CHANGELOG.md` | 创建 | v1.0.0 首发条目 |

---

## Phase 5 · 视觉与音效

### Task 5.1：扩展主题 Token（warn / urgent / armedBg / signalBg / emojiShadow）

**Files:**
- Modify: `theme/tokens.ts`
- Modify: `tests/theme/tokens.test.ts`（若不存在则 Create）

- [ ] **Step 1：写（或补）失败的测试**

写入 `tests/theme/tokens.test.ts`（若已存在，在末尾追加用例块）：

```ts
import { describe, it, expect } from 'vitest'
import { themes } from '@/theme/tokens'

describe('themes tokens 完整性', () => {
  const requiredKeys = [
    'bg', 'bgEnd', 'primary', 'secondary', 'accent',
    'text', 'textMuted', 'success', 'danger', 'glow',
    'warn', 'urgent', 'armedBg', 'signalBg', 'emojiShadow'
  ] as const

  it('cartoon 主题包含所有必要 token', () => {
    for (const k of requiredKeys) {
      expect((themes.cartoon as unknown as Record<string, string>)[k]).toBeTruthy()
    }
  })
  it('neon 主题包含所有必要 token', () => {
    for (const k of requiredKeys) {
      expect((themes.neon as unknown as Record<string, string>)[k]).toBeTruthy()
    }
  })
  it('neon 的 emojiShadow 含发光效果', () => {
    expect(themes.neon.emojiShadow).toMatch(/rgba|#/)
  })
})
```

- [ ] **Step 2：运行测试，确认失败**

Run: `pnpm test -- tests/theme/tokens.test.ts`
Expected: FAIL，提示 `warn / urgent / armedBg / signalBg / emojiShadow` 属性 undefined。

- [ ] **Step 3：扩展 tokens 定义**

把 `theme/tokens.ts` 改为（完整内容替换）：

```ts
export type Theme = 'cartoon' | 'neon'

export type ThemeTokens = {
  bg: string
  bgEnd: string
  primary: string
  secondary: string
  accent: string
  text: string
  textMuted: string
  success: string
  danger: string
  glow: string
  warn: string         // 中度紧迫（炸弹黄灯期）
  urgent: string       // 高度紧迫（炸弹红灯期 / 反应游戏抢跑）
  armedBg: string      // 反应游戏等待信号期背景
  signalBg: string     // 反应游戏信号发出背景
  emojiShadow: string  // emoji 的 text-shadow CSS 值（neon 主题发光）
}

export const themes: Record<Theme, ThemeTokens> = {
  cartoon: {
    bg: '#FFF5EB',
    bgEnd: '#FFE5F1',
    primary: '#FF6B9D',
    secondary: '#FFB347',
    accent: '#7ED957',
    text: '#3D2F4F',
    textMuted: '#7A6A87',
    success: '#7ED957',
    danger: '#FF6B9D',
    glow: 'transparent',
    warn: '#FFE0B2',
    urgent: '#FFB0B0',
    armedBg: '#FFE9C7',
    signalBg: '#7ED957',
    emojiShadow: 'none'
  },
  neon: {
    bg: '#0A1428',
    bgEnd: '#0E1A2B',
    primary: '#00D4FF',
    secondary: '#FF3D9A',
    accent: '#FFE600',
    text: '#00D4FF',
    textMuted: '#7A88A6',
    success: '#6CE5B8',
    danger: '#FF3D9A',
    glow: 'rgba(0, 212, 255, 0.5)',
    warn: '#3A2812',
    urgent: '#5A1020',
    armedBg: '#1A2A4C',
    signalBg: '#00D4FF',
    emojiShadow: '0 0 8px rgba(0, 212, 255, 0.8)'
  }
}
```

- [ ] **Step 4：运行测试，确认通过**

Run: `pnpm test -- tests/theme/tokens.test.ts`
Expected: PASS（3 个用例全绿）。

- [ ] **Step 5：跑一次全量测试保证无回归**

Run: `pnpm test`
Expected: 全绿。

- [ ] **Step 6：提交**

```bash
git add theme/tokens.ts tests/theme/tokens.test.ts
git commit -m "feat(theme): 新增 warn/urgent/armedBg/signalBg/emojiShadow 主题 token"
```

---

### Task 5.2：`apply.test.ts` 补测新 Token 写入 CSS 变量

**Files:**
- Modify: `tests/theme/apply.test.ts`

- [ ] **Step 1：追加测试用例**

在 `tests/theme/apply.test.ts` 的 `describe('applyTheme', ...)` 末尾追加：

```ts
  it('把 neon 的 warn/urgent/armedBg/signalBg/emojiShadow 也写入', () => {
    applyTheme('neon', fakeRoot as unknown as HTMLElement)
    expect(recorded['--warn']).toBe(themes.neon.warn)
    expect(recorded['--urgent']).toBe(themes.neon.urgent)
    expect(recorded['--armed-bg']).toBe(themes.neon.armedBg)
    expect(recorded['--signal-bg']).toBe(themes.neon.signalBg)
    expect(recorded['--emoji-shadow']).toBe(themes.neon.emojiShadow)
  })
```

- [ ] **Step 2：运行测试**

Run: `pnpm test -- tests/theme/apply.test.ts`
Expected: PASS（`applyTheme` 实现已是 `for (const key in tokens)` 迭代，会自动带上新 token）。

- [ ] **Step 3：提交**

```bash
git add tests/theme/apply.test.ts
git commit -m "test(theme): apply.test 覆盖新增主题 token"
```

---

### Task 5.3：统一 keyframes 到 `uni.scss`

**Files:**
- Modify: `uni.scss`（仓库根）

- [ ] **Step 1：读当前 `uni.scss` 内容**

Run: `ls -la uni.scss && wc -l uni.scss`
Expected: 文件存在；如果仅有 `@import` 或空白，直接在末尾追加。

- [ ] **Step 2：在 `uni.scss` 末尾追加共享动画定义**

```scss
/* Phase 5：共享动画 keyframes —— 各游戏页通过 class 引用 */
@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

.anim-pulse   { animation: pulse 1200ms ease-in-out infinite; }
.anim-spin    { animation: spin 1400ms linear infinite; }
.anim-fade-in { animation: fade-in 320ms ease-out both; }
.anim-shake   { animation: shake 240ms ease-in-out 2; }
```

- [ ] **Step 3：提交**

```bash
git add uni.scss
git commit -m "feat(style): 共享 keyframes 与 anim-* class（pulse/spin/fade-in/shake）"
```

> 说明：不先写测试。UVue/SCSS 动画难以单测；E2E 清单会在 Phase 6 校验视觉。

---

### Task 5.4：定时炸弹页——容器背景 & 脉冲 emoji 下沉到 token

**Files:**
- Modify: `pages/game/bomb/index.uvue`

- [ ] **Step 1：在 `<script setup>` 顶部增加 tokens 响应式**

`pages/game/bomb/index.uvue` 已经 `import { ref, computed } from 'vue'`。在该行之后追加 `useSettings / themes` 的 import，然后在 `const state = computed(...)` **附近**（保持作用域内）追加：

```ts
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const containerStyle = computed(() => {
  const level = urgencyLevel.value
  const bg = level >= 2 ? tokens.value.urgent
    : level === 1 ? tokens.value.warn
      : tokens.value.bg
  return { backgroundColor: bg }
})
const bigEmojiStyle = computed(() => ({ textShadow: tokens.value.emojiShadow }))
const boomStyle    = computed(() => ({ color: tokens.value.danger }))
const whoBgStyle   = computed(() => ({ backgroundColor: tokens.value.bgEnd }))
const hintStyle    = computed(() => ({ color: tokens.value.textMuted }))
```

- [ ] **Step 2：模板绑定 style**

把 `<template>` 中对应元素改为：

```html
<view class="container" :style="containerStyle">
  <text class="big anim-pulse" :style="bigEmojiStyle">💣</text>
  ...
  <view v-else-if="state === 'exploded'" class="exploded">
    <text class="boom" :style="boomStyle">💥 爆炸了！</text>
    <text class="hint" :style="hintStyle">手里拿着手机的人点自己</text>
    <view class="who-grid">
      <view v-for="i in session.playerCount" :key="i" class="who" :style="whoBgStyle" @tap="claimLoser(i - 1)">
        <text class="who-text">{{ session.displayNameOf(i - 1) }}</text>
      </view>
    </view>
  </view>
```

- [ ] **Step 3：`<style>` 去除硬编码颜色**

把 `.container { background-color: #FFF5EB; }`、`.container.warn` / `.container.urgent`、`.boom { color: ... }`、`.who { background-color: ... }`、`.hint { color: ... }` 中的颜色行删除（保留 padding / border-radius / font-size 等布局属性）。

把现有 `.pulse {}` 空块删除（已改用 `.anim-pulse`）。

- [ ] **Step 4：人工验证**

Run: `pnpm test`（保证没有回归）。
目视：启动 HBuilderX 模拟器或鸿蒙真机，切换主题观察容器底色从浅米白（cartoon）变为深海蓝（neon），炸弹 emoji 持续脉冲。

- [ ] **Step 5：提交**

```bash
git add pages/game/bomb/index.uvue
git commit -m "feat(bomb): 容器/emoji/爆炸文字响应主题 token + 接入 anim-pulse"
```

---

### Task 5.5：鳄鱼拔牙页——容器与咬合震动下沉到 token

**Files:**
- Modify: `pages/game/crocodile/index.uvue`

- [ ] **Step 1：`<script setup>` 尾部加 tokens**

```ts
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const containerStyle = computed(() => ({
  backgroundColor: state.value === 'trapTriggered' ? tokens.value.urgent : tokens.value.bg
}))
const bigEmojiStyle = computed(() => ({ textShadow: tokens.value.emojiShadow }))
const currentStyle  = computed(() => ({ color: tokens.value.primary }))
const toothStyle    = computed(() => ({ backgroundColor: tokens.value.bgEnd }))
const biteTextStyle = computed(() => ({ color: tokens.value.danger }))
const hintStyle     = computed(() => ({ color: tokens.value.textMuted }))
```

> 若文件已导入 `computed`，去重；已导入 `useSettings/themes` 也去重。

- [ ] **Step 2：模板绑定**

把 `<template>` 相关元素改为（保留其他部分）：

```html
<view class="container" :class="{ 'anim-shake': state === 'trapTriggered' }" :style="containerStyle">
  <text class="big" :style="bigEmojiStyle">🐊</text>
  ...
  <text class="current" :style="currentStyle">
    当前回合：{{ session.displayNameOf(snap?.currentPlayer ?? 0) }}
  </text>
  <view class="teeth-grid">
    <view
      v-for="i in snap?.totalTeeth ?? 0"
      :key="i"
      class="tooth"
      :class="{ pressed: isPressed(i - 1) }"
      :style="toothStyle"
      @tap="onTapTooth(i - 1)"
    >
      <text class="tooth-emoji">{{ isPressed(i - 1) ? '⬜' : '🦷' }}</text>
    </view>
  </view>
  ...
  <text class="bite-text" :style="biteTextStyle">咔嚓！...</text>
  ...
  <text class="hint" :style="hintStyle">共 {{ snap?.totalTeeth ?? 0 }} 颗牙...</text>
```

去除 `<view class="container" :class="{ bite: state === 'trapTriggered' }">` 中的 `bite` 切换（被 `anim-shake` 取代）。

- [ ] **Step 3：`<style>` 清理**

删除 `.container { background-color: ... }`、`.container.bite { background-color: ... }`、`.current { color: ... }`、`.tooth { background-color: ... }`、`.bite-text { color: ... }`、`.hint { color: ... }` 中的颜色行。

- [ ] **Step 4：人工验证**

目视：咬合触发时整个容器左右轻抖 240ms（两次），底色变红/深紫，emoji 保持鳄鱼。

- [ ] **Step 5：提交**

```bash
git add pages/game/crocodile/index.uvue
git commit -m "feat(crocodile): 容器/牙齿/文字响应主题 + 咬合 anim-shake"
```

---

### Task 5.6：摇一摇赛马页——颜色下沉到 token + 数字脉冲

**Files:**
- Modify: `pages/game/horse-race/index.uvue`

- [ ] **Step 1：`<script setup>` 加 tokens**

```ts
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const containerStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
const bigEmojiStyle  = computed(() => ({ textShadow: tokens.value.emojiShadow }))
const countStyle     = computed(() => ({ color: tokens.value.primary }))
const trophyStyle    = computed(() => ({ color: tokens.value.success }))
const skullStyle     = computed(() => ({ color: tokens.value.danger }))
const mutedStyle     = computed(() => ({ color: tokens.value.textMuted }))
```

（去除重复 import。）

- [ ] **Step 2：模板绑定**

```html
<view class="container" :style="containerStyle">
  <text class="big" :style="bigEmojiStyle">🐎</text>
  ...
  <text v-else class="count anim-pulse" :style="countStyle">准备：{{ prepCountdown }}</text>
  ...
  <text class="big-count anim-pulse" :style="countStyle">{{ currentShakeCount }}</text>
  <text class="remaining" :style="mutedStyle">剩余 {{ remainingSec }} 秒</text>
  <text class="hint" :style="mutedStyle">用力摇晃手机！</text>
  ...
  <text class="trophy" :style="trophyStyle">🏆 {{ session.displayNameOf(snap?.result?.winner ?? 0) }} 赢了！</text>
  <text class="skull" :style="skullStyle">💩 {{ session.displayNameOf(snap?.result?.loser ?? 0) }} 输了</text>
  <text class="counts" :style="mutedStyle">次数：...</text>
```

- [ ] **Step 3：`<style>` 清理**

删除所有以 `background-color` / `color` 结尾且 value 为 hex 的样式行（保留布局 / 字号 / margin）。

- [ ] **Step 4：提交**

```bash
git add pages/game/horse-race/index.uvue
git commit -m "feat(horse-race): 颜色主题化 + 准备/摇动次数 anim-pulse"
```

---

### Task 5.7：指尖大轮盘页——轮盘容器色 + emoji 旋转

**Files:**
- Modify: `pages/game/wheel/index.uvue`

- [ ] **Step 1：`<script setup>` 加 tokens**

```ts
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const containerStyle   = computed(() => ({ backgroundColor: tokens.value.bg }))
const wheelBgStyle     = computed(() => ({ backgroundColor: tokens.value.bgEnd }))
const emojiShadowStyle = computed(() => ({ textShadow: tokens.value.emojiShadow }))
const spinHintStyle    = computed(() => ({ color: tokens.value.primary }))
const resultHintStyle  = computed(() => ({ color: tokens.value.primary }))
const collectStyle     = computed(() => ({ color: tokens.value.textMuted }))
```

- [ ] **Step 2：模板绑定 + 旋转动画 class**

```html
<view class="container" :style="containerStyle">
  <text class="big" :style="emojiShadowStyle">🎯</text>
  ...
  <view class="wheel" :style="wheelBgStyle" @touchstart="...">
    <text class="wheel-emoji" :class="{ 'anim-spin': state === 'spinning' }" :style="emojiShadowStyle">🎡</text>
    <view v-if="state === 'collecting'" class="collect-hint">
      <text class="collect-line" :style="collectStyle">请 {{ session.playerCount }} 根手指...</text>
      <text class="collect-line" :style="collectStyle">当前：...</text>
    </view>
    <text v-else-if="state === 'spinning'" class="spin-hint" :style="spinHintStyle">🔄 旋转中...</text>
    <text v-else-if="state === 'selected'" class="result-hint" :style="resultHintStyle">🎯 选中了 ...</text>
  </view>
```

- [ ] **Step 3：`<style>` 清理**

删除 `.container { background-color: ... }`、`.wheel { background-color: ... }`、`.collect-line / .spin-hint / .result-hint` 的颜色行。

- [ ] **Step 4：提交**

```bash
git add pages/game/wheel/index.uvue
git commit -m "feat(wheel): 轮盘色主题化 + 🎡 anim-spin 指针旋转"
```

---

### Task 5.8：同屏反应页——四种状态背景改 token

**Files:**
- Modify: `pages/game/reaction/index.uvue`

- [ ] **Step 1：`<script setup>` 加 tokens + 状态色映射**

```ts
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const containerStyle = computed(() => {
  const st = state.value
  if (falseStart.value)       return { backgroundColor: tokens.value.urgent }
  if (st === 'signal')        return { backgroundColor: tokens.value.signalBg }
  if (st === 'armed')         return { backgroundColor: tokens.value.armedBg }
  if (st === 'resolved')      return { backgroundColor: tokens.value.bgEnd }
  return { backgroundColor: tokens.value.bg }
})
const bigHintStyle   = computed(() => ({ color: tokens.value.text }))
const smallHintStyle = computed(() => ({ color: tokens.value.textMuted }))
const signalBigStyle = computed(() => ({ color: '#FFFFFF' })) // 绿色信号底上始终白字
const loserStyle     = computed(() => ({ color: tokens.value.danger }))
```

- [ ] **Step 2：模板绑定**

去除 `:class="{ armed, signal, falseStart, resolved }"`（由 `:style` 取代）。示例：

```html
<view class="container" :style="containerStyle"
  @touchstart="onTouchStart" @touchmove="onTouchMove"
  @touchend="onTouchEnd" @touchcancel="onTouchEnd">
  <text class="title" :style="bigHintStyle">👆 同屏反应大比拼</text>
  ...
  <text class="hint-big" :style="bigHintStyle">请 ...</text>
  <text class="hint-small" :style="smallHintStyle">当前：...</text>
  ...
  <text class="signal-big" :style="signalBigStyle">⚡ 现在！松手！</text>
  ...
  <text class="loser-big" :style="loserStyle">...</text>
```

- [ ] **Step 3：`<style>` 清理**

删除 `.container.armed/.signal/.falseStart/.resolved`、`.hint-big { color: ... }`、`.hint-small { color: ... }`、`.signal-big { color: ... }`、`.loser-big { color: ... }` 中的颜色行。

- [ ] **Step 4：提交**

```bash
git add pages/game/reaction/index.uvue
git commit -m "feat(reaction): 四种状态背景色主题化（armed/signal/falseStart/resolved）"
```

---

### Task 5.9：结算页——惩罚卡片淡入 + 颜色下沉

**Files:**
- Modify: `pages/game/result.uvue`

- [ ] **Step 1：`<script setup>` 加 tokens**

```ts
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])

const loserStyle = computed(() => ({ color: tokens.value.danger }))
const cardStyle  = computed(() => ({ backgroundColor: tokens.value.bgEnd }))
const emptyStyle = computed(() => ({ backgroundColor: tokens.value.bgEnd }))
const mutedStyle = computed(() => ({ color: tokens.value.textMuted }))
```

- [ ] **Step 2：模板绑定 + fade-in class**

```html
<text class="loser" :style="loserStyle">{{ loserName }} 输啦！</text>

<view v-if="punishment !== ''" class="card anim-fade-in" :style="cardStyle">
  <text class="label" :style="mutedStyle">抽到的惩罚</text>
  <text class="punishment">{{ punishment }}</text>
</view>
<view v-else class="empty anim-fade-in" :style="emptyStyle">
  <text class="empty-emoji">📭</text>
  <text class="empty-title">惩罚库为空</text>
  <text class="empty-desc" :style="mutedStyle">启用至少一条规则，才能抽惩罚。</text>
  <AppButton label="去管理惩罚规则" variant="primary" @tap="toPunishment" />
</view>
```

- [ ] **Step 3：`<style>` 清理**

删除 `.loser { color: var(--danger, ...) }`、`.card { background-color: var(--bg-end, ...) }`、`.empty { background-color: ... }`、`.empty-desc { color: ... }`、`.label { color: ... }` 中的颜色行（动画由 `.anim-fade-in` 承担）。

- [ ] **Step 4：提交**

```bash
git add pages/game/result.uvue
git commit -m "feat(result): 抽卡 fade-in + 颜色主题化"
```

---

### Task 5.10：引导页——两张卡片用 token 直渲（所见即所得）

**Files:**
- Modify: `pages/onboarding/index.uvue`

> 目的：两张卡片展示的"Q 版"与"霓虹"样式应当与 `themes.cartoon / themes.neon` 完全一致，而不是手写渐变色。这样将来调 token 也会自动反映到引导页。

- [ ] **Step 1：`<script setup>` 读 themes**

```ts
import { computed } from 'vue'
import { themes } from '@/theme/tokens'

const cartoonCardStyle = computed(() => ({
  backgroundColor: themes.cartoon.primary,
  borderWidth: '0px'
}))
const neonCardStyle = computed(() => ({
  backgroundColor: themes.neon.bg,
  borderWidth: '1px',
  borderColor: themes.neon.primary,
  textShadow: themes.neon.emojiShadow
}))
const neonNameStyle = computed(() => ({ color: themes.neon.primary }))
```

- [ ] **Step 2：模板绑定**

```html
<view class="card" :style="cartoonCardStyle" @tap="pick('cartoon')">
  <text class="emoji">🎈</text>
  <text class="name">Q 版卡通</text>
  <text class="desc">暖色 · 圆润 · 漫画感</text>
</view>
<view class="card" :style="neonCardStyle" @tap="pick('neon')">
  <text class="emoji" :style="{ textShadow: themes.neon.emojiShadow }">⚡</text>
  <text class="name" :style="neonNameStyle">霓虹电玩</text>
  <text class="desc" :style="{ color: '#7A88A6' }">深色 · 柔光 · 赛博感</text>
</view>
```

- [ ] **Step 3：`<style>` 清理**

删除 `.cartoon { background-image/background-color }`、`.neon { background-image/background-color/border-color }` 三个 class 的颜色行（保留 `padding / border-radius / margin-top`）。

- [ ] **Step 4：提交**

```bash
git add pages/onboarding/index.uvue
git commit -m "feat(onboarding): 两张卡片直接读主题 token 渲染（所见即所得）"
```

---

### Task 5.11：设置页——主题 pill 的 active 背景响应式

**Files:**
- Modify: `pages/settings/index.uvue`

- [ ] **Step 1：`<script setup>` 加 tokens + 两个 pill 的响应式样式**

```ts
import { computed } from 'vue'
import { themes } from '@/theme/tokens'

const tokens = computed(() => themes[settings.theme])

const cartoonPillStyle = computed(() => {
  const active = settings.theme === 'cartoon'
  return {
    backgroundColor: active ? tokens.value.primary : tokens.value.bgEnd,
    color: active ? '#FFFFFF' : tokens.value.text
  }
})
const neonPillStyle = computed(() => {
  const active = settings.theme === 'neon'
  return {
    backgroundColor: active ? tokens.value.primary : tokens.value.bgEnd,
    color: active ? '#FFFFFF' : tokens.value.text
  }
})
```

- [ ] **Step 2：模板绑定**

```html
<view class="pill" :style="cartoonPillStyle" @tap="settings.setTheme('cartoon')">
  <text :style="{ color: cartoonPillStyle.color }">🎈 Q 版卡通</text>
</view>
<view class="pill" :style="neonPillStyle" @tap="settings.setTheme('neon')">
  <text :style="{ color: neonPillStyle.color }">⚡ 霓虹电玩</text>
</view>
```

（注：`:style="cartoonPillStyle"` 会同时设置 backgroundColor 与 color；`<text>` 内再读 `color` 是为了明确文本继承 —— UVue 对 inline color 的继承并不总是可靠。）

- [ ] **Step 3：`<style>` 清理**

删除 `.pill { background-color: ... }` 与 `.pill.active { background-color: ... }` 两行。

- [ ] **Step 4：提交**

```bash
git add pages/settings/index.uvue
git commit -m "feat(settings): 主题 pill 响应式切换（背景 + 文本色）"
```

---

### Task 5.12：音效 README 更新（文件选型与来源）

**Files:**
- Modify: `static/sound/README.md`

- [ ] **Step 1：整体替换 README**

```markdown
# 游戏音效资源

所有音效为 **CC0 / CC-BY** 许可，可免费用于商业项目。

| 文件 | 用途 | 时长建议 | 推荐来源（freesound.org / pixabay） |
|---|---|---|---|
| `click.mp3`     | 所有按钮点击、剪引线、鳄鱼无害牙 | 80–200 ms | 搜索 "UI click" / "button tap" |
| `tick.mp3`      | 炸弹滴答（按剩余时间频率递增） | 60–150 ms | 搜索 "clock tick" / "bomb tick" |
| `explode.mp3`   | 炸弹爆炸、结算页敲定输家冲击 | 500–1200 ms | 搜索 "cartoon explosion" |
| `bite.mp3`      | 鳄鱼陷阱牙咬合 | 300–600 ms | 搜索 "chomp" / "bite" |
| `signal.mp3`    | 反应游戏发出信号、摇马开始 | 150–300 ms | 搜索 "game signal" / "beep" |
| `countdown.mp3` | 摇马倒计时 3/2/1 提示 | 80–200 ms | 搜索 "countdown beep" |
| `win.mp3`       | 摇马结算赢家 | 500–900 ms | 搜索 "win jingle" |
| `lose.mp3`      | 结算/失败提示 | 400–900 ms | 搜索 "fail sound" / "lose trumpet" |

## 规范

- 采样率 44.1kHz / 比特率 ≥128kbps。
- 文件体积 ≤200KB（鸿蒙启动预加载 8 个文件总体积 <2MB）。
- 文件名必须与 `utils/game-sounds.ts` 的映射严格对应。

## 加入新文件

1. 从 freesound.org 下载 CC0 文件（登录后勾选 "Creative Commons 0"）。
2. 用 ffmpeg 转码到 mp3：`ffmpeg -i input.wav -b:a 128k -ar 44100 static/sound/<name>.mp3`。
3. 在本表里补一行注明 **原始 URL** 与 **作者**。
```

- [ ] **Step 2：提交**

```bash
git add static/sound/README.md
git commit -m "docs(sound): 音效选型规范与来源指南"
```

---

### Task 5.13：放入 8 个音效文件

**Files:**
- Create: `static/sound/click.mp3`
- Create: `static/sound/tick.mp3`
- Create: `static/sound/explode.mp3`
- Create: `static/sound/bite.mp3`
- Create: `static/sound/signal.mp3`
- Create: `static/sound/countdown.mp3`
- Create: `static/sound/win.mp3`
- Create: `static/sound/lose.mp3`

> ⚠️ 这是"人工操作任务"：工程师需要手动从 freesound.org 下载 8 个 CC0 音效并按 README 规范放入 `static/sound/`。严禁下载版权不明的素材。

- [ ] **Step 1：逐个下载（至少 8 个独立文件）**

按 `static/sound/README.md` 的时长建议与搜索词，每个类别下载 1 个 CC0 音效并重命名到对应路径。

- [ ] **Step 2：转码与校验**

对每个文件执行：

```bash
ffprobe static/sound/<name>.mp3 2>&1 | grep -E "Duration|bitrate"
ls -lh static/sound/<name>.mp3
```

Expected：时长、比特率、体积在 README 规范内。

- [ ] **Step 3：在 README 的表格末尾追加"实际使用"列**

列出每个文件的 **原始 URL + 作者 + 下载日期**。

- [ ] **Step 4：手动 smoke test（在模拟器/真机）**

运行任一游戏，触发 `play('click')` 等，确认有声音；关闭设置里的音效开关，确认静音。

- [ ] **Step 5：提交**

```bash
git add static/sound/*.mp3 static/sound/README.md
git commit -m "feat(sound): 引入 8 个 CC0 游戏音效（click/tick/explode/bite/signal/countdown/win/lose）"
```

---

### Task 5.14：`audio.test.ts` 补 preload 8 个 ID 的断言

**Files:**
- Modify: `tests/native/audio.test.ts`

- [ ] **Step 1：查看现有测试结构**

Run: `pnpm test -- tests/native/audio.test.ts --reporter=verbose`
Expected: 通过（既有测试不该被破坏）。

- [ ] **Step 2：追加用例**

在 `tests/native/audio.test.ts` 末尾追加：

```ts
import { GAME_SOUNDS } from '@/utils/game-sounds'

describe('preload(GAME_SOUNDS)', () => {
  it('为 8 个 ID 各创建一个 audioContext', () => {
    const createSpy = (globalThis as any).uni.createInnerAudioContext as ReturnType<typeof vi.fn>
    createSpy.mockClear()
    preload(GAME_SOUNDS)
    expect(createSpy).toHaveBeenCalledTimes(Object.keys(GAME_SOUNDS).length)
    expect(Object.keys(GAME_SOUNDS).length).toBe(8)
  })
})
```

> 若 `preload` / `vi` 未从文件顶部导入，请按现有风格补齐。

- [ ] **Step 3：运行测试**

Run: `pnpm test -- tests/native/audio.test.ts`
Expected: 全绿，新用例覆盖到 8 次 `createInnerAudioContext` 调用。

- [ ] **Step 4：提交**

```bash
git add tests/native/audio.test.ts
git commit -m "test(audio): preload 会为 GAME_SOUNDS 的 8 个 ID 各建一个 context"
```

---

### Task 5.15：Phase 5 冒烟回归

**Files:** 无（纯运行）

- [ ] **Step 1：全量测试**

Run: `pnpm test`
Expected: 全绿（所有 games / stores / native / theme 测试）。

- [ ] **Step 2：覆盖率**

Run: `pnpm test -- --coverage`
Expected: `games/*/logic.ts` 覆盖 >80%（Spec §9.1 目标）；核心 store 覆盖 >75%。

- [ ] **Step 3：如果覆盖率不达标，记录到 `docs/superpowers/e2e-log.md` 的"已知差距"段（Phase 6 创建后再补），不阻塞本 phase。**

- [ ] **Step 4：空提交留 phase 标记（可选）**

```bash
git commit --allow-empty -m "chore(phase5): 视觉与音效装配完成 · 回归通过"
```

---

## Phase 6 · 手动测试与打包

### Task 6.1：清理 `pages.json` 启动首项，删除 spike 页

**Files:**
- Modify: `pages.json`
- Delete: `pages/spike/index.uvue`（整个文件）

- [ ] **Step 1：确认 spike 页仅作为 Phase 0 验证用**

Run: `git log --diff-filter=A -- pages/spike/index.uvue | head -5`
Expected: 显示 Phase 0 Spike 的 commit；之后没有对 spike 的功能依赖。

- [ ] **Step 2：编辑 `pages.json`**

把首项从 `pages/spike/index` 改为 `pages/onboarding/index`（引导为首次启动的唯一入口，未引导时会被 `App.uvue.onLaunch` reLaunch 到 home）。并删除 `pages/spike/index` 整个对象条目。

改完 pages 数组应以下列顺序开头：

```json
{
  "pages": [
    {
      "path": "pages/onboarding/index",
      "style": { "navigationStyle": "custom" }
    },
    {
      "path": "pages/home/index",
      ...
```

- [ ] **Step 3：删除 spike 文件**

Run: `rm pages/spike/index.uvue`
Run: `ls pages/spike 2>&1`（若是空目录）→ `rmdir pages/spike`（可选）

- [ ] **Step 4：运行测试，确认无 import 引用 spike**

用 Grep 工具（或 Bash 里等价的 ripgrep）搜索：

Pattern: `pages/spike`
Include: `*.uvue *.ts *.json`

Expected: 无匹配（或仅匹配本 plan 文件与 `docs/superpowers/specs/2026-04-19-spike-report.md` 等文档）。

Run: `pnpm test`
Expected: 全绿。

- [ ] **Step 5：提交**

```bash
git add pages.json
git rm pages/spike/index.uvue
git commit -m "chore(pages): 启动首项改为 onboarding，删除 Phase 0 的 spike 页"
```

---

### Task 6.2：准备鸿蒙 icon 三档尺寸

**Files:**
- Create: `static/icons/icon-72.png`
- Create: `static/icons/icon-114.png`
- Create: `static/icons/icon-216.png`

- [ ] **Step 1：确认源 logo 存在**

Run: `ls -la static/logo.png 2>&1 && file static/logo.png`
Expected: 存在；尺寸 ≥216×216 更佳（若不足请工程师用设计稿重出）。

- [ ] **Step 2：生成三档 icon**

```bash
mkdir -p static/icons
sips -z 72 72   static/logo.png --out static/icons/icon-72.png
sips -z 114 114 static/logo.png --out static/icons/icon-114.png
sips -z 216 216 static/logo.png --out static/icons/icon-216.png
```

> `sips` 是 macOS 自带的图片缩放工具；若源图不是方形，请先用设计软件导出方形版本。

- [ ] **Step 3：校验**

Run: `ls -lh static/icons/`
Expected: 3 个文件，每个几十到一百多 KB。

- [ ] **Step 4：提交**

```bash
git add static/icons/
git commit -m "feat(asset): 增加鸿蒙应用 icon 三档尺寸（72/114/216）"
```

---

### Task 6.3：`manifest.json` 完善鸿蒙 distribute

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1：修改 app-harmony.distribute 字段**

把 `manifest.json` 中 `"app-harmony": { "distribute": {...} }` 替换为：

```json
"app-harmony" : {
    "distribute" : {
        "icons" : {
            "small" : "static/icons/icon-72.png",
            "medium" : "static/icons/icon-114.png",
            "large" : "static/icons/icon-216.png"
        },
        "requestPermissions" : [
            { "name" : "ohos.permission.VIBRATE" }
        ]
    }
}
```

> 说明：加速度传感器 / 多点触控 / 音频 / 存储均无需声明权限（Spec §7.3），只保留 VIBRATE。

- [ ] **Step 2：更新 versionName（保持或改为 1.0.0）**

把 `"versionName" : "1.0.0"` 与 `"versionCode" : "100"` 显式确认。

- [ ] **Step 3：格式校验**

Run: `cat manifest.json | python3 -m json.tool > /dev/null && echo OK`
Expected: `OK`。如果报错，按提示修正 JSON 语法。

- [ ] **Step 4：提交**

```bash
git add manifest.json
git commit -m "chore(manifest): app-harmony 配置 icon 与权限（VIBRATE）"
```

---

### Task 6.4：neon emoji 发光回归（全局巡检）

**Files:** 无修改（仅巡检）

- [ ] **Step 1：确认 emoji `textShadow` 在所有游戏页都已绑定**

Run: `grep -n "textShadow" pages/game/*/index.uvue pages/game/result.uvue`
Expected: 5 款游戏页 + result 页都至少出现一次 `tokens.value.emojiShadow`。

- [ ] **Step 2：模拟器人工验证**

进入每款游戏与结算页，切换到 neon 主题，确认所有大 emoji（💣🐊🐎🎯👆📭💥🏆💩）周围有青色柔光。

- [ ] **Step 3：若有遗漏，补齐对应页面的 `:style="{ textShadow: tokens.value.emojiShadow }"`。**

- [ ] **Step 4：提交（如有补齐）**

```bash
git add pages/
git commit -m "polish(neon): 补齐 emoji 发光遗漏点"
```

---

### Task 6.5：创建 E2E 日志骨架

**Files:**
- Create: `docs/superpowers/e2e-log.md`

- [ ] **Step 1：写入日志文件骨架**

```markdown
# 鸿蒙派对小游戏 · E2E 手动测试记录

> 对应 Spec `docs/superpowers/specs/2026-04-18-party-games-design.md` §9.2。
> 每项测试由人工在鸿蒙模拟器 / 真机执行；Pass / Fail / Skip 各项独立填写。

## 环境

- 应用版本：v1.0.0（versionCode 100）
- 设备：<填写真机型号 / 模拟器版本>
- 鸿蒙版本：HarmonyOS NEXT 6.x
- 执行人：<填写>
- 执行日期：<填写>

## 清单

### T1 · 首启引导 · 两主题各选一次

**步骤：**
1. 卸载应用后重装 → 应进入 onboarding 页。
2. 点击"Q 版卡通"→ 进入首页，背景应为浅暖色。
3. 手动设置 → 清除应用数据 → 重启 → 选"霓虹电玩"→ 进入首页，背景应为深海蓝。
4. 冷启动（非首次）→ 不应进入引导页，直接进入首页。

**结果：** ⏳ 待执行

### T2 · 5 款游戏完整流程

（略，按 Spec §9.2 逐条列出 T3–T7，保留"结果：⏳ 待执行"占位。）

### T3 · 两主题下各跑一次游戏

### T4 · 设置页音效/振动开关实际生效

### T5 · 计时类游戏中接来电 / 切后台 / 返回

### T6 · 惩罚管理 · 新增/编辑/删除/启停 + 全部停用提示

### T7 · 鳄鱼拔牙 · 2 人 vs 8 人动态牙齿数

## 已知差距 / 待修复

（无）
```

- [ ] **Step 2：提交**

```bash
git add docs/superpowers/e2e-log.md
git commit -m "docs(e2e): 创建手动测试清单骨架（Spec §9.2）"
```

> 后续任务 6.6–6.8 在此基础上逐项补写完整测试步骤与执行结果。

---

### Task 6.6：执行 E2E 测试项 T1–T3

**Files:**
- Modify: `docs/superpowers/e2e-log.md`

- [ ] **Step 1：执行 T1（首启引导）**

按骨架内步骤操作，把 `⏳ 待执行` 替换为 `✅ 通过` / `❌ 失败：<现象与修复链接>`。

- [ ] **Step 2：执行 T2（5 款游戏完整流程）**

- 在 HBuilderX 里运行到鸿蒙模拟器或真机。
- 对 bomb / crocodile / horse-race / reaction / wheel 依次走完"开始 → 判定 → 结算 → 抽惩罚"。
- 结果写入日志：每款一行小结（通过 / 失败、现象）。

- [ ] **Step 3：执行 T3（两主题下各跑一次）**

选一款运气派（如炸弹）与一款实力派（如摇马）分别在 cartoon 与 neon 下跑一次。重点：按钮 / 容器色 / emoji 发光 / 动画是否正常。

- [ ] **Step 4：把发现的 bug 分级**

- Sev-1（闪退 / 无法完成流程）：立即修（开新 commit，在日志对应项注明 commit hash）。
- Sev-2（视觉瑕疵）：记录到"已知差距"段，可在本 phase 合并修复后再关闭。
- Sev-3（文案 / 提示）：本 phase 顺手改完。

- [ ] **Step 5：提交日志**

```bash
git add docs/superpowers/e2e-log.md
git commit -m "test(e2e): T1–T3 执行完毕并记录"
```

> 若有伴随修复，请独立 commit，message 格式：`fix(<scope>): <现象> (e2e T<n>)`。

---

### Task 6.7：执行 E2E 测试项 T4–T7

**Files:**
- Modify: `docs/superpowers/e2e-log.md`

- [ ] **Step 1：执行 T4（设置开关）**

- 在设置里关闭音效 → 回到任一游戏 → 触发 `play('click')` 类事件 → 无声 ✓。
- 关闭振动 → 触发 `vibrateShort()` → 无震 ✓。
- 在 Pinia 状态 + 存储双重校验（开关后 kill 进程再启动应保持）。

- [ ] **Step 2：执行 T5（来电 / 切后台）**

对定时炸弹 / 摇马 / 反应三款含计时的游戏，各测试一次：
- 游戏进行中按 Home 键 → 回到应用应显示"已暂停"遮罩。
- 来电（真机环境下）→ 回来后遮罩出现；点"继续"恢复 / "重来本局"重启 / "回大厅"退出。

- [ ] **Step 3：执行 T6（惩罚管理）**

- 新增："打游戏赢家让输家敬酒一杯" → 列表出现 · 启用 = true。
- 编辑一条内置 → 文案保存 · builtIn 保持 true · 重启应用仍在。
- 删除一条自定义 → 列表消失；再删一条内置 → 警告对话框 → 确认后消失，重启仍不出现（墓碑生效）。
- 把所有规则禁用 → 进入任一游戏玩到结算 → 应显示"惩罚库为空"空态 + 跳转管理页按钮。

- [ ] **Step 4：执行 T7（鳄鱼动态牙齿数）**

- 人数 2 → 鳄鱼页显示 "共 8 颗牙"（或按逻辑实际数）。
- 人数 8 → 鳄鱼页显示 "共 12 颗牙"（或按逻辑实际数）。
- 校对 `games/crocodile/logic.ts` 的牙齿数算法与显示一致。

- [ ] **Step 5：提交日志**

```bash
git add docs/superpowers/e2e-log.md
git commit -m "test(e2e): T4–T7 执行完毕并记录"
```

---

### Task 6.8：README 补齐玩法 / 打包 / 截图占位

**Files:**
- Modify: `README.md`

- [ ] **Step 1：把 README 整理为以下 6 段**

```markdown
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
pnpm test -- --coverage
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
```

- [ ] **Step 2：提交**

```bash
git add README.md
git commit -m "docs(readme): 玩法 / 打包 / 架构索引更新"
```

---

### Task 6.9：补 4 张核心截图

**Files:**
- Create: `docs/screenshots/home.png`
- Create: `docs/screenshots/lobby.png`
- Create: `docs/screenshots/bomb.png`
- Create: `docs/screenshots/result.png`

- [ ] **Step 1：在鸿蒙模拟器或真机跑起应用**

按 Task 6.6 的流程进入首页 → 大厅 → 炸弹（游戏进行中） → 结算。

- [ ] **Step 2：抓屏并裁剪**

鸿蒙模拟器：菜单栏 → Screenshot。
真机：电源 + 音量下。

每张裁剪到 1080×2340（或维持原比例），压缩到 <500KB。

保存到 `docs/screenshots/*.png`。

- [ ] **Step 3：打开 README.md 人工确认图片加载正常**

- [ ] **Step 4：提交**

```bash
git add docs/screenshots/
git commit -m "docs: 4 张核心界面截图（home/lobby/bomb/result）"
```

---

### Task 6.10：CHANGELOG + 版本 Tag

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1：写入 CHANGELOG**

```markdown
# CHANGELOG

## v1.0.0 — 2026-04-19

首发版本。

### 功能
- 5 款完整可玩小游戏：摇一摇赛马 / 定时炸弹 / 鳄鱼拔牙 / 同屏反应大比拼 / 指尖大轮盘。
- 本地惩罚库：25 条内置 + 用户自定义增删改 + 启停开关。
- 双主题：Q 版卡通 / 霓虹电玩，首次启动引导，设置内切换。
- 音效 / 振动 / 屏幕常亮 / 单机共玩交互。
- 完整本地持久化（settings · punishments · hasOnboarded · lastSession）。

### 兼容性
- HarmonyOS NEXT 6.x
- 未适配 iOS / Android / H5 / 小程序（留有架构口）。

### 已知限制
- 见 `docs/superpowers/e2e-log.md` 的"已知差距"段。
```

- [ ] **Step 2：提交**

```bash
git add CHANGELOG.md
git commit -m "docs: CHANGELOG v1.0.0"
```

- [ ] **Step 3：打 Tag**

```bash
git tag -a v1.0.0 -m "首发 · 5 款游戏 + 双主题 + 惩罚库"
git log --oneline -3
git tag --list | tail -1
```

Expected：最后一行显示 `v1.0.0`。

> 注：`git push --tags` 属于对远端的写操作，默认不要自动执行；等工程师确认后再推。

---

### Task 6.11：最终回归 + plan 收尾

**Files:** 无修改

- [ ] **Step 1：全量测试 + 覆盖率**

Run: `pnpm test -- --coverage`
Expected: 全绿；`games/*` 覆盖 >80%。

- [ ] **Step 2：检查未 commit 的变更**

Run: `git status`
Expected: working tree clean。

- [ ] **Step 3：在 `docs/superpowers/e2e-log.md` 末尾追加"收尾状态"段**

```markdown
## 收尾状态（Phase 6 完成）

- 所有 T1–T7 已执行。
- Sev-1 / Sev-2 已修复并合并。
- 版本 v1.0.0 打 Tag。
- 准备进入发版流程（应用市场提审为后续运维任务，不在本 plan 范围）。
```

- [ ] **Step 4：提交并 tag**

```bash
git add docs/superpowers/e2e-log.md
git commit -m "docs(e2e): 收尾状态与 v1.0.0 发版准备"
git tag -f v1.0.0
```

---

## 最终验收清单

完成全部任务后，检查以下项应全部满足：

- [ ] `pnpm test` 全绿，关键 store / logic 覆盖率 >80%。
- [ ] `theme/tokens.ts` 含 15 个 token（含 warn/urgent/armedBg/signalBg/emojiShadow），两套主题完整。
- [ ] 5 款游戏页、结算页、引导页、设置页、管理页的关键颜色均以 `computed` + `:style` 响应式绑定，不再依赖 UVue 的 `var(--x)` fallback。
- [ ] `static/sound/` 有 8 个 CC0 mp3 文件；`static/sound/README.md` 记录每个文件的来源与许可。
- [ ] `pages.json` 首项为 `pages/onboarding/index`；`pages/spike/index` 已删除。
- [ ] `manifest.json` 的 `app-harmony.distribute.icons` 已指向 `static/icons/` 三档 png；VIBRATE 权限保留。
- [ ] `docs/superpowers/e2e-log.md` 的 T1–T7 全部有明确结果（通过 / 修复 / 已知差距）。
- [ ] `README.md` 有玩法、双主题、截图、打包、架构索引 5 段。
- [ ] `CHANGELOG.md` 有 v1.0.0 条目。
- [ ] Git tag `v1.0.0` 已打。
