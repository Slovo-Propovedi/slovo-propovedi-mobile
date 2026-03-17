import { useAction, useAtom } from '@reatom/npm-react'
import React, { useCallback } from 'react'
import { Image, Pressable, type StyleProp, Text, View, type ViewStyle } from 'react-native'
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
import { useMiniPanGesture } from '../model/useMiniPanGesture'
import { usePanGesture } from '../model/usePanGesture'
import { FullscreenContent } from './FullscreenContent'
import { miniPlayerStyles } from './miniPlayerStyles'
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
    containerStyle,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
  } = useExpandAnimation(expanded)

  const handleMiniTap = useCallback(() => {
    if (!expanded) void open()
  }, [expanded, open])

  const handleCloseFullscreen = useCallback(() => {
    if (expanded) void close()
  }, [close, expanded])

  const pan = usePanGesture({
    onClose: handleCloseFullscreen,
    onOpen: open,
    progress,
  })
  const miniPan = useMiniPanGesture({ progress })
  const onPlayPause = async () => (playing ? pause() : play())

  if (!audio) return null

  return (
    <>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
      />
      {!expanded && (
        <GestureDetector gesture={miniPan}>
          <AnimatedPressable
            onPress={handleMiniTap}
            style={[miniPlayerStyles.miniContainer, miniStyle]}
          >
            <Image
              style={miniPlayerStyles.miniCover}
              source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
            />
            <View style={miniPlayerStyles.miniTextContainer}>
              <MovingText text={audio.title || ''} style={miniPlayerStyles.miniTrackTitle} />
              <Text numberOfLines={1} style={miniPlayerStyles.miniPlaylistName}>
                {playlist?.title || 'Слово Истины'}
              </Text>
            </View>
            <View style={miniPlayerStyles.miniControls}>
              <PlayerControlButton
                size={36}
                color={COLORS.white}
                onPress={onPlayPause}
                type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
              />
            </View>
          </AnimatedPressable>
        </GestureDetector>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.container, containerStyle, style]}>
          <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
            <Image
              resizeMode='cover'
              style={styles.backgroundImage}
              source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
            />
          </Animated.View>
          <Animated.View style={[miniPlayerStyles.miniOverlay, miniOverlayStyle]} />
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
