import { StyleSheet, Text } from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { getTabItemStyle } from '../lib/getBarMorphStyles'
import { WIDE_TAB_LABEL_SIZE } from '../lib/getIslandStyle'
import { getCapsuleOpacity, getTabIconOffset } from '../lib/getTabItemStyle'
import { ActiveTabCapsule } from './ActiveTabCapsule'
import { styles } from './styles'
import { TabIcon } from './TabIcon'
import { getTabLabel } from './tabLabels'

const AnimatedText = Animated.createAnimatedComponent(Text)

// Wide tabs are text-only: the label leaves the absolute layer and becomes the
// item's only centred child, growing to the wider pill size.
const wideLabelStyle = StyleSheet.create({
  label: { fontSize: WIDE_TAB_LABEL_SIZE, fontWeight: '500', textAlign: 'center' },
})

export const TabButton = ({
  accessibilityLabel,
  collapseProgress,
  isActive,
  isBarVisuallyCollapsed = false,
  isDisabled,
  isSearchSlot = false,
  isWideLayout = false,
  oneLineProgress,
  onPress,
  routeKey,
  routeName,
}: {
  /** Explicit control name; otherwise it is derived from the icon + label. */
  accessibilityLabel?: string
  // Shared 0..1 bar-morph progress: labels fade out as the island becomes a circle.
  collapseProgress?: SharedValue<number>
  isActive: boolean
  // Collapsed island: the active-tab circle expands the bar on tap, so that tap
  // keeps its press haptic like the search circle instead of being silent.
  isBarVisuallyCollapsed?: boolean
  isDisabled?: boolean
  /** The search slot: wide renders it icon-only, without the «Поиск» label. */
  isSearchSlot?: boolean
  /** Wide layout: the island is pinned to its slim constant height. */
  isWideLayout?: boolean
  // One-line (height) axis: owns the item height so it fills the island in every
  // state, including the 60 search-open circle on a collapsed shape.
  oneLineProgress: SharedValue<number>
  onPress: () => void
  routeKey: string
  routeName: string
}) => {
  const { currentTheme } = useTheme()
  const fallbackProgress = useSharedValue(0)
  const labelProgress = collapseProgress ?? fallbackProgress
  const labelStyle = useAnimatedStyle(() => ({ opacity: 1 - labelProgress.value }))
  const itemStyle = useAnimatedStyle(() =>
    getTabItemStyle(labelProgress.value, oneLineProgress.value, isWideLayout),
  )
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: getTabIconOffset(labelProgress.value) }],
  }))
  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: getCapsuleOpacity(labelProgress.value, isActive),
  }))
  const color = isDisabled
    ? currentTheme.textMuted
    : isActive
      ? currentTheme.primary
      : currentTheme.text
  // Wide splits the affordance: tabs are label-only (Apple Music top bar), the
  // search slot is icon-only. Compact keeps the stacked icon + label.
  const isWideTab = isWideLayout && !isSearchSlot
  const isWideSearch = isWideLayout && isSearchSlot

  return (
    <TouchableButton
      key={routeKey}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={isActive ? 1 : undefined}
      hapticDisabled={isActive && !isBarVisuallyCollapsed}
      style={[styles.tabButton, isDisabled && styles.disabledTabButton]}
    >
      <Animated.View style={[styles.tabItem, itemStyle]}>
        {isActive && <ActiveTabCapsule style={capsuleStyle} />}
        {!isWideTab && (
          <Animated.View style={iconStyle}>
            <TabIcon color={color} isActive={isActive} routeName={routeName} />
          </Animated.View>
        )}
        {!isWideSearch && (
          <AnimatedText
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[isWideTab ? wideLabelStyle.label : styles.tabText, { color }, labelStyle]}
          >
            {getTabLabel(routeName)}
          </AnimatedText>
        )}
      </Animated.View>
    </TouchableButton>
  )
}
