import { describe, it, expect } from 'vitest'
import {
  diffTouches,
  normalizeTouchPoint,
  isPointInHalf,
  isPointInCircle,
  isClickAllowed
} from '@/native/multitouch'

describe('diffTouches', () => {
  it('新增触点返回 added', () => {
    const r = diffTouches(
      [{ id: 1, x: 0, y: 0 }],
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 10, y: 10 }]
    )
    expect(r.added).toEqual([{ id: 2, x: 10, y: 10 }])
    expect(r.removed).toEqual([])
  })

  it('减少触点返回 removed', () => {
    const r = diffTouches(
      [{ id: 1, x: 0, y: 0 }, { id: 2, x: 5, y: 5 }],
      [{ id: 1, x: 0, y: 0 }]
    )
    expect(r.removed.map((t) => t.id)).toEqual([2])
    expect(r.added).toEqual([])
  })

  it('完全相同返回空', () => {
    const t = [{ id: 1, x: 0, y: 0 }]
    const r = diffTouches(t, t)
    expect(r.added).toEqual([])
    expect(r.removed).toEqual([])
  })
})

describe('normalizeTouchPoint', () => {
  it('优先使用 identifier/clientX/clientY 归一化触点', () => {
    expect(normalizeTouchPoint({ identifier: 7, clientX: 12, clientY: 34 })).toEqual({
      id: 7,
      x: 12,
      y: 34
    })
  })

  it('缺少 identifier 时使用 id，缺少 client 坐标时使用 page 坐标', () => {
    expect(normalizeTouchPoint({ id: 3, pageX: 90, pageY: 120 })).toEqual({
      id: 3,
      x: 90,
      y: 120
    })
  })

  it('触点 id 或坐标不是有限数字时返回 undefined', () => {
    expect(normalizeTouchPoint({ clientX: 1, clientY: 2 })).toBeUndefined()
    expect(normalizeTouchPoint({ identifier: 1, clientX: Number.NaN, clientY: 2 })).toBeUndefined()
  })
})

describe('isPointInHalf', () => {
  it('红方只接收左半屏，蓝方只接收右半屏，中心线不归属任何一方', () => {
    expect(isPointInHalf({ id: 1, x: 49, y: 0 }, 100, 'red')).toBe(true)
    expect(isPointInHalf({ id: 1, x: 51, y: 0 }, 100, 'blue')).toBe(true)
    expect(isPointInHalf({ id: 1, x: 50, y: 0 }, 100, 'red')).toBe(false)
    expect(isPointInHalf({ id: 1, x: 50, y: 0 }, 100, 'blue')).toBe(false)
  })
})

describe('isPointInCircle', () => {
  it('圆内和圆边界命中，圆外不命中', () => {
    const circle = { x: 10, y: 10, radius: 5 }
    expect(isPointInCircle({ id: 1, x: 10, y: 10 }, circle)).toBe(true)
    expect(isPointInCircle({ id: 1, x: 15, y: 10 }, circle)).toBe(true)
    expect(isPointInCircle({ id: 1, x: 16, y: 10 }, circle)).toBe(false)
  })
})

describe('isClickAllowed', () => {
  it('首次点击允许，间隔不足拒绝，间隔足够允许', () => {
    expect(isClickAllowed(undefined, 100, 80)).toBe(true)
    expect(isClickAllowed(100, 150, 80)).toBe(false)
    expect(isClickAllowed(100, 180, 80)).toBe(true)
  })
})
