import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'
import { preload, play } from '@/native/audio'
import { GAME_SOUNDS } from '@/utils/game-sounds'

describe('audio', () => {
  let playMock: ReturnType<typeof vi.fn>
  let factoryCalls: string[]

  beforeEach(() => {
    setActivePinia(createPinia())
    factoryCalls = []
    playMock = vi.fn()
    ;(uni.createInnerAudioContext as any) = vi.fn(() => {
      const ctx: any = {
        play: playMock,
        stop: vi.fn(),
        destroy: vi.fn(),
        onPlay: vi.fn(),
        onEnded: vi.fn(),
        onError: vi.fn()
      }
      Object.defineProperty(ctx, 'src', {
        configurable: true,
        set(v: string) { factoryCalls.push(v) },
        get() { return '' }
      })
      return ctx
    })
  })

  it('settings.soundEnabled=false 时不播放', () => {
    const s = useSettings()
    s.soundEnabled = false
    preload({ click: '/static/sound/click.mp3' })
    play('click')
    expect(playMock).not.toHaveBeenCalled()
  })

  it('settings.soundEnabled=true 时能播放预加载的音效', () => {
    const s = useSettings()
    s.soundEnabled = true
    preload({ click: '/static/sound/click.mp3' })
    play('click')
    expect(playMock).toHaveBeenCalledTimes(1)
  })

  it('播放未预加载的 id 不崩溃', () => {
    const s = useSettings()
    s.soundEnabled = true
    expect(() => play('notfound' as any)).not.toThrow()
    expect(playMock).not.toHaveBeenCalled()
  })
})

describe('preload(GAME_SOUNDS)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.createInnerAudioContext as any) = vi.fn(() => ({
      play: vi.fn(), stop: vi.fn(), destroy: vi.fn(),
      onPlay: vi.fn(), onEnded: vi.fn(), onError: vi.fn(),
      src: ''
    }))
  })

  it('为 8 个 ID 各创建一个 audioContext', () => {
    const createSpy = (globalThis as any).uni.createInnerAudioContext as ReturnType<typeof vi.fn>
    createSpy.mockClear()
    preload(GAME_SOUNDS)
    expect(createSpy).toHaveBeenCalledTimes(Object.keys(GAME_SOUNDS).length)
    expect(Object.keys(GAME_SOUNDS).length).toBe(8)
  })
})
