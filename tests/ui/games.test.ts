import { describe, it, expect } from 'vitest'
import {
  GAME_GROUPS,
  canPlayGame,
  getDisabledReason,
  getGameCardLayoutStyle,
  getGameRoute,
  getVisibleGameGroups,
  getGameCoverImageStyle,
  getGameCoverPresentation,
  resolveGameCover
} from '@/ui/games'

describe('games ui logic', () => {
  it('保留运气派和实力派两组游戏', () => {
    expect(GAME_GROUPS.map((group) => group.title)).toEqual(['运气派', '实力派'])
    expect(GAME_GROUPS.map((group) => group.iconKey)).toEqual(['group-luck', 'group-skill'])
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

    const crocodile = GAME_GROUPS[0].games.find((game) => game.id === 'crocodile')!
    expect(canPlayGame(crocodile, 16)).toBe(true)
    expect(canPlayGame(crocodile, 17)).toBe(false)
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
      value: '/static/game-covers/game5.png'
    })
  })

  it('按指定关系对调游戏封面图', () => {
    const allGames = GAME_GROUPS.flatMap((group) => group.games)
    expect(allGames.find((game) => game.id === 'bomb')?.cover).toBe('/static/game-covers/game5.png')
    expect(allGames.find((game) => game.id === 'reaction')?.cover).toBe('/static/game-covers/game1.png')
    expect(allGames.find((game) => game.id === 'crocodile')?.cover).toBe('/static/game-covers/game4.png')
    expect(allGames.find((game) => game.id === 'horse-race')?.cover).toBe('/static/game-covers/game2.png')
  })

  it('图片失败时降级为 svg 图标', () => {
    const bomb = GAME_GROUPS[0].games.find((game) => game.id === 'bomb')!
    expect(resolveGameCover(bomb, new Set(['bomb']))).toEqual({
      mode: 'icon',
      value: 'game-bomb'
    })
  })

  it('大厅卡片按窗口宽度计算正方形封面', () => {
    expect(getGameCardLayoutStyle({
      windowWidth: 390,
      safeAreaLeft: 0,
      safeAreaRight: 0
    })).toEqual({
      cardWidth: '173px',
      coverSize: '173px'
    })
  })

  it('刘海屏横向安全区会压缩卡片宽度', () => {
    expect(getGameCardLayoutStyle({
      windowWidth: 430,
      safeAreaLeft: 6,
      safeAreaRight: 6
    })).toEqual({
      cardWidth: '187px',
      coverSize: '187px'
    })
  })

  it('图片封面铺满容器且留边背景保持白色', () => {
    expect(getGameCoverPresentation('image')).toEqual({
      backgroundColor: '#ffffff',
      imageMode: 'aspectFill'
    })
  })

  it('图标兜底封面继续使用主题背景和等比适配', () => {
    expect(getGameCoverPresentation('icon')).toEqual({
      backgroundColor: '',
      imageMode: 'aspectFit'
    })
  })

  it('图片封面略放大以减少素材自身留白', () => {
    expect(getGameCoverImageStyle('image')).toEqual({
      width: '116%',
      height: '116%'
    })
  })
})
