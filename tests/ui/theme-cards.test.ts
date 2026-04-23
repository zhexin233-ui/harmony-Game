import { describe, it, expect } from 'vitest'
import { getThemeCards } from '@/ui/theme-cards'

describe('theme cards', () => {
  it('返回两张中文主题卡片', () => {
    expect(getThemeCards('cartoon').map((card) => card.title)).toEqual(['Q 版卡通', '霓虹电玩'])
    expect(getThemeCards('cartoon').map((card) => card.theme)).toEqual(['cartoon', 'neon'])
    expect(getThemeCards('cartoon').map((card) => card.iconKey)).toEqual(['theme-cartoon', 'theme-neon'])
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
