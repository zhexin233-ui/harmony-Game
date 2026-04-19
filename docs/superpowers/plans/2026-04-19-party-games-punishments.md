# 鸿蒙派对小游戏 · 实施计划 4（Phase 4：惩罚库）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 Spec §4.1–4.4 描述的本地惩罚规则库：25 条内置数据、Pinia Store（加载 / 持久化 / 合并 / 墓碑 / 抽取）、规则管理页（列表 / 新增 / 编辑 / 删除 / 启停）、结算页替换占位为真实抽取 + 空库降级，一次性完成 Phase 4 全部范围，让每局游戏结算都能抽到真惩罚。

**Architecture:** 新增 `stores/punishment.ts` 管理规则数组；内置数据从 `data/builtin-punishments.json` 静态 import 进来；存储键 `punishments` 采用 `{ rules, deletedBuiltinIds }` 两段结构，加载时与内置清单合并（保留用户 `enabled` 与墓碑），用户新增的自定义条目 `builtIn=false`；`pages/punishment/index.uvue` 提供列表 UI，`pages/punishment/edit.uvue` 负责新增/编辑；`pages/game/result.uvue` 改为调用 `store.pick()`，返回 null 时渲染空库空状态并提供跳转管理页的入口。

**Tech Stack:** uni-app x（UVue + UTS）· Vue 3 组合式 API · Pinia · Vitest · TypeScript strict

**Spec 引用：** `docs/superpowers/specs/2026-04-18-party-games-design.md` §4.1 / §4.2 / §4.3 / §4.4 / §8（"惩罚库全部停用"一行） / §12 Phase 4

**前置依赖：**
- Plan 1（骨架）：`stores/settings.ts`、`App.uvue` 的 `onLaunch` 已建立、`pages/punishment/index.uvue` 已存在占位、`pages/game/result.uvue` 已存在占位抽取。
- Plan 2（逻辑）：不依赖，但 `session.loser` 已稳定写入。
- Plan 3（游戏 UI）：已把 5 款游戏跑通到结算页。

**范围 · Plan 4 包含：**
- 25 条内置惩罚 JSON 数据文件。
- `utils/id.ts` 简易 ID 生成器（`custom-<timestamp>-<rand>`）。
- `stores/punishment.ts`：类型、加载、持久化、合并算法、墓碑、`pick()`、CRUD 操作。
- `tests/stores/punishment.test.ts`：覆盖合并、墓碑、pick 空/单/多池、CRUD。
- `App.uvue` onLaunch 中初始化 Punishment Store。
- `pages/game/result.uvue`：替换占位随机为 `pick()`；空池时渲染空状态 + 跳转管理页入口；成功时写入 `session.pickedPunishmentText`。
- `pages/punishment/index.uvue`：完整列表 UI（滚动 + 启停开关 + 编辑 / 删除 + 新增按钮 + 空态）。
- `pages/punishment/edit.uvue`：新增 / 编辑页（query `mode=add|edit`、`id=<id>` 区分）。
- `pages.json`：注册 edit 路由。
- 与现有 `tests/stores/settings.test.ts` 风格保持一致的 Vitest setup 复用。

**范围 · Plan 4 不包含（留待 Plan 5+）：**
- 正式插画与完整音效资源（当前 `utils/game-sounds.ts` 已有 ID 映射，音效文件缺失时静默降级继续沿用）。
- 主题资产打磨、动画微调。
- 鸿蒙真机签名、打包、应用市场发布。
- 惩罚库的分类 / 标签 / 难度系统（YAGNI）。
- 惩罚历史记录（YAGNI，Spec §2.2 明确不做）。

---

## 文件结构

> ⚠️ 本仓库采用扁平目录（非 `src/`），目录名即模块名。路径别名 `@/` 映射到仓库根（`tsconfig.json` / `vitest.config.ts` 已配好）。

| 文件路径 | 类型 | 职责 |
|---|---|---|
| `data/builtin-punishments.ts` | 创建 | 25 条内置惩罚（id=`builtin-01`..`builtin-25`、text、builtIn=true）。Spec §4.3 原文为 `.json`；改成 `.ts` 的原因：UVue/UTS 对原始 JSON 导入支持不稳定，而仓库 `tsconfig.json:18` 的 `include` 已包含 `data/**/*.ts`，两端（UVue 运行时 + Vitest）一视同仁 |
| `utils/id.ts` | 创建 | `generateCustomId()` 生成自定义规则 ID |
| `stores/punishment.ts` | 创建 | `PunishmentRule` 类型 + Store（load/persist/merge/pick/add/update/toggle/remove） |
| `tests/stores/punishment.test.ts` | 创建 | Punishment Store 单测 |
| `App.uvue` | 修改 | onLaunch 增加 `usePunishment().load()` |
| `pages/game/result.uvue` | 修改 | 用 `pick()` 替换 placeholders；空库空态 + 入口 |
| `pages/punishment/index.uvue` | 修改（整体重写） | 规则列表：开关 / 编辑 / 删除 / 新增；空态提示 |
| `pages/punishment/edit.uvue` | 创建 | 新增 / 编辑页；textarea + 保存 + 取消 |
| `pages.json` | 修改 | 注册 `pages/punishment/edit` 路由 |
| `session.ts` | 不变 | 继续使用 `pickedPunishmentText`，不引入 `PunishmentRule` 引用以维持解耦 |

