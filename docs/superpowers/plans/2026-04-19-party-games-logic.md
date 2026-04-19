# 鸿蒙派对小游戏 · 实施计划 2（Phase 2：游戏逻辑 logic.ts）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 5 款小游戏（鳄鱼拔牙 · 定时炸弹 · 摇一摇赛马 · 指尖大轮盘 · 同屏反应大比拼）实现纯函数状态机 `logic.ts`，并用 Vitest 建立完整单测（目标覆盖率 > 80%）。UI / 原生能力由 Plan 3 接入，本 Plan 的代码完全不依赖 `uni.*` / DOM / Pinia。

**Architecture:** 每款游戏一个 `createXxxGame(opts): XxxGame` 工厂。工厂闭包持有状态；对外暴露 `getSnapshot()` 返回不可变快照，以及驱动状态转移的 action 方法（如 `tick(deltaMs)` / `tapTooth(i)` / `addFinger(id)`）。所有外部副作用（随机、时间）通过依赖注入传入：`random: RandomSource` 和 UI 层主动喂入的 `tick(deltaMs)`。这样单测只需构造确定性随机源和手动推进时间即可覆盖全状态空间。

**Tech Stack:** TypeScript（strict）· Vitest · 无外部依赖（纯函数）

**Spec 引用：** `docs/superpowers/specs/2026-04-18-party-games-design.md` §5.1-5.5, §9.1

**前置依赖：** Plan 1（骨架）完成。`src/games/` 目录与 Vitest 配置已就绪。

**范围 · Plan 2 包含：**
- 共用类型 `types.ts` 与随机源 `random.ts`。
- 5 款游戏 `logic.ts` 纯函数状态机。
- 5 款游戏各自的 Vitest 单测文件。
- 随机源单测。

**范围 · Plan 2 不包含（留待 Plan 3+）：**
- 游戏 UI 页面（当前仍用 Plan 1 的 `pages/game/placeholder.uvue`）。
- 原生能力接入（加速度传感器 / 多点触控 / 音效 / 振动 / 屏幕常亮）。
- 惩罚库 Store、管理页、内置数据。
- 视觉资源、动画、主题化插画。

---

## 文件结构

每个文件职责单一，互不耦合。`types.ts` 是唯一共享模块，其余 5 个 logic 文件互不引用。

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `src/games/types.ts` | 创建 | 共用类型：`RandomSource`、`GameResult` |
| `src/games/random.ts` | 创建 | `defaultRandom` / `seededRandom` / `randomInt` |
| `src/games/crocodile/logic.ts` | 创建 | 🐊 鳄鱼拔牙状态机（`ready → playing → trapTriggered`） |
| `src/games/bomb/logic.ts` | 创建 | 💣 定时炸弹状态机（`ready → ticking → exploded`） |
| `src/games/horse-race/logic.ts` | 创建 | 🐎 摇一摇赛马状态机（`ready → shaking → result`） |
| `src/games/wheel/logic.ts` | 创建 | 🎯 指尖大轮盘状态机（`collecting → spinning → selected`） |
| `src/games/reaction/logic.ts` | 创建 | 👆 同屏反应状态机（`collecting → armed → signal → resolved`） |
| `tests/games/random.test.ts` | 创建 | 随机源单测 |
| `tests/games/crocodile.test.ts` | 创建 | 鳄鱼拔牙单测 |
| `tests/games/bomb.test.ts` | 创建 | 定时炸弹单测 |
| `tests/games/horse-race.test.ts` | 创建 | 摇一摇赛马单测 |
| `tests/games/wheel.test.ts` | 创建 | 指尖大轮盘单测 |
| `tests/games/reaction.test.ts` | 创建 | 同屏反应单测 |

---

## 设计约定（阅读全部 Task 前必读）

1. **纯函数 + 依赖注入**：logic 不得调用 `uni.*` / `Math.random` / `Date.now` / `setTimeout` 等。随机通过 `random: RandomSource` 注入，时间通过 UI 主动调 `tick(deltaMs)` 推进。
2. **`getSnapshot()` 返回不可变快照**：所有数组字段用 `[...arr]` 拷贝返回，避免外部修改污染内部状态。
3. **状态守卫**：任何 action 在非预期状态下调用都**静默忽略**（`return`），而不是抛错 —— 让 UI 易接入。
4. **输家索引 0-base**：`GameResult.loser` 是玩家数组下标（0 起），不是"玩家 1"的 1。
5. **`random()` 返回 `[0, 1)`**：`randomInt(random, min, max)` 返回 `[min, max)` 区间整数。

---

## Phase 2 · 游戏逻辑

### Task 2.1 · 共用类型与随机源

**Files:**
- Create: `src/games/types.ts`
- Create: `src/games/random.ts`
- Create: `tests/games/random.test.ts`

- [ ] **Step 1: 写 `src/games/types.ts`**

```ts
// src/games/types.ts

// 返回 [0, 1) 之间的伪随机数
export type RandomSource = () => number

// 所有游戏的输出结果。loser 必填；winner 仅赛马有意义
export type GameResult = {
  loser: number
  winner?: number
}
```

