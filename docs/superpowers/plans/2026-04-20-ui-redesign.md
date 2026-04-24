# hwgame UI 改版实施计划

> **面向智能代理工程师：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务逐项执行本计划。步骤使用 checkbox（`- [ ]`）语法跟踪。

**目标：** 将首页、人数选择、游戏列表、主题选择、惩罚列表 5 个页面改造成 `ui 设计/` 目录指定的糖果粉 Q 版视觉，同时保留双主题、真实路由、真实 store 与现有游戏流程。

**架构：** 先扩展主题 token，再把导航、人数、游戏列表、主题卡等规则抽成 TypeScript 纯函数并测试，最后用轻量 UVue 视觉组件组合页面。页面只负责布局和调用 store / 路由，跨页面规则集中在 `ui/` 目录，避免散落在模板中。

**技术栈：** HarmonyOS NEXT / uni-app x、UVue + UTS、Pinia、TypeScript、Vitest、现有 `theme/` 与 `stores/` 体系。

---

## 关键约束回显

- 只改 5 个目标页面：`pages/home/index.uvue`、`pages/lobby/player-count.uvue`、`pages/lobby/games.uvue`、`pages/onboarding/index.uvue`、`pages/settings/index.uvue`、`pages/punishment/index.uvue`。
- 不重构 `pages/lobby/player-names.uvue`、具体游戏页、结算页、惩罚编辑页。
- `cartoon` 主题升级为糖果粉新视觉，`neon` 只做兼容映射，必须可读可用。
- 页面文案统一中文；设计稿里的英文按钮、导航、标签全部转为中文。
- 游戏列表素材优先使用本地图片，运行时不依赖远程资源。
- 单元测试总耗时控制在 60 秒以内，新增测试集中在 TypeScript 纯逻辑。
- 当前环境没有暴露 Serena 工具，代码理解使用 `rg`、文件读取与现有测试结构降级完成。

## 文件结构

### 新增文件

- `ui/navigation.ts`：底部导航项、占位入口和路由动作的纯逻辑。
- `ui/player-count.ts`：人数默认值、上下限、增减和跳转 URL 的纯逻辑。
- `ui/games.ts`：游戏元数据、分类过滤、人数限制、路由、封面降级的纯逻辑。
- `ui/theme-cards.ts`：主题选择卡片配置与选中态的纯逻辑。
- `components/UiTopBar.uvue`：5 个目标页面复用的自绘顶部栏。
- `components/BottomNavBar.uvue`：首页、游戏列表、设置、惩罚页复用的底部悬浮导航。
- `components/ThemeChoiceCard.uvue`：onboarding 与 settings 共用的主题大卡片。
- `components/GameImageCard.uvue`：新版游戏列表图片卡片。
- `tests/ui/navigation.test.ts`：导航映射与占位入口测试。
- `tests/ui/player-count.test.ts`：人数边界与 URL 测试。
- `tests/ui/games.test.ts`：游戏分类、禁用态、图片降级、路由测试。
- `tests/ui/theme-cards.test.ts`：主题卡片配置与选中态测试。
- `static/game-covers/game1.png` 到 `static/game-covers/game6.png`：从 `ui 设计/img/` 复制出的运行时本地图片。

### 修改文件

- `theme/tokens.ts`：扩展页面级 token，补齐 `cartoon` 与 `neon` 映射。
- `tests/theme/tokens.test.ts`：增加新 token 完整性和主题对比度基础断言。
- `tests/theme/apply.test.ts`：确认新增 token 会写入 CSS 变量。
- `components/AppButton.uvue`：升级按钮圆角、阴影、禁用态，支持新版主按钮视觉。
- `pages.json`：5 个目标页面改成 `navigationStyle: "custom"`。
- `pages/home/index.uvue`：重做首页视觉与入口。
- `pages/lobby/player-count.uvue`：重做中心数字选择器。
- `pages/lobby/games.uvue`：重做分类过滤与图片游戏卡片。
- `pages/onboarding/index.uvue`：重做首次主题选择。
- `pages/settings/index.uvue`：重做设置页主题卡片与底部导航。
- `pages/punishment/index.uvue`：重做惩罚 hero 卡片与规则卡片列表。

---

### Task 1: 扩展主题 Token

**Files:**
- Modify: `theme/tokens.ts`
- Modify: `tests/theme/tokens.test.ts`
- Modify: `tests/theme/apply.test.ts`

- [ ] **Step 1: 写失败测试**

把 `tests/theme/tokens.test.ts` 替换为：

```ts
import { describe, it, expect } from 'vitest'
import { themes, type Theme, type ThemeTokens } from '@/theme/tokens'

const requiredKeys: (keyof ThemeTokens)[] = [
  'bg', 'bgEnd', 'primary', 'primaryDim', 'secondary', 'accent',
  'text', 'textMuted', 'onPrimary', 'onSecondary',
  'success', 'danger', 'dangerText', 'glow',
  'warn', 'urgent', 'armedBg', 'signalBg', 'emojiShadow',
  'surface', 'surfaceLow', 'surfaceHigh', 'surfaceHighest',
  'topBarBg', 'bottomNavBg', 'navActiveBg', 'navActiveText', 'navInactiveText',
  'cardBg', 'cardBgAlt', 'heroCardBg', 'imageCardBg',
  'outlineSoft', 'shadowSoft', 'decorPrimary', 'decorSecondary',
  'placeholderBg', 'disabledBg'
]

describe('themes', () => {
  it('包含 cartoon 与 neon 两套主题', () => {
    expect(Object.keys(themes)).toEqual(['cartoon', 'neon'])
  })

  it('每套主题都有完整页面级 token', () => {
    ;(['cartoon', 'neon'] as Theme[]).forEach((theme) => {
      requiredKeys.forEach((key) => {
        expect(themes[theme]).toHaveProperty(key)
        expect(typeof themes[theme][key]).toBe('string')
        expect(themes[theme][key].length).toBeGreaterThan(0)
      })
    })
  })

  it('cartoon 主题使用糖果粉高亮而不是旧橙粉基调', () => {
    expect(themes.cartoon.bg).toBe('#fff4f6')
    expect(themes.cartoon.primary).toBe('#b00074')
    expect(themes.cartoon.primaryDim).toBe('#9b0065')
    expect(themes.cartoon.surfaceHighest).toBe('#ffd0e3')
  })

  it('neon 主题保留深色语义且文字不会映射为浅底浅字', () => {
    expect(themes.neon.bg).toBe('#0A1428')
    expect(themes.neon.surface).toBe('#111D33')
    expect(themes.neon.text).toBe('#E8F7FF')
    expect(themes.neon.topBarBg).toContain('rgba')
  })

  it('neon 主题不包含历史紫色主视觉值', () => {
    const values = Object.values(themes.neon).join(' ').toLowerCase()
    expect(values).not.toMatch(/#302b63|#8b5cf6|#6a0dad/)
  })
})
```

把 `tests/theme/apply.test.ts` 替换为：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, tokenToCssVar } from '@/theme/apply'
import { themes } from '@/theme/tokens'

