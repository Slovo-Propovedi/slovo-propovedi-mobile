import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS } from 'shared/ui/themed'
import type { AudioPlayerData } from 'entities/player'
import { styles } from './AnimatedPlayer.styles'

interface MiniPlayerContentProps {
  audio: AudioPlayerData
  isPlaying: boolean
  onTogglePlay: () => void
  playlistTitle?: string
}

export const MiniPlayerContent = ({
  audio,
  isPlaying,
  onTogglePlay,
  playlistTitle,
}: MiniPlayerContentProps) => (
  <View style={styles.miniOverlay}>
    <Image
      style={styles.miniPreviewImage}
      source={{ uri: audio.previewUrl || IMAGE_PLACEHOLDER }}
    />
    <View style={styles.miniTextContainer}>
      <Text numberOfLines={1} style={styles.miniTitle}>
        {audio.title}
      </Text>
      {playlistTitle && audio.title !== playlistTitle && (
        <Text numberOfLines={1} style={styles.miniSubtitle}>
          {playlistTitle}
        </Text>
      )}
    </View>
    <TouchableOpacity onPress={onTogglePlay} style={styles.miniPlayButton}>
      <Feather size={24} color={COLORS.black} name={isPlaying ? 'pause' : 'play'} />
    </TouchableOpacity>
  </View>
)
