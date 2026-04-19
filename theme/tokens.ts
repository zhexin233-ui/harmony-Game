export type Theme = 'cartoon' | 'neon'

export type ThemeTokens = {
  bg: string
  bgEnd: string
  primary: string
  secondary: string
  accent: string
  text: string
  textMuted: string
  success: string
  danger: string
  glow: string
  warn: string
  urgent: string
  armedBg: string
  signalBg: string
  emojiShadow: string
}

export const themes: Record<Theme, ThemeTokens> = {
  cartoon: {
    bg: '#FFF5EB',
    bgEnd: '#FFE5F1',
    primary: '#FF6B9D',
    secondary: '#FFB347',
    accent: '#7ED957',
    text: '#3D2F4F',
    textMuted: '#7A6A87',
    success: '#7ED957',
    danger: '#FF6B9D',
    glow: 'transparent',
    warn: '#FFE0B2',
    urgent: '#FFB0B0',
    armedBg: '#FFE9C7',
    signalBg: '#7ED957',
    emojiShadow: 'none'
  },
  neon: {
    bg: '#0A1428',
    bgEnd: '#0E1A2B',
    primary: '#00D4FF',
    secondary: '#FF3D9A',
    accent: '#FFE600',
    text: '#00D4FF',
    textMuted: '#7A88A6',
    success: '#6CE5B8',
    danger: '#FF3D9A',
    glow: 'rgba(0, 212, 255, 0.5)',
    warn: '#3A2812',
    urgent: '#5A1020',
    armedBg: '#1A2A4C',
    signalBg: '#00D4FF',
    emojiShadow: '0 0 8px rgba(0, 212, 255, 0.8)'
  }
}
