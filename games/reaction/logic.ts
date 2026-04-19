// games/reaction/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type ReactionState = 'collecting' | 'armed' | 'signal' | 'resolved'

export type ReactionSnapshot = {
  state: ReactionState
  playerCount: number
  fingerIds: number[]
  armedElapsedMs: number
  armedDelayMs: number
  signalElapsedMs: number
  releasedIds: number[]
  result?: GameResult
}

export type ReactionGame = {
  getSnapshot(): ReactionSnapshot
  addFinger(id: number): void
  removeFinger(id: number): void
  tick(deltaMs: number): void
}

const DEFAULT_ARMED_MIN_MS = 3000
const DEFAULT_ARMED_MAX_MS = 10000

export function createReactionGame(opts: {
  playerCount: number
  random?: RandomSource
  armedMinMs?: number
  armedMaxMs?: number
}): ReactionGame {
  if (opts.playerCount < 2 || opts.playerCount > 5) {
    throw new Error(`playerCount must be 2-5, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const armedMinMs = opts.armedMinMs ?? DEFAULT_ARMED_MIN_MS
  const armedMaxMs = opts.armedMaxMs ?? DEFAULT_ARMED_MAX_MS

  let state: ReactionState = 'collecting'
  const fingerIds: number[] = []
  const releasedIds: number[] = []
  let armedElapsedMs = 0
  let armedDelayMs = 0
  let signalElapsedMs = 0
  let result: GameResult | undefined

  function enterArmed(): void {
    state = 'armed'
    armedElapsedMs = 0
    armedDelayMs = randomInt(random, armedMinMs, armedMaxMs + 1)
  }

  function indexOf(id: number): number {
    return fingerIds.indexOf(id)
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        fingerIds: [...fingerIds],
        armedElapsedMs,
        armedDelayMs,
        signalElapsedMs,
        releasedIds: [...releasedIds],
        result
      }
    },
    addFinger(id: number) {
      if (state !== 'collecting') return
      if (fingerIds.includes(id)) return
      if (fingerIds.length >= opts.playerCount) return
      fingerIds.push(id)
      if (fingerIds.length === opts.playerCount) enterArmed()
    },
    removeFinger(id: number) {
      if (state === 'collecting') {
        const idx = fingerIds.indexOf(id)
        if (idx !== -1) fingerIds.splice(idx, 1)
        return
      }
      if (state === 'armed') {
        const idx = indexOf(id)
        if (idx === -1) return
        state = 'resolved'
        result = { loser: idx }
        return
      }
      if (state === 'signal') {
        const idx = indexOf(id)
        if (idx === -1) return
        if (releasedIds.includes(id)) return
        releasedIds.push(id)
        if (releasedIds.length === fingerIds.length) {
          state = 'resolved'
          result = { loser: idx }
        }
      }
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state === 'armed') {
        armedElapsedMs += deltaMs
        if (armedElapsedMs >= armedDelayMs) {
          state = 'signal'
          signalElapsedMs = 0
        }
        return
      }
      if (state === 'signal') {
        signalElapsedMs += deltaMs
      }
    }
  }
}
