import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'

describe('useSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('在未持久化时给出默认值', () => {
    const s = useSettings()
    s.load()
    expect(s.theme).toBe('cartoon')
    expect(s.soundEnabled).toBe(true)
    expect(s.vibrationEnabled).toBe(true)
    expect(s.hasOnboarded).toBe(false)
  })

  it('setTheme 会同步写 storage', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => {
      written[k] = v
    }
    const s = useSettings()
    s.setTheme('neon')
    expect(s.theme).toBe('neon')
    expect(written['settings']).toEqual(expect.objectContaining({ theme: 'neon' }))
  })

  it('toggleSound 会翻转并持久化', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => {
      written[k] = v
    }
    const s = useSettings()
    s.toggleSound()
    expect(s.soundEnabled).toBe(false)
    expect((written['settings'] as any).soundEnabled).toBe(false)
  })

  it('markOnboarded 会设置标记并持久化', () => {
    const written: Record<string, unknown> = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => {
      written[k] = v
    }
    const s = useSettings()
    s.markOnboarded()
    expect(s.hasOnboarded).toBe(true)
    expect(written['hasOnboarded']).toBe(true)
  })
})
