# 鸿蒙派对小游戏（hwgame）· 设计文档

- **日期**：2026-04-18
- **平台**：鸿蒙 6（HarmonyOS NEXT）优先，后期保留多端可能
- **框架**：uni-app x（UVue + UTS）
- **模式**：单机共玩 · 不联网
- **作者**：产品构思 + Claude 协作

---

## 1. 概述

本项目是一款面向聚会场景的鸿蒙 APP，基于 uni-app x 编译到鸿蒙 6。玩家围坐在一台手机前，选择人数后进入不同的小游戏，由 APP 判定输赢并从本地惩罚库中随机抽取一条惩罚。首版包含 5 款游戏：摇一摇赛马、定时炸弹、鳄鱼拔牙、同屏反应大比拼、指尖大轮盘。

核心约束：
- 完全不联网（无服务器、无账号、无分享到云端）。
- 单机共用一部手机，所有交互围绕单设备展开。
- 满氛围：音效 + 振动 + 动画都要有。
- 双主题：Q 版卡通 / 霓虹电玩，首次启动引导选择，设置中可切换。

---

## 2. 范围与目标

### 2.1 MVP 范围（首版一次交付）

- 5 款完整可玩的小游戏（按玩法机制分为"运气派"与"实力派"两大类）。
- 本地惩罚规则库：20-30 条内置 + 用户自定义增删改。
- 双主题系统，支持首次引导与设置内切换。
- 完整音效与振动反馈。
- 本地偏好（主题、音效、振动开关）持久化。

### 2.2 非目标（YAGNI）

- 多设备联动（蓝牙/WiFi Direct）。
- 账号、登录、云同步。
- 历史战绩、积分榜、成就系统。
- 惩罚带图片/语音/视频。
- iOS / Android 适配（留架构口，不做实现）。
- 在线商店、排行榜、分享至社交平台。

---

## 3. 用户流程与页面架构

### 3.1 主要流程

```
首次启动 → 主题引导（Q 版 / 霓虹） ─┐
冷启（非首次） ─────────────────────┴→ 首页
  首页
    ├─ 开始玩 → 人数选择 → [可选] 输入玩家名字 → 游戏大厅（运气派 / 实力派）
    │                                             └→ 选择游戏 → 游戏页 → 结算页（抽惩罚）
    │                                                                  ├─ 再来一局 → 同款游戏页
    │                                                                  ├─ 换游戏 → 游戏大厅
    │                                                                  └─ 回首页 → 首页
    ├─ 惩罚规则 → 惩罚管理页（列表、新增、编辑、启停）
    └─ 设置 → 设置页（主题、音效、振动、关于）
```

### 3.2 页面清单

| 页面 | 路径（建议） | 说明 |
|---|---|---|
| 主题引导 | `pages/onboarding/index.uvue` | 仅首启展示 |
| 首页 | `pages/home/index.uvue` | 开始玩 / 惩罚规则 / 设置 |
| 人数选择 | `pages/lobby/player-count.uvue` | 2-8 按钮 |
| 玩家名字（可选） | `pages/lobby/player-names.uvue` | 默认可跳过 |
| 游戏大厅 | `pages/lobby/games.uvue` | 运气派 / 实力派两类 |
| 摇一摇赛马 | `pages/game/horse-race/index.uvue` | |
| 定时炸弹 | `pages/game/bomb/index.uvue` | |
| 鳄鱼拔牙 | `pages/game/crocodile/index.uvue` | |
| 同屏反应大比拼 | `pages/game/reaction/index.uvue` | |
| 指尖大轮盘 | `pages/game/wheel/index.uvue` | |
| 结算 | `pages/game/result.uvue` | 抽惩罚 + 操作入口 |
| 惩罚规则管理 | `pages/punishment/index.uvue` | 列表 / 增删改 / 启停 |
| 设置 | `pages/settings/index.uvue` | 主题 / 音效 / 振动 / 关于 |

### 3.3 游戏大厅分类

