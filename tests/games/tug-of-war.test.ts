import { describe, expect, it } from 'vitest'
import { createTugOfWarGame } from '@/games/tug-of-war/logic'

describe('createTugOfWarGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createTugOfWarGame({ playerCount: 1 })).toThrow()
    expect(() => createTugOfWarGame({ playerCount: 9 })).toThrow()
  })

  it('初始抽取红蓝代表且不能重复', () => {
    const game = createTugOfWarGame({ playerCount: 4, random: () => 0 })
    const rep = game.getSnapshot().representative
    expect(rep.redPlayerIndex).toBe(0)
    expect(rep.bluePlayerIndex).toBe(1)
  })

  it('可设置赛制和胜负条件后进入倒计时', () => {
    const game = createTugOfWarGame({ playerCount: 4 })
    game.setMode('best-of-three')
    game.setWinCondition('threshold')
    game.startRound()
    expect(game.getSnapshot()).toMatchObject({
      state: 'countdown',
      mode: 'best-of-three',
      winCondition: 'threshold'
    })
  })

  it('倒计时结束后进入 playing', () => {
    const game = createTugOfWarGame({ playerCount: 2 })
    game.startRound()
    game.tick(2999)
    expect(game.getSnapshot().state).toBe('countdown')
    game.tick(1)
    expect(game.getSnapshot().state).toBe('playing')
  })

  it('只有 playing 状态的己方半屏点击改变绳子位置', () => {
    const game = createTugOfWarGame({ playerCount: 2, clickForce: 0.2 })
    expect(game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)).toBe(false)
    game.startRound()
    game.tick(3000)
    expect(game.tap('red', { id: 1, x: 70, y: 0 }, 100, 0)).toBe(false)
    expect(game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)).toBe(true)
    expect(game.getSnapshot().ropePosition).toBeCloseTo(-0.2)
  })

  it('高频点击按最小间隔节流', () => {
    const game = createTugOfWarGame({ playerCount: 2, clickForce: 0.1, clickMinIntervalMs: 80 })
    game.startRound()
    game.tick(3000)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 100)).toBe(true)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 150)).toBe(false)
    expect(game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 180)).toBe(true)
    expect(game.getSnapshot().blueEffectiveClicks).toBe(2)
  })

  it('固定时长结束后按绳子位置判胜', () => {
    const game = createTugOfWarGame({ playerCount: 2, roundDurationMs: 1000, clickForce: 0.2 })
    game.startRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)
    game.tick(1000)
    expect(game.getSnapshot()).toMatchObject({
      state: 'matchResult',
      roundWinner: 'red',
      matchWinner: 'red'
    })
  })

  it('拉过终点模式达到阈值立即结束本局', () => {
    const game = createTugOfWarGame({ playerCount: 2, threshold: 0.3, clickForce: 0.2 })
    game.setWinCondition('threshold')
    game.startRound()
    game.tick(3000)
    game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 0)
    expect(game.getSnapshot().state).toBe('playing')
    game.tap('blue', { id: 1, x: 80, y: 0 }, 100, 100)
    expect(game.getSnapshot()).toMatchObject({ state: 'matchResult', matchWinner: 'blue' })
  })

  it('三局两胜先到 2 分结束比赛', () => {
    const game = createTugOfWarGame({ playerCount: 2, roundDurationMs: 100, clickForce: 0.2 })
    game.setMode('best-of-three')
    game.startRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 0)
    game.tick(100)
    expect(game.getSnapshot()).toMatchObject({ state: 'roundResult', redScore: 1 })
    game.startNextRound()
    game.tick(3000)
    game.tap('red', { id: 1, x: 10, y: 0 }, 100, 200)
    game.tick(100)
    expect(game.getSnapshot()).toMatchObject({ state: 'matchResult', redScore: 2, matchWinner: 'red' })
  })
})
