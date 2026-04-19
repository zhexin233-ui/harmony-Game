import { describe, it, expect } from 'vitest'
import { defaultRandom, seededRandom, randomInt } from '@/games/random'

describe('defaultRandom', () => {
  it('返回 [0, 1) 区间', () => {
    for (let i = 0; i < 100; i++) {
      const v = defaultRandom()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seededRandom', () => {
  it('相同种子产生相同序列', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b())
    }
  })

  it('返回 [0, 1) 区间', () => {
    const r = seededRandom(7)
    for (let i = 0; i < 200; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('不同种子差异化序列', () => {
    const a = seededRandom(1)
    const b = seededRandom(2)
    const seqA = Array.from({ length: 5 }, () => a())
    const seqB = Array.from({ length: 5 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })
})

describe('randomInt', () => {
  it('random 返回 0 时取 min', () => {
    expect(randomInt(() => 0, 5, 15)).toBe(5)
  })

  it('random 返回接近 1 时取 max-1（上界开区间）', () => {
    expect(randomInt(() => 0.9999, 5, 15)).toBe(14)
  })

  it('任何随机值都落在 [min, max)', () => {
    const r = seededRandom(123)
    for (let i = 0; i < 200; i++) {
      const v = randomInt(r, 10, 20)
      expect(v).toBeGreaterThanOrEqual(10)
      expect(v).toBeLessThan(20)
    }
  })
})
