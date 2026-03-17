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
import Animated, { runOnUI, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  closePlayerSheet,
  currentAudioAtom,
  currentPlaylistAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  openPlayerSheet,
} from 'features/sermon-player-controls'
import { usePlayer } from 'entities/player'
import { IMAGE_PLACEHOLDER } from 'shared/images'
import { COLORS } from 'shared/themed'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { MovingText } from 'shared/ui/MovingText/MovingText'
import { useExpandAnimation } from '../model/useExpandAnimation'
import { useMiniPanGesture } from '../model/useMiniPanGesture'
import { usePanGesture } from '../model/usePanGesture'
import { FullscreenContent } from './FullscreenContent'
import { styles } from './styles'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const ExpandablePlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const insets = useSafeAreaInsets()
  const [audio] = useAtom(currentAudioAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { pause, play } = usePlayer()
  const open = useAction(openPlayerSheet)
  const close = useAction(closePlayerSheet)
  const {
    backdropStyle,
    backgroundImageStyle,
    blurStyle,
    containerStyle,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
  } = useExpandAnimation(expanded)

  const pan = usePanGesture({ progress })
  const miniPan = useMiniPanGesture({ progress })
  const onPlayPause = async () => (playing ? pause() : play())

  const handleMiniTap = useCallback(() => {
    'worklet'
    runOnUI(() => (progress.value = withTiming(1, { duration: 300 })))()
    if (!expanded) void open()
  }, [expanded, open, progress])

  const handleCloseFullscreen = useCallback(() => {
    'worklet'
    runOnUI(() => (progress.value = withTiming(0, { duration: 250 })))()
    if (expanded) void close()
  }, [close, expanded, progress])

  if (!audio) return null

  return (
    <>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
      />

      {/* Mini player - swipe-up only gesture, taps pass to onPress */}
      <GestureDetector gesture={miniPan}>
        <AnimatedPressable onPress={handleMiniTap} style={[styles.miniContainer, miniStyle]}>
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
      </GestureDetector>
      {/* Container with background and fullscreen content */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, containerStyle, style]}>
          {/* Background */}
          <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
            <Image
              resizeMode='cover'
              style={styles.backgroundImage}
              source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
            />
            <Animated.View style={[styles.blurOverlay, blurStyle]}>
              <BlurView intensity={80} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.miniOverlay, miniOverlayStyle]} />

          {/* Fullscreen content for swipe-to-close */}
          <FullscreenContent
            expanded={expanded}
            fullStyle={fullStyle}
            insetsTop={insets.top}
            onClose={handleCloseFullscreen}
          />
        </Animated.View>
      </GestureDetector>
    </>
  )
}
