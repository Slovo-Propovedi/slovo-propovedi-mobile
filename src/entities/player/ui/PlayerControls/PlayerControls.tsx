/* eslint-disable max-lines -- FIXME: refactor */
import { useAtom } from '@reatom/npm-react'
import React, { useCallback, useEffect } from 'react'
import { AppState, type AppStateStatus, type StyleProp, type ViewStyle } from 'react-native'
import { isNonNullable } from 'shared/lib/utils'
import type { AudioPlayerData, ControlsNames } from '../PlayerControls.types'
import type { PlaylistData } from 'shared/model'
import { downloadingAudioUrlAtom, isDownloadingAtom } from '../../lib/download-model'
import { usePlayer } from '../../lib/usePlayer'
import { usePlayerState } from '../../lib/usePlayerState'
import { FullscreenControls } from '../FullscreenControls'
import { getIndexOfCurrentAudioInPlaylist } from '../getIndexOfCurrentAudioInPlaylist'
import { PlayerControlsSize } from '../PlayerControls.types'
import { DefaultControls } from './DefaultControls'

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
  excludeButtons?: ControlsNames[]
  onLongPressSeek?: (direction: 'backward' | 'forward') => void
  onPressOutSeek?: () => void
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  variant?: PlayerControlsVariant
}

type PlayerControlsVariant = 'default' | 'fullscreen'

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  excludeButtons,
  onLongPressSeek,
  onPressOutSeek,
  setCurrentAudio,
  size = PlayerControlsSize.Large,
  style,
  variant = 'default',
}: PlayerControlsProps) => {
  const { getStatus, pause, play, replaceAudio, setLockScreenMetadata } = usePlayer()
  const { isBuffering, isPlaying } = usePlayerState()
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const index = getIndexOfCurrentAudioInPlaylist(currentAudio, currentPlaylist)
  const playlistList = currentPlaylist ? currentPlaylist.sermons : []
  const hasValidPlaylist = isNonNullable(currentPlaylist) && isNonNullable(index)
  const isLastTrack = hasValidPlaylist && index === playlistList.length - 1
  const isFirstTrack = hasValidPlaylist && index === 0

  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === currentAudio?.audioUrl

  const isFullscreen = variant === 'fullscreen'
  const buttonSize = isFullscreen ? 24 : size // PLAYER_SIZES.controlButtonSize = FONT_SIZES.xxl = 24
  const playButtonSize = buttonSize * 2

  const togglePlay = async () => (isPlaying ? await pause() : await play())
  const toggleTrack = useCallback(
    async (dir: 'next' | 'prev') => {
      if (!hasValidPlaylist || !currentPlaylist || index === undefined) return
      const newIndex = dir === 'next' ? index + 1 : index - 1
      const track = playlistList[newIndex]
      if (!track?.audioUrl) return
      const { audioUrl, id, title, ...rest } = track
      const newAudio: AudioPlayerData = {
        ...rest,
        artwork: currentPlaylist.artwork,
        audioUrl,
        id,
        title,
      }
      await setCurrentAudio(newAudio)
      await replaceAudio(newAudio.audioUrl)
      setLockScreenMetadata({
        albumTitle: currentPlaylist.title,
        artist: newAudio.artist,
        artworkUrl: newAudio.artwork,
        title: newAudio.title,
      })
      try {
        await play()
      } catch (error) {
        if (error instanceof Error && error.message.includes('activity is no longer available'))
          console.warn('[Player] Ignoring AppState-related error:', error.message)
        else throw error
      }
    },
    [
      hasValidPlaylist,
      currentPlaylist,
      index,
      setCurrentAudio,
      replaceAudio,
      play,
      setLockScreenMetadata,
    ],
  )

  useEffect(() => {
    let appState = AppState.currentState

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App returning from background - sync media session
        const audioStatus = await getStatus()
        if (currentAudio && audioStatus.isPlaying)
          setLockScreenMetadata({
            albumTitle: currentPlaylist?.title,
            artist: currentAudio.artist,
            artworkUrl: currentAudio.artwork,
            title: currentAudio.title,
          })
      }
      appState = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [currentAudio, currentPlaylist, getStatus, setLockScreenMetadata])

  const isPrevDisabled = !hasValidPlaylist || isFirstTrack || !currentAudio
  const isNextDisabled = !hasValidPlaylist || isLastTrack || !currentAudio

  if (isFullscreen)
    return (
      <FullscreenControls
        style={style}
        isPlaying={isPlaying}
        buttonSize={buttonSize}
        togglePlay={togglePlay}
        isBuffering={isBuffering}
        toggleTrack={toggleTrack}
        excludeButtons={excludeButtons}
        isNextDisabled={isNextDisabled}
        isPrevDisabled={isPrevDisabled}
        onPressOutSeek={onPressOutSeek}
        playButtonSize={playButtonSize}
        onLongPressSeek={onLongPressSeek}
        isDownloading={isCurrentAudioDownloading}
      />
    )

  return (
    <DefaultControls
      size={size}
      style={style}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      isBuffering={isBuffering}
      toggleTrack={toggleTrack}
      excludeButtons={excludeButtons}
      isNextDisabled={isNextDisabled}
      isPrevDisabled={isPrevDisabled}
      hasCurrentAudio={!!currentAudio}
      isDownloading={isCurrentAudioDownloading}
    />
  )
}
