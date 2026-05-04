# 新增三款聚会游戏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增疯狂拔河、数字炸弹、指尖扭扭乐三款单机聚会小游戏，并完整接入大厅、路由、会话、结算、音效、振动、屏幕常亮和单元测试。

**Architecture:** 延续当前“纯逻辑状态机 + UVue 页面交互 + Pinia 会话”的分层方式。三款游戏各自拥有 `games/<id>/logic.ts` 和 `pages/game/<id>/index.uvue`，共享能力只补充到 `native/multitouch.ts`，避免引入通用游戏引擎。

**Tech Stack:** uni-app x、UVue、UTS、TypeScript strict、Pinia、Vitest

---

## 规范与现状

- 设计规范：`docs/superpowers/specs/2026-04-26-new-party-games-design.md`
- 当前游戏元数据：`ui/games.ts`
- 当前路由：`pages.json`
- 当前会话类型：`stores/session.ts`
- 当前结算页：`pages/game/result.uvue`
- 当前纯逻辑模式：`games/bomb/logic.ts`、`games/reaction/logic.ts`、`games/wheel/logic.ts`
- 当前测试模式：`tests/games/*.test.ts`、`tests/ui/games.test.ts`

`Serena` 和 `Sequential-Thinking` 在当前会话没有可调用工具入口。本计划按仓库规范降级使用 `rg`、文件阅读和本地结构化分析完成上下文确认。

## 文件结构

### 新建文件

- `games/number-bomb/logic.ts`：数字炸弹纯逻辑状态机。
- `games/tug-of-war/logic.ts`：疯狂拔河纯逻辑状态机。
- `games/finger-twister/logic.ts`：指尖扭扭乐纯逻辑状态机。
- `pages/game/number-bomb/index.uvue`：数字炸弹页面。
- `pages/game/tug-of-war/index.uvue`：疯狂拔河页面。
- `pages/game/finger-twister/index.uvue`：指尖扭扭乐页面。
- `tests/games/number-bomb.test.ts`：数字炸弹状态机测试。
- `tests/games/tug-of-war.test.ts`：疯狂拔河状态机测试。
- `tests/games/finger-twister.test.ts`：指尖扭扭乐状态机测试。

### 修改文件

- `stores/session.ts`：扩展 `GameId` 联合类型。
- `ui/games.ts`：新增三张大厅卡片、人数限制、分类、路由。
- `ui/icons.ts`：新增三个游戏图标 key，复用现有 SVG 资源。
- `pages.json`：新增三条游戏页路由。
- `pages/game/result.uvue`：支持三款新游戏“再来一局”跳转。
- `native/multitouch.ts`：补充触点归一化、半屏判断、圆形命中、点击节流工具。
- `tests/ui/games.test.ts`：覆盖新增大厅元数据和路由。
- `tests/stores/session.test.ts`：覆盖新增 `GameId` 类型赋值。
- `tests/native/multitouch.test.ts`：覆盖新增共享工具。
- `README.md`：将游戏数量和列表从 5 款更新为 8 款。

## 执行约定

1. 逻辑层不得调用 `uni.*`、`Date.now()`、`setInterval()`、`setTimeout()`；时间由页面传入 `tick(deltaMs)`，随机由 `RandomSource` 注入。
2. `getSnapshot()` 返回数组和对象拷贝，页面和测试不能通过快照污染内部状态。
3. 失败或无效输入在逻辑层静默保持状态，必要时通过 `inputError` 或 `failure` 暴露给页面。
4. `GameResult.loser` 使用 0-base 玩家索引。
5. 每个定向测试命令预期在 60 秒内完成。
6. 计划中的 `git commit` 是实施阶段动作；执行提交前按仓库危险操作规范取得明确确认。

---

### Task 1: 大厅、路由、会话类型接入

**Files:**
- Modify: `tests/ui/games.test.ts`
- Modify: `tests/stores/session.test.ts`
- Modify: `stores/session.ts`
- Modify: `ui/icons.ts`
- Modify: `ui/games.ts`
- Modify: `pages.json`
- Modify: `pages/game/result.uvue`
- Modify: `README.md`

- [ ] **Step 1: 写失败测试，覆盖新增游戏元数据和路由**

在 `tests/ui/games.test.ts` 追加以下用例：

```ts
it('新增数字炸弹、疯狂拔河、指尖扭扭乐并保持分类顺序', () => {
  expect(GAME_GROUPS[0].games.map((game) => game.id)).toEqual([
    'bomb',
    'number-bomb',
    'crocodile',
    'wheel'
  ])
  expect(GAME_GROUPS[1].games.map((game) => game.id)).toEqual([
    'horse-race',
    'reaction',
    'tug-of-war',
    'finger-twister'
  ])
})

it('新增游戏的人数限制符合设计', () => {
  const allGames = GAME_GROUPS.flatMap((group) => group.games)
  expect(allGames.find((game) => game.id === 'number-bomb')).toMatchObject({
    min: 2,
    max: 8,
    category: 'luck',
    fallbackIconKey: 'game-number-bomb'
  })
  expect(allGames.find((game) => game.id === 'tug-of-war')).toMatchObject({
    min: 2,
    max: 8,
    category: 'skill',
    fallbackIconKey: 'game-tug-of-war'
  })
  expect(allGames.find((game) => game.id === 'finger-twister')).toMatchObject({
    min: 2,
    max: 4,
    category: 'skill',
    fallbackIconKey: 'game-finger-twister'
  })
})

it('为三款新增游戏生成真实游戏页路由', () => {
  expect(getGameRoute('number-bomb')).toBe('/pages/game/number-bomb/index')
  expect(getGameRoute('tug-of-war')).toBe('/pages/game/tug-of-war/index')
  expect(getGameRoute('finger-twister')).toBe('/pages/game/finger-twister/index')
})
```

在 `tests/stores/session.test.ts` 追加以下用例：

```ts
it('currentGame 支持三款新增游戏 id', () => {
  const s = useSession()
  s.currentGame = 'number-bomb'
  expect(s.currentGame).toBe('number-bomb')
  s.currentGame = 'tug-of-war'
  expect(s.currentGame).toBe('tug-of-war')
  s.currentGame = 'finger-twister'
  expect(s.currentGame).toBe('finger-twister')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts tests/stores/session.test.ts
```

Expected: FAIL，错误包含 `number-bomb` 或 `game-number-bomb` 不存在。

- [ ] **Step 3: 扩展 `GameId` 类型**

将 `stores/session.ts` 中的 `GameId` 修改为：

```ts
export type GameId =
  | 'horse-race'
  | 'bomb'
  | 'number-bomb'
  | 'crocodile'
  | 'reaction'
  | 'tug-of-war'
  | 'finger-twister'
  | 'wheel'
```

- [ ] **Step 4: 新增图标 key，复用现有 SVG**

在 `ui/icons.ts` 的 `ICON_PATHS` 中加入：

```ts
  'game-number-bomb': '/static/icons/bomb.svg',
  'game-tug-of-war': '/static/icons/bolt.svg',
  'game-finger-twister': '/static/icons/hand.svg',
```

- [ ] **Step 5: 新增大厅元数据和路由**

在 `ui/games.ts` 的运气派 `games` 中，将 `bomb` 后面插入：

```ts
      {
        id: 'number-bomb',
        name: '数字炸弹',
        summary: '轮流猜数，猜中炸弹受罚',
        fallbackIconKey: 'game-number-bomb',
        min: 2,
        max: 8,
        category: 'luck',
        cover: ''
      },
```

在实力派 `games` 中，将 `reaction` 后面插入：