describe('tokenToCssVar', () => {
  it('把驼峰 key 转为 --kebab-case', () => {
    expect(tokenToCssVar('textMuted')).toBe('--text-muted')
    expect(tokenToCssVar('surfaceHighest')).toBe('--surface-highest')
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

  it('写入新版页面骨架 token', () => {
    applyTheme('cartoon', fakeRoot as unknown as HTMLElement)
    expect(recorded['--top-bar-bg']).toBe(themes.cartoon.topBarBg)
    expect(recorded['--bottom-nav-bg']).toBe(themes.cartoon.bottomNavBg)
    expect(recorded['--hero-card-bg']).toBe(themes.cartoon.heroCardBg)
    expect(recorded['--image-card-bg']).toBe(themes.cartoon.imageCardBg)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/theme/tokens.test.ts tests/theme/apply.test.ts
```

Expected: FAIL，错误包含 `primaryDim`、`surface` 或 `topBarBg` 等属性不存在。

- [ ] **Step 3: 扩展 token 实现**

把 `theme/tokens.ts` 替换为：

```ts
export type Theme = 'cartoon' | 'neon'

export type ThemeTokens = {
  bg: string
  bgEnd: string
  primary: string
  primaryDim: string
  secondary: string
  accent: string
  text: string
  textMuted: string
  onPrimary: string
  onSecondary: string
  success: string
  danger: string
  dangerText: string
  glow: string
  warn: string
  urgent: string
  armedBg: string
  signalBg: string
  emojiShadow: string
  surface: string
  surfaceLow: string
  surfaceHigh: string
  surfaceHighest: string
  topBarBg: string
  bottomNavBg: string
  navActiveBg: string
  navActiveText: string
  navInactiveText: string
  cardBg: string
  cardBgAlt: string
  heroCardBg: string
  imageCardBg: string
  outlineSoft: string
  shadowSoft: string
  decorPrimary: string
  decorSecondary: string
  placeholderBg: string
  disabledBg: string
}

export const themes: Record<Theme, ThemeTokens> = {
  cartoon: {
    bg: '#fff4f6',
    bgEnd: '#ffecf2',
    primary: '#b00074',
    primaryDim: '#9b0065',
    secondary: '#00675f',
    accent: '#ffeb3b',
    text: '#492136',
    textMuted: '#7c4d64',
    onPrimary: '#ffeff3',
    onSecondary: '#bffff5',
    success: '#56f1e0',
    danger: '#fb5151',
    dangerText: '#b31b25',
    glow: 'rgba(176, 0, 116, 0.18)',
    warn: '#ffeb3b',
    urgent: '#fb5151',
    armedBg: '#ffd8e7',
    signalBg: '#56f1e0',
    emojiShadow: 'none',
    surface: '#fff4f6',
    surfaceLow: '#ffecf2',
    surfaceHigh: '#ffd8e7',
    surfaceHighest: '#ffd0e3',
    topBarBg: 'rgba(255, 255, 255, 0.82)',
    bottomNavBg: 'rgba(255, 255, 255, 0.9)',
    navActiveBg: '#ff6bb9',
    navActiveText: '#ffffff',
    navInactiveText: '#7c4d64',
    cardBg: '#ffffff',
    cardBgAlt: '#ffe0ec',
    heroCardBg: 'linear-gradient(135deg, #b00074 0%, #ff6bb9 100%)',
    imageCardBg: '#fff0f6',
    outlineSoft: 'rgba(214, 157, 182, 0.22)',
    shadowSoft: '0 14px 42px rgba(73, 33, 54, 0.08)',
    decorPrimary: 'rgba(255, 107, 185, 0.34)',
    decorSecondary: 'rgba(86, 241, 224, 0.28)',
    placeholderBg: '#ffe0ec',
    disabledBg: '#f4d8e4'
  },
  neon: {
    bg: '#0A1428',
    bgEnd: '#0E1A2B',
    primary: '#00D4FF',
    primaryDim: '#0099C2',
    secondary: '#FF3D9A',
    accent: '#FFE600',
    text: '#E8F7FF',
    textMuted: '#9AAAC8',
    onPrimary: '#03111F',
    onSecondary: '#0A1428',
    success: '#6CE5B8',
    danger: '#FF5C8A',
    dangerText: '#FF8FAE',
    glow: 'rgba(0, 212, 255, 0.5)',
    warn: '#3A2812',
    urgent: '#5A1020',
    armedBg: '#1A2A4C',
    signalBg: '#00D4FF',
    emojiShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
    surface: '#111D33',
    surfaceLow: '#172642',
    surfaceHigh: '#1D3155',
    surfaceHighest: '#243B66',
    topBarBg: 'rgba(12, 22, 42, 0.88)',
    bottomNavBg: 'rgba(10, 20, 40, 0.92)',
    navActiveBg: '#00D4FF',
    navActiveText: '#03111F',
    navInactiveText: '#9AAAC8',
    cardBg: '#14233D',
    cardBgAlt: '#1A2A4C',
    heroCardBg: 'linear-gradient(135deg, #00D4FF 0%, #FF3D9A 100%)',
    imageCardBg: '#10213B',
    outlineSoft: 'rgba(0, 212, 255, 0.22)',
    shadowSoft: '0 14px 42px rgba(0, 212, 255, 0.14)',
    decorPrimary: 'rgba(0, 212, 255, 0.24)',
    decorSecondary: 'rgba(255, 61, 154, 0.2)',
    placeholderBg: '#1A2A4C',
    disabledBg: '#162238'
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
pnpm exec vitest run tests/theme/tokens.test.ts tests/theme/apply.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add theme/tokens.ts tests/theme/tokens.test.ts tests/theme/apply.test.ts
git commit -m "feat: expand theme tokens for redesigned pages"
```

---

### Task 2: 新增底部导航纯逻辑

**Files:**
- Create: `ui/navigation.ts`
- Create: `tests/ui/navigation.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/ui/navigation.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import {
  BOTTOM_NAV_ITEMS,
  decideBottomNavAction,
  getBottomNavItems,
  type TopLevelPage
} from '@/ui/navigation'

describe('bottom navigation', () => {
  it('包含 4 个真实入口和 1 个中文占位入口', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.label)).toEqual(['首页', '游戏', '惩罚', '社交', '设置'])
    expect(BOTTOM_NAV_ITEMS.filter((item) => item.route).map((item) => item.id)).toEqual([
      'home',
      'games',
      'punishment',
      'settings'
    ])
    expect(BOTTOM_NAV_ITEMS.find((item) => item.id === 'social')?.placeholderTitle).toBe('功能建设中，稍后开放')
  })

  it('为当前页面标记激活态', () => {
    const items = getBottomNavItems('punishment')
    expect(items.find((item) => item.id === 'punishment')?.active).toBe(true)
    expect(items.find((item) => item.id === 'home')?.active).toBe(false)
  })

  it('点击当前页不重复跳转', () => {
    expect(decideBottomNavAction('home', 'home')).toEqual({ type: 'noop' })
  })

  it('点击真实入口返回 reLaunch 动作', () => {
    expect(decideBottomNavAction('games', 'home')).toEqual({
      type: 'navigate',
      method: 'reLaunch',
      url: '/pages/lobby/games'
    })
  })

  it('点击不可映射入口返回中文提示', () => {
    expect(decideBottomNavAction('social', 'home')).toEqual({
      type: 'toast',
      title: '功能建设中，稍后开放'
    })
  })

  it('未知入口安全降级为中文提示', () => {
    expect(decideBottomNavAction('unknown', 'settings' as TopLevelPage)).toEqual({
      type: 'toast',
      title: '功能建设中，稍后开放'
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/ui/navigation'`。

- [ ] **Step 3: 实现导航纯逻辑**

创建 `ui/navigation.ts`：

```ts
export type TopLevelPage = 'home' | 'games' | 'punishment' | 'settings'

export type BottomNavItemId = 'home' | 'games' | 'punishment' | 'social' | 'settings'

export type BottomNavItem = {
  id: BottomNavItemId
  label: string
  icon: string
  page?: TopLevelPage
  route?: string
  placeholderTitle?: string
}

export type BottomNavRenderItem = BottomNavItem & {
  active: boolean
}

export type BottomNavAction =
  | { type: 'noop' }
  | { type: 'navigate'; method: 'reLaunch'; url: string }
  | { type: 'toast'; title: string }

export const UNMAPPED_ENTRY_TITLE = '功能建设中，稍后开放'

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: '首页', icon: '⌂', page: 'home', route: '/pages/home/index' },
  { id: 'games', label: '游戏', icon: '🎮', page: 'games', route: '/pages/lobby/games' },
  { id: 'punishment', label: '惩罚', icon: '⚡', page: 'punishment', route: '/pages/punishment/index' },
  { id: 'social', label: '社交', icon: '👥', placeholderTitle: UNMAPPED_ENTRY_TITLE },
  { id: 'settings', label: '设置', icon: '⚙', page: 'settings', route: '/pages/settings/index' }
]

export function getBottomNavItems(current: TopLevelPage): BottomNavRenderItem[] {
  return BOTTOM_NAV_ITEMS.map((item) => ({
    ...item,
    active: item.page === current
  }))
}

export function decideBottomNavAction(id: string, current: TopLevelPage): BottomNavAction {
  const item = BOTTOM_NAV_ITEMS.find((navItem) => navItem.id === id)
  if (!item) return { type: 'toast', title: UNMAPPED_ENTRY_TITLE }
  if (item.page === current) return { type: 'noop' }
  if (item.route) return { type: 'navigate', method: 'reLaunch', url: item.route }
  return { type: 'toast', title: item.placeholderTitle ?? UNMAPPED_ENTRY_TITLE }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add ui/navigation.ts tests/ui/navigation.test.ts
git commit -m "feat: add bottom navigation mapping logic"
```

---

### Task 3: 新增人数选择纯逻辑

**Files:**
- Create: `ui/player-count.ts`
- Create: `tests/ui/player-count.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/ui/player-count.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import {
  PLAYER_COUNT_MAX,
  PLAYER_COUNT_MIN,
  DEFAULT_PLAYER_COUNT,
  buildPlayerNamesUrl,
  changePlayerCount,
  getInitialPlayerCount,
  getSkipNamesUrl
} from '@/ui/player-count'

describe('player count logic', () => {
  it('固定人数范围为 2 到 8，默认 4 人', () => {
    expect(PLAYER_COUNT_MIN).toBe(2)
    expect(PLAYER_COUNT_MAX).toBe(8)
    expect(DEFAULT_PLAYER_COUNT).toBe(4)
  })

  it('优先使用会话中已有合法人数', () => {
    expect(getInitialPlayerCount(6)).toBe(6)
  })

  it('会话人数缺失或非法时使用默认值', () => {
    expect(getInitialPlayerCount(undefined)).toBe(4)
    expect(getInitialPlayerCount(0)).toBe(4)
    expect(getInitialPlayerCount(9)).toBe(4)
  })

  it('增减人数时严格夹在边界内', () => {
    expect(changePlayerCount(2, -1)).toBe(2)
    expect(changePlayerCount(4, 1)).toBe(5)
    expect(changePlayerCount(8, 1)).toBe(8)
  })

  it('生成进入名字输入页的真实 URL', () => {
    expect(buildPlayerNamesUrl(5)).toBe('/pages/lobby/player-names?count=5')
  })

  it('生成跳过名字的真实 URL', () => {
    expect(getSkipNamesUrl()).toBe('/pages/lobby/games')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/ui/player-count.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/ui/player-count'`。

- [ ] **Step 3: 实现人数逻辑**

创建 `ui/player-count.ts`：

```ts
export const PLAYER_COUNT_MIN = 2
export const PLAYER_COUNT_MAX = 8
export const DEFAULT_PLAYER_COUNT = 4

export function isValidPlayerCount(count: number | undefined): boolean {
  return typeof count === 'number' && count >= PLAYER_COUNT_MIN && count <= PLAYER_COUNT_MAX
}

export function getInitialPlayerCount(sessionCount: number | undefined): number {
  if (isValidPlayerCount(sessionCount)) return sessionCount as number
  return DEFAULT_PLAYER_COUNT
}

export function changePlayerCount(current: number, delta: -1 | 1): number {
  const next = current + delta
  if (next < PLAYER_COUNT_MIN) return PLAYER_COUNT_MIN
  if (next > PLAYER_COUNT_MAX) return PLAYER_COUNT_MAX
  return next
}

export function buildPlayerNamesUrl(count: number): string {
  return `/pages/lobby/player-names?count=${count}`
}

export function getSkipNamesUrl(): string {
  return '/pages/lobby/games'
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
pnpm exec vitest run tests/ui/player-count.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add ui/player-count.ts tests/ui/player-count.test.ts
git commit -m "feat: add player count selection logic"
```

---

### Task 4: 新增游戏列表纯逻辑与图片降级

**Files:**
- Create: `ui/games.ts`
- Create: `tests/ui/games.test.ts`
- Create: `static/game-covers/game1.png`
- Create: `static/game-covers/game2.png`
- Create: `static/game-covers/game3.png`
- Create: `static/game-covers/game4.png`
- Create: `static/game-covers/game5.png`
- Create: `static/game-covers/game6.png`

- [ ] **Step 1: 写失败测试**

创建 `tests/ui/games.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import {
  GAME_GROUPS,
  canPlayGame,
  getDisabledReason,
  getGameRoute,
  getVisibleGameGroups,
  resolveGameCover
} from '@/ui/games'

describe('games ui logic', () => {
  it('保留运气派和实力派两组游戏', () => {
    expect(GAME_GROUPS.map((group) => group.title)).toEqual(['运气派', '实力派'])
    expect(GAME_GROUPS[0].games.map((game) => game.id)).toEqual(['bomb', 'crocodile', 'wheel'])
    expect(GAME_GROUPS[1].games.map((game) => game.id)).toEqual(['horse-race', 'reaction'])
  })

  it('分类过滤只影响当前页展示', () => {
    expect(getVisibleGameGroups('all').length).toBe(2)
    expect(getVisibleGameGroups('luck').map((group) => group.category)).toEqual(['luck'])
    expect(getVisibleGameGroups('skill').map((group) => group.category)).toEqual(['skill'])
  })

  it('根据人数判断是否可玩', () => {
    const wheel = GAME_GROUPS[0].games.find((game) => game.id === 'wheel')!
    expect(canPlayGame(wheel, 5)).toBe(true)
    expect(canPlayGame(wheel, 6)).toBe(false)
  })

  it('人数不匹配时返回明确中文限制文案', () => {
    const reaction = GAME_GROUPS[1].games.find((game) => game.id === 'reaction')!
    expect(getDisabledReason(reaction, 1)).toBe('至少 2 人')
    expect(getDisabledReason(reaction, 8)).toBe('最多 5 人')
    expect(getDisabledReason(reaction, 4)).toBeUndefined()
  })

  it('为每个游戏生成真实游戏页路由', () => {
    expect(getGameRoute('bomb')).toBe('/pages/game/bomb/index')
    expect(getGameRoute('horse-race')).toBe('/pages/game/horse-race/index')
  })

  it('优先使用本地图片封面', () => {
    const bomb = GAME_GROUPS[0].games.find((game) => game.id === 'bomb')!
    expect(resolveGameCover(bomb, new Set())).toEqual({
      mode: 'image',
      value: '/static/game-covers/game1.png'
    })
  })

  it('图片失败时降级为 emoji', () => {
    const bomb = GAME_GROUPS[0].games.find((game) => game.id === 'bomb')!
    expect(resolveGameCover(bomb, new Set(['bomb']))).toEqual({
      mode: 'emoji',
      value: '💣'
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/ui/games'`。

- [ ] **Step 3: 复制本地封面素材**

Run:

```bash
mkdir -p "static/game-covers"
cp "ui 设计/img/game1.png" "static/game-covers/game1.png"
cp "ui 设计/img/game2.png" "static/game-covers/game2.png"
cp "ui 设计/img/game3.png" "static/game-covers/game3.png"
cp "ui 设计/img/game4.png" "static/game-covers/game4.png"
cp "ui 设计/img/game5.png" "static/game-covers/game5.png"
cp "ui 设计/img/game6.png" "static/game-covers/game6.png"
```

Expected: `static/game-covers/` 下存在 6 张 png。

- [ ] **Step 4: 实现游戏列表逻辑**

创建 `ui/games.ts`：

```ts
import type { GameId } from '@/stores/session'

export type GameCategory = 'luck' | 'skill'
export type GameFilter = 'all' | GameCategory

export type GameMeta = {
  id: GameId
  name: string
  summary: string
  emoji: string
  min: number
  max: number
  category: GameCategory
  cover: string
}

export type GameGroup = {
  category: GameCategory
  title: string
  icon: string
  games: GameMeta[]
}

export type CoverDisplay =
  | { mode: 'image'; value: string }
  | { mode: 'emoji'; value: string }

export const GAME_GROUPS: GameGroup[] = [
  {
    category: 'luck',
    title: '运气派',
    icon: '🎲',
    games: [
      {
        id: 'bomb',
        name: '定时炸弹',
        summary: '倒计时传递，爆炸者受罚',
        emoji: '💣',
        min: 2,
        max: 8,
        category: 'luck',
        cover: '/static/game-covers/game1.png'
      },
      {
        id: 'crocodile',
        name: '鳄鱼拔牙',
        summary: '试试手气，别被咬到',
        emoji: '🐊',
        min: 2,
        max: 8,
        category: 'luck',
        cover: '/static/game-covers/game2.png'
      },
      {
        id: 'wheel',
        name: '指尖大轮盘',
        summary: '手指上阵，轮盘决定输赢',
        emoji: '🎯',
        min: 2,
        max: 5,
        category: 'luck',
        cover: '/static/game-covers/game3.png'
      }
    ]
  },
  {
    category: 'skill',
    title: '实力派',
    icon: '⚡',
    games: [
      {
        id: 'horse-race',
        name: '摇一摇赛马',
        summary: '比拼手速和节奏',
        emoji: '🐎',
        min: 2,
        max: 8,
        category: 'skill',
        cover: '/static/game-covers/game4.png'
      },
      {
        id: 'reaction',
        name: '同屏反应大比拼',
        summary: '看谁最快点中目标',
        emoji: '👆',
        min: 2,
        max: 5,
        category: 'skill',
        cover: '/static/game-covers/game5.png'
      }
    ]
  }
]

const GAME_ROUTES: Record<GameId, string> = {
  bomb: '/pages/game/bomb/index',
  crocodile: '/pages/game/crocodile/index',
  'horse-race': '/pages/game/horse-race/index',
  wheel: '/pages/game/wheel/index',
  reaction: '/pages/game/reaction/index'
}

export function getVisibleGameGroups(filter: GameFilter): GameGroup[] {
  if (filter === 'all') return GAME_GROUPS
  return GAME_GROUPS.filter((group) => group.category === filter)
}

export function canPlayGame(game: GameMeta, playerCount: number): boolean {
  return playerCount >= game.min && playerCount <= game.max
}

export function getDisabledReason(game: GameMeta, playerCount: number): string | undefined {
  if (canPlayGame(game, playerCount)) return undefined
  if (playerCount < game.min) return `至少 ${game.min} 人`
  if (playerCount > game.max) return `最多 ${game.max} 人`
  return undefined
}

export function getGameRoute(id: GameId): string {
  return GAME_ROUTES[id]
}

export function resolveGameCover(game: GameMeta, failedIds: Set<GameId>): CoverDisplay {
  if (failedIds.has(game.id) || game.cover.length === 0) {
    return { mode: 'emoji', value: game.emoji }
  }
  return { mode: 'image', value: game.cover }
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add ui/games.ts tests/ui/games.test.ts static/game-covers
git commit -m "feat: add game list metadata and cover fallback"
```

---

### Task 5: 新增主题卡片纯逻辑

**Files:**
- Create: `ui/theme-cards.ts`
- Create: `tests/ui/theme-cards.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `tests/ui/theme-cards.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { getThemeCards } from '@/ui/theme-cards'

describe('theme cards', () => {
  it('返回两张中文主题卡片', () => {
    expect(getThemeCards('cartoon').map((card) => card.title)).toEqual(['Q 版卡通', '霓虹电玩'])
    expect(getThemeCards('cartoon').map((card) => card.theme)).toEqual(['cartoon', 'neon'])
  })

  it('根据当前主题标记选中态', () => {
    const cards = getThemeCards('neon')
    expect(cards.find((card) => card.theme === 'cartoon')?.active).toBe(false)
    expect(cards.find((card) => card.theme === 'neon')?.active).toBe(true)
  })

  it('卡片文案不包含英文标题', () => {
    const text = getThemeCards('cartoon').map((card) => `${card.title} ${card.subtitle}`).join(' ')
    expect(text).not.toMatch(/Pick|Style|Arcade|Version|Game/)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run tests/ui/theme-cards.test.ts
```

Expected: FAIL，错误包含 `Cannot find module '@/ui/theme-cards'`。

- [ ] **Step 3: 实现主题卡片配置**

创建 `ui/theme-cards.ts`：

```ts
import type { Theme } from '@/theme/tokens'

export type ThemeCard = {
  theme: Theme
  title: string
  subtitle: string
  emoji: string
  tone: 'soft' | 'neon'
  active: boolean
}

const THEME_CARD_BASE: Omit<ThemeCard, 'active'>[] = [
  {
    theme: 'cartoon',
    title: 'Q 版卡通',
    subtitle: '糖果粉、圆润、轻松热闹',
    emoji: '🎈',
    tone: 'soft'
  },
  {
    theme: 'neon',
    title: '霓虹电玩',
    subtitle: '深色、发光、街机氛围',
    emoji: '⚡',
    tone: 'neon'
  }
]

export function getThemeCards(current: Theme): ThemeCard[] {
  return THEME_CARD_BASE.map((card) => ({
    ...card,
    active: card.theme === current
  }))
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
pnpm exec vitest run tests/ui/theme-cards.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add ui/theme-cards.ts tests/ui/theme-cards.test.ts
git commit -m "feat: add theme card configuration"
```

---

### Task 6: 新增共享顶部栏与底部导航组件

**Files:**
- Create: `components/UiTopBar.uvue`
- Create: `components/BottomNavBar.uvue`

- [ ] **Step 1: 创建顶部栏组件**

创建 `components/UiTopBar.uvue`：

```vue
<template>
	<view class="ui-top-bar" :style="barStyle">
		<view class="top-icon" :style="iconStyle" @tap="onBack">
			<text class="top-icon-text" :style="iconTextStyle">{{ showBack ? '‹' : '🎲' }}</text>
		</view>
		<view class="top-title-wrap">
			<text class="top-title" :style="titleStyle">{{ title }}</text>
			<text v-if="subtitle" class="top-subtitle" :style="subtitleStyle">{{ subtitle }}</text>
		</view>
		<view class="top-icon" :style="iconStyle" @tap="onRight">
			<text class="top-icon-text" :style="iconTextStyle">{{ rightIcon }}</text>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'

	const props = defineProps<{
		title : string
		subtitle ?: string
		showBack ?: boolean
		rightIcon ?: string
		rightUrl ?: string
	}>()

	const emit = defineEmits<{
		(e : 'back') : void
		(e : 'right') : void
	}>()

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])
	const showBack = computed(() => props.showBack ?? true)
	const rightIcon = computed(() => props.rightIcon ?? '⚙')

	const barStyle = computed(() => ({
		backgroundColor: tokens.value.topBarBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const iconStyle = computed(() => ({
		backgroundColor: tokens.value.surfaceHigh
	}))
	const iconTextStyle = computed(() => ({
		color: tokens.value.primary
	}))
	const titleStyle = computed(() => ({
		color: tokens.value.text
	}))
	const subtitleStyle = computed(() => ({
		color: tokens.value.textMuted
	}))

	function onBack() {
		emit('back')
		if (!showBack.value) return
		uni.navigateBack({
			delta: 1,
			fail: () => uni.reLaunch({ url: '/pages/home/index' })
		})
	}

	function onRight() {
		emit('right')
		if (props.rightUrl) uni.navigateTo({ url: props.rightUrl })
	}
</script>

<style>
	.ui-top-bar {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 14px 20px;
		border-bottom-left-radius: 26px;
		border-bottom-right-radius: 26px;
	}
	.top-icon {
		width: 42px;
		height: 42px;
		border-radius: 21px;
		align-items: center;
		justify-content: center;
	}
	.top-icon-text {
		font-size: 22px;
		font-weight: bold;
	}
	.top-title-wrap {
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: 0 12px;
	}
	.top-title {
		font-size: 20px;
		font-weight: 800;
		text-align: center;
	}
	.top-subtitle {
		margin-top: 2px;
		font-size: 12px;
		text-align: center;
	}
</style>
```

- [ ] **Step 2: 创建底部导航组件**

创建 `components/BottomNavBar.uvue`：

```vue
<template>
	<view class="bottom-nav" :style="navStyle">
		<view
			v-for="item in items"
			:key="item.id"
			class="nav-item"
			:class="{ active: item.active }"
			:style="item.active ? activeStyle : inactiveStyle"
			@tap="tapItem(item.id)"
		>
			<text class="nav-icon" :style="item.active ? activeTextStyle : inactiveTextStyle">{{ item.icon }}</text>
			<text class="nav-label" :style="item.active ? activeTextStyle : inactiveTextStyle">{{ item.label }}</text>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'
	import { decideBottomNavAction, getBottomNavItems, type TopLevelPage } from '@/ui/navigation'

	const props = defineProps<{
		active : TopLevelPage
	}>()

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])
	const items = computed(() => getBottomNavItems(props.active))

	const navStyle = computed(() => ({
		backgroundColor: tokens.value.bottomNavBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const activeStyle = computed(() => ({
		backgroundColor: tokens.value.navActiveBg
	}))
	const inactiveStyle = computed(() => ({
		backgroundColor: 'transparent'
	}))
	const activeTextStyle = computed(() => ({
		color: tokens.value.navActiveText
	}))
	const inactiveTextStyle = computed(() => ({
		color: tokens.value.navInactiveText
	}))

	function tapItem(id : string) {
		const action = decideBottomNavAction(id, props.active)
		if (action.type === 'noop') return
		if (action.type === 'toast') {
			uni.showToast({ title: action.title, icon: 'none' })
			return
		}
		uni.reLaunch({ url: action.url })
	}
</script>

<style>
	.bottom-nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		padding: 8px 10px 18px 10px;
		border-top-left-radius: 34px;
		border-top-right-radius: 34px;
	}
	.nav-item {
		min-width: 56px;
		min-height: 54px;
		border-radius: 28px;
		align-items: center;
		justify-content: center;
		padding: 6px 8px;
	}
	.nav-item.active {
		transform: translateY(-8px);
	}
	.nav-icon {
		font-size: 20px;
		line-height: 22px;
	}
	.nav-label {
		margin-top: 2px;
		font-size: 11px;
		font-weight: bold;
	}
</style>
```

- [ ] **Step 3: 运行已有导航逻辑测试**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add components/UiTopBar.uvue components/BottomNavBar.uvue
git commit -m "feat: add redesigned navigation components"
```

---

### Task 7: 新增主题卡与游戏图片卡组件

**Files:**
- Create: `components/ThemeChoiceCard.uvue`
- Create: `components/GameImageCard.uvue`
- Modify: `components/AppButton.uvue`

- [ ] **Step 1: 创建主题卡组件**

创建 `components/ThemeChoiceCard.uvue`：

```vue
<template>
	<view class="theme-card" :class="{ active: active, neon: tone === 'neon' }" :style="cardStyle" @tap="onTap">
		<view class="theme-badge" :style="badgeStyle">
			<text class="theme-emoji" :style="emojiStyle">{{ emoji }}</text>
		</view>
		<text class="theme-title" :style="titleStyle">{{ title }}</text>
		<text class="theme-subtitle" :style="subtitleStyle">{{ subtitle }}</text>
		<view class="theme-check" :style="checkStyle">
			<text class="theme-check-text" :style="checkTextStyle">{{ active ? '✓' : '○' }}</text>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'
	import type { Theme } from '@/theme/tokens'

	const props = defineProps<{
		theme : Theme
		title : string
		subtitle : string
		emoji : string
		tone : 'soft' | 'neon'
		active : boolean
	}>()

	const emit = defineEmits<{ (e : 'pick', theme : Theme) : void }>()

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])

	const cardStyle = computed(() => ({
		backgroundColor: props.tone === 'neon' ? themes.neon.surface : tokens.value.surfaceHighest,
		borderColor: props.active ? tokens.value.primary : tokens.value.outlineSoft,
		boxShadow: props.active ? tokens.value.shadowSoft : 'none'
	}))
	const badgeStyle = computed(() => ({
		backgroundColor: props.tone === 'neon' ? themes.neon.surfaceHigh : tokens.value.surfaceHigh
	}))
	const emojiStyle = computed(() => ({
		textShadow: props.tone === 'neon' ? themes.neon.emojiShadow : 'none'
	}))
	const titleStyle = computed(() => ({
		color: props.tone === 'neon' ? themes.neon.text : tokens.value.text
	}))
	const subtitleStyle = computed(() => ({
		color: props.tone === 'neon' ? themes.neon.textMuted : tokens.value.textMuted
	}))
	const checkStyle = computed(() => ({
		backgroundColor: props.active ? tokens.value.navActiveBg : tokens.value.surfaceLow
	}))
	const checkTextStyle = computed(() => ({
		color: props.active ? tokens.value.navActiveText : tokens.value.textMuted
	}))

	function onTap() {
		emit('pick', props.theme)
	}
</script>

<style>
	.theme-card {
		position: relative;
		min-height: 210px;
		border-radius: 28px;
		border-width: 1px;
		border-style: solid;
		align-items: center;
		justify-content: center;
		padding: 24px;
		margin-top: 16px;
	}
	.theme-badge {
		width: 82px;
		height: 82px;
		border-radius: 41px;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}
	.theme-emoji {
		font-size: 42px;
	}
	.theme-title {
		font-size: 25px;
		font-weight: 800;
		text-align: center;
	}
	.theme-subtitle {
		margin-top: 6px;
		font-size: 14px;
		text-align: center;
	}
	.theme-check {
		position: absolute;
		right: 16px;
		top: 16px;
		width: 30px;
		height: 30px;
		border-radius: 15px;
		align-items: center;
		justify-content: center;
	}
	.theme-check-text {
		font-size: 16px;
		font-weight: bold;
	}
</style>
```

- [ ] **Step 2: 创建游戏图片卡组件**

创建 `components/GameImageCard.uvue`：

```vue
<template>
	<view class="game-card" :class="{ disabled: disabled }" :style="cardStyle" @tap="onTap">
		<view class="cover" :style="coverStyle">
			<image
				v-if="coverMode === 'image'"
				class="cover-image"
				:src="coverValue"
				mode="aspectFit"
				@error="onImageError"
			/>
			<text v-else class="cover-emoji" :style="emojiStyle">{{ coverValue }}</text>
			<view class="players-pill" :style="pillStyle">
				<text class="players-text" :style="pillTextStyle">{{ min }}-{{ max }} 人</text>
			</view>
		</view>
		<text class="game-name" :style="nameStyle">{{ name }}</text>
		<text class="game-summary" :style="summaryStyle">{{ disabledReason || summary }}</text>
	</view>
</template>

<script setup lang="uts">
	import { computed, ref } from 'vue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'

	const props = defineProps<{
		id : string
		name : string
		summary : string
		emoji : string
		cover : string
		min : number
		max : number
		disabled ?: boolean
		disabledReason ?: string
	}>()

	const emit = defineEmits<{
		(e : 'tap') : void
		(e : 'imageError', id : string) : void
	}>()

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])
	const imageFailed = ref(false)

	const coverMode = computed(() => imageFailed.value || props.cover.length === 0 ? 'emoji' : 'image')
	const coverValue = computed(() => coverMode.value === 'image' ? props.cover : props.emoji)

	const cardStyle = computed(() => ({
		backgroundColor: tokens.value.cardBg,
		boxShadow: tokens.value.shadowSoft,
		opacity: props.disabled ? 0.56 : 1
	}))
	const coverStyle = computed(() => ({
		backgroundColor: props.disabled ? tokens.value.disabledBg : tokens.value.imageCardBg
	}))
	const emojiStyle = computed(() => ({
		textShadow: tokens.value.emojiShadow
	}))
	const pillStyle = computed(() => ({
		backgroundColor: tokens.value.success
	}))
	const pillTextStyle = computed(() => ({
		color: tokens.value.onSecondary
	}))
	const nameStyle = computed(() => ({
		color: tokens.value.primary
	}))
	const summaryStyle = computed(() => ({
		color: props.disabled ? tokens.value.dangerText : tokens.value.textMuted
	}))

	function onTap() {
		if (props.disabled) return
		emit('tap')
	}

	function onImageError() {
		imageFailed.value = true
		emit('imageError', props.id)
	}
</script>

<style>
	.game-card {
		width: 48%;
		min-height: 220px;
		border-radius: 26px;
		padding: 10px;
		margin-bottom: 14px;
		align-items: center;
	}
	.cover {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 20px;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.cover-image {
		width: 100%;
		height: 100%;
	}
	.cover-emoji {
		font-size: 48px;
	}
	.players-pill {
		position: absolute;
		right: 8px;
		top: 8px;
		border-radius: 14px;
		padding: 3px 8px;
	}
	.players-text {
		font-size: 11px;
		font-weight: bold;
	}
	.game-name {
		margin-top: 10px;
		font-size: 17px;
		font-weight: 800;
		text-align: center;
	}
	.game-summary {
		margin-top: 4px;
		font-size: 12px;
		text-align: center;
		line-height: 17px;
	}
	.disabled {
		filter: grayscale(20%);
	}
</style>
```

- [ ] **Step 3: 升级 AppButton**

把 `components/AppButton.uvue` 替换为：

```vue
<template>
	<view class="app-btn" :style="containerStyle" :class="{ disabled: disabled, block: block }" @tap="onTap">
		<text class="label" :style="labelStyle">{{ label }}</text>
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'

	const props = defineProps<{
		label : string
		variant ?: 'primary' | 'secondary' | 'ghost'
		disabled ?: boolean
		block ?: boolean
	}>()
	const emit = defineEmits<{ (e : 'tap') : void }>()

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])

	const containerStyle = computed(() => {
		const variant = props.variant ?? 'primary'
		if (variant === 'ghost') {
			return {
				backgroundColor: 'transparent',
				borderWidth: '1px',
				borderColor: tokens.value.outlineSoft,
				boxShadow: 'none'
			}
		}
		if (variant === 'secondary') {
			return {
				backgroundColor: tokens.value.surfaceHigh,
				borderWidth: '0px',
				borderColor: tokens.value.surfaceHigh,
				boxShadow: tokens.value.shadowSoft
			}
		}
		return {
			backgroundColor: tokens.value.primary,
			borderWidth: '0px',
			borderColor: tokens.value.primary,
			boxShadow: tokens.value.shadowSoft
		}
	})

	const labelStyle = computed(() => {
		const variant = props.variant ?? 'primary'
		if (variant === 'primary') return { color: tokens.value.onPrimary }
		if (variant === 'secondary') return { color: tokens.value.text }
		return { color: tokens.value.primary }
	})

	function onTap() {
		if (props.disabled) return
		emit('tap')
	}
</script>

<style>
	.app-btn {
		padding: 15px 24px;
		border-radius: 24px;
		align-items: center;
		justify-content: center;
		margin-top: 10px;
	}
	.app-btn.block {
		width: 100%;
	}
	.label {
		font-size: 16px;
		font-weight: 800;
	}
	.disabled {
		opacity: 0.42;
	}
</style>
```

- [ ] **Step 4: 运行相关测试**

Run:

```bash
pnpm exec vitest run tests/theme/tokens.test.ts tests/ui/theme-cards.test.ts tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add components/ThemeChoiceCard.uvue components/GameImageCard.uvue components/AppButton.uvue
git commit -m "feat: add redesigned card primitives"
```

---

### Task 8: 改造首页

**Files:**
- Modify: `pages/home/index.uvue`

- [ ] **Step 1: 替换首页结构**

把 `pages/home/index.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<UiTopBar title="派对游乐场" subtitle="今晚从这里开局" :showBack="false" rightIcon="☺" rightUrl="/pages/settings/index" />
		<view class="decor decor-left" :style="decorPrimaryStyle"></view>
		<view class="decor decor-right" :style="decorSecondaryStyle"></view>

		<view class="main">
			<view class="hero">
				<text class="hero-title" :style="titleStyle">一起开玩</text>
				<text class="hero-subtitle" :style="subtitleStyle">选人数、挑游戏、输家抽惩罚</text>
			</view>

			<view class="entry entry-primary" :style="heroCardStyle" @tap="goStart">
				<view>
					<text class="entry-title primary-text">开始玩</text>
					<text class="entry-desc primary-text">进入人数选择</text>
				</view>
				<text class="entry-icon primary-text">▶</text>
			</view>

			<view class="entry entry-shift-right" :style="cardHighStyle" @tap="goPunishment">
				<view class="round-icon danger-icon" :style="dangerIconStyle">
					<text class="round-icon-text">⚡</text>
				</view>
				<view class="entry-copy">
					<text class="entry-title" :style="entryTitleStyle">惩罚列表</text>
					<text class="entry-desc" :style="entryDescStyle">管理输家挑战</text>
				</view>
				<text class="chevron" :style="entryDescStyle">›</text>
			</view>

			<view class="entry entry-shift-left" :style="cardAltStyle" @tap="goSettings">
				<view class="round-icon" :style="softIconStyle">
					<text class="round-icon-text">⚙</text>
				</view>
				<view class="entry-copy">
					<text class="entry-title" :style="entryTitleStyle">设置</text>
					<text class="entry-desc" :style="entryDescStyle">主题、音效、振动</text>
				</view>
				<text class="chevron" :style="entryDescStyle">›</text>
			</view>
		</view>

		<BottomNavBar active="home" />
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import UiTopBar from '@/components/UiTopBar.uvue'
	import BottomNavBar from '@/components/BottomNavBar.uvue'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const titleStyle = computed(() => ({ color: tokens.value.text }))
	const subtitleStyle = computed(() => ({ color: tokens.value.textMuted }))
	const heroCardStyle = computed(() => ({
		background: tokens.value.heroCardBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const cardHighStyle = computed(() => ({
		backgroundColor: tokens.value.surfaceHigh,
		boxShadow: tokens.value.shadowSoft
	}))
	const cardAltStyle = computed(() => ({
		backgroundColor: tokens.value.surfaceHighest,
		boxShadow: tokens.value.shadowSoft
	}))
	const entryTitleStyle = computed(() => ({ color: tokens.value.text }))
	const entryDescStyle = computed(() => ({ color: tokens.value.textMuted }))
	const dangerIconStyle = computed(() => ({ backgroundColor: tokens.value.danger }))
	const softIconStyle = computed(() => ({ backgroundColor: tokens.value.surfaceLow }))
	const decorPrimaryStyle = computed(() => ({ backgroundColor: tokens.value.decorPrimary }))
	const decorSecondaryStyle = computed(() => ({ backgroundColor: tokens.value.decorSecondary }))

	function goStart() { uni.navigateTo({ url: '/pages/lobby/player-count' }) }
	function goPunishment() { uni.navigateTo({ url: '/pages/punishment/index' }) }
	function goSettings() { uni.navigateTo({ url: '/pages/settings/index' }) }
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		padding-bottom: 98px;
		position: relative;
		overflow: hidden;
	}
	.main {
		flex: 1;
		justify-content: center;
		padding: 34px 24px 20px 24px;
	}
	.hero {
		align-items: center;
		margin-bottom: 26px;
	}
	.hero-title {
		font-size: 48px;
		line-height: 54px;
		font-weight: 900;
		text-align: center;
	}
	.hero-subtitle {
		margin-top: 8px;
		font-size: 16px;
		text-align: center;
	}
	.entry {
		border-radius: 30px;
		margin-top: 16px;
		padding: 22px;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.entry-primary {
		min-height: 116px;
	}
	.entry-shift-right {
		transform: translateX(8px);
	}
	.entry-shift-left {
		transform: translateX(-8px);
	}
	.primary-text {
		color: #ffffff;
	}
	.entry-title {
		font-size: 22px;
		font-weight: 900;
	}
	.entry-desc {
		margin-top: 4px;
		font-size: 13px;
	}
	.entry-icon {
		font-size: 42px;
		font-weight: bold;
	}
	.entry-copy {
		flex: 1;
		margin-left: 14px;
	}
	.round-icon {
		width: 58px;
		height: 58px;
		border-radius: 29px;
		align-items: center;
		justify-content: center;
	}
	.round-icon-text {
		font-size: 28px;
		color: #ffffff;
	}
	.danger-icon .round-icon-text {
		color: #ffffff;
	}
	.chevron {
		font-size: 28px;
		font-weight: bold;
	}
	.decor {
		position: absolute;
		width: 150px;
		height: 150px;
		border-radius: 75px;
		opacity: 0.65;
	}
	.decor-left {
		left: -50px;
		top: 150px;
	}
	.decor-right {
		right: -52px;
		bottom: 150px;
	}
</style>
```

- [ ] **Step 2: 运行核心测试**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts tests/theme/tokens.test.ts
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add pages/home/index.uvue
git commit -m "feat: redesign home page"
```

---

### Task 9: 改造人数选择页

**Files:**
- Modify: `pages/lobby/player-count.uvue`

- [ ] **Step 1: 替换人数选择页**

把 `pages/lobby/player-count.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<UiTopBar title="选择人数" subtitle="2 到 8 人都可以玩" rightIcon="⌂" rightUrl="/pages/home/index" />
		<view class="decor decor-left" :style="decorPrimaryStyle"></view>
		<view class="decor decor-right" :style="decorSecondaryStyle"></view>

		<view class="main">
			<view class="hero">
				<text class="title" :style="titleStyle">有几个人玩？</text>
				<text class="subtitle" :style="subtitleStyle">先定人数，下一步可输入名字</text>
			</view>

			<view class="selector-card" :style="cardStyle">
				<view class="selector-row">
					<view class="circle-btn" :style="minusStyle" @tap="minus">
						<text class="circle-text" :style="minusTextStyle">−</text>
					</view>
					<view class="number-wrap">
						<view class="number-glow" :style="glowStyle"></view>
						<text class="number" :style="numberStyle">{{ picked }}</text>
					</view>
					<view class="circle-btn" :style="plusStyle" @tap="plus">
						<text class="circle-text" :style="plusTextStyle">＋</text>
					</view>
				</view>
				<view class="range-pill" :style="rangeStyle">
					<text class="range-text" :style="rangeTextStyle">2 - 8 人</text>
				</view>
			</view>

			<AppButton label="下一步 · 输入名字" variant="primary" :block="true" @tap="next" />
			<view class="skip" @tap="skip">
				<text class="skip-text" :style="skipStyle">跳过名字，直接选游戏</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { computed, ref } from 'vue'
	import AppButton from '@/components/AppButton.uvue'
	import UiTopBar from '@/components/UiTopBar.uvue'
	import { useSession } from '@/stores/session'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'
	import { buildPlayerNamesUrl, changePlayerCount, getInitialPlayerCount, getSkipNamesUrl } from '@/ui/player-count'

	const session = useSession()
	const settings = useSettings()
	const picked = ref(getInitialPlayerCount(session.playerCount))
	const tokens = computed(() => themes[settings.theme])

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const titleStyle = computed(() => ({ color: tokens.value.text }))
	const subtitleStyle = computed(() => ({ color: tokens.value.textMuted }))
	const cardStyle = computed(() => ({
		backgroundColor: tokens.value.surfaceLow,
		boxShadow: tokens.value.shadowSoft
	}))
	const minusStyle = computed(() => ({ backgroundColor: tokens.value.surfaceHighest }))
	const plusStyle = computed(() => ({ backgroundColor: tokens.value.primary }))
	const minusTextStyle = computed(() => ({ color: tokens.value.text }))
	const plusTextStyle = computed(() => ({ color: tokens.value.onPrimary }))
	const numberStyle = computed(() => ({ color: tokens.value.primary }))
	const glowStyle = computed(() => ({ backgroundColor: tokens.value.decorPrimary }))
	const rangeStyle = computed(() => ({ backgroundColor: tokens.value.surfaceHigh }))
	const rangeTextStyle = computed(() => ({ color: tokens.value.textMuted }))
	const skipStyle = computed(() => ({ color: tokens.value.primary }))
	const decorPrimaryStyle = computed(() => ({ backgroundColor: tokens.value.decorPrimary }))
	const decorSecondaryStyle = computed(() => ({ backgroundColor: tokens.value.decorSecondary }))

	function minus() {
		picked.value = changePlayerCount(picked.value, -1)
	}
	function plus() {
		picked.value = changePlayerCount(picked.value, 1)
	}
	function next() {
		session.setPlayers(picked.value)
		uni.navigateTo({ url: buildPlayerNamesUrl(picked.value) })
	}
	function skip() {
		session.setPlayers(picked.value)
		uni.navigateTo({ url: getSkipNamesUrl() })
	}
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		position: relative;
		overflow: hidden;
	}
	.main {
		flex: 1;
		padding: 46px 24px 32px 24px;
		justify-content: center;
	}
	.hero {
		align-items: center;
		margin-bottom: 36px;
	}
	.title {
		font-size: 34px;
		line-height: 40px;
		font-weight: 900;
		text-align: center;
	}
	.subtitle {
		margin-top: 8px;
		font-size: 16px;
		text-align: center;
	}
	.selector-card {
		border-radius: 34px;
		padding: 30px 24px;
		align-items: center;
		margin-bottom: 26px;
	}
	.selector-row {
		width: 100%;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.circle-btn {
		width: 64px;
		height: 64px;
		border-radius: 32px;
		align-items: center;
		justify-content: center;
	}
	.circle-text {
		font-size: 31px;
		font-weight: 900;
	}
	.number-wrap {
		position: relative;
		width: 132px;
		height: 132px;
		align-items: center;
		justify-content: center;
	}
	.number-glow {
		position: absolute;
		width: 112px;
		height: 112px;
		border-radius: 56px;
		opacity: 0.5;
	}
	.number {
		font-size: 72px;
		line-height: 80px;
		font-weight: 900;
	}
	.range-pill {
		margin-top: 22px;
		border-radius: 18px;
		padding: 8px 18px;
	}
	.range-text {
		font-size: 13px;
		font-weight: 800;
	}
	.skip {
		align-items: center;
		padding: 14px;
	}
	.skip-text {
		font-size: 14px;
		font-weight: bold;
	}
	.decor {
		position: absolute;
		width: 180px;
		height: 180px;
		border-radius: 90px;
		opacity: 0.5;
	}
	.decor-left {
		left: -80px;
		top: 190px;
	}
	.decor-right {
		right: -85px;
		top: 280px;
	}
</style>
```

- [ ] **Step 2: 运行人数逻辑测试**

Run:

```bash
pnpm exec vitest run tests/ui/player-count.test.ts
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add pages/lobby/player-count.uvue
git commit -m "feat: redesign player count page"
```

---

### Task 10: 改造游戏列表页

**Files:**
- Modify: `pages/lobby/games.uvue`

- [ ] **Step 1: 替换游戏列表页**

把 `pages/lobby/games.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<UiTopBar title="选择游戏" :subtitle="'当前 ' + session.playerCount + ' 人'" rightIcon="⌂" rightUrl="/pages/home/index" />

		<view class="content">
			<view class="header-row">
				<text class="page-title" :style="titleStyle">游戏大厅</text>
				<view class="filter-wrap" :style="filterWrapStyle">
					<view
						v-for="item in filters"
						:key="item.id"
						class="filter-chip"
						:style="filter === item.id ? activeFilterStyle : inactiveFilterStyle"
						@tap="filter = item.id"
					>
						<text class="filter-text" :style="filter === item.id ? activeFilterTextStyle : inactiveFilterTextStyle">{{ item.label }}</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-y class="scroll">
				<view v-for="group in groups" :key="group.category" class="group">
					<view class="group-title-row">
						<text class="group-icon">{{ group.icon }}</text>
						<text class="group-title" :style="groupTitleStyle">{{ group.title }}</text>
					</view>
					<view class="game-grid">
						<GameImageCard
							v-for="game in group.games"
							:key="game.id"
							:id="game.id"
							:name="game.name"
							:summary="game.summary"
							:emoji="game.emoji"
							:cover="game.cover"
							:min="game.min"
							:max="game.max"
							:disabled="!canPlay(game)"
							:disabledReason="disabledReason(game)"
							@tap="enter(game)"
						/>
					</view>
				</view>
			</scroll-view>
		</view>

		<BottomNavBar active="games" />
	</view>
</template>

<script setup lang="uts">
	import { computed, ref } from 'vue'
	import UiTopBar from '@/components/UiTopBar.uvue'
	import BottomNavBar from '@/components/BottomNavBar.uvue'
	import GameImageCard from '@/components/GameImageCard.uvue'
	import { useSession } from '@/stores/session'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'
	import {
		canPlayGame,
		getDisabledReason,
		getGameRoute,
		getVisibleGameGroups,
		type GameFilter,
		type GameMeta
	} from '@/ui/games'

	const session = useSession()
	const settings = useSettings()
	const filter = ref<GameFilter>('all')
	const tokens = computed(() => themes[settings.theme])
	const groups = computed(() => getVisibleGameGroups(filter.value))
	const filters = [
		{ id: 'all' as GameFilter, label: '全部' },
		{ id: 'luck' as GameFilter, label: '运气派' },
		{ id: 'skill' as GameFilter, label: '实力派' }
	]

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const titleStyle = computed(() => ({ color: tokens.value.primary }))
	const filterWrapStyle = computed(() => ({ backgroundColor: tokens.value.surfaceHighest }))
	const activeFilterStyle = computed(() => ({ backgroundColor: tokens.value.primary }))
	const inactiveFilterStyle = computed(() => ({ backgroundColor: 'transparent' }))
	const activeFilterTextStyle = computed(() => ({ color: tokens.value.onPrimary }))
	const inactiveFilterTextStyle = computed(() => ({ color: tokens.value.textMuted }))
	const groupTitleStyle = computed(() => ({ color: tokens.value.text }))

	function canPlay(game : GameMeta) : boolean {
		return canPlayGame(game, session.playerCount)
	}
	function disabledReason(game : GameMeta) : string | undefined {
		return getDisabledReason(game, session.playerCount)
	}
	function enter(game : GameMeta) {
		if (!canPlay(game)) return
		session.currentGame = game.id
		uni.navigateTo({ url: getGameRoute(game.id) })
	}
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		padding-bottom: 92px;
	}
	.content {
		flex: 1;
		padding: 24px 16px 0 16px;
	}
	.header-row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}
	.page-title {
		font-size: 28px;
		font-weight: 900;
	}
	.filter-wrap {
		flex-direction: row;
		border-radius: 20px;
		padding: 4px;
	}
	.filter-chip {
		border-radius: 16px;
		padding: 7px 10px;
	}
	.filter-text {
		font-size: 12px;
		font-weight: 800;
	}
	.scroll {
		flex: 1;
	}
	.group {
		margin-bottom: 30px;
	}
	.group-title-row {
		flex-direction: row;
		align-items: center;
		margin-bottom: 14px;
	}
	.group-icon {
		font-size: 22px;
		margin-right: 8px;
	}
	.group-title {
		font-size: 20px;
		font-weight: 900;
	}
	.game-grid {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
	}
</style>
```

- [ ] **Step 2: 运行游戏逻辑测试**

Run:

```bash
pnpm exec vitest run tests/ui/games.test.ts
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add pages/lobby/games.uvue
git commit -m "feat: redesign games page"
```

---

### Task 11: 改造主题选择与设置页

**Files:**
- Modify: `pages/onboarding/index.uvue`
- Modify: `pages/settings/index.uvue`

- [ ] **Step 1: 替换 onboarding 页面**

把 `pages/onboarding/index.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<view class="brand">
			<text class="brand-title" :style="titleStyle">派对游乐场</text>
			<text class="brand-subtitle" :style="subtitleStyle">先选一个视觉风格</text>
		</view>

		<view class="cards">
			<ThemeChoiceCard
				v-for="card in cards"
				:key="card.theme"
				:theme="card.theme"
				:title="card.title"
				:subtitle="card.subtitle"
				:emoji="card.emoji"
				:tone="card.tone"
				:active="card.active"
				@pick="pick"
			/>
		</view>
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import ThemeChoiceCard from '@/components/ThemeChoiceCard.uvue'
	import { useSettings } from '@/stores/settings'
	import { themes, type Theme } from '@/theme/tokens'
	import { getThemeCards } from '@/ui/theme-cards'

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])
	const cards = computed(() => getThemeCards(settings.theme))

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const titleStyle = computed(() => ({ color: tokens.value.primary }))
	const subtitleStyle = computed(() => ({ color: tokens.value.textMuted }))

	function pick(theme : Theme) {
		settings.setTheme(theme)
		settings.markOnboarded()
		uni.reLaunch({ url: '/pages/home/index' })
	}
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		padding: 52px 22px 28px 22px;
	}
	.brand {
		align-items: center;
		margin-bottom: 26px;
	}
	.brand-title {
		font-size: 42px;
		line-height: 48px;
		font-weight: 900;
		text-align: center;
	}
	.brand-subtitle {
		margin-top: 8px;
		font-size: 16px;
		text-align: center;
	}
	.cards {
		flex: 1;
	}
</style>
```

- [ ] **Step 2: 替换 settings 页面**

把 `pages/settings/index.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<UiTopBar title="设置" subtitle="主题与设备反馈" rightIcon="⌂" rightUrl="/pages/home/index" />
		<scroll-view scroll-y class="content">
			<text class="section-title" :style="sectionTitleStyle">主题</text>
			<ThemeChoiceCard
				v-for="card in cards"
				:key="card.theme"
				:theme="card.theme"
				:title="card.title"
				:subtitle="card.subtitle"
				:emoji="card.emoji"
				:tone="card.tone"
				:active="card.active"
				@pick="pickTheme"
			/>

			<text class="section-title" :style="sectionTitleStyle">偏好</text>
			<view class="setting-row" :style="rowStyle">
				<view>
					<text class="setting-name" :style="nameStyle">音效</text>
					<text class="setting-desc" :style="descStyle">游戏反馈和结果提示音</text>
				</view>
				<switch :checked="settings.soundEnabled" @change="toggleSound" />
			</view>
			<view class="setting-row" :style="rowStyle">
				<view>
					<text class="setting-name" :style="nameStyle">振动</text>
					<text class="setting-desc" :style="descStyle">关键操作时短振提醒</text>
				</view>
				<switch :checked="settings.vibrationEnabled" @change="toggleVibration" />
			</view>

			<text class="section-title" :style="sectionTitleStyle">关于</text>
			<view class="about" :style="rowStyle">
				<text class="setting-name" :style="nameStyle">派对小游戏</text>
				<text class="setting-desc" :style="descStyle">版本 v0.1.0 · 2026</text>
			</view>
		</scroll-view>
		<BottomNavBar active="settings" />
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import UiTopBar from '@/components/UiTopBar.uvue'
	import BottomNavBar from '@/components/BottomNavBar.uvue'
	import ThemeChoiceCard from '@/components/ThemeChoiceCard.uvue'
	import { useSettings } from '@/stores/settings'
	import { themes, type Theme } from '@/theme/tokens'
	import { getThemeCards } from '@/ui/theme-cards'

	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])
	const cards = computed(() => getThemeCards(settings.theme))

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const sectionTitleStyle = computed(() => ({ color: tokens.value.textMuted }))
	const rowStyle = computed(() => ({
		backgroundColor: tokens.value.cardBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const nameStyle = computed(() => ({ color: tokens.value.text }))
	const descStyle = computed(() => ({ color: tokens.value.textMuted }))

	function pickTheme(theme : Theme) { settings.setTheme(theme) }
	function toggleSound() { settings.toggleSound() }
	function toggleVibration() { settings.toggleVibration() }
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		padding-bottom: 94px;
	}
	.content {
		flex: 1;
		padding: 20px 20px 0 20px;
	}
	.section-title {
		margin-top: 20px;
		margin-bottom: 4px;
		font-size: 14px;
		font-weight: 900;
	}
	.setting-row {
		margin-top: 12px;
		border-radius: 24px;
		padding: 16px;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.setting-name {
		font-size: 16px;
		font-weight: 800;
	}
	.setting-desc {
		margin-top: 4px;
		font-size: 12px;
	}
	.about {
		margin-top: 12px;
		border-radius: 24px;
		padding: 18px;
		margin-bottom: 20px;
	}
</style>
```

- [ ] **Step 3: 运行主题相关测试**

Run:

```bash
pnpm exec vitest run tests/ui/theme-cards.test.ts tests/stores/settings.test.ts tests/theme/apply.test.ts
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add pages/onboarding/index.uvue pages/settings/index.uvue
git commit -m "feat: redesign theme selection and settings pages"
```

---

### Task 12: 改造惩罚列表页

**Files:**
- Modify: `pages/punishment/index.uvue`

- [ ] **Step 1: 替换惩罚列表页**

把 `pages/punishment/index.uvue` 替换为：

```vue
<template>
	<view class="page" :style="pageStyle">
		<UiTopBar title="惩罚列表" :subtitle="store.rules.length + ' 条规则'" rightIcon="⌂" rightUrl="/pages/home/index" />
		<scroll-view scroll-y class="content">
			<view class="hero-card" :style="heroCardStyle" @tap="goAdd">
				<text class="hero-icon">＋</text>
				<text class="hero-title">新增惩罚</text>
				<text class="hero-desc">给输家加一条新的挑战</text>
			</view>

			<view class="list-title-row">
				<text class="list-title" :style="titleStyle">规则库</text>
				<view class="count-pill" :style="pillStyle">
					<text class="count-text" :style="pillTextStyle">{{ store.rules.length }} 条</text>
				</view>
			</view>

			<view v-if="store.rules.length === 0" class="empty-card" :style="cardStyle">
				<text class="empty-emoji">📭</text>
				<text class="empty-title" :style="titleStyle">还没有惩罚</text>
				<text class="empty-desc" :style="descStyle">先点上方卡片新增一条规则。</text>
			</view>

			<view v-for="rule in store.rules" :key="rule.id" class="rule-card" :style="cardStyle" :class="{ disabled: !rule.enabled }">
				<view class="state-strip" :style="rule.enabled ? activeStripStyle : disabledStripStyle"></view>
				<view class="rule-main">
					<text class="rule-text" :class="{ disabledText: !rule.enabled }" :style="titleStyle">{{ rule.text }}</text>
					<view class="badge" :style="badgeStyle">
						<text class="badge-text" :style="badgeTextStyle">{{ rule.builtIn ? '内置' : '自定义' }}</text>
					</view>
				</view>
				<view class="rule-actions">
					<switch :checked="rule.enabled" @change="toggle(rule.id)" />
					<text class="action" :style="actionStyle" @tap="goEdit(rule.id)">编辑</text>
					<text class="action" :style="dangerActionStyle" @tap="confirmRemove(rule)">删除</text>
				</view>
			</view>
		</scroll-view>
		<BottomNavBar active="punishment" />
	</view>
</template>

<script setup lang="uts">
	import { computed } from 'vue'
	import UiTopBar from '@/components/UiTopBar.uvue'
	import BottomNavBar from '@/components/BottomNavBar.uvue'
	import { usePunishment, type PunishmentRule } from '@/stores/punishment'
	import { useSettings } from '@/stores/settings'
	import { themes } from '@/theme/tokens'

	const store = usePunishment()
	const settings = useSettings()
	const tokens = computed(() => themes[settings.theme])

	const pageStyle = computed(() => ({ backgroundColor: tokens.value.bg }))
	const heroCardStyle = computed(() => ({
		background: tokens.value.heroCardBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const cardStyle = computed(() => ({
		backgroundColor: tokens.value.cardBg,
		boxShadow: tokens.value.shadowSoft
	}))
	const titleStyle = computed(() => ({ color: tokens.value.text }))
	const descStyle = computed(() => ({ color: tokens.value.textMuted }))
	const pillStyle = computed(() => ({ backgroundColor: tokens.value.success }))
	const pillTextStyle = computed(() => ({ color: tokens.value.onSecondary }))
	const badgeStyle = computed(() => ({ backgroundColor: tokens.value.surfaceLow }))
	const badgeTextStyle = computed(() => ({ color: tokens.value.textMuted }))
	const activeStripStyle = computed(() => ({ backgroundColor: tokens.value.success }))
	const disabledStripStyle = computed(() => ({ backgroundColor: tokens.value.disabledBg }))
	const actionStyle = computed(() => ({ color: tokens.value.primary }))
	const dangerActionStyle = computed(() => ({ color: tokens.value.dangerText }))

	function toggle(id: string) { store.toggleRule(id) }
	function goAdd() { uni.navigateTo({ url: '/pages/punishment/edit?mode=add' }) }
	function goEdit(id: string) { uni.navigateTo({ url: '/pages/punishment/edit?mode=edit&id=' + encodeURIComponent(id) }) }
	function confirmRemove(rule: PunishmentRule) {
		const extra = rule.builtIn ? '内置条目删除后下次升级不会重新出现。' : ''
		uni.showModal({
			title: '删除规则',
			content: '确认删除「' + rule.text + '」？' + extra,
			success: (res) => {
				if (res.confirm) store.removeRule(rule.id)
			}
		})
	}
</script>

<style>
	.page {
		flex: 1;
		min-height: 100%;
		padding-bottom: 94px;
	}
	.content {
		flex: 1;
		padding: 22px 20px 0 20px;
	}
	.hero-card {
		border-radius: 30px;
		padding: 24px;
		align-items: center;
		overflow: hidden;
	}
	.hero-icon {
		font-size: 44px;
		color: #ffffff;
		font-weight: 900;
	}
	.hero-title {
		margin-top: 6px;
		font-size: 24px;
		color: #ffffff;
		font-weight: 900;
	}
	.hero-desc {
		margin-top: 4px;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
	}
	.list-title-row {
		margin-top: 28px;
		margin-bottom: 14px;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	.list-title {
		font-size: 20px;
		font-weight: 900;
	}
	.count-pill {
		border-radius: 14px;
		padding: 4px 12px;
	}
	.count-text {
		font-size: 11px;
		font-weight: 800;
	}
	.empty-card {
		border-radius: 24px;
		padding: 28px;
		align-items: center;
	}
	.empty-emoji {
		font-size: 42px;
	}
	.empty-title {
		margin-top: 10px;
		font-size: 19px;
		font-weight: 900;
	}
	.empty-desc {
		margin-top: 6px;
		font-size: 13px;
		text-align: center;
	}
	.rule-card {
		position: relative;
		border-radius: 22px;
		padding: 18px 16px 14px 22px;
		margin-bottom: 14px;
		overflow: hidden;
	}
	.rule-card.disabled {
		opacity: 0.62;
		transform: translateX(6px);
	}
	.state-strip {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 7px;
	}
	.rule-main {
		flex-direction: row;
		align-items: center;
	}
	.rule-text {
		flex: 1;
		font-size: 16px;
		font-weight: 800;
		line-height: 22px;
	}
	.disabledText {
		text-decoration: line-through;
	}
	.badge {
		border-radius: 12px;
		padding: 3px 8px;
		margin-left: 10px;
	}
	.badge-text {
		font-size: 11px;
		font-weight: bold;
	}
	.rule-actions {
		margin-top: 12px;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
	}
	.action {
		margin-left: 18px;
		font-size: 14px;
		font-weight: bold;
	}
</style>
```

- [ ] **Step 2: 运行惩罚 store 测试**

Run:

```bash
pnpm exec vitest run tests/stores/punishment.test.ts
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add pages/punishment/index.uvue
git commit -m "feat: redesign punishment list page"
```

---

### Task 13: 更新页面导航配置

**Files:**
- Modify: `pages.json`

- [ ] **Step 1: 修改 5 个目标页面为自绘导航栏**

在 `pages.json` 中确保以下页面的 `style` 都包含 `"navigationStyle": "custom"`：

```json
{
  "path": "pages/onboarding/index",
  "style": {
    "navigationStyle": "custom"
  }
},
{
  "path": "pages/home/index",
  "style": {
    "navigationStyle": "custom"
  }
},
{
  "path": "pages/settings/index",
  "style": {
    "navigationStyle": "custom"
  }
},
{
  "path": "pages/lobby/player-count",
  "style": {
    "navigationStyle": "custom"
  }
},
{
  "path": "pages/lobby/games",
  "style": {
    "navigationStyle": "custom"
  }
},
{
  "path": "pages/punishment/index",
  "style": {
    "navigationStyle": "custom"
  }
}
```

不要修改 `pages/lobby/player-names`、具体游戏页、结算页、`pages/punishment/edit` 的系统导航配置。

- [ ] **Step 2: 运行配置相关测试**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts
```

Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add pages.json
git commit -m "feat: use custom navigation on redesigned pages"
```

---

### Task 14: 总体验证与人工验收

**Files:**
- Verify only: all modified files

- [ ] **Step 1: 运行新增纯逻辑测试**

Run:

```bash
pnpm exec vitest run tests/ui/navigation.test.ts tests/ui/player-count.test.ts tests/ui/games.test.ts tests/ui/theme-cards.test.ts
```

Expected: PASS，耗时低于 60 秒。

- [ ] **Step 2: 运行主题与 store 回归测试**

Run:

```bash
pnpm exec vitest run tests/theme/tokens.test.ts tests/theme/apply.test.ts tests/stores/settings.test.ts tests/stores/session.test.ts tests/stores/punishment.test.ts
```

Expected: PASS，耗时低于 60 秒。

- [ ] **Step 3: 运行全量单元测试**

Run:

```bash
pnpm test
```

Expected: PASS，耗时低于 60 秒。

- [ ] **Step 4: 手工检查主流程**

Run:

```bash
pnpm test
```

Expected: 单测通过后，在 HarmonyOS NEXT / uni-app x 运行环境手工检查：

- 首次启动进入 `pages/onboarding/index`，点击 `Q 版卡通` 后进入首页。
- 首页点击 `开始玩` 进入人数选择页。
- 人数页默认显示 4；减到 2 后继续点击减号仍是 2；加到 8 后继续点击加号仍是 8。
- 人数页点击 `下一步 · 输入名字` 进入 `pages/lobby/player-names?count=<人数>`。
- 人数页点击 `跳过名字，直接选游戏` 进入游戏列表。
- 游戏列表在 6 人时仍展示 `指尖大轮盘` 和 `同屏反应大比拼`，但显示 `最多 5 人` 且不可点击。
- 首页、游戏列表、设置、惩罚页底部导航真实入口可跳转，`社交` 只弹出 `功能建设中，稍后开放`。
- 设置页切换 `霓虹电玩` 后当前页面立即变为深色可读，再切回 `Q 版卡通` 后恢复糖果粉。
- 惩罚页有规则时显示 hero 卡片和规则卡片；规则为空时仍保留 hero 卡片和统一骨架。
- 删除惩罚规则时仍有确认弹窗。

- [ ] **Step 5: 检查工作树**

Run:

```bash
git status --short
```

Expected: 只出现本计划涉及的文件变更；不要包含 `.DS_Store` 或其他无关文件。

- [ ] **Step 6: 最终提交**

```bash
git add ui components theme tests pages pages.json static/game-covers
git commit -m "feat: redesign party game shell pages"
```

---

## 自查结果

### 规范覆盖

- 首页：Task 8 覆盖顶部栏、品牌标题、三入口卡片、装饰背景、底部导航。
- 人数选择：Task 3 与 Task 9 覆盖 2-8 边界、默认值、加减按钮、下一步与跳过入口。
- 游戏列表：Task 4 与 Task 10 覆盖分类、图片卡片、本地封面、人数禁用态、真实游戏路由。
- 主题选择：Task 5 与 Task 11 覆盖 onboarding 与 settings 共用主题卡、立即切换、中文文案。
- 惩罚列表：Task 12 覆盖新增 hero、规则卡片、内置/自定义标签、启停、编辑、删除确认、空状态统一骨架。
- 主题系统：Task 1 覆盖 cartoon 新视觉 token 与 neon 兼容 token。
- 导航规则：Task 2、Task 6、Task 13 覆盖自绘顶部栏、底部导航、占位入口提示、当前页不重复入栈。
- 测试策略：Task 1 到 Task 5 与 Task 14 覆盖纯逻辑测试和现有回归测试。

### 占位词扫描

- 计划中没有遗留未细化条目、待补实现标记或延后实现说明。
- 计划中的“占位入口”是产品规则，不是未完成实现；对应实现为 `UNMAPPED_ENTRY_TITLE = '功能建设中，稍后开放'` 并有测试覆盖。

### 类型一致性

- `Theme`、`ThemeTokens`、`TopLevelPage`、`GameId`、`GameMeta`、`GameFilter` 在测试、纯逻辑和页面中使用同一命名。
- `getInitialPlayerCount`、`changePlayerCount`、`getVisibleGameGroups`、`getDisabledReason`、`getThemeCards` 的调用名与定义名一致。
- 底部导航组件接收的 `active` 与 `TopLevelPage` 一致，页面只传 `home`、`games`、`punishment`、`settings`。