---

## 设计约定（阅读全部 Task 前必读）

### 1. 存储键 `punishments` 的格式

```ts
// 存入 uni.storage 的顶层对象
type StoredPunishments = {
  rules: PunishmentRule[]          // 用户当前可见的全部规则（内置 + 自定义）
  deletedBuiltinIds: string[]      // 用户主动删除的内置 ID（升级时不再重新出现）
}
```

**为什么是这种结构？** Spec §4.3 明确要求"用户删除的内置条目以「本地标记删除」的方式记录，升级后不重新出现"。如果只存 `rules[]`，版本升级增加一条内置时，无法区分"用户从未见过"和"用户手动删除"。用墓碑单独存一个 `deletedBuiltinIds` 是最简实现。

### 2. 合并算法（load 时执行）

```ts
function merge(stored: StoredPunishments, builtin: PunishmentRule[]): PunishmentRule[] {
  const result: PunishmentRule[] = []
  const storedById = new Map<string, PunishmentRule>()
  for (const r of stored.rules) storedById.set(r.id, r)
  const tombstones = new Set(stored.deletedBuiltinIds)

  // 1) 按内置清单顺序处理每一条内置
  for (const b of builtin) {
    if (tombstones.has(b.id)) continue        // 被墓碑过滤
    const prev = storedById.get(b.id)
    if (prev) {
      // 保留用户的 enabled，text 以最新内置为准（允许文案修正）
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: prev.enabled })
    } else {
      // 用户从未见过：新条目默认启用
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: true })
    }
  }
  // 2) 追加所有自定义条目（保序，按用户新增顺序）
  for (const r of stored.rules) {
    if (!r.builtIn) result.push(r)
  }
  return result
}
```

### 3. `pickPunishment` 行为

严格遵循 Spec §4.4 的伪代码：

```ts
function pickPunishment(rules: PunishmentRule[]): PunishmentRule | null {
  const pool = rules.filter(r => r.enabled)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
```

### 4. 为什么独立 `edit.uvue` 页而不是对话框

UVue 对原生 dialog / modal 封装有限，且新增/编辑的文本可能较长，弹窗输入体验差；独立页 + query 参数传递 `id` 是 uni-app 最常见的做法，也便于 Plan 1 既有的 `navigateTo` / `navigateBack` 习惯。

### 5. ID 生成

自定义规则 ID 格式：`custom-<Date.now()>-<6 位 36 进制随机>`。UVue 环境没有 `crypto.randomUUID()`，不引入依赖即可，碰撞概率足够低（单机使用场景）。

### 6. `Record<string, never>` / 可选链的规避

UTS 对部分 TS 语法有限制（Plan 3 中已踩过坑）。本计划涉及到的新代码避免使用：
- `??` 空值合并（用三元表达式或显式 `if`）
- `?.` 可选链穿透（`const x = obj && obj.field`）
- 泛型约束（`<T extends X>` 能省则省）

`stores/settings.ts` 已是安全范式，本计划以其为模板。

---

## Task 1：内置惩罚数据文件

**Files:**
- Create: `data/builtin-punishments.ts`

- [ ] **Step 1：创建数据文件**

用 TS 数组承载（见"文件结构"表中的选择说明）。以下 25 条为首版内置（偏软性、适合聚会、不涉及违法不雅）。ID 命名 `builtin-01`..`builtin-25`，方便后续升级按序号追加：

```ts
// data/builtin-punishments.ts
// Spec §4.3 的 25 条内置惩罚。
// 原 Spec 写的是 .json，改为 .ts 的原因见 "文件结构" 表。

export const BUILTIN_PUNISHMENTS: Array<{
  id: string
  text: string
  builtIn: boolean
  enabled: boolean
}> = [
  { id: 'builtin-01', text: '学三声狗叫', builtIn: true, enabled: true },
  { id: 'builtin-02', text: '表演一段绕口令', builtIn: true, enabled: true },
  { id: 'builtin-03', text: '做 5 个俯卧撑', builtIn: true, enabled: true },
  { id: 'builtin-04', text: '向全桌敬酒一杯（可换饮料）', builtIn: true, enabled: true },
  { id: 'builtin-05', text: '唱一首歌的副歌', builtIn: true, enabled: true },
  { id: 'builtin-06', text: '模仿一位明星说话 10 秒', builtIn: true, enabled: true },
  { id: 'builtin-07', text: '讲一个冷笑话', builtIn: true, enabled: true },
  { id: 'builtin-08', text: '做 10 个深蹲', builtIn: true, enabled: true },
  { id: 'builtin-09', text: '跳 20 秒开合跳', builtIn: true, enabled: true },
  { id: 'builtin-10', text: '保持微笑 30 秒，不许出声', builtIn: true, enabled: true },
  { id: 'builtin-11', text: '用反手在纸上写自己名字', builtIn: true, enabled: true },
  { id: 'builtin-12', text: '模仿一个动物走路 10 秒', builtIn: true, enabled: true },
  { id: 'builtin-13', text: '给下家揉 30 秒肩膀', builtIn: true, enabled: true },
  { id: 'builtin-14', text: '本局起担任记分员 1 轮', builtIn: true, enabled: true },
  { id: 'builtin-15', text: '说出 5 种水果的英文名', builtIn: true, enabled: true },
  { id: 'builtin-16', text: '讲一段最近发生的糗事', builtIn: true, enabled: true },
  { id: 'builtin-17', text: '原地闭眼转三圈后走一条直线', builtIn: true, enabled: true },
  { id: 'builtin-18', text: '表演 15 秒鬼畜舞蹈', builtIn: true, enabled: true },
  { id: 'builtin-19', text: '学婴儿哭 5 秒', builtIn: true, enabled: true },
  { id: 'builtin-20', text: '下一局开始前大喊三次「我一定赢」', builtIn: true, enabled: true },
  { id: 'builtin-21', text: '给在场任意一位玩家一句真心夸奖', builtIn: true, enabled: true },
  { id: 'builtin-22', text: '下一轮只能用「嗯」「啊」回答', builtIn: true, enabled: true },
  { id: 'builtin-23', text: '模仿一段广告词', builtIn: true, enabled: true },
  { id: 'builtin-24', text: '单腿站立 15 秒', builtIn: true, enabled: true },
  { id: 'builtin-25', text: '朗读下家最近一条朋友圈（不涉及隐私）', builtIn: true, enabled: true }
]
```