```ts
      {
        id: 'tug-of-war',
        name: '疯狂拔河',
        summary: '双人代表对点抢胜',
        fallbackIconKey: 'game-tug-of-war',
        min: 2,
        max: 8,
        category: 'skill',
        cover: ''
      },
      {
        id: 'finger-twister',
        name: '指尖扭扭乐',
        summary: '多人按圈，坚持到最后',
        fallbackIconKey: 'game-finger-twister',
        min: 2,
        max: 4,
        category: 'skill',
        cover: ''
      }
```

在 `GAME_ROUTES` 中加入：

```ts
  'number-bomb': '/pages/game/number-bomb/index',
  'tug-of-war': '/pages/game/tug-of-war/index',
  'finger-twister': '/pages/game/finger-twister/index',
```

- [ ] **Step 6: 新增页面路由**

在 `pages.json` 的 `pages/game/bomb/index` 后面插入：

```json
    {
      "path": "pages/game/number-bomb/index",
      "style": {
        "navigationBarTitleText": "数字炸弹"
      }
    },
    {
      "path": "pages/game/tug-of-war/index",
      "style": {
        "navigationBarTitleText": "疯狂拔河"
      }
    },
    {
      "path": "pages/game/finger-twister/index",
      "style": {
        "navigationBarTitleText": "指尖扭扭乐"
      }
    },
```

- [ ] **Step 7: 更新结算页再来一局路由**

将 `pages/game/result.uvue` 中的 `pathMap` 替换为：

```ts
    const pathMap : Record<GameId, string> = {
      'bomb':             '/pages/game/bomb/index',
      'number-bomb':      '/pages/game/number-bomb/index',
      'crocodile':        '/pages/game/crocodile/index',
      'horse-race':       '/pages/game/horse-race/index',
      'reaction':         '/pages/game/reaction/index',
      'tug-of-war':       '/pages/game/tug-of-war/index',
      'finger-twister':   '/pages/game/finger-twister/index',
      'wheel':            '/pages/game/wheel/index'
    }
```

- [ ] **Step 8: 更新 README 游戏列表**

将 `README.md` 中标题 `## 5 款游戏` 改为 `## 8 款游戏`，并将表格改为：

```md
| 类型 | 游戏 | 支持人数 |
|---|---|---|
| 🎲 运气派 | 💣 定时炸弹 | 2–8 |
| 🎲 运气派 | 🔢 数字炸弹 | 2–8 |
| 🎲 运气派 | 🐊 鳄鱼拔牙 | 2–16 |
| 🎲 运气派 | 🎯 指尖大轮盘 | 2–5 |
| ⚔️ 实力派 | 🐎 摇一摇赛马 | 2–8 |
| ⚔️ 实力派 | 👆 同屏反应大比拼 | 2–5 |
| ⚔️ 实力派 | ⚡ 疯狂拔河 | 2–8 |
| ⚔️ 实力派 | ✋ 指尖扭扭乐 | 2–4 |
```

- [ ] **Step 9: 运行接入测试确认通过**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts tests/stores/session.test.ts
```

Expected: PASS。

- [ ] **Step 10: Commit**

```bash
git add stores/session.ts ui/icons.ts ui/games.ts pages.json pages/game/result.uvue README.md tests/ui/games.test.ts tests/stores/session.test.ts
git commit -m "feat(games): 接入三款新游戏入口"
```

---

### Task 2: 共享触控与点击判定工具

**Files:**
- Modify: `tests/native/multitouch.test.ts`
- Modify: `native/multitouch.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/native/multitouch.test.ts` 追加：

```ts
import {
  normalizeTouchPoint,
  isPointInHalf,
  isPointInCircle,
  isClickAllowed
} from '@/native/multitouch'

describe('normalizeTouchPoint', () => {
  it('优先使用 identifier/clientX/clientY 归一化触点', () => {
    expect(normalizeTouchPoint({ identifier: 7, clientX: 12, clientY: 34 })).toEqual({
      id: 7,
      x: 12,
      y: 34
    })
  })

  it('缺少 identifier 时使用 id，缺少 client 坐标时使用 page 坐标', () => {
    expect(normalizeTouchPoint({ id: 3, pageX: 90, pageY: 120 })).toEqual({
      id: 3,
      x: 90,
      y: 120
    })
  })

  it('触点 id 或坐标不是有限数字时返回 undefined', () => {
    expect(normalizeTouchPoint({ clientX: 1, clientY: 2 })).toBeUndefined()
    expect(normalizeTouchPoint({ identifier: 1, clientX: Number.NaN, clientY: 2 })).toBeUndefined()
  })
})

describe('isPointInHalf', () => {
  it('红方只接收左半屏，蓝方只接收右半屏，中心线不归属任何一方', () => {
    expect(isPointInHalf({ id: 1, x: 49, y: 0 }, 100, 'red')).toBe(true)
    expect(isPointInHalf({ id: 1, x: 51, y: 0 }, 100, 'blue')).toBe(true)
    expect(isPointInHalf({ id: 1, x: 50, y: 0 }, 100, 'red')).toBe(false)
    expect(isPointInHalf({ id: 1, x: 50, y: 0 }, 100, 'blue')).toBe(false)
  })
})

describe('isPointInCircle', () => {
  it('圆内和圆边界命中，圆外不命中', () => {
    const circle = { x: 10, y: 10, radius: 5 }
    expect(isPointInCircle({ id: 1, x: 10, y: 10 }, circle)).toBe(true)
    expect(isPointInCircle({ id: 1, x: 15, y: 10 }, circle)).toBe(true)
    expect(isPointInCircle({ id: 1, x: 16, y: 10 }, circle)).toBe(false)
  })
})

