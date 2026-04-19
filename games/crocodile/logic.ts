// games/crocodile/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type CrocodileState = 'ready' | 'playing' | 'trapTriggered'

export type CrocodileSnapshot = {
  state: CrocodileState
  playerCount: number
  totalTeeth: number
  trappedTooth: number
  pressedTeeth: number[]
  currentPlayer: number
  result?: GameResult
}

export type CrocodileGame = {
  getSnapshot(): CrocodileSnapshot
  start(): void
  tapTooth(index: number): void
}

function toothCountFor(playerCount: number): number {
  if (playerCount <= 4) return 8
  if (playerCount <= 6) return 10
  return 12
}

export function createCrocodileGame(opts: {
  playerCount: number
  random?: RandomSource
}): CrocodileGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const totalTeeth = toothCountFor(opts.playerCount)
  const trappedTooth = randomInt(random, 0, totalTeeth)

  let state: CrocodileState = 'ready'
  const pressedTeeth: number[] = []
  let currentPlayer = 0
  let result: GameResult | undefined

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        totalTeeth,
        trappedTooth,
        pressedTeeth: [...pressedTeeth],
        currentPlayer,
        result
      }
    },
    start() {
      if (state === 'ready') state = 'playing'
    },
    tapTooth(index: number) {
      if (state !== 'playing') return
      if (index < 0 || index >= totalTeeth) return
      if (pressedTeeth.includes(index)) return
      pressedTeeth.push(index)
      if (index === trappedTooth) {
        state = 'trapTriggered'
        result = { loser: currentPlayer }
        return
      }
      currentPlayer = (currentPlayer + 1) % opts.playerCount
    }
  }
}
