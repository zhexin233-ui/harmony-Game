export type WindowLayoutMetrics = {
  windowWidth: number
  windowHeight: number
  statusBarHeight: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number
}

type WindowInfoLike = {
  windowWidth?: number
  windowHeight?: number
  statusBarHeight?: number
  safeAreaInsets?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  } | null
}

const DEFAULT_WINDOW_WIDTH_PX = 390
const DEFAULT_WINDOW_HEIGHT_PX = 844

function toNonNegativeNumber(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return value
}

export function normalizeWindowLayoutMetrics(
  metrics?: Partial<WindowLayoutMetrics>
): WindowLayoutMetrics {
  const statusBarHeight = toNonNegativeNumber(metrics?.statusBarHeight)
  const safeAreaTop = Math.max(statusBarHeight, toNonNegativeNumber(metrics?.safeAreaTop))
  const windowWidth = toNonNegativeNumber(metrics?.windowWidth)
  const windowHeight = toNonNegativeNumber(metrics?.windowHeight)

  return {
    windowWidth: windowWidth > 0 ? windowWidth : DEFAULT_WINDOW_WIDTH_PX,
    windowHeight: windowHeight > 0 ? windowHeight : DEFAULT_WINDOW_HEIGHT_PX,
    statusBarHeight,
    safeAreaTop,
    safeAreaBottom: toNonNegativeNumber(metrics?.safeAreaBottom),
    safeAreaLeft: toNonNegativeNumber(metrics?.safeAreaLeft),
    safeAreaRight: toNonNegativeNumber(metrics?.safeAreaRight)
  }
}

export function readWindowLayoutMetrics(): WindowLayoutMetrics {
  try {
    const info = uni.getWindowInfo() as WindowInfoLike
    const safeAreaInsets = info.safeAreaInsets ?? null
    return normalizeWindowLayoutMetrics({
      windowWidth: info.windowWidth,
      windowHeight: info.windowHeight,
      statusBarHeight: info.statusBarHeight,
      safeAreaTop: safeAreaInsets?.top,
      safeAreaBottom: safeAreaInsets?.bottom,
      safeAreaLeft: safeAreaInsets?.left,
      safeAreaRight: safeAreaInsets?.right
    })
  } catch {
    return normalizeWindowLayoutMetrics()
  }
}

export function getPageBottomPadding(
  basePaddingPx: number,
  metrics?: Partial<WindowLayoutMetrics>
): string {
  const windowMetrics = normalizeWindowLayoutMetrics(metrics)
  return `${basePaddingPx + windowMetrics.safeAreaBottom}px`
}

export function getBottomDockPadding(
  basePaddingPx: number,
  metrics?: Partial<WindowLayoutMetrics>
): string {
  const windowMetrics = normalizeWindowLayoutMetrics(metrics)
  return `${basePaddingPx + windowMetrics.safeAreaBottom}px`
}

export type GameViewportStyle = {
  height: string
  minHeight: string
  backgroundColor: string
}

export function getGameViewportStyle(
  backgroundColor: string,
  metrics?: Partial<WindowLayoutMetrics>
): GameViewportStyle {
  const windowMetrics = normalizeWindowLayoutMetrics(metrics)
  const viewportHeight = `${windowMetrics.windowHeight}px`

  return {
    height: viewportHeight,
    minHeight: viewportHeight,
    backgroundColor
  }
}
