import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo } from 'react'
import { Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useHistoryProgressMap } from 'entities/listening-history'
import {
  currentAudioAtom,
  downloadingAudioUrlAtom,
  isPlayingAtom,
  usePlayNewSermon,
} from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { getParseJsonWithSchema, playlistDataSchema, type SermonData } from 'shared/model'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import { createTracksListStyles } from 'shared/ui/track-list'
import { useCollapsingHeader, usePlaylistHeader } from '../lib'
import { isCachingPlaylistAtom } from '../model'
import { PlaylistHeader } from './PlaylistHeader'
import { PlaylistTrackItem } from './PlaylistTrackItem'
import { createStyles } from './styles'
import { buildTracksListData, usePlaylistNavigationOptions } from './usePlaylistNavigationOptions'

const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)

const EMPTY_PLAYLIST = { artwork: '', description: '', id: 'default', sermons: [], title: '' }

export const PlaylistScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ playlist: string }>()

  const playlist = useMemo(
    () => parsePlaylistData(params.playlist) || EMPTY_PLAYLIST,
    [params.playlist],
  )

  const { artwork, description, sermons: list = [], title } = playlist

  const playNewSermon = usePlayNewSermon()
  const progressMap = useHistoryProgressMap()

  const [currentAudio] = useAtom(currentAudioAtom)
  const [downloadingUrl] = useAtom(downloadingAudioUrlAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isCaching] = useAtom(isCachingPlaylistAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)

  const { headerImageHeight, imageOpacityStyle, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  const { headerIconColor, statusBarStyle } = usePlaylistHeader({
    scrollY,
    title,
    titleAppearThreshold,
  })

  const handlePressItem = useCallback(
    async (index: number) => {
      const sermon = list[index]
      if (!sermon.audioUrl) return
      await playNewSermon({ playlist, sermon })
    },
    [list, playNewSermon, playlist],
  )

  const handlePressPlayAll = useCallback(async () => {
    const firstSermon = list.find((s: SermonData) => s.audioUrl)
    if (!firstSermon) return
    await playNewSermon({ playlist, sermon: firstSermon })
  }, [list, playNewSermon, playlist])

  const tracksListData = buildTracksListData(list, artwork)

  const renderItem = useCallback(
    ({ index, item }: { index: number; item: (typeof tracksListData)[number] }) => (
      <PlaylistTrackItem
        id={item.id}
        index={index}
        title={item.title}
        isPlaying={isPlaying}
        artwork={item.artwork}
        audioUrl={item.audioUrl}
        subtitle={item.subtitle}
        onPress={handlePressItem}
        cacheTrigger={cacheTrigger}
        downloadingUrl={downloadingUrl}
        currentAudioId={currentAudio?.id}
        storedProgress={progressMap.get(item.id ?? '')}
      />
    ),
    [cacheTrigger, currentAudio?.id, downloadingUrl, handlePressItem, isPlaying, progressMap],
  )

  usePlaylistNavigationOptions({ headerIconColor, isCaching, title, tracksListData })

  const tracksListStyles = createTracksListStyles(currentTheme)

  return (
    <View style={createStyles(currentTheme).container}>
      <StatusBar style={statusBarStyle} />
      <Animated.FlatList
        data={tracksListData}
        renderItem={renderItem}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={tracksListStyles.container}
        keyExtractor={item => item.id ?? ''}
        ItemSeparatorComponent={() => <View style={tracksListStyles.divider} />}
        ListEmptyComponent={
          <Text style={{ marginHorizontal: 'auto' }}>В плейлисте нет записей</Text>
        }
        contentContainerStyle={{
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
        ListHeaderComponent={
          <PlaylistHeader
            title={title}
            artwork={artwork}
            theme={currentTheme}
            description={description}
            onPressPlayAll={handlePressPlayAll}
            headerImageHeight={headerImageHeight}
            imageOpacityStyle={imageOpacityStyle}
          />
        }
      />
    </View>
  )
}
