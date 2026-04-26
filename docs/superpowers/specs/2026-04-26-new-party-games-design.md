# 新增三款聚会游戏设计

- **日期**：2026-04-26
- **项目**：鸿蒙派对小游戏（hwgame）
- **平台**：鸿蒙 6（HarmonyOS NEXT）优先
- **框架**：uni-app x（UVue + UTS）
- **范围**：新增疯狂拔河、数字炸弹、指尖扭扭乐三款游戏
- **设计结论**：延续现有游戏架构，新增独立逻辑模块、页面、路由、大厅入口和单测，只补必要共享能力

---

## 1. 背景与目标

当前项目已经包含 5 款单机聚会小游戏：摇一摇赛马、定时炸弹、鳄鱼拔牙、同屏反应大比拼、指尖大轮盘。现有实现采用清晰的分层方式：`ui/games.ts` 负责游戏元数据与路由，`pages/game/*/index.uvue` 负责页面交互，`games/*/logic.ts` 负责纯逻辑状态机，测试放在 `tests/games/*`。

本次新增三款游戏，继续服务同一台手机上的聚会共玩场景：

- **疯狂拔河**：双人代表同屏对抗，考验点击频率和爆发力。
- **数字炸弹**：轮流猜数缩小范围，制造心理压力，猜中者受罚。
- **指尖扭扭乐**：多人同屏多点触控，按住指定彩色圆圈，离开或超时即输。

目标是让三款游戏完整接入现有大厅、玩家会话、结算、音效、振动和屏幕常亮体系，并保持现有“纯逻辑可测试、页面负责设备交互”的工程边界。

## 2. 范围

### 2.1 本次包含

- 新增三个 `GameId`：`tug-of-war`、`number-bomb`、`finger-twister`。
- 在游戏大厅新增三张游戏卡片，并配置人数限制、分类、封面或图标、路由。
- 新增三条游戏页路由。
- 为三款游戏分别新增独立页面和纯逻辑状态机。
- 新增单元测试覆盖状态机、边界条件和共享工具。
- 复用现有 `useSession()`、`pages/game/result.uvue`、音效、振动、屏幕常亮、暂停遮罩等能力。
- 保留现有 **定时炸弹**，新增 **数字炸弹** 与其并存。

### 2.2 本次不包含

- 不做多设备联机、蓝牙或局域网对战。
- 不做历史战绩、积分榜、成就系统。
- 不引入通用游戏引擎。
- 不重构现有 5 款游戏的核心逻辑。
- 不强制识别真实食指、中指等生物手指类型。

## 3. 总体方案

采用“延续现有架构，轻量补强共享能力”的方案。

每款游戏保持独立目录：

```text
games/tug-of-war/logic.ts
games/number-bomb/logic.ts
games/finger-twister/logic.ts
pages/game/tug-of-war/index.uvue
pages/game/number-bomb/index.uvue
pages/game/finger-twister/index.uvue
tests/games/tug-of-war.test.ts
tests/games/number-bomb.test.ts
tests/games/finger-twister.test.ts
```

必要共享能力以小函数形式补充，不抽象为“大而全”的触控引擎：

- 多点触控触点归一化、差异计算、未知触点过滤。
- 高频点击节流与有效点击判定。
- 坐标区域判断，例如点击是否位于红/蓝半屏或彩色圆圈范围内。
- 随机抽样与人数范围推荐。

这样可以保留当前代码库的可读性和测试方式，降低鸿蒙真机触控适配风险。

## 4. 大厅与路由接入

### 4.1 游戏分类与人数

- **疯狂拔河**：实力派，`min=2`，`max=8`。实际每局由系统随机抽取两名代表对抗。
- **数字炸弹**：运气派，`min=2`，`max=8`。所有玩家按顺序轮流输入数字。
- **指尖扭扭乐**：实力派，`min=2`，`max=4`。最多同时 6 个触点。

大厅对不满足人数限制的游戏继续置灰，并展示现有样式的禁用原因。

### 4.2 命名与并存关系

现有 `定时炸弹` 保持不变，新游戏命名为 `数字炸弹`。两者玩法不同：

