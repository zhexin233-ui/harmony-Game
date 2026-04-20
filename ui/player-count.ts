export const PLAYER_COUNT_MIN = 2
export const PLAYER_COUNT_MAX = 8
export const DEFAULT_PLAYER_COUNT = 4

export function isValidPlayerCount(count: number | undefined): boolean {
  return typeof count === 'number' && count >= PLAYER_COUNT_MIN && count <= PLAYER_COUNT_MAX
}

export function getInitialPlayerCount(sessionCount: number | undefined): number {
  if (isValidPlayerCount(sessionCount)) return sessionCount as number
  return DEFAULT_PLAYER_COUNT
}

export function changePlayerCount(current: number, delta: -1 | 1): number {
  const next = current + delta
  if (next < PLAYER_COUNT_MIN) return PLAYER_COUNT_MIN
  if (next > PLAYER_COUNT_MAX) return PLAYER_COUNT_MAX
  return next
}

export function buildPlayerNamesUrl(count: number): string {
  return `/pages/lobby/player-names?count=${count}`
}

export function getSkipNamesUrl(): string {
  return '/pages/lobby/games'
}
