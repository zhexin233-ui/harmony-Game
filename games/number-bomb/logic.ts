import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'

export type NumberBombState = 'setup' | 'guessing' | 'exploded'
export type NumberBombPreset = '1-100' | '1-999'

export type NumberBombGuess = {
  playerIndex: number
  value: number
  rangeBefore: { min: number; max: number }
}

export type NumberBombSnapshot = {
  state: NumberBombState
  playerCount: number
  preset: NumberBombPreset
  displayMin: number
  displayMax: number
  exclusiveMin: number
  exclusiveMax: number
  currentPlayerIndex: number
  guesses: NumberBombGuess[]
  inputError?: string
  result?: GameResult
}

export type NumberBombGame = {
  getSnapshot(): NumberBombSnapshot
  setPreset(preset: NumberBombPreset): void
  start(): void
  submitGuess(value: number): void
}

function defaultPresetFor(playerCount: number): NumberBombPreset {
  return playerCount >= 6 ? '1-999' : '1-100'
}

function rangeOf(preset: NumberBombPreset): { min: number; max: number } {
  return preset === '1-999' ? { min: 1, max: 999 } : { min: 1, max: 100 }
}

function cloneGuess(guess: NumberBombGuess): NumberBombGuess {
  return {
    playerIndex: guess.playerIndex,
    value: guess.value,
    rangeBefore: { min: guess.rangeBefore.min, max: guess.rangeBefore.max }
  }
}

export function createNumberBombGame(opts: {
  playerCount: number
  random?: RandomSource
  preset?: NumberBombPreset
  bombNumber?: number
}): NumberBombGame {
  if (opts.playerCount < 2 || opts.playerCount > 8) {
    throw new Error(`playerCount must be 2-8, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  let state: NumberBombState = 'setup'
  let preset = opts.preset ?? defaultPresetFor(opts.playerCount)
  let displayMin = 1
  let displayMax = 100
  let exclusiveMin = 0
  let exclusiveMax = 101
  let bombNumber = 1
  let currentPlayerIndex = 0
  let guesses: NumberBombGuess[] = []
  let inputError: string | undefined
  let result: GameResult | undefined

  function resetRange(nextPreset: NumberBombPreset): void {
    preset = nextPreset
    const range = rangeOf(preset)
    displayMin = range.min
    displayMax = range.max
    exclusiveMin = range.min - 1
    exclusiveMax = range.max + 1
    bombNumber = opts.bombNumber ?? randomInt(random, range.min, range.max + 1)
    currentPlayerIndex = 0
    guesses = []
    inputError = undefined
    result = undefined
  }

  resetRange(preset)

  function reject(message: string): void {
    inputError = message
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        preset,
        displayMin,
        displayMax,
        exclusiveMin,
        exclusiveMax,
        currentPlayerIndex,
        guesses: guesses.map(cloneGuess),
        inputError,
        result
      }
    },
    setPreset(nextPreset: NumberBombPreset) {
      if (state !== 'setup') return
      resetRange(nextPreset)
    },
    start() {
      if (state === 'setup') state = 'guessing'
    },
    submitGuess(value: number) {
      if (state !== 'guessing') return
      if (!Number.isInteger(value)) {
        reject('请输入整数')
        return
      }
      if (value < displayMin || value > displayMax) {
        reject(`请输入 ${displayMin} 到 ${displayMax} 之间的数字`)
        return
      }
      if (value <= exclusiveMin || value >= exclusiveMax) {
        reject('这个数字已经被排除，请输入范围内的新数字')
        return
      }

      const rangeBefore = { min: displayMin, max: displayMax }
      guesses.push({ playerIndex: currentPlayerIndex, value, rangeBefore })
      inputError = undefined

      if (value === bombNumber) {
        state = 'exploded'
        result = { loser: currentPlayerIndex }
        return
      }

      if (value < bombNumber) {
        displayMin = value
        exclusiveMin = value
      } else {
        displayMax = value
        exclusiveMax = value
      }
      currentPlayerIndex = (currentPlayerIndex + 1) % opts.playerCount
    }
  }
}
