export type AccelData = { x: number; y: number; z: number }
export type AccelListener = (data: AccelData) => void

let currentListener: AccelListener | null = null

export function startAccelerometer(listener: AccelListener, interval: 'game' | 'ui' | 'normal' = 'game'): void {
  currentListener = listener
  try {
    uni.startAccelerometer({ interval })
    uni.onAccelerometerChange(listener)
  } catch {}
}

export function stopAccelerometer(): void {
  try {
    if (currentListener) uni.offAccelerometerChange()
    uni.stopAccelerometer({ fail: () => {} })
  } catch {}
  currentListener = null
}
