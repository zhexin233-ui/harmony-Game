import { describe, it, expect } from 'vitest'
import { diffTouches } from '@/native/multitouch'

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
