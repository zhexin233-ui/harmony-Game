export type TouchPoint = { id: number; x: number; y: number }
export type TouchHalf = 'red' | 'blue'

export type CircleHitArea = {
  x: number
  y: number
  radius: number
}

export type TouchLike = {
  identifier?: number
  id?: number
  clientX?: number
  clientY?: number
  pageX?: number
  pageY?: number
  x?: number
  y?: number
}

export function diffTouches(
  prev: TouchPoint[],
  next: TouchPoint[]
): { added: TouchPoint[]; removed: TouchPoint[] } {
  const prevIds = new Set(prev.map((t) => t.id))
  const nextIds = new Set(next.map((t) => t.id))
  return {
    added: next.filter((t) => !prevIds.has(t.id)),
    removed: prev.filter((t) => !nextIds.has(t.id))
  }
}

function finiteNumber(value: number | undefined): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

export function normalizeTouchPoint(touch: TouchLike): TouchPoint | undefined {
  const id = finiteNumber(touch.identifier ?? touch.id)
  const x = finiteNumber(touch.clientX ?? touch.pageX ?? touch.x)
  const y = finiteNumber(touch.clientY ?? touch.pageY ?? touch.y)
  if (id === undefined || x === undefined || y === undefined) return undefined
  return { id, x, y }
}

export function isPointInHalf(point: TouchPoint, width: number, half: TouchHalf): boolean {
  if (width <= 0) return false
  const centerX = width / 2
  if (half === 'red') return point.x < centerX
  return point.x > centerX
}

export function isPointInCircle(point: TouchPoint, circle: CircleHitArea): boolean {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  return dx * dx + dy * dy <= circle.radius * circle.radius
}

export function isClickAllowed(
  lastClickAtMs: number | undefined,
  nowMs: number,
  minIntervalMs: number
): boolean {
  if (!Number.isFinite(nowMs)) return false
  if (lastClickAtMs === undefined) return true
  return nowMs - lastClickAtMs >= minIntervalMs
}
