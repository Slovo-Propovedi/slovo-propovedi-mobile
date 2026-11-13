import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { Rect } from 'react-native-svg'
import { getShadeHoles, type ShadeHoleKey, type ShadeHoleLayout } from '../lib/getShadeHoles'
import { type ShadeMorphSources } from '../model/useShadeGeometry'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

/**
 * One fixed mask slot of the shade. Its x/y/width/height are animated props
 * derived from the same module-level progress values the glass surfaces read,
 * so the cutout tracks the chrome on every frame instead of jumping when the
 * morph settles. Absent slots collapse to a zero-size rect rather than
 * unmounting a mask node mid-animation.
 * @param root0 - Slot props.
 * @param root0.layout - Static shade box / chrome mounting inputs.
 * @param root0.slot - Fixed slot this rect paints.
 * @param root0.sources - Shared morph progress values.
 */
export const AnimatedShadeHole = ({
  layout,
  slot,
  sources,
}: {
  layout: ShadeHoleLayout
  slot: ShadeHoleKey
  sources: ShadeMorphSources
}) => {
  const animatedProps = useAnimatedProps(() => {
    const hole = getShadeHoles(layout, {
      closeProgress: sources.closeProgress.value,
      focusProgress: sources.focusProgress.value,
      islandProgress: sources.islandProgress.value,
      openProgress: sources.openProgress.value,
      pillOpacity: sources.pillOpacity.value,
      pillProgress: sources.pillProgress.value,
    })[slot]

    return {
      height: hole.height,
      opacity: hole.opacity,
      rx: hole.height / 2,
      width: hole.width,
      x: hole.x,
      y: hole.y,
    }
  })

  return <AnimatedRect fill='black' animatedProps={animatedProps} />
}
