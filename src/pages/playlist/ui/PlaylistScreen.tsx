import { useAtom } from '@reatom/npm-react'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useHistoryProgressMap } from 'entities/listening-history'
import {
  currentAudioAtom,
  downloadingAudioUrlAtom,
  isPlayingAtom,
  usePlayNewSermon,
} from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { getParseJsonWithSchema, playlistDataSchema, type SermonData } from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import { createTracksListStyles } from 'shared/ui/track-list'
import { useCollapsingHeader, usePlaylistHeader } from '../lib'
import { isCachingPlaylistAtom } from '../model'
import { PlaylistHeader } from './PlaylistHeader'
import { PlaylistTrackItem } from './PlaylistTrackItem'
import { PlaylistTrackList } from './PlaylistTrackList'
import { createStyles } from './styles'
import { buildTracksListData, usePlaylistNavigationOptions } from './usePlaylistNavigationOptions'

const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)

const EMPTY_PLAYLIST = { artwork: null, description: '', id: 'default', sermons: [], title: '' }

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

  const tracksListData = useMemo(() => buildTracksListData(list, artwork), [list, artwork])

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

  const tracksListStyles = useMemo(() => createTracksListStyles(currentTheme), [currentTheme])

  const styles = useMemo(() => createStyles(currentTheme), [currentTheme])

  const ItemSeparator = useCallback(
    () => <View style={tracksListStyles.divider} />,
    [tracksListStyles],
  )

  return (
    <View style={styles.container}>
      <StatusBar style={statusBarStyle} />
      <PlaylistTrackList
        data={tracksListData}
        renderItem={renderItem}
        onScroll={scrollHandler}
        style={tracksListStyles.container}
        ItemSeparatorComponent={ItemSeparator}
        headerElement={
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
