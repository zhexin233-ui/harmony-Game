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
