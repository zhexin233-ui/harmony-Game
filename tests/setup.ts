import { vi, beforeEach } from 'vitest'

// mock uni 全局对象（只覆盖本仓库用到的 API）
const storageMap = new Map<string, unknown>()

;(globalThis as any).uni = {
  setStorageSync(key: string, value: unknown) { storageMap.set(key, value) },
  getStorageSync(key: string) { return storageMap.get(key) ?? '' },
  removeStorageSync(key: string) { storageMap.delete(key) },
  vibrateShort: vi.fn(),
  vibrateLong: vi.fn(),
  createInnerAudioContext: vi.fn(() => ({
    play: vi.fn(), stop: vi.fn(), destroy: vi.fn(),
    onPlay: vi.fn(), onEnded: vi.fn(), onError: vi.fn(),
    src: ''
  })),
  startAccelerometer: vi.fn(),
  stopAccelerometer: vi.fn(),
  onAccelerometerChange: vi.fn(),
  offAccelerometerChange: vi.fn(),
  setKeepScreenOn: vi.fn()
}

beforeEach(() => { storageMap.clear() })