describe('isClickAllowed', () => {
  it('首次点击允许，间隔不足拒绝，间隔足够允许', () => {
    expect(isClickAllowed(undefined, 100, 80)).toBe(true)
    expect(isClickAllowed(100, 150, 80)).toBe(false)
    expect(isClickAllowed(100, 180, 80)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/native/multitouch.test.ts
```

Expected: FAIL，错误包含 `normalizeTouchPoint` 未导出。

- [ ] **Step 3: 实现共享工具**

将 `native/multitouch.ts` 替换为：

```ts
export type TouchPoint = { id: number; x: number; y: number }
export type TouchHalf = 'red' | 'blue'

export type CircleHitArea = {
  x: number
  y: number
  radius: number
}

export type TouchLike = {
  identifier?: number
  id?: number
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  x?: number
  y?: number
}

export function diffTouches(
  prev: TouchPoint[],
  next: TouchPoint[]
): { added: TouchPoint[]; removed: TouchPoint[] } {
  const prevIds = new Set(prev.map((t) => t.id))
  const nextIds = new Set(next.map((t) => t.id))
  return {
    added: next.filter((t) => !prevIds.has(t.id)),
    removed: prev.filter((t) => !nextIds.has(t.id))
  }
}

function finiteNumber(value: number | undefined): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

export function normalizeTouchPoint(touch: TouchLike): TouchPoint | undefined {
  const id = finiteNumber(touch.identifier ?? touch.id)
  const x = finiteNumber(touch.clientX ?? touch.pageX ?? touch.x)
  const y = finiteNumber(touch.clientY ?? touch.pageY ?? touch.y)
  if (id === undefined || x === undefined || y === undefined) return undefined
  return { id, x, y }
}

export function isPointInHalf(point: TouchPoint, width: number, half: TouchHalf): boolean {
  if (width <= 0) return false
  const centerX = width / 2
  if (half === 'red') return point.x < centerX
  return point.x > centerX
}

export function isPointInCircle(point: TouchPoint, circle: CircleHitArea): boolean {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  return dx * dx + dy * dy <= circle.radius * circle.radius
}

export function isClickAllowed(
  lastClickAtMs: number | undefined,
  nowMs: number,
  minIntervalMs: number
): boolean {
  if (!Number.isFinite(nowMs)) return false
  if (lastClickAtMs === undefined) return true
  return nowMs - lastClickAtMs >= minIntervalMs
}
```

- [ ] **Step 4: 运行共享工具测试确认通过**

Run:

```bash
pnpm exec vitest run tests/native/multitouch.test.ts
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add native/multitouch.ts tests/native/multitouch.test.ts
git commit -m "feat(native): 补充触控命中工具"
```

---

### Task 3: 数字炸弹逻辑状态机

**Files:**
- Create: `tests/games/number-bomb.test.ts`
- Create: `games/number-bomb/logic.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/games/number-bomb.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { createNumberBombGame } from '@/games/number-bomb/logic'

describe('createNumberBombGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createNumberBombGame({ playerCount: 1 })).toThrow()
    expect(() => createNumberBombGame({ playerCount: 9 })).toThrow()
  })

  it('2-5 人默认 1-100，6-8 人默认 1-999', () => {
    expect(createNumberBombGame({ playerCount: 5 }).getSnapshot().preset).toBe('1-100')
    expect(createNumberBombGame({ playerCount: 6 }).getSnapshot().preset).toBe('1-999')
  })

  it('start 后进入 guessing，初始当前玩家为玩家 1', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    expect(game.getSnapshot()).toMatchObject({ state: 'guessing', currentPlayerIndex: 0 })
  })

  it('猜小更新下界并切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    expect(game.getSnapshot()).toMatchObject({
      displayMin: 40,
      exclusiveMin: 40,
      displayMax: 100,
      currentPlayerIndex: 1,
      state: 'guessing'
    })
  })

  it('猜大更新上界并切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(80)
    expect(game.getSnapshot()).toMatchObject({
      displayMin: 1,
      displayMax: 80,
      exclusiveMax: 80,
      currentPlayerIndex: 1,
      state: 'guessing'
    })
  })

  it('猜中进入 exploded 并记录当前玩家为输家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    game.submitGuess(60)
    expect(game.getSnapshot()).toMatchObject({
      state: 'exploded',
      result: { loser: 1 }
    })
  })

  it('非整数、越界、重复边界输入不切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    game.submitGuess(40)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
    game.submitGuess(40.5)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
    game.submitGuess(101)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
  })

  it('历史记录保留猜测前范围和玩家', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    expect(game.getSnapshot().guesses).toEqual([
      { playerIndex: 0, value: 40, rangeBefore: { min: 1, max: 100 } }
    ])
  })

  it('切换范围后重新生成数字并重置范围', () => {
    const game = createNumberBombGame({ playerCount: 6, random: () => 0 })
    game.setPreset('1-100')
    const snap = game.getSnapshot()
    expect(snap).toMatchObject({
      preset: '1-100',
      displayMin: 1,
      displayMax: 100,
      exclusiveMin: 0,
      exclusiveMax: 101
    })
  })

  it('快照返回拷贝', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    const snap = game.getSnapshot()
    snap.guesses[0].rangeBefore.min = 999
    snap.guesses.push({ playerIndex: 9, value: 9, rangeBefore: { min: 9, max: 9 } })
    expect(game.getSnapshot().guesses).toEqual([
      { playerIndex: 0, value: 40, rangeBefore: { min: 1, max: 100 } }
    ])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/games/number-bomb.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/games/number-bomb/logic'`。

- [ ] **Step 3: 实现数字炸弹逻辑**

创建 `games/number-bomb/logic.ts`：

```ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type NumberBombState = 'setup' | 'guessing' | 'exploded'
export type NumberBombPreset = '1-100' | '1-999'

export type NumberBombGuess = {
  playerIndex: number
  value: number
  rangeBefore: { min: number; max: number }
}

export type NumberBombSnapshot = {
  state: NumberBombState
  playerCount: number
  preset: NumberBombPreset
  displayMin: number
  displayMax: number
  exclusiveMin: number
  exclusiveMax: number
  currentPlayerIndex: number
  guesses: NumberBombGuess[]
  inputError?: string
  result?: GameResult
}

export type NumberBombGame = {
  getSnapshot(): NumberBombSnapshot
  setPreset(preset: NumberBombPreset): void
  start(): void
  submitGuess(value: number): void
}

function defaultPresetFor(playerCount: number): NumberBombPreset {
  return playerCount >= 6 ? '1-999' : '1-100'
}

function rangeOf(preset: NumberBombPreset): { min: number; max: number } {
  return preset === '1-999' ? { min: 1, max: 999 } : { min: 1, max: 100 }
}

function cloneGuess(guess: NumberBombGuess): NumberBombGuess {
  return {
    playerIndex: guess.playerIndex,
    value: guess.value,
    rangeBefore: { min: guess.rangeBefore.min, max: guess.rangeBefore.max }
  }
}

export function createNumberBombGame(opts: {
  playerCount: number
  random?: RandomSource
  preset?: NumberBombPreset
  bombNumber?: number
}): NumberBombGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  let state: NumberBombState = 'setup'
  let preset = opts.preset ?? defaultPresetFor(opts.playerCount)
  let displayMin = 1
  let displayMax = 100
  let exclusiveMin = 0
  let exclusiveMax = 101
  let bombNumber = 1
  let currentPlayerIndex = 0
  let guesses: NumberBombGuess[] = []
  let inputError: string | undefined
  let result: GameResult | undefined

  function resetRange(nextPreset: NumberBombPreset): void {
    preset = nextPreset
    const range = rangeOf(preset)
    displayMin = range.min
    displayMax = range.max
    exclusiveMin = range.min - 1
    exclusiveMax = range.max + 1
    bombNumber = opts.bombNumber ?? randomInt(random, range.min, range.max + 1)
    currentPlayerIndex = 0
    guesses = []
    inputError = undefined
    result = undefined
  }

  resetRange(preset)

  function reject(message: string): void {
    inputError = message
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        preset,
        displayMin,
        displayMax,
        exclusiveMin,
        exclusiveMax,
        currentPlayerIndex,
        guesses: guesses.map(cloneGuess),
        inputError,
        result
      }
    },
    setPreset(nextPreset: NumberBombPreset) {
      if (state !== 'setup') return
      resetRange(nextPreset)
    },
    start() {
      if (state === 'setup') state = 'guessing'
    },
    submitGuess(value: number) {
      if (state !== 'guessing') return
      if (!Number.isInteger(value)) {
        reject('请输入整数')
        return
      }
      if (value < displayMin || value > displayMax) {
        reject(`请输入 ${displayMin} 到 ${displayMax} 之间的数字`)
        return
      }
      if (value <= exclusiveMin || value >= exclusiveMax) {
        reject('这个数字已经被排除，请输入范围内的新数字')
        return
      }

      const rangeBefore = { min: displayMin, max: displayMax }
      guesses.push({ playerIndex: currentPlayerIndex, value, rangeBefore })
      inputError = undefined

      if (value === bombNumber) {
        state = 'exploded'
        result = { loser: currentPlayerIndex }
        return
      }

      if (value < bombNumber) {
        displayMin = value
        exclusiveMin = value
      } else {
        displayMax = value
        exclusiveMax = value
      }
      currentPlayerIndex = (currentPlayerIndex + 1) % opts.playerCount
    }
  }
}
```

- [ ] **Step 4: 运行数字炸弹测试确认通过**

Run:

```bash
pnpm exec vitest run tests/games/number-bomb.test.ts
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add games/number-bomb/logic.ts tests/games/number-bomb.test.ts
git commit -m "feat(games): 实现数字炸弹逻辑"
```

---

### Task 4: 疯狂拔河逻辑状态机

**Files:**
- Create: `tests/games/tug-of-war.test.ts`
- Create: `games/tug-of-war/logic.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/games/tug-of-war.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { createTugOfWarGame } from '@/games/tug-of-war/logic'

describe('createTugOfWarGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createTugOfWarGame({ playerCount: 1 })).toThrow()
    expect(() => createTugOfWarGame({ playerCount: 9 })).toThrow()
  })

  it('初始抽取红蓝代表且不能重复', () => {
    const game = createTugOfWarGame({ playerCount: 4, random: () => 0 })
    const rep = game.getSnapshot().representative
    expect(rep.redPlayerIndex).toBe(0)
    expect(rep.bluePlayerIndex).toBe(1)
  })

  it('可设置赛制和胜负条件后进入倒计时', () => {
    const game = createTugOfWarGame({ playerCount: 4 })
    game.setMode('best-of-three')
    game.setWinCondition('threshold')
    game.startRound()
    expect(game.getSnapshot()).toMatchObject({
      state: 'countdown',
      mode: 'best-of-three',
      winCondition: 'threshold'
    })
  })

  it('倒计时结束后进入 playing', () => {
    const game = createTugOfWarGame({ playerCount: 2 })
    game.startRound()
    game.tick(2999)
    expect(game.getSnapshot().state).toBe('countdown')
    game.tick(1)
    expect(game.getSnapshot().state).toBe('playing')
  })

  it('只有 playing 状态的己方半屏点击改变绳子位置', () => {
    const game = createTugOfWarGame({ playerCount: 2, clickForce: 0.2 })
    expect(game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)).toBe(false)
    game.startRound()
    game.tick(3000)
    expect(game.tap('red', { id: 1, x: 70, y: 0 }, 100, 0)).toBe(false)
    expect(game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)).toBe(true)
    expect(game.getSnapshot().ropePosition).toBeCloseTo(-0.2)
  })

  it('高频点击按最小间隔节流', () => {
    const game = createTugOfWarGame({ playerCount: 2, clickForce: 0.1, clickMinIntervalMs: 80 })
    game.startRound()
    game.tick(3000)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 100)).toBe(true)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 150)).toBe(false)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 180)).toBe(true)
    expect(game.getSnapshot().blueEffectiveClicks).toBe(2)
  })

  it('固定时长结束后按绳子位置判胜', () => {
    const game = createTugOfWarGame({ playerCount: 2, roundDurationMs: 1000, clickForce: 0.2 })
    game.startRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)
    game.tick(1000)
    expect(game.getSnapshot()).toMatchObject({
      state: 'matchResult',
      roundWinner: 'red',
      matchWinner: 'red'
    })
  })

  it('拉过终点模式达到阈值立即结束本局', () => {
    const game = createTugOfWarGame({ playerCount: 2, threshold: 0.3, clickForce: 0.2 })
    game.setWinCondition('threshold')
    game.startRound()
    game.tick(3000)
    game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 0)
    expect(game.getSnapshot().state).toBe('playing')
    game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 100)
    expect(game.getSnapshot()).toMatchObject({ state: 'matchResult', matchWinner: 'blue' })
  })

  it('三局两胜先到 2 分结束比赛', () => {
    const game = createTugOfWarGame({ playerCount: 2, roundDurationMs: 100, clickForce: 0.2 })
    game.setMode('best-of-three')
    game.startRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)
    game.tick(100)
    expect(game.getSnapshot()).toMatchObject({ state: 'roundResult', redScore: 1 })
    game.startNextRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 200)
    game.tick(100)
    expect(game.getSnapshot()).toMatchObject({ state: 'matchResult', redScore: 2, matchWinner: 'red' })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/games/tug-of-war.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/games/tug-of-war/logic'`。

- [ ] **Step 3: 实现疯狂拔河逻辑**

创建 `games/tug-of-war/logic.ts`：

```ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'
import { isClickAllowed, isPointInHalf, type TouchPoint } from '@/native/multitouch'

export type TugMatchMode = 'single' | 'best-of-three'
export type TugWinCondition = 'timed' | 'threshold'
export type TugSide = 'red' | 'blue'
export type TugState = 'setup' | 'countdown' | 'playing' | 'roundResult' | 'matchResult'

export type TugRepresentative = {
  redPlayerIndex: number
  bluePlayerIndex: number
}

export type TugSnapshot = {
  state: TugState
  mode: TugMatchMode
  winCondition: TugWinCondition
  representative: TugRepresentative
  roundIndex: number
  redScore: number
  blueScore: number
  ropePosition: number
  redEffectiveClicks: number
  blueEffectiveClicks: number
  countdownRemainingMs: number
  roundElapsedMs: number
  roundDurationMs: number
  roundWinner?: TugSide
  matchWinner?: TugSide
  result?: GameResult
}

export type TugOfWarGame = {
  getSnapshot(): TugSnapshot
  rerollRepresentatives(): void
  setMode(mode: TugMatchMode): void
  setWinCondition(condition: TugWinCondition): void
  startRound(): void
  startNextRound(): void
  tap(side: TugSide, point: TouchPoint, screenWidth: number, nowMs: number): boolean
  tick(deltaMs: number): void
}

const COUNTDOWN_MS = 3000
const DEFAULT_ROUND_DURATION_MS = 10000
const DEFAULT_THRESHOLD = 0.85
const DEFAULT_CLICK_FORCE = 0.035
const DEFAULT_CLICK_MIN_INTERVAL_MS = 70

function opposite(side: TugSide): TugSide {
  return side === 'red' ? 'blue' : 'red'
}

function clampRope(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

export function createTugOfWarGame(opts: {
  playerCount: number
  random?: RandomSource
  roundDurationMs?: number
  threshold?: number
  clickForce?: number
  clickMinIntervalMs?: number
}): TugOfWarGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  const roundDurationMs = opts.roundDurationMs ?? DEFAULT_ROUND_DURATION_MS
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD
  const clickForce = opts.clickForce ?? DEFAULT_CLICK_FORCE
  const clickMinIntervalMs = opts.clickMinIntervalMs ?? DEFAULT_CLICK_MIN_INTERVAL_MS

  let state: TugState = 'setup'
  let mode: TugMatchMode = 'single'
  let winCondition: TugWinCondition = 'timed'
  let representative = pickRepresentatives()
  let roundIndex = 1
  let redScore = 0
  let blueScore = 0
  let ropePosition = 0
  let redEffectiveClicks = 0
  let blueEffectiveClicks = 0
  let countdownRemainingMs = COUNTDOWN_MS
  let roundElapsedMs = 0
  let roundWinner: TugSide | undefined
  let matchWinner: TugSide | undefined
  let result: GameResult | undefined
  let lastRedClickAtMs: number | undefined
  let lastBlueClickAtMs: number | undefined

  function pickRepresentatives(): TugRepresentative {
    const redPlayerIndex = randomInt(random, 0, opts.playerCount)
    let bluePlayerIndex = randomInt(random, 0, opts.playerCount - 1)
    if (bluePlayerIndex >= redPlayerIndex) bluePlayerIndex++
    return { redPlayerIndex, bluePlayerIndex }
  }

  function resetRoundRuntime(): void {
    ropePosition = 0
    redEffectiveClicks = 0
    blueEffectiveClicks = 0
    countdownRemainingMs = COUNTDOWN_MS
    roundElapsedMs = 0
    roundWinner = undefined
    lastRedClickAtMs = undefined
    lastBlueClickAtMs = undefined
  }

  function decideTieWinner(): TugSide {
    if (redEffectiveClicks > blueEffectiveClicks) return 'red'
    if (blueEffectiveClicks > redEffectiveClicks) return 'blue'
    return randomInt(random, 0, 2) === 0 ? 'red' : 'blue'
  }

  function decideTimedWinner(): TugSide {
    if (ropePosition < 0) return 'red'
    if (ropePosition > 0) return 'blue'
    return decideTieWinner()
  }

  function finishRound(winner: TugSide): void {
    roundWinner = winner
    if (winner === 'red') redScore++
    else blueScore++

    const targetScore = mode === 'best-of-three' ? 2 : 1
    if (redScore >= targetScore || blueScore >= targetScore) {
      matchWinner = winner
      const loserSide = opposite(winner)
      result = {
        loser: loserSide === 'red'
          ? representative.redPlayerIndex
          : representative.bluePlayerIndex
      }
      state = 'matchResult'
      return
    }

    state = 'roundResult'
  }

  return {
    getSnapshot() {
      return {
        state,
        mode,
        winCondition,
        representative: { ...representative },
        roundIndex,
        redScore,
        blueScore,
        ropePosition,
        redEffectiveClicks,
        blueEffectiveClicks,
        countdownRemainingMs,
        roundElapsedMs,
        roundDurationMs,
        roundWinner,
        matchWinner,
        result
      }
    },
    rerollRepresentatives() {
      if (state !== 'setup') return
      representative = pickRepresentatives()
    },
    setMode(nextMode: TugMatchMode) {
      if (state !== 'setup') return
      mode = nextMode
    },
    setWinCondition(condition: TugWinCondition) {
      if (state !== 'setup') return
      winCondition = condition
    },
    startRound() {
      if (state !== 'setup' && state !== 'roundResult') return
      resetRoundRuntime()
      state = 'countdown'
    },
    startNextRound() {
      if (state !== 'roundResult') return
      roundIndex++
      resetRoundRuntime()
      state = 'countdown'
    },
    tap(side: TugSide, point: TouchPoint, screenWidth: number, nowMs: number) {
      if (state !== 'playing') return false
      if (!isPointInHalf(point, screenWidth, side)) return false

      const lastClickAt = side === 'red' ? lastRedClickAtMs : lastBlueClickAtMs
      if (!isClickAllowed(lastClickAt, nowMs, clickMinIntervalMs)) return false

      if (side === 'red') {
        lastRedClickAtMs = nowMs
        redEffectiveClicks++
        ropePosition = clampRope(ropePosition - clickForce)
      } else {
        lastBlueClickAtMs = nowMs
        blueEffectiveClicks++
        ropePosition = clampRope(ropePosition + clickForce)
      }

      if (winCondition === 'threshold' && Math.abs(ropePosition) >= threshold) {
        finishRound(ropePosition < 0 ? 'red' : 'blue')
      }

      return true
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state === 'countdown') {
        countdownRemainingMs = Math.max(0, countdownRemainingMs - deltaMs)
        if (countdownRemainingMs === 0) state = 'playing'
        return
      }
      if (state !== 'playing') return
      roundElapsedMs += deltaMs
      if (winCondition === 'timed' && roundElapsedMs >= roundDurationMs) {
        roundElapsedMs = roundDurationMs
        finishRound(decideTimedWinner())
      }
    }
  }
}
```

- [ ] **Step 4: 运行疯狂拔河测试确认通过**

Run:

```bash
pnpm exec vitest run tests/games/tug-of-war.test.ts tests/native/multitouch.test.ts
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add games/tug-of-war/logic.ts tests/games/tug-of-war.test.ts
git commit -m "feat(games): 实现疯狂拔河逻辑"
```

---

### Task 5: 指尖扭扭乐逻辑状态机

**Files:**
- Create: `tests/games/finger-twister.test.ts`
- Create: `games/finger-twister/logic.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/games/finger-twister.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { createFingerTwisterGame } from '@/games/finger-twister/logic'

describe('createFingerTwisterGame', () => {
  it('要求人数 2-4', () => {
    expect(() => createFingerTwisterGame({ playerCount: 1 })).toThrow()
    expect(() => createFingerTwisterGame({ playerCount: 5 })).toThrow()
  })

  it('start 后生成第一条任务，前期优先每位玩家第 1 根手指', () => {
    const game = createFingerTwisterGame({ playerCount: 3, random: () => 0, width: 360, height: 640 })
    game.start()
    const task = game.getSnapshot().currentTask!
    expect(game.getSnapshot().state).toBe('prompt')
    expect(task.playerIndex).toBe(0)
    expect(task.fingerNumber).toBe(1)
  })

  it('新触点按中当前目标后绑定任务', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    expect(game.addTouch(11, { id: 11, x: circle.x, y: circle.y })).toBe(true)
    expect(game.getSnapshot().assignments).toHaveLength(1)
    expect(game.getSnapshot().state).toBe('holding')
  })

  it('未按中目标不绑定任务', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    expect(game.addTouch(11, { id: 11, x: 0, y: 0 })).toBe(false)
    expect(game.getSnapshot().assignments).toEqual([])
    expect(game.getSnapshot().state).toBe('prompt')
  })

  it('已绑定触点离开立即失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    game.releaseTouch(11)
    expect(game.getSnapshot()).toMatchObject({
      state: 'failed',
      failure: { playerIndex: 0, reason: 'released' },
      result: { loser: 0 }
    })
  })

  it('当前任务超时立即失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, taskTimeLimitMs: 1000 })
    game.start()
    game.tick(999)
    expect(game.getSnapshot().state).toBe('prompt')
    game.tick(1)
    expect(game.getSnapshot()).toMatchObject({
      state: 'failed',
      failure: { playerIndex: 0, reason: 'timeout' },
      result: { loser: 0 }
    })
  })

  it('未知触点离开不会误判已有玩家失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    game.releaseTouch(99)
    expect(game.getSnapshot().state).toBe('holding')
  })

  it('任务生成不超过 6 个总触点，同一玩家最多 2 根手指', () => {
    const game = createFingerTwisterGame({ playerCount: 4, random: () => 0, width: 360, height: 640 })
    game.start()
    for (let i = 0; i < 6; i++) {
      const task = game.getSnapshot().currentTask!
      game.addTouch(100 + i, { id: 100 + i, x: task.circle.x, y: task.circle.y })
      game.promptNext()
    }
    const assignments = game.getSnapshot().assignments
    expect(assignments).toHaveLength(6)
    for (let player = 0; player < 4; player++) {
      expect(assignments.filter((item) => item.playerIndex === player).length).toBeLessThanOrEqual(2)
    }
  })

  it('快照返回深拷贝', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    const snap = game.getSnapshot()
    snap.assignments[0].circle.x = 999
    snap.assignments.push({
      taskId: 'x',
      playerIndex: 9,
      fingerNumber: 9,
      touchId: 9,
      circle: { id: 'x', color: '#fff', x: 0, y: 0, radius: 1 }
    })
    expect(game.getSnapshot().assignments).toHaveLength(1)
    expect(game.getSnapshot().assignments[0].circle.x).toBe(circle.x)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/games/finger-twister.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/games/finger-twister/logic'`。

- [ ] **Step 3: 实现指尖扭扭乐逻辑**

创建 `games/finger-twister/logic.ts`：

```ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'
import { isPointInCircle, type TouchPoint } from '@/native/multitouch'

export type FingerTwisterState = 'setup' | 'prompt' | 'holding' | 'failed'
export type FingerTwisterFailureReason = 'released' | 'timeout'

export type FingerTwisterCircle = {
  id: string
  color: string
  x: number
  y: number
  radius: number
}

export type FingerTwisterTask = {
  id: string
  playerIndex: number
  fingerNumber: number
  circle: FingerTwisterCircle
  timeLimitMs: number
  elapsedMs: number
}

export type FingerAssignment = {
  taskId: string
  playerIndex: number
  fingerNumber: number
  touchId: number
  circle: FingerTwisterCircle
}

export type FingerTwisterSnapshot = {
  state: FingerTwisterState
  playerCount: number
  currentTask?: FingerTwisterTask
  assignments: FingerAssignment[]
  maxTouches: number
  failure?: {
    playerIndex: number
    reason: FingerTwisterFailureReason
  }
  result?: GameResult
}

export type FingerTwisterGame = {
  getSnapshot(): FingerTwisterSnapshot
  start(): void
  promptNext(): void
  addTouch(touchId: number, point: TouchPoint): boolean
  releaseTouch(touchId: number): void
  tick(deltaMs: number): void
}

const COLORS = ['#26D6FF', '#76E06B', '#FF5DA2', '#FFD166', '#FF8A3D', '#B88CFF']
const DEFAULT_WIDTH = 360
const DEFAULT_HEIGHT = 640
const DEFAULT_RADIUS = 42
const DEFAULT_TIME_LIMIT_MS = 5000
const DEFAULT_MAX_TOUCHES = 6

function cloneCircle(circle: FingerTwisterCircle): FingerTwisterCircle {
  return { ...circle }
}

function cloneTask(task: FingerTwisterTask): FingerTwisterTask {
  return { ...task, circle: cloneCircle(task.circle) }
}

function cloneAssignment(item: FingerAssignment): FingerAssignment {
  return { ...item, circle: cloneCircle(item.circle) }
}

export function createFingerTwisterGame(opts: {
  playerCount: number
  random?: RandomSource
  width?: number
  height?: number
  circleRadius?: number
  taskTimeLimitMs?: number
  maxTouches?: number
}): FingerTwisterGame {
  if (opts.playerCount < 2 || opts.playerCount > 4) {
    throw new Error(`playerCount must be 2-4, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  const width = opts.width ?? DEFAULT_WIDTH
  const height = opts.height ?? DEFAULT_HEIGHT
  const radius = opts.circleRadius ?? DEFAULT_RADIUS
  const taskTimeLimitMs = opts.taskTimeLimitMs ?? DEFAULT_TIME_LIMIT_MS
  const maxTouches = Math.min(opts.maxTouches ?? DEFAULT_MAX_TOUCHES, DEFAULT_MAX_TOUCHES)
  const fingerCounts = Array.from({ length: opts.playerCount }, () => 0)

  let state: FingerTwisterState = 'setup'
  let currentTask: FingerTwisterTask | undefined
  let assignments: FingerAssignment[] = []
  let failure: FingerTwisterSnapshot['failure']
  let result: GameResult | undefined
  let taskSeq = 0

  function nextPlayerIndex(): number | undefined {
    for (let target = 1; target <= 2; target++) {
      const index = fingerCounts.findIndex((count) => count < target)
      if (index !== -1) return index
    }
    return undefined
  }

  function makeCircle(): FingerTwisterCircle {
    const margin = radius + 12
    const minX = margin
    const maxX = Math.max(minX, width - margin)
    const minY = margin + 72
    const maxY = Math.max(minY, height - margin)

    let x = minX
    let y = minY
    for (let attempt = 0; attempt < 12; attempt++) {
      x = randomInt(random, minX, maxX + 1)
      y = randomInt(random, minY, maxY + 1)
      const clear = assignments.every((item) => {
        const dx = item.circle.x - x
        const dy = item.circle.y - y
        return dx * dx + dy * dy >= (radius * 2 + 12) * (radius * 2 + 12)
      })
      if (clear) break
    }

    const id = `circle-${taskSeq}`
    return {
      id,
      color: COLORS[taskSeq % COLORS.length],
      x,
      y,
      radius
    }
  }

  function createTask(): void {
    if (assignments.length >= maxTouches) {
      currentTask = undefined
      state = 'holding'
      return
    }
    const playerIndex = nextPlayerIndex()
    if (playerIndex === undefined) {
      currentTask = undefined
      state = 'holding'
      return
    }
    taskSeq++
    currentTask = {
      id: `task-${taskSeq}`,
      playerIndex,
      fingerNumber: fingerCounts[playerIndex] + 1,
      circle: makeCircle(),
      timeLimitMs: taskTimeLimitMs,
      elapsedMs: 0
    }
    state = 'prompt'
  }

  function fail(playerIndex: number, reason: FingerTwisterFailureReason): void {
    failure = { playerIndex, reason }
    result = { loser: playerIndex }
    state = 'failed'
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        currentTask: currentTask ? cloneTask(currentTask) : undefined,
        assignments: assignments.map(cloneAssignment),
        maxTouches,
        failure: failure ? { ...failure } : undefined,
        result
      }
    },
    start() {
      if (state !== 'setup') return
      createTask()
    },
    promptNext() {
      if (state !== 'holding') return
      createTask()
    },
    addTouch(touchId: number, point: TouchPoint) {
      if (state !== 'prompt' || currentTask === undefined) return false
      if (assignments.some((item) => item.touchId === touchId)) return false
      if (!isPointInCircle(point, currentTask.circle)) return false
      assignments.push({
        taskId: currentTask.id,
        playerIndex: currentTask.playerIndex,
        fingerNumber: currentTask.fingerNumber,
        touchId,
        circle: cloneCircle(currentTask.circle)
      })
      fingerCounts[currentTask.playerIndex]++
      currentTask = undefined
      state = 'holding'
      return true
    },
    releaseTouch(touchId: number) {
      if (state === 'failed') return
      const item = assignments.find((assignment) => assignment.touchId === touchId)
      if (item === undefined) return
      fail(item.playerIndex, 'released')
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state !== 'prompt' || currentTask === undefined) return
      currentTask.elapsedMs += deltaMs
      if (currentTask.elapsedMs >= currentTask.timeLimitMs) {
        currentTask.elapsedMs = currentTask.timeLimitMs
        fail(currentTask.playerIndex, 'timeout')
      }
    }
  }
}
```

- [ ] **Step 4: 运行指尖扭扭乐测试确认通过**

Run:

```bash
pnpm exec vitest run tests/games/finger-twister.test.ts tests/native/multitouch.test.ts
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add games/finger-twister/logic.ts tests/games/finger-twister.test.ts
git commit -m "feat(games): 实现指尖扭扭乐逻辑"
```

---

### Task 6: 数字炸弹页面

**Files:**
- Create: `pages/game/number-bomb/index.uvue`

- [ ] **Step 1: 创建页面文件**

创建 `pages/game/number-bomb/index.uvue`，页面必须包含这些具体交互：

```text
setup：显示范围切换按钮 1-100 / 1-999，点击“开始猜数”调用 game.start()。
guessing：显示当前玩家、闭区间范围、数字输入、提交按钮、历史记录。
exploded：显示爆炸结果，写入 session.loser，点击“查看结果”跳转 /pages/game/result。
暂停：onHide 时停止本页输入流程并展示 GamePausedOverlay，恢复时重开本局。
```

页面脚本使用以下函数名和行为，模板按现有页面风格绑定这些状态：

```ts
const game = ref<NumberBombGame | null>(null)
const snap = ref<NumberBombSnapshot | null>(null)
const inputText = ref('')
const paused = ref(false)

