declare module '@/uni_modules/hw-accelerometer' {
  export type HarmonyAccelData = { x: number; y: number; z: number }
  export type HarmonyAccelInterval = 'game' | 'ui' | 'normal'
  export type HarmonyAccelListener = (data: HarmonyAccelData) => void

  export function startHarmonyAccelerometer(
    listener: HarmonyAccelListener,
    interval?: HarmonyAccelInterval
  ): boolean

  export function stopHarmonyAccelerometer(): void
}
