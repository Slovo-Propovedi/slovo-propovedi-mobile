import { BlurView } from 'expo-blur'
import React from 'react'
import { Animated, TouchableOpacity } from 'react-native'
import type { AudioPlayerData } from 'entities/player'
import { styles } from './AnimatedPlayer.styles'
import { MiniPlayerContent } from './MiniPlayerContent'

interface MiniPlayerProps {
  audio: AudioPlayerData
  isPlaying: boolean
  onPress: () => void
  onTogglePlay: () => void
  opacity: Animated.AnimatedInterpolation<number>
  playlistTitle?: string
}

export const MiniPlayer = ({
  audio,
  isPlaying,
  onPress,
  onTogglePlay,
  opacity,
  playlistTitle,
}: MiniPlayerProps) => (
  <Animated.View style={[styles.miniPlayerContainer, { opacity }]}>
    <BlurView tint='light' intensity={60} style={styles.blurContainer}>
      <TouchableOpacity onPress={onPress} style={styles.miniPlayerTouchable}>
        <MiniPlayerContent
          audio={audio}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          playlistTitle={playlistTitle}
        />
      </TouchableOpacity>
    </BlurView>
  </Animated.View>
)
