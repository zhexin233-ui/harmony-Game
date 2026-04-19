import { describe, it, expect } from 'vitest'
import { createReactionGame } from '@/games/reaction/logic'

describe('createReactionGame', () => {
  it('要求人数 2-5', () => {
    expect(() => createReactionGame({ playerCount: 1 })).toThrow()
    expect(() => createReactionGame({ playerCount: 6 })).toThrow()
  })

  it('初始 collecting', () => {
    const g = createReactionGame({ playerCount: 3 })
    expect(g.getSnapshot().state).toBe('collecting')
  })

  it('到齐进入 armed 并确定 armedDelayMs', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    const s = g.getSnapshot()
    expect(s.state).toBe('armed')
    expect(s.armedDelayMs).toBeGreaterThanOrEqual(3000)
    expect(s.armedDelayMs).toBeLessThanOrEqual(10000)
    expect(s.armedDelayMs).toBe(3000)  // random=0 → 3000
  })

  it('collecting 阶段抬手只移除手指，不判负', () => {
    const g = createReactionGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)
    const s = g.getSnapshot()
    expect(s.state).toBe('collecting')
    expect(s.fingerIds).toEqual([11])
  })

  it('armed 阶段抬手 → 抢跑立输', () => {
    const g = createReactionGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    g.removeFinger(11)  // index 1 抢跑
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(1)
  })

  it('armed 阶段未知 id 抬手被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(999)
    expect(g.getSnapshot().state).toBe('armed')
  })

  it('tick 到 armedDelay 进入 signal', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })  // 3000ms
    g.addFinger(10); g.addFinger(11)
    g.tick(2999)
    expect(g.getSnapshot().state).toBe('armed')
    g.tick(2)
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段最后松手的玩家输', () => {
    const g = createReactionGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    g.tick(3000)
    g.removeFinger(11)   // index 1
    g.removeFinger(10)   // index 0
    expect(g.getSnapshot().state).toBe('signal')  // 还没全松
    g.removeFinger(12)   // index 2 最后松
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(2)
  })

  it('signal 阶段未松手的玩家不影响 resolve', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(10)
    // 只松了一个，signal 继续
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段同 id 重复松手只算一次', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(10)
    g.removeFinger(10)  // 重复
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('signal 阶段未知 id 松手被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(3000)
    g.removeFinger(999)
    expect(g.getSnapshot().state).toBe('signal')
  })

  it('resolved 状态后再 tick / remove 被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)  // 抢跑 resolved
    g.tick(5000)
    g.removeFinger(11)
    const s = g.getSnapshot()
    expect(s.state).toBe('resolved')
    expect(s.result?.loser).toBe(0)
  })

  it('spinning 阶段（其实是 armed / signal）不接受新手指', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.addFinger(12)  // armed 阶段新增被忽略
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('重复 id 在 collecting 阶段被忽略', () => {
    const g = createReactionGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10])
  })

  it('负 delta 被忽略', () => {
    const g = createReactionGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(-500)
    expect(g.getSnapshot().armedElapsedMs).toBe(0)
  })
})
