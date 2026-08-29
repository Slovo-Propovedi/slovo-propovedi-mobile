import { useAtom } from '@reatom/npm-react'
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
import { tabBarHeightAtom } from 'shared/ui/layout'
import { PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { ContinueListeningButton } from './ContinueListeningButton'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

export const ListenScreen = () => {
  const { currentTheme } = useTheme()
  const isSearchOpen = useIsSearchOpen()
  const isSearchActive = useIsSearchActive()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)

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
          style={[styles.scroll, { backgroundColor: currentTheme.background }]}
          contentContainerStyle={[{ paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight }]}
        >
          {!isSearchOpen && <SearchToggleButton />}
          <DynamicSectionsSlider
            leadingElement={!isSearchActive ? <ContinueListeningButton /> : undefined}
          />
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
  searchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: SEARCH_HEADER_HEIGHT,
    zIndex: 1,
  },
})
