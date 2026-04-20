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
