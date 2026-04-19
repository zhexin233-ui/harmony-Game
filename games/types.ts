// games/types.ts

// 返回 [0, 1) 之间的伪随机数
export type RandomSource = () => number

// 所有游戏的输出结果。loser 必填；winner 仅赛马有意义
export type GameResult = {
  loser: number
  winner?: number
}
