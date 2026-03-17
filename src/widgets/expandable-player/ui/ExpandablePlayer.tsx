import { useAction, useAtom } from '@reatom/npm-react'
import { BlurView } from 'expo-blur'
import React from 'react'
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
  const onPlayPause = async () => (playing ? pause() : play())

  if (!audio) return null

  return (
    <>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
      />
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

          {/* Mini player - uses normal onPress (pan gesture only activates on drag) */}
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

          {/* Fullscreen content for swipe-to-close */}
          <FullscreenContent
            expanded={expanded}
            fullStyle={fullStyle}
            insetsTop={insets.top}
            onClose={() => void close()}
          />
        </Animated.View>
      </GestureDetector>
    </>
  )
}
