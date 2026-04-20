import type { Theme } from '@/theme/tokens'

export type ThemeCard = {
  theme: Theme
  title: string
  subtitle: string
  emoji: string
  tone: 'soft' | 'neon'
  active: boolean
}

const THEME_CARD_BASE: Omit<ThemeCard, 'active'>[] = [
  {
    theme: 'cartoon',
    title: 'Q 版卡通',
    subtitle: '糖果粉、圆润、轻松热闹',
    emoji: '🎈',
    tone: 'soft'
  },
  {
    theme: 'neon',
    title: '霓虹电玩',
    subtitle: '深色、发光、街机氛围',
    emoji: '⚡',
    tone: 'neon'
  }
]

export function getThemeCards(current: Theme): ThemeCard[] {
  return THEME_CARD_BASE.map((card) => ({
    ...card,
    active: card.theme === current
  }))
}