function playerCountForGame(): number {
  const raw = session.playerCount > 0 ? session.playerCount : 2
  return Math.min(8, Math.max(2, raw))
}

function update() {
  snap.value = game.value!.getSnapshot()
}

function init() {
  game.value = createNumberBombGame({ playerCount: playerCountForGame() })
  inputText.value = ''
  update()
}

function choosePreset(preset : NumberBombPreset) {
  if (snap.value?.state !== 'setup') return
  game.value?.setPreset(preset)
  play('click')
  update()
}

function startGame() {
  game.value?.start()
  play('countdown')
  vibrateShort()
  update()
}

function appendDigit(value : string) {
  if ((snap.value?.state ?? 'setup') !== 'guessing') return
  if (inputText.value.length >= 3) return
  inputText.value += value
}

function backspace() {
  if (inputText.value.length === 0) return
  inputText.value = inputText.value.slice(0, inputText.value.length - 1)
}

function submitGuess() {
  const value = Number(inputText.value)
  game.value?.submitGuess(value)
  inputText.value = ''
  update()
  if (snap.value?.state === 'exploded') {
    session.loser = snap.value.result!.loser
    play('explode')
    vibrateLong()
    return
  }
  if (snap.value?.inputError == null) {
    play('click')
    vibrateShort()
  }
}

