import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/theme'

interface RestingContainerStyleInput {
  expanded: boolean
  fullScreenHeight: number
  miniBottom: number
  screenWidth: number
}

/**
 * Non-animated resting geometry of the player container for the current React
 * state. Committed through the React shadow tree, which never drops updates —
 * unlike Reanimated JS-triggered commits during the busy startup window
 * (Issue #63). The animated containerStyle overrides these values during
 * transitions; at rest both layers agree.
 * @param root0 - Input geometry parameters.
 * @param root0.expanded - Whether the player is expanded to fullscreen.
 * @param root0.fullScreenHeight - Full device screen height.
 * @param root0.miniBottom - Bottom offset for the mini player.
 * @param root0.screenWidth - Current window width.
 */
export const getRestingContainerStyle = ({
  expanded,
  fullScreenHeight,
  miniBottom,
  screenWidth,
}: RestingContainerStyleInput) => {
  if (expanded)
    return {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      bottom: 0,
      left: 0,
      top: 0,
      width: screenWidth,
    }

  return {
    borderBottomLeftRadius: RADIUSES.middle,
    borderBottomRightRadius: RADIUSES.middle,
    borderTopLeftRadius: RADIUSES.middle,
    borderTopRightRadius: RADIUSES.middle,
    bottom: miniBottom,
    left: INDENTS.low,
    top: fullScreenHeight - miniBottom - PLAYER_SIZES.miniPlayerHeight,
    width: screenWidth - INDENTS.low * 2,
  }
}