- [ ] **Step 2：提交**

```bash
git add data/builtin-punishments.ts
git commit -m "feat(punishment): 添加 25 条内置惩罚数据"
```

---

## Task 2：ID 生成工具

**Files:**
- Create: `utils/id.ts`
- Test: 通过 Task 3 的 store 测试间接覆盖（本身无复杂分支，无需独立测试）

- [ ] **Step 1：创建文件**

```ts
// utils/id.ts
// 为自定义惩罚规则生成本地 ID。UVue 环境下无 crypto.randomUUID，
// 用时间戳 + 6 位 36 进制随机足够避免单设备碰撞。

export function generateCustomId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.floor(Math.random() * 1e12).toString(36).slice(0, 6).padStart(6, '0')
  return `custom-${ts}-${rand}`
}
```

- [ ] **Step 2：提交**

```bash
git add utils/id.ts
git commit -m "feat(utils): 添加 generateCustomId 本地 ID 生成器"
```

---

## Task 3：Punishment Store（类型 + 加载 + 合并）

**Files:**
- Create: `stores/punishment.ts`
- Test: `tests/stores/punishment.test.ts`

- [ ] **Step 1：写失败测试（合并算法）**

```ts
// tests/stores/punishment.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePunishment, type PunishmentRule } from '@/stores/punishment'

describe('usePunishment - load & merge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('首次启动：无存储时加载全部 25 条内置并默认 enabled=true', () => {
    const p = usePunishment()
    p.load()
    expect(p.rules.length).toBe(25)
    expect(p.rules.every(r => r.builtIn === true)).toBe(true)
    expect(p.rules.every(r => r.enabled === true)).toBe(true)
  })

  it('二次启动：保留用户的 enabled 状态', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return {
          rules: [{ id: 'builtin-01', text: '学三声狗叫', builtIn: true, enabled: false }],
          deletedBuiltinIds: []
        }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    const b01 = p.rules.find(r => r.id === 'builtin-01')!
    expect(b01.enabled).toBe(false)
  })

  it('墓碑：用户删除的内置条目升级后不重新出现', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return { rules: [], deletedBuiltinIds: ['builtin-05'] }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    expect(p.rules.find(r => r.id === 'builtin-05')).toBeUndefined()
    expect(p.rules.length).toBe(24)
  })

  it('自定义条目：按用户新增顺序追加在内置之后', () => {
    const custom1: PunishmentRule = { id: 'custom-a', text: '自定义1', builtIn: false, enabled: true }
    const custom2: PunishmentRule = { id: 'custom-b', text: '自定义2', builtIn: false, enabled: false }
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return { rules: [custom1, custom2], deletedBuiltinIds: [] }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    expect(p.rules.length).toBe(27)
    expect(p.rules[25]).toEqual(custom1)
    expect(p.rules[26]).toEqual(custom2)
  })

  it('文案修正：内置 text 以 builtin.json 为准（忽略旧存储）', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return {
          rules: [{ id: 'builtin-01', text: '旧文案', builtIn: true, enabled: true }],
          deletedBuiltinIds: []
        }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    const b01 = p.rules.find(r => r.id === 'builtin-01')!
    expect(b01.text).toBe('学三声狗叫')
  })
})
```

- [ ] **Step 2：运行测试确认失败**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：失败，因为 `@/stores/punishment` 不存在。

- [ ] **Step 3：创建 Store（类型 + load）**

