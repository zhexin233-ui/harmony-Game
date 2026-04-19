import { describe, it, expect } from 'vitest'
import { createHorseRaceGame } from '@/games/horse-race/logic'

describe('createHorseRaceGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createHorseRaceGame({ playerCount: 1 })).toThrow()
    expect(() => createHorseRaceGame({ playerCount: 9 })).toThrow()
  })

  it('初始 ready，每人次数 0', () => {
    const g = createHorseRaceGame({ playerCount: 3 })
    const s = g.getSnapshot()
    expect(s.state).toBe('ready')
    expect(s.shakeCounts).toEqual([0, 0, 0])
    expect(s.currentPlayer).toBe(0)
  })

  it('startPlayer 进入 shaking 并重置计时', () => {
    const g = createHorseRaceGame({ playerCount: 2 })
    g.startPlayer()
    expect(g.getSnapshot().state).toBe('shaking')
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('峰值检测：上升沿计 +1', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(3)    // 上升沿 → +1
    g.onSample(3.5)  // 同一峰段不计
    g.onSample(1)    // 回到低位
    g.onSample(3)    // 新上升沿 → +1
    expect(g.getSnapshot().shakeCounts[0]).toBe(2)
  })

  it('magnitude 低于阈值不计', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(1.9)
    g.onSample(1.5)
    expect(g.getSnapshot().shakeCounts[0]).toBe(0)
  })

  it('ready 状态下 onSample 被忽略', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.onSample(5)
    expect(g.getSnapshot().shakeCounts[0]).toBe(0)
  })

  it('tick 累加 elapsed；到 duration 自动 finish', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer()
    g.tick(99)
    expect(g.getSnapshot().state).toBe('shaking')
    g.tick(2)
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('finishPlayer 手动推进到下一位', () => {
    const g = createHorseRaceGame({ playerCount: 3, shakeDurationMs: 1000 })
    g.startPlayer()
    g.finishPlayer()
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('全员完成后进入 result', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer()
    g.tick(101)  // finish p0
    g.startPlayer()
    g.tick(101)  // finish p1
    expect(g.getSnapshot().state).toBe('result')
    expect(g.getSnapshot().result).toBeDefined()
  })

  it('最多次数 → winner，最少次数 → loser', () => {
    const g = createHorseRaceGame({
      playerCount: 3, shakeDurationMs: 100, peakThreshold: 2
    })
    // p0 摇 2 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.tick(101)
    // p1 摇 1 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.tick(101)
    // p2 摇 4 次
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.onSample(3); g.onSample(1)
    g.tick(101)
    const r = g.getSnapshot().result
    expect(r?.loser).toBe(1)
    expect(r?.winner).toBe(2)
  })

  it('并列最少次数：random=0 选并列中第一个', () => {
    const g = createHorseRaceGame({
      playerCount: 2, shakeDurationMs: 100, random: () => 0
    })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    expect(g.getSnapshot().result?.loser).toBe(0)
  })

  it('并列最少次数：random=0.99 选并列中最后一个', () => {
    const g = createHorseRaceGame({
      playerCount: 2, shakeDurationMs: 100, random: () => 0.99
    })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    expect(g.getSnapshot().result?.loser).toBe(1)
  })

  it('并列最多次数：winner 为并列中第一个（稳定取第一）', () => {
    const g = createHorseRaceGame({
      playerCount: 3, shakeDurationMs: 100, peakThreshold: 2
    })
    // 0 和 2 都摇 1 次；1 摇 0 次
    g.startPlayer(); g.onSample(3); g.onSample(1); g.tick(101)
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.onSample(3); g.onSample(1); g.tick(101)
    const r = g.getSnapshot().result
    expect(r?.winner).toBe(0)
    expect(r?.loser).toBe(1)
  })

  it('result 状态下 startPlayer 无效', () => {
    const g = createHorseRaceGame({ playerCount: 2, shakeDurationMs: 100 })
    g.startPlayer(); g.tick(101)
    g.startPlayer(); g.tick(101)
    g.startPlayer()
    expect(g.getSnapshot().state).toBe('result')
  })

  it('shakeCounts 返回拷贝', () => {
    const g = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    g.startPlayer()
    g.onSample(3); g.onSample(1)
    const s = g.getSnapshot()
    s.shakeCounts[0] = 999
    expect(g.getSnapshot().shakeCounts[0]).toBe(1)
  })
})
