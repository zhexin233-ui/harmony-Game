import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettings } from '@/stores/settings'
import { vibrateShort, vibrateLong } from '@/native/vibrator'

describe('vibrator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.vibrateShort as any) = vi.fn()
    ;(uni.vibrateLong as any) = vi.fn()
  })

  it('settings.vibrationEnabled=false 时不调用原生 API', () => {
    const s = useSettings()
    s.vibrationEnabled = false
    vibrateShort()
    vibrateLong()
    expect(uni.vibrateShort).not.toHaveBeenCalled()
    expect(uni.vibrateLong).not.toHaveBeenCalled()
  })

  it('settings.vibrationEnabled=true 时调用原生 API', () => {
    const s = useSettings()
    s.vibrationEnabled = true
    vibrateShort()
    vibrateLong()
    expect(uni.vibrateShort).toHaveBeenCalledTimes(1)
    expect(uni.vibrateLong).toHaveBeenCalledTimes(1)
  })
})
