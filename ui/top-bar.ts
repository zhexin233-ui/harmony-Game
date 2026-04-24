import { normalizeWindowLayoutMetrics, type WindowLayoutMetrics } from '@/ui/window-layout'

export type TopBarPaddingStyle = {
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
}

const TOP_BAR_VERTICAL_PADDING_PX = 14
const TOP_BAR_HORIZONTAL_PADDING_PX = 20

export function getTopBarPaddingStyle(
  metrics?: Partial<WindowLayoutMetrics>
): TopBarPaddingStyle {
  const windowMetrics = normalizeWindowLayoutMetrics(metrics)
  return {
    paddingTop: `${windowMetrics.safeAreaTop + TOP_BAR_VERTICAL_PADDING_PX}px`,
    paddingRight: `${TOP_BAR_HORIZONTAL_PADDING_PX}px`,
    paddingBottom: `${TOP_BAR_VERTICAL_PADDING_PX}px`,
    paddingLeft: `${TOP_BAR_HORIZONTAL_PADDING_PX}px`
  }
}
