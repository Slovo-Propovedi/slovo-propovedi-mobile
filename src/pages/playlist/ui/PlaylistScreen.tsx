import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useHistoryProgressMap, useHistorySermonIds } from 'entities/listening-history'
import { FAVORITES_PLAYLIST } from 'entities/playlist'
import { createTracksListStyles } from 'entities/track-list'
import { useTheme } from 'shared/ui/theme'
import { useCollapsingHeader } from '../lib/useCollapsingHeader'
import { usePlaylistActions } from '../lib/usePlaylistActions'
import { usePlaylistById } from '../lib/usePlaylistById'
import { usePlaylistHeader } from '../lib/usePlaylistHeader'
import { usePlaylistPlayerState } from '../lib/usePlaylistPlayerState'
import { PlaylistHeader } from './PlaylistHeader'
import { PlaylistStatusView } from './PlaylistStatusView'
import { PlaylistTrackItem } from './PlaylistTrackItem'
import { PlaylistTrackList } from './PlaylistTrackList'
import { createStyles } from './styles'
import { buildTracksListData, usePlaylistNavigationOptions } from './usePlaylistNavigationOptions'

const EMPTY_PLAYLIST = { artwork: null, description: '', id: 'default', sermons: [], title: '' }
const FAVORITES_EMPTY_MESSAGE = 'В избранном пока пусто'

export const PlaylistScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ playlist: string }>()

  const { isLoading, notFound, playlist: resolvedPlaylist } = usePlaylistById(params.playlist ?? '')
  const playlist = resolvedPlaylist ?? EMPTY_PLAYLIST

  const { artwork, description, sermons: list = [], title } = playlist

  const progressMap = useHistoryProgressMap()
  const historySermonIds = useHistorySermonIds()
  const { modal, openAddToPlaylist } = useAddToPlaylistModal()
  const { buildMenuActions, handlePressItem, handlePressPlayAll } = usePlaylistActions(
    list,
    playlist,
    historySermonIds,
    progressMap,
    openAddToPlaylist,
  )

  const { cacheTrigger, currentAudio, isPlaying } = usePlaylistPlayerState()

  const { headerImageHeight, imageOpacityStyle, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  const { headerIconColor, statusBarStyle } = usePlaylistHeader({
    scrollY,
    title,
    titleAppearThreshold,
  })

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
        currentAudioId={currentAudio?.id}
        menuActions={buildMenuActions(index)}
        storedProgress={progressMap.get(item.id ?? '')}
      />
    ),
    [buildMenuActions, cacheTrigger, currentAudio?.id, handlePressItem, isPlaying, progressMap],
  )

  usePlaylistNavigationOptions({ headerIconColor, playlist, title, tracksListData })

  const tracksListStyles = useMemo(() => createTracksListStyles(currentTheme), [currentTheme])

  const styles = useMemo(() => createStyles(currentTheme), [currentTheme])

  const ItemSeparator = useCallback(
    () => <View style={tracksListStyles.divider} />,
    [tracksListStyles],
  )

  if (notFound || isLoading)
    return (
      <PlaylistStatusView
        styles={styles}
        notFound={notFound}
        theme={currentTheme}
        statusBarStyle={statusBarStyle}
      />
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
        emptyMessage={playlist.id === FAVORITES_PLAYLIST.id ? FAVORITES_EMPTY_MESSAGE : undefined}
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
      {modal}
    </View>
  )
}