- `定时炸弹`：不可见倒计时传手机，爆炸时由玩家确认输家。
- `数字炸弹`：系统隐藏炸弹数字，轮流猜数，猜中者直接判输。

### 4.3 结算

三款游戏结束时只写入 `session.loser`，由现有结算页继续抽取惩罚。若页面需要展示胜方、比分或失败原因，仅在游戏页内展示，不扩大 `GameResult` 的必要字段。

## 5. 疯狂拔河设计

### 5.1 核心玩法

进入游戏后先进入设置态：

- 系统从当前玩家中随机抽取红方代表和蓝方代表。
- 设置页展示两名代表，支持“重新抽取”。
- 玩家选择赛制：`一局定胜负` 或 `三局两胜`。
- 玩家选择每局胜负条件：`固定时长` 或 `拉过终点`。
- 默认值为 `一局定胜负 + 固定时长`，降低首次开局成本。

比赛开始后手机平放，屏幕分为红蓝两半。红方只能点击红色半屏，蓝方只能点击蓝色半屏。每次有效点击给己方增加拉力，绳子或中心指示物向己方移动。

### 5.2 状态机

```text
setup -> countdown -> playing -> roundResult -> matchResult
```

- `setup`：抽取代表，选择赛制和胜负条件。
- `countdown`：每局开始前 3 秒倒计时。
- `playing`：记录有效点击、更新绳子位置、检测局内胜负。
- `roundResult`：展示本局获胜方、更新比分，短暂停顿后进入下一局或比赛结果。
- `matchResult`：确定输方代表，进入结算。

### 5.3 判定规则

- 固定时长模式：每局 10 秒，时间结束后绳子位置偏向哪方，哪方胜出。
- 拉过终点模式：绳子位置达到一侧阈值时，该方立即胜出。
- 一局定胜负：输方代表直接受罚。
- 三局两胜：先拿到 2 局胜利的一方赢，另一方代表受罚。
- 固定时长结束时若绳子刚好回到中心，则比较有效点击数；仍相同则随机判定本局胜方，避免游戏卡住。

### 5.4 高频点击处理

逻辑层只统计有效点击：

- 点击必须落在己方半屏。
- 点击必须发生在 `playing` 状态。
- 同一方过密点击按最小间隔节流，避免设备触控抖动和事件重复导致异常得分。
- 页面可以播放轻量点击反馈，但胜负只依赖逻辑层有效点击。

### 5.5 数据结构

```ts
type TugMatchMode = 'single' | 'best-of-three'
type TugWinCondition = 'timed' | 'threshold'
type TugSide = 'red' | 'blue'
type TugState = 'setup' | 'countdown' | 'playing' | 'roundResult' | 'matchResult'

type TugRepresentative = {
  redPlayerIndex: number
  bluePlayerIndex: number
}

type TugSnapshot = {
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
  roundWinner?: TugSide
  matchWinner?: TugSide
  result?: GameResult
}
```

`ropePosition` 使用 `-1` 到 `1` 表示，负数偏红，正数偏蓝。

## 6. 数字炸弹设计

### 6.1 核心玩法

开局由系统生成隐藏炸弹数字。玩家按系统显示的当前玩家顺序轮流输入数字。每次未猜中时，系统缩小范围并切换到下一名玩家；猜中时出现爆炸效果，当前玩家受罚。

范围策略：

- 2-5 人默认 `1-100`。
- 6-8 人默认 `1-999`。
- 开局前允许手动切换 `1-100` 或 `1-999`。

### 6.2 状态机

```text
setup -> guessing -> exploded
```

- `setup`：选择数字范围，生成炸弹数字。
- `guessing`：显示当前范围、当前玩家、输入区和历史记录。
- `exploded`：展示爆炸动画、音效和重震，当前玩家进入结算。

### 6.3 范围与输入规则

页面显示采用闭区间，例如 `1 - 100`。内部校验需要避免玩家重复输入已经排除的边界值。

规则如下：

- 输入必须是整数。
- 输入必须在当前显示范围内。
- 如果输入等于炸弹数字，当前玩家输。
- 如果输入小于炸弹数字，显示下界更新为该输入值，下一次有效输入必须大于这个下界。
- 如果输入大于炸弹数字，显示上界更新为该输入值，下一次有效输入必须小于这个上界。
- 无效输入不改变范围，不切换玩家。

