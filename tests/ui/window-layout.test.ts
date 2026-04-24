import { describe, expect, it, vi } from 'vitest'
import {
  getGameViewportStyle,
  normalizeWindowLayoutMetrics,
  readWindowLayoutMetrics
} from '@/ui/window-layout'

describe('window layout metrics', () => {
  it('优先使用 safeAreaInsets，并补齐顶部状态栏高度', () => {
    expect(normalizeWindowLayoutMetrics({
      windowWidth: 412,
      windowHeight: 844,
      statusBarHeight: 24,
      safeAreaTop: 32,
      safeAreaBottom: 18,
      safeAreaLeft: 4,
      safeAreaRight: 6
    })).toEqual({
      windowWidth: 412,
      windowHeight: 844,
      statusBarHeight: 24,
      safeAreaTop: 32,
      safeAreaBottom: 18,
      safeAreaLeft: 4,
      safeAreaRight: 6
    })
  })

  it('窗口信息缺失时退回安全默认值', () => {
    expect(normalizeWindowLayoutMetrics({
      statusBarHeight: 20
    })).toEqual({
      windowWidth: 390,
      windowHeight: 844,
      statusBarHeight: 20,
      safeAreaTop: 20,
      safeAreaBottom: 0,
      safeAreaLeft: 0,
      safeAreaRight: 0
    })
  })

  it('从 uni.getWindowInfo 读取鸿蒙安全区信息', () => {
    ;(globalThis as any).uni.getWindowInfo = vi.fn(() => ({
      windowWidth: 430,
      windowHeight: 932,
      statusBarHeight: 24,
      safeAreaInsets: {
        top: 28,
        bottom: 16,
        left: 2,
        right: 2
      }
    }))

    expect(readWindowLayoutMetrics()).toEqual({
      windowWidth: 430,
      windowHeight: 932,
      statusBarHeight: 24,
      safeAreaTop: 28,
      safeAreaBottom: 16,
      safeAreaLeft: 2,
      safeAreaRight: 2
    })
  })

  it('生成游戏根容器的完整可按压视口样式', () => {
    expect(getGameViewportStyle('#101820', {
      windowWidth: 390,
      windowHeight: 812,
      safeAreaBottom: 12
    })).toEqual({
      height: '812px',
      minHeight: '812px',
      backgroundColor: '#101820'
    })
  })
})