- **🎲 运气派**（随机抽取谁倒霉）：定时炸弹、鳄鱼拔牙、指尖大轮盘
- **⚔️ 实力派**（比拼谁最强/最弱）：摇一摇赛马、同屏反应大比拼

人数决定可玩游戏：
- 摇一摇赛马 / 定时炸弹 / 鳄鱼拔牙：2-8 人
- 同屏反应大比拼 / 指尖大轮盘：2-5 人（受多指触控限制）

大厅对不满足人数条件的游戏置灰并标注 "需要 X 人"。

### 3.4 分层架构

```
src/
├── pages/                 页面层（UVue）
├── components/            通用组件（AppButton、AppCard、GameTile 等）
├── games/
│   ├── horse-race/logic.ts
│   ├── bomb/logic.ts
│   ├── crocodile/logic.ts
│   ├── reaction/logic.ts
│   └── wheel/logic.ts    每款游戏的纯逻辑（状态机、判定算法）
├── stores/                pinia 全局状态（session、settings、punishment）
├── native/                原生能力统一封装
│   ├── sensor.ts
│   ├── vibrator.ts
│   ├── audio.ts
│   └── screen.ts
├── theme/                 主题 Token 与资源映射
├── utils/
├── assets/                图片、音效（双主题版本）
└── app.uvue
```

---

## 4. 数据模型与本地存储

### 4.1 存储键（uni.storage）

| 键 | 类型 | 说明 |
|---|---|---|
| `settings` | `Settings` | 主题、音效、振动开关 |
| `punishments` | `PunishmentRule[]` | 内置 + 用户自定义 |
| `hasOnboarded` | `boolean` | 是否已完成主题引导 |
| `lastSession` | `LastSession?` | 上次人数与名字（便捷复用） |

### 4.2 类型定义（伪代码）

```ts
type Theme = 'cartoon' | 'neon'

type Settings = {
  theme: Theme
  soundEnabled: boolean      // 默认 true
  vibrationEnabled: boolean  // 默认 true
}

type PunishmentRule = {
  id: string                 // 内置: 'builtin-xx'；自定义: UUID
  text: string               // 纯文字
  builtIn: boolean
  enabled: boolean           // 是否纳入抽取池
}

type LastSession = {
  playerCount: number
  playerNames?: string[]
}
```

### 4.3 初始化流程与默认值

启动 → 读取四个键 → 若 `settings` 或 `punishments` 缺失则用默认值补齐。

**默认值**：
- `settings` = `{ theme: 'cartoon', soundEnabled: true, vibrationEnabled: true }`（注：`theme` 仅在 `hasOnboarded=true` 但 `settings` 丢失时生效；首启场景由引导页决定）。
- `punishments` = **25 条内置惩罚**（软性欢乐为主，例如"学狗叫 3 声""表演一段绕口令""俯卧撑 5 个""全桌敬酒一杯（可换饮料）"等），全部 `enabled=true`。具体文案由后续实现阶段编制，保存于 `src/data/builtin-punishments.json`。
- `hasOnboarded` 默认 `false`。
- `lastSession` 默认 `undefined`。

**版本升级行为**：内置惩罚在版本升级时可能新增。启动时按 `id` 合并：已存在的条目保留用户的 `enabled` 状态，新增的条目默认 `enabled=true`。用户删除的内置条目以"本地标记删除"的方式记录，升级后不重新出现。

若 `hasOnboarded=false` → 路由到主题引导页。

### 4.4 惩罚抽取算法

```ts
function pickPunishment(punishments: PunishmentRule[]): PunishmentRule | null {
  const pool = punishments.filter(p => p.enabled)
  if (pool.length === 0) return null  // 结算页提示并引导管理页
  const idx = Math.floor(Math.random() * pool.length)  // 区间 [0, pool.length)
  return pool[idx]
}
```

---

## 5. 游戏详细设计

每款游戏的 `logic.ts` 均为**纯函数状态机**，与视图解耦，便于单测。

### 5.1 🐎 摇一摇赛马（2-8 人）

