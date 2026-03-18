import { useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { COLORS, INDENTS, PLAYER_SIZES } from 'shared/ui/themed'
import type { StyleProp, ViewStyle } from 'react-native'
import { usePlayer } from '../lib/usePlayer'
import { usePlayerState } from '../lib/usePlayerState'
import { usePlayNewSermon } from '../lib/usePlaySermon'
import { useSeekControls } from '../lib/useSeekControls'
import { currentAudioAtom, currentPlaylistAtom, isBufferingAtom, isPlayingAtom } from '../model'

interface FullscreenPlayerControlsProps {
  style?: StyleProp<ViewStyle>
}

export const FullscreenPlayerControls = ({ style }: FullscreenPlayerControlsProps) => {
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const { pause, play, seekTo } = usePlayer()
  const { duration, position } = usePlayerState()
  const playNewSermon = usePlayNewSermon()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })

  const buttonSize = PLAYER_SIZES.controlButtonSize
  const playButtonSize = buttonSize * 2

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) await pause()
    else await play()
  }, [isPlaying, pause, play])

  // Find current index in playlist
  const currentIndex = currentPlaylist?.list?.findIndex(item => item.id === currentAudio?.id) ?? -1
  const hasPrevious = currentIndex > 0
  const hasNext = currentPlaylist?.list && currentIndex < currentPlaylist.list.length - 1

  const handlePrevious = useCallback(async () => {
    if (!hasPrevious || !currentPlaylist?.list) return
    const prevTrack = currentPlaylist.list[currentIndex - 1]
    await playNewSermon({ playlist: currentPlaylist, sermon: prevTrack })
  }, [hasPrevious, currentPlaylist, currentIndex, playNewSermon])

  const handleNext = useCallback(async () => {
    if (!hasNext || !currentPlaylist?.list) return
    const nextTrack = currentPlaylist.list[currentIndex + 1]
    await playNewSermon({ playlist: currentPlaylist, sermon: nextTrack })
  }, [hasNext, currentPlaylist, currentIndex, playNewSermon])

  return (
    <View style={[styles.container, style]}>
      {/* Previous button - invisible but takes space if no previous */}
      <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
        {hasPrevious && (
          <PlayerControlButton
            size={buttonSize}
            color={COLORS.white}
            onPressOut={stopSeek}
            onPress={handlePrevious}
            type={PlayerControlButtonType.Prev}
            onLongPress={() => startSeek('backward')}
          />
        )}
      </View>

      {/* Play/Pause button */}
      <View style={[styles.playButtonWrapper, { height: playButtonSize, width: playButtonSize }]}>
        {isBuffering ? (
          <ActivityIndicator size='large' color={COLORS.white} />
        ) : (
          <PlayerControlButton
            color={COLORS.white}
            size={playButtonSize}
            onPress={handlePlayPause}
            type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
          />
        )}
      </View>

      {/* Next button - invisible but takes space if no next */}
      <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
        {hasNext && (
          <PlayerControlButton
            size={buttonSize}
            color={COLORS.white}
            onPress={handleNext}
            onPressOut={stopSeek}
            type={PlayerControlButtonType.Next}
            onLongPress={() => startSeek('forward')}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: INDENTS.medium,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: INDENTS.high,
  },
})
