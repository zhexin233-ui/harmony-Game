export type Theme = 'cartoon' | 'neon'

export type ThemeTokens = {
  bg: string
  bgEnd: string
  primary: string
  primaryDim: string
  secondary: string
  accent: string
  text: string
  textMuted: string
  onPrimary: string
  onSecondary: string
  success: string
  danger: string
  dangerText: string
  glow: string
  warn: string
  urgent: string
  armedBg: string
  signalBg: string
  emojiShadow: string
  surface: string
  surfaceLow: string
  surfaceHigh: string
  surfaceHighest: string
  topBarBg: string
  bottomNavBg: string
  navActiveBg: string
  navActiveText: string
  navInactiveText: string
  cardBg: string
  cardBgAlt: string
  heroCardBg: string
  imageCardBg: string
  outlineSoft: string
  shadowSoft: string
  decorPrimary: string
  decorSecondary: string
  placeholderBg: string
  disabledBg: string
}

export const themes: Record<Theme, ThemeTokens> = {
  cartoon: {
    bg: '#fff4f6',
    bgEnd: '#ffecf2',
    primary: '#b00074',
    primaryDim: '#9b0065',
    secondary: '#00675f',
    accent: '#ffeb3b',
    text: '#492136',
    textMuted: '#7c4d64',
    onPrimary: '#ffeff3',
    onSecondary: '#bffff5',
    success: '#56f1e0',
    danger: '#fb5151',
    dangerText: '#b31b25',
    glow: 'rgba(176, 0, 116, 0.18)',
    warn: '#ffeb3b',
    urgent: '#fb5151',
    armedBg: '#ffd8e7',
    signalBg: '#56f1e0',
    emojiShadow: 'none',
    surface: '#fff4f6',
    surfaceLow: '#ffecf2',
    surfaceHigh: '#ffd8e7',
    surfaceHighest: '#ffd0e3',
    topBarBg: 'rgba(255, 255, 255, 0.82)',
    bottomNavBg: 'rgba(255, 255, 255, 0.9)',
    navActiveBg: '#ff6bb9',
    navActiveText: '#ffffff',
    navInactiveText: '#7c4d64',
    cardBg: '#ffffff',
    cardBgAlt: '#ffe0ec',
    heroCardBg: 'linear-gradient(135deg, #b00074 0%, #ff6bb9 100%)',
    imageCardBg: '#fff0f6',
    outlineSoft: 'rgba(214, 157, 182, 0.22)',
    shadowSoft: '0 14px 42px rgba(73, 33, 54, 0.08)',
    decorPrimary: 'rgba(255, 107, 185, 0.34)',
    decorSecondary: 'rgba(86, 241, 224, 0.28)',
    placeholderBg: '#ffe0ec',
    disabledBg: '#f4d8e4'
  },
  neon: {
    bg: '#0A1428',
    bgEnd: '#0E1A2B',
    primary: '#00D4FF',
    primaryDim: '#0099C2',
    secondary: '#FF3D9A',
    accent: '#FFE600',
    text: '#E8F7FF',
    textMuted: '#9AAAC8',
    onPrimary: '#03111F',
    onSecondary: '#0A1428',
    success: '#6CE5B8',
    danger: '#FF5C8A',
    dangerText: '#FF8FAE',
    glow: 'rgba(0, 212, 255, 0.5)',
    warn: '#3A2812',
    urgent: '#5A1020',
    armedBg: '#1A2A4C',
    signalBg: '#00D4FF',
    emojiShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
    surface: '#111D33',
    surfaceLow: '#172642',
    surfaceHigh: '#1D3155',
    surfaceHighest: '#243B66',
    topBarBg: 'rgba(12, 22, 42, 0.88)',
    bottomNavBg: 'rgba(10, 20, 40, 0.92)',
    navActiveBg: '#00D4FF',
    navActiveText: '#03111F',
    navInactiveText: '#9AAAC8',
    cardBg: '#14233D',
    cardBgAlt: '#1A2A4C',
    heroCardBg: 'linear-gradient(135deg, #00D4FF 0%, #FF3D9A 100%)',
    imageCardBg: '#10213B',
    outlineSoft: 'rgba(0, 212, 255, 0.22)',
    shadowSoft: '0 14px 42px rgba(0, 212, 255, 0.14)',
    decorPrimary: 'rgba(0, 212, 255, 0.24)',
    decorSecondary: 'rgba(255, 61, 154, 0.2)',
    placeholderBg: '#1A2A4C',
    disabledBg: '#162238'
  }
}