- [ ] **Step 2: 写失败测试 `tests/games/random.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { defaultRandom, seededRandom, randomInt } from '@/games/random'

describe('defaultRandom', () => {
  it('返回 [0, 1) 区间', () => {
    for (let i = 0; i < 100; i++) {
      const v = defaultRandom()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seededRandom', () => {
  it('相同种子产生相同序列', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b())
    }
  })

  it('返回 [0, 1) 区间', () => {
    const r = seededRandom(7)
    for (let i = 0; i < 200; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('不同种子差异化序列', () => {
    const a = seededRandom(1)
    const b = seededRandom(2)
    const seqA = Array.from({ length: 5 }, () => a())
    const seqB = Array.from({ length: 5 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })
})

describe('randomInt', () => {
  it('random 返回 0 时取 min', () => {
    expect(randomInt(() => 0, 5, 15)).toBe(5)
  })

  it('random 返回接近 1 时取 max-1（上界开区间）', () => {
    expect(randomInt(() => 0.9999, 5, 15)).toBe(14)
  })

  it('任何随机值都落在 [min, max)', () => {
    const r = seededRandom(123)
    for (let i = 0; i < 200; i++) {
      const v = randomInt(r, 10, 20)
      expect(v).toBeGreaterThanOrEqual(10)
      expect(v).toBeLessThan(20)
    }
  })
})
```

- [ ] **Step 3: 跑测试确认失败**

```bash
pnpm test tests/games/random.test.ts
```

Expected: FAIL（`src/games/random.ts` 不存在）。

- [ ] **Step 4: 写 `src/games/random.ts`**

```ts
// src/games/random.ts
import type { RandomSource } from './types'

export const defaultRandom: RandomSource = () => Math.random()

// LCG（线性同余），仅用于测试。内部状态 0xFFFFFFFF 归一化到 [0, 1)
export function seededRandom(seed: number): RandomSource {
  let state = (seed >>> 0) || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    // state / 2^32 分母比 2^32 大，保证严格 < 1
    return state / 0x100000000
  }
}

export function randomInt(random: RandomSource, minInclusive: number, maxExclusive: number): number {
  if (maxExclusive <= minInclusive) return minInclusive
  return minInclusive + Math.floor(random() * (maxExclusive - minInclusive))
}
```

- [ ] **Step 5: 跑测试确认通过**

```bash
pnpm test tests/games/random.test.ts
```

Expected: 7 tests PASS。

- [ ] **Step 6: Commit**

```bash
git add src/games/types.ts src/games/random.ts tests/games/random.test.ts
git commit -m "feat(games): 共用类型与可注入随机源"
```

---

### Task 2.2 · 🐊 鳄鱼拔牙 logic

**Files:**
- Create: `src/games/crocodile/logic.ts`
- Create: `tests/games/crocodile.test.ts`

**Spec 对齐（§5.3）：**
- 状态：`ready → playing → trapTriggered`。
- 牙齿数按人数分段：2-4 人 → 8 颗；5-6 人 → 10 颗；7-8 人 → 12 颗（满足"每人至少 1 次"且 ≤ 12）。
- 陷阱牙索引在初始化时随机固定。
- 玩家轮流按**未按过**的牙；按到陷阱 → 当前玩家输、游戏结束。

- [ ] **Step 1: 写失败测试 `tests/games/crocodile.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createCrocodileGame } from '@/games/crocodile/logic'

describe('createCrocodileGame', () => {
  it('要求人数 2-8，否则抛错', () => {
    expect(() => createCrocodileGame({ playerCount: 1 })).toThrow()
    expect(() => createCrocodileGame({ playerCount: 9 })).toThrow()
  })

  it('牙齿数分段：4 人 8 颗、6 人 10 颗、8 人 12 颗', () => {
    expect(createCrocodileGame({ playerCount: 4, random: () => 0 }).getSnapshot().totalTeeth).toBe(8)
    expect(createCrocodileGame({ playerCount: 6, random: () => 0 }).getSnapshot().totalTeeth).toBe(10)
    expect(createCrocodileGame({ playerCount: 8, random: () => 0 }).getSnapshot().totalTeeth).toBe(12)
  })

  it('初始化：ready 状态，pressedTeeth 空，currentPlayer=0', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0 })
    const s = g.getSnapshot()
    expect(s.state).toBe('ready')
    expect(s.pressedTeeth).toEqual([])
    expect(s.currentPlayer).toBe(0)
    expect(s.result).toBeUndefined()
  })

  it('random=0 时陷阱牙索引为 0', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0 })
    expect(g.getSnapshot().trappedTooth).toBe(0)
  })

  it('random=0.99 时陷阱牙索引为 totalTeeth-1', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0.99 })
    expect(g.getSnapshot().trappedTooth).toBe(7)
  })

  it('start 进入 playing', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    expect(g.getSnapshot().state).toBe('playing')
  })

  it('按非陷阱牙：轮到下一位并记录', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)
    const s = g.getSnapshot()
    expect(s.state).toBe('playing')
    expect(s.pressedTeeth).toEqual([1])
    expect(s.currentPlayer).toBe(1)
    expect(s.result).toBeUndefined()
  })

  it('按陷阱牙：当前玩家输，状态 trapTriggered', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)  // p0 → p1
    g.tapTooth(2)  // p1 → p2
    g.tapTooth(0)  // p2 按陷阱
    const s = g.getSnapshot()
    expect(s.state).toBe('trapTriggered')
    expect(s.result).toEqual({ loser: 2 })
  })

  it('已按过的牙再按被忽略', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(1)
    g.tapTooth(1)
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([1])
  })

  it('越界 index 被忽略', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(-1)
    g.tapTooth(999)
    const s = g.getSnapshot()
    expect(s.pressedTeeth).toEqual([])
    expect(s.currentPlayer).toBe(0)
  })

  it('ready 状态下 tap 无效', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.tapTooth(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([])
  })

  it('轮次循环：到末位玩家后回到 0', () => {
    const g = createCrocodileGame({ playerCount: 2, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)  // p0 → p1
    g.tapTooth(2)  // p1 → p0
    expect(g.getSnapshot().currentPlayer).toBe(0)
  })

  it('trapTriggered 后 tap 无效', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(0)  // p0 按陷阱
    g.tapTooth(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([0])
  })

  it('getSnapshot 返回拷贝，外部修改不污染内部', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(1)
    const s = g.getSnapshot()
    s.pressedTeeth.push(99)
    expect(g.getSnapshot().pressedTeeth).toEqual([1])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/games/crocodile.test.ts
```

Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/games/crocodile/logic.ts`**

```ts
// src/games/crocodile/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type CrocodileState = 'ready' | 'playing' | 'trapTriggered'

