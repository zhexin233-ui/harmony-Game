# 鸿蒙派对小游戏 · 实施计划 1（Phase 0-1：Spike + 骨架）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 4 项原生能力的 Spike 验证，搭建鸿蒙派对小游戏的基础骨架（路由、主题系统、Pinia Store、核心页面占位），产出可在鸿蒙 6 真机启动、能切换主题、能走通"首页 → 选人 → 大厅 → 占位游戏 → 占位结算"流程的应用。

**Architecture:** 基于 uni-app x（Vue 3 + UVue + UTS），编译到鸿蒙 6（HarmonyOS NEXT）。主题通过 Pinia Store 管理并应用 CSS 变量到应用根节点。每个游戏后续会有独立的 `logic.ts` 纯逻辑 + `pages/game/<id>/index.uvue` 视图，本 plan 只铺占位页。所有原生能力（加速度/振动/音效/多指触控）统一封装在 `src/native/`，遵循 `settings` 中的开关配置。

**Tech Stack:** uni-app x 3.98+, UVue, Vue 3, TypeScript（strict）, Pinia, Vitest, 鸿蒙 HarmonyOS NEXT SDK

**Spec 引用：** `docs/superpowers/specs/2026-04-18-party-games-design.md`

**范围 · Plan 1 包含：**
- Phase 0：4 项原生能力的 Spike 页面 + 统一封装。
- Phase 1：项目骨架 · 主题系统 · Pinia Store · 首启引导 · 首页 · 设置页 · 人数选择 · 玩家名字 · 游戏大厅 · 占位游戏页 · 占位结算页 · 占位惩罚规则入口。

**范围 · Plan 1 不包含（留待 Plan 2 及以后）：**
- 5 款游戏的 `logic.ts` 真实逻辑与单测。
- 5 款游戏的正式 UI（炸弹/鳄鱼/赛马/反应/轮盘）。
- 惩罚规则库管理页的完整实现与内置数据。
- 正式插画素材与完整音效资源包（Plan 1 仅用临时占位）。

---

## 文件结构

本计划创建或修改以下文件。每个文件职责单一、可独立测试。

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `package.json` | 修改 | 声明依赖（pinia / vitest） |
| `pages.json` | 修改 | uni-app 页面路由与全局样式 |
| `manifest.json` | 修改 | 声明鸿蒙权限 `ohos.permission.VIBRATE` |
| `tsconfig.json` | 修改 | 开启 strict |
| `vitest.config.ts` | 创建 | Vitest 配置 |
| `src/app.uvue` | 创建 | 应用根（挂载 pinia、初始化主题、路由守卫） |
| `src/main.ts` | 创建 | 入口，创建 app 实例、注册 pinia |
| `src/theme/tokens.ts` | 创建 | Q 版 / 霓虹 两套主题 Token |
| `src/theme/apply.ts` | 创建 | 把 Token 应用为 CSS 变量 |
| `src/stores/settings.ts` | 创建 | 主题 / 音效 / 振动 / hasOnboarded |
| `src/stores/session.ts` | 创建 | 当前游戏会话（人数、名字、输家、惩罚） |
| `src/native/vibrator.ts` | 创建 | 振动统一封装（遵循 settings） |
| `src/native/audio.ts` | 创建 | 音效播放池化封装 |
| `src/native/sensor.ts` | 创建 | 加速度传感器订阅封装 |
| `src/native/screen.ts` | 创建 | 屏幕常亮控制 |
| `src/native/multitouch.ts` | 创建 | 多指触控工具函数 |
| `src/pages/spike/index.uvue` | 创建 | Spike 页：4 项能力验证入口 |
| `src/pages/onboarding/index.uvue` | 创建 | 首启主题引导 |
| `src/pages/home/index.uvue` | 创建 | 首页 |
| `src/pages/settings/index.uvue` | 创建 | 设置页 |
| `src/pages/lobby/player-count.uvue` | 创建 | 人数选择 |
| `src/pages/lobby/player-names.uvue` | 创建 | 玩家名字（可跳过） |
| `src/pages/lobby/games.uvue` | 创建 | 游戏大厅（两分类 + 人数过滤） |
| `src/pages/game/placeholder.uvue` | 创建 | 游戏占位页（通过 query 区分 5 款） |
| `src/pages/game/result.uvue` | 创建 | 结算占位页 |
| `src/pages/punishment/index.uvue` | 创建 | 惩罚规则占位页（只显示"即将上线"） |
| `src/components/AppButton.uvue` | 创建 | 主题化按钮 |
| `src/components/GameTile.uvue` | 创建 | 游戏卡片（支持置灰状态） |
| `tests/stores/settings.test.ts` | 创建 | Settings Store 单测 |
| `tests/stores/session.test.ts` | 创建 | Session Store 单测 |
| `tests/theme/tokens.test.ts` | 创建 | 主题 Token 单测 |
| `tests/setup.ts` | 创建 | Vitest setup（mock uni.storage） |

---

## 前置准备（由开发者在本地一次性完成）

1. 安装 **HBuilderX 3.98+**（uni-app x 官方推荐，下载：https://www.dcloud.io/hbuilderx.html ）。
2. 安装 **DevEco Studio 5+** 并配置 **HarmonyOS NEXT SDK**。
3. 准备一台运行 **HarmonyOS NEXT / 鸿蒙 6** 的真机或模拟器。
4. Node.js 18+、pnpm 9+（`npm i -g pnpm@9`）。
5. 在 HBuilderX 中完成鸿蒙编译配置（Manifest.json → App 基础配置 → 应用标识 → 鸿蒙签名）。

---

## Phase 0 · 可行性 Spike

> 目标：用一个极简 Spike 页面验证 uni-app x 在鸿蒙 6 上能否调用 4 项必需的原生能力。若任一能力不可用，停下来讨论替代方案（UTS 插件、原生 ArkTS 模块）后再进入 Phase 1。

### Task 0.1 · 初始化 uni-app x 项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `manifest.json`
- Create: `pages.json`
- Create: `src/app.uvue`
- Create: `src/main.ts`
- Create: `src/pages/spike/index.uvue`

- [ ] **Step 1: 在 HBuilderX 中新建 uni-app x 项目**

在 HBuilderX：`文件 → 新建 → 项目 → uni-app x → 默认模板`。项目名填 `hwgame-seed`，位置选择 `/tmp/`（避免覆盖当前目录）。创建完成后，将 `/tmp/hwgame-seed/` 下的所有文件复制到 `/Users/zhexin/github/hwgame/`（除 `.git/` 外）。

也可用 CLI：
```bash
cd /tmp && npx @dcloudio/uvm create hwgame-seed --template uni-app-x
```

- [ ] **Step 2: 切换到 pnpm**

```bash
cd /Users/zhexin/github/hwgame
rm -rf node_modules yarn.lock package-lock.json
pnpm install
```
Expected: `node_modules/` 生成，无错误。

- [ ] **Step 3: 在 `manifest.json` 中声明鸿蒙权限**

打开 `manifest.json` 的 `"app-harmony"` 节点，加入 `requestPermissions`：
```json
"app-harmony": {
  "distribute": {
    "requestPermissions": [
      { "name": "ohos.permission.VIBRATE" }
    ]
  }
}
```

- [ ] **Step 4: 验证启动编译**

在 HBuilderX 中点击 `运行 → 运行到手机或模拟器 → 鸿蒙`。
Expected: 真机启动，默认模板页面可见（白屏带 "Hello uni-app x"）。

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json manifest.json pages.json src/
git commit -m "feat(scaffold): 初始化 uni-app x 项目骨架"
```

---

### Task 0.2 · 创建 Spike 页入口

**Files:**
- Create: `src/pages/spike/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建 Spike 页骨架**

