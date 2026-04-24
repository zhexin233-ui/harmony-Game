import type { GameId } from '@/stores/session'
import type { IconKey } from '@/ui/icons'
import { normalizeWindowLayoutMetrics, type WindowLayoutMetrics } from '@/ui/window-layout'

export type GameCategory = 'luck' | 'skill'
export type GameFilter = 'all' | GameCategory

export type GameMeta = {
  id: GameId
  name: string
  summary: string
  fallbackIconKey: IconKey
  min: number
  max: number
  category: GameCategory
  cover: string
}

export type GameGroup = {
  category: GameCategory
  title: string
  iconKey: IconKey
  games: GameMeta[]
}

export type CoverDisplay =
  | { mode: 'image'; value: string }
  | { mode: 'icon'; value: IconKey }

export type GameCardLayoutStyle = {
  cardWidth: string
  coverSize: string
}

const GAME_GRID_HORIZONTAL_PADDING_PX = 16
const GAME_CARD_GAP_PX = 12
const GAME_GRID_COLUMNS = 2

export const GAME_GROUPS: GameGroup[] = [
  {
    category: 'luck',
    title: '运气派',
    iconKey: 'group-luck',
    games: [
      {
        id: 'bomb',
        name: '定时炸弹',
        summary: '倒计时传递，爆炸者受罚',
        fallbackIconKey: 'game-bomb',
        min: 2,
        max: 8,
        category: 'luck',
        cover: '/static/game-covers/game5.png'
      },
      {
        id: 'crocodile',
        name: '鳄鱼拔牙',
        summary: '试试手气，别被咬到',
        fallbackIconKey: 'game-crocodile',
        min: 2,
        max: 16,
        category: 'luck',
        cover: '/static/game-covers/game4.png'
      },
      {
        id: 'wheel',
        name: '指尖大轮盘',
        summary: '手指上阵，轮盘决定输赢',
        fallbackIconKey: 'game-wheel',
        min: 2,
        max: 5,
        category: 'luck',
        cover: '/static/game-covers/game3.png'
      }
    ]
  },
  {
    category: 'skill',
    title: '实力派',
    iconKey: 'group-skill',
    games: [
      {
        id: 'horse-race',
        name: '摇一摇赛马',
        summary: '比拼手速和节奏',
        fallbackIconKey: 'game-horse-race',
        min: 2,
        max: 8,
        category: 'skill',
        cover: '/static/game-covers/game2.png'
      },
      {
        id: 'reaction',
        name: '同屏反应大比拼',
        summary: '看谁最快点中目标',
        fallbackIconKey: 'game-reaction',
        min: 2,
        max: 5,
        category: 'skill',
        cover: '/static/game-covers/game1.png'
      }
    ]
  }
]

const GAME_ROUTES: Record<GameId, string> = {
  bomb: '/pages/game/bomb/index',
  crocodile: '/pages/game/crocodile/index',
  'horse-race': '/pages/game/horse-race/index',
  wheel: '/pages/game/wheel/index',
  reaction: '/pages/game/reaction/index'
}

export function getVisibleGameGroups(filter: GameFilter): GameGroup[] {
  if (filter === 'all') return GAME_GROUPS
  return GAME_GROUPS.filter((group) => group.category === filter)
}

export function canPlayGame(game: GameMeta, playerCount: number): boolean {
  return playerCount >= game.min && playerCount <= game.max
}

export function getDisabledReason(game: GameMeta, playerCount: number): string | undefined {
  if (canPlayGame(game, playerCount)) return undefined
  if (playerCount < game.min) return `至少 ${game.min} 人`
  if (playerCount > game.max) return `最多 ${game.max} 人`
  return undefined
}

export function getGameRoute(id: GameId): string {
  return GAME_ROUTES[id]
}

export function resolveGameCover(game: GameMeta, failedIds: Set<GameId>): CoverDisplay {
  if (failedIds.has(game.id) || game.cover.length === 0) {
    return { mode: 'icon', value: game.fallbackIconKey }
  }
  return { mode: 'image', value: game.cover }
}

export function getGameCardLayoutStyle(
  metrics?: Partial<WindowLayoutMetrics>
): GameCardLayoutStyle {
  const windowMetrics = normalizeWindowLayoutMetrics(metrics)
  const gridWidth =
    windowMetrics.windowWidth
    - windowMetrics.safeAreaLeft
    - windowMetrics.safeAreaRight
    - GAME_GRID_HORIZONTAL_PADDING_PX * 2
  const cardSide = Math.floor((gridWidth - GAME_CARD_GAP_PX) / GAME_GRID_COLUMNS)

  return {
    cardWidth: `${cardSide}px`,
    coverSize: `${cardSide}px`
  }
}
