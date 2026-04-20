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