写入 `src/pages/spike/index.uvue`：
```vue
<template>
  <view class="container">
    <text class="title">原生能力 Spike</text>
    <button class="btn" @click="testVibrate">1. 测试振动</button>
    <button class="btn" @click="testAudio">2. 测试音效</button>
    <button class="btn" @click="testSensor">3. 测试加速度传感器</button>
    <button class="btn" @click="testMultitouch">4. 测试多指触控（下滑）</button>
    <text class="log">{{ log }}</text>
    <view class="touch-area" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <text>触控区（按手指）</text>
      <text>当前触点数：{{ touchCount }}</text>
    </view>
  </view>
</template>

<script setup lang="uts">
const log = ref('（等待操作）')
const touchCount = ref(0)

function testVibrate() { log.value = '见 Task 0.3' }
function testAudio() { log.value = '见 Task 0.4' }
function testSensor() { log.value = '见 Task 0.5' }
function testMultitouch() { log.value = '请在下方区域多指触摸' }
function onTouchStart(e: TouchEvent) { touchCount.value = e.touches.length }
function onTouchMove(e: TouchEvent) { touchCount.value = e.touches.length }
function onTouchEnd(e: TouchEvent) { touchCount.value = e.touches.length }
</script>

<style>
.container { padding: 24px; }
.title { font-size: 22px; font-weight: bold; margin-bottom: 16px; }
.btn { margin-top: 8px; }
.log { margin-top: 16px; color: #555; }
.touch-area { margin-top: 16px; height: 200px; background: #eee; justify-content: center; align-items: center; }
</style>
```

- [ ] **Step 2: 在 `pages.json` 中注册 Spike 页并设为首页**

编辑 `pages.json`，`pages` 数组中改为：
```json
"pages": [
  {
    "path": "pages/spike/index",
    "style": { "navigationBarTitleText": "Spike" }
  }
]
```

- [ ] **Step 3: 真机验证**

在 HBuilderX 运行到鸿蒙真机。
Expected: 启动后显示 Spike 页，下方触控区可以看到触点数随手指变化（至少能识别 2-5 根）。

- [ ] **Step 4: Commit**

```bash
git add src/pages/spike/ pages.json
git commit -m "feat(spike): 新建 Spike 页入口与多指触控验证"
```

---

### Task 0.3 · Spike 验证振动能力

**Files:**
- Modify: `src/pages/spike/index.uvue`

- [ ] **Step 1: 在 `testVibrate` 中调用 uni 振动 API**

将 `testVibrate` 实现为：
```ts
function testVibrate() {
  try {
    uni.vibrateShort({
      success: () => { log.value = '振动 短：成功' },
      fail: (err) => { log.value = '振动 短：失败 ' + JSON.stringify(err) }
    })
    setTimeout(() => {
      uni.vibrateLong({
        success: () => { log.value += ' / 长：成功' },
        fail: (err) => { log.value += ' / 长：失败 ' + JSON.stringify(err) }
      })
    }, 500)
  } catch (e) {
    log.value = '异常：' + (e as Error).message
  }
}
```

- [ ] **Step 2: 真机验证**

在真机上点击"测试振动"。
Expected: 真机先短振一次（约 15ms），0.5 秒后长振一次（约 400ms），日志显示 `振动 短：成功 / 长：成功`。

- [ ] **Step 3: 记录验证结果**

若失败，记录具体错误信息，写入新文件 `docs/superpowers/specs/2026-04-19-spike-report.md` 的"振动"小节（文件稍后任务合并创建）。

- [ ] **Step 4: Commit**

```bash
git add src/pages/spike/index.uvue
git commit -m "feat(spike): 验证振动 API"
```

---

### Task 0.4 · Spike 验证音效能力

**Files:**
- Create: `src/static/sound/click.mp3`（占位音效）
- Modify: `src/pages/spike/index.uvue`

- [ ] **Step 1: 准备占位音效资源**

从 https://freesound.org/ 下载一个 100-300ms 的短按钮音效（CC0 许可），重命名为 `click.mp3`，放到 `src/static/sound/click.mp3`。

- [ ] **Step 2: 实现 `testAudio`**

在 `src/pages/spike/index.uvue` 的 `<script>` 中添加音效播放逻辑：
```ts
function testAudio() {
  try {
    const ctx = uni.createInnerAudioContext()
    ctx.src = '/static/sound/click.mp3'
    ctx.onPlay(() => { log.value = '音效：开始播放' })
    ctx.onEnded(() => { log.value = '音效：播放结束' })
    ctx.onError((err) => { log.value = '音效：错误 ' + JSON.stringify(err) })
    ctx.play()
  } catch (e) {
    log.value = '音效异常：' + (e as Error).message
  }
}
```

- [ ] **Step 3: 真机验证**

点击"测试音效"。
Expected: 真机能听到点击音效，日志依次显示"开始播放 → 播放结束"。

- [ ] **Step 4: Commit**

```bash
git add src/static/sound/click.mp3 src/pages/spike/index.uvue
git commit -m "feat(spike): 验证音效 API"
```

---

### Task 0.5 · Spike 验证加速度传感器

**Files:**
- Modify: `src/pages/spike/index.uvue`

- [ ] **Step 1: 实现 `testSensor`**

在 `src/pages/spike/index.uvue` 的 `<script>` 中：
```ts
let sampleCount = 0
let peakMagnitude = 0

function testSensor() {
  sampleCount = 0
  peakMagnitude = 0
  log.value = '传感器：订阅中，请摇手机 3 秒...'
  uni.startAccelerometer({ interval: 'game' })
  uni.onAccelerometerChange((res) => {
    sampleCount++
    const mag = Math.sqrt(res.x * res.x + res.y * res.y + res.z * res.z)
    if (mag > peakMagnitude) peakMagnitude = mag
  })
  setTimeout(() => {
    uni.stopAccelerometer({})
    uni.offAccelerometerChange()
    log.value = `传感器：3 秒内采样 ${sampleCount} 次，峰值 ${peakMagnitude.toFixed(2)}`
  }, 3000)
}
```

- [ ] **Step 2: 真机验证**

点击"测试加速度"，在 3 秒内用力摇动手机。
Expected: 日志最终显示 `3 秒内采样 ≥ 30 次，峰值 ≥ 3.0`（静止时峰值约 1.0，因重力为 g ≈ 9.8 / 9.8 = 1.0；晃动时显著超过）。

- [ ] **Step 3: Commit**

```bash
git add src/pages/spike/index.uvue
git commit -m "feat(spike): 验证加速度传感器 API"
```

---

### Task 0.6 · 多指触控压力测试

**Files:**
- Modify: `src/pages/spike/index.uvue`

- [ ] **Step 1: 记录峰值触点数**

修改 Spike 页触控区逻辑，展示历史峰值：
```ts
const touchCount = ref(0)
const peakTouchCount = ref(0)
function onTouchStart(e: TouchEvent) {
  touchCount.value = e.touches.length
  if (touchCount.value > peakTouchCount.value) peakTouchCount.value = touchCount.value
}
function onTouchMove(e: TouchEvent) {
  touchCount.value = e.touches.length
  if (touchCount.value > peakTouchCount.value) peakTouchCount.value = touchCount.value
}
function onTouchEnd(e: TouchEvent) {
  touchCount.value = e.touches.length
}
```
在 `<template>` 触控区内加一行：
```html
<text>峰值触点数：{{ peakTouchCount }}</text>
```

- [ ] **Step 2: 真机验证**

同时把 5 根手指按在触控区。
Expected: 峰值触点数显示 ≥ 5。

- [ ] **Step 3: Commit**

```bash
git add src/pages/spike/index.uvue
git commit -m "feat(spike): 多指触控峰值记录"
```

---

### Task 0.7 · 输出 Spike 报告

**Files:**
- Create: `docs/superpowers/specs/2026-04-19-spike-report.md`

- [ ] **Step 1: 写入报告**

创建 `docs/superpowers/specs/2026-04-19-spike-report.md`：
```markdown
# 原生能力 Spike 报告

- 日期：2026-04-19
- 真机型号：<填写>
- 鸿蒙版本：<填写>
- uni-app x 版本：<填写>

## 结果

| 能力 | API | 结果 | 备注 |
|---|---|---|---|
| 振动（短/长） | uni.vibrateShort / uni.vibrateLong | ✅ / ❌ | |
| 音效播放 | uni.createInnerAudioContext | ✅ / ❌ | 首次播放延迟：<ms> |
| 加速度传感器 | uni.startAccelerometer / uni.onAccelerometerChange | ✅ / ❌ | 3 秒采样次数 / 峰值 |
| 多指触控 | UVue touchstart/move/end | ✅ / ❌ | 峰值触点数 |

## 结论

- 进入 Phase 1：<是 / 否>
- 如有失败项，替代方案：<写 UTS 插件 / 原生 ArkTS 模块>
```