function goResult() {
  if (snap.value?.result == null) return
  session.loser = snap.value.result.loser
  releaseAwake()
  uni.redirectTo({ url: '/pages/game/result' })
}

function onResume() { paused.value = false; onRestart() }
function onRestart() { paused.value = false; init() }
function onExit() {
  paused.value = false
  releaseAwake()
  session.exitToLobby()
  uni.redirectTo({ url: '/pages/lobby/games' })
}
```

页面必须导入并调用：

```ts
import { createNumberBombGame, type NumberBombGame, type NumberBombPreset, type NumberBombSnapshot } from '@/games/number-bomb/logic'
import { preload, play } from '@/native/audio'
import { vibrateShort, vibrateLong } from '@/native/vibrator'
import { keepAwake, releaseAwake } from '@/native/screen'
import { GAME_SOUNDS } from '@/utils/game-sounds'
```

生命周期必须包含：

```ts
onLoad(() => {
  windowMetrics.value = readWindowLayoutMetrics()
  preload(GAME_SOUNDS)
  keepAwake()
  init()
})

onUnload(() => {
  releaseAwake()
})

onHide(() => {
  if (snap.value?.state === 'guessing') paused.value = true
})
```

- [ ] **Step 2: 手工检查页面状态文案**

确认页面可见中文文案只包含游戏流程信息：`数字炸弹`、`当前范围`、`当前玩家`、`历史记录`、`爆炸了`、`查看结果`、`返回大厅`，不出现开发说明或操作教程段落。

- [ ] **Step 3: 运行关联逻辑测试**

Run:

```bash
pnpm exec vitest run tests/games/number-bomb.test.ts tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add pages/game/number-bomb/index.uvue
git commit -m "feat(game-ui): 新增数字炸弹页面"
```

---

### Task 7: 疯狂拔河页面

**Files:**
- Create: `pages/game/tug-of-war/index.uvue`

- [ ] **Step 1: 创建页面文件**

创建 `pages/game/tug-of-war/index.uvue`，页面必须包含这些具体交互：

```text
setup：展示红蓝代表、重新抽取、赛制切换、胜负条件切换、开始按钮。
countdown：显示 3 秒倒计时，播放 countdown 音效。
playing：屏幕左右分为红蓝半屏，红方点击左半屏，蓝方点击右半屏，显示比分、时间、绳子位置。
roundResult：三局两胜未结束时显示本局胜方和“下一局”。
matchResult：写入 session.loser，显示输方代表和“查看结果”。
```

页面脚本使用以下函数名和行为，模板按现有游戏页风格绑定这些状态：

```ts
const game = ref<TugOfWarGame | null>(null)
const snap = ref<TugSnapshot | null>(null)
const paused = ref(false)