```ts
// stores/punishment.ts
import { defineStore } from 'pinia'
import { BUILTIN_PUNISHMENTS } from '@/data/builtin-punishments'

export type PunishmentRule = {
  id: string
  text: string
  builtIn: boolean
  enabled: boolean
}

type StoredPunishments = {
  rules: PunishmentRule[]
  deletedBuiltinIds: string[]
}

const BUILTIN: PunishmentRule[] = BUILTIN_PUNISHMENTS as PunishmentRule[]

function merge(stored: StoredPunishments): PunishmentRule[] {
  const result: PunishmentRule[] = []
  const storedById = new Map<string, PunishmentRule>()
  for (const r of stored.rules) storedById.set(r.id, r)
  const tombstones = new Set(stored.deletedBuiltinIds)

  for (const b of BUILTIN) {
    if (tombstones.has(b.id)) continue
    const prev = storedById.get(b.id)
    if (prev) {
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: prev.enabled })
    } else {
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: true })
    }
  }
  for (const r of stored.rules) {
    if (!r.builtIn) result.push(r)
  }
  return result
}

export const usePunishment = defineStore('punishment', {
  state: () => ({
    rules: [] as PunishmentRule[],
    deletedBuiltinIds: [] as string[]
  }),
  actions: {
    load() {
      const raw = uni.getStorageSync('punishments')
      let stored: StoredPunishments = { rules: [], deletedBuiltinIds: [] }
      if (raw && typeof raw === 'object') {
        const o = raw as Partial<StoredPunishments>
        if (Array.isArray(o.rules)) stored.rules = o.rules as PunishmentRule[]
        if (Array.isArray(o.deletedBuiltinIds)) stored.deletedBuiltinIds = o.deletedBuiltinIds
      }
      this.rules = merge(stored)
      this.deletedBuiltinIds = stored.deletedBuiltinIds
    }
  }
})
```

- [ ] **Step 4：运行测试确认通过**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：全部 5 条通过。

- [ ] **Step 5：提交**

```bash
git add stores/punishment.ts tests/stores/punishment.test.ts
git commit -m "feat(punishment): Punishment Store 类型与加载合并算法"
```

---

## Task 4：Punishment Store（pick 抽取算法）

**Files:**
- Modify: `stores/punishment.ts`
- Modify: `tests/stores/punishment.test.ts`

- [ ] **Step 1：追加失败测试**

在 `tests/stores/punishment.test.ts` 末尾追加：

```ts
describe('usePunishment - pick', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('启用池为空时返回 null', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    expect(p.pick()).toBeNull()
  })

  it('启用池只有一条时必定返回该条', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    p.rules[3].enabled = true
    const picked = p.pick()
    expect(picked).not.toBeNull()
    expect(picked!.id).toBe(p.rules[3].id)
  })

  it('多条启用时返回的结果在启用池中', () => {
    const p = usePunishment()
    p.load()
    // 全部启用（默认）
    for (let i = 0; i < 100; i++) {
      const picked = p.pick()
      expect(picked).not.toBeNull()
      expect(picked!.enabled).toBe(true)
    }
  })

  it('禁用 / 启用变化会立刻反映到抽取池', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    // 只启用 builtin-07
    const target = p.rules.find(r => r.id === 'builtin-07')!
    target.enabled = true
    for (let i = 0; i < 20; i++) {
      expect(p.pick()!.id).toBe('builtin-07')
    }
  })
})
```

- [ ] **Step 2：运行确认失败**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：`p.pick is not a function`。

- [ ] **Step 3：添加 `pick` action**

在 `stores/punishment.ts` 的 `actions` 块中追加：

```ts
    pick(): PunishmentRule | null {
      const pool: PunishmentRule[] = []
      for (const r of this.rules) {
        if (r.enabled) pool.push(r)
      }
      if (pool.length === 0) return null
      const idx = Math.floor(Math.random() * pool.length)
      return pool[idx]
    },
```

- [ ] **Step 4：运行测试通过**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：全部通过。

- [ ] **Step 5：提交**

```bash
git add stores/punishment.ts tests/stores/punishment.test.ts
git commit -m "feat(punishment): 实现 pick 抽取算法与空池返回 null"
```

---

## Task 5：Punishment Store（CRUD 操作 + 持久化）

**Files:**
- Modify: `stores/punishment.ts`
- Modify: `tests/stores/punishment.test.ts`

- [ ] **Step 1：追加失败测试**

