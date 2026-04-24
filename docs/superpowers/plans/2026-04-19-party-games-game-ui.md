# 鸿蒙派对小游戏 · 实施计划 3（Phase 3：5 款游戏 UI 接入）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 5 款小游戏（💣 定时炸弹 · 🐊 鳄鱼拔牙 · 🐎 摇一摇赛马 · 🎯 指尖大轮盘 · 👆 同屏反应）实现 UVue 页面，把 Plan 2 的 `logic.ts` 纯状态机与 Plan 1 的原生封装（传感器/振动/音效/屏幕常亮/多指触控）对接起来，替换掉 `pages/game/placeholder.uvue`，让玩家能从大厅进入任一游戏、完整玩一局、走到结算页。

**Architecture:** 每款游戏一个 `pages/game/<id>/index.uvue` 页面。页面在 `onLoad` 创建 `logic.ts` 工厂实例并持有，在 `setInterval` 里驱动 `tick(deltaMs)`，通过 `onSample` / `addFinger` / `removeFinger` / `cutFuse` / `tapTooth` 等方法响应玩家操作。所有页面共用一个 `components/GamePausedOverlay.uvue` 暂停遮罩；切后台触发 `onHide` → 停止 tick → 显示遮罩 → 玩家选「继续 / 重来本局 / 回大厅」。游戏结束写入 `session.loser` 并 `uni.redirectTo('/pages/game/result')`。

**Tech Stack:** uni-app x（UVue + UTS）· Vue 3 组合式 API · Pinia · HarmonyOS NEXT 原生能力

**Spec 引用：** `docs/superpowers/specs/2026-04-18-party-games-design.md` §5.1-5.6, §7, §8

**前置依赖：**
- Plan 1（骨架）：`stores/session.ts`、`stores/settings.ts`、`native/*`、`components/AppButton.uvue`、`pages/game/result.uvue`、`pages/lobby/games.uvue` 已就绪。
- Plan 2（逻辑）：`games/{bomb,crocodile,horse-race,wheel,reaction}/logic.ts` 已就绪且单测通过。

**范围 · Plan 3 包含：**
- 共享 `GamePausedOverlay.uvue` + 音效 ID 清单。
- 5 个游戏页面：`pages/game/<id>/index.uvue`。
- 更新大厅 `enter(g)` 与结算页 `restart()` 的跳转路径，指向新的游戏页。
- 删除或降级 `pages/game/placeholder.uvue`。
- 在 `pages.json` 注册 5 条新路由。
- 真机 E2E 冒烟测试（运气派 3 + 实力派 2 各走一次完整流程）。

**范围 · Plan 3 不包含（留待 Plan 4+）：**
- 惩罚库管理页与 25 条内置数据（结算页仍沿用 Plan 1 的 placeholder 文案数组）。
- 正式插画素材（MVP UI 使用 Emoji + 主题色 + 基础几何形状；音效文件若不存在则静默降级）。
- 视觉/动画润色。
- 发包与签名。

---

## 文件结构

> ⚠️ 本仓库采用扁平目录（非 `src/`），目录名即模块名。路径别名 `@/` 映射到仓库根（见 `tsconfig.json` 与 `vitest.config.ts`）。

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `components/GamePausedOverlay.uvue` | 创建 | 游戏暂停遮罩：继续 / 重来本局 / 回大厅 |
| `utils/game-sounds.ts` | 创建 | 音效文件 ID → 路径映射，供 `native/audio.ts` 预加载 |
| `pages/game/bomb/index.uvue` | 创建 | 💣 定时炸弹：倒计时 + 引线按钮 + 爆炸后认领输家 |
| `pages/game/crocodile/index.uvue` | 创建 | 🐊 鳄鱼拔牙：牙齿网格 + 当前玩家 + 陷阱咬合 |
| `pages/game/horse-race/index.uvue` | 创建 | 🐎 摇一摇赛马：加速度 + 峰值计数 + 每位玩家 10 秒 |
| `pages/game/wheel/index.uvue` | 创建 | 🎯 指尖大轮盘：多指收集 + 旋转动画 + 选中一根手指 |
| `pages/game/reaction/index.uvue` | 创建 | 👆 同屏反应：多指按住 + 随机信号 + 最后松手者输 |
| `pages.json` | 修改 | 注册 5 条游戏路由 |
| `pages/lobby/games.uvue` | 修改 | `enter(g)` 跳转到新路由（替换 placeholder） |
| `pages/game/result.uvue` | 修改 | `restart()` 跳转到新路由 |
| `pages/game/placeholder.uvue` | 删除 | 不再需要（删除前先在其他文件完成迁移） |

---

## 设计约定（阅读全部 Task 前必读）

### 1. 页面与 logic.ts 的数据流

```
logic.ts (纯闭包)  ←─ action (tick / tap / addFinger / ...) ─  page (UVue)
       │
       └── getSnapshot() → snap (ref<Snapshot>)  ──→ 模板渲染
```

- 页面中维护 `snap = ref<XxxSnapshot | null>(null)`。
- 任一 action 之后立刻 `snap.value = game.getSnapshot()` 触发重渲染。
- logic 内部状态对 Vue 不可见，**只有 snap 是响应式的**。

### 2. tick 循环

- 使用 `setInterval(fn, 100)` 驱动 tick；`deltaMs` 用 `Date.now()` 差值计算（避免依赖 setInterval 精度）。
- 在 `onLoad` 或初始化之后 `startLoop()`；在 `onUnload` / 玩家胜负决出 / `onHide` 中 `stopLoop()`。

### 3. 暂停与恢复（应对切后台 / 来电）

- `onHide`（用户切走或来电）：若当前在"进行中"状态，`stopLoop()` + `paused.value = true`（显示遮罩）。
- `onShow`：不自动恢复 —— 让玩家通过遮罩上的按钮主动选择。

### 4. 游戏结束后的跳转

所有页面的胜负决出后统一：
```ts
session.loser = snap.value!.result!.loser
stopLoop()
releaseAwake()
uni.redirectTo({ url: '/pages/game/result' })
```

### 5. 原生能力开关遵循 settings

- `vibrateShort()` / `vibrateLong()` 内部读 `settings.vibrationEnabled`。
- `play(id)` 内部读 `settings.soundEnabled`。
- 游戏页不再单独判断开关。

### 6. 音效文件降级

音效文件可能未上传（Plan 5 正式补齐）。`native/audio.ts` 的 `preload` 会调 `createInnerAudioContext` 并设 `src`，加载失败时 `ctx.play()` 抛错但被 `try { ... } catch {}` 吞掉 —— 游戏不崩溃。

---

## Phase 3 · 游戏 UI

### Task 3.1 · 共享 Pause 遮罩 + 音效清单

**Files:**
- Create: `components/GamePausedOverlay.uvue`
- Create: `utils/game-sounds.ts`

