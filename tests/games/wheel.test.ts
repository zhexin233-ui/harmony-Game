import { describe, it, expect } from 'vitest'
import { createWheelGame } from '@/games/wheel/logic'

describe('createWheelGame', () => {
  it('要求人数 2-5', () => {
    expect(() => createWheelGame({ playerCount: 1 })).toThrow()
    expect(() => createWheelGame({ playerCount: 6 })).toThrow()
  })

  it('初始 collecting 状态、无手指', () => {
    const g = createWheelGame({ playerCount: 3 })
    const s = g.getSnapshot()
    expect(s.state).toBe('collecting')
    expect(s.fingerIds).toEqual([])
    expect(s.fingerTouches).toEqual([])
    expect(s.result).toBeUndefined()
  })

  it('记录每根手指的触点坐标', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10, { x: 42, y: 84 })
    g.addFinger(11, { x: 128, y: 256 })
    expect(g.getSnapshot().fingerTouches).toEqual([
      { id: 10, x: 42, y: 84 },
      { id: 11, x: 128, y: 256 }
    ])
  })

  it('collecting 阶段移动手指会更新触点坐标', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10, { x: 42, y: 84 })
    g.moveFinger(10, { x: 60, y: 96 })
    expect(g.getSnapshot().fingerTouches).toEqual([{ id: 10, x: 60, y: 96 }])
  })

  it('人数未齐不会 spin', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10)
    g.addFinger(11)
    expect(g.getSnapshot().state).toBe('collecting')
  })

  it('到齐后自动进入 spinning 并决定时长与目标', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    const s = g.getSnapshot()
    expect(s.state).toBe('spinning')
    expect(s.spinDurationMs).toBeGreaterThanOrEqual(2000)
    expect(s.spinDurationMs).toBeLessThanOrEqual(3000)
    expect(s.selectedFingerIndex).toBe(0)
  })

  it('random=0.99 时 selectedFingerIndex 为最后一位', () => {
    const g = createWheelGame({ playerCount: 3, random: () => 0.99 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    expect(g.getSnapshot().selectedFingerIndex).toBe(2)
  })

  it('重复 id 被忽略', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10])
  })

  it('超过 playerCount 的手指被忽略', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11); g.addFinger(12)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('collecting 阶段抬手减少 fingers', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10, { x: 10, y: 20 }); g.addFinger(11, { x: 30, y: 40 })
    g.removeFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([11])
    expect(g.getSnapshot().fingerTouches).toEqual([{ id: 11, x: 30, y: 40 }])
  })

  it('spinning 阶段抬手被忽略（fingers 冻结）', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.removeFinger(10)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('spinning 阶段移动手指被忽略（坐标冻结）', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10, { x: 10, y: 20 }); g.addFinger(11, { x: 30, y: 40 })
    g.moveFinger(10, { x: 100, y: 200 })
    expect(g.getSnapshot().fingerTouches).toEqual([
      { id: 10, x: 10, y: 20 },
      { id: 11, x: 30, y: 40 }
    ])
  })

  it('tick 累计到 duration 进入 selected，loser = selectedFingerIndex', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    const duration = g.getSnapshot().spinDurationMs
    g.tick(duration - 1)
    expect(g.getSnapshot().state).toBe('spinning')
    g.tick(2)
    const s = g.getSnapshot()
    expect(s.state).toBe('selected')
    expect(s.result?.loser).toBe(0)
  })

  it('selected 状态下 tick 无效', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(5000)  // 已 selected
    const before = g.getSnapshot().spinElapsedMs
    g.tick(1000)
    expect(g.getSnapshot().spinElapsedMs).toBe(before)
  })

  it('collecting 状态下 tick 无效', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10)
    g.tick(5000)
    expect(g.getSnapshot().spinElapsedMs).toBe(0)
  })

  it('负 delta 被忽略', () => {
    const g = createWheelGame({ playerCount: 2, random: () => 0 })
    g.addFinger(10); g.addFinger(11)
    g.tick(-500)
    expect(g.getSnapshot().spinElapsedMs).toBe(0)
  })

  it('fingerIds 返回拷贝', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10); g.addFinger(11)
    const s = g.getSnapshot()
    s.fingerIds.push(999)
    expect(g.getSnapshot().fingerIds).toEqual([10, 11])
  })

  it('fingerTouches 返回拷贝', () => {
    const g = createWheelGame({ playerCount: 3 })
    g.addFinger(10, { x: 42, y: 84 })
    const s = g.getSnapshot()
    s.fingerTouches.push({ id: 99, x: 1, y: 2 })
    s.fingerTouches[0].x = 999
    expect(g.getSnapshot().fingerTouches).toEqual([{ id: 10, x: 42, y: 84 }])
  })
})
