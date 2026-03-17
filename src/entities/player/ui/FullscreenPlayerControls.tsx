import { useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls/lib/usePlaySermon'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isBufferingAtom,
  isPlayingAtom,
} from 'features/sermon-player-controls/model'
import { COLORS, PLAYER_SIZES } from 'shared/themed'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import type { StyleProp, ViewStyle } from 'react-native'
import { usePlayer } from '../lib/usePlayer'

interface FullscreenPlayerControlsProps {
  style?: StyleProp<ViewStyle>
}

export const FullscreenPlayerControls = ({ style }: FullscreenPlayerControlsProps) => {
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const { pause, play } = usePlayer()
  const playNewSermon = usePlayNewSermon()

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
      <View style={styles.buttonWrapper}>
        {hasPrevious && (
          <PlayerControlButton
            color={COLORS.white}
            onPress={handlePrevious}
            type={PlayerControlButtonType.Prev}
            size={PLAYER_SIZES.controlButtonSize}
          />
        )}
      </View>

      {/* Play/Pause button */}
      {isBuffering ? (
        <View style={styles.playButtonWrapper}>
          <ActivityIndicator size='large' color={COLORS.white} />
        </View>
      ) : (
        <PlayerControlButton
          color={COLORS.white}
          onPress={handlePlayPause}
          size={PLAYER_SIZES.controlButtonSize * 2}
          type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
        />
      )}

      {/* Next button - invisible but takes space if no next */}
      <View style={styles.buttonWrapper}>
        {hasNext && (
          <PlayerControlButton
            color={COLORS.white}
            onPress={handleNext}
            type={PlayerControlButtonType.Next}
            size={PLAYER_SIZES.controlButtonSize}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    height: PLAYER_SIZES.controlButtonSize,
    justifyContent: 'center',
    width: PLAYER_SIZES.controlButtonSize,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButtonWrapper: {
    alignItems: 'center',
    height: PLAYER_SIZES.controlButtonSize * 2,
    justifyContent: 'center',
    width: PLAYER_SIZES.controlButtonSize * 2,
  },
})
