import { useAnimatedStyle } from 'react-native-reanimated'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { getBarSideInset } from 'shared/ui/layout'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'

/**
 * Animated outer side inset of the islands row: the sliders' rest inset while
 * the bar floats expanded, 1.5× of it once the chrome folds into one line.
 * Longhand paddings are mandatory in animated styles — Reanimated's web update
 * path skips the shortform expansion (see getBarMorphStyles).
 */
export const useRowInsetStyle = () => {
  const { progress, settled } = useAtomMorphDriver(oneLineBarMorphDriver)
  const insetStyle = useAnimatedStyle(() => {
    const inset = getBarSideInset(progress.value)

    return { paddingLeft: inset, paddingRight: inset }
  })
  // Plain restatement of the settled inset, applied after the animated style:
  // mid-morph it carries the START inset (the settled flag lags the flip), so
  // the shadow tree never paints the destination a frame early (Issue #63).
  const restingInset = getBarSideInset(settled ? 1 : 0)

  return {
    insetStyle,
    restingInsetStyle: { paddingLeft: restingInset, paddingRight: restingInset },
  }
}
