import { StatusBar } from 'expo-status-bar'
import { useMemo } from 'react'
import { View } from 'react-native'
import { useHistoryProgressMap, useHistorySermonIds } from 'entities/listening-history'
import { FAVORITES_PLAYLIST } from 'entities/playlist'
import { createTracksListStyles } from 'entities/track-list'
import { useScreenTransitionTracking } from 'shared/routing'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { useCollapsingHeader } from '../lib/useCollapsingHeader'
import { usePlaylistAddToPlaylist } from '../lib/usePlaylistAddToPlaylist'
import { usePlaylistHeader } from '../lib/usePlaylistHeader'
import { usePlaylistPlaybackTarget } from '../lib/usePlaylistPlaybackTarget'
import { usePlaylistPlayerState } from '../lib/usePlaylistPlayerState'
import { usePlaylistScreenSource } from '../lib/usePlaylistScreenSource'
import { usePlaylistTrackActions } from '../lib/usePlaylistTrackActions'
import { PlaylistHeader } from './PlaylistHeader'
import { PlaylistStatusView } from './PlaylistStatusView'
import { PlaylistTrackList } from './PlaylistTrackList'
import { PlaylistTrackSeparator } from './PlaylistTrackSeparator'
import { createStyles } from './styles'
import { usePlaylistItemRenderer } from './usePlaylistItemRenderer'
import { buildTracksListData, usePlaylistNavigationOptions } from './usePlaylistNavigationOptions'

const EMPTY_PLAYLIST = { artwork: null, description: '', id: 'default', sermons: [], title: '' }

export const PlaylistScreen = () => {
  useScreenTransitionTracking()
  const { currentTheme } = useTheme()
  const {
    isImportingCustomPlaylist,
    isLoading,
    notFound,
    playlist: resolvedPlaylist,
  } = usePlaylistScreenSource()
  const playlist = resolvedPlaylist ?? EMPTY_PLAYLIST

  const { artwork, description, sermons: list = [], title } = playlist

  const progressMap = useHistoryProgressMap()
  const historySermonIds = useHistorySermonIds()
  const { modal, openAddAllToPlaylist, openAddToPlaylist } = usePlaylistAddToPlaylist()
  const { bindRowMenu, buildMenuActions, handlePressItem, handlePressPlayAll, renderDialog } =
    usePlaylistTrackActions(list, playlist, historySermonIds, progressMap, openAddToPlaylist)

  const { cacheTrigger, currentAudio, isPlaying } = usePlaylistPlayerState()

  const { label: playAllLabel, target: playAllTarget } = usePlaylistPlaybackTarget(playlist)

  const { headerImageHeight, imageOpacityStyle, scrollHandler, scrollY, titleAppearThreshold } =
    useCollapsingHeader()

  const { headerIconColor, statusBarStyle } = usePlaylistHeader({
    scrollY,
    title,
    titleAppearThreshold,
  })

  const tracksListData = useMemo(() => buildTracksListData(list, artwork), [list, artwork])

  const renderItem = usePlaylistItemRenderer({
    bindRowMenu,
    buildMenuActions,
    cacheTrigger,
    currentAudioId: currentAudio?.id,
    handlePressItem,
    isPlaying,
    progressMap,
  })

  usePlaylistNavigationOptions({
    headerIconColor,
    onAddAllToPlaylist: openAddAllToPlaylist,
    playlist,
    title,
    tracksListData,
  })

  const tracksListStyles = useMemo(() => createTracksListStyles(currentTheme), [currentTheme])
  const styles = useMemo(() => createStyles(currentTheme), [currentTheme])

  if (isImportingCustomPlaylist || isLoading || notFound)
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlist}>
        <PlaylistStatusView
          styles={styles}
          theme={currentTheme}
          statusBarStyle={statusBarStyle}
          notFound={!isImportingCustomPlaylist && notFound}
        />
      </BlurBackdrop>
    )

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.playlist}>
      <View style={styles.container}>
        <StatusBar style={statusBarStyle} />
        <PlaylistTrackList
          data={tracksListData}
          renderItem={renderItem}
          onScroll={scrollHandler}
          style={tracksListStyles.container}
          ItemSeparatorComponent={PlaylistTrackSeparator}
          emptyMessage={
            playlist.id === FAVORITES_PLAYLIST.id ? 'В избранном пока пусто' : undefined
          }
          headerElement={
            <PlaylistHeader
              title={title}
              artwork={artwork}
              theme={currentTheme}
              description={description}
              playAllLabel={playAllLabel}
              headerImageHeight={headerImageHeight}
              imageOpacityStyle={imageOpacityStyle}
              isPlayAllDisabled={playAllTarget === null}
              onPressPlayAll={() => void handlePressPlayAll(playAllTarget ?? undefined)}
            />
          }
        />
        {modal}
        {renderDialog()}
      </View>
    </BlurBackdrop>
  )
}