let tickTimer : number | null = null
let lastTickAt = 0

function playerCountForGame(): number {
  const raw = session.playerCount > 0 ? session.playerCount : 2
  return Math.min(8, Math.max(2, raw))
}

function update() {
  snap.value = game.value!.getSnapshot()
}

function init() {
  stopLoop()
  game.value = createTugOfWarGame({ playerCount: playerCountForGame() })
  update()
}

function reroll() {
  game.value?.rerollRepresentatives()
  play('click')
  update()
}

function setMode(mode : TugMatchMode) {
  game.value?.setMode(mode)
  play('click')
  update()
}

function setWinCondition(condition : TugWinCondition) {
  game.value?.setWinCondition(condition)
  play('click')
  update()
}

function startRound() {
  game.value?.startRound()
  play('countdown')
  vibrateShort()
  update()
  startLoop()
}

function startNextRound() {
  game.value?.startNextRound()
  play('countdown')
  vibrateShort()
  update()
  startLoop()
}

function tapSide(side : TugSide) {
  const width = windowMetrics.value.windowWidth
  const x = side === 'red' ? width * 0.25 : width * 0.75
  const ok = game.value?.tap(side, { id: side === 'red' ? 1 : 2, x, y: 0 }, width, Date.now()) ?? false
  if (!ok) return
  play('click')
  vibrateShort()
  update()
  if (snap.value?.state === 'matchResult') onMatchFinished()
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
    const state = snap.value?.state
    if (state === 'roundResult') {
      stopLoop()
      play('win')
      vibrateShort()
    }
    if (state === 'matchResult') onMatchFinished()
  }, 50) as unknown as number
}

