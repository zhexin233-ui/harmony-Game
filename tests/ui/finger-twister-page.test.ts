import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pageSource = () => readFileSync(resolve(process.cwd(), 'pages/game/finger-twister/index.uvue'), 'utf8')

function styleBlock(source: string, className: string): string {
  const match = source.match(new RegExp(`\\.${className}\\s*\\{([\\s\\S]*?)\\}`))
  return match?.[1] ?? ''
}

describe('finger twister page', () => {
  it('目标圆点使用全屏绝对定位层，避免视觉坐标和触摸坐标错位', () => {
    const source = pageSource()
    const targetLayerIndex = source.indexOf('class="target-layer"')
    const targetCircleIndex = source.indexOf('class="target-circle"')
    const targetLayerStyle = styleBlock(source, 'target-layer')
    const taskLayerStart = source.indexOf('class="task-layer"')
    const taskLayerEnd = source.indexOf('</view>', taskLayerStart)
    const taskLayerTemplate = source.slice(taskLayerStart, taskLayerEnd)

    expect(targetLayerIndex).toBeGreaterThanOrEqual(0)
    expect(targetCircleIndex).toBeGreaterThan(targetLayerIndex)
    expect(taskLayerTemplate).not.toContain('class="target-circle"')
    expect(targetLayerStyle).toContain('position: absolute')
    expect(targetLayerStyle).toContain('left: 0')
    expect(targetLayerStyle).toContain('top: 0')
    expect(targetLayerStyle).toContain('right: 0')
    expect(targetLayerStyle).toContain('bottom: 0')
    expect(targetLayerStyle).toContain('pointer-events: none')
  })
})
