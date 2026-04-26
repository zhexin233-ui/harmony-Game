export const ICON_PATHS = {
  'nav-home': '/static/icons/home.svg',
  'nav-punishment': '/static/icons/bolt.svg',
  'nav-settings': '/static/icons/gear.svg',
  'logo-dice': '/static/icons/dice.svg',
  'back': '/static/icons/arrow-left.svg',
  'arrow-right': '/static/icons/chevron-right.svg',
  'play': '/static/icons/play.svg',
  'minus': '/static/icons/minus.svg',
  'add': '/static/icons/plus.svg',
  'mail-empty': '/static/icons/mail-empty.svg',
  'group-luck': '/static/icons/dice.svg',
  'group-skill': '/static/icons/bolt.svg',
  'theme-cartoon': '/static/icons/balloon.svg',
  'theme-neon': '/static/icons/bolt.svg',
  'check-on': '/static/icons/check-circle.svg',
  'check-off': '/static/icons/circle.svg',
  'game-bomb': '/static/icons/bomb.svg',
  'game-number-bomb': '/static/icons/bomb.svg',
  'game-crocodile': '/static/icons/crocodile.svg',
  'game-wheel': '/static/icons/wheel.svg',
  'game-horse-race': '/static/icons/horse.svg',
  'game-reaction': '/static/icons/hand.svg',
  'game-tug-of-war': '/static/icons/bolt.svg',
  'game-finger-twister': '/static/icons/hand.svg',
  'target': '/static/icons/target.svg',
  'wheel-disc': '/static/icons/wheel.svg',
  'tooth': '/static/icons/tooth.svg',
  'trophy': '/static/icons/trophy.svg',
  'alert': '/static/icons/alert.svg',
  'explosion': '/static/icons/explosion.svg',
  'eye': '/static/icons/eye.svg',
  'signal': '/static/icons/signal.svg'
} as const

export type IconKey = keyof typeof ICON_PATHS

export function getIconPath(key: IconKey): string {
  return ICON_PATHS[key]
}
