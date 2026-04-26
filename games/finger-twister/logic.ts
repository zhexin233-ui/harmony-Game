import type { GameResult, RandomSource } from '../types'
import { defaultRandom, randomInt } from '../random'
import { isPointInCircle, type TouchPoint } from '@/native/multitouch'

export type FingerTwisterState = 'setup' | 'prompt' | 'holding' | 'failed'
export type FingerTwisterFailureReason = 'released' | 'timeout'

export type FingerTwisterCircle = {
  id: string
  color: string
  x: number
  y: number
  radius: number
}

export type FingerTwisterTask = {
  id: string
  playerIndex: number
  fingerNumber: number
  circle: FingerTwisterCircle
  timeLimitMs: number
  elapsedMs: number
}

export type FingerAssignment = {
  taskId: string
  playerIndex: number
  fingerNumber: number
  touchId: number
  circle: FingerTwisterCircle
}

export type FingerTwisterSnapshot = {
  state: FingerTwisterState
  playerCount: number
  currentTask?: FingerTwisterTask
  assignments: FingerAssignment[]
  maxTouches: number
  failure?: {
    playerIndex: number
    reason: FingerTwisterFailureReason
  }
  result?: GameResult
}

export type FingerTwisterGame = {
  getSnapshot(): FingerTwisterSnapshot
  start(): void
  promptNext(): void
  addTouch(touchId: number, point: TouchPoint): boolean
  releaseTouch(touchId: number): void
  tick(deltaMs: number): void
}

const COLORS = ['#26D6FF', '#76E06B', '#FF5DA2', '#FFD166', '#FF8A3D', '#B88CFF']
const DEFAULT_WIDTH = 360
const DEFAULT_HEIGHT = 640
const DEFAULT_RADIUS = 42
const DEFAULT_TIME_LIMIT_MS = 5000
const DEFAULT_MAX_TOUCHES = 6

function cloneCircle(circle: FingerTwisterCircle): FingerTwisterCircle {
  return { ...circle }
}

function cloneTask(task: FingerTwisterTask): FingerTwisterTask {
  return { ...task, circle: cloneCircle(task.circle) }
}

function cloneAssignment(item: FingerAssignment): FingerAssignment {
  return { ...item, circle: cloneCircle(item.circle) }
}

export function createFingerTwisterGame(opts: {
  playerCount: number
  random?: RandomSource
  width?: number
  height?: number
  circleRadius?: number
  taskTimeLimitMs?: number
  maxTouches?: number
}): FingerTwisterGame {
  if (opts.playerCount < 2 || opts.playerCount > 4) {
    throw new Error(`playerCount must be 2-4, got ${opts.playerCount}`)
  }

  const random = opts.random ?? defaultRandom
  const width = opts.width ?? DEFAULT_WIDTH
  const height = opts.height ?? DEFAULT_HEIGHT
  const radius = opts.circleRadius ?? DEFAULT_RADIUS
  const taskTimeLimitMs = opts.taskTimeLimitMs ?? DEFAULT_TIME_LIMIT_MS
  const maxTouches = Math.min(opts.maxTouches ?? DEFAULT_MAX_TOUCHES, DEFAULT_MAX_TOUCHES)
  const fingerCounts = Array.from({ length: opts.playerCount }, () => 0)

  let state: FingerTwisterState = 'setup'
  let currentTask: FingerTwisterTask | undefined
  let assignments: FingerAssignment[] = []
  let failure: FingerTwisterSnapshot['failure']
  let result: GameResult | undefined
  let taskSeq = 0

  function nextPlayerIndex(): number | undefined {
    for (let target = 1; target <= 2; target++) {
      const index = fingerCounts.findIndex((count) => count < target)
      if (index !== -1) return index
    }
    return undefined
  }

  function makeCircle(): FingerTwisterCircle {
    const margin = radius + 12
    const minX = margin
    const maxX = Math.max(minX, width - margin)
    const minY = margin + 72
    const maxY = Math.max(minY, height - margin)

    let x = minX
    let y = minY
    for (let attempt = 0; attempt < 12; attempt++) {
      x = randomInt(random, minX, maxX + 1)
      y = randomInt(random, minY, maxY + 1)
      const clear = assignments.every((item) => {
        const dx = item.circle.x - x
        const dy = item.circle.y - y
        return dx * dx + dy * dy >= (radius * 2 + 12) * (radius * 2 + 12)
      })
      if (clear) break
    }

    const id = `circle-${taskSeq}`
    return {
      id,
      color: COLORS[taskSeq % COLORS.length],
      x,
      y,
      radius
    }
  }

  function createTask(): void {
    if (assignments.length >= maxTouches) {
      currentTask = undefined
      state = 'holding'
      return
    }
    const playerIndex = nextPlayerIndex()
    if (playerIndex === undefined) {
      currentTask = undefined
      state = 'holding'
      return
    }
    taskSeq++
    currentTask = {
      id: `task-${taskSeq}`,
      playerIndex,
      fingerNumber: fingerCounts[playerIndex] + 1,
      circle: makeCircle(),
      timeLimitMs: taskTimeLimitMs,
      elapsedMs: 0
    }
    state = 'prompt'
  }

  function fail(playerIndex: number, reason: FingerTwisterFailureReason): void {
    failure = { playerIndex, reason }
    result = { loser: playerIndex }
    state = 'failed'
  }

  return {
    getSnapshot() {
      return {
        state,
        playerCount: opts.playerCount,
        currentTask: currentTask ? cloneTask(currentTask) : undefined,
        assignments: assignments.map(cloneAssignment),
        maxTouches,
        failure: failure ? { ...failure } : undefined,
        result
      }
    },
    start() {
      if (state !== 'setup') return
      createTask()
    },
    promptNext() {
      if (state !== 'holding') return
      createTask()
    },
    addTouch(touchId: number, point: TouchPoint) {
      if (state !== 'prompt' || currentTask === undefined) return false
      if (assignments.some((item) => item.touchId === touchId)) return false
      if (!isPointInCircle(point, currentTask.circle)) return false
      assignments.push({
        taskId: currentTask.id,
        playerIndex: currentTask.playerIndex,
        fingerNumber: currentTask.fingerNumber,
        touchId,
        circle: cloneCircle(currentTask.circle)
      })
      fingerCounts[currentTask.playerIndex]++
      currentTask = undefined
      state = 'holding'
      return true
    },
    releaseTouch(touchId: number) {
      if (state === 'failed') return
      const item = assignments.find((assignment) => assignment.touchId === touchId)
      if (item === undefined) return
      fail(item.playerIndex, 'released')
    },
    tick(deltaMs: number) {
      if (deltaMs < 0) return
      if (state !== 'prompt' || currentTask === undefined) return
      currentTask.elapsedMs += deltaMs
      if (currentTask.elapsedMs >= currentTask.timeLimitMs) {
        currentTask.elapsedMs = currentTask.timeLimitMs
        fail(currentTask.playerIndex, 'timeout')
      }
    }
  }
}
