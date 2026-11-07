import { useAtom } from '@reatom/npm-react'
import { type PropsWithChildren } from 'react'
import Animated from 'react-native-reanimated'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { useSearchBarCollapse } from '../lib/useSearchBarCollapse'
import { styles } from './SearchGroupedResults.styles'

// Scroll container of the grouped search results: owns the bottom-bar collapse
// driver and the shared mini-player inset, keeping the results component itself
// free of scroll plumbing.
export const SearchResultsScroll = ({ children }: PropsWithChildren) => {
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const { onScroll } = useSearchBarCollapse()

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardDismissMode='on-drag'
      keyboardShouldPersistTaps='handled'
      style={[styles.scroll, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight },
      ]}
    >
      {children}
    </Animated.ScrollView>
  )
}
