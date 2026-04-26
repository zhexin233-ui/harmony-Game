import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'
import { isClickAllowed, isPointInHalf, type TouchPoint } from '@/native/multitouch'

export type TugMatchMode = 'single' | 'best-of-three'
export type TugWinCondition = 'timed' | 'threshold'
export type TugSide = 'red' | 'blue'
export type TugState = 'setup' | 'countdown' | 'playing' | 'roundResult' | 'matchResult'

export type TugRepresentative = {
  redPlayerIndex: number
  bluePlayerIndex: number
}

export type TugSnapshot = {
  state: TugState
  mode: TugMatchMode
  winCondition: TugWinCondition
  representative: TugRepresentative
  roundIndex: number
  redScore: number
  blueScore: number
  ropePosition: number
  redEffectiveClicks: number
  blueEffectiveClicks: number
  countdownRemainingMs: number
  roundElapsedMs: number
  roundDurationMs: number
  roundWinner?: TugSide
  matchWinner?: TugSide
  result?: GameResult
}

export type TugOfWarGame = {
  getSnapshot(): TugSnapshot
  rerollRepresentatives(): void
  setMode(mode: TugMatchMode): void
  setWinCondition(condition: TugWinCondition): void
  startRound(): void
  startNextRound(): void
  tap(side: TugSide, point: TouchPoint, screenWidth: number, nowMs: number): boolean
  tick(deltaMs: number): void
}

const COUNTDOWN_MS = 3000
const DEFAULT_ROUND_DURATION_MS = 10000
const DEFAULT_THRESHOLD = 0.85
const DEFAULT_CLICK_FORCE = 0.035
const DEFAULT_CLICK_MIN_INTERVAL_MS = 70

function opposite(side: TugSide): TugSide {
  return side === 'red' ? 'blue' : 'red'
}

function clampRope(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

export function createTugOfWarGame(opts: {
  playerCount: number
  random?: RandomSource
  roundDurationMs?: number
  threshold?: number
  clickForce?: number
  clickMinIntervalMs?: number
}): TugOfWarGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  const roundDurationMs = opts.roundDurationMs ?? DEFAULT_ROUND_DURATION_MS
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD
  const clickForce = opts.clickForce ?? DEFAULT_CLICK_FORCE
  const clickMinIntervalMs = opts.clickMinIntervalMs ?? DEFAULT_CLICK_MIN_INTERVAL_MS

  let state: TugState = 'setup'
  let mode: TugMatchMode = 'single'
  let winCondition: TugWinCondition = 'timed'
  let representative = pickRepresentatives()
  let roundIndex = 1
  let redScore = 0
  let blueScore = 0
  let ropePosition = 0
  let redEffectiveClicks = 0
  let blueEffectiveClicks = 0
  let countdownRemainingMs = COUNTDOWN_MS
  let roundElapsedMs = 0
  let roundWinner: TugSide | undefined
  let matchWinner: TugSide | undefined
  let result: GameResult | undefined
  let lastRedClickAtMs: number | undefined
  let lastBlueClickAtMs: number | undefined

  function pickRepresentatives(): TugRepresentative {
    const redPlayerIndex = randomInt(random, 0, opts.playerCount)
    let bluePlayerIndex = randomInt(random, 0, opts.playerCount - 1)
    if (bluePlayerIndex >= redPlayerIndex) bluePlayerIndex++
    return { redPlayerIndex, bluePlayerIndex }
  }

  function resetRoundRuntime(): void {
    ropePosition = 0
    redEffectiveClicks = 0
    blueEffectiveClicks = 0
    countdownRemainingMs = COUNTDOWN_MS
    roundElapsedMs = 0
    roundWinner = undefined
    lastRedClickAtMs = undefined
    lastBlueClickAtMs = undefined
  }

  function decideTieWinner(): TugSide {
    if (redEffectiveClicks > blueEffectiveClicks) return 'red'
    if (blueEffectiveClicks > redEffectiveClicks) return 'blue'
    return randomInt(random, 0, 2) === 0 ? 'red' : 'blue'
  }

  function decideTimedWinner(): TugSide {
    if (ropePosition < 0) return 'red'
    if (ropePosition > 0) return 'blue'
    return decideTieWinner()
  }

  function finishRound(winner: TugSide): void {
    roundWinner = winner
    if (winner === 'red') redScore++
    else blueScore++

    const targetScore = mode === 'best-of-three' ? 2 : 1
    if (redScore >= targetScore || blueScore >= targetScore) {
      matchWinner = winner
      const loserSide = opposite(winner)
      result = {
        loser: loserSide === 'red'
          ? representative.redPlayerIndex
          : representative.bluePlayerIndex
      }
      state = 'matchResult'
      return
    }

    state = 'roundResult'
  }

  return {
    getSnapshot() {
      return {
        state,
        mode,
        winCondition,
        representative: { ...representative },
        roundIndex,
        redScore,
        blueScore,
        ropePosition,
        redEffectiveClicks,
        blueEffectiveClicks,
        countdownRemainingMs,
        roundElapsedMs,
        roundDurationMs,
        roundWinner,
        matchWinner,
        result
      }
    },
    rerollRepresentatives() {
      if (state !== 'setup') return
      representative = pickRepresentatives()
    },
    setMode(nextMode: TugMatchMode) {
      if (state !== 'setup') return
      mode = nextMode
    },
    setWinCondition(condition: TugWinCondition) {
      if (state !== 'setup') return
      winCondition = condition
    },
    startRound() {
      if (state !== 'setup' && state !== 'roundResult') return
      resetRoundRuntime()
      state = 'countdown'
    },
    startNextRound() {
      if (state !== 'roundResult') return
      roundIndex++
      resetRoundRuntime()
      state = 'countdown'
    },
    tap(side: TugSide, point: TouchPoint, screenWidth: number, nowMs: number) {
      if (state !== 'playing') return false
      if (!isPointInHalf(point, screenWidth, side)) return false

      const lastClickAt = side === 'red' ? lastRedClickAtMs : lastBlueClickAtMs
      if (!isClickAllowed(lastClickAt, nowMs, clickMinIntervalMs)) return false

      if (side === 'red') {
        lastRedClickAtMs = nowMs
        redEffectiveClicks++
        ropePosition = clampRope(ropePosition - clickForce)
      } else {
        lastBlueClickAtMs = nowMs
        blueEffectiveClicks++
        ropePosition = clampRope(ropePosition + clickForce)
      }

      if (winCondition === 'threshold' && Math.abs(ropePosition) >= threshold) {
        finishRound(ropePosition < 0 ? 'red' : 'blue')
      }

      return true
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state === 'countdown') {
        countdownRemainingMs = Math.max(0, countdownRemainingMs - deltaMs)
        if (countdownRemainingMs === 0) state = 'playing'
        return
      }
      if (state !== 'playing') return
      roundElapsedMs += deltaMs
      if (winCondition === 'timed' && roundElapsedMs >= roundDurationMs) {
        roundElapsedMs = roundDurationMs
        finishRound(decideTimedWinner())
      }
    }
  }
}