- [ ] **Step 1: 创建音效 ID 清单**

写入 `utils/game-sounds.ts`：
```ts
// utils/game-sounds.ts
// 所有游戏共享的音效 ID → 相对路径映射。
// 文件不存在时，native/audio.ts 会静默降级（见 §设计约定 6）。

export const GAME_SOUNDS: Record<string, string> = {
  click:     '/static/sound/click.mp3',
  tick:      '/static/sound/tick.mp3',
  explode:   '/static/sound/explode.mp3',
  bite:      '/static/sound/bite.mp3',
  signal:    '/static/sound/signal.mp3',
  countdown: '/static/sound/countdown.mp3',
  win:       '/static/sound/win.mp3',
  lose:      '/static/sound/lose.mp3'
}
```

- [ ] **Step 2: 创建暂停遮罩组件**

写入 `components/GamePausedOverlay.uvue`：
```vue
<template>
  <view v-if="visible" class="overlay">
    <view class="card" :style="cardStyle">
      <text class="title" :style="textStyle">⏸ 已暂停</text>
      <text class="desc" :style="mutedStyle">{{ desc ?? '已暂停，选择下一步' }}</text>
      <AppButton label="继续" variant="primary" @tap="emit('resume')" />
      <AppButton label="重来本局" variant="ghost" @tap="emit('restart')" />
      <AppButton label="回大厅" variant="ghost" @tap="emit('exit')" />
    </view>
  </view>
</template>

<script setup lang="uts">
  import { computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import { useSettings } from '@/stores/settings'
  import { themes } from '@/theme/tokens'

  const props = defineProps<{
    visible : boolean
    desc ?: string
  }>()
  const emit = defineEmits<{
    (e : 'resume') : void
    (e : 'restart') : void
    (e : 'exit') : void
  }>()

  const settings = useSettings()
  const tokens = computed(() => themes[settings.theme])
  const cardStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
  const textStyle = computed(() => ({ color: tokens.value.text }))
  const mutedStyle = computed(() => ({ color: tokens.value.textMuted }))
</script>

<style>
  .overlay {
    position: fixed;
    left: 0; right: 0; top: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    justify-content: center;
    align-items: center;
  }
  .card {
    width: 280px;
    padding: 24px;
    border-radius: 16px;
    align-items: center;
  }
  .title { font-size: 22px; font-weight: bold; }
  .desc { margin: 8px 0 16px 0; text-align: center; }
</style>
```

- [ ] **Step 3: 跑一次单测确认没打破现有测试**

```bash
pnpm test
```
Expected: 所有现有 tests（stores / theme / native / games）PASS。

- [ ] **Step 4: Commit**

```bash
git add components/GamePausedOverlay.uvue utils/game-sounds.ts
git commit -m "feat(game-ui): 暂停遮罩组件 + 音效 ID 清单"
```

---

### Task 3.2 · 💣 定时炸弹 UI

**Spec 对齐（§5.2）：**
- 进入立即启动玩家不可见的倒计时（30-90s）。
- 点「引线」扣 1 秒，可提前引爆。
- 爆炸 → 长震 + 爆炸音效；屏幕定格 → 玩家自行认领输家。

**Files:**
- Create: `pages/game/bomb/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建炸弹页面**

写入 `pages/game/bomb/index.uvue`：
```vue
<template>
  <view class="container" :class="{ urgent: urgencyLevel >= 2, warn: urgencyLevel === 1 }">
    <text class="big" :class="{ pulse: state === 'ticking' }">💣</text>
    <text class="title">定时炸弹</text>

    <view v-if="state === 'ticking'" class="ticking">
      <text class="hint">传递手机 · 点引线扣 1 秒</text>
      <AppButton label="✂️ 剪引线" variant="primary" @tap="onCutFuse" />
      <text class="cuts">已剪 {{ snap?.fuseCuts ?? 0 }} 次</text>
    </view>

    <view v-else-if="state === 'exploded'" class="exploded">
      <text class="boom">💥 爆炸了！</text>
      <text class="hint">手里拿着手机的人点自己</text>
      <view class="who-grid">
        <view v-for="i in session.playerCount" :key="i" class="who" @tap="claimLoser(i - 1)">
          <text class="who-text">{{ session.displayNameOf(i - 1) }}</text>
        </view>
      </view>
    </view>

    <AppButton label="返回大厅" variant="ghost" @tap="onExit" />

    <GamePausedOverlay
      :visible="paused"
      desc="已暂停，是否继续？"
      @resume="onResume"
      @restart="onRestart"
      @exit="onExit"
    />
  </view>
</template>

