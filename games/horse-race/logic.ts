// games/horse-race/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom } from '../random'

export type HorseRaceState = 'ready' | 'shaking' | 'result'

export type HorseRaceSnapshot = {
  state: HorseRaceState
  playerCount: number
  currentPlayer: number
  shakeDurationMs: number
  elapsedMs: number
  shakeCounts: number[]
  peakThreshold: number
  result?: GameResult
}

export type HorseRaceGame = {
  getSnapshot(): HorseRaceSnapshot
  startPlayer(): void
  onSample(magnitude: number): void
  tick(deltaMs: number): void
  finishPlayer(): void
}

const DEFAULT_PEAK_THRESHOLD = 2.0
const DEFAULT_SHAKE_DURATION_MS = 10000

export function createHorseRaceGame(opts: {
  playerCount: number
  random?: RandomSource
  shakeDurationMs?: number
  peakThreshold?: number
}): HorseRaceGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const shakeDurationMs = opts.shakeDurationMs ?? DEFAULT_SHAKE_DURATION_MS
  const peakThreshold = opts.peakThreshold ?? DEFAULT_PEAK_THRESHOLD

  let state: HorseRaceState = 'ready'
  let currentPlayer = 0
  let elapsedMs = 0
  let inPeak = false
  const shakeCounts = new Array<number>(opts.playerCount).fill(0)
  let result: GameResult | undefined

  function finalize(): GameResult {
    let maxVal = shakeCounts[0]
    let winner = 0
    let minVal = shakeCounts[0]
    let minIdxs: number[] = [0]
    for (let i = 1; i < shakeCounts.length; i++) {
      const v = shakeCounts[i]
      if (v > maxVal) {
        maxVal = v
        winner = i
      }
      if (v < minVal) {
        minVal = v
        minIdxs = [i]
      } else if (v === minVal) {
        minIdxs.push(i)
      }
    }
    const loser = minIdxs.length === 1
      ? minIdxs[0]
      : minIdxs[Math.floor(random() * minIdxs.length)]
    return { loser, winner }
  }

  function advancePlayer(): void {
    currentPlayer++
    elapsedMs = 0
    inPeak = false
    if (currentPlayer >= opts.playerCount) {
      state = 'result'
      result = finalize()
    } else {
      state = 'ready'
    }
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        currentPlayer,
        shakeDurationMs,
        elapsedMs,
        shakeCounts: [...shakeCounts],
        peakThreshold,
        result
      }
    },
    startPlayer() {
      if (state === 'result') return
      state = 'shaking'
      elapsedMs = 0
      inPeak = false
    },
    onSample(magnitude: number) {
      if (state !== 'shaking') return
      if (magnitude >= peakThreshold) {
        if (!inPeak) {
          shakeCounts[currentPlayer]++
          inPeak = true
        }
      } else {
        inPeak = false
      }
    },
    tick(deltaMs: number) {
      if (state !== 'shaking') return
      if (deltaMs < 0) return
      elapsedMs += deltaMs
      if (elapsedMs >= shakeDurationMs) advancePlayer()
    },
    finishPlayer() {
      if (state !== 'shaking') return
      advancePlayer()
    }
  }
}