- [ ] **Step 2: 填写真机验证结果**

开发者根据 Task 0.3-0.6 的结果填充报告。若任一 ❌，暂停并与产品讨论替代方案。

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-19-spike-report.md
git commit -m "docs: 新增 Spike 结果报告"
```

---

## Phase 1 · 骨架

> 目标：搭建可被 Plan 2 继续填充的骨架：主题、Store、路由、核心页面占位。

### Task 1.1 · 安装依赖与目录结构

**Files:**
- Modify: `package.json`
- Create: 空目录 `src/stores/`, `src/theme/`, `src/native/`, `src/games/`, `src/components/`, `src/utils/`, `src/data/`, `tests/`

- [ ] **Step 1: 安装运行时和测试依赖**

```bash
cd /Users/zhexin/github/hwgame
pnpm add pinia
pnpm add -D vitest @vitest/ui @types/node typescript
```

- [ ] **Step 2: 创建目录结构（用 `.gitkeep` 占位）**

对以下每个目录创建 `.gitkeep` 文件（用 Write 工具或手动）：
```
src/stores/.gitkeep
src/theme/.gitkeep
src/native/.gitkeep
src/games/.gitkeep
src/components/.gitkeep
src/utils/.gitkeep
src/data/.gitkeep
tests/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml src/stores src/theme src/native src/games src/components src/utils src/data tests
git commit -m "chore: 安装 pinia/vitest，建立目录骨架"
```

---

### Task 1.2 · Vitest 配置

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: 写 Vitest 配置**

创建 `vitest.config.ts`：
```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.uvue', 'src/main.ts']
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

- [ ] **Step 2: 写 Vitest setup（mock uni.storage）**

创建 `tests/setup.ts`：
```ts
import { vi, beforeEach } from 'vitest'

// mock uni 全局对象（只覆盖本仓库用到的 API）
const storageMap = new Map<string, unknown>()

;(globalThis as any).uni = {
  setStorageSync(key: string, value: unknown) { storageMap.set(key, value) },
  getStorageSync(key: string) { return storageMap.get(key) ?? '' },
  removeStorageSync(key: string) { storageMap.delete(key) },
  vibrateShort: vi.fn(),
  vibrateLong: vi.fn(),
  createInnerAudioContext: vi.fn(() => ({
    play: vi.fn(), stop: vi.fn(),
    onPlay: vi.fn(), onEnded: vi.fn(), onError: vi.fn(),
    src: ''
  })),
  startAccelerometer: vi.fn(),
  stopAccelerometer: vi.fn(),
  onAccelerometerChange: vi.fn(),
  offAccelerometerChange: vi.fn(),
  setKeepScreenOn: vi.fn()
}

beforeEach(() => { storageMap.clear() })
```

- [ ] **Step 3: 在 `package.json` 加测试脚本**

将 `package.json` 的 `"scripts"` 中加入：
```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 4: 跑一次空测试验证配置**

```bash
pnpm test
```
Expected: `No test files found` 退出码为 0（或 1，但不报配置错误）。

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json
git commit -m "chore: 配置 Vitest 与 uni.storage mock"
```

---

### Task 1.3 · 主题 Token 定义

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `tests/theme/tokens.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/theme/tokens.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { themes, type Theme } from '@/theme/tokens'

describe('themes', () => {
  it('包含 cartoon 与 neon 两套主题', () => {
    expect(Object.keys(themes)).toEqual(['cartoon', 'neon'])
  })

  it('每套主题都有必需的 token', () => {
    const required = ['bg', 'primary', 'secondary', 'text', 'textMuted', 'success', 'danger', 'glow'] as const
    ;(['cartoon', 'neon'] as Theme[]).forEach(t => {
      required.forEach(k => {
        expect(themes[t]).toHaveProperty(k)
        expect(typeof themes[t][k]).toBe('string')
      })
    })
  })

  it('neon 主题不包含紫色', () => {
    const values = Object.values(themes.neon).join(' ').toLowerCase()
    expect(values).not.toMatch(/#302b63|#8b5cf6|#6a0dad/)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/theme/tokens.test.ts
```
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 实现 Token**

创建 `src/theme/tokens.ts`：
```ts
export type Theme = 'cartoon' | 'neon'

export type ThemeTokens = {
  bg: string          // 背景渐变色起点
  bgEnd: string       // 背景渐变色终点
  primary: string
  secondary: string
  accent: string
  text: string
  textMuted: string
  success: string
  danger: string
  glow: string        // 发光阴影色（仅 neon 非空）
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
    glow: 'transparent'
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
    glow: 'rgba(0, 212, 255, 0.5)'
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/theme/tokens.test.ts
```
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/theme/tokens.ts tests/theme/tokens.test.ts
git commit -m "feat(theme): 定义 Q 版/霓虹双主题 Token"
```

---

### Task 1.4 · 主题应用函数

**Files:**
- Create: `src/theme/apply.ts`
- Create: `tests/theme/apply.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/theme/apply.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, tokenToCssVar } from '@/theme/apply'
import { themes } from '@/theme/tokens'

describe('tokenToCssVar', () => {
  it('把驼峰 key 转为 --kebab-case', () => {
    expect(tokenToCssVar('textMuted')).toBe('--text-muted')
    expect(tokenToCssVar('bg')).toBe('--bg')
  })
})