- **状态机**：`ready → shaking(per player) → result`
- **流程**：对每位玩家依次：倒计时 3 秒 → 10 秒摇动期（UTS 订阅加速度传感器，峰值检测算法累计摇动次数）→ 记录次数 → 下一位。
- **判定**：全员完成后，次数最多者 = 赢家，次数最少者 = 输家；若出现并列最少 → 并列者中随机一位受罚；若并列最多 → 不影响判输（仅用于"赢家展示"，其中随机一位作为赢家展示）。
- **原生**：加速度传感器 + 振动（有效峰值轻震、10 秒结束长震）。
- **视觉**：跑道 + 马匹插画，数字跳动显示当前次数，计时条。

### 5.2 💣 定时炸弹（2-8 人）

- **状态机**：`ready → ticking → exploded`
- **流程**：进入即启动**玩家不可见**的随机倒计时（30-90 秒），滴答音效随时间加速。玩家传递手机，每人按一次「引线」按钮（每次再扣 1 秒）。
- **判定**：倒计时归零 → 爆炸动画 + 重震 + 屏幕定格 → 玩家自行确认"此刻手里的人"，点"我就是输家"进入结算。
- **原生**：振动、音效、屏幕常亮。
- **视觉**：居中炸弹，引线按钮；屏幕随剩余时间越发紧张（微红闪）。

### 5.3 🐊 鳄鱼拔牙（2-8 人）

- **状态机**：`ready → playing → trapTriggered`
- **流程**：游戏开始前随机选 1 颗牙为"陷阱牙"。共 8-12 颗牙（按人数动态：至少保证每人能按 1 次）。玩家轮流点击**未按过**的牙。
- **判定**：按到非陷阱 → 变灰 + 轻音效，下一位；按到陷阱 → 咬合动画 + 重震 + 游戏结束，当前玩家输。
- **原生**：振动、音效。
- **视觉**：鳄鱼嘴部插画，牙齿排列；当前玩家指示器。

### 5.4 👆 同屏反应大比拼（2-5 人）

- **状态机**：`collecting → armed → signal → resolved`
- **流程**：屏幕按人数等分成 N 块；每人一根手指按住自己区域；全员到齐后进入 `armed`，随机 3-10 秒后发出信号（屏幕闪变色 + 重震 + 声音）。
- **判定规则（MVP 统一）**：
  - 信号发出前松开 → 抢跑，**立即输**。
  - 信号发出后最后松开的玩家 → **输**。
- **原生**：多点触控 + 振动 + 音效。
- **视觉**：分区着色，信号时全屏闪；每根手指的触摸位置显示光环。

### 5.5 🎯 指尖大轮盘（2-5 人）

- **状态机**：`collecting → spinning → selected`
- **流程**：圆形轮盘居中，每人一根手指按在轮盘边缘；系统为每根手指分配编号与环形位置。全员按齐后进入"旋转"动画 2-3 秒（指针在手指间加速→减速）。
- **判定**：最终停靠在一根手指上 0.5 秒确认 → 对应玩家输。
- **原生**：多点触控 + 振动 + 音效。
- **视觉**：轮盘分格，手指光环随指针移动依次亮起。

### 5.6 共享会话状态（GameSessionStore）

```ts
type GameSession = {
  playerCount: number
  playerNames?: string[]
  currentGame?: GameId
  loser?: number            // 玩家 index（从 0 起）
  loserName?: string        // 若有名字则展示，否则显示"玩家 N"（N = index+1）
  pickedPunishment?: PunishmentRule
}
```

**再来一局**：保留 `playerCount` 与 `playerNames`，清空 `loser / loserName / pickedPunishment / currentGame` 的后两项并重新进入同一游戏。
**换游戏**：保留 `playerCount` 与 `playerNames`，回到游戏大厅。
**回首页**：清空整个 session。

结算页从此 store 读取数据并渲染。

---

## 6. 主题系统与视觉设计

### 6.1 主题 Token

每个主题定义一组 Token，以 CSS 变量形式暴露；组件只引用 Token。

