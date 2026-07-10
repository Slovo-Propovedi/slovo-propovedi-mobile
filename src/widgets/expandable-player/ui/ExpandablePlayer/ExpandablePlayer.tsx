import { useAction, useAtom } from '@reatom/npm-react'
import { StatusBar } from 'expo-status-bar'
import { Image, type StyleProp, type ViewStyle } from 'react-native'
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
import { useTheme } from 'shared/ui'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { showMenuAtom } from '../../model/showMenuAtom'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { FullscreenContent } from '../FullscreenContent/FullscreenContent'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'
import { createStyles } from './styles'
import { useExpandablePlayerGesture } from './useExpandablePlayerGesture'

export const ExpandablePlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { currentTheme } = useTheme()
  const miniStyles = createMiniStyles(currentTheme)
  const styles = createStyles(currentTheme)

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

  const { handleCloseFullscreen, handleMiniTap, miniPan, panGesture } = useExpandablePlayerGesture({
    close,
    disabled: showMenu,
    expanded,
    open,
    progress,
    screenHeight,
  })

  const onPlayPause = async () => (playing ? pause() : play())

  if (!audio) return null

  return (
    <>
      <Animated.View
        pointerEvents='none'
        style={[styles.backdrop, backdropStyle, { height: screenHeight, width: screenWidth }]}
      />
      {!expanded && (
        <MiniPlayer
          audio={audio}
          miniPan={miniPan}
          playing={playing}
          playlist={playlist}
          miniStyle={miniStyle}
          miniStyles={miniStyles}
          onPress={handleMiniTap}
          onPlayPause={onPlayPause}
          showSpinner={showSpinner}
          currentTheme={currentTheme}
        />
      )}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            containerStyle,
            style,
            { backgroundColor: currentTheme.surface },
          ]}
        >
          <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
            <Image
              resizeMode='cover'
              style={styles.backgroundImage}
              source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }}
            />
          </Animated.View>
          <Animated.View pointerEvents='none' style={[miniStyles.miniOverlay, miniOverlayStyle]} />
          {expanded && <StatusBar style='light' />}
          <FullscreenContent
            styles={styles}
            fullStyle={fullStyle}
            onClose={handleCloseFullscreen}
          />
        </Animated.View>
      </GestureDetector>
    </>
  )
}
