import { defineStore } from 'pinia'
import { BUILTIN_PUNISHMENTS } from '@/data/builtin-punishments'
import { generateCustomId } from '@/utils/id'

export type PunishmentRule = {
  id: string
  text: string
  builtIn: boolean
  enabled: boolean
}

type StoredPunishments = {
  rules: PunishmentRule[]
  deletedBuiltinIds: string[]
}

const BUILTIN: PunishmentRule[] = BUILTIN_PUNISHMENTS as PunishmentRule[]

function merge(stored: StoredPunishments): PunishmentRule[] {
  const result: PunishmentRule[] = []
  const storedById = new Map<string, PunishmentRule>()
  for (const r of stored.rules) storedById.set(r.id, r)
  const tombstones = new Set(stored.deletedBuiltinIds)

  for (const b of BUILTIN) {
    if (tombstones.has(b.id)) continue
    const prev = storedById.get(b.id)
    if (prev) {
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: prev.enabled })
    } else {
      result.push({ id: b.id, text: b.text, builtIn: true, enabled: true })
    }
  }
  for (const r of stored.rules) {
    if (!r.builtIn) result.push(r)
  }
  return result
}

export const usePunishment = defineStore('punishment', {
  state: () => ({
    rules: [] as PunishmentRule[],
    deletedBuiltinIds: [] as string[]
  }),
  actions: {
    load() {
      const raw = uni.getStorageSync('punishments')
      let stored: StoredPunishments = { rules: [], deletedBuiltinIds: [] }
      if (raw && typeof raw === 'object') {
        const o = raw as Partial<StoredPunishments>
        if (Array.isArray(o.rules)) stored.rules = o.rules as PunishmentRule[]
        if (Array.isArray(o.deletedBuiltinIds)) stored.deletedBuiltinIds = o.deletedBuiltinIds
      }
      this.rules = merge(stored)
      this.deletedBuiltinIds = stored.deletedBuiltinIds
    },
    pick(): PunishmentRule | null {
      const pool: PunishmentRule[] = []
      for (const r of this.rules) {
        if (r.enabled) pool.push(r)
      }
      if (pool.length === 0) return null
      const idx = Math.floor(Math.random() * pool.length)
      return pool[idx]
    },
    persist() {
      uni.setStorageSync('punishments', {
        rules: this.rules,
        deletedBuiltinIds: this.deletedBuiltinIds
      })
    },
    addRule(text: string): string {
      const trimmed = text.trim()
      if (trimmed.length === 0) return ''
      const id = generateCustomId()
      this.rules.push({ id, text: trimmed, builtIn: false, enabled: true })
      this.persist()
      return id
    },
    updateRule(id: string, text: string) {
      const trimmed = text.trim()
      if (trimmed.length === 0) return
      const rule = this.rules.find(r => r.id === id)
      if (!rule) return
      rule.text = trimmed
      this.persist()
    },
    toggleRule(id: string) {
      const rule = this.rules.find(r => r.id === id)
      if (!rule) return
      rule.enabled = !rule.enabled
      this.persist()
    },
    removeRule(id: string) {
      const idx = this.rules.findIndex(r => r.id === id)
      if (idx < 0) return
      const rule = this.rules[idx]
      if (rule.builtIn) {
        if (!this.deletedBuiltinIds.includes(rule.id)) {
          this.deletedBuiltinIds.push(rule.id)
        }
      }
      this.rules.splice(idx, 1)
      this.persist()
    }
  }
})
