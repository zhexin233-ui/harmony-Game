// games/bomb/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type BombState = 'ready' | 'ticking' | 'exploded'

export type BombSnapshot = {
  state: BombState
  durationMs: number
  elapsedMs: number
  remainingMs: number
  fuseCuts: number
  result?: GameResult
}

export type BombGame = {
  getSnapshot(): BombSnapshot
  start(): void
  tick(deltaMs: number): void
  cutFuse(): void
  reportLoser(playerIndex: number): void
}

const DEFAULT_MIN_SECONDS = 30
const DEFAULT_MAX_SECONDS = 90
const FUSE_DEDUCTION_MS = 1000

export function createBombGame(opts: {
  random?: RandomSource
  minSeconds?: number
  maxSeconds?: number
  fuseDeductionMs?: number
}): BombGame {
  const random = opts.random ?? defaultRandom
  const minSeconds = opts.minSeconds ?? DEFAULT_MIN_SECONDS
  const maxSeconds = opts.maxSeconds ?? DEFAULT_MAX_SECONDS
  const fuseDeductionMs = opts.fuseDeductionMs ?? FUSE_DEDUCTION_MS
  const durationMs = randomInt(random, minSeconds * 1000, maxSeconds * 1000 + 1)

  let state: BombState = 'ready'
  let elapsedMs = 0
  let fuseCuts = 0
  let result: GameResult | undefined

  function detonateIfDue(): void {
    if (elapsedMs >= durationMs) {
      elapsedMs = durationMs
      state = 'exploded'
    }
  }

  return {
    getSnapshot() {
      return {
        state,
        durationMs,
        elapsedMs,
        remainingMs: Math.max(0, durationMs - elapsedMs),
        fuseCuts,
        result
      }
    },
    start() {
      if (state === 'ready') state = 'ticking'
    },
    tick(deltaMs: number) {
      if (state !== 'ticking') return
      if (deltaMs < 0) return
      elapsedMs += deltaMs
      detonateIfDue()
    },
    cutFuse() {
      if (state !== 'ticking') return
      fuseCuts++
      elapsedMs += fuseDeductionMs
      detonateIfDue()
    },
    reportLoser(playerIndex: number) {
      if (state !== 'exploded') return
      if (playerIndex < 0) return
      result = { loser: playerIndex }
    }
  }
}
