export function keepAwake(): void {
  try { uni.setKeepScreenOn({ keepScreenOn: true, fail: () => {} }) } catch {}
}

export function releaseAwake(): void {
  try { uni.setKeepScreenOn({ keepScreenOn: false, fail: () => {} }) } catch {}
}
