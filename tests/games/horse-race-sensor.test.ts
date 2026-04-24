import { describe, it, expect } from 'vitest'
import { createHorseRaceGame } from '@/games/horse-race/logic'
import {
  magnitudeFromAccel,
  recordHorseRaceManualShake,
  recordHorseRaceSensorSample
} from '@/games/horse-race/sensor'

describe('horse race sensor bridge', () => {
  it('把三轴加速度转换为峰值检测使用的模长', () => {
    expect(magnitudeFromAccel({ x: 1, y: 2, z: 2 })).toBe(3)
  })

  it('传感器样本进入当前玩家计数，并返回是否新增计数', () => {
    const game = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    game.startPlayer()

    const result = recordHorseRaceSensorSample(game, game.getSnapshot(), { x: 3, y: 0, z: 0 })

    expect(result.increased).toBe(true)
    expect(result.snapshot.shakeCounts[0]).toBe(1)
  })

  it('鸿蒙静止时约 9.8m/s² 的重力样本不会被误判为一次摇动', () => {
    const game = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    game.startPlayer()

    const result = recordHorseRaceSensorSample(game, game.getSnapshot(), { x: 0, y: 0, z: 9.80665 })

    expect(result.increased).toBe(false)
    expect(result.snapshot.shakeCounts[0]).toBe(0)
  })

  it('鸿蒙原始 m/s² 样本回到静止区间后，可以再次触发新的摇动计数', () => {
    const game = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    game.startPlayer()

    let result = recordHorseRaceSensorSample(game, game.getSnapshot(), { x: 0, y: 0, z: 9.80665 })
    result = recordHorseRaceSensorSample(game, result.snapshot, { x: 0, y: 0, z: 23 })
    result = recordHorseRaceSensorSample(game, result.snapshot, { x: 0, y: 0, z: 9.80665 })
    result = recordHorseRaceSensorSample(game, result.snapshot, { x: 0, y: 0, z: 24 })

    expect(result.snapshot.shakeCounts[0]).toBe(2)
  })

  it('传感器不可用时，点按兜底可连续为当前玩家计次', () => {
    const game = createHorseRaceGame({ playerCount: 2, peakThreshold: 2 })
    game.startPlayer()

    const first = recordHorseRaceManualShake(game, game.getSnapshot())
    const second = recordHorseRaceManualShake(game, first.snapshot)

    expect(first.increased).toBe(true)
    expect(second.increased).toBe(true)
    expect(second.snapshot.shakeCounts[0]).toBe(2)
  })
})
