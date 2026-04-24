export type TopLevelPage = 'home' | 'games' | 'punishment' | 'settings'

import type { IconKey } from '@/ui/icons'

export type BottomNavItemId = 'home' | 'punishment' | 'settings'

export type BottomNavItem = {
  id: BottomNavItemId
  label: string
  iconKey: IconKey
  page?: TopLevelPage
  route?: string
  placeholderTitle?: string
}

export type BottomNavRenderItem = BottomNavItem & {
  active: boolean
  visualIconClass: string
}

export type BottomNavAction =
  | { type: 'noop' }
  | { type: 'navigate'; method: 'reLaunch'; url: string }
  | { type: 'toast'; title: string }

export const UNMAPPED_ENTRY_TITLE = '功能建设中，稍后开放'

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: '首页', iconKey: 'nav-home', page: 'home', route: '/pages/home/index' },
  { id: 'punishment', label: '惩罚', iconKey: 'nav-punishment', page: 'punishment', route: '/pages/punishment/index' },
  { id: 'settings', label: '设置', iconKey: 'nav-settings', page: 'settings', route: '/pages/settings/index' }
]

const BOTTOM_NAV_VISUAL_ICON_CLASSES: Record<BottomNavItemId, string> = {
  home: 'home-shape',
  punishment: 'punishment-shape',
  settings: 'settings-shape'
}

export function getBottomNavVisualIconClass(id: BottomNavItemId): string {
  return BOTTOM_NAV_VISUAL_ICON_CLASSES[id]
}

export function getBottomNavItems(current?: TopLevelPage): BottomNavRenderItem[] {
  return BOTTOM_NAV_ITEMS.map((item) => ({
    ...item,
    active: item.page === current,
    visualIconClass: getBottomNavVisualIconClass(item.id)
  }))
}

export function decideBottomNavAction(id: string, current: TopLevelPage): BottomNavAction {
  const item = BOTTOM_NAV_ITEMS.find((navItem) => navItem.id === id)
  if (!item) return { type: 'toast', title: UNMAPPED_ENTRY_TITLE }
  if (item.page === current) return { type: 'noop' }
  if (item.route) return { type: 'navigate', method: 'reLaunch', url: item.route }
  return { type: 'toast', title: item.placeholderTitle ?? UNMAPPED_ENTRY_TITLE }
}
