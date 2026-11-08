import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { View } from 'react-native'
import { type SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { styles } from './SearchIslandMorph.styles'

interface SearchIslandMagnifierProps {
  barProgress: SharedValue<number>
  openProgress: SharedValue<number>
  screenWidth: number
  tabBarHeight: number
}

/**
 * The always-visible search glyph of the morphing search frame.
 *
 * It is a vector-font glyph, so it is rendered at its target size instead of
 * being scaled down: a fixed 32px node scaled into the 22px pill slot overflowed
 * the slot and Android clipped the glyph against the pill bounds (a visible
 * crescent). Reanimated animates host views only, so the geometry-computed size
 * is bridged into React state for the icon's `size` prop. Whole-pixel steps
 * (32 → 22 is ten) keep the re-render count low and stay invisible.
 * @param root0 - Component props.
 * @param root0.barProgress - Bar morph progress (0 = expanded, 1 = collapsed).
 * @param root0.openProgress - Search morph progress (0 = circle, 1 = pill).
 * @param root0.screenWidth - Current viewport width.
 * @param root0.tabBarHeight - Measured height of the floating tab row.
 */
export const SearchIslandMagnifier = ({
  barProgress,
  openProgress,
  screenWidth,
  tabBarHeight,
}: SearchIslandMagnifierProps) => {
  const { currentTheme } = useTheme()

  const getIconSize = (bar: number, open: number) => {
    'worklet'

    const { iconSize } = getSearchIslandGeometry({
      barProgress: bar,
      openProgress: open,
      screenWidth,
      tabBarHeight,
    })

    return Math.round(iconSize)
  }

  // Reading the shared values is allowed on the first render, so the glyph
  // starts at the size its frame is drawn at instead of a stale constant.
  const [iconSize, setIconSize] = useState(() => getIconSize(barProgress.value, openProgress.value))
  const reportedIconSize = useSharedValue(iconSize)

  useDerivedValue(() => {
    const nextSize = getIconSize(barProgress.value, openProgress.value)

    if (nextSize === reportedIconSize.value) return nextSize

    reportedIconSize.value = nextSize
    scheduleOnRN(setIconSize, nextSize)

    return nextSize
  })

  return (
    <View pointerEvents='none' style={[styles.magnifier, { height: iconSize, width: iconSize }]}>
      <Ionicons name='search' size={iconSize} color={currentTheme.text} />
    </View>
  )
}
