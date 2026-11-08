import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

interface ContainerGeometryInput {
  barProgress: number
  fullScreenHeight: number
  /** Expand/collapse progress: 0 = mini pill, 1 = fullscreen. */
  progress: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Container geometry during the expand/collapse transition. The start geometry
 * is the CURRENT mini pill (expanded or collapsed bar), not a fixed bottom —
 * expanding from the collapsed bottom line therefore lifts the pill out of the
 * row smoothly instead of jumping to the detached position first.
 * Worklet-safe: used directly by the container's animated style.
 * @param input - Morph progress, expand progress and screen geometry.
 * @param input.barProgress - Bottom-bar morph progress (0 = expanded pill, 1 = collapsed row).
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeight - Measured height of the floating tab row.
 */
export const getContainerGeometryStyle = ({
  barProgress,
  fullScreenHeight,
  progress,
  screenWidth,
  tabBarHeight,
}: ContainerGeometryInput) => {
  'worklet'
  const expand = Math.min(Math.max(progress, 0), 1)
  const rest = getMiniPlayerGeometry({ barProgress, fullScreenHeight, screenWidth, tabBarHeight })

  return {
    borderBottomLeftRadius: rest.radius * (1 - expand),
    borderBottomRightRadius: rest.radius * (1 - expand),
    borderTopLeftRadius: rest.radius * (1 - expand),
    borderTopRightRadius: rest.radius * (1 - expand),
    bottom: rest.bottom * (1 - expand),
    left: rest.left * (1 - expand),
    top: rest.top * (1 - expand),
    width: rest.width + (screenWidth - rest.width) * expand,
  }
}