describe('applyTheme', () => {
  let recorded: Record<string, string>
  const fakeRoot = {
    style: {
      setProperty(name: string, value: string) { recorded[name] = value }
    }
  }

  beforeEach(() => { recorded = {} })

  it('把 cartoon 主题全部 token 写入 CSS 变量', () => {
    applyTheme('cartoon', fakeRoot as unknown as HTMLElement)
    Object.entries(themes.cartoon).forEach(([key, value]) => {
      expect(recorded[tokenToCssVar(key)]).toBe(value)
    })
  })

  it('把 neon 主题全部 token 写入 CSS 变量', () => {
    applyTheme('neon', fakeRoot as unknown as HTMLElement)
    Object.entries(themes.neon).forEach(([key, value]) => {
      expect(recorded[tokenToCssVar(key)]).toBe(value)
    })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/theme/apply.test.ts
```
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 apply**

创建 `src/theme/apply.ts`：
```ts
import { themes, type Theme } from './tokens'

export function tokenToCssVar(key: string): string {
  return '--' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
}

export function applyTheme(theme: Theme, root: HTMLElement): void {
  const tokens = themes[theme]
  for (const key in tokens) {
    const value = (tokens as unknown as Record<string, string>)[key]
    root.style.setProperty(tokenToCssVar(key), value)
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/theme/apply.test.ts
```
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/theme/apply.ts tests/theme/apply.test.ts
git commit -m "feat(theme): 主题应用函数（写 CSS 变量）"
```

---

### Task 1.5 · Settings Store

**Files:**
- Create: `src/stores/settings.ts`
- Create: `tests/stores/settings.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/stores/settings.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'

describe('useSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('在未持久化时给出默认值', () => {
    const s = useSettings()
    s.load()
    expect(s.theme).toBe('cartoon')
    expect(s.soundEnabled).toBe(true)
    expect(s.vibrationEnabled).toBe(true)
    expect(s.hasOnboarded).toBe(false)
  })

  it('setTheme 会同步写 storage', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => { written[k] = v }
    const s = useSettings()
    s.setTheme('neon')
    expect(s.theme).toBe('neon')
    expect(written['settings']).toEqual(expect.objectContaining({ theme: 'neon' }))
  })

  it('toggleSound 会翻转并持久化', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => { written[k] = v }
    const s = useSettings()
    s.toggleSound()
    expect(s.soundEnabled).toBe(false)
    expect((written['settings'] as any).soundEnabled).toBe(false)
  })

  it('markOnboarded 会设置标记并持久化', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => { written[k] = v }
    const s = useSettings()
    s.markOnboarded()
    expect(s.hasOnboarded).toBe(true)
    expect(written['hasOnboarded']).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/stores/settings.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 实现 Store**

创建 `src/stores/settings.ts`：
```ts
import { defineStore } from 'pinia'
import type { Theme } from '@/theme/tokens'

export type Settings = {
  theme: Theme
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'cartoon',
  soundEnabled: true,
  vibrationEnabled: true
}

export const useSettings = defineStore('settings', {
  state: () => ({
    ...DEFAULT_SETTINGS,
    hasOnboarded: false
  }),
  actions: {
    load() {
      const raw = uni.getStorageSync('settings')
      if (raw && typeof raw === 'object') {
        const s = raw as Partial<Settings>
        if (s.theme === 'cartoon' || s.theme === 'neon') this.theme = s.theme
        if (typeof s.soundEnabled === 'boolean') this.soundEnabled = s.soundEnabled
        if (typeof s.vibrationEnabled === 'boolean') this.vibrationEnabled = s.vibrationEnabled
      }
      const onboarded = uni.getStorageSync('hasOnboarded')
      this.hasOnboarded = onboarded === true
    },
    persist() {
      uni.setStorageSync('settings', {
        theme: this.theme,
        soundEnabled: this.soundEnabled,
        vibrationEnabled: this.vibrationEnabled
      })
    },
    setTheme(theme: Theme) {
      this.theme = theme
      this.persist()
    },
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.persist()
    },
    toggleVibration() {
      this.vibrationEnabled = !this.vibrationEnabled
      this.persist()
    },
    markOnboarded() {
      this.hasOnboarded = true
      uni.setStorageSync('hasOnboarded', true)
    }
  }
})
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/stores/settings.test.ts
```
Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/stores/settings.ts tests/stores/settings.test.ts
git commit -m "feat(stores): 新增 Settings Store（主题/音效/振动/引导标记）"
```

---

### Task 1.6 · Session Store

**Files:**
- Create: `src/stores/session.ts`
- Create: `tests/stores/session.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/stores/session.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSession } from '@/stores/session'

describe('useSession', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('setPlayers 存储人数与名字', () => {
    const s = useSession()
    s.setPlayers(4, ['A', 'B', 'C', 'D'])
    expect(s.playerCount).toBe(4)
    expect(s.playerNames).toEqual(['A', 'B', 'C', 'D'])
  })

  it('setPlayers 不传名字时存 undefined', () => {
    const s = useSession()
    s.setPlayers(3)
    expect(s.playerCount).toBe(3)
    expect(s.playerNames).toBeUndefined()
  })

  it('displayNameOf 有名字时返回名字', () => {
    const s = useSession()
    s.setPlayers(3, ['小红', '小明', '小刚'])
    expect(s.displayNameOf(0)).toBe('小红')
  })

  it('displayNameOf 无名字时返回“玩家 N”', () => {
    const s = useSession()
    s.setPlayers(3)
    expect(s.displayNameOf(0)).toBe('玩家 1')
    expect(s.displayNameOf(2)).toBe('玩家 3')
  })

  it('restartGame 清空 loser / picked，保留人数与当前游戏', () => {
    const s = useSession()
    s.setPlayers(4)
    s.currentGame = 'bomb'
    s.loser = 2
    s.pickedPunishmentText = '学狗叫 3 声'
    s.restartGame()
    expect(s.playerCount).toBe(4)
    expect(s.currentGame).toBe('bomb')
    expect(s.loser).toBeUndefined()
    expect(s.pickedPunishmentText).toBeUndefined()
  })

  it('exitToLobby 清 currentGame 与 loser，保留玩家信息', () => {
    const s = useSession()
    s.setPlayers(4)
    s.currentGame = 'bomb'
    s.loser = 1
    s.exitToLobby()
    expect(s.playerCount).toBe(4)
    expect(s.currentGame).toBeUndefined()
    expect(s.loser).toBeUndefined()
  })

  it('clear 完全清空', () => {
    const s = useSession()
    s.setPlayers(4, ['A','B','C','D'])
    s.currentGame = 'wheel'
    s.clear()
    expect(s.playerCount).toBe(0)
    expect(s.playerNames).toBeUndefined()
    expect(s.currentGame).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/stores/session.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 实现 Store**

创建 `src/stores/session.ts`：
```ts
import { defineStore } from 'pinia'

export type GameId = 'horse-race' | 'bomb' | 'crocodile' | 'reaction' | 'wheel'

export const useSession = defineStore('session', {
  state: () => ({
    playerCount: 0,
    playerNames: undefined as string[] | undefined,
    currentGame: undefined as GameId | undefined,
    loser: undefined as number | undefined,
    pickedPunishmentText: undefined as string | undefined
  }),
  actions: {
    setPlayers(count: number, names?: string[]) {
      this.playerCount = count
      this.playerNames = names
    },
    displayNameOf(index: number): string {
      if (this.playerNames && this.playerNames[index]) return this.playerNames[index]
      return `玩家 ${index + 1}`
    },
    restartGame() {
      this.loser = undefined
      this.pickedPunishmentText = undefined
    },
    exitToLobby() {
      this.currentGame = undefined
      this.loser = undefined
      this.pickedPunishmentText = undefined
    },
    clear() {
      this.playerCount = 0
      this.playerNames = undefined
      this.currentGame = undefined
      this.loser = undefined
      this.pickedPunishmentText = undefined
    }
  }
})
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/stores/session.test.ts
```
Expected: 7 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/stores/session.ts tests/stores/session.test.ts
git commit -m "feat(stores): 新增 Session Store（人数/名字/输家）"
```

---

### Task 1.7 · Native 封装 · Vibrator

**Files:**
- Create: `src/native/vibrator.ts`
- Create: `tests/native/vibrator.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/native/vibrator.test.ts`：
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'
import { vibrateShort, vibrateLong } from '@/native/vibrator'

describe('vibrator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.vibrateShort as any) = vi.fn()
    ;(uni.vibrateLong as any) = vi.fn()
  })

  it('settings.vibrationEnabled=false 时不调用原生 API', () => {
    const s = useSettings()
    s.vibrationEnabled = false
    vibrateShort()
    vibrateLong()
    expect(uni.vibrateShort).not.toHaveBeenCalled()
    expect(uni.vibrateLong).not.toHaveBeenCalled()
  })

  it('settings.vibrationEnabled=true 时调用原生 API', () => {
    const s = useSettings()
    s.vibrationEnabled = true
    vibrateShort()
    vibrateLong()
    expect(uni.vibrateShort).toHaveBeenCalledTimes(1)
    expect(uni.vibrateLong).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/native/vibrator.test.ts
```

- [ ] **Step 3: 实现 Vibrator**

创建 `src/native/vibrator.ts`：
```ts
import { useSettings } from '@/stores/settings'

function enabled(): boolean {
  return useSettings().vibrationEnabled
}

export function vibrateShort(): void {
  if (!enabled()) return
  try { uni.vibrateShort({ fail: () => {} }) } catch {}
}

export function vibrateLong(): void {
  if (!enabled()) return
  try { uni.vibrateLong({ fail: () => {} }) } catch {}
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/native/vibrator.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/native/vibrator.ts tests/native/vibrator.test.ts
git commit -m "feat(native): 振动封装（遵循 settings.vibrationEnabled）"
```

---

### Task 1.8 · Native 封装 · Audio

**Files:**
- Create: `src/native/audio.ts`
- Create: `tests/native/audio.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/native/audio.test.ts`：
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'
import { preload, play } from '@/native/audio'

describe('audio', () => {
  let playMock: ReturnType<typeof vi.fn>
  let factoryCalls: string[]

  beforeEach(() => {
    setActivePinia(createPinia())
    factoryCalls = []
    playMock = vi.fn()
    ;(uni.createInnerAudioContext as any) = vi.fn(() => {
      const ctx: any = { src: '', play: playMock, stop: vi.fn(), destroy: vi.fn(),
        onPlay: vi.fn(), onEnded: vi.fn(), onError: vi.fn() }
      Object.defineProperty(ctx, 'src', {
        set(v: string) { factoryCalls.push(v) },
        get() { return '' }
      })
      return ctx
    })
  })

  it('settings.soundEnabled=false 时不播放', () => {
    const s = useSettings()
    s.soundEnabled = false
    preload({ click: '/static/sound/click.mp3' })
    play('click')
    expect(playMock).not.toHaveBeenCalled()
  })

  it('settings.soundEnabled=true 时能播放预加载的音效', () => {
    const s = useSettings()
    s.soundEnabled = true
    preload({ click: '/static/sound/click.mp3' })
    play('click')
    expect(playMock).toHaveBeenCalledTimes(1)
  })

  it('播放未预加载的 id 不崩溃', () => {
    const s = useSettings()
    s.soundEnabled = true
    expect(() => play('notfound' as any)).not.toThrow()
    expect(playMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/native/audio.test.ts
```

- [ ] **Step 3: 实现 Audio**

创建 `src/native/audio.ts`：
```ts
import { useSettings } from '@/stores/settings'

type AudioCtx = ReturnType<typeof uni.createInnerAudioContext>
const pool = new Map<string, AudioCtx>()

export function preload(map: Record<string, string>): void {
  for (const id in map) {
    if (pool.has(id)) continue
    const ctx = uni.createInnerAudioContext()
    ctx.src = map[id]
    pool.set(id, ctx)
  }
}

export function play(id: string): void {
  if (!useSettings().soundEnabled) return
  const ctx = pool.get(id)
  if (!ctx) return
  try { ctx.stop(); ctx.play() } catch {}
}

export function disposeAll(): void {
  pool.forEach(ctx => { try { ctx.destroy() } catch {} })
  pool.clear()
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/native/audio.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/native/audio.ts tests/native/audio.test.ts
git commit -m "feat(native): 音效池化封装（遵循 settings.soundEnabled）"
```

---

### Task 1.9 · Native 封装 · Sensor / Screen

**Files:**
- Create: `src/native/sensor.ts`
- Create: `src/native/screen.ts`

- [ ] **Step 1: 实现加速度封装**

创建 `src/native/sensor.ts`：
```ts
export type AccelData = { x: number; y: number; z: number }
export type AccelListener = (data: AccelData) => void

let currentListener: AccelListener | null = null

export function startAccelerometer(listener: AccelListener, interval: 'game' | 'ui' | 'normal' = 'game'): void {
  currentListener = listener
  try {
    uni.startAccelerometer({ interval })
    uni.onAccelerometerChange(listener)
  } catch {}
}

export function stopAccelerometer(): void {
  try {
    if (currentListener) uni.offAccelerometerChange()
    uni.stopAccelerometer({ fail: () => {} })
  } catch {}
  currentListener = null
}
```

- [ ] **Step 2: 实现屏幕常亮封装**

创建 `src/native/screen.ts`：
```ts
export function keepAwake(): void {
  try { uni.setKeepScreenOn({ keepScreenOn: true, fail: () => {} }) } catch {}
}

export function releaseAwake(): void {
  try { uni.setKeepScreenOn({ keepScreenOn: false, fail: () => {} }) } catch {}
}
```

- [ ] **Step 3: 跑一次全部测试，确保没回归**

```bash
pnpm test
```
Expected: 之前所有测试继续通过。

- [ ] **Step 4: Commit**

```bash
git add src/native/sensor.ts src/native/screen.ts
git commit -m "feat(native): 加速度传感器与屏幕常亮封装"
```

---

### Task 1.10 · Native 封装 · MultiTouch 工具

**Files:**
- Create: `src/native/multitouch.ts`
- Create: `tests/native/multitouch.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/native/multitouch.test.ts`：
```ts
import { describe, it, expect } from 'vitest'
import { diffTouches } from '@/native/multitouch'

describe('diffTouches', () => {
  it('新增触点返回 added', () => {
    const r = diffTouches([{ id: 1, x: 0, y: 0 }], [{ id: 1, x: 0, y: 0 }, { id: 2, x: 10, y: 10 }])
    expect(r.added).toEqual([{ id: 2, x: 10, y: 10 }])
    expect(r.removed).toEqual([])
  })

  it('减少触点返回 removed', () => {
    const r = diffTouches([{ id: 1, x: 0, y: 0 }, { id: 2, x: 5, y: 5 }], [{ id: 1, x: 0, y: 0 }])
    expect(r.removed.map(t => t.id)).toEqual([2])
    expect(r.added).toEqual([])
  })

  it('完全相同返回空', () => {
    const t = [{ id: 1, x: 0, y: 0 }]
    const r = diffTouches(t, t)
    expect(r.added).toEqual([])
    expect(r.removed).toEqual([])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/native/multitouch.test.ts
```

- [ ] **Step 3: 实现 multitouch**

创建 `src/native/multitouch.ts`：
```ts
export type TouchPoint = { id: number; x: number; y: number }

export function diffTouches(prev: TouchPoint[], next: TouchPoint[]): { added: TouchPoint[]; removed: TouchPoint[] } {
  const prevIds = new Set(prev.map(t => t.id))
  const nextIds = new Set(next.map(t => t.id))
  return {
    added: next.filter(t => !prevIds.has(t.id)),
    removed: prev.filter(t => !nextIds.has(t.id))
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/native/multitouch.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/native/multitouch.ts tests/native/multitouch.test.ts
git commit -m "feat(native): 多指触控 diff 工具函数"
```

---

### Task 1.11 · 全局样式与根组件（主题挂载）

**Files:**
- Create: `src/main.ts`
- Create: `src/app.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 写 `src/main.ts`**

```ts
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.uvue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return { app }
}
```

- [ ] **Step 2: 写 `src/app.uvue`**

```vue
<script setup lang="uts">
import { onLaunch } from '@dcloudio/uni-app'
import { useSettings } from '@/stores/settings'
import { applyTheme } from '@/theme/apply'

onLaunch(() => {
  const settings = useSettings()
  settings.load()
  // 根节点应用主题：鸿蒙 UVue 通过 data 属性驱动 CSS 选择器
  // 若 UVue 暂不支持 document.documentElement，改由组件内 computed 读取 store
})
</script>

<style>
/* 全局默认样式 · 主题色通过 CSS 变量派生 */
page {
  background-color: var(--bg, #FFF5EB);
  color: var(--text, #3D2F4F);
}
</style>
```

- [ ] **Step 3: 修改 `pages.json` 全局样式**

在 `pages.json` 中加入：
```json
"globalStyle": {
  "navigationBarTitleText": "派对小游戏",
  "navigationBarBackgroundColor": "#FFFFFF",
  "backgroundColor": "#FFF5EB"
}
```

- [ ] **Step 4: 真机跑一次验证启动**

在 HBuilderX 运行到真机。
Expected: 启动进入 Spike 页（还未改首页路由），页面正常展示。

- [ ] **Step 5: Commit**

```bash
git add src/main.ts src/app.uvue pages.json
git commit -m "feat(app): 根组件挂载 pinia 并初始化 settings"
```

---

### Task 1.12 · AppButton 通用组件

**Files:**
- Create: `src/components/AppButton.uvue`

- [ ] **Step 1: 实现 AppButton**

```vue
<template>
  <view class="app-btn" :class="[variantClass, { disabled }]" @tap="onTap">
    <text class="label">{{ label }}</text>
  </view>
</template>

<script setup lang="uts">
const props = defineProps<{
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'tap'): void }>()
const variantClass = computed(() => 'variant-' + (props.variant ?? 'primary'))
function onTap() {
  if (props.disabled) return
  emit('tap')
}
</script>

<style>
.app-btn { padding: 14px 24px; border-radius: 22px; align-items: center; justify-content: center; margin-top: 8px; }
.label { color: #fff; font-size: 16px; font-weight: bold; }
.variant-primary { background-color: var(--primary, #FF6B9D); }
.variant-secondary { background-color: var(--secondary, #FFB347); }
.variant-ghost { background-color: transparent; border-width: 1px; border-color: var(--primary, #FF6B9D); }
.variant-ghost .label { color: var(--primary, #FF6B9D); }
.disabled { opacity: 0.4; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AppButton.uvue
git commit -m "feat(components): AppButton 通用按钮"
```

---

### Task 1.13 · GameTile 组件

**Files:**
- Create: `src/components/GameTile.uvue`

- [ ] **Step 1: 实现 GameTile**

```vue
<template>
  <view class="tile" :class="{ disabled }" @tap="onTap">
    <text class="emoji">{{ emoji }}</text>
    <text class="name">{{ name }}</text>
    <text v-if="hint" class="hint">{{ hint }}</text>
  </view>
</template>

<script setup lang="uts">
const props = defineProps<{
  emoji: string
  name: string
  hint?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'tap'): void }>()
function onTap() {
  if (props.disabled) return
  emit('tap')
}
</script>

<style>
.tile { flex: 1; padding: 16px; border-radius: 16px; background-color: var(--bg-end, #FFE5F1); align-items: center; margin: 6px; min-height: 110px; justify-content: center; }
.emoji { font-size: 34px; }
.name { margin-top: 6px; font-size: 14px; color: var(--text, #3D2F4F); font-weight: bold; }
.hint { margin-top: 2px; font-size: 11px; color: var(--text-muted, #7A6A87); }
.disabled { opacity: 0.4; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameTile.uvue
git commit -m "feat(components): GameTile 游戏卡片"
```

---

### Task 1.14 · 首启引导页

**Files:**
- Create: `src/pages/onboarding/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现引导页**

```vue
<template>
  <view class="container">
    <text class="title">选一个心情开始</text>
    <text class="subtitle">稍后可在设置里切换</text>
    <view class="choices">
      <view class="card cartoon" @tap="pick('cartoon')">
        <text class="emoji">🎈</text>
        <text class="name">Q 版卡通</text>
        <text class="desc">暖色 · 圆润 · 漫画感</text>
      </view>
      <view class="card neon" @tap="pick('neon')">
        <text class="emoji">⚡</text>
        <text class="name">霓虹电玩</text>
        <text class="desc">深色 · 柔光 · 赛博感</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="uts">
import { useSettings } from '@/stores/settings'
import type { Theme } from '@/theme/tokens'

const settings = useSettings()
function pick(theme: Theme) {
  settings.setTheme(theme)
  settings.markOnboarded()
  uni.reLaunch({ url: '/pages/home/index' })
}
</script>

<style>
.container { padding: 32px 20px; }
.title { font-size: 26px; font-weight: bold; text-align: center; }
.subtitle { margin-top: 8px; text-align: center; color: #777; }
.choices { margin-top: 28px; flex-direction: column; }
.card { padding: 24px; border-radius: 16px; align-items: center; margin-top: 14px; }
.cartoon { background: linear-gradient(135deg, #FFB347, #FF6B9D); }
.neon { background: linear-gradient(135deg, #0A1428, #0E1A2B); border-width: 1px; border-color: #00D4FF; }
.emoji { font-size: 44px; }
.name { margin-top: 8px; font-size: 20px; color: #fff; font-weight: bold; }
.desc { margin-top: 4px; color: rgba(255,255,255,0.85); }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组中添加：
```json
{ "path": "pages/onboarding/index", "style": { "navigationStyle": "custom" } }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/onboarding/index.uvue pages.json
git commit -m "feat(pages): 首启主题引导页"
```

---

### Task 1.15 · 首页

**Files:**
- Create: `src/pages/home/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现首页**

```vue
<template>
  <view class="container">
    <text class="logo">🎉 派对小游戏</text>
    <AppButton label="▶ 开始玩" variant="primary" @tap="goStart" />
    <AppButton label="📋 惩罚规则" variant="secondary" @tap="goPunishment" />
    <AppButton label="⚙️ 设置" variant="ghost" @tap="goSettings" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'

function goStart()      { uni.navigateTo({ url: '/pages/lobby/player-count' }) }
function goPunishment() { uni.navigateTo({ url: '/pages/punishment/index' }) }
function goSettings()   { uni.navigateTo({ url: '/pages/settings/index' }) }
</script>

<style>
.container { padding: 48px 24px; min-height: 100vh; justify-content: center; }
.logo { text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 40px; color: var(--text, #3D2F4F); }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 添加：
```json
{ "path": "pages/home/index", "style": { "navigationBarTitleText": "首页" } }
```

- [ ] **Step 3: 在 `app.uvue` 的 `onLaunch` 中做首启路由**

修改 `src/app.uvue` 的 `<script>`：
```ts
import { onLaunch } from '@dcloudio/uni-app'
import { useSettings } from '@/stores/settings'

onLaunch(() => {
  const settings = useSettings()
  settings.load()
  const target = settings.hasOnboarded ? '/pages/home/index' : '/pages/onboarding/index'
  uni.reLaunch({ url: target })
})
```

- [ ] **Step 4: 真机验证**

首次启动进入引导页，选一个主题后进入首页；再次启动直接进入首页。

- [ ] **Step 5: Commit**

```bash
git add src/pages/home/index.uvue src/app.uvue pages.json
git commit -m "feat(pages): 首页 + 首启路由跳转"
```

---

### Task 1.16 · 设置页

**Files:**
- Create: `src/pages/settings/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现设置页**

```vue
<template>
  <view class="container">
    <text class="section-title">主题</text>
    <view class="row">
      <view class="pill" :class="{ active: settings.theme === 'cartoon' }" @tap="settings.setTheme('cartoon')">
        <text>🎈 Q 版卡通</text>
      </view>
      <view class="pill" :class="{ active: settings.theme === 'neon' }" @tap="settings.setTheme('neon')">
        <text>⚡ 霓虹电玩</text>
      </view>
    </view>

    <text class="section-title">音效</text>
    <view class="row between">
      <text>音效</text>
      <switch :checked="settings.soundEnabled" @change="settings.toggleSound" />
    </view>

    <text class="section-title">振动</text>
    <view class="row between">
      <text>振动</text>
      <switch :checked="settings.vibrationEnabled" @change="settings.toggleVibration" />
    </view>

    <text class="section-title">关于</text>
    <text class="about">派对小游戏 v0.1.0 · 2026</text>
  </view>
</template>

<script setup lang="uts">
import { useSettings } from '@/stores/settings'
const settings = useSettings()
</script>

<style>
.container { padding: 24px; }
.section-title { font-size: 14px; color: var(--text-muted, #7A6A87); margin-top: 18px; margin-bottom: 8px; }
.row { flex-direction: row; }
.row.between { justify-content: space-between; align-items: center; padding: 12px 0; }
.pill { padding: 10px 18px; border-radius: 18px; background: var(--bg-end, #FFE5F1); margin-right: 8px; }
.pill.active { background: var(--primary, #FF6B9D); }
.about { color: var(--text-muted, #7A6A87); }
</style>
```

- [ ] **Step 2: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/settings/index", "style": { "navigationBarTitleText": "设置" } }
```

- [ ] **Step 3: 真机验证**

从首页进入设置，切换两个主题、翻转音效/振动开关，退出重进验证持久化。

- [ ] **Step 4: Commit**

```bash
git add src/pages/settings/index.uvue pages.json
git commit -m "feat(pages): 设置页（主题/音效/振动）"
```

---

### Task 1.17 · 人数选择页

**Files:**
- Create: `src/pages/lobby/player-count.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现**

```vue
<template>
  <view class="container">
    <text class="title">有几个人玩？</text>
    <view class="grid">
      <view v-for="n in counts" :key="n" class="num" :class="{ active: picked === n }" @tap="picked = n">
        <text>{{ n }}</text>
      </view>
    </view>
    <AppButton label="下一步 · 可选输入名字" variant="primary" :disabled="picked === 0" @tap="next" />
    <AppButton label="跳过名字 · 直接进大厅" variant="ghost" :disabled="picked === 0" @tap="skip" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'
import { useSession } from '@/stores/session'

const counts = [2, 3, 4, 5, 6, 7, 8]
const picked = ref(0)
const session = useSession()

function next() {
  session.setPlayers(picked.value)
  uni.navigateTo({ url: `/pages/lobby/player-names?count=${picked.value}` })
}
function skip() {
  session.setPlayers(picked.value)
  uni.navigateTo({ url: '/pages/lobby/games' })
}
</script>

<style>
.container { padding: 24px; }
.title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 24px; }
.grid { flex-direction: row; flex-wrap: wrap; justify-content: center; margin-bottom: 24px; }
.num { width: 56px; height: 56px; border-radius: 28px; margin: 6px; justify-content: center; align-items: center; background: var(--bg-end, #FFE5F1); }
.num.active { background: var(--primary, #FF6B9D); }
</style>
```

- [ ] **Step 2: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/lobby/player-count", "style": { "navigationBarTitleText": "人数" } }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/lobby/player-count.uvue pages.json
git commit -m "feat(pages): 人数选择页"
```

---

### Task 1.18 · 玩家名字页

**Files:**
- Create: `src/pages/lobby/player-names.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现**

```vue
<template>
  <view class="container">
    <text class="title">输入玩家名字（可跳过）</text>
    <view v-for="(_, i) in count" :key="i" class="row">
      <text class="label">玩家 {{ i + 1 }}</text>
      <input class="input" v-model="names[i]" :placeholder="'玩家 ' + (i + 1)" />
    </view>
    <AppButton label="确认 · 进入大厅" variant="primary" @tap="confirm" />
    <AppButton label="跳过" variant="ghost" @tap="skip" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'
import { useSession } from '@/stores/session'
import { onLoad } from '@dcloudio/uni-app'

const session = useSession()
const count = ref(0)
const names = ref<string[]>([])

onLoad((query) => {
  const n = parseInt(query?.count ?? '0', 10)
  count.value = Number.isFinite(n) ? n : session.playerCount
  names.value = Array(count.value).fill('')
})

function confirm() {
  const filled = names.value.map((v, i) => v.trim() || `玩家 ${i + 1}`)
  session.setPlayers(count.value, filled)
  uni.redirectTo({ url: '/pages/lobby/games' })
}
function skip() {
  session.setPlayers(count.value)
  uni.redirectTo({ url: '/pages/lobby/games' })
}
</script>

<style>
.container { padding: 24px; }
.title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; }
.row { flex-direction: row; align-items: center; padding: 8px 0; }
.label { width: 80px; color: var(--text-muted, #7A6A87); }
.input { flex: 1; border-bottom-width: 1px; border-bottom-color: #ddd; padding: 6px 0; }
</style>
```

- [ ] **Step 2: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/lobby/player-names", "style": { "navigationBarTitleText": "玩家名字" } }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/lobby/player-names.uvue pages.json
git commit -m "feat(pages): 玩家名字输入页"
```

---

### Task 1.19 · 游戏大厅（分类 + 人数过滤）

**Files:**
- Create: `src/pages/lobby/games.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现**

```vue
<template>
  <view class="container">
    <text class="hint">人数：{{ session.playerCount }}</text>

    <text class="category">🎲 运气派</text>
    <view class="grid">
      <GameTile v-for="g in luck" :key="g.id"
        :emoji="g.emoji" :name="g.name"
        :hint="disabledReason(g)"
        :disabled="!canPlay(g)"
        @tap="enter(g)" />
    </view>

    <text class="category">⚔️ 实力派</text>
    <view class="grid">
      <GameTile v-for="g in skill" :key="g.id"
        :emoji="g.emoji" :name="g.name"
        :hint="disabledReason(g)"
        :disabled="!canPlay(g)"
        @tap="enter(g)" />
    </view>
  </view>
</template>

<script setup lang="uts">
import GameTile from '@/components/GameTile.uvue'
import { useSession, type GameId } from '@/stores/session'

type GameMeta = { id: GameId; emoji: string; name: string; min: number; max: number }

const luck: GameMeta[] = [
  { id: 'bomb',      emoji: '💣', name: '定时炸弹',     min: 2, max: 8 },
  { id: 'crocodile', emoji: '🐊', name: '鳄鱼拔牙',     min: 2, max: 8 },
  { id: 'wheel',     emoji: '🎯', name: '指尖大轮盘',   min: 2, max: 5 }
]
const skill: GameMeta[] = [
  { id: 'horse-race', emoji: '🐎', name: '摇一摇赛马',       min: 2, max: 8 },
  { id: 'reaction',   emoji: '👆', name: '同屏反应大比拼',   min: 2, max: 5 }
]

const session = useSession()

function canPlay(g: GameMeta): boolean {
  return session.playerCount >= g.min && session.playerCount <= g.max
}
function disabledReason(g: GameMeta): string | undefined {
  if (canPlay(g)) return undefined
  if (session.playerCount > g.max) return `最多 ${g.max} 人`
  if (session.playerCount < g.min) return `至少 ${g.min} 人`
  return undefined
}
function enter(g: GameMeta) {
  if (!canPlay(g)) return
  session.currentGame = g.id
  uni.navigateTo({ url: `/pages/game/placeholder?id=${g.id}` })
}
</script>

<style>
.container { padding: 20px; }
.hint { color: var(--text-muted, #7A6A87); margin-bottom: 12px; }
.category { margin-top: 12px; font-size: 16px; font-weight: bold; color: var(--text, #3D2F4F); }
.grid { flex-direction: row; flex-wrap: wrap; margin-top: 8px; }
</style>
```

- [ ] **Step 2: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/lobby/games", "style": { "navigationBarTitleText": "选游戏" } }
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/lobby/games.uvue pages.json
git commit -m "feat(pages): 游戏大厅（分类 + 人数过滤）"
```

---

### Task 1.20 · 占位游戏页 + 占位结算页

**Files:**
- Create: `src/pages/game/placeholder.uvue`
- Create: `src/pages/game/result.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现占位游戏页**

```vue
<!-- src/pages/game/placeholder.uvue -->
<template>
  <view class="container">
    <text class="big">{{ emoji }}</text>
    <text class="title">{{ name }}</text>
    <text class="note">此游戏将在 Plan 2 中实现。</text>
    <AppButton label="🎲 模拟：随机一人输" @tap="simulateLose" />
    <AppButton label="返回大厅" variant="ghost" @tap="back" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'
import { useSession, type GameId } from '@/stores/session'
import { onLoad } from '@dcloudio/uni-app'

const session = useSession()
const emoji = ref('🎮')
const name = ref('游戏')

const meta: Record<GameId, { emoji: string; name: string }> = {
  'bomb':        { emoji: '💣', name: '定时炸弹' },
  'crocodile':   { emoji: '🐊', name: '鳄鱼拔牙' },
  'wheel':       { emoji: '🎯', name: '指尖大轮盘' },
  'horse-race':  { emoji: '🐎', name: '摇一摇赛马' },
  'reaction':    { emoji: '👆', name: '同屏反应大比拼' }
}

onLoad((query) => {
  const id = (query?.id ?? session.currentGame) as GameId | undefined
  if (id && meta[id]) {
    emoji.value = meta[id].emoji
    name.value = meta[id].name
    session.currentGame = id
  }
})

function simulateLose() {
  session.loser = Math.floor(Math.random() * session.playerCount)
  uni.navigateTo({ url: '/pages/game/result' })
}
function back() {
  session.exitToLobby()
  uni.navigateBack({})
}
</script>

<style>
.container { padding: 32px; align-items: center; }
.big { font-size: 80px; }
.title { font-size: 24px; font-weight: bold; margin-top: 12px; }
.note { color: var(--text-muted, #7A6A87); margin: 16px 0; }
</style>
```

- [ ] **Step 2: 实现占位结算页**

```vue
<!-- src/pages/game/result.uvue -->
<template>
  <view class="container">
    <text class="title">本局结果</text>
    <text class="loser">{{ loserName }} 输啦！</text>
    <view class="card">
      <text class="label">抽到的惩罚</text>
      <text class="punishment">{{ punishment }}</text>
      <text class="note">（惩罚库将在 Plan 2 接入，现为占位）</text>
    </view>
    <AppButton label="再来一局" variant="primary" @tap="restart" />
    <AppButton label="换游戏" variant="secondary" @tap="toLobby" />
    <AppButton label="回首页" variant="ghost" @tap="home" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'
import { useSession } from '@/stores/session'

const session = useSession()
const placeholders = ['学狗叫 3 声', '做 5 个俯卧撑', '表演一段绕口令', '模仿一位明星', '全桌敬酒一杯（可换饮料）']
const punishment = placeholders[Math.floor(Math.random() * placeholders.length)]
const loserName = session.loser !== undefined ? session.displayNameOf(session.loser) : '神秘玩家'

function restart() {
  session.restartGame()
  const id = session.currentGame
  if (id) uni.redirectTo({ url: `/pages/game/placeholder?id=${id}` })
}
function toLobby() {
  session.exitToLobby()
  uni.redirectTo({ url: '/pages/lobby/games' })
}
function home() {
  session.clear()
  uni.reLaunch({ url: '/pages/home/index' })
}
</script>

<style>
.container { padding: 32px; align-items: center; }
.title { font-size: 22px; margin-bottom: 12px; }
.loser { font-size: 28px; font-weight: bold; color: var(--danger, #FF6B9D); }
.card { width: 100%; padding: 20px; margin: 20px 0; border-radius: 16px; background: var(--bg-end, #FFE5F1); align-items: center; }
.label { color: var(--text-muted, #7A6A87); }
.punishment { font-size: 20px; font-weight: bold; margin-top: 8px; }
.note { margin-top: 8px; color: var(--text-muted, #7A6A87); font-size: 12px; }
</style>
```

- [ ] **Step 3: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/game/placeholder", "style": { "navigationBarTitleText": "游戏" } },
{ "path": "pages/game/result", "style": { "navigationBarTitleText": "结算" } }
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/game/placeholder.uvue src/pages/game/result.uvue pages.json
git commit -m "feat(pages): 占位游戏页与结算页"
```

---

### Task 1.21 · 惩罚规则占位页

**Files:**
- Create: `src/pages/punishment/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 实现**

```vue
<template>
  <view class="container">
    <text class="emoji">📋</text>
    <text class="title">惩罚规则</text>
    <text class="desc">内置规则 + 用户自定义条目的管理入口将在 Plan 2 上线。</text>
    <AppButton label="返回" variant="ghost" @tap="back" />
  </view>
</template>

<script setup lang="uts">
import AppButton from '@/components/AppButton.uvue'
function back() { uni.navigateBack({}) }
</script>

<style>
.container { padding: 40px 24px; align-items: center; }
.emoji { font-size: 64px; }
.title { font-size: 22px; font-weight: bold; margin-top: 12px; }
.desc { color: var(--text-muted, #7A6A87); margin: 16px 0; text-align: center; }
</style>
```

- [ ] **Step 2: 注册路由**

`pages.json` 增加：
```json
{ "path": "pages/punishment/index", "style": { "navigationBarTitleText": "惩罚规则" } }
```

- [ ] **Step 3: 在首页已有入口（Task 1.15 已完成），验证跳转**

- [ ] **Step 4: Commit**

```bash
git add src/pages/punishment/index.uvue pages.json
git commit -m "feat(pages): 惩罚规则占位页"
```

---

### Task 1.22 · 主题实时应用到 UVue 页面

> **背景：** UVue 对 `document.documentElement.style.setProperty` 的支持情况不确定。若 Task 1.4 的 `applyTheme` 在真机上无法生效，退回到"每个组件 computed 读取 store 的 tokens"方案。本 Task 做实测并落地决策。

**Files:**
- Modify: `src/app.uvue`（如 `applyTheme` 可用）或 `src/components/AppButton.uvue`、`src/components/GameTile.uvue` 等（退路方案）

- [ ] **Step 1: 先尝试 applyTheme 真机生效**

修改 `src/app.uvue` 的 `<script>`：
```ts
import { onLaunch } from '@dcloudio/uni-app'
import { useSettings } from '@/stores/settings'
import { applyTheme } from '@/theme/apply'
import { themes } from '@/theme/tokens'
import { watchEffect } from 'vue'

onLaunch(() => {
  const settings = useSettings()
  settings.load()
  const target = settings.hasOnboarded ? '/pages/home/index' : '/pages/onboarding/index'
  uni.reLaunch({ url: target })

  // 尝试应用主题变量到 document root
  watchEffect(() => {
    const root = (globalThis as any).document?.documentElement
    if (root) applyTheme(settings.theme, root)
  })
})
```

运行到真机，切换主题，观察 CSS 变量是否生效（按钮颜色变化）。

- [ ] **Step 2: 若 applyTheme 不生效，退回 store 驱动**

退路方案：在每个 uvue 组件中改用 computed。示例 `AppButton.uvue`：
```vue
<script setup lang="uts">
import { computed } from 'vue'
import { useSettings } from '@/stores/settings'
import { themes } from '@/theme/tokens'

const props = defineProps<{ label: string; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'tap'): void }>()

const settings = useSettings()
const tokens = computed(() => themes[settings.theme])
const style = computed(() => {
  const bg = props.variant === 'secondary' ? tokens.value.secondary
           : props.variant === 'ghost'     ? 'transparent'
           : tokens.value.primary
  const color = props.variant === 'ghost' ? tokens.value.primary : '#ffffff'
  return { backgroundColor: bg, borderColor: tokens.value.primary, color }
})

function onTap() {
  if (props.disabled) return
  emit('tap')
}
</script>

<template>
  <view class="app-btn" :style="style" :class="{ ghost: variant === 'ghost', disabled }" @tap="onTap">
    <text class="label" :style="{ color: style.color }">{{ label }}</text>
  </view>
</template>
```
**GameTile.uvue / 其它组件** 同理 —— 用 `computed(tokens)` 返回 `:style`。

- [ ] **Step 3: 真机验证两主题切换**

切换主题后：首页按钮配色变化、大厅卡片配色变化、设置页两个 pill 高亮变化。

- [ ] **Step 4: Commit**

```bash
git add src/app.uvue src/components/
git commit -m "feat(theme): 主题在 UVue 页面实时生效"
```

---

### Task 1.23 · 冒烟测试与收尾

**Files:** (验证阶段，无代码修改)

- [ ] **Step 1: 跑全部单测**

```bash
pnpm test
```
Expected: 所有 tests PASS。

- [ ] **Step 2: 真机冒烟 · 首启流程**

卸载旧应用 → 重新安装 → 启动 → 进入引导页 → 选 Q 版卡通 → 首页 → 设置切换到霓虹 → 退出 → 再启动 → 直接进入首页且为霓虹主题。

- [ ] **Step 3: 真机冒烟 · 游戏流程**

首页 → 开始玩 → 选 4 人 → 跳过名字 → 大厅看到 5 款游戏（同屏反应/轮盘限 2-5 人所以可玩；其他都可玩）→ 点任一游戏 → 占位页 → 模拟输 → 结算页 → 再来 / 换游戏 / 回首页 每个按钮各走一次。

- [ ] **Step 4: 真机冒烟 · 人数边界**

回首页 → 开始玩 → 选 7 人 → 大厅：同屏反应 / 指尖轮盘 置灰，hint 显示"最多 5 人"；其余 3 款可玩。

- [ ] **Step 5: 真机冒烟 · 设置持久化**

关闭音效、振动 → 回首页 → 重启 App → 设置页两开关仍为关闭。

- [ ] **Step 6: 若有失败项，记录并修复**

把每一条失败用新任务追加到 plan 末尾，修复后再次 Commit。

- [ ] **Step 7: Commit 标签**

```bash
git tag v0.1.0-skeleton
git commit --allow-empty -m "chore: 完成 Phase 0-1（Spike + 骨架）"
```

---

## 附录 · 后续计划预览（Plan 2+）

Plan 2 及后续将覆盖：
- 5 款游戏 `logic.ts` 纯逻辑实现 + 单测（每款独立 commit）
- 5 款游戏的正式 UI（替换 placeholder 页）
- 惩罚库 Store + 管理页 + 25 条内置数据
- 完整音效包（按游戏与事件）
- 双主题的插画资源（炸弹/鳄鱼/马/轮盘/闪光）
- 切后台/来电中断恢复机制
- 真机 E2E 全量手动测试清单
- 发包与签名流程
