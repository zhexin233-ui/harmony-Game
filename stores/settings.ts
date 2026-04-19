import { defineStore } from 'pinia'
import type { Theme } from '@/theme/tokens'

export type Settings = {
  theme: Theme
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'cartoon',
  soundEnabled: true,
  vibrationEnabled: true
}

export const useSettings = defineStore('settings', {
  state: () => ({
    ...DEFAULT_SETTINGS,
    hasOnboarded: false
  }),
  actions: {
    load() {
      const raw = uni.getStorageSync('settings')
      if (raw && typeof raw === 'object') {
        const s = raw as Partial<Settings>
        if (s.theme === 'cartoon' || s.theme === 'neon') this.theme = s.theme
        if (typeof s.soundEnabled === 'boolean') this.soundEnabled = s.soundEnabled
        if (typeof s.vibrationEnabled === 'boolean') this.vibrationEnabled = s.vibrationEnabled
      }
      const onboarded = uni.getStorageSync('hasOnboarded')
      this.hasOnboarded = onboarded === true
    },
    persist() {
      uni.setStorageSync('settings', {
        theme: this.theme,
        soundEnabled: this.soundEnabled,
        vibrationEnabled: this.vibrationEnabled
      })
    },
    setTheme(theme: Theme) {
      this.theme = theme
      this.persist()
    },
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
      this.persist()
    },
    toggleVibration() {
      this.vibrationEnabled = !this.vibrationEnabled
      this.persist()
    },
    markOnboarded() {
      this.hasOnboarded = true
      uni.setStorageSync('hasOnboarded', true)
    }
  }
})
