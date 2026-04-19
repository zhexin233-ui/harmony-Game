import { themes, type Theme } from './tokens'

export function tokenToCssVar(key: string): string {
  return '--' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
}

export function applyTheme(theme: Theme, root: HTMLElement): void {
  const tokens = themes[theme]
  for (const key in tokens) {
    const value = (tokens as unknown as Record<string, string>)[key]
    root.style.setProperty(tokenToCssVar(key), value)
  }
}
