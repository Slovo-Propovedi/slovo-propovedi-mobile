/* eslint-disable max-lines -- FIXME: refactor */
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import {
  closePlayerSheetAction,
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  isBufferingAtom,
  isDownloadingAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  openPlayerSheetAction,
  usePlayer,
} from 'entities/player'
import { MovingText, PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { COLORS } from 'shared/ui/themed'
import { showMenuAtom } from '../model/showMenuAtom'
import { useExpandAnimation } from '../model/useExpandAnimation'
import { useFullscreenPanGesture } from '../model/useFullscreenPanGesture'
import { useMiniPanGesture } from '../model/useMiniPanGesture'
import { FullscreenContent } from './FullscreenContent'
import { miniPlayerStyles } from './miniPlayerStyles'
import { styles } from './styles'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const ExpandablePlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const [audio] = useAtom(currentAudioAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [showMenu] = useAtom(showMenuAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)

  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const showSpinner = isBuffering || isCurrentAudioDownloading
  const { pause, play } = usePlayer()
  const open = useAction(openPlayerSheetAction)
  const close = useAction(closePlayerSheetAction)
  const {
    backdropStyle,
    backgroundImageStyle,
    containerStyle,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    screenHeight,
    screenWidth,
  } = useExpandAnimation(expanded)

  const panGesture = useFullscreenPanGesture({
    close,
    disabled: showMenu,
    expanded,
    progress,
    screenHeight,
  })

  const handleMiniTap = useCallback(() => {
    if (!expanded) void open()
  }, [expanded, open])

  const handleCloseFullscreen = useCallback(() => {
    if (expanded) void close()
  }, [close, expanded])

  const miniPan = useMiniPanGesture({ onOpen: open, progress })
  const onPlayPause = async () => (playing ? pause() : play())

  if (!audio) return null

  return (
    <>
      <Animated.View
        pointerEvents='none'
        style={[styles.backdrop, backdropStyle, { height: screenHeight, width: screenWidth }]}
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
                {playlist?.title || 'Слово.Проповеди'}
              </Text>
            </View>
            <View style={miniPlayerStyles.miniControls}>
              {showSpinner ? (
                <ActivityIndicator size={36} color={COLORS.white} />
              ) : (
                <PlayerControlButton
                  size={36}
                  color={COLORS.white}
                  onPress={onPlayPause}
                  type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
                />
              )}
            </View>
          </AnimatedPressable>
        </GestureDetector>
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, containerStyle, style]}>
          <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
            <Image
              resizeMode='cover'
              style={styles.backgroundImage}
              source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
            />
          </Animated.View>
          <Animated.View
            pointerEvents='none'
            style={[miniPlayerStyles.miniOverlay, miniOverlayStyle]}
          />
          <FullscreenContent fullStyle={fullStyle} onClose={handleCloseFullscreen} />
        </Animated.View>
      </GestureDetector>
    </>
  )
}
