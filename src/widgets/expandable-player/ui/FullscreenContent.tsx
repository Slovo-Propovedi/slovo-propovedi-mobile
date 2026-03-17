import { Entypo } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import React from 'react'
import { Pressable, Text, View, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  positionAtom,
} from 'features/sermon-player-controls'
import { usePlayer } from 'entities/player'
import { FullscreenPlayerControls } from 'entities/player/ui/FullscreenPlayerControls'
import { PlayerProgressBar } from 'entities/player/ui/PlayerProgressBar'
import { PlayerRepeatToggle } from 'entities/player/ui/PlayerRepeatToggle'
import { PlayerVolumeBar } from 'entities/player/ui/PlayerVolumeBar'
import { INDENTS } from 'shared/themed'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { styles } from './styles'

interface FullscreenContentProps {
  expanded: boolean
  fullStyle: AnimatedStyle<ViewStyle>
  insetsTop: number
  onClose: () => void
}

export const FullscreenContent = ({
  expanded,
  fullStyle,
  insetsTop,
  onClose,
}: FullscreenContentProps) => {
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { seekTo } = usePlayer()

  if (!audio) return null

  const trackInfoMarginTop = insetsTop + 60 + INDENTS.high

  return (
    <Animated.View
      style={[styles.fullContainer, fullStyle]}
      pointerEvents={expanded ? 'auto' : 'none'}
    >
      <Pressable onPress={onClose} style={[styles.closeButton, { top: insetsTop + INDENTS.low }]}>
        <Entypo name='chevron-down' style={styles.closeIcon} />
      </Pressable>
      <View style={[styles.trackInfoContainer, { marginTop: trackInfoMarginTop }]}>
        <MovingText animationThreshold={30} text={audio.title || ''} style={styles.trackTitle} />
        <Text style={styles.artistName}>{playlist?.title || 'Слово Истины'}</Text>
      </View>
      <View style={styles.progressContainer}>
        <PlayerProgressBar duration={duration} position={position} onSeek={p => void seekTo(p)} />
      </View>
      <View style={styles.controlsContainer}>
        <FullscreenPlayerControls />
      </View>
      <View style={styles.volumeContainer}>
        <PlayerVolumeBar />
      </View>
      <View style={styles.repeatContainer}>
        <PlayerRepeatToggle />
      </View>
    </Animated.View>
  )
}
