import { describe, it, expect } from 'vitest'
import { createBombGame } from '@/games/bomb/logic'

describe('createBombGame', () => {
  it('默认倒计时 30-90 秒；random=0 时 30 秒', () => {
    const g = createBombGame({ random: () => 0 })
    expect(g.getSnapshot().durationMs).toBe(30000)
  })

  it('random=0.9999 时倒计时接近 90 秒', () => {
    const g = createBombGame({ random: () => 0.9999 })
    expect(g.getSnapshot().durationMs).toBeLessThanOrEqual(90000)
    expect(g.getSnapshot().durationMs).toBeGreaterThanOrEqual(30000)
  })

  it('可通过参数覆盖 min/max', () => {
    const g = createBombGame({ random: () => 0, minSeconds: 5, maxSeconds: 10 })
    expect(g.getSnapshot().durationMs).toBe(5000)
  })

  it('初始 ready', () => {
    const g = createBombGame({ random: () => 0 })
    expect(g.getSnapshot().state).toBe('ready')
  })

  it('start 进入 ticking', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    expect(g.getSnapshot().state).toBe('ticking')
  })

  it('ready 状态 tick 无效', () => {
    const g = createBombGame({ random: () => 0 })
    g.tick(5000)
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('tick 累加 elapsed；remainingMs = duration - elapsed', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(5000)
    const s = g.getSnapshot()
    expect(s.elapsedMs).toBe(5000)
    expect(s.remainingMs).toBe(25000)
  })

  it('累积到 duration 时爆炸', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(29999)
    expect(g.getSnapshot().state).toBe('ticking')
    g.tick(2)
    expect(g.getSnapshot().state).toBe('exploded')
  })

  it('cutFuse 扣 1 秒并计数', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.cutFuse()
    const s = g.getSnapshot()
    expect(s.elapsedMs).toBe(1000)
    expect(s.fuseCuts).toBe(1)
  })

  it('cutFuse 可直接引爆', () => {
    const g = createBombGame({ random: () => 0 })  // 30s
    g.start()
    g.tick(29500)
    g.cutFuse()  // +1000ms → 超过 duration
    expect(g.getSnapshot().state).toBe('exploded')
  })

  it('爆炸后 cutFuse 无效', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    const beforeCuts = g.getSnapshot().fuseCuts
    g.cutFuse()
    expect(g.getSnapshot().fuseCuts).toBe(beforeCuts)
  })

  it('爆炸后 reportLoser 记录 result', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    g.reportLoser(2)
    expect(g.getSnapshot().result).toEqual({ loser: 2 })
  })

  it('未爆炸时 reportLoser 不生效', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.reportLoser(2)
    expect(g.getSnapshot().result).toBeUndefined()
  })

  it('负 index 的 reportLoser 被忽略', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    g.reportLoser(-1)
    expect(g.getSnapshot().result).toBeUndefined()
  })

  it('负 delta 被忽略', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(-500)
    expect(g.getSnapshot().elapsedMs).toBe(0)
  })

  it('爆炸后 remainingMs = 0', () => {
    const g = createBombGame({ random: () => 0 })
    g.start()
    g.tick(30000)
    expect(g.getSnapshot().remainingMs).toBe(0)
  })
})
