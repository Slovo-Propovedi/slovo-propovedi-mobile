import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native'
import { type AudioPlayerData, PlayerListenProgress, SermonPlayerControls } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS } from 'shared/ui/themed'
import { styles } from './AnimatedPlayer.styles'
import { MiniPlayerContent } from './MiniPlayerContent'

interface FullscreenPlayerProps {
  animatedStyles: {
    borderRadius: Animated.AnimatedInterpolation<number>
    bottom: Animated.AnimatedInterpolation<number>
    height: Animated.AnimatedInterpolation<number>
    left: Animated.AnimatedInterpolation<number>
    right: Animated.AnimatedInterpolation<number>
    width: Animated.AnimatedInterpolation<number>
  }
  audio: AudioPlayerData
  contentOpacity: Animated.AnimatedInterpolation<number>
  isPlaying: boolean
  isShowPlaylistButtonDisabled: boolean
  miniContentOpacity: Animated.AnimatedInterpolation<number>
  onClose: () => void
  onOpenPlaylist: () => void
  onTogglePlay: () => void
  playlistTitle?: string
}

export const FullscreenPlayer = ({
  animatedStyles,
  audio,
  contentOpacity,
  isPlaying,
  isShowPlaylistButtonDisabled,
  miniContentOpacity,
  onClose,
  onOpenPlaylist,
  onTogglePlay,
  playlistTitle,
}: FullscreenPlayerProps) => (
  <Animated.View
    style={[
      styles.fullscreenContainer,
      {
        borderRadius: animatedStyles.borderRadius,
        bottom: animatedStyles.bottom,
        height: animatedStyles.height,
        left: animatedStyles.left,
        right: animatedStyles.right,
        width: animatedStyles.width,
      },
    ]}
  >
    <Animated.View style={[styles.miniContentOverlay, { opacity: miniContentOpacity }]}>
      <MiniPlayerContent
        audio={audio}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        playlistTitle={playlistTitle}
      />
    </Animated.View>

    <Animated.View style={[styles.fullscreenContent, { opacity: contentOpacity }]}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Feather name='x' size={32} color={COLORS.black} />
      </TouchableOpacity>

      <View style={styles.fullscreenInnerContent}>
        <Image
          style={styles.fullscreenPreview}
          source={{ uri: audio.previewUrl || IMAGE_PLACEHOLDER }}
        />

        <View style={styles.spacer} />

        <View style={styles.fullscreenBottomContent}>
          <Text style={styles.fullscreenTitle}>{audio.title}</Text>
          <PlayerListenProgress />
          <SermonPlayerControls style={styles.fullscreenControls} />
          <View style={styles.mediaButtons}>
            <View />
            <View />
            <TouchableOpacity onPress={onOpenPlaylist} disabled={isShowPlaylistButtonDisabled}>
              <Feather
                size={35}
                name='list'
                color={isShowPlaylistButtonDisabled ? COLORS.disabled : COLORS.black}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  </Animated.View>
)
