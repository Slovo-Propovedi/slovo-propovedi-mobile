import { useAnimatedStyle } from 'react-native-reanimated'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { getBarSideInset } from 'shared/ui/layout'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'

/**
 * Animated outer side inset of the islands row: the sliders' rest inset while
 * the bar floats expanded, 1.5× of it once the chrome folds into one line.
 * Longhand paddings are mandatory in animated styles — Reanimated's web update
 * path skips the shortform expansion (see getBarMorphStyles).
 * @param isForceExpanded - Wide layout: pin the row to the expanded inset even
 *   while the one-line driver follows a scroll collapse.
 */
export const useRowInsetStyle = (isForceExpanded = false) => {
  const { progress, settled } = useAtomMorphDriver(oneLineBarMorphDriver)
  const insetStyle = useAnimatedStyle(() => {
    const inset = getBarSideInset(isForceExpanded ? 0 : progress.value)

    return { paddingLeft: inset, paddingRight: inset }
  })
  // Plain restatement of the settled inset, applied after the animated style:
  // mid-morph it carries the START inset (the settled flag lags the flip), so
  // the shadow tree never paints the destination a frame early (Issue #63).
  const restingInset = getBarSideInset(isForceExpanded ? 0 : settled ? 1 : 0)

  return {
    insetStyle,
    restingInsetStyle: { paddingLeft: restingInset, paddingRight: restingInset },
  }
}