```ts
describe('usePunishment - CRUD', () => {
  let written: Record<string, unknown>
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
    written = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => {
      written[k] = v
    }
  })

  it('addRule：追加自定义条目并持久化', () => {
    const p = usePunishment()
    p.load()
    const before = p.rules.length
    const newId = p.addRule('唱国歌')
    expect(p.rules.length).toBe(before + 1)
    const added = p.rules.find(r => r.id === newId)!
    expect(added.text).toBe('唱国歌')
    expect(added.builtIn).toBe(false)
    expect(added.enabled).toBe(true)
    expect((written['punishments'] as any).rules.find((r: any) => r.id === newId)).toBeTruthy()
  })

  it('updateRule：修改 text 并持久化（内置与自定义都允许）', () => {
    const p = usePunishment()
    p.load()
    p.updateRule('builtin-01', '改后文案')
    expect(p.rules.find(r => r.id === 'builtin-01')!.text).toBe('改后文案')
    expect((written['punishments'] as any).rules.find((r: any) => r.id === 'builtin-01').text).toBe('改后文案')
  })

  it('toggleRule：切换 enabled 并持久化', () => {
    const p = usePunishment()
    p.load()
    p.toggleRule('builtin-02')
    expect(p.rules.find(r => r.id === 'builtin-02')!.enabled).toBe(false)
    p.toggleRule('builtin-02')
    expect(p.rules.find(r => r.id === 'builtin-02')!.enabled).toBe(true)
  })

  it('removeRule 自定义：直接从 rules 中移除', () => {
    const p = usePunishment()
    p.load()
    const id = p.addRule('自定义临时')
    const before = p.rules.length
    p.removeRule(id)
    expect(p.rules.length).toBe(before - 1)
    expect(p.rules.find(r => r.id === id)).toBeUndefined()
    expect((written['punishments'] as any).deletedBuiltinIds).toEqual([])
  })

  it('removeRule 内置：移除并加入墓碑，升级后不重新出现', () => {
    const p = usePunishment()
    p.load()
    p.removeRule('builtin-10')
    expect(p.rules.find(r => r.id === 'builtin-10')).toBeUndefined()
    expect(p.deletedBuiltinIds).toContain('builtin-10')
    expect((written['punishments'] as any).deletedBuiltinIds).toContain('builtin-10')

    // 模拟"下次冷启动"，从 storage 重新 load 同一 pinia 实例
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') return written['punishments']
      return ''
    }
    const p2 = usePunishment()
    p2.load()
    expect(p2.rules.find(r => r.id === 'builtin-10')).toBeUndefined()
  })

  it('updateRule 找不到 id：静默 no-op（不抛错）', () => {
    const p = usePunishment()
    p.load()
    expect(() => p.updateRule('nope', 'xxx')).not.toThrow()
  })

  it('addRule：空白文本不入库（trim 后为空）', () => {
    const p = usePunishment()
    p.load()
    const before = p.rules.length
    const id = p.addRule('   ')
    expect(id).toBe('')       // 约定：返回空字符串表示未添加
    expect(p.rules.length).toBe(before)
  })
})
```

- [ ] **Step 2：运行确认失败**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：`p.addRule is not a function` 等。

- [ ] **Step 3：实现 CRUD + 持久化**

在 `stores/punishment.ts` 中：

```ts
// 文件顶部新增 import
import { generateCustomId } from '@/utils/id'

// actions 中新增：
    persist() {
      uni.setStorageSync('punishments', {
        rules: this.rules,
        deletedBuiltinIds: this.deletedBuiltinIds
      })
    },
    addRule(text: string): string {
      const trimmed = text.trim()
      if (trimmed.length === 0) return ''
      const id = generateCustomId()
      this.rules.push({ id, text: trimmed, builtIn: false, enabled: true })
      this.persist()
      return id
    },
    updateRule(id: string, text: string) {
      const trimmed = text.trim()
      if (trimmed.length === 0) return
      const rule = this.rules.find(r => r.id === id)
      if (!rule) return
      rule.text = trimmed
      this.persist()
    },
    toggleRule(id: string) {
      const rule = this.rules.find(r => r.id === id)
      if (!rule) return
      rule.enabled = !rule.enabled
      this.persist()
    },
    removeRule(id: string) {
      const idx = this.rules.findIndex(r => r.id === id)
      if (idx < 0) return
      const rule = this.rules[idx]
      if (rule.builtIn) {
        if (!this.deletedBuiltinIds.includes(rule.id)) {
          this.deletedBuiltinIds.push(rule.id)
        }
      }
      this.rules.splice(idx, 1)
      this.persist()
    }
```

- [ ] **Step 4：运行测试通过**

```bash
pnpm vitest run tests/stores/punishment.test.ts
```

Expected：全部通过。

- [ ] **Step 5：运行全量测试确认无回归**

```bash
pnpm vitest run
```

Expected：全部通过（含原有 Plan 1/2 测试）。

- [ ] **Step 6：提交**

```bash
git add stores/punishment.ts tests/stores/punishment.test.ts
git commit -m "feat(punishment): Store CRUD 操作与持久化（含墓碑写入）"
```

---

## Task 6：App.uvue 初始化 Punishment Store

**Files:**
- Modify: `App.uvue:10-15` 的 `onLaunch` 回调

- [ ] **Step 1：在 `onLaunch` 中增加 load**

定位到当前的：

```uts
		onLaunch(() => {
			console.log('App Launch')
			const settings = useSettings()
			settings.load()
			const target = settings.hasOnboarded ? '/pages/home/index' : '/pages/onboarding/index'
			uni.reLaunch({ url: target })
			// ...
		})
```

改为：

```uts
		onLaunch(() => {
			console.log('App Launch')
			const settings = useSettings()
			settings.load()
			const punishment = usePunishment()
			punishment.load()
			const target = settings.hasOnboarded ? '/pages/home/index' : '/pages/onboarding/index'
			uni.reLaunch({ url: target })
			// ...
		})
```

并在 `<script setup>` 顶部的 import 区追加：

```uts
	import { usePunishment } from '@/stores/punishment'
```

- [ ] **Step 2：运行全量测试**

```bash
pnpm vitest run
```

Expected：全部通过。

- [ ] **Step 3：提交**

```bash
git add App.uvue
git commit -m "feat(app): 启动时加载 Punishment Store 并合并内置数据"
```

---

## Task 7：结算页接入真实抽取 + 空库降级

**Files:**
- Modify: `pages/game/result.uvue`（全文重写）

- [ ] **Step 1：重写结算页**

完整覆盖现有 `pages/game/result.uvue`：

