import { describe, it, expect } from 'vitest'
import {
  PLAYER_COUNT_MAX,
  PLAYER_COUNT_MIN,
  DEFAULT_PLAYER_COUNT,
  buildPlayerNamesUrl,
  changePlayerCount,
  getInitialPlayerCount,
  getSkipNamesUrl
} from '@/ui/player-count'

describe('player count logic', () => {
  it('固定人数范围为 2 到 8，默认 4 人', () => {
    expect(PLAYER_COUNT_MIN).toBe(2)
    expect(PLAYER_COUNT_MAX).toBe(8)
    expect(DEFAULT_PLAYER_COUNT).toBe(4)
  })

  it('优先使用会话中已有合法人数', () => {
    expect(getInitialPlayerCount(6)).toBe(6)
  })

  it('会话人数缺失或非法时使用默认值', () => {
    expect(getInitialPlayerCount(undefined)).toBe(4)
    expect(getInitialPlayerCount(0)).toBe(4)
    expect(getInitialPlayerCount(9)).toBe(4)
  })

  it('增减人数时严格夹在边界内', () => {
    expect(changePlayerCount(2, -1)).toBe(2)
    expect(changePlayerCount(4, 1)).toBe(5)
    expect(changePlayerCount(8, 1)).toBe(8)
  })

  it('生成进入名字输入页的真实 URL', () => {
    expect(buildPlayerNamesUrl(5)).toBe('/pages/lobby/player-names?count=5')
  })

  it('生成跳过名字的真实 URL', () => {
    expect(getSkipNamesUrl()).toBe('/pages/lobby/games')
  })
})
