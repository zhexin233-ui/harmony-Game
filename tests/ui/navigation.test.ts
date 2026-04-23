import { describe, it, expect } from 'vitest'
import {
  BOTTOM_NAV_ITEMS,
  decideBottomNavAction,
  getBottomNavItems,
  type TopLevelPage
} from '@/ui/navigation'

describe('bottom navigation', () => {
  it('只包含首页、惩罚、设置三项入口', () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.label)).toEqual(['首页', '惩罚', '设置'])
    expect(BOTTOM_NAV_ITEMS.map((item) => item.id)).toEqual(['home', 'punishment', 'settings'])
    expect(BOTTOM_NAV_ITEMS.map((item) => item.iconKey)).toEqual(['nav-home', 'nav-punishment', 'nav-settings'])
    expect(BOTTOM_NAV_ITEMS.filter((item) => item.route).map((item) => item.id)).toEqual([
      'home',
      'punishment',
      'settings'
    ])
  })

  it('点击当前页不重复跳转', () => {
    expect(decideBottomNavAction('home', 'home')).toEqual({ type: 'noop' })
  })

  it('点击真实入口返回 reLaunch 动作', () => {
    expect(decideBottomNavAction('punishment', 'home')).toEqual({
      type: 'navigate',
      method: 'reLaunch',
      url: '/pages/punishment/index'
    })
  })

  it('为当前页面标记激活态', () => {
    const items = getBottomNavItems('punishment')
    expect(items.find((item) => item.id === 'punishment')?.active).toBe(true)
    expect(items.find((item) => item.id === 'home')?.active).toBe(false)
  })

  it('未指定当前页时不高亮任何底栏项', () => {
    const items = getBottomNavItems()
    expect(items.every((item) => item.active === false)).toBe(true)
  })

  it('未知入口安全降级为中文提示', () => {
    expect(decideBottomNavAction('unknown', 'settings' as TopLevelPage)).toEqual({
      type: 'toast',
      title: '功能建设中，稍后开放'
    })
  })
})
