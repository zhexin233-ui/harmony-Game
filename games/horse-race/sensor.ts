import type { AccelData } from '@/native/sensor'
import type { HorseRaceGame, HorseRaceSnapshot } from './logic'

export type HorseRaceShakeRecord = {
  snapshot: HorseRaceSnapshot
  increased: boolean
}

const STANDARD_GRAVITY = 9.80665
const RAW_ACCEL_MAGNITUDE_THRESHOLD = 6

export function magnitudeFromAccel(data: AccelData): number {
  const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z)
  if (!Number.isFinite(magnitude)) return 0
  // 鸿蒙 SensorServiceKit 返回 m/s²，静止时约 9.8；uni 接口通常已是 g 量级。
  return magnitude >= RAW_ACCEL_MAGNITUDE_THRESHOLD
    ? magnitude / STANDARD_GRAVITY
    : magnitude
}

function countForCurrentPlayer(snapshot: HorseRaceSnapshot): number {
  return snapshot.shakeCounts[snapshot.currentPlayer] ?? 0
}

function recordMagnitude(
  game: HorseRaceGame,
  snapshot: HorseRaceSnapshot,
  magnitude: number
): HorseRaceShakeRecord {
  const previousCount = countForCurrentPlayer(snapshot)
  game.onSample(magnitude)
  const nextSnapshot = game.getSnapshot()
  return {
    snapshot: nextSnapshot,
    increased: countForCurrentPlayer(nextSnapshot) > previousCount
  }
}

export function recordHorseRaceSensorSample(
  game: HorseRaceGame,
  snapshot: HorseRaceSnapshot,
  data: AccelData
): HorseRaceShakeRecord {
  return recordMagnitude(game, snapshot, magnitudeFromAccel(data))
}

export function recordHorseRaceManualShake(
  game: HorseRaceGame,
  snapshot: HorseRaceSnapshot
): HorseRaceShakeRecord {
  const result = recordMagnitude(game, snapshot, snapshot.peakThreshold + 1)
  game.onSample(0)
  return {
    snapshot: game.getSnapshot(),
    increased: result.increased
  }
}
