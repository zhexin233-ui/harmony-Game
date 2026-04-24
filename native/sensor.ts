export type AccelData = { x: number; y: number; z: number }
export type AccelListener = (data: AccelData) => void
export type AccelInterval = 'game' | 'ui' | 'normal'

// #ifdef APP-HARMONY
import { startHarmonyAccelerometer, stopHarmonyAccelerometer } from '@/uni_modules/hw-accelerometer'
// #endif

let currentListener: AccelListener | null = null

export function startAccelerometer(listener: AccelListener, interval: AccelInterval = 'game'): boolean {
  currentListener = listener
  // #ifdef APP-HARMONY
  const harmonyStarted = startHarmonyAccelerometer(listener, interval)
  if (!harmonyStarted) currentListener = null
  return harmonyStarted
  // #endif
  // #ifndef APP-HARMONY
  try {
    uni.startAccelerometer({ interval, fail: () => { currentListener = null } })
    uni.onAccelerometerChange(listener)
    return true
  } catch {
    currentListener = null
    return false
  }
  // #endif
}

export function stopAccelerometer(): void {
  // #ifdef APP-HARMONY
  stopHarmonyAccelerometer()
  currentListener = null
  return
  // #endif
  // #ifndef APP-HARMONY
  try {
    if (currentListener) uni.offAccelerometerChange()
    uni.stopAccelerometer({ fail: () => {} })
  } catch {}
  currentListener = null
  // #endif
}
