import { describe, expect, it } from 'vitest'
import { createFingerTwisterGame } from '@/games/finger-twister/logic'

describe('createFingerTwisterGame', () => {
  it('要求人数 2-4', () => {
    expect(() => createFingerTwisterGame({ playerCount: 1 })).toThrow()
    expect(() => createFingerTwisterGame({ playerCount: 5 })).toThrow()
  })

  it('start 后生成第一条任务，前期优先每位玩家第 1 根手指', () => {
    const game = createFingerTwisterGame({ playerCount: 3, random: () => 0, width: 360, height: 640 })
    game.start()
    const task = game.getSnapshot().currentTask!
    expect(game.getSnapshot().state).toBe('prompt')
    expect(task.playerIndex).toBe(0)
    expect(task.fingerNumber).toBe(1)
  })

  it('新触点按中当前目标后绑定任务', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    expect(game.addTouch(11, { id: 11, x: circle.x, y: circle.y })).toBe(true)
    expect(game.getSnapshot().assignments).toHaveLength(1)
    expect(game.getSnapshot().state).toBe('holding')
  })

  it('未按中目标不绑定任务', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    expect(game.addTouch(11, { id: 11, x: 0, y: 0 })).toBe(false)
    expect(game.getSnapshot().assignments).toEqual([])
    expect(game.getSnapshot().state).toBe('prompt')
  })

  it('已绑定触点离开立即失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    game.releaseTouch(11)
    expect(game.getSnapshot()).toMatchObject({
      state: 'failed',
      failure: { playerIndex: 0, reason: 'released' },
      result: { loser: 0 }
    })
  })

  it('当前任务超时立即失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, taskTimeLimitMs: 1000 })
    game.start()
    game.tick(999)
    expect(game.getSnapshot().state).toBe('prompt')
    game.tick(1)
    expect(game.getSnapshot()).toMatchObject({
      state: 'failed',
      failure: { playerIndex: 0, reason: 'timeout' },
      result: { loser: 0 }
    })
  })

  it('未知触点离开不会误判已有玩家失败', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    game.releaseTouch(99)
    expect(game.getSnapshot().state).toBe('holding')
  })

  it('任务生成不超过 6 个总触点，同一玩家最多 2 根手指', () => {
    const game = createFingerTwisterGame({ playerCount: 4, random: () => 0, width: 360, height: 640 })
    game.start()
    for (let i = 0; i < 6; i++) {
      const task = game.getSnapshot().currentTask!
      game.addTouch(100 + i, { id: 100 + i, x: task.circle.x, y: task.circle.y })
      game.promptNext()
    }
    const assignments = game.getSnapshot().assignments
    expect(assignments).toHaveLength(6)
    for (let player = 0; player < 4; player++) {
      expect(assignments.filter((item) => item.playerIndex === player).length).toBeLessThanOrEqual(2)
    }
  })

  it('快照返回深拷贝', () => {
    const game = createFingerTwisterGame({ playerCount: 2, random: () => 0, width: 360, height: 640 })
    game.start()
    const circle = game.getSnapshot().currentTask!.circle
    game.addTouch(11, { id: 11, x: circle.x, y: circle.y })
    const snap = game.getSnapshot()
    snap.assignments[0].circle.x = 999
    snap.assignments.push({
      taskId: 'x',
      playerIndex: 9,
      fingerNumber: 9,
      touchId: 9,
      circle: { id: 'x', color: '#fff', x: 0, y: 0, radius: 1 }
    })
    expect(game.getSnapshot().assignments).toHaveLength(1)
    expect(game.getSnapshot().assignments[0].circle.x).toBe(circle.x)
  })
})
