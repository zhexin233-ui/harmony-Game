import { describe, expect, it } from 'vitest'
import { createNumberBombGame } from '@/games/number-bomb/logic'

describe('createNumberBombGame', () => {
  it('要求人数 2-8', () => {
    expect(() => createNumberBombGame({ playerCount: 1 })).toThrow()
    expect(() => createNumberBombGame({ playerCount: 9 })).toThrow()
  })

  it('2-5 人默认 1-100，6-8 人默认 1-999', () => {
    expect(createNumberBombGame({ playerCount: 5 }).getSnapshot().preset).toBe('1-100')
    expect(createNumberBombGame({ playerCount: 6 }).getSnapshot().preset).toBe('1-999')
  })

  it('start 后进入 guessing，初始当前玩家为玩家 1', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    expect(game.getSnapshot()).toMatchObject({ state: 'guessing', currentPlayerIndex: 0 })
  })

  it('猜小更新下界并切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    expect(game.getSnapshot()).toMatchObject({
      displayMin: 40,
      exclusiveMin: 40,
      displayMax: 100,
      currentPlayerIndex: 1,
      state: 'guessing'
    })
  })

  it('猜大更新上界并切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(80)
    expect(game.getSnapshot()).toMatchObject({
      displayMin: 1,
      displayMax: 80,
      exclusiveMax: 80,
      currentPlayerIndex: 1,
      state: 'guessing'
    })
  })

  it('猜中进入 exploded 并记录当前玩家为输家', () => {
    const game = createNumberBombGame({ playerCount: 3, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    game.submitGuess(60)
    expect(game.getSnapshot()).toMatchObject({
      state: 'exploded',
      result: { loser: 1 }
    })
  })

  it('非整数、越界、重复边界输入不切换玩家', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    game.submitGuess(40)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
    game.submitGuess(40.5)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
    game.submitGuess(101)
    expect(game.getSnapshot().currentPlayerIndex).toBe(1)
  })

  it('历史记录保留猜测前范围和玩家', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    expect(game.getSnapshot().guesses).toEqual([
      { playerIndex: 0, value: 40, rangeBefore: { min: 1, max: 100 } }
    ])
  })

  it('切换范围后重新生成数字并重置范围', () => {
    const game = createNumberBombGame({ playerCount: 6, random: () => 0 })
    game.setPreset('1-100')
    const snap = game.getSnapshot()
    expect(snap).toMatchObject({
      preset: '1-100',
      displayMin: 1,
      displayMax: 100,
      exclusiveMin: 0,
      exclusiveMax: 101
    })
  })

  it('快照返回拷贝', () => {
    const game = createNumberBombGame({ playerCount: 2, bombNumber: 60 })
    game.start()
    game.submitGuess(40)
    const snap = game.getSnapshot()
    snap.guesses[0].rangeBefore.min = 999
    snap.guesses.push({ playerIndex: 9, value: 9, rangeBefore: { min: 9, max: 9 } })
    expect(game.getSnapshot().guesses).toEqual([
      { playerIndex: 0, value: 40, rangeBefore: { min: 1, max: 100 } }
    ])
  })
})