export type CrocodileSnapshot = {
  state: CrocodileState
  playerCount: number
  totalTeeth: number
  trappedTooth: number
  pressedTeeth: number[]
  currentPlayer: number
  result?: GameResult
}

export type CrocodileGame = {
  getSnapshot(): CrocodileSnapshot
  start(): void
  tapTooth(index: number): void
}

function toothCountFor(playerCount: number): number {
  if (playerCount <= 4) return 8
  if (playerCount <= 6) return 10
  return 12
}

export function createCrocodileGame(opts: {
  playerCount: number
  random?: RandomSource
}): CrocodileGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const totalTeeth = toothCountFor(opts.playerCount)
  const trappedTooth = randomInt(random, 0, totalTeeth)

  let state: CrocodileState = 'ready'
  const pressedTeeth: number[] = []
  let currentPlayer = 0
  let result: GameResult | undefined

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        totalTeeth,
        trappedTooth,
        pressedTeeth: [...pressedTeeth],
        currentPlayer,
        result
      }
    },
    start() {
      if (state === 'ready') state = 'playing'
    },
    tapTooth(index: number) {
      if (state !== 'playing') return
      if (index < 0 || index >= totalTeeth) return
      if (pressedTeeth.includes(index)) return
      pressedTeeth.push(index)
      if (index === trappedTooth) {
        state = 'trapTriggered'
        result = { loser: currentPlayer }
        return
      }
      currentPlayer = (currentPlayer + 1) % opts.playerCount
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/games/crocodile.test.ts
```

Expected: 14 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/games/crocodile/logic.ts tests/games/crocodile.test.ts
git commit -m "feat(games): 鳄鱼拔牙 logic.ts（状态机 + 单测）"
```

---

### Task 2.3 · 💣 定时炸弹 logic

**Files:**
- Create: `src/games/bomb/logic.ts`
- Create: `tests/games/bomb.test.ts`

**Spec 对齐（§5.2）：**
- 状态：`ready → ticking → exploded`。
- 初始化时随机倒计时 30-90 秒（玩家不可见）。
- 传递引线：每按一次 `cutFuse()` 额外扣 1 秒。
- `tick(deltaMs)` 累加已用时间；到达 `duration` 即爆炸。
- 爆炸后玩家自行指认 → `reportLoser(playerIndex)` 记录结果。

- [ ] **Step 1: 写失败测试 `tests/games/bomb.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createBombGame } from '@/games/bomb/logic'

describe('createBombGame', () => {
  it('默认倒计时 30-90 秒；random=0 时 30 秒', () => {
    const g = createBombGame({ random: () => 0 })
    expect(g.getSnapshot().durationMs).toBe(30000)
  })

  it('random=0.9999 时倒计时接近 90 秒', () => {
    const g = createBombGame({ random: () => 0.9999 })
    expect(g.getSnapshot().durationMs).toBeLessThanOrEqual(90000)
    expect(g.getSnapshot().durationMs).toBeGreaterThanOrEqual(30000)
  })

  it('可通过参数覆盖 min/max', () => {
    const g = createBombGame({ random: () => 0, minSeconds: 5, maxSeconds: 10 })
    expect(g.getSnapshot().durationMs).toBe(5000)
  })

  it('初始 ready', () => {
    const g = createBombGame({ random: () => 0 })
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('start 进入 ticking', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    expect(g.getSnapshot().state).toBe('ticking')
  })

  it('ready 状态 tick 无效', () => {
    const g = createBombGame({ random: () => 0 })
    g.tick(5000)
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('tick 累加 elapsed；remainingMs = duration - elapsed', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(5000)
    const s = g.getSnapshot()
    expect(s.elapsedMs).toBe(5000)
    expect(s.remainingMs).toBe(25000)
  })

  it('累积到 duration 时爆炸', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(29999)
    expect(g.getSnapshot().state).toBe('ticking')
    g.tick(2)
    expect(g.getSnapshot().state).toBe('exploded')
  })

  it('cutFuse 扣 1 秒并计数', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.cutFuse()
    const s = g.getSnapshot()
    expect(s.elapsedMs).toBe(1000)
    expect(s.fuseCuts).toBe(1)
  })

  it('cutFuse 可直接引爆', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(29500)
    g.cutFuse()  // +1000ms → 超过 duration
    expect(g.getSnapshot().state).toBe('exploded')
  })

  it('爆炸后 cutFuse 无效', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    const beforeCuts = g.getSnapshot().fuseCuts
    g.cutFuse()
    expect(g.getSnapshot().fuseCuts).toBe(beforeCuts)
  })

  it('爆炸后 reportLoser 记录 result', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    g.reportLoser(2)
    expect(g.getSnapshot().result).toEqual({ loser: 2 })
  })

  it('未爆炸时 reportLoser 不生效', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.reportLoser(2)
    expect(g.getSnapshot().result).toBeUndefined()
  })

  it('负 index 的 reportLoser 被忽略', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    g.reportLoser(-1)
    expect(g.getSnapshot().result).toBeUndefined()
  })

  it('负 delta 被忽略', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(-500)
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('爆炸后 remainingMs = 0', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    expect(g.getSnapshot().remainingMs).toBe(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/games/bomb.test.ts
```

Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `src/games/bomb/logic.ts`**

```ts
// src/games/bomb/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type BombState = 'ready' | 'ticking' | 'exploded'

export type BombSnapshot = {
  state: BombState
  durationMs: number
  elapsedMs: number
  remainingMs: number
  fuseCuts: number
  result?: GameResult
}

export type BombGame = {
  getSnapshot(): BombSnapshot
  start(): void
  tick(deltaMs: number): void
  cutFuse(): void
  reportLoser(playerIndex: number): void
}

const DEFAULT_MIN_SECONDS = 30
const DEFAULT_MAX_SECONDS = 90
const FUSE_DEDUCTION_MS = 1000

export function createBombGame(opts: {
  random?: RandomSource
  minSeconds?: number
  maxSeconds?: number
  fuseDeductionMs?: number
}): BombGame {
  const random = opts.random ?? defaultRandom
  const minSeconds = opts.minSeconds ?? DEFAULT_MIN_SECONDS
  const maxSeconds = opts.maxSeconds ?? DEFAULT_MAX_SECONDS
  const fuseDeductionMs = opts.fuseDeductionMs ?? FUSE_DEDUCTION_MS
  const durationMs = randomInt(random, minSeconds * 1000, maxSeconds * 1000 + 1)

  let state: BombState = 'ready'
  let elapsedMs = 0
  let fuseCuts = 0
  let result: GameResult | undefined

  function detonateIfDue(): void {
    if (elapsedMs >= durationMs) {
      elapsedMs = durationMs
      state = 'exploded'
    }
  }

  return {
    getSnapshot() {
      return {
        state,
        durationMs,
        elapsedMs,
        remainingMs: Math.max(0, durationMs - elapsedMs),
        fuseCuts,
        result
      }
    },
    start() {
      if (state === 'ready') state = 'ticking'
    },
    tick(deltaMs: number) {
      if (state !== 'ticking') return
      if (deltaMs < 0) return
      elapsedMs += deltaMs
      detonateIfDue()
    },
    cutFuse() {
      if (state !== 'ticking') return
      fuseCuts++
      elapsedMs += fuseDeductionMs
      detonateIfDue()
    },
    reportLoser(playerIndex: number) {
      if (state !== 'exploded') return
      if (playerIndex < 0) return
      result = { loser: playerIndex }
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/games/bomb.test.ts
```

Expected: 16 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/games/bomb/logic.ts tests/games/bomb.test.ts
git commit -m "feat(games): 定时炸弹 logic.ts（倒计时 + 引线扣时）"
```

---

### Task 2.4 · 🐎 摇一摇赛马 logic

**Files:**
- Create: `src/games/horse-race/logic.ts`
- Create: `tests/games/horse-race.test.ts`

**Spec 对齐（§5.1）：**
- 状态：`ready → shaking → result`。
- 每位玩家依次摇 10 秒，UI 每次拿到加速度 `magnitude` 即调用 `onSample(magnitude)`。
- **峰值检测（上升沿触发）**：`magnitude >= threshold` 且**前一次未在峰值态**时计 +1。从高值降回低值再升起视为新一次峰值。
- `tick(deltaMs)` 推进当前玩家的计时；到 `shakeDurationMs` 自动 `finishPlayer()`。
- `finishPlayer()` 切到下一位；全员完成后进 `result` 状态。
- 判定：`winner = 次数最多者`（并列则取第一个）；`loser = 次数最少者`，并列时用注入的 `random` 从并列者中随机挑一个。

- [ ] **Step 1: 写失败测试 `tests/games/horse-race.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createHorseRaceGame } from '@/games/horse-race/logic'

