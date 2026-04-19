import { useSettings } from '@/stores/settings'

type AudioCtx = ReturnType<typeof uni.createInnerAudioContext>
const pool = new Map<string, AudioCtx>()

export function preload(map: Record<string, string>): void {
  for (const id in map) {
    const old = pool.get(id)
    if (old) { try { old.destroy() } catch {} }
    const ctx = uni.createInnerAudioContext()
    ctx.src = map[id]
    pool.set(id, ctx)
  }
}

export function play(id: string): void {
  if (!useSettings().soundEnabled) return
  const ctx = pool.get(id)
  if (!ctx) return
  try { ctx.stop(); ctx.play() } catch {}
}

export function disposeAll(): void {
  pool.forEach((ctx) => { try { ctx.destroy() } catch {} })
  pool.clear()
}
