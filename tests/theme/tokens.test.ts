import { describe, it, expect } from 'vitest'
import { themes, type Theme } from '@/theme/tokens'

describe('themes', () => {
  it('包含 cartoon 与 neon 两套主题', () => {
    expect(Object.keys(themes)).toEqual(['cartoon', 'neon'])
  })

  it('每套主题都有必需的 token', () => {
    const required = ['bg', 'primary', 'secondary', 'text', 'textMuted', 'success', 'danger', 'glow'] as const
    ;(['cartoon', 'neon'] as Theme[]).forEach((t) => {
      required.forEach((k) => {
        expect(themes[t]).toHaveProperty(k)
        expect(typeof themes[t][k]).toBe('string')
      })
    })
  })

  it('neon 主题不包含紫色', () => {
    const values = Object.values(themes.neon).join(' ').toLowerCase()
    expect(values).not.toMatch(/#302b63|#8b5cf6|#6a0dad/)
  })
})

describe('themes tokens 完整性', () => {
  const requiredKeys = [
    'bg', 'bgEnd', 'primary', 'secondary', 'accent',
    'text', 'textMuted', 'success', 'danger', 'glow',
    'warn', 'urgent', 'armedBg', 'signalBg', 'emojiShadow'
  ] as const

  it('cartoon 主题包含所有必要 token', () => {
    for (const k of requiredKeys) {
      expect((themes.cartoon as unknown as Record<string, string>)[k]).toBeTruthy()
    }
  })
  it('neon 主题包含所有必要 token', () => {
    for (const k of requiredKeys) {
      expect((themes.neon as unknown as Record<string, string>)[k]).toBeTruthy()
    }
  })
  it('neon 的 emojiShadow 含发光效果', () => {
    expect(themes.neon.emojiShadow).toMatch(/rgba|#/)
  })
})