describe('createHorseRaceGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createHorseRaceGame({ playerCount: 1 })).toThrow()
    expect(() => createHorseRaceGame({ playerCount: 9 })).toThrow()
  })

  it('初始 ready，每人次数 0', () => {
    const g = createHorseRaceGame({ playerCount: 3 })
    const s = g.getSnapshot()
    expect(s.state).toBe('ready')
    expect(s.shakeCounts).toEqual([0, 0, 0])
    expect(s.currentPlayer).toBe(0)
  })

  it('startPlayer 进入 shaking 并重置计时', () => {
    const g = createHorseRaceGame({ playerCount: 2 })
    g.startPlayer()
    expect(g.getSnapshot().state).toBe('shaking')
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('峰值检测：上升沿计 +1', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(3)    // 上升沿 → +1
    g.onSample(3.5)  // 同一峰段不计
    g.onSample(1)    // 回到低位
    g.onSample(3)    // 新上升沿 → +1
    expect(g.getSnapshot().shakeCounts[0]).toBe(2)
  })

  it('magnitude 低于阈值不计', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(1.9)
    g.onSample(1.5)
    expect(g.getSnapshot().shakeCounts[0]).toBe(0)
  })

  it('ready 状态下 onSample 被忽略', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.onSample(5)
    expect(g.getSnapshot().shakeCounts[0]).toBe(0)
  })

  it('tick 累加 elapsed；到 duration 自动 finish', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer()
    g.tick(99)
    expect(g.getSnapshot().state).toBe('shaking')
    g.tick(2)
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('finishPlayer 手动推进到下一位', () => {
    const g = createHorseRaceGame({ playerCount: 3, shakeDurationMs: 1000 })
    g.startPlayer()
    g.finishPlayer()
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('全员完成后进入 result', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer()
    g.tick(101)  // finish p0
    g.startPlayer()
    g.tick(101)  // finish p1
    expect(g.getSnapshot().state).toBe('result')
    expect(g.getSnapshot().result).toBeDefined()
  })

  it('最多次数 → winner，最少次数 → loser', () => {
    const g = createHorseRaceGame({
      playerCount: 3, shakeDurationMs: 100, peakThreshold: 2
    })
    // p0 摇 2 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.tick(101)
    // p1 摇 1 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.tick(101)
    // p2 摇 4 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.tick(101)
    const r = g.getSnapshot().result
    expect(r?.loser).toBe(1)
    expect(r?.winner).toBe(2)
  })

  it('并列最少次数：random=0 选并列中第一个', () => {
    const g = createHorseRaceGame({
      playerCount: 2, shakeDurationMs: 100, random: () => 0
    })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    expect(g.getSnapshot().result?.loser).toBe(0)
  })

  it('并列最少次数：random=0.99 选并列中最后一个', () => {
    const g = createHorseRaceGame({
      playerCount: 2, shakeDurationMs: 100, random: () => 0.99
    })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    expect(g.getSnapshot().result?.loser).toBe(1)
  })

  it('并列最多次数：winner 为并列中第一个（稳定取第一）', () => {
    const g = createHorseRaceGame({
      playerCount: 3, shakeDurationMs: 100, peakThreshold: 2
    })
    // 0 和 2 都摇 1 次；1 摇 0 次
    g.startPlayer(); g.onSample(3); g.onSample(1); g.tick(101)
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.onSample(3); g.onSample(1); g.tick(101)
    const r = g.getSnapshot().result
    expect(r?.winner).toBe(0)
    expect(r?.loser).toBe(1)
  })

  it('result 状态下 startPlayer 无效', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    g.startPlayer()
    expect(g.getSnapshot().state).toBe('result')
  })

  it('shakeCounts 返回拷贝', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    const s = g.getSnapshot()
    s.shakeCounts[0] = 999
    expect(g.getSnapshot().shakeCounts[0]).toBe(1)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/games/horse-race.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/games/horse-race/logic.ts`**

```ts
// src/games/horse-race/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom } from '../random'

export type HorseRaceState = 'ready' | 'shaking' | 'result'

export type HorseRaceSnapshot = {
  state: HorseRaceState
  playerCount: number
  currentPlayer: number
  shakeDurationMs: number
  elapsedMs: number
  shakeCounts: number[]
  peakThreshold: number
  result?: GameResult
}

export type HorseRaceGame = {
  getSnapshot(): HorseRaceSnapshot
  startPlayer(): void
  onSample(magnitude: number): void
  tick(deltaMs: number): void
  finishPlayer(): void
}

const DEFAULT_PEAK_THRESHOLD = 2.0
const DEFAULT_SHAKE_DURATION_MS = 10000

export function createHorseRaceGame(opts: {
  playerCount: number
  random?: RandomSource
  shakeDurationMs?: number
  peakThreshold?: number
}): HorseRaceGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const shakeDurationMs = opts.shakeDurationMs ?? DEFAULT_SHAKE_DURATION_MS
  const peakThreshold = opts.peakThreshold ?? DEFAULT_PEAK_THRESHOLD

  let state: HorseRaceState = 'ready'
  let currentPlayer = 0
  let elapsedMs = 0
  let inPeak = false
  const shakeCounts = new Array<number>(opts.playerCount).fill(0)
  let result: GameResult | undefined

  function finalize(): GameResult {
    let maxVal = shakeCounts[0]
    let winner = 0
    let minVal = shakeCounts[0]
    let minIdxs: number[] = [0]
    for (let i = 1; i < shakeCounts.length; i++) {
      const v = shakeCounts[i]
      if (v > maxVal) {
        maxVal = v
        winner = i
      }
      if (v < minVal) {
        minVal = v
        minIdxs = [i]
      } else if (v === minVal) {
        minIdxs.push(i)
      }
    }
    const loser = minIdxs.length === 1
      ? minIdxs[0]
      : minIdxs[Math.floor(random() * minIdxs.length)]
    return { loser, winner }
  }

  function advancePlayer(): void {
    currentPlayer++
    elapsedMs = 0
    inPeak = false
    if (currentPlayer >= opts.playerCount) {
      state = 'result'
      result = finalize()
    } else {
      state = 'ready'
    }
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        currentPlayer,
        shakeDurationMs,
        elapsedMs,
        shakeCounts: [...shakeCounts],
        peakThreshold,
        result
      }
    },
    startPlayer() {
      if (state === 'result') return
      state = 'shaking'
      elapsedMs = 0
      inPeak = false
    },
    onSample(magnitude: number) {
      if (state !== 'shaking') return
      if (magnitude >= peakThreshold) {
        if (!inPeak) {
          shakeCounts[currentPlayer]++
          inPeak = true
        }
      } else {
        inPeak = false
      }
    },
    tick(deltaMs: number) {
      if (state !== 'shaking') return
      if (deltaMs < 0) return
      elapsedMs += deltaMs
      if (elapsedMs >= shakeDurationMs) advancePlayer()
    },
    finishPlayer() {
      if (state !== 'shaking') return
      advancePlayer()
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/games/horse-race.test.ts
```

Expected: 15 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/games/horse-race/logic.ts tests/games/horse-race.test.ts
git commit -m "feat(games): 摇一摇赛马 logic.ts（峰值检测 + 并列处理）"
```

---

### Task 2.5 · 🎯 指尖大轮盘 logic

**Files:**
- Create: `src/games/wheel/logic.ts`
- Create: `tests/games/wheel.test.ts`

**Spec 对齐（§5.5）：**
- 状态：`collecting → spinning → selected`。
- 玩家按手指到齐（`fingerIds.length === playerCount`）后自动进 `spinning`。
- 进入 `spinning` 时立即**确定**旋转时长（2-3 秒内随机）和最终停靠的手指 index。
- `tick(deltaMs)` 累计 `spinElapsedMs`，达到 `spinDurationMs` 即进入 `selected`，`loser` = 停靠手指对应的玩家 index。
- MVP 简化：`spinning` / `selected` 阶段的 `addFinger / removeFinger` 一律忽略。

- [ ] **Step 1: 写失败测试 `tests/games/wheel.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createWheelGame } from '@/games/wheel/logic'

describe('createWheelGame', () => {
  it('要求人数 2-5', () => {
    expect(() => createWheelGame({ playerCount: 1 })).toThrow()
    expect(() => createWheelGame({ playerCount: 6 })).toThrow()
  })

  it('初始 collecting 状态、无手指', () => {
    const g = createWheelGame({ playerCount: 3 })
    const s = g.getSnapshot()
    expect(s.state).toBe('collecting')
    expect(s.fingerIds).toEqual([])
    expect(s.result).toBeUndefined()
  })

  it('人数未齐不会 spin', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10)
    g.addFinger(11)
    expect(g.getSnapshot().state).toBe('collecting')
  })

  it('到齐后自动进入 spinning 并决定时长与目标', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    const s = g.getSnapshot()
    expect(s.state).toBe('spinning')
    expect(s.spinDurationMs).toBeGreaterThanOrEqual(2000)
    expect(s.spinDurationMs).toBeLessThanOrEqual(3000)
    expect(s.selectedFingerIndex).toBe(0)
  })

  it('random=0.99 时 selectedFingerIndex 为最后一位', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0.99 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    expect(g.getSnapshot().selectedFingerIndex).toBe(2)
  })

  it('重复 id 被忽略', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10])
  })

  it('超过 playerCount 的手指被忽略', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('collecting 阶段抬手减少 fingers', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([11])
  })

  it('spinning 阶段抬手被忽略（fingers 冻结）', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('tick 累计到 duration 进入 selected，loser = selectedFingerIndex', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    const duration = g.getSnapshot().spinDurationMs
    g.tick(duration - 1)
    expect(g.getSnapshot().state).toBe('spinning')
    g.tick(2)
    const s = g.getSnapshot()
    expect(s.state).toBe('selected')
    expect(s.result?.loser).toBe(0)
  })

  it('selected 状态下 tick 无效', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(5000)  // 已 selected
    const before = g.getSnapshot().spinElapsedMs
    g.tick(1000)
    expect(g.getSnapshot().spinElapsedMs).toBe(before)
  })

  it('collecting 状态下 tick 无效', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10)
    g.tick(5000)
    expect(g.getSnapshot().spinElapsedMs).toBe(0)
  })

  it('负 delta 被忽略', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(-500)
    expect(g.getSnapshot().spinElapsedMs).toBe(0)
  })

  it('fingerIds 返回拷贝', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(11)
    const s = g.getSnapshot()
    s.fingerIds.push(999)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/games/wheel.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/games/wheel/logic.ts`**

```ts
// src/games/wheel/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type WheelState = 'collecting' | 'spinning' | 'selected'

export type WheelSnapshot = {
  state: WheelState
  playerCount: number
  fingerIds: number[]
  spinElapsedMs: number
  spinDurationMs: number
  selectedFingerIndex?: number
  result?: GameResult
}

export type WheelGame = {
  getSnapshot(): WheelSnapshot
  addFinger(id: number): void
  removeFinger(id: number): void
  tick(deltaMs: number): void
}

const DEFAULT_SPIN_MIN_MS = 2000
const DEFAULT_SPIN_MAX_MS = 3000

export function createWheelGame(opts: {
  playerCount: number
  random?: RandomSource
  spinMinMs?: number
  spinMaxMs?: number
}): WheelGame {
  if (opts.playerCount < 2 || opts.playerCount > 5) {
    throw new Error(`playerCount must be 2-5, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const spinMinMs = opts.spinMinMs ?? DEFAULT_SPIN_MIN_MS
  const spinMaxMs = opts.spinMaxMs ?? DEFAULT_SPIN_MAX_MS

  let state: WheelState = 'collecting'
  const fingerIds: number[] = []
  let spinElapsedMs = 0
  let spinDurationMs = 0
  let selectedFingerIndex: number | undefined
  let result: GameResult | undefined

  function beginSpin(): void {
    state = 'spinning'
    spinElapsedMs = 0
    spinDurationMs = randomInt(random, spinMinMs, spinMaxMs + 1)
    selectedFingerIndex = randomInt(random, 0, fingerIds.length)
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        fingerIds: [...fingerIds],
        spinElapsedMs,
        spinDurationMs,
        selectedFingerIndex,
        result
      }
    },
    addFinger(id: number) {
      if (state !== 'collecting') return
      if (fingerIds.includes(id)) return
      if (fingerIds.length >= opts.playerCount) return
      fingerIds.push(id)
      if (fingerIds.length === opts.playerCount) beginSpin()
    },
    removeFinger(id: number) {
      if (state !== 'collecting') return
      const idx = fingerIds.indexOf(id)
      if (idx !== -1) fingerIds.splice(idx, 1)
    },
    tick(deltaMs: number) {
      if (state !== 'spinning') return
      if (deltaMs < 0) return
      spinElapsedMs += deltaMs
      if (spinElapsedMs >= spinDurationMs) {
        state = 'selected'
        result = { loser: selectedFingerIndex! }
      }
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/games/wheel.test.ts
```

Expected: 14 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/games/wheel/logic.ts tests/games/wheel.test.ts
git commit -m "feat(games): 指尖大轮盘 logic.ts（旋转时长与目标预定）"
```

---

### Task 2.6 · 👆 同屏反应大比拼 logic

**Files:**
- Create: `src/games/reaction/logic.ts`
- Create: `tests/games/reaction.test.ts`

**Spec 对齐（§5.4）：**
- 状态：`collecting → armed → signal → resolved`。
- 到齐 → `armed`；随机 3-10 秒后 `tick` 触发 → `signal`。
- `armed` 阶段有人松手 → 抢跑，立即 `resolved`，`loser = 抬手玩家 index`。
- `signal` 阶段玩家逐个松手；**最后松手的**玩家 → `resolved`，输。
- 在 `signal` 阶段，原 `fingerIds` 数组不变（用另一份 `releasedIds` 记录释放顺序）——这样"最后松手"就是 `releasedIds` 中最后一个的 index。

- [ ] **Step 1: 写失败测试 `tests/games/reaction.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createReactionGame } from '@/games/reaction/logic'

describe('createReactionGame', () => {
  it('要求人数 2-5', () => {
    expect(() => createReactionGame({ playerCount: 1 })).toThrow()
    expect(() => createReactionGame({ playerCount: 6 })).toThrow()
  })

  it('初始 collecting', () => {
    const g = createReactionGame({ playerCount: 3 })
    expect(g.getSnapshot().state).toBe('collecting')
  })

  it('到齐进入 armed 并确定 armedDelayMs', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    const s = g.getSnapshot()
    expect(s.state).toBe('armed')
    expect(s.armedDelayMs).toBeGreaterThanOrEqual(3000)
    expect(s.armedDelayMs).toBeLessThanOrEqual(10000)
    expect(s.armedDelayMs).toBe(3000)  // random=0 → 3000
  })

  it('collecting 阶段抬手只移除手指，不判负', () => {
    const g = createReactionGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)
    const s = g.getSnapshot()
    expect(s.state).toBe('collecting')
    expect(s.fingerIds).toEqual([11])
  })

  it('armed 阶段抬手 → 抢跑立输', () => {
    const g = createReactionGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    g.removeFinger(11)  // index 1 抢跑
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(1)
  })

  it('armed 阶段未知 id 抬手被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(999)
    expect(g.getSnapshot().state).toBe('armed')
  })

  it('tick 到 armedDelay 进入 signal', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })  // 3000ms
    g.addFinger(10); g.addFinger(11)
    g.tick(2999)
    expect(g.getSnapshot().state).toBe('armed')
    g.tick(2)
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段最后松手的玩家输', () => {
    const g = createReactionGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    g.tick(3000)
    g.removeFinger(11)   // index 1
    g.removeFinger(10)   // index 0
    expect(g.getSnapshot().state).toBe('signal')  // 还没全松
    g.removeFinger(12)   // index 2 最后松
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(2)
  })

  it('signal 阶段未松手的玩家不影响 resolve', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(10)
    // 只松了一个，signal 继续
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段同 id 重复松手只算一次', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(10)
    g.removeFinger(10)  // 重复
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段未知 id 松手被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(999)
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('resolved 状态后再 tick / remove 被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)  // 抢跑 resolved
    g.tick(5000)
    g.removeFinger(11)
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(0)
  })

  it('spinning 阶段（其实是 armed / signal）不接受新手指', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.addFinger(12)  // armed 阶段新增被忽略
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('重复 id 在 collecting 阶段被忽略', () => {
    const g = createReactionGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10])
  })

  it('负 delta 被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(-500)
    expect(g.getSnapshot().armedElapsedMs).toBe(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test tests/games/reaction.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/games/reaction/logic.ts`**

```ts
// src/games/reaction/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type ReactionState = 'collecting' | 'armed' | 'signal' | 'resolved'

export type ReactionSnapshot = {
  state: ReactionState
  playerCount: number
  fingerIds: number[]
  armedElapsedMs: number
  armedDelayMs: number
  signalElapsedMs: number
  releasedIds: number[]
  result?: GameResult
}

export type ReactionGame = {
  getSnapshot(): ReactionSnapshot
  addFinger(id: number): void
  removeFinger(id: number): void
  tick(deltaMs: number): void
}

const DEFAULT_ARMED_MIN_MS = 3000
const DEFAULT_ARMED_MAX_MS = 10000

export function createReactionGame(opts: {
  playerCount: number
  random?: RandomSource
  armedMinMs?: number
  armedMaxMs?: number
}): ReactionGame {
  if (opts.playerCount < 2 || opts.playerCount > 5) {
    throw new Error(`playerCount must be 2-5, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const armedMinMs = opts.armedMinMs ?? DEFAULT_ARMED_MIN_MS
  const armedMaxMs = opts.armedMaxMs ?? DEFAULT_ARMED_MAX_MS

  let state: ReactionState = 'collecting'
  const fingerIds: number[] = []
  const releasedIds: number[] = []
  let armedElapsedMs = 0
  let armedDelayMs = 0
  let signalElapsedMs = 0
  let result: GameResult | undefined

  function enterArmed(): void {
    state = 'armed'
    armedElapsedMs = 0
    armedDelayMs = randomInt(random, armedMinMs, armedMaxMs + 1)
  }

  function indexOf(id: number): number {
    return fingerIds.indexOf(id)
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        fingerIds: [...fingerIds],
        armedElapsedMs,
        armedDelayMs,
        signalElapsedMs,
        releasedIds: [...releasedIds],
        result
      }
    },
    addFinger(id: number) {
      if (state !== 'collecting') return
      if (fingerIds.includes(id)) return
      if (fingerIds.length >= opts.playerCount) return
      fingerIds.push(id)
      if (fingerIds.length === opts.playerCount) enterArmed()
    },
    removeFinger(id: number) {
      if (state === 'collecting') {
        const idx = fingerIds.indexOf(id)
        if (idx !== -1) fingerIds.splice(idx, 1)
        return
      }
      if (state === 'armed') {
        const idx = indexOf(id)
        if (idx === -1) return
        state = 'resolved'
        result = { loser: idx }
        return
      }
      if (state === 'signal') {
        const idx = indexOf(id)
        if (idx === -1) return
        if (releasedIds.includes(id)) return
        releasedIds.push(id)
        if (releasedIds.length === fingerIds.length) {
          state = 'resolved'
          result = { loser: idx }
        }
      }
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state === 'armed') {
        armedElapsedMs += deltaMs
        if (armedElapsedMs >= armedDelayMs) {
          state = 'signal'
          signalElapsedMs = 0
        }
        return
      }
      if (state === 'signal') {
        signalElapsedMs += deltaMs
      }
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

```bash
pnpm test tests/games/reaction.test.ts
```

Expected: 15 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/games/reaction/logic.ts tests/games/reaction.test.ts
git commit -m "feat(games): 同屏反应 logic.ts（armed/signal/抢跑/最后松手）"
```

---

### Task 2.7 · 集成验证与覆盖率

**Files:** 无代码改动，仅验证。

- [ ] **Step 1: 跑全部测试**

```bash
pnpm test
```

Expected: 所有测试（Plan 1 的 stores/theme/native 测试 + Plan 2 的 games 测试）全部 PASS。

- [ ] **Step 2: 跑覆盖率**

```bash
pnpm test -- --coverage
```

Expected: `src/games/**/*.ts` 中每个 `logic.ts` 的 lines / branches 覆盖率 > 80%（spec §9.1 要求）。若某款 logic 覆盖不足，回到对应 Task 补测。

- [ ] **Step 3: 列出覆盖率低于 80% 的文件并修复**

查看 `coverage/index.html` 或终端输出：
- 若某一 logic.ts 覆盖率不足，定位未覆盖的分支（通常是状态守卫分支，如"ready 状态下调 action"），回到对应 Task 补一个测试用例 + commit。

- [ ] **Step 4: Commit 结束标签**

```bash
git commit --allow-empty -m "chore: Phase 2 游戏 logic 全部通过 + 覆盖率 > 80%"
git tag v0.2.0-game-logic
```

---

## Self-Review 小结

- **Spec 覆盖**：5.1 赛马 → Task 2.4；5.2 炸弹 → Task 2.3；5.3 鳄鱼 → Task 2.2；5.4 反应 → Task 2.6；5.5 轮盘 → Task 2.5。9.1 单测覆盖率 > 80% → Task 2.7 验证。
- **依赖注入**：所有 logic 接收 `random: RandomSource`，单测用恒定/种子随机源；所有时间通过 `tick(deltaMs)` 显式推进，无定时器。
- **类型一致**：`GameResult`、`RandomSource` 在 `src/games/types.ts` 定义，5 款 logic 各自导入。方法签名：工厂叫 `createXxxGame(opts)`；快照叫 `getSnapshot()`。无跨 logic 共享行为。
- **与 Plan 1 不冲突**：Plan 1 的 `session.ts` 已有 `GameId` 类型，本 Plan 的游戏 id 命名（`bomb` / `crocodile` / `horse-race` / `reaction` / `wheel`）与 Plan 1 中 `stores/session.ts` 和 `pages/lobby/games.uvue` 的 `GameId` 一致，后续 Plan 3 接入 UI 时可平滑对接。

---

## 附录 · Plan 3+ 预览

- **Plan 3 · 游戏 UI 接入**：5 款 `pages/game/<id>/index.uvue`，绑定 logic + native 能力（传感器/振动/音效/多指）；替换 `pages/game/placeholder.uvue`。
- **Plan 4 · 惩罚库**：`stores/punishment.ts`、`pages/punishment/index.uvue`、`src/data/builtin-punishments.json`（25 条）、`pickPunishment` 纯函数 + 单测；结算页联动。
- **Plan 5 · 视觉与音效**：双主题插画资源、动画、音效包。
- **Plan 6 · 中断恢复与打包**：切后台/来电暂停；鸿蒙签名打包。