```vue
<template>
	<view class="container">
		<text class="title">本局结果</text>
		<text class="loser">{{ loserName }} 输啦！</text>

		<view v-if="punishment !== ''" class="card">
			<text class="label">抽到的惩罚</text>
			<text class="punishment">{{ punishment }}</text>
		</view>
		<view v-else class="empty">
			<text class="empty-emoji">📭</text>
			<text class="empty-title">惩罚库为空</text>
			<text class="empty-desc">启用至少一条规则，才能抽惩罚。</text>
			<AppButton label="去管理惩罚规则" variant="primary" @tap="toPunishment" />
		</view>

		<AppButton label="再来一局" variant="primary" @tap="restart" />
		<AppButton label="换游戏" variant="secondary" @tap="toLobby" />
		<AppButton label="回首页" variant="ghost" @tap="home" />
	</view>
</template>

<script setup lang="uts">
	import AppButton from '@/components/AppButton.uvue'
	import { useSession, type GameId } from '@/stores/session'
	import { usePunishment } from '@/stores/punishment'

	const session = useSession()
	const punishmentStore = usePunishment()

	// 结算页入口只抽一次；写入 session.pickedPunishmentText 便于后续需要时回显。
	const picked = punishmentStore.pick()
	let punishment = ''
	if (picked != null) {
		punishment = picked.text
		session.pickedPunishmentText = picked.text
	} else {
		session.pickedPunishmentText = undefined
	}

	const loserName = session.loser !== undefined ? session.displayNameOf(session.loser as number) : '神秘玩家'

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
	function toLobby() {
		session.exitToLobby()
		uni.redirectTo({ url: '/pages/lobby/games' })
	}
	function home() {
		session.clear()
		uni.reLaunch({ url: '/pages/home/index' })
	}
	function toPunishment() {
		uni.navigateTo({ url: '/pages/punishment/index' })
	}
</script>

<style>
	.container {
		padding: 32px;
		align-items: center;
	}
	.title {
		font-size: 22px;
		margin-bottom: 12px;
	}
	.loser {
		font-size: 28px;
		font-weight: bold;
		color: var(--danger, #FF6B9D);
	}
	.card {
		width: 100%;
		padding: 20px;
		margin: 20px 0;
		border-radius: 16px;
		background-color: var(--bg-end, #FFE5F1);
		align-items: center;
	}
	.empty {
		width: 100%;
		padding: 24px;
		margin: 20px 0;
		border-radius: 16px;
		background-color: var(--bg-end, #FFE5F1);
		align-items: center;
	}
	.empty-emoji { font-size: 48px; }
	.empty-title {
		font-size: 18px;
		font-weight: bold;
		margin-top: 8px;
	}
	.empty-desc {
		color: var(--text-muted, #7A6A87);
		margin-top: 6px;
		margin-bottom: 12px;
		text-align: center;
	}
	.label { color: var(--text-muted, #7A6A87); }
	.punishment {
		font-size: 20px;
		font-weight: bold;
		margin-top: 8px;
	}
</style>
```

- [ ] **Step 2：手动冒烟（准备阶段）**

在开发机运行 `pnpm dev:h5`（或 HBuilderX 运行到浏览器 / 鸿蒙模拟器），走一次 `首页 → 选人 → 大厅 → 任选游戏 → 结算` 验证：

- 惩罚卡片显示一条真实规则。
- 点"再来一局"重新抽一条（可能不同）。

- [ ] **Step 3：手动冒烟（空库）**

进入 `惩罚规则` 页把所有 25 条关闭（Task 8 完成后再做；若本 Task 暂不可行，打开 HBuilderX 的调试台手动执行：`uni.setStorageSync('punishments', { rules: [], deletedBuiltinIds: [] })` 并重启应用）。再走一次游戏：

- 结算页显示"惩罚库为空"空态与"去管理惩罚规则"按钮。

若 Task 8 尚未完成，至少通过 Dev Console 验证空态 UI 可渲染；完整交互验收推到 Task 11 E2E 清单。

- [ ] **Step 4：提交**

```bash
git add pages/game/result.uvue
git commit -m "feat(result): 接入真实惩罚抽取 + 空库降级空态"
```

---

## Task 8：惩罚规则列表页

**Files:**
- Modify: `pages/punishment/index.uvue`（全文重写）

- [ ] **Step 1：重写列表页**

