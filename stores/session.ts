import { defineStore } from 'pinia'

export type GameId = 'horse-race' | 'bomb' | 'crocodile' | 'reaction' | 'wheel'

// 惰性工厂：见 stores/settings.ts 注释
const _factory = () => defineStore('session', {
  state: () => ({
    playerCount: 0,
    playerNames: undefined as string[] | undefined,
    currentGame: undefined as GameId | undefined,
    loser: undefined as number | undefined,
    pickedPunishmentText: undefined as string | undefined
  }),
  actions: {
    setPlayers(count: number, names?: string[]) {
      this.playerCount = count
      this.playerNames = names
    },
    displayNameOf(index: number): string {
      if (this.playerNames && this.playerNames[index]) return this.playerNames[index]
      return `玩家 ${index + 1}`
    },
    restartGame() {
      this.loser = undefined
      this.pickedPunishmentText = undefined
    },
    exitToLobby() {
      this.currentGame = undefined
      this.loser = undefined
      this.pickedPunishmentText = undefined
    },
    clear() {
      this.playerCount = 0
      this.playerNames = undefined
      this.currentGame = undefined
      this.loser = undefined
      this.pickedPunishmentText = undefined
    }
  }
})

let _hook: ReturnType<typeof _factory> | null = null

export function useSession() {
  if (_hook == null) _hook = _factory()
  return _hook()
}
