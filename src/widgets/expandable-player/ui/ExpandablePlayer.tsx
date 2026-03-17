import { Entypo } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React, { useCallback } from 'react'
import {
  Image,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  closePlayerSheet,
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  openPlayerSheet,
  positionAtom,
} from 'features/sermon-player-controls'
import { usePlayer } from 'entities/player'
import { FullscreenPlayerControls } from 'entities/player/ui/FullscreenPlayerControls'
import { PlayerProgressBar } from 'entities/player/ui/PlayerProgressBar'
import { PlayerRepeatToggle } from 'entities/player/ui/PlayerRepeatToggle'
import { PlayerVolumeBar } from 'entities/player/ui/PlayerVolumeBar'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { COLORS, INDENTS } from 'shared/themed'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { useExpandAnimation } from '../model/useExpandAnimation'
import { usePanGesture } from '../model/usePanGesture'
import { styles } from './styles'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const ExpandablePlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const insets = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { pause, play, seekTo } = usePlayer()
  const open = useAction(openPlayerSheet)
  const close = useAction(closePlayerSheet)
  const { backdropStyle, blurStyle, containerStyle, fullStyle, miniStyle, progress } =
    useExpandAnimation(expanded)
  const trackInfoMarginTop = insets.top + 60 + INDENTS.high
  const onPlayPause = useCallback(async () => (playing ? pause() : play()), [playing, pause, play])
  const onSeek = useCallback((p: number) => void seekTo(p), [seekTo])
  const doClose = useCallback(() => void close(), [close])
  const pan = usePanGesture({ onClose: close, progress })
  if (!audio) return null
  return (
    <>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
      />
      <Animated.View style={[styles.container, containerStyle, style]}>
        <Image
          resizeMode='cover'
          style={styles.backgroundImage}
          source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
        />
        <Animated.View style={[styles.blurOverlay, blurStyle]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <AnimatedPressable onPress={() => void open()} style={[styles.miniContainer, miniStyle]}>
          <Image style={styles.miniCover} source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }} />
          <View style={styles.miniTextContainer}>
            <MovingText text={audio.title || ''} style={styles.miniTrackTitle} />
            <Text numberOfLines={1} style={styles.miniPlaylistName}>
              {playlist?.title || 'Слово Истины'}
            </Text>
          </View>
          <View style={styles.miniControls}>
            <PlayerControlButton
              size={36}
              color={COLORS.white}
              onPress={onPlayPause}
              type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
            />
          </View>
        </AnimatedPressable>
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.fullContainer, fullStyle]}
            pointerEvents={expanded ? 'auto' : 'none'}
          >
            <Pressable
              onPress={doClose}
              style={[styles.closeButton, { top: insets.top + INDENTS.low }]}
            >
              <Entypo name='chevron-down' style={styles.closeIcon} />
            </Pressable>
            <View style={[styles.trackInfoContainer, { marginTop: trackInfoMarginTop }]}>
              <MovingText
                animationThreshold={30}
                text={audio.title || ''}
                style={styles.trackTitle}
              />
              <Text style={styles.artistName}>{playlist?.title || 'Слово Истины'}</Text>
            </View>
            <View style={styles.progressContainer}>
              <PlayerProgressBar onSeek={onSeek} duration={duration} position={position} />
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
        </GestureDetector>
      </Animated.View>
    </>
  )
}
