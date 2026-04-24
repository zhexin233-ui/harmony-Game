import { describe, it, expect } from 'vitest'
import { createCrocodileGame } from '@/games/crocodile/logic'

describe('createCrocodileGame', () => {
  it('要求人数 2-16，否则抛错', () => {
    expect(() => createCrocodileGame({ playerCount: 1 })).toThrow()
    expect(() => createCrocodileGame({ playerCount: 16 })).not.toThrow()
    expect(() => createCrocodileGame({ playerCount: 17 })).toThrow()
  })

  it('牙齿数至少 16 颗，超过后按（人数 - 1）* 2 计算', () => {
    expect(createCrocodileGame({ playerCount: 2, random: () => 0 }).getSnapshot().totalTeeth).toBe(16)
    expect(createCrocodileGame({ playerCount: 4, random: () => 0 }).getSnapshot().totalTeeth).toBe(16)
    expect(createCrocodileGame({ playerCount: 9, random: () => 0 }).getSnapshot().totalTeeth).toBe(16)
    expect(createCrocodileGame({ playerCount: 16, random: () => 0 }).getSnapshot().totalTeeth).toBe(30)
  })

  it('初始化：ready 状态，pressedTeeth 空，currentPlayer=0', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0 })
    const s = g.getSnapshot()
    expect(s.state).toBe('ready')
    expect(s.pressedTeeth).toEqual([])
    expect(s.currentPlayer).toBe(0)
    expect(s.result).toBeUndefined()
  })

  it('random=0 时陷阱牙索引为 0', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0 })
    expect(g.getSnapshot().trappedTooth).toBe(0)
  })

  it('random=0.99 时陷阱牙索引为 totalTeeth-1', () => {
    const g = createCrocodileGame({ playerCount: 4, random: () => 0.99 })
    expect(g.getSnapshot().trappedTooth).toBe(15)
  })

  it('start 进入 playing', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    expect(g.getSnapshot().state).toBe('playing')
  })

  it('按非陷阱牙：轮到下一位并记录', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)
    const s = g.getSnapshot()
    expect(s.state).toBe('playing')
    expect(s.pressedTeeth).toEqual([1])
    expect(s.currentPlayer).toBe(1)
    expect(s.result).toBeUndefined()
  })

  it('按陷阱牙：当前玩家输，状态 trapTriggered', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)  // p0 → p1
    g.tapTooth(2)  // p1 → p2
    g.tapTooth(0)  // p2 按陷阱
    const s = g.getSnapshot()
    expect(s.state).toBe('trapTriggered')
    expect(s.result).toEqual({ loser: 2 })
  })

  it('已按过的牙再按被忽略', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(1)
    g.tapTooth(1)
    expect(g.getSnapshot().currentPlayer).toBe(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([1])
  })

  it('越界 index 被忽略', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(-1)
    g.tapTooth(999)
    const s = g.getSnapshot()
    expect(s.pressedTeeth).toEqual([])
    expect(s.currentPlayer).toBe(0)
  })

  it('ready 状态下 tap 无效', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.tapTooth(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([])
  })

  it('轮次循环：到末位玩家后回到 0', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })  // 陷阱 0
    g.start()
    g.tapTooth(1)  // p0 → p1
    g.tapTooth(2)  // p1 → p2
    g.tapTooth(3)  // p2 → p0
    expect(g.getSnapshot().currentPlayer).toBe(0)
  })

  it('trapTriggered 后 tap 无效', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(0)  // p0 按陷阱
    g.tapTooth(1)
    expect(g.getSnapshot().pressedTeeth).toEqual([0])
  })

  it('getSnapshot 返回拷贝，外部修改不污染内部', () => {
    const g = createCrocodileGame({ playerCount: 3, random: () => 0 })
    g.start()
    g.tapTooth(1)
    const s = g.getSnapshot()
    s.pressedTeeth.push(99)
    expect(g.getSnapshot().pressedTeeth).toEqual([1])
  })
})
