export type TouchPoint = { id: number; x: number; y: number }

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
