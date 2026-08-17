import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  SEARCH_HEADER_HEIGHT,
  SearchBar,
  SearchToggleButton,
  SermonSearchResults,
  useIsSearchActive,
  useIsSearchOpen,
} from 'features/sermon-search'
import { PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

export const ListenScreen = () => {
  const { currentTheme } = useTheme()
  const isSearchOpen = useIsSearchOpen()
  const isSearchActive = useIsSearchActive()

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      {isSearchOpen && (
        <View style={styles.searchHeader}>
          <SearchBar />
        </View>
      )}
      {isSearchOpen && isSearchActive ? (
        <SermonSearchResults />
      ) : (
        <ScrollView
          keyboardDismissMode='on-drag'
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={styles.scrollContent}
          style={[styles.scroll, { backgroundColor: currentTheme.background }]}
        >
          {!isSearchOpen && <SearchToggleButton />}
          <DynamicSectionsSlider />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight,
  },
  searchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: SEARCH_HEADER_HEIGHT,
    zIndex: 1,
  },
})
