import { useSettings } from '@/stores/settings'

function enabled(): boolean {
  return useSettings().vibrationEnabled
}

export function vibrateShort(): void {
  if (!enabled()) return
  try { uni.vibrateShort({ fail: () => {} }) } catch {}
}

export function vibrateLong(): void {
  if (!enabled()) return
  try { uni.vibrateLong({ fail: () => {} }) } catch {}
}