function stopLoop() {
  if (tickTimer != null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function onMatchFinished() {
  stopLoop()
  if (snap.value?.result != null) session.loser = snap.value.result.loser
  play('lose')
  vibrateLong()
}

function goResult() {
  if (snap.value?.result == null) return
  session.loser = snap.value.result.loser
  stopLoop()
  releaseAwake()
  uni.redirectTo({ url: '/pages/game/result' })
}
```

页面必须导入：

```ts
import {
  createTugOfWarGame,
  type TugMatchMode,
  type TugOfWarGame,
  type TugSide,
  type TugSnapshot,
  type TugWinCondition
} from '@/games/tug-of-war/logic'
```

生命周期必须包含停止计时器和屏幕常亮释放：

```ts
onLoad(() => {
  windowMetrics.value = readWindowLayoutMetrics()
  preload(GAME_SOUNDS)
  keepAwake()
  init()
})

onUnload(() => {
  stopLoop()
  releaseAwake()
})

onHide(() => {
  if (snap.value?.state === 'countdown' || snap.value?.state === 'playing') {
    stopLoop()
    paused.value = true
  }
})
```

- [ ] **Step 2: 手工检查触控布局**

确认 `playing` 态红蓝触控区使用稳定尺寸：左右各占 50% 宽度，中线绳子使用 `ropePosition` 转换为 `translateX`，点击反馈不改变整体布局尺寸。

- [ ] **Step 3: 运行关联逻辑测试**

Run:

```bash
pnpm exec vitest run tests/games/tug-of-war.test.ts tests/native/multitouch.test.ts tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add pages/game/tug-of-war/index.uvue
git commit -m "feat(game-ui): 新增疯狂拔河页面"
```

---

### Task 8: 指尖扭扭乐页面

**Files:**
- Create: `pages/game/finger-twister/index.uvue`

- [ ] **Step 1: 创建页面文件**

创建 `pages/game/finger-twister/index.uvue`，页面必须包含这些具体交互：

```text
setup：显示开始按钮。
prompt：显示当前任务、彩色圆圈和倒计时。
holding：显示所有已绑定触点光环，短暂停顿后调用 promptNext() 生成下一条任务。
failed：显示失败玩家和失败原因，写入 session.loser，点击“查看结果”进入结算。
touchend/touchcancel：统一调用 releaseTouch()，已绑定触点离开立即失败。
```

页面脚本使用以下函数名和行为：

```ts
const game = ref<FingerTwisterGame | null>(null)
const snap = ref<FingerTwisterSnapshot | null>(null)
const paused = ref(false)

let tickTimer : number | null = null
let promptTimer : number | null = null
let lastTickAt = 0

function playerCountForGame(): number {
  const raw = session.playerCount > 0 ? session.playerCount : 2
  return Math.min(4, Math.max(2, raw))
}

function update() {
  snap.value = game.value!.getSnapshot()
}

function init() {
  stopLoop()
  clearPromptTimer()
  game.value = createFingerTwisterGame({
    playerCount: playerCountForGame(),
    width: windowMetrics.value.windowWidth,
    height: windowMetrics.value.windowHeight
  })
  update()
}

function startGame() {
  game.value?.start()
  play('countdown')
  vibrateShort()
  update()
  startLoop()
}

function normalizeChangedTouch(e : TouchEvent, index : number) : TouchPoint | null {
  const point = normalizeTouchPoint(e.changedTouches[index] as TouchLike)
  return point == null ? null : point
}

function onTouchStart(e : TouchEvent) {
  if (snap.value?.state !== 'prompt') return
  for (let i = 0; i < e.changedTouches.length; i++) {
    const point = normalizeChangedTouch(e, i)
    if (point == null) continue
    const ok = game.value?.addTouch(point.id, point) ?? false
    if (ok) {
      play('click')
      vibrateShort()
      update()
      scheduleNextPrompt()
      return
    }
  }
}

function onTouchEnd(e : TouchEvent) {
  if (snap.value?.state === 'failed') return
  for (let i = 0; i < e.changedTouches.length; i++) {
    const point = normalizeChangedTouch(e, i)
    if (point == null) continue
    game.value?.releaseTouch(point.id)
  }
  update()
  if (snap.value?.state === 'failed') onFailed()
}

function scheduleNextPrompt() {
  clearPromptTimer()
  promptTimer = setTimeout(() => {
    game.value?.promptNext()
    update()
  }, 500) as unknown as number
}

function clearPromptTimer() {
  if (promptTimer != null) {
    clearTimeout(promptTimer)
    promptTimer = null
  }
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
    if (snap.value?.state === 'failed') onFailed()
  }, 50) as unknown as number
}