该规则保持经典桌游的压迫感，同时避免重复猜边界导致流程停滞。

### 6.4 玩家轮转

系统自动跟踪当前玩家：

- 初始当前玩家为玩家 1。
- 每次有效且未爆炸的输入后切到下一位。
- 到最后一位后回到玩家 1。
- 猜中时 `session.loser = currentPlayerIndex`。

### 6.5 数据结构

```ts
type NumberBombState = 'setup' | 'guessing' | 'exploded'
type NumberBombPreset = '1-100' | '1-999'

type NumberBombGuess = {
  playerIndex: number
  value: number
  rangeBefore: { min: number; max: number }
}

type NumberBombSnapshot = {
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
```

`exclusiveMin` 和 `exclusiveMax` 用于内部校验，页面仍显示玩家熟悉的闭区间。

## 7. 指尖扭扭乐设计

### 7.1 核心玩法

指尖扭扭乐采用聚会实用版：

- 支持 2-4 人。
- 每位玩家逐步增加到 1-2 根手指。
- 全局最多 6 个同时触点。
- 不强制识别真实食指、中指，只显示“玩家 N 的第 M 根手指”。

系统逐轮发布任务，例如“玩家 2 的第 1 根手指按住蓝圈”。玩家需要在限时内按到目标圈，并保持所有已占用触点不离开屏幕。任一已占用触点离开，或当前任务超时，立即判对应玩家输。

### 7.2 状态机

```text
setup -> prompt -> holding -> failed
```

- `setup`：初始化玩家数量、颜色池、触点上限。
- `prompt`：生成并展示下一条任务。
- `holding`：验证新触点是否按中目标，持续监测所有已占用触点。
- `failed`：记录失败玩家和失败原因，进入结算。

### 7.3 任务生成

任务生成遵循以下规则：

- 前期优先让每位玩家拥有第 1 根手指。
- 中后期再分配第 2 根手指。
- 不超过 6 个总触点。
- 同一玩家最多 2 根手指。
- 目标圆圈尽量避开已有触点和屏幕边缘，降低不可达任务概率。
- 若安全区域不足，允许略微缩短圆圈间距，但不能生成屏幕外目标。

### 7.4 触点归属与失败判定

- 在当前任务限时内，新增触点落入目标圆圈即绑定到该任务。
- 已绑定触点移动时，只要仍在屏幕上即可，不要求始终停留在圆心区域。
- 已绑定触点 `touchend` 或 `touchcancel` 立即失败。
- 当前任务超时且未绑定触点，当前任务所属玩家失败。
- 未知触点、重复触点和多余触点不绑定任务；如果干扰已绑定触点，不改变已有归属。

### 7.5 数据结构

```ts
type FingerTwisterState = 'setup' | 'prompt' | 'holding' | 'failed'
type FingerTwisterFailureReason = 'released' | 'timeout'

type FingerTwisterCircle = {
  id: string
  color: string
  x: number
  y: number
  radius: number
}

type FingerTwisterTask = {
  id: string
  playerIndex: number
  fingerNumber: number
  circle: FingerTwisterCircle
  timeLimitMs: number
  elapsedMs: number
}

type FingerAssignment = {
  taskId: string
  playerIndex: number
  fingerNumber: number
  touchId: number
  circle: FingerTwisterCircle
}

type FingerTwisterSnapshot = {
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
```

## 8. 页面交互与反馈

### 8.1 疯狂拔河页面

设置态展示红蓝代表、重新抽取按钮、赛制切换、胜负条件切换和开始按钮。比赛态使用全屏触控区域，红蓝半屏对称展示，中间绳子或指示物随 `ropePosition` 移动。顶部显示当前局数、比分和倒计时。

音效与振动：

- 倒计时播放 countdown。
- 有效点击播放轻量 click，可按节流降低播放频率。
- 每局结束短震。
- 比赛结束长震并播放 lose 或 win 反馈。

### 8.2 数字炸弹页面

页面核心是当前范围和当前玩家。输入区提供数字键盘式操作或简洁输入框，提交后根据结果更新范围、历史记录和当前玩家。猜中后全屏爆炸动效，播放 explode，长震，然后展示“查看结果”。

