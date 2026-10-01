import { useAtom } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useOfflineSermons } from 'features/offline-sermons'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
import { isPlayingAtom } from 'entities/player'
import { createTracksListStyles, TracksListSkeleton } from 'entities/track-list'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { OfflineEmptyState } from './OfflineEmptyState'
import { OfflineHeaderMenu } from './OfflineHeaderMenu'
import { OfflineRow } from './OfflineRow'
import { OfflineSeparator } from './OfflineSeparator'
import { SermonCachingHeaderSwitch } from './SermonCachingHeaderSwitch'

const styles = StyleSheet.create({
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.lowest,
  },
  skeletonList: {
    paddingTop: INDENTS.low,
  },
  skeletonRow: {
    marginHorizontal: INDENTS.medium,
  },
})

export const OfflineScreen = () => {
  const { currentTheme } = useTheme()
  const navigation = useNavigation()
  const { isLoading, items } = useOfflineSermons()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const tracksListStyles = createTracksListStyles(currentTheme)
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <SermonCachingHeaderSwitch />
          <OfflineHeaderMenu />
        </View>
      ),
    })
    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation])

  if (isLoading && items.length === 0)
    return (
      <View style={tracksListStyles.container}>
        <View style={styles.skeletonList}>
          <TracksListSkeleton rowStyle={styles.skeletonRow} />
        </View>
      </View>
    )

  return (
    <View style={tracksListStyles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.sermon.id}
        ItemSeparatorComponent={OfflineSeparator}
        ListEmptyComponent={<OfflineEmptyState isCachingEnabled={isCachingEnabled} />}
        renderItem={({ item }) => (
          <OfflineRow item={item} isPlaying={isPlaying} onAddToPlaylist={openAddToPlaylist} />
        )}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: items.length === 0 ? 'center' : undefined,
          paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
      />
      {modal}
    </View>
  )
}
