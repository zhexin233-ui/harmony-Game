// games/wheel/logic.ts
import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type WheelState = 'collecting' | 'spinning' | 'selected'

export type FingerTouchPoint = {
  id: number
  x: number
  y: number
}

export type WheelSnapshot = {
  state: WheelState
  playerCount: number
  fingerIds: number[]
  fingerTouches: FingerTouchPoint[]
  spinElapsedMs: number
  spinDurationMs: number
  selectedFingerIndex?: number
  result?: GameResult
}

export type WheelGame = {
  getSnapshot(): WheelSnapshot
  addFinger(id: number, point?: { x: number; y: number }): void
  moveFinger(id: number, point: { x: number; y: number }): void
  removeFinger(id: number): void
  tick(deltaMs: number): void
}

const DEFAULT_SPIN_MIN_MS = 2000
const DEFAULT_SPIN_MAX_MS = 3000

export function createWheelGame(opts: {
  playerCount: number
  random?: RandomSource
  spinMinMs?: number
  spinMaxMs?: number
}): WheelGame {
  if (opts.playerCount < 2 || opts.playerCount > 5) {
    throw new Error(`playerCount must be 2-5, got ${opts.playerCount}`)
  }
  const random = opts.random ?? defaultRandom
  const spinMinMs = opts.spinMinMs ?? DEFAULT_SPIN_MIN_MS
  const spinMaxMs = opts.spinMaxMs ?? DEFAULT_SPIN_MAX_MS

  let state: WheelState = 'collecting'
  const fingerIds: number[] = []
  const fingerTouches = new Map<number, { x: number; y: number }>()
  let spinElapsedMs = 0
  let spinDurationMs = 0
  let selectedFingerIndex: number | undefined
  let result: GameResult | undefined

  function copyFingerTouches(): FingerTouchPoint[] {
    return fingerIds.map((id) => {
      const point = fingerTouches.get(id) ?? { x: 0, y: 0 }
      return { id, x: point.x, y: point.y }
    })
  }

  function beginSpin(): void {
    state = 'spinning'
    spinElapsedMs = 0
    spinDurationMs = randomInt(random, spinMinMs, spinMaxMs + 1)
    selectedFingerIndex = randomInt(random, 0, fingerIds.length)
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        fingerIds: [...fingerIds],
        fingerTouches: copyFingerTouches(),
        spinElapsedMs,
        spinDurationMs,
        selectedFingerIndex,
        result
      }
    },
    addFinger(id: number, point?: { x: number; y: number }) {
      if (state !== 'collecting') return
      if (fingerIds.includes(id)) return
      if (fingerIds.length >= opts.playerCount) return
      fingerIds.push(id)
      fingerTouches.set(id, { x: point?.x ?? 0, y: point?.y ?? 0 })
      if (fingerIds.length === opts.playerCount) beginSpin()
    },
    moveFinger(id: number, point: { x: number; y: number }) {
      if (state !== 'collecting') return
      if (!fingerIds.includes(id)) return
      fingerTouches.set(id, { x: point.x, y: point.y })
    },
    removeFinger(id: number) {
      if (state !== 'collecting') return
      const idx = fingerIds.indexOf(id)
      if (idx !== -1) {
        fingerIds.splice(idx, 1)
        fingerTouches.delete(id)
      }
    },
    tick(deltaMs: number) {
      if (state !== 'spinning') return
      if (deltaMs < 0) return
      spinElapsedMs += deltaMs
      if (spinElapsedMs >= spinDurationMs) {
        state = 'selected'
        result = { loser: selectedFingerIndex! }
      }
    }
  }
}
