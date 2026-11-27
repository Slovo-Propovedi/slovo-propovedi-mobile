import { type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { type CapsuleTravelMotion, type SlotCapsuleMotion } from '../lib/capsuleTravel'
import { styles } from './styles'
import { TabBarTab } from './TabBarTab'
import { TabIslandSearchSlot } from './TabIslandSearchSlot'
import { TravelingCapsule } from './TravelingCapsule'

interface TabIslandContentProps {
  activeRouteKey: string | undefined
  capsule: CapsuleTravelMotion
  contentStyle: AnimatedStyle<ViewStyle>
  expandedSearchWidth: number
  expandedTabWidth: number
  handleTabPress: (route: { key: string; name: string }, isActive: boolean) => void
  hideSearch: boolean
  isCollapsed: boolean
  isSearchFocused: boolean
  isTabAvailable: (routeName: string) => boolean
  isWide: boolean
  motionFor: (slotIndex: number) => SlotCapsuleMotion | undefined
  oneLineProgress: SharedValue<number>
  progress: SharedValue<number>
  restingCapsule: { left: number; width: number }
  restingContentStyle: StyleProp<ViewStyle>
  settledCollapsed: boolean
  settledOneLine: boolean
  visibleRoutes: readonly { key: string; name: string }[]
}

// The island's slot row: the traveling capsule paints behind the tabs, then the
// routed tabs and the folded-in search slot follow in the same order the capsule
// geometry assumes.
export const TabIslandContent = ({
  activeRouteKey,
  capsule,
  contentStyle,
  expandedSearchWidth,
  expandedTabWidth,
  handleTabPress,
  hideSearch,
  isCollapsed,
  isSearchFocused,
  isTabAvailable,
  isWide,
  motionFor,
  oneLineProgress,
  progress,
  restingCapsule,
  restingContentStyle,
  settledCollapsed,
  settledOneLine,
  visibleRoutes,
}: TabIslandContentProps) => (
  <Animated.View style={styles.islandContent}>
    <TravelingCapsule motion={capsule} progress={progress} resting={restingCapsule} />
    <Animated.View style={[styles.slotsRow, contentStyle, restingContentStyle]}>
      {visibleRoutes.map((route, index) => {
        // The fallback tab owns the collapsed circle while search is focused,
        // but search is the active destination: the tab is not highlighted.
        const isActiveSlot = route.key === activeRouteKey

        return (
          <TabBarTab
            key={route.key}
            progress={progress}
            routeKey={route.key}
            isWideLayout={isWide}
            routeName={route.name}
            isActiveSlot={isActiveSlot}
            isBarCollapsed={isCollapsed}
            capsuleMotion={motionFor(index)}
            expandedWidth={expandedTabWidth}
            isSettledOneLine={settledOneLine}
            oneLineProgress={oneLineProgress}
            isSettledCollapsed={settledCollapsed}
            isDisabled={!isTabAvailable(route.name)}
            isHighlighted={isActiveSlot && !isSearchFocused}
            onPress={() => handleTabPress(route, isActiveSlot)}
          />
        )
      })}
      {!hideSearch && (
        <TabIslandSearchSlot
          progress={progress}
          isDetached={!isWide}
          isWideLayout={isWide}
          isCollapsed={isCollapsed}
          isActive={isSearchFocused}
          isSettledOneLine={settledOneLine}
          oneLineProgress={oneLineProgress}
          expandedWidth={expandedSearchWidth}
          isSettledCollapsed={settledCollapsed}
          capsuleMotion={motionFor(visibleRoutes.length)}
        />
      )}
    </Animated.View>
  </Animated.View>
)
