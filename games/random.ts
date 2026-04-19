// games/random.ts
import type { RandomSource } from './types'

export const defaultRandom: RandomSource = () => Math.random()

// LCG（线性同余），仅用于测试。内部状态 0xFFFFFFFF 归一化到 [0, 1)
export function seededRandom(seed: number): RandomSource {
  let state = (seed >>> 0) || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    // state / 2^32 分母比 2^32 大，保证严格 < 1
    return state / 0x100000000
  }
}

export function randomInt(random: RandomSource, minInclusive: number, maxExclusive: number): number {
  if (maxExclusive <= minInclusive) return minInclusive
  return minInclusive + Math.floor(random() * (maxExclusive - minInclusive))
}