function stopLoop() {
  if (tickTimer != null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

function onFailed() {
  stopLoop()
  clearPromptTimer()
  if (snap.value?.result != null) session.loser = snap.value.result.loser
  play('lose')
  vibrateLong()
}

function goResult() {
  if (snap.value?.result == null) return
  session.loser = snap.value.result.loser
  stopLoop()
  clearPromptTimer()
  releaseAwake()
  uni.redirectTo({ url: '/pages/game/result' })
}
```

页面必须导入：

```ts
import {
  createFingerTwisterGame,
  type FingerAssignment,
  type FingerTwisterGame,
  type FingerTwisterSnapshot,
  type FingerTwisterTask
} from '@/games/finger-twister/logic'
import { normalizeTouchPoint, type TouchLike, type TouchPoint } from '@/native/multitouch'
```

生命周期必须包含：

```ts
onLoad(() => {
  windowMetrics.value = readWindowLayoutMetrics()
  preload(GAME_SOUNDS)
  keepAwake()
  init()
})

onUnload(() => {
  stopLoop()
  clearPromptTimer()
  releaseAwake()
})

onHide(() => {
  if (snap.value?.state !== 'failed') {
    stopLoop()
    clearPromptTimer()
    paused.value = true
  }
})
```

- [ ] **Step 2: 手工检查触控渲染**

确认当前任务圆圈和已绑定光环使用绝对定位，`left/top` 来自 `circle.x/y`，圆圈直径使用 `radius * 2`，不会因文案长度改变触控区域尺寸。

- [ ] **Step 3: 运行关联逻辑测试**

Run:

```bash
pnpm exec vitest run tests/games/finger-twister.test.ts tests/native/multitouch.test.ts tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add pages/game/finger-twister/index.uvue
git commit -m "feat(game-ui): 新增指尖扭扭乐页面"
```

---

### Task 9: 全量验证与收尾

**Files:**
- Read: `docs/superpowers/specs/2026-04-26-new-party-games-design.md`
- Read: `docs/superpowers/plans/2026-04-26-new-party-games.md`

- [ ] **Step 1: 运行新增功能定向测试**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts tests/stores/session.test.ts tests/native/multitouch.test.ts tests/games/number-bomb.test.ts tests/games/tug-of-war.test.ts tests/games/finger-twister.test.ts
```

Expected: PASS。

- [ ] **Step 2: 运行全量单元测试**

Run:

```bash
pnpm test
```

Expected: PASS。

- [ ] **Step 3: 运行 TypeScript 静态检查**

Run:

```bash
pnpm exec tsc --noEmit --ignoreDeprecations 6.0
```

Expected: PASS。

- [ ] **Step 4: 检查新页面已全部注册**

Run:

```bash
rg -n "number-bomb|tug-of-war|finger-twister" pages.json ui/games.ts stores/session.ts pages/game/result.uvue README.md
```

Expected: 输出包含三款游戏在 `GameId`、`GAME_GROUPS`、`GAME_ROUTES`、`pages.json`、`pathMap`、`README.md` 的记录。

- [ ] **Step 5: HBuilderX 真机或模拟器手工验收**

按以下路径检查：

```text
大厅 2 人：数字炸弹、疯狂拔河、指尖扭扭乐均可进入。
大厅 5 人：指尖扭扭乐置灰并显示“最多 4 人”。
数字炸弹：猜小缩下界，猜大缩上界，猜中进入结算。
疯狂拔河：倒计时后点击红蓝半屏有效，比赛结束进入结算。
指尖扭扭乐：按中圆圈绑定，松开绑定触点立即进入结算。
切后台：显示暂停遮罩，恢复时重置本局或重新开始。
```

- [ ] **Step 6: 记录验证结果**

在实施会话最终回复中列出：

```text
已运行：定向 Vitest、全量 Vitest、tsc。
手工验收：列出设备、系统版本、通过的三款游戏路径。
未运行项：明确说明原因和风险。
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "test(games): 验证三款新游戏接入"
```

---

## 自检结果

- 规范覆盖：大厅入口、人数限制、三条路由、三套逻辑状态机、三套页面、结算、音效、振动、屏幕常亮、暂停、边界条件和单测均已映射到 Task 1-9。
- 命名一致性：`number-bomb`、`tug-of-war`、`finger-twister` 在 `GameId`、路由、页面目录、测试文件和逻辑目录中保持一致。
- 测试边界：数字炸弹覆盖范围收缩和无效输入；疯狂拔河覆盖倒计时、节流、固定时长、阈值和三局两胜；指尖扭扭乐覆盖任务生成、绑定、松手、超时、未知触点和快照拷贝。
- 共享能力：触点归一化、半屏判断、圆形命中、点击节流集中在 `native/multitouch.ts`，未引入通用游戏引擎。
