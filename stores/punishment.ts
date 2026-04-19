import { defineStore } from 'pinia'
import { BUILTIN_PUNISHMENTS } from '@/data/builtin-punishments'

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
    }
  }
})
