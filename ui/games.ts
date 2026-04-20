import type { GameId } from '@/stores/session'

export type GameCategory = 'luck' | 'skill'
export type GameFilter = 'all' | GameCategory

export type GameMeta = {
  id: GameId
  name: string
  summary: string
  emoji: string
  min: number
  max: number
  category: GameCategory
  cover: string
}

export type GameGroup = {
  category: GameCategory
  title: string
  icon: string
  games: GameMeta[]
}

export type CoverDisplay =
  | { mode: 'image'; value: string }
  | { mode: 'emoji'; value: string }

export const GAME_GROUPS: GameGroup[] = [
  {
    category: 'luck',
    title: '运气派',
    icon: '🎲',
    games: [
      {
        id: 'bomb',
        name: '定时炸弹',
        summary: '倒计时传递，爆炸者受罚',
        emoji: '💣',
        min: 2,
        max: 8,
        category: 'luck',
        cover: '/static/game-covers/game1.png'
      },
      {
        id: 'crocodile',
        name: '鳄鱼拔牙',
        summary: '试试手气，别被咬到',
        emoji: '🐊',
        min: 2,
        max: 8,
        category: 'luck',
        cover: '/static/game-covers/game2.png'
      },
      {
        id: 'wheel',
        name: '指尖大轮盘',
        summary: '手指上阵，轮盘决定输赢',
        emoji: '🎯',
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
    icon: '⚡',
    games: [
      {
        id: 'horse-race',
        name: '摇一摇赛马',
        summary: '比拼手速和节奏',
        emoji: '🐎',
        min: 2,
        max: 8,
        category: 'skill',
        cover: '/static/game-covers/game4.png'
      },
      {
        id: 'reaction',
        name: '同屏反应大比拼',
        summary: '看谁最快点中目标',
        emoji: '👆',
        min: 2,
        max: 5,
        category: 'skill',
        cover: '/static/game-covers/game5.png'
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
    return { mode: 'emoji', value: game.emoji }
  }
  return { mode: 'image', value: game.cover }
}