```vue
<template>
	<view class="container">
		<view v-if="store.rules.length === 0" class="empty">
			<text class="empty-emoji">📭</text>
			<text class="empty-title">惩罚库为空</text>
			<text class="empty-desc">添加一条规则开始玩。</text>
			<AppButton label="＋ 新增" variant="primary" @tap="goAdd" />
			<AppButton label="返回" variant="ghost" @tap="back" />
		</view>

		<scroll-view v-else scroll-y class="list">
			<view v-for="rule in store.rules" :key="rule.id" class="row">
				<view class="row-main">
					<text :class="{ 'text-disabled': !rule.enabled }" class="text">{{ rule.text }}</text>
					<text class="badge">{{ rule.builtIn ? '内置' : '自定义' }}</text>
				</view>
				<view class="row-actions">
					<switch :checked="rule.enabled" @change="toggle(rule.id)" />
					<text class="action" @tap="goEdit(rule.id)">编辑</text>
					<text class="action action-danger" @tap="confirmRemove(rule)">删除</text>
				</view>
			</view>
		</scroll-view>

		<view v-if="store.rules.length > 0" class="footer">
			<AppButton label="＋ 新增" variant="primary" @tap="goAdd" />
			<AppButton label="返回" variant="ghost" @tap="back" />
		</view>
	</view>
</template>

<script setup lang="uts">
	import AppButton from '@/components/AppButton.uvue'
	import { usePunishment, type PunishmentRule } from '@/stores/punishment'

	const store = usePunishment()

	function toggle(id: string) { store.toggleRule(id) }

	function goAdd() {
		uni.navigateTo({ url: '/pages/punishment/edit?mode=add' })
	}
	function goEdit(id: string) {
		uni.navigateTo({ url: '/pages/punishment/edit?mode=edit&id=' + encodeURIComponent(id) })
	}
	function confirmRemove(rule: PunishmentRule) {
		uni.showModal({
			title: '删除规则',
			content: '确认删除「' + rule.text + '」？' + (rule.builtIn ? '内置条目删除后下次升级不会重新出现。' : ''),
			success: (res) => {
				if (res.confirm) store.removeRule(rule.id)
			}
		})
	}
	function back() { uni.navigateBack({}) }
</script>

<style>
	.container {
		padding: 16px 16px 24px 16px;
		flex: 1;
	}
	.empty {
		align-items: center;
		padding: 40px 24px;
	}
	.empty-emoji { font-size: 56px; }
	.empty-title {
		font-size: 20px;
		font-weight: bold;
		margin-top: 12px;
	}
	.empty-desc {
		color: var(--text-muted, #7A6A87);
		margin: 10px 0 20px 0;
		text-align: center;
	}
	.list { flex: 1; }
	.row {
		padding: 14px 12px;
		border-bottom-width: 1px;
		border-bottom-color: rgba(0,0,0,0.08);
		border-bottom-style: solid;
	}
	.row-main { flex-direction: row; align-items: center; }
	.text {
		flex: 1;
		font-size: 16px;
		color: var(--text, #3D2F4F);
	}
	.text-disabled { opacity: 0.4; }
	.badge {
		font-size: 11px;
		color: var(--text-muted, #7A6A87);
		margin-left: 8px;
		padding: 2px 8px;
		border-radius: 10px;
		background-color: var(--bg-end, #FFE5F1);
	}
	.row-actions {
		flex-direction: row;
		align-items: center;
		margin-top: 8px;
		justify-content: flex-end;
	}
	.action {
		margin-left: 16px;
		color: var(--primary, #FF6B9D);
		font-size: 14px;
	}
	.action-danger { color: #E74C3C; }
	.footer { margin-top: 16px; }
</style>
```

- [ ] **Step 2：手动冒烟**

运行 `pnpm dev:h5`：

- 首页 → 惩罚规则：列表显示 25 条内置，全部 `enabled=true`。
- 关闭其中若干 → 返回首页再进入，状态保留。
- 点"删除"一条内置 → 确认弹窗 → 列表减一。
- 下次启动（刷新页面）→ 被删除的条目不再出现。

- [ ] **Step 3：提交**

```bash
git add pages/punishment/index.uvue
git commit -m "feat(punishment): 实现惩罚规则列表页（开关 / 编辑 / 删除）"
```

---

## Task 9：惩罚规则编辑 / 新增页

**Files:**
- Create: `pages/punishment/edit.uvue`

- [ ] **Step 1：创建编辑页**

```vue
<template>
	<view class="container">
		<text class="title">{{ isEdit ? '编辑规则' : '新增规则' }}</text>

		<textarea class="input" :value="text" :placeholder="placeholder" :maxlength="80"
			@input="onInput" />

		<text class="counter">{{ text.length }} / 80</text>

		<AppButton label="保存" variant="primary" :disabled="!canSave" @tap="save" />
		<AppButton label="取消" variant="ghost" @tap="cancel" />
	</view>
</template>

<script setup lang="uts">
	import { ref, computed, onMounted } from 'vue'
	import AppButton from '@/components/AppButton.uvue'
	import { usePunishment } from '@/stores/punishment'

	const store = usePunishment()

	const isEdit = ref(false)
	const editingId = ref('')
	const text = ref('')
	const placeholder = '例如：做 5 个俯卧撑'

	const canSave = computed(() => text.value.trim().length > 0)

	onLoad((options: Record<string, string | undefined>) => {
		const mode = options['mode']
		if (mode === 'edit') {
			const id = options['id']
			if (id) {
				isEdit.value = true
				editingId.value = id
				const rule = store.rules.find(r => r.id === id)
				if (rule) text.value = rule.text
			}
		}
	})

	function onInput(e: InputEvent) {
		const detail = e.detail as any
		let v = ''
		if (detail != null && typeof detail.value === 'string') v = detail.value as string
		text.value = v
	}

	function save() {
		if (!canSave.value) return
		if (isEdit.value) {
			store.updateRule(editingId.value, text.value)
		} else {
			store.addRule(text.value)
		}
		uni.navigateBack({})
	}
	function cancel() { uni.navigateBack({}) }
</script>

<style>
	.container { padding: 24px; }
	.title {
		font-size: 20px;
		font-weight: bold;
		margin-bottom: 16px;
	}
	.input {
		width: 100%;
		height: 120px;
		padding: 12px;
		border-width: 1px;
		border-color: rgba(0,0,0,0.15);
		border-style: solid;
		border-radius: 12px;
		background-color: var(--bg-end, #FFE5F1);
		color: var(--text, #3D2F4F);
	}
	.counter {
		align-self: flex-end;
		margin-top: 6px;
		margin-bottom: 12px;
		color: var(--text-muted, #7A6A87);
		font-size: 12px;
	}
</style>
```

