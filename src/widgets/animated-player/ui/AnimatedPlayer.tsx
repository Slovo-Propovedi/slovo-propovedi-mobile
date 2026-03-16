import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { currentAudioAtom, currentPlaylistAtom } from 'features/sermon-player-controls'
import { usePlayer, usePlayerState } from 'entities/player'
import { isPlayerFullscreenAtom, setPlayerFullscreen } from 'shared/model'
import { useListenNavigation } from 'shared/routing'
import { usePlayerAnimation } from '../model/usePlayerAnimation'
import { FullscreenPlayer } from './FullscreenPlayer'
import { MiniPlayer } from './MiniPlayer'

export const AnimatedPlayer = () => {
  const { navigateToPlaylist } = useListenNavigation()
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const { pause, play } = usePlayer()
  const { isPlaying } = usePlayerState()

  const [isFullscreen] = useAtom(isPlayerFullscreenAtom)
  const setFullscreen = useAction(setPlayerFullscreen)

  const {
    contentOpacity,
    fullscreenBorderRadius,
    fullscreenBottom,
    fullscreenHeight,
    fullscreenLeft,
    fullscreenRight,
    fullscreenWidth,
    miniContentOpacity,
    miniPlayerOpacity,
    shouldRenderFullscreen,
  } = usePlayerAnimation({ isFullscreen })

  const isDisabledShowPlaylistButton = !currentPlaylist || currentPlaylist.list.length < 2

  const onPressMiniPlayer = useCallback(() => {
    void setFullscreen(true)
  }, [setFullscreen])

  const onPressClose = useCallback(() => {
    void setFullscreen(false)
  }, [setFullscreen])

  const onPressListItem = useCallback(() => {
    if (!currentPlaylist) return
    void setFullscreen(false)
    setTimeout(() => {
      navigateToPlaylist(currentPlaylist)
    }, 400)
  }, [currentPlaylist, navigateToPlaylist, setFullscreen])

  const togglePlay = useCallback(async () => {
    if (isPlaying) await pause()
    else await play()
  }, [isPlaying, pause, play])

  if (!currentAudio) return null

  const playlistTitle = currentPlaylist?.title

  return (
    <>
      <MiniPlayer
        audio={currentAudio}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        opacity={miniPlayerOpacity}
        onPress={onPressMiniPlayer}
        playlistTitle={playlistTitle}
      />

      {shouldRenderFullscreen && (
        <FullscreenPlayer
          audio={currentAudio}
          isPlaying={isPlaying}
          onClose={onPressClose}
          onTogglePlay={togglePlay}
          playlistTitle={playlistTitle}
          contentOpacity={contentOpacity}
          onOpenPlaylist={onPressListItem}
          miniContentOpacity={miniContentOpacity}
          isShowPlaylistButtonDisabled={isDisabledShowPlaylistButton}
          animatedStyles={{
            borderRadius: fullscreenBorderRadius,
            bottom: fullscreenBottom,
            height: fullscreenHeight,
            left: fullscreenLeft,
            right: fullscreenRight,
            width: fullscreenWidth,
          }}
        />
      )}
    </>
  )
}
