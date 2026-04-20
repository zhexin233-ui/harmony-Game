import { describe, it, expect } from 'vitest'
import {
  GAME_GROUPS,
  canPlayGame,
  getDisabledReason,
  getGameRoute,
  getVisibleGameGroups,
  resolveGameCover
} from '@/ui/games'

describe('games ui logic', () => {
  it('保留运气派和实力派两组游戏', () => {
    expect(GAME_GROUPS.map((group) => group.title)).toEqual(['运气派', '实力派'])
    expect(GAME_GROUPS[0].games.map((game) => game.id)).toEqual(['bomb', 'crocodile', 'wheel'])
    expect(GAME_GROUPS[1].games.map((game) => game.id)).toEqual(['horse-race', 'reaction'])
  })

  it('分类过滤只影响当前页展示', () => {
    expect(getVisibleGameGroups('all').length).toBe(2)
    expect(getVisibleGameGroups('luck').map((group) => group.category)).toEqual(['luck'])
    expect(getVisibleGameGroups('skill').map((group) => group.category)).toEqual(['skill'])
  })

  it('根据人数判断是否可玩', () => {
    const wheel = GAME_GROUPS[0].games.find((game) => game.id === 'wheel')!
    expect(canPlayGame(wheel, 5)).toBe(true)
    expect(canPlayGame(wheel, 6)).toBe(false)
  })

  it('人数不匹配时返回明确中文限制文案', () => {
    const reaction = GAME_GROUPS[1].games.find((game) => game.id === 'reaction')!
    expect(getDisabledReason(reaction, 1)).toBe('至少 2 人')
    expect(getDisabledReason(reaction, 8)).toBe('最多 5 人')
    expect(getDisabledReason(reaction, 4)).toBeUndefined()
  })

  it('为每个游戏生成真实游戏页路由', () => {
    expect(getGameRoute('bomb')).toBe('/pages/game/bomb/index')
    expect(getGameRoute('horse-race')).toBe('/pages/game/horse-race/index')
  })

  it('优先使用本地图片封面', () => {
    const bomb = GAME_GROUPS[0].games.find((game) => game.id === 'bomb')!
    expect(resolveGameCover(bomb, new Set())).toEqual({
      mode: 'image',
      value: '/static/game-covers/game1.png'
    })
  })

  it('图片失败时降级为 emoji', () => {
    const bomb = GAME_GROUPS[0].games.find((game) => game.id === 'bomb')!
    expect(resolveGameCover(bomb, new Set(['bomb']))).toEqual({
      mode: 'emoji',
      value: '💣'
    })
  })
})
