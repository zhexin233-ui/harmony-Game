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