<script setup lang="uts">
  import { ref, computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import GamePausedOverlay from '@/components/GamePausedOverlay.uvue'
  import { useSession } from '@/stores/session'
  import { createBombGame, type BombGame, type BombSnapshot } from '@/games/bomb/logic'
  import { preload, play } from '@/native/audio'
  import { vibrateShort, vibrateLong } from '@/native/vibrator'
  import { keepAwake, releaseAwake } from '@/native/screen'
  import { GAME_SOUNDS } from '@/utils/game-sounds'

  const session = useSession()
  const game = ref<BombGame | null>(null)
  const snap = ref<BombSnapshot | null>(null)
  const paused = ref(false)

  let tickTimer : number | null = null
  let lastTickAt = 0
  let lastTickSoundAt = 0

  const state = computed(() => snap.value?.state ?? 'ready')
  const urgencyLevel = computed(() => {
    const s = snap.value
    if (s == null || s.durationMs === 0) return 0
    const ratio = s.elapsedMs / s.durationMs
    if (ratio > 0.85) return 2
    if (ratio > 0.6) return 1
    return 0
  })

  function update() {
    snap.value = game.value!.getSnapshot()
  }

  function startLoop() {
    if (tickTimer != null) return
    lastTickAt = Date.now()
    lastTickSoundAt = 0
    tickTimer = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickAt
      lastTickAt = now
      game.value?.tick(delta)
      update()
      // 滴答音效按剩余紧迫度加速
      const s = snap.value!
      const urgent = urgencyLevel.value
      const intervalMs = urgent >= 2 ? 250 : urgent === 1 ? 500 : 1000
      if (now - lastTickSoundAt >= intervalMs) {
        play('tick')
        lastTickSoundAt = now
      }
      if (s.state === 'exploded') {
        onExploded()
      }
    }, 100) as unknown as number
  }

  function stopLoop() {
    if (tickTimer != null) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function onExploded() {
    stopLoop()
    play('explode')
    vibrateLong()
  }

  function onCutFuse() {
    vibrateShort()
    play('click')
    game.value?.cutFuse()
    update()
    if (snap.value?.state === 'exploded') onExploded()
  }

  function claimLoser(idx : number) {
    if (idx < 0 || idx >= session.playerCount) return
    game.value?.reportLoser(idx)
    session.loser = idx
    play('lose')
    releaseAwake()
    uni.redirectTo({ url: '/pages/game/result' })
  }

  function init() {
    const g = createBombGame({})
    g.start()
    game.value = g
    update()
  }

  function onResume() {
    paused.value = false
    if (snap.value?.state === 'ticking') startLoop()
  }

  function onRestart() {
    paused.value = false
    stopLoop()
    init()
    startLoop()
  }

  function onExit() {
    stopLoop()
    paused.value = false
    releaseAwake()
    session.exitToLobby()
    uni.redirectTo({ url: '/pages/lobby/games' })
  }

  onLoad(() => {
    preload(GAME_SOUNDS)
    keepAwake()
    init()
    startLoop()
  })

  onUnload(() => {
    stopLoop()
    releaseAwake()
  })

  onHide(() => {
    if (snap.value?.state === 'ticking') {
      stopLoop()
      paused.value = true
    }
  })
</script>

<style>
  .container {
    padding: 32px 20px;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    background-color: var(--bg, #FFF5EB);
  }
  .container.warn { background-color: #FFE0B2; }
  .container.urgent { background-color: #FFB0B0; }
  .big { font-size: 120px; }
  .pulse { /* 视觉轻抖；Phase 5 补动画 */ }
  .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
  .ticking { align-items: center; margin-top: 16px; width: 100%; }
  .hint { color: var(--text-muted, #7A6A87); margin: 12px 0; }
  .cuts { margin-top: 8px; color: var(--text-muted, #7A6A87); }
  .exploded { align-items: center; margin-top: 16px; width: 100%; }
  .boom { font-size: 28px; font-weight: bold; color: var(--danger, #FF6B9D); margin: 16px 0; }
  .who-grid { flex-direction: row; flex-wrap: wrap; justify-content: center; width: 100%; }
  .who {
    padding: 12px 18px;
    margin: 6px;
    border-radius: 16px;
    background-color: var(--bg-end, #FFE5F1);
  }
  .who-text { font-weight: bold; }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组末尾（`pages/punishment/index` 之前或之后均可）新增：
```json
{
  "path": "pages/game/bomb/index",
  "style": { "navigationBarTitleText": "定时炸弹" }
}
```

- [ ] **Step 3: 临时改大厅跳转到炸弹页验证**

在 `pages/lobby/games.uvue` 的 `enter(g)` 中，临时加一行日志即可；正式跳转改在 Task 3.7 统一替换。此处可暂不改动，通过直接在 `pages/game/placeholder.uvue` 中注释掉"模拟"按钮 tap，手动用浏览器地址栏或菜单导航进入验证（或仅在真机编译后通过路由命令验证）。

> 为避免与 Task 3.7 冲突，这里**不修改** `pages/lobby/games.uvue` 的 `enter`；真机冒烟验证通过在 HBuilderX 运行到"指定页面"或临时插入测试入口完成。

- [ ] **Step 4: 真机编译并验证炸弹页（手工路由）**

在 HBuilderX 中修改 `pages.json`，把 `pages/game/bomb/index` 放到 `pages` 数组首位运行一次（或编辑 `main.uts` 跳转），真机启动后：
1. 可见 💣 + 「✂️ 剪引线」按钮。
2. 等若干秒（30-90s 随机），应爆炸并出现玩家认领网格（但此时 `session.playerCount === 0`，认领按钮也为 0 个；需要先通过正常流程或在调试时手动把 `session.playerCount` 设为 4）。
3. 点任一认领按钮应跳转到结算页。

> 如果只做初步验证，也可暂时跳过 Step 4，待 Task 3.7 串起完整流程后再回归测试。

- [ ] **Step 5: 恢复 `pages.json` 初始首页顺序，Commit**

```bash
git add pages/game/bomb/index.uvue pages.json
git commit -m "feat(game-ui): 定时炸弹 UI 页（倒计时 + 引线 + 爆炸认领）"
```

---

### Task 3.3 · 🐊 鳄鱼拔牙 UI

**Spec 对齐（§5.3）：**
- 牙齿网格，陷阱牙随机 1 颗。
- 玩家轮流点击未按过的牙。
- 按到陷阱 → 咬合动画 + 重震 + 当前玩家输。

**Files:**
- Create: `pages/game/crocodile/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建鳄鱼拔牙页面**

写入 `pages/game/crocodile/index.uvue`：
```vue
<template>
  <view class="container" :class="{ bite: state === 'trapTriggered' }">
    <text class="big">🐊</text>
    <text class="title">鳄鱼拔牙</text>

    <view v-if="state === 'ready'" class="ready">
      <text class="hint">共 {{ snap?.totalTeeth ?? 0 }} 颗牙，有 1 颗是陷阱</text>
      <AppButton label="开始" variant="primary" @tap="onStart" />
    </view>

    <view v-else-if="state === 'playing'" class="playing">
      <text class="current">
        当前回合：{{ session.displayNameOf(snap?.currentPlayer ?? 0) }}
      </text>
      <view class="teeth-grid">
        <view
          v-for="i in snap?.totalTeeth ?? 0"
          :key="i"
          class="tooth"
          :class="{ pressed: isPressed(i - 1) }"
          @tap="onTapTooth(i - 1)"
        >
          <text class="tooth-emoji">{{ isPressed(i - 1) ? '⬜' : '🦷' }}</text>
        </view>
      </view>
    </view>

    <view v-else-if="state === 'trapTriggered'" class="trap">
      <text class="bite-text">咔嚓！{{ session.displayNameOf(snap?.result?.loser ?? 0) }} 被咬了！</text>
      <AppButton label="查看结果" variant="primary" @tap="goResult" />
    </view>

    <AppButton label="返回大厅" variant="ghost" @tap="onExit" />

    <GamePausedOverlay
      :visible="paused"
      desc="已暂停，是否继续？"
      @resume="onResume"
      @restart="onRestart"
      @exit="onExit"
    />
  </view>
</template>

<script setup lang="uts">
  import { ref, computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import GamePausedOverlay from '@/components/GamePausedOverlay.uvue'
  import { useSession } from '@/stores/session'
  import { createCrocodileGame, type CrocodileGame, type CrocodileSnapshot } from '@/games/crocodile/logic'
  import { preload, play } from '@/native/audio'
  import { vibrateShort, vibrateLong } from '@/native/vibrator'
  import { keepAwake, releaseAwake } from '@/native/screen'
  import { GAME_SOUNDS } from '@/utils/game-sounds'

  const session = useSession()
  const game = ref<CrocodileGame | null>(null)
  const snap = ref<CrocodileSnapshot | null>(null)
  const paused = ref(false)

  const state = computed(() => snap.value?.state ?? 'ready')

  function update() {
    snap.value = game.value!.getSnapshot()
  }

  function isPressed(idx : number) : boolean {
    return snap.value?.pressedTeeth?.includes(idx) ?? false
  }

  function init() {
    const count = session.playerCount > 0 ? session.playerCount : 2
    game.value = createCrocodileGame({ playerCount: count })
    update()
  }

  function onStart() {
    play('click')
    game.value?.start()
    update()
  }

  function onTapTooth(idx : number) {
    if (snap.value?.state !== 'playing') return
    if (isPressed(idx)) return
    game.value?.tapTooth(idx)
    update()
    const s = snap.value!
    if (s.state === 'trapTriggered') {
      vibrateLong()
      play('bite')
      session.loser = s.result!.loser
    } else {
      vibrateShort()
      play('click')
    }
  }

  function goResult() {
    releaseAwake()
    uni.redirectTo({ url: '/pages/game/result' })
  }

  function onResume() { paused.value = false }

  function onRestart() {
    paused.value = false
    init()
  }

  function onExit() {
    paused.value = false
    releaseAwake()
    session.exitToLobby()
    uni.redirectTo({ url: '/pages/lobby/games' })
  }

  onLoad(() => {
    preload(GAME_SOUNDS)
    keepAwake()
    init()
  })

  onUnload(() => {
    releaseAwake()
  })

  onHide(() => {
    if (snap.value?.state === 'playing') {
      paused.value = true
    }
  })
</script>

<style>
  .container {
    padding: 24px 16px;
    min-height: 100vh;
    align-items: center;
    background-color: var(--bg, #FFF5EB);
  }
  .container.bite { background-color: #FFB0B0; }
  .big { font-size: 100px; margin-top: 16px; }
  .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
  .ready { align-items: center; margin-top: 16px; }
  .playing { align-items: center; margin-top: 16px; width: 100%; }
  .current {
    font-size: 18px;
    font-weight: bold;
    margin: 12px 0;
    color: var(--primary, #FF6B9D);
  }
  .teeth-grid {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }
  .tooth {
    width: 60px;
    height: 60px;
    margin: 6px;
    border-radius: 12px;
    background-color: var(--bg-end, #FFE5F1);
    align-items: center;
    justify-content: center;
  }
  .tooth.pressed { opacity: 0.35; }
  .tooth-emoji { font-size: 32px; }
  .hint { color: var(--text-muted, #7A6A87); margin: 12px 0; }
  .trap { align-items: center; margin-top: 24px; }
  .bite-text {
    font-size: 22px;
    font-weight: bold;
    color: var(--danger, #FF6B9D);
    margin: 16px 0;
  }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组新增：
```json
{
  "path": "pages/game/crocodile/index",
  "style": { "navigationBarTitleText": "鳄鱼拔牙" }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/game/crocodile/index.uvue pages.json
git commit -m "feat(game-ui): 鳄鱼拔牙 UI 页（牙齿网格 + 陷阱咬合）"
```

---

### Task 3.4 · 🐎 摇一摇赛马 UI

**Spec 对齐（§5.1）：**
- 对每位玩家依次：3 秒准备 → 10 秒摇动（订阅加速度，峰值检测累加次数）。
- 全员完成后：次数最多 = 赢家，最少 = 输家（并列用随机）。

**Files:**
- Create: `pages/game/horse-race/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建摇一摇赛马页面**

写入 `pages/game/horse-race/index.uvue`：
```vue
<template>
  <view class="container">
    <text class="big">🐎</text>
    <text class="title">摇一摇赛马</text>

    <view v-if="state === 'ready'" class="ready">
      <text class="round">
        轮到：{{ session.displayNameOf(snap?.currentPlayer ?? 0) }}
      </text>
      <text v-if="prepCountdown > 0" class="count">准备：{{ prepCountdown }}</text>
      <AppButton v-else label="开始摇！" variant="primary" @tap="startPrep" />
    </view>

    <view v-else-if="state === 'shaking'" class="shaking">
      <text class="big-count">{{ currentShakeCount }}</text>
      <text class="remaining">剩余 {{ remainingSec }} 秒</text>
      <text class="hint">用力摇晃手机！</text>
      <AppButton label="提前结束本轮" variant="ghost" @tap="onFinishPlayer" />
    </view>

    <view v-else-if="state === 'result'" class="result">
      <text class="trophy">🏆 {{ session.displayNameOf(snap?.result?.winner ?? 0) }} 赢了！</text>
      <text class="skull">💩 {{ session.displayNameOf(snap?.result?.loser ?? 0) }} 输了</text>
      <text class="counts">
        次数：{{ (snap?.shakeCounts ?? []).join(' · ') }}
      </text>
      <AppButton label="查看结果" variant="primary" @tap="goResult" />
    </view>

    <AppButton label="返回大厅" variant="ghost" @tap="onExit" />

    <GamePausedOverlay
      :visible="paused"
      desc="已暂停，是否继续？"
      @resume="onResume"
      @restart="onRestart"
      @exit="onExit"
    />
  </view>
</template>

<script setup lang="uts">
  import { ref, computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import GamePausedOverlay from '@/components/GamePausedOverlay.uvue'
  import { useSession } from '@/stores/session'
  import {
    createHorseRaceGame,
    type HorseRaceGame,
    type HorseRaceSnapshot
  } from '@/games/horse-race/logic'
  import { startAccelerometer, stopAccelerometer } from '@/native/sensor'
  import { preload, play } from '@/native/audio'
  import { vibrateShort, vibrateLong } from '@/native/vibrator'
  import { keepAwake, releaseAwake } from '@/native/screen'
  import { GAME_SOUNDS } from '@/utils/game-sounds'

  const session = useSession()
  const game = ref<HorseRaceGame | null>(null)
  const snap = ref<HorseRaceSnapshot | null>(null)
  const paused = ref(false)
  const prepCountdown = ref(0)

  let tickTimer : number | null = null
  let prepTimer : number | null = null
  let lastTickAt = 0
  let accelActive = false

  const state = computed(() => snap.value?.state ?? 'ready')
  const currentShakeCount = computed(() => {
    const s = snap.value
    if (s == null) return 0
    return s.shakeCounts[s.currentPlayer] ?? 0
  })
  const remainingSec = computed(() => {
    const s = snap.value
    if (s == null) return 0
    const remain = Math.max(0, s.shakeDurationMs - s.elapsedMs)
    return Math.ceil(remain / 1000)
  })

  function update() {
    snap.value = game.value!.getSnapshot()
  }

  function init() {
    const count = session.playerCount > 0 ? session.playerCount : 2
    game.value = createHorseRaceGame({ playerCount: count })
    update()
  }

  function startPrep() {
    if (prepTimer != null) return
    prepCountdown.value = 3
    play('countdown')
    prepTimer = setInterval(() => {
      prepCountdown.value--
      play('countdown')
      if (prepCountdown.value <= 0) {
        clearInterval(prepTimer!)
        prepTimer = null
        startShaking()
      }
    }, 1000) as unknown as number
  }

  function startShaking() {
    if (game.value == null) return
    game.value.startPlayer()
    update()
    startLoop()
    startAccel()
    play('signal')
    vibrateShort()
  }

  function startLoop() {
    if (tickTimer != null) return
    lastTickAt = Date.now()
    tickTimer = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickAt
      lastTickAt = now
      game.value?.tick(delta)
      update()
      const s = snap.value!
      if (s.state === 'ready') {
        // 进入下一位玩家：停一下，让玩家传递手机再准备
        stopLoop()
        stopAccel()
      } else if (s.state === 'result') {
        stopLoop()
        stopAccel()
        vibrateLong()
        play('win')
      }
    }, 100) as unknown as number
  }

  function stopLoop() {
    if (tickTimer != null) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function startAccel() {
    if (accelActive) return
    accelActive = true
    startAccelerometer((data) => {
      const mag = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z)
      const prev = snap.value?.shakeCounts[snap.value.currentPlayer] ?? 0
      game.value?.onSample(mag)
      update()
      if ((snap.value?.shakeCounts[snap.value.currentPlayer] ?? 0) > prev) {
        // 一次有效峰值
        vibrateShort()
      }
    }, 'game')
  }

  function stopAccel() {
    if (!accelActive) return
    accelActive = false
    stopAccelerometer()
  }

  function onFinishPlayer() {
    play('click')
    game.value?.finishPlayer()
    update()
    if (snap.value?.state === 'result') {
      stopLoop()
      stopAccel()
      vibrateLong()
      play('win')
    } else if (snap.value?.state === 'ready') {
      stopLoop()
      stopAccel()
    }
  }

  function goResult() {
    const s = snap.value
    if (s == null || s.result == null) return
    session.loser = s.result.loser
    stopLoop()
    stopAccel()
    releaseAwake()
    uni.redirectTo({ url: '/pages/game/result' })
  }

  function onResume() { paused.value = false }

  function onRestart() {
    paused.value = false
    stopLoop()
    stopAccel()
    if (prepTimer != null) { clearInterval(prepTimer); prepTimer = null }
    prepCountdown.value = 0
    init()
  }

  function onExit() {
    paused.value = false
    stopLoop()
    stopAccel()
    if (prepTimer != null) { clearInterval(prepTimer); prepTimer = null }
    releaseAwake()
    session.exitToLobby()
    uni.redirectTo({ url: '/pages/lobby/games' })
  }

  onLoad(() => {
    preload(GAME_SOUNDS)
    keepAwake()
    init()
  })

  onUnload(() => {
    stopLoop()
    stopAccel()
    if (prepTimer != null) clearInterval(prepTimer)
    releaseAwake()
  })

  onHide(() => {
    if (snap.value?.state === 'shaking' || prepCountdown.value > 0) {
      stopLoop()
      stopAccel()
      if (prepTimer != null) { clearInterval(prepTimer); prepTimer = null }
      prepCountdown.value = 0
      paused.value = true
    }
  })
</script>

<style>
  .container {
    padding: 24px 20px;
    min-height: 100vh;
    align-items: center;
    background-color: var(--bg, #FFF5EB);
  }
  .big { font-size: 100px; }
  .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
  .ready { align-items: center; margin-top: 24px; }
  .round { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
  .count { font-size: 48px; font-weight: bold; color: var(--primary, #FF6B9D); }
  .shaking { align-items: center; margin-top: 16px; }
  .big-count {
    font-size: 80px;
    font-weight: bold;
    color: var(--primary, #FF6B9D);
  }
  .remaining { font-size: 18px; color: var(--text-muted, #7A6A87); margin-top: 8px; }
  .hint { color: var(--text-muted, #7A6A87); margin: 12px 0; }
  .result { align-items: center; margin-top: 24px; }
  .trophy { font-size: 22px; font-weight: bold; color: var(--success, #7ED957); }
  .skull {
    font-size: 20px;
    font-weight: bold;
    color: var(--danger, #FF6B9D);
    margin-top: 8px;
  }
  .counts { margin-top: 12px; color: var(--text-muted, #7A6A87); }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组新增：
```json
{
  "path": "pages/game/horse-race/index",
  "style": { "navigationBarTitleText": "摇一摇赛马" }
}
```

- [ ] **Step 3: 真机验证传感器**

在真机上导航到本页，正常流程：3s 倒计时 → 摇晃手机 → 计数增加 → 10s 后自动切换到下一位 → 全员完成后出现胜负显示。若加速度订阅失败（无反应），检查 `manifest.json` 中 `ohos.permission.VIBRATE` 与 `app-harmony` 配置，并参考 Plan 1 的 Spike 报告。

- [ ] **Step 4: Commit**

```bash
git add pages/game/horse-race/index.uvue pages.json
git commit -m "feat(game-ui): 摇一摇赛马 UI 页（加速度 + 峰值计数 + 轮次）"
```

---

### Task 3.5 · 🎯 指尖大轮盘 UI

**Spec 对齐（§5.5）：**
- 圆形轮盘，每人一根手指按在边缘。
- 全员按齐后自动旋转 2-3 秒，指针停在某根手指上 = 输家。

**Files:**
- Create: `pages/game/wheel/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建轮盘页面**

写入 `pages/game/wheel/index.uvue`：
```vue
<template>
  <view class="container">
    <text class="big">🎯</text>
    <text class="title">指尖大轮盘</text>

    <view
      class="wheel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <text class="wheel-emoji">🎡</text>
      <text v-if="state === 'collecting'" class="collect-hint">
        请 {{ session.playerCount }} 根手指同时按在圆盘里<br/>
        当前：{{ snap?.fingerIds?.length ?? 0 }} / {{ session.playerCount }}
      </text>
      <text v-else-if="state === 'spinning'" class="spin-hint">
        🔄 旋转中...
      </text>
      <text v-else-if="state === 'selected'" class="result-hint">
        🎯 选中了 {{ session.displayNameOf(snap?.result?.loser ?? 0) }}！
      </text>
    </view>

    <AppButton
      v-if="state === 'selected'"
      label="查看结果"
      variant="primary"
      @tap="goResult"
    />
    <AppButton label="返回大厅" variant="ghost" @tap="onExit" />

    <GamePausedOverlay
      :visible="paused"
      desc="已暂停（切后台会释放手指）"
      @resume="onResume"
      @restart="onRestart"
      @exit="onExit"
    />
  </view>
</template>

<script setup lang="uts">
  import { ref, computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import GamePausedOverlay from '@/components/GamePausedOverlay.uvue'
  import { useSession } from '@/stores/session'
  import { createWheelGame, type WheelGame, type WheelSnapshot } from '@/games/wheel/logic'
  import { preload, play } from '@/native/audio'
  import { vibrateShort, vibrateLong } from '@/native/vibrator'
  import { keepAwake, releaseAwake } from '@/native/screen'
  import { GAME_SOUNDS } from '@/utils/game-sounds'

  const session = useSession()
  const game = ref<WheelGame | null>(null)
  const snap = ref<WheelSnapshot | null>(null)
  const paused = ref(false)

  let tickTimer : number | null = null
  let lastTickAt = 0

  const state = computed(() => snap.value?.state ?? 'collecting')

  function update() {
    snap.value = game.value!.getSnapshot()
  }

  function init() {
    const raw = session.playerCount > 0 ? session.playerCount : 2
    const count = Math.min(5, Math.max(2, raw))
    game.value = createWheelGame({ playerCount: count })
    update()
  }

  function onTouchStart(e : TouchEvent) {
    if (snap.value?.state !== 'collecting') return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      game.value?.addFinger(t.identifier as number)
    }
    update()
    const s = snap.value!
    if (s.state === 'spinning') {
      play('signal')
      vibrateShort()
      startLoop()
    }
  }

  function onTouchMove(_e : TouchEvent) {
    // 轮盘阶段不需要位置；保留 handler 以吃掉事件
  }

  function onTouchEnd(e : TouchEvent) {
    if (snap.value?.state !== 'collecting') return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      game.value?.removeFinger(t.identifier as number)
    }
    update()
  }

  function startLoop() {
    if (tickTimer != null) return
    lastTickAt = Date.now()
    tickTimer = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickAt
      lastTickAt = now
      game.value?.tick(delta)
      update()
      if (snap.value?.state === 'selected') onSelected()
    }, 50) as unknown as number
  }

  function stopLoop() {
    if (tickTimer != null) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function onSelected() {
    stopLoop()
    vibrateLong()
    play('lose')
  }

  function goResult() {
    const s = snap.value
    if (s == null || s.result == null) return
    session.loser = s.result.loser
    stopLoop()
    releaseAwake()
    uni.redirectTo({ url: '/pages/game/result' })
  }

  function onResume() { paused.value = false; onRestart() }

  function onRestart() {
    paused.value = false
    stopLoop()
    init()
  }

  function onExit() {
    paused.value = false
    stopLoop()
    releaseAwake()
    session.exitToLobby()
    uni.redirectTo({ url: '/pages/lobby/games' })
  }

  onLoad(() => {
    preload(GAME_SOUNDS)
    keepAwake()
    init()
  })

  onUnload(() => {
    stopLoop()
    releaseAwake()
  })

  onHide(() => {
    if (snap.value?.state !== 'selected') {
      stopLoop()
      paused.value = true
    }
  })
</script>

<style>
  .container {
    padding: 20px;
    min-height: 100vh;
    align-items: center;
    background-color: var(--bg, #FFF5EB);
  }
  .big { font-size: 64px; }
  .title { font-size: 22px; font-weight: bold; margin-top: 4px; }
  .wheel {
    width: 320px;
    height: 320px;
    border-radius: 160px;
    margin: 24px 0;
    background-color: var(--bg-end, #FFE5F1);
    align-items: center;
    justify-content: center;
  }
  .wheel-emoji { font-size: 100px; }
  .collect-hint {
    margin-top: 12px;
    text-align: center;
    color: var(--text-muted, #7A6A87);
  }
  .spin-hint {
    margin-top: 12px;
    font-size: 18px;
    font-weight: bold;
    color: var(--primary, #FF6B9D);
  }
  .result-hint {
    margin-top: 12px;
    font-size: 20px;
    font-weight: bold;
    color: var(--danger, #FF6B9D);
    text-align: center;
  }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组新增：
```json
{
  "path": "pages/game/wheel/index",
  "style": { "navigationBarTitleText": "指尖大轮盘" }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/game/wheel/index.uvue pages.json
git commit -m "feat(game-ui): 指尖大轮盘 UI 页（多指收集 + 旋转选中）"
```

---

### Task 3.6 · 👆 同屏反应大比拼 UI

**Spec 对齐（§5.4）：**
- 屏幕按人数等分；每人按住一个区域。
- 全员按齐后进 armed，3-10s 后发出信号。
- 信号前松开 = 抢跑立输；信号后最后松开 = 输。

**Files:**
- Create: `pages/game/reaction/index.uvue`
- Modify: `pages.json`

- [ ] **Step 1: 创建同屏反应页面**

写入 `pages/game/reaction/index.uvue`：
```vue
<template>
  <view
    class="container"
    :class="{
      armed: state === 'armed',
      signal: state === 'signal',
      falseStart: falseStart,
      resolved: state === 'resolved'
    }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <text class="title">👆 同屏反应大比拼</text>

    <view v-if="state === 'collecting'" class="hint-box">
      <text class="hint-big">
        请 {{ session.playerCount }} 位玩家各用一根手指按住屏幕
      </text>
      <text class="hint-small">
        当前：{{ snap?.fingerIds?.length ?? 0 }} / {{ session.playerCount }}
      </text>
    </view>

    <view v-else-if="state === 'armed'" class="hint-box">
      <text class="hint-big">👀 所有人保持按住，等待信号…</text>
      <text class="hint-small">抢先松手 = 立即输</text>
    </view>

    <view v-else-if="state === 'signal'" class="hint-box">
      <text class="signal-big">⚡ 现在！松手！</text>
      <text class="hint-small">最后松手的人输</text>
    </view>

    <view v-else-if="state === 'resolved'" class="hint-box">
      <text class="loser-big">
        {{ falseStart ? '抢跑' : '最后松手' }}：{{ session.displayNameOf(snap?.result?.loser ?? 0) }}
      </text>
      <AppButton label="查看结果" variant="primary" @tap="goResult" />
    </view>

    <AppButton v-if="state !== 'signal'" label="返回大厅" variant="ghost" @tap="onExit" />

    <GamePausedOverlay
      :visible="paused"
      desc="已暂停（切后台会重置本局）"
      @resume="onResume"
      @restart="onRestart"
      @exit="onExit"
    />
  </view>
</template>

<script setup lang="uts">
  import { ref, computed } from 'vue'
  import AppButton from '@/components/AppButton.uvue'
  import GamePausedOverlay from '@/components/GamePausedOverlay.uvue'
  import { useSession } from '@/stores/session'
  import {
    createReactionGame,
    type ReactionGame,
    type ReactionSnapshot
  } from '@/games/reaction/logic'
  import { preload, play } from '@/native/audio'
  import { vibrateShort, vibrateLong } from '@/native/vibrator'
  import { keepAwake, releaseAwake } from '@/native/screen'
  import { GAME_SOUNDS } from '@/utils/game-sounds'

  const session = useSession()
  const game = ref<ReactionGame | null>(null)
  const snap = ref<ReactionSnapshot | null>(null)
  const paused = ref(false)
  const falseStart = ref(false)

  let tickTimer : number | null = null
  let lastTickAt = 0

  const state = computed(() => snap.value?.state ?? 'collecting')

  function update() {
    snap.value = game.value!.getSnapshot()
  }

  function init() {
    falseStart.value = false
    const raw = session.playerCount > 0 ? session.playerCount : 2
    const count = Math.min(5, Math.max(2, raw))
    game.value = createReactionGame({ playerCount: count })
    update()
    stopLoop()
  }

  function onTouchStart(e : TouchEvent) {
    if (snap.value?.state !== 'collecting') return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      game.value?.addFinger(t.identifier as number)
    }
    update()
    if (snap.value?.state === 'armed') {
      play('click')
      vibrateShort()
      startLoop()
    }
  }

  function onTouchMove(_e : TouchEvent) {
    // 只关心触发边缘，不处理 move
  }

  function onTouchEnd(e : TouchEvent) {
    const s = snap.value
    if (s == null) return
    const wasArmed = s.state === 'armed'
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i]
      game.value?.removeFinger(t.identifier as number)
    }
    update()
    const after = snap.value!
    if (after.state === 'resolved') {
      falseStart.value = wasArmed
      stopLoop()
      vibrateLong()
      play('lose')
    }
  }

  function startLoop() {
    if (tickTimer != null) return
    lastTickAt = Date.now()
    tickTimer = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTickAt
      lastTickAt = now
      const before = snap.value?.state
      game.value?.tick(delta)
      update()
      if (before === 'armed' && snap.value?.state === 'signal') {
        play('signal')
        vibrateLong()
      }
    }, 50) as unknown as number
  }

  function stopLoop() {
    if (tickTimer != null) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  function goResult() {
    const s = snap.value
    if (s == null || s.result == null) return
    session.loser = s.result.loser
    stopLoop()
    releaseAwake()
    uni.redirectTo({ url: '/pages/game/result' })
  }

  function onResume() { paused.value = false; onRestart() }

  function onRestart() {
    paused.value = false
    init()
  }

  function onExit() {
    paused.value = false
    stopLoop()
    releaseAwake()
    session.exitToLobby()
    uni.redirectTo({ url: '/pages/lobby/games' })
  }

  onLoad(() => {
    preload(GAME_SOUNDS)
    keepAwake()
    init()
  })

  onUnload(() => {
    stopLoop()
    releaseAwake()
  })

  onHide(() => {
    if (snap.value?.state !== 'resolved') {
      stopLoop()
      paused.value = true
    }
  })
</script>

<style>
  .container {
    padding: 20px;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    background-color: var(--bg, #FFF5EB);
  }
  .container.armed { background-color: #FFE9C7; }
  .container.signal { background-color: #7ED957; }
  .container.falseStart { background-color: #FFB0B0; }
  .container.resolved { background-color: var(--bg-end, #FFE5F1); }
  .title { font-size: 22px; font-weight: bold; margin-bottom: 24px; }
  .hint-box { align-items: center; }
  .hint-big {
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    color: var(--text, #3D2F4F);
  }
  .hint-small {
    margin-top: 8px;
    color: var(--text-muted, #7A6A87);
    text-align: center;
  }
  .signal-big {
    font-size: 36px;
    font-weight: bold;
    color: #FFFFFF;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .loser-big {
    font-size: 22px;
    font-weight: bold;
    color: var(--danger, #FF6B9D);
    margin: 16px 0;
    text-align: center;
  }
</style>
```

- [ ] **Step 2: 注册路由**

在 `pages.json` 的 `pages` 数组新增：
```json
{
  "path": "pages/game/reaction/index",
  "style": { "navigationBarTitleText": "同屏反应" }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/game/reaction/index.uvue pages.json
git commit -m "feat(game-ui): 同屏反应 UI 页（多指 + 抢跑 + 最后松手判负）"
```

---

### Task 3.7 · 更新大厅/结算导航 + 清理 placeholder

> 把 Plan 1 里指向 `pages/game/placeholder` 的两处跳转改为具体游戏路径，并删除 placeholder 页。

**Files:**
- Modify: `pages/lobby/games.uvue`
- Modify: `pages/game/result.uvue`
- Modify: `pages.json`
- Delete: `pages/game/placeholder.uvue`

- [ ] **Step 1: 改大厅跳转**

打开 `pages/lobby/games.uvue`，把 `enter(g)` 整体替换为：
```ts
function enter(g : GameMeta) {
  if (!canPlay(g)) return
  session.currentGame = g.id
  const pathMap : Record<GameId, string> = {
    'bomb':        '/pages/game/bomb/index',
    'crocodile':   '/pages/game/crocodile/index',
    'horse-race':  '/pages/game/horse-race/index',
    'wheel':       '/pages/game/wheel/index',
    'reaction':    '/pages/game/reaction/index'
  }
  uni.navigateTo({ url: pathMap[g.id] })
}
```

- [ ] **Step 2: 改结算页"再来一局"跳转**

打开 `pages/game/result.uvue`，把 `restart()` 整体替换为：
```ts
function restart() {
  session.restartGame()
  const id = session.currentGame
  if (id == null) {
    uni.redirectTo({ url: '/pages/lobby/games' })
    return
  }
  const pathMap : Record<GameId, string> = {
    'bomb':        '/pages/game/bomb/index',
    'crocodile':   '/pages/game/crocodile/index',
    'horse-race':  '/pages/game/horse-race/index',
    'wheel':       '/pages/game/wheel/index',
    'reaction':    '/pages/game/reaction/index'
  }
  uni.redirectTo({ url: pathMap[id] })
}
```

并在 `result.uvue` 的 `<script setup>` 顶部补充导入：
```ts
import type { GameId } from '@/stores/session'
```

- [ ] **Step 3: 删除 placeholder 路由**

编辑 `pages.json`，删除如下条目：
```json
{
  "path": "pages/game/placeholder",
  "style": { "navigationBarTitleText": "游戏" }
}
```

- [ ] **Step 4: 删除 placeholder 文件**

```bash
git rm pages/game/placeholder.uvue
```
Expected: 文件被移除并加入暂存。

- [ ] **Step 5: 跑一次单测**

```bash
pnpm test
```
Expected: 所有已有单测继续 PASS（没有引用 placeholder 页的测试）。

- [ ] **Step 6: Commit**

```bash
git add pages/lobby/games.uvue pages/game/result.uvue pages.json
git commit -m "feat(nav): 大厅/结算跳转到具体游戏页，移除 placeholder"
```

---

### Task 3.8 · 真机冒烟测试 + 收尾

> 本任务无代码改动，按清单逐项在真机上实测。若出现失败项，在本文件末尾新增 Task 3.9+ 跟进。

**Files:** 无

- [ ] **Step 1: 编译到鸿蒙真机**

在 HBuilderX 中：`运行 → 运行到手机或模拟器 → 鸿蒙`。
Expected: 真机启动应用，进入首页（或首启引导后进入首页）。

- [ ] **Step 2: 💣 定时炸弹全流程**

1. 首页 → 开始玩 → 选 4 人 → 跳过名字。
2. 大厅 → 点 💣。
3. 页面显示 💣 emoji + 剪引线按钮。
4. 连续点 30 次引线观察是否提前爆炸；或静待 30-90s 看是否自动爆炸。
5. 爆炸 → 出现 4 个玩家认领按钮 → 任选一个。
6. 跳转到结算页 → 显示输家名字 + 占位惩罚。
Expected: 上述流程无崩溃。音效/振动若文件缺失可静默，不影响流程。

- [ ] **Step 3: 🐊 鳄鱼拔牙全流程**

1. 结算页 → 换游戏 → 大厅 → 点 🐊。
2. 显示 8 颗（4 人配置）牙 + 当前玩家指示。
3. 点任意未按过的牙，看轮次是否递增（玩家 1 → 2 → 3 → 4 → 1）。
4. 继续点直到触发陷阱 → 看到"咔嚓"提示 → 查看结果 → 结算页。
Expected: 陷阱在随机位置；已按过的牙变灰无法再按；跨玩家轮次正确。

- [ ] **Step 4: 🐎 摇一摇赛马全流程（2 人最快验）**

1. 回首页 → 开始玩 → 选 2 人 → 跳过 → 大厅 → 点 🐎。
2. "轮到 玩家 1" → 点"开始摇" → 3 秒倒计时 → 摇晃手机 → 看次数增长 → 10 秒后自动切换到玩家 2。
3. 玩家 2 重复流程。
4. 全员完成后显示胜负 → 查看结果 → 结算页。
Expected: 加速度订阅有效；峰值计数稳定；"提前结束本轮"按钮可用。

- [ ] **Step 5: 🎯 指尖大轮盘全流程（2 人）**

1. 首页 → 选 2 人 → 大厅 → 点 🎯。
2. 两根手指同时按在圆盘上。
3. 自动进入"旋转中…" 2-3 秒 → 选中其中一根 → 显示输家。
4. 查看结果 → 结算页。
Expected: 多指检测有效（至少 2 根）；旋转动画不卡；选中结果随机。

- [ ] **Step 6: 👆 同屏反应全流程（2 人）**

1. 首页 → 选 2 人 → 大厅 → 点 👆。
2. 两根手指按住屏幕 → armed → 屏幕变为浅色。
3. 测试抢跑：armed 状态下立即松一根 → 进入 resolved，显示"抢跑：玩家 X"。
4. 再来一局，armed 正常保持 → 等信号（屏幕变绿 + 声/震） → 最后松开的一位输。
Expected: 抢跑与最后松手判定均正确。

- [ ] **Step 7: 人数边界 · 置灰**

1. 首页 → 选 7 人 → 大厅。
2. 🎯 与 👆 两张卡应置灰且显示"最多 5 人"，其他 3 张可点。
Expected: canPlay/disabledReason 工作正常。

- [ ] **Step 8: 暂停/恢复**

1. 进入 💣 → 正在 ticking → 按 Home 键回桌面。
2. 切回应用 → 出现暂停遮罩 → 点"继续"应恢复 tick。
3. 再切出切回 → 点"重来本局"应重新倒计时。
4. 再切出切回 → 点"回大厅"应回到大厅。
Expected: 三条路径均工作，tick 不会在后台运行（回来看剩余时间应接近离开时）。

- [ ] **Step 9: 回归单测**

```bash
pnpm test
```
Expected: Plan 1 + Plan 2 的所有单测继续 PASS，0 个失败。

- [ ] **Step 10: Commit 结束标签**

```bash
git commit --allow-empty -m "chore: Phase 3 游戏 UI 接入完成（5 款全流程跑通）"
git tag v0.3.0-game-ui
```

---

## Self-Review 小结

- **Spec 覆盖**：
  - §5.2 炸弹 → Task 3.2（UI 绑定 logic、剪引线、爆炸认领）
  - §5.3 鳄鱼 → Task 3.3（牙齿网格、轮次、陷阱咬合）
  - §5.1 赛马 → Task 3.4（加速度订阅、峰值触发振动、10s 自动切换）
  - §5.5 轮盘 → Task 3.5（多指收集、旋转、选中）
  - §5.4 反应 → Task 3.6（多指、armed/signal、抢跑 / 最后松手）
  - §5.6 Session 使用 → 所有页面通过 `session.loser = ...` + `uni.redirectTo('/pages/game/result')`
  - §7 原生能力接入 → 所有页面使用 `sensor/vibrator/audio/screen/multitouch` 封装
  - §8 错误处理 → 暂停遮罩（onHide）覆盖切后台/来电；原生能力失败由 `native/*` 内部 try/catch 静默降级

- **类型一致性**：
  - 5 款游戏 ID 使用 `GameId` 类型（`bomb / crocodile / horse-race / wheel / reaction`），与 `stores/session.ts` 及 `pages/lobby/games.uvue` 保持一致。
  - 所有工厂使用 `createXxxGame({ playerCount, random?, ... })`，snapshot 名字统一 `XxxSnapshot`，方法名：`start`（crocodile/bomb）、`startPlayer`（horse-race）、`addFinger` / `removeFinger`（wheel/reaction）、`tick` 所有带时间的。
  - 音效 ID 在 `utils/game-sounds.ts` 统一定义，所有页面引用同一常量。

- **与 Plan 1/2 不冲突**：
  - `session.ts`、`settings.ts`、`themes`、`AppButton`、`GameTile` 均沿用 Plan 1 的实现；暂停遮罩新增为 Plan 3 的共享组件。
  - 所有 `logic.ts` 继续由 Plan 2 的纯函数实现驱动；UI 只读 snapshot + 调 action。

- **无占位符**：每个 Task 都有完整代码块和明确命令；所有状态分支都显式处理；没有"TODO / 待补充"。

---

## 附录 · Plan 4+ 预览

- **Plan 4 · 惩罚库**：
  - `stores/punishment.ts`（读取/写入 `punishments` 存储键、合并内置）
  - `data/builtin-punishments.json`（25 条内置）
  - `pages/punishment/index.uvue` 正式实现（列表/新增/编辑/启停/删除）
  - `utils/pick-punishment.ts` + 单测
  - `pages/game/result.uvue` 改为从 store 抽取而非 placeholder 数组
- **Plan 5 · 视觉与音效**：双主题插画素材、动画、完整音效包、字体。
- **Plan 6 · 打包与签名**：鸿蒙签名、AppGallery 审核素材、发包。
