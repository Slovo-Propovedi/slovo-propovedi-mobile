import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { usePlayNewSermon } from 'features/sermon-player-controls/lib/usePlaySermon'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isPlayingAtom,
  openPlayerSheet,
} from 'features/sermon-player-controls/model'
import { usePlayer } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { styles } from './styles'

export const FloatingPlayer = () => {
  const [currentAudio] = useAtom(currentAudioAtom)
  const [currentPlaylist] = useAtom(currentPlaylistAtom)
  const [isPlaying] = useAtom(isPlayingAtom)
  const { pause, play } = usePlayer()
  const playNewSermon = usePlayNewSermon()
  const handleOpenSheet = useAction(openPlayerSheet)

  // Calculate current index and has next
  const currentIndex = currentPlaylist?.list?.findIndex(item => item.id === currentAudio?.id) ?? -1
  const hasNext = currentPlaylist?.list && currentIndex < currentPlaylist.list.length - 1

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) await pause()
    else await play()
  }, [isPlaying, pause, play])

  const handleNext = useCallback(async () => {
    if (!hasNext || !currentPlaylist?.list || !currentAudio) return
    const nextTrack = currentPlaylist.list[currentIndex + 1]
    await playNewSermon({ playlist: currentPlaylist, sermon: nextTrack })
  }, [hasNext, currentPlaylist, currentIndex, currentAudio, playNewSermon])

  const handlePress = useCallback(() => {
    void handleOpenSheet()
  }, [handleOpenSheet])

  if (!currentAudio) return null

  const playlistName = currentPlaylist?.title || 'Слово Истины'

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Image style={styles.albumArt} source={{ uri: currentAudio.artwork || IMAGE_PLACEHOLDER }} />
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.playlistName}>
          {playlistName}
        </Text>
        <MovingText style={styles.trackTitle} text={currentAudio.title || ''} />
      </View>
      <View style={styles.controls}>
        <PlayerControlButton
          size={36}
          color='#fff'
          onPress={handlePlayPause}
          type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
        />
        {hasNext && (
          <PlayerControlButton
            size={28}
            color='#fff'
            onPress={handleNext}
            type={PlayerControlButtonType.Next}
          />
        )}
      </View>
    </Pressable>
  )
}
