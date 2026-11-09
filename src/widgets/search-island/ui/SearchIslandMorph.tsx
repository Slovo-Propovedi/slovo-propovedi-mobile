import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { isTabIslandCollapsedAtom } from 'widgets/tab-bar/@x/morph'
import { closeSearch, useIsSearchFieldVisible, useOpenSearch } from 'features/sermon-search'
import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorph } from 'shared/lib/hooks/useAtomMorph'
import { createGlassStyles, GlassSurface } from 'shared/ui'
import { BAR_MORPH_DURATION_MS, tabBarHeightAtom } from 'shared/ui/layout'
import { RADIUSES, useTheme } from 'shared/ui/theme'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { SearchIslandCloseSlot } from './SearchIslandCloseSlot'
import { SearchIslandContent } from './SearchIslandContent'
import { SearchIslandMagnifier } from './SearchIslandMagnifier'
import { styles } from './SearchIslandMorph.styles'

// One glass frame for the whole search affordance. Closed it is the search
// circle; opened it morphs into the pill. The frame is mounted for the whole
// tab shell (CustomTabBar renders on every tab screen, including the nested
// playlist routes), so the two states are the same node: geometry animates,
// content crossfades, and the single boxShadow never changes owner.
export const SearchIslandMorph = () => {
  const { isLight } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const isSearchFieldVisible = useIsSearchFieldVisible()
  const openSearch = useOpenSearch()
  const closeSearchAction = useAction(closeSearch)
  const [isFocused, setIsFocused] = useState(false)
  // Both morphs subscribe to their atom, so they start in the same tick as the
  // tab island instead of waiting for a React commit.
  const { isMorphing: isBarMorphing, progress: barProgress } = useAtomMorph(
    isTabIslandCollapsedAtom,
    BAR_MORPH_DURATION_MS,
  )
  const { progress: openProgress } = useAtomMorph(isSearchFieldVisibleAtom, BAR_MORPH_DURATION_MS)
  const closeProgress = useSharedValue(isFocused ? 1 : 0)
  const glass = createGlassStyles(isLight, RADIUSES.round)

  useEffect(() => {
    closeProgress.value = withTiming(isFocused ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [closeProgress, isFocused])

  const handleCloseSearch = useCallback(() => {
    Keyboard.dismiss()
    void closeSearchAction()
  }, [closeSearchAction])

  const frameStyle = useAnimatedStyle(() => {
    const { closeRight, iconInset, iconSize, radius, ...geometry } = getSearchIslandGeometry({
      barProgress: barProgress.value,
      closeProgress: closeProgress.value,
      openProgress: openProgress.value,
      screenWidth,
      tabBarHeight,
    })

    return { ...geometry, borderRadius: radius, paddingLeft: iconInset }
  })

  return (
    <>
      <Animated.View
        pointerEvents='auto'
        style={[
          styles.container,
          isBarMorphing ? glass.containerDegraded : glass.container,
          frameStyle,
        ]}
      >
        <GlassSurface isLight={isLight} radius={RADIUSES.round} degraded={isBarMorphing} />
        <SearchIslandMagnifier
          barProgress={barProgress}
          screenWidth={screenWidth}
          openProgress={openProgress}
          tabBarHeight={tabBarHeight}
        />
        <SearchIslandContent
          onOpenSearch={openSearch}
          openProgress={openProgress}
          onFocusChange={setIsFocused}
          isVisible={isSearchFieldVisible}
        />
      </Animated.View>
      <SearchIslandCloseSlot
        progress={barProgress}
        degraded={isBarMorphing}
        screenWidth={screenWidth}
        onPress={handleCloseSearch}
        openProgress={openProgress}
        tabBarHeight={tabBarHeight}
        closeProgress={closeProgress}
        isVisible={isSearchFieldVisible && isFocused}
      />
    </>
  )
}