- [ ] **Step 2：手动冒烟**

- 列表页 → 新增 → 输入"唱首歌" → 保存 → 返回列表 → 末尾出现该条。
- 列表页 → 某条 → 编辑 → 改文案 → 保存 → 列表显示更新后文案。
- 新增页 → 留空 → 保存按钮置灰不可点。

- [ ] **Step 3：提交**

```bash
git add pages/punishment/edit.uvue
git commit -m "feat(punishment): 实现惩罚规则新增 / 编辑页"
```

---

## Task 10：pages.json 注册 edit 路由

**Files:**
- Modify: `pages.json`

- [ ] **Step 1：追加路由条目**

定位 `pages.json` 的 `pages` 数组，在 `pages/punishment/index` 条目之后追加：

```json
		{
			"path": "pages/punishment/edit",
			"style": {
				"navigationBarTitleText": "规则"
			}
		}
```

例如最终的 punishment 区块为：

```json
		{
			"path": "pages/punishment/index",
			"style": {
				"navigationBarTitleText": "惩罚规则"
			}
		},
		{
			"path": "pages/punishment/edit",
			"style": {
				"navigationBarTitleText": "规则"
			}
		}
```

- [ ] **Step 2：重启 dev 服务器并手动冒烟**

```bash
# 在 HBuilderX 里重新运行到浏览器 / 模拟器
```

- 点列表页 `+ 新增` / 编辑按钮，路由正常跳转，不再报 `not found` 错误。

- [ ] **Step 3：提交**

```bash
git add pages.json
git commit -m "feat(punishment): pages.json 注册 edit 路由"
```

---

## Task 11：E2E 手动验证清单

> 本 Task 不写代码，只按清单挨个走一遍，发现问题回到对应 Task 修。通过后在本文件复选框打勾即可。

**前置：** Plan 4 的所有前置 Task 均已提交，应用可在鸿蒙模拟器 / 真机 / H5 预览中运行。

- [ ] **Step 1：首次启动**

清本地存储（模拟器中卸载重装，或 H5 清 localStorage）→ 启动应用：

- 进入主题引导页（符合 Plan 1 原逻辑，不受 Plan 4 影响）。
- 选主题 → 首页。
- 进入"惩罚规则"→ 列表应为 25 条内置，全部开关打开。

- [ ] **Step 2：开关持久化**

列表中关掉任意 3 条（例如 `builtin-01`、`builtin-10`、`builtin-20`）→ 返回首页 → 再进入"惩罚规则" → 这 3 条仍然处于关闭状态。

- [ ] **Step 3：新增自定义条目**

点"＋新增"→ 输入"跳一段街舞" → 保存 → 列表末尾出现这条，带"自定义"徽章，开关默认打开。

- [ ] **Step 4：编辑条目**

点"跳一段街舞"的"编辑" → 改成"跳 20 秒街舞" → 保存 → 列表文案更新。

- [ ] **Step 5：删除自定义条目**

对"跳 20 秒街舞"点"删除" → 弹窗确认 → 列表减一，再次进入仍然不见。

- [ ] **Step 6：删除内置条目的墓碑效果**

删除任意一条内置（如 `builtin-25`）→ 重启应用（H5 刷新 / 真机杀进程重开）→ 该条仍不出现。

- [ ] **Step 7：结算页抽惩罚**

进入"开始玩" → 选人 → 选任一游戏 → 玩到结算 → 惩罚卡片显示一条启用中的规则。连跑 3 局，每局都能抽到（可能重复）。

- [ ] **Step 8：空池降级**

回到"惩罚规则"页把所有条目关闭 → 开始一局游戏 → 到结算页 → 渲染"惩罚库为空"空态，"去管理惩罚规则"按钮可正常跳转。

- [ ] **Step 9：全部内置被删除**

从列表页依次删除全部条目（内置墓碑 + 自定义移除）→ 列表渲染顶部空态（含"＋新增"+"返回"）。新增一条自定义 → 重新进入列表显示该条。

- [ ] **Step 10：回归（不得破坏既有功能）**

- 人数选择 / 玩家名字 / 5 款游戏 / 音效 & 振动开关 均正常（验证 Plan 1/2/3 未被破坏）。
- `pnpm vitest run` 全部测试通过。

- [ ] **Step 11：提交清单打勾**

```bash
# 本 Task 无代码修改。若上面任一步骤发现 bug，回到对应 Task 修后再重跑。
# 清单全绿后无需额外提交。
```

---

## 后续（不在本 Plan 内）

Phase 4 完成后仍待做：

- **Phase 5 · 视觉与音效资产装配：** 正式插画素材（每个游戏 × 两套主题）、完整音效包、过场动画润色。
- **Phase 6 · 手动测试与打包：** 真机多机型兼容（鸿蒙 6 不同分辨率 / 不同 CPU）、签名、发包。

两者建议另起 Plan 5 / Plan 6 文档。
