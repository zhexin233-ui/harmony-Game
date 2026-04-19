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
