import { useAtom } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { getEntrySermon, historyAtom, isHistoryLoadedAtom } from 'entities/listening-history'
import { currentAudioAtom, isPlayingAtom } from 'entities/player'
import { createTracksListStyles, TracksListSkeleton } from 'entities/track-list'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { HistoryHeaderMenu } from './HistoryHeaderMenu'
import { HistoryRow } from './HistoryRow'
import { HistorySeparator } from './HistorySeparator'

const styles = StyleSheet.create({
  skeletonList: {
    paddingTop: INDENTS.low,
  },
  skeletonRow: {
    marginHorizontal: INDENTS.medium,
  },
})

export const HistoryScreen = () => {
  const { currentTheme } = useTheme()
  const navigation = useNavigation()
  const [entries] = useAtom(historyAtom)
  const [isHistoryLoaded] = useAtom(isHistoryLoadedAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const tracksListStyles = createTracksListStyles(currentTheme)
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HistoryHeaderMenu /> })
    return () => {
      navigation.setOptions({ headerRight: undefined })
    }
  }, [navigation])

  if (!isHistoryLoaded && entries.length === 0)
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
        data={entries}
        ItemSeparatorComponent={HistorySeparator}
        keyExtractor={item => getEntrySermon(item)?.id ?? `${item.lastPlayedAt}`}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: entries.length === 0 ? 'center' : undefined,
          paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
        ListEmptyComponent={
          <Text
            style={{
              color: currentTheme.textMuted,
              flex: 1,
              fontSize: FONT_SIZES.lg,
              textAlign: 'center',
            }}
          >
            История пуста
          </Text>
        }
        renderItem={({ item }) => {
          const sermonId = getEntrySermon(item)?.id
          const isCurrentAudio = sermonId !== undefined && currentAudio?.id === sermonId
          return (
            <HistoryRow
              entry={item}
              isPlaying={isCurrentAudio}
              onAddToPlaylist={openAddToPlaylist}
              isAudioPlaying={isCurrentAudio && isPlaying}
            />
          )
        }}
      />
      {modal}
    </View>
  )
}
