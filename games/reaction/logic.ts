// games/reaction/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type ReactionState = 'collecting' | 'armed' | 'signal' | 'resolved'

export type FingerTouchPoint = {
  id: number
  x: number
  y: number
}

export type ReactionSnapshot = {
  state: ReactionState
  playerCount: number
  fingerIds: number[]
  fingerTouches: FingerTouchPoint[]
  armedElapsedMs: number
  armedDelayMs: number
  signalElapsedMs: number
  releasedIds: number[]
  result?: GameResult
}

export type ReactionGame = {
  getSnapshot(): ReactionSnapshot
  addFinger(id: number, point?: { x: number; y: number }): void
  moveFinger(id: number, point: { x: number; y: number }): void
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
  const fingerTouches = new Map<number, { x: number; y: number }>()
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

  function copyFingerTouches(): FingerTouchPoint[] {
    return fingerIds.map((id) => {
      const point = fingerTouches.get(id) ?? { x: 0, y: 0 }
      return { id, x: point.x, y: point.y }
    })
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        fingerIds: [...fingerIds],
        fingerTouches: copyFingerTouches(),
        armedElapsedMs,
        armedDelayMs,
        signalElapsedMs,
        releasedIds: [...releasedIds],
        result
      }
    },
    addFinger(id: number, point?: { x: number; y: number }) {
      if (state !== 'collecting') return
      if (fingerIds.includes(id)) return
      if (fingerIds.length >= opts.playerCount) return
      fingerIds.push(id)
      fingerTouches.set(id, { x: point?.x ?? 0, y: point?.y ?? 0 })
      if (fingerIds.length === opts.playerCount) enterArmed()
    },
    moveFinger(id: number, point: { x: number; y: number }) {
      if (state === 'resolved') return
      if (!fingerIds.includes(id)) return
      fingerTouches.set(id, { x: point.x, y: point.y })
    },
    removeFinger(id: number) {
      if (state === 'collecting') {
        const idx = fingerIds.indexOf(id)
        if (idx !== -1) {
          fingerIds.splice(idx, 1)
          fingerTouches.delete(id)
        }
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
