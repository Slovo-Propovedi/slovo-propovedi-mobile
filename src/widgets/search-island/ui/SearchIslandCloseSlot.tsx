import { useEffect, useRef, useState } from 'react'
import { type ViewStyle } from 'react-native'
import { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { GlassIsland } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { SearchIslandCloseButton } from './SearchIslandCloseButton'

// Web commits `closeSearch` on press-in, while the finger is still down. The
// browser then hit-tests the resolving click, so the slot must stay
// pointer-capable until that click lands — otherwise it re-targets onto the
// results row below and opens a playlist. The re-fired close is idempotent.
const PRESS_RESOLUTION_GRACE_MS = 150

interface SearchIslandCloseSlotProps {
  closeProgress: SharedValue<number>
  isVisible: boolean
  onPress: () => void
  openProgress: SharedValue<number>
  progress: SharedValue<number>
  /** Settled-state restatement applied after the animated style (theme remount). */
  restingStyle: ViewStyle
  screenWidth: number
  tabBarHeight: number
}

/**
 * The circular ✕ that appears beside the pill while the field is focused or an
 * active query keeps the search open. Its opacity and scale follow the shared
 * close progress, so appearance and disappearance use the same morph duration
 * as the pill's width. It is content
 * of the same morph component, never a second shadow carrier: the search frame
 * owns the row's only boxShadow.
 * @param root0 - Component props.
 * @param root0.closeProgress - 0 = hidden, 1 = fully shown.
 * @param root0.isVisible - Gates pointer events and accessibility only.
 * @param root0.onPress - Closes the search session.
 * @param root0.openProgress - The island's open/close progress.
 * @param root0.progress - The bar collapse progress.
 * @param root0.restingStyle - Settled-state restatement applied after the animated style.
 * @param root0.screenWidth - Current viewport width.
 * @param root0.tabBarHeight - Measured height of the floating tab row.
 */
export const SearchIslandCloseSlot = ({
  closeProgress,
  isVisible,
  onPress,
  openProgress,
  progress,
  restingStyle,
  screenWidth,
  tabBarHeight,
}: SearchIslandCloseSlotProps) => {
  const { isLight } = useTheme()
  const [isPointerGraceActive, setIsPointerGraceActive] = useState(false)
  const hasBeenVisibleRef = useRef(isVisible)
  const graceTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (isVisible) {
      hasBeenVisibleRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- the pointer gate follows the visibility flip, not a render derivation
      setIsPointerGraceActive(false)
      return
    }
    // A slot that mounts hidden stays inert: the grace follows a real flip.
    if (!hasBeenVisibleRef.current) return
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- the pointer gate follows the visibility flip, not a render derivation
    setIsPointerGraceActive(true)
    graceTimerRef.current = setTimeout(() => {
      graceTimerRef.current = null
      setIsPointerGraceActive(false)
    }, PRESS_RESOLUTION_GRACE_MS)
    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current)
        graceTimerRef.current = null
      }
    }
  }, [isVisible])

  const style = useAnimatedStyle(() => {
    const { bottom, closeRight, height } = getSearchIslandGeometry({
      barProgress: progress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return {
      borderRadius: height / 2,
      bottom,
      height,
      opacity: openProgress.value * closeProgress.value,
      right: closeRight,
      transform: [{ scale: 0.8 + 0.2 * closeProgress.value }],
      width: height,
    }
  })

  return (
    <GlassIsland
      isLight={isLight}
      hostStyle={styles.closeCircle}
      animatedStyle={[style, restingStyle]}
      accessibilityElementsHidden={!isVisible}
      pointerEvents={isVisible || isPointerGraceActive ? 'auto' : 'none'}
      importantForAccessibility={isVisible ? 'yes' : 'no-hide-descendants'}
    >
      <SearchIslandCloseButton onPress={onPress} />
    </GlassIsland>
  )
}

const styles = {
  closeCircle: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
    zIndex: 20,
  },
}