### 8.3 指尖扭扭乐页面

页面为全屏触控区域，展示彩色圆圈、当前任务提示、倒计时、已绑定触点光环。失败时突出失败玩家和失败原因，再进入结算。

### 8.4 暂停与生命周期

三款游戏都需要处理页面切后台、离开页面和重开：

- 停止所有计时器。
- 释放屏幕常亮。
- 不保留半局触控状态。
- 显示现有 `GamePausedOverlay` 或直接重置本局，文案说明“切后台会重置本局”。

## 9. 错误处理与边界条件

- 页面入口即使被手动跳转，也要校验人数，不满足时返回大厅或夹取到合法范围。
- 疯狂拔河中非己方半屏点击不计入有效点击。
- 疯狂拔河中 `countdown`、`roundResult`、`matchResult` 状态下点击不影响结果。
- 数字炸弹无效输入只展示错误，不切换玩家，不写历史。
- 数字炸弹在只剩一个可猜数字时，输入该数字必然爆炸。
- 指尖扭扭乐的 `touchcancel` 与 `touchend` 一样按离开处理。
- 指尖扭扭乐未知触点不应改变已绑定任务。
- 所有状态机的 `getSnapshot()` 返回拷贝，避免测试或页面误改内部状态。

## 10. 测试计划

### 10.1 疯狂拔河

- 人数必须满足 2-8。
- 随机代表不能重复。
- 重新抽取仍保持红蓝代表不同。
- 设置赛制和胜负条件后进入倒计时。
- 只有 `playing` 状态的有效点击改变绳子位置。
- 高频点击按最小间隔节流。
- 固定时长结束后按绳子位置判本局胜方。
- 拉过终点后立即结束本局。
- 三局两胜先到 2 分结束比赛。
- 平局时按有效点击数，再按随机兜底判本局胜方。

### 10.2 数字炸弹

- 2-5 人默认 `1-100`。
- 6-8 人默认 `1-999`。
- 手动切换范围后重新生成炸弹数。
- 猜小更新下界并切换玩家。
- 猜大更新上界并切换玩家。
- 猜中进入 `exploded` 并生成输家。
- 非整数、越界、重复边界输入不切换玩家。
- 历史记录保留猜测前范围和玩家。

### 10.3 指尖扭扭乐

- 人数必须满足 2-4。
- 任务生成不超过 6 个总触点。
- 同一玩家最多 2 根手指。
- 新触点按中当前目标后绑定任务。
- 未按中目标不绑定任务。
- 已绑定触点离开立即失败。
- 当前任务超时立即失败。
- 未知触点离开不会误判已有玩家失败。
- 快照返回拷贝。

### 10.4 共享工具

- 触点差异计算覆盖新增、移除、无变化。
- 坐标区域判断覆盖红半屏、蓝半屏、边界线。
- 圆形命中判断覆盖圆内、圆外、圆边界。
- 点击节流覆盖首次点击、间隔不足、间隔足够。

## 11. 交付顺序建议

后续实现计划可以按风险从低到高拆分：

1. 接入元数据、路由、类型和大厅卡片。
2. 实现数字炸弹逻辑、测试和页面。
3. 实现疯狂拔河逻辑、测试和页面。
4. 补强多点触控共享工具。
5. 实现指尖扭扭乐逻辑、测试和页面。
6. 统一验证音效、振动、暂停、结算和真机触控行为。

这个顺序先交付低触控风险功能，再处理高频点击，最后处理多点触控复杂场景。

## 12. 关键决策记录

- 三款游戏一次性同批设计，后续实现计划分步骤落地。
- 数字炸弹与现有定时炸弹并存。
- 指尖扭扭乐采用 2-4 人、每人 1-2 根手指、最多 6 触点的聚会实用版。
- 指尖扭扭乐不识别真实食指/中指，使用“玩家 + 第几根手指”。
- 指尖扭扭乐失败规则为离开或超时即输。
- 数字炸弹由系统自动轮转玩家，猜中者直接受罚。
- 疯狂拔河采用双人代表赛，由系统随机抽取代表，并支持重新抽取。
- 疯狂拔河同时支持一局定胜负、三局两胜、固定时长、拉过终点四种组合。
