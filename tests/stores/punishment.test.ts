import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePunishment, type PunishmentRule } from '@/stores/punishment'

describe('usePunishment - load & merge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('首次启动：无存储时加载全部 25 条内置并默认 enabled=true', () => {
    const p = usePunishment()
    p.load()
    expect(p.rules.length).toBe(25)
    expect(p.rules.every(r => r.builtIn === true)).toBe(true)
    expect(p.rules.every(r => r.enabled === true)).toBe(true)
  })

  it('二次启动：保留用户的 enabled 状态', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return {
          rules: [{ id: 'builtin-01', text: '学三声狗叫', builtIn: true, enabled: false }],
          deletedBuiltinIds: []
        }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    const b01 = p.rules.find(r => r.id === 'builtin-01')!
    expect(b01.enabled).toBe(false)
  })

  it('墓碑：用户删除的内置条目升级后不重新出现', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return { rules: [], deletedBuiltinIds: ['builtin-05'] }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    expect(p.rules.find(r => r.id === 'builtin-05')).toBeUndefined()
    expect(p.rules.length).toBe(24)
  })

  it('自定义条目：按用户新增顺序追加在内置之后', () => {
    const custom1: PunishmentRule = { id: 'custom-a', text: '自定义1', builtIn: false, enabled: true }
    const custom2: PunishmentRule = { id: 'custom-b', text: '自定义2', builtIn: false, enabled: false }
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return { rules: [custom1, custom2], deletedBuiltinIds: [] }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    expect(p.rules.length).toBe(27)
    expect(p.rules[25]).toEqual(custom1)
    expect(p.rules[26]).toEqual(custom2)
  })

  it('文案修正：内置 text 以 builtin 源文件为准（忽略旧存储）', () => {
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') {
        return {
          rules: [{ id: 'builtin-01', text: '旧文案', builtIn: true, enabled: true }],
          deletedBuiltinIds: []
        }
      }
      return ''
    }
    const p = usePunishment()
    p.load()
    const b01 = p.rules.find(r => r.id === 'builtin-01')!
    expect(b01.text).toBe('学三声狗叫')
  })
})

describe('usePunishment - pick', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
  })

  it('启用池为空时返回 null', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    expect(p.pick()).toBeNull()
  })

  it('启用池只有一条时必定返回该条', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    p.rules[3].enabled = true
    const picked = p.pick()
    expect(picked).not.toBeNull()
    expect(picked!.id).toBe(p.rules[3].id)
  })

  it('多条启用时返回的结果在启用池中', () => {
    const p = usePunishment()
    p.load()
    for (let i = 0; i < 100; i++) {
      const picked = p.pick()
      expect(picked).not.toBeNull()
      expect(picked!.enabled).toBe(true)
    }
  })

  it('禁用 / 启用变化会立刻反映到抽取池', () => {
    const p = usePunishment()
    p.load()
    p.rules.forEach(r => (r.enabled = false))
    const target = p.rules.find(r => r.id === 'builtin-07')!
    target.enabled = true
    for (let i = 0; i < 20; i++) {
      expect(p.pick()!.id).toBe('builtin-07')
    }
  })
})

describe('usePunishment - CRUD', () => {
  let written: Record<string, unknown>
  beforeEach(() => {
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (_k: string) => ''
    written = {}
    ;(uni.setStorageSync as any) = (k: string, v: unknown) => {
      written[k] = v
    }
  })

  it('addRule：追加自定义条目并持久化', () => {
    const p = usePunishment()
    p.load()
    const before = p.rules.length
    const newId = p.addRule('唱国歌')
    expect(p.rules.length).toBe(before + 1)
    const added = p.rules.find(r => r.id === newId)!
    expect(added.text).toBe('唱国歌')
    expect(added.builtIn).toBe(false)
    expect(added.enabled).toBe(true)
    expect((written['punishments'] as any).rules.find((r: any) => r.id === newId)).toBeTruthy()
  })

  it('updateRule：修改 text 并持久化（内置与自定义都允许）', () => {
    const p = usePunishment()
    p.load()
    p.updateRule('builtin-01', '改后文案')
    expect(p.rules.find(r => r.id === 'builtin-01')!.text).toBe('改后文案')
    expect((written['punishments'] as any).rules.find((r: any) => r.id === 'builtin-01').text).toBe('改后文案')
  })

  it('toggleRule：切换 enabled 并持久化', () => {
    const p = usePunishment()
    p.load()
    p.toggleRule('builtin-02')
    expect(p.rules.find(r => r.id === 'builtin-02')!.enabled).toBe(false)
    p.toggleRule('builtin-02')
    expect(p.rules.find(r => r.id === 'builtin-02')!.enabled).toBe(true)
  })

  it('removeRule 自定义：直接从 rules 中移除', () => {
    const p = usePunishment()
    p.load()
    const id = p.addRule('自定义临时')
    const before = p.rules.length
    p.removeRule(id)
    expect(p.rules.length).toBe(before - 1)
    expect(p.rules.find(r => r.id === id)).toBeUndefined()
    expect((written['punishments'] as any).deletedBuiltinIds).toEqual([])
  })

  it('removeRule 内置：移除并加入墓碑，升级后不重新出现', () => {
    const p = usePunishment()
    p.load()
    p.removeRule('builtin-10')
    expect(p.rules.find(r => r.id === 'builtin-10')).toBeUndefined()
    expect(p.deletedBuiltinIds).toContain('builtin-10')
    expect((written['punishments'] as any).deletedBuiltinIds).toContain('builtin-10')

    // 模拟"下次冷启动"：新 pinia，从 storage 重新 load
    const snapshot = written['punishments']
    setActivePinia(createPinia())
    ;(uni.getStorageSync as any) = (k: string) => {
      if (k === 'punishments') return snapshot
      return ''
    }
    const p2 = usePunishment()
    p2.load()
    expect(p2.rules.find(r => r.id === 'builtin-10')).toBeUndefined()
  })

  it('updateRule 找不到 id：静默 no-op（不抛错）', () => {
    const p = usePunishment()
    p.load()
    expect(() => p.updateRule('nope', 'xxx')).not.toThrow()
  })

  it('addRule：空白文本不入库（trim 后为空）', () => {
    const p = usePunishment()
    p.load()
    const before = p.rules.length
    const id = p.addRule('   ')
    expect(id).toBe('')
    expect(p.rules.length).toBe(before)
  })
})