**Q 版卡通**：
- 背景：`#FFF5EB → #FFE5F1`（柔和浅色渐变）
- 主色：`#FF6B9D` 粉
- 辅色：`#FFB347` 橙 / `#7ED957` 绿 / `#6BA6FF` 蓝
- 文字主：`#3D2F4F`，文字次：`#7A6A87`
- 按钮：圆润大按钮，底部有 6px 硬阴影（漫画感）

**霓虹电玩**（v2，无紫 + 柔光）：
- 背景：`#0A1428 → #0E1A2B`（深海/午夜蓝）
- 主色：`#00D4FF` 青
- 辅色：`#FF3D9A` 粉 / `#FFE600` 黄 / `#6CE5B8` 荧光薄荷
- 文字主：`#00D4FF`（与主色同），文字次：`#7A88A6` 蓝灰
- 发光：`box-shadow: 0 0 6-10px rgba(color, 0.4-0.6)`（柔和，不扎眼）

### 6.2 切换机制

- 应用根元素维护 `data-theme="cartoon" | "neon"` 属性。
- 所有组件样式通过 CSS 变量引用 Token，无硬编码颜色。
- 设置页点击主题 → 渐变过渡 300ms → 写 `settings.theme` → 下次冷启直接应用。

### 6.3 插画与资源

- 核心插画（炸弹、鳄鱼、马、轮盘、闪光等）提供**两套**配色版本。
- 音效 MVP 共用一套（点击、滴答、爆炸、咬合、胜利、失败等）；V2 若需主题化再扩展。
- 字体：Q 版用圆润无衬线；霓虹用等宽 + 轻微阴影。

### 6.4 首次引导

`hasOnboarded=false` 时进入引导页，展示两张大卡片；点击 → 写 `settings.theme` + `hasOnboarded=true` → 进入首页。

---

## 7. 原生能力与平台适配

### 7.1 能力清单

| 能力 | 用途 | 实现 |
|---|---|---|
| 加速度传感器 | 摇一摇赛马 | UTS 插件封装 `@kit.SensorServiceKit` |
| 多点触控 | 同屏反应 / 轮盘 | UVue 标准触摸事件 + `touches` 列表 |
| 振动 | 所有游戏关键反馈 | `uni.vibrateShort/Long`，不可用时 UTS 封装 |
| 音效 | 背景音、关键音效 | `uni.createInnerAudioContext`（池化） |
| 屏幕常亮 | 游戏中防息屏 | `uni.setKeepScreenOn` |
| 本地存储 | 设置、惩罚库 | `uni.setStorageSync` / `uni.getStorageSync` |

### 7.2 统一封装层 `src/native/`

- `sensor.ts` — `startAccelerometer(rateMs) / onShake(cb) / stop()`
- `vibrator.ts` — `vibrate(pattern)`（遵循 `settings.vibrationEnabled`）
- `audio.ts` — `play(id) / preload(ids)`（池化 audioContext，遵循 `settings.soundEnabled`）
- `screen.ts` — `keepAwake() / releaseAwake()`

### 7.3 权限

- 加速度传感器：鸿蒙 6 默认无需动态授权。
- 振动：在 `module.json5` 声明 `ohos.permission.VIBRATE`。
- 进入需要传感器/振动的游戏前预检能力可用性。

### 7.4 多端预留

所有 `native/` 模块通过 `#ifdef APP-HARMONY / H5 / MP-*` 条件编译分流；首版仅实现 APP-HARMONY 分支，其他分支留空函数。

---

## 8. 错误处理与降级策略

| 场景 | 处理 |
|---|---|
| 存储读写失败 | 回退默认值 + 控制台日志，不崩溃 |
| 传感器/振动/音效不可用 | 静默降级；摇马改为点击兜底，振动/音效失败不阻塞 |
| 多指触控未到齐 | 屏幕提示"还需 X 根手指"；30 秒超时 Toast 并回到准备态 |
| 抢跑（反应游戏） | 立即判输，播放抢跑音效 |
| 应用切后台（计时类游戏） | 自动暂停，恢复时进入 `paused` 状态，显示"继续/重来" |
| 系统来电打断 | 同上：暂停 + 恢复提示 |
| 惩罚库全部停用 | 结算页提示"惩罚库为空"+ 一键跳转到管理页 |
| 用户手动删除所有内置惩罚 | 无特殊处理；允许空库，由用户自行添加 |

