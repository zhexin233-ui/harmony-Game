import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSession } from '@/stores/session'

describe('useSession', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('setPlayers 存储人数与名字', () => {
    const s = useSession()
    s.setPlayers(4, ['A', 'B', 'C', 'D'])
    expect(s.playerCount).toBe(4)
    expect(s.playerNames).toEqual(['A', 'B', 'C', 'D'])
  })

  it('setPlayers 不传名字时存 undefined', () => {
    const s = useSession()
    s.setPlayers(3)
    expect(s.playerCount).toBe(3)
    expect(s.playerNames).toBeUndefined()
  })

  it('displayNameOf 有名字时返回名字', () => {
    const s = useSession()
    s.setPlayers(3, ['小红', '小明', '小刚'])
    expect(s.displayNameOf(0)).toBe('小红')
  })

  it('displayNameOf 无名字时返回“玩家 N”', () => {
    const s = useSession()
    s.setPlayers(3)
    expect(s.displayNameOf(0)).toBe('玩家 1')
    expect(s.displayNameOf(2)).toBe('玩家 3')
  })

  it('restartGame 清空 loser / picked，保留人数与当前游戏', () => {
    const s = useSession()
    s.setPlayers(4)
    s.currentGame = 'bomb'
    s.loser = 2
    s.pickedPunishmentText = '学狗叫 3 声'
    s.restartGame()
    expect(s.playerCount).toBe(4)
    expect(s.currentGame).toBe('bomb')
    expect(s.loser).toBeUndefined()
    expect(s.pickedPunishmentText).toBeUndefined()
  })

  it('exitToLobby 清 currentGame 与 loser，保留玩家信息', () => {
    const s = useSession()
    s.setPlayers(4)
    s.currentGame = 'bomb'
    s.loser = 1
    s.exitToLobby()
    expect(s.playerCount).toBe(4)
    expect(s.currentGame).toBeUndefined()
    expect(s.loser).toBeUndefined()
  })

  it('clear 完全清空', () => {
    const s = useSession()
    s.setPlayers(4, ['A', 'B', 'C', 'D'])
    s.currentGame = 'wheel'
    s.clear()
    expect(s.playerCount).toBe(0)
    expect(s.playerNames).toBeUndefined()
    expect(s.currentGame).toBeUndefined()
  })
})
