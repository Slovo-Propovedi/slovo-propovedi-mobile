/* eslint-disable max-lines -- Complex component with multiple variants */
import { useAtom } from '@reatom/npm-react'
import React, { useCallback, useEffect, useRef } from 'react'
import { isNonNullable } from 'shared/lib/utils'
import type { AudioPlayerData, ControlsNames } from './PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaylistData } from 'shared/model'
import { downloadingAudioUrlAtom, isDownloadingAtom } from '../lib/download-model'
import { usePlayer } from '../lib/usePlayer'
import { usePlayerState } from '../lib/usePlayerState'
import { useTrackEndHandler } from '../lib/useTrackEndHandler'
import { repeatModeAtom } from '../model'
import { DefaultControls } from './DefaultControls'
import { FullscreenControls } from './FullscreenControls'
import { getIndexOfCurrentAudioInPlaylist } from './getIndexOfCurrentAudioInPlaylist'
import { PlayerControlsSize } from './PlayerControls.types'

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
  const { loadAudio, onTrackEndSetter, pause, play, seekTo } = usePlayer()
  const { isBuffering, isPlaying } = usePlayerState()
  const [repeatMode] = useAtom(repeatModeAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const index = getIndexOfCurrentAudioInPlaylist(currentAudio, currentPlaylist)
  const hasValidPlaylist = isNonNullable(currentPlaylist) && isNonNullable(index)
  const isLastTrack = hasValidPlaylist && index === currentPlaylist.list.length - 1
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
      const track = currentPlaylist.list[newIndex]
      if (!track?.audioUrl) return
      const { audioUrl, ...rest } = track
      const newAudio = {
        ...rest,
        artwork: currentPlaylist.previewUrl,
        audioUrl,
        previewUrl: currentPlaylist.previewUrl,
      }
      await setCurrentAudio(newAudio)
      await loadAudio(newAudio.audioUrl)
      await play()
    },
    [hasValidPlaylist, currentPlaylist, index, setCurrentAudio, loadAudio, play],
  )

  const handleTrackEnd = useTrackEndHandler({
    currentPlaylist,
    hasValidPlaylist,
    indexOfCurrentAudio: index,
    isLastTrack,
    loadAudio,
    pause,
    play,
    repeatMode,
    seekTo,
    setCurrentAudio,
    toggleTrack,
  })
  const ref = useRef(handleTrackEnd)
  ref.current = handleTrackEnd

  useEffect(() => {
    onTrackEndSetter(() => void ref.current())
    return () => void onTrackEndSetter(undefined)
  }, [onTrackEndSetter])

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