---

## 9. 测试策略

### 9.1 单元测试（Vitest）

- 每款游戏 `logic.ts` 的状态转换与判定函数，目标覆盖 > 80%。
- 存储模块：默认值补齐、内置规则去重合并。
- 主题 Token 解析。
- 惩罚抽取算法（空池、单条、多条、启停变化）。

### 9.2 手动 E2E 清单

1. 首启引导：两个主题各选一次，验证持久化与冷启。
2. 5 款游戏各完整跑一次完整流程（运气派 3 + 实力派 2）。
3. 在每个主题下各跑一次游戏，验证样式与素材。
4. 设置页音效/振动开关的实际生效。
5. 计时类游戏中接来电、切后台、返回后的恢复行为。
6. 惩罚管理：新增、编辑、删除、启停、全部停用时的结算提示。
7. 鳄鱼拔牙人数动态牙齿数（2 人 vs 8 人）。

### 9.3 不做

- UI 自动化、性能基准、视觉回归。

---

## 10. 目录结构（初步）

```
hwgame/
├── src/
│   ├── app.uvue
│   ├── pages.json
│   ├── pages/
│   ├── components/
│   ├── games/
│   │   ├── horse-race/logic.ts
│   │   ├── bomb/logic.ts
│   │   ├── crocodile/logic.ts
│   │   ├── reaction/logic.ts
│   │   └── wheel/logic.ts
│   ├── stores/
│   │   ├── settings.ts
│   │   ├── punishment.ts
│   │   └── session.ts
│   ├── native/
│   │   ├── sensor.ts
│   │   ├── vibrator.ts
│   │   ├── audio.ts
│   │   └── screen.ts
│   ├── theme/
│   │   ├── tokens.ts
│   │   └── index.ts
│   ├── utils/
│   ├── assets/
│   │   ├── images/
│   │   └── sounds/
│   └── data/
│       └── builtin-punishments.json
├── tests/
│   └── games/
├── docs/
│   └── superpowers/specs/2026-04-18-party-games-design.md
├── manifest.json
├── package.json
└── README.md
```

---

## 11. 风险与开放问题

- **uni-app x 对鸿蒙 6 原生能力的实际支持度**：传感器、多指、振动、音效都依赖 UTS 插件或官方封装。需要在实现第一阶段尽早做 **可行性 spike**：用最简 demo 验证 4 项能力都能跑。若有缺失，需花时间写 UTS 插件。
- **多点触控可靠性**：不同鸿蒙设备对多指的采样率和准确度可能不同，同屏反应/轮盘对准确度敏感，需实机测试。
- **加速度传感器精度**：摇一摇赛马需区分"有效摇动"和"小幅度晃动"，峰值阈值需调参。
- **音效加载延迟**：`createInnerAudioContext` 在鸿蒙上的首次播放可能有延迟，需要预加载策略。
- **主题切换性能**：若 UVue 对 CSS 变量支持不完整，可能需退回 store 驱动 + 组件 reactive computed 方案。

---

## 12. 下一步

完成本设计审阅后，进入实现计划（writing-plans）阶段，将按以下阶段拆分任务：

1. **Phase 0 · 可行性 Spike**：用 uni-app x 跑通 4 项原生能力的最小 demo。
2. **Phase 1 · 骨架**：搭建项目、目录、主题系统、首启引导、首页、导航、pinia。
3. **Phase 2 · 游戏逻辑**：5 款 `logic.ts` + 单测（UI 可 stub）。
4. **Phase 3 · 游戏页面**：绑定逻辑与 UI，接入原生能力。
5. **Phase 4 · 惩罚库 + 设置页**：管理页、内置数据、开关。
6. **Phase 5 · 视觉与音效**：插画、动画、音效资源装配。
7. **Phase 6 · 手动测试与打包**：E2E 清单、鸿蒙设备实测、发包。
