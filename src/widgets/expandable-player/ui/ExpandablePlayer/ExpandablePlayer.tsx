import { useAction, useAtom } from '@reatom/npm-react'
import { StatusBar } from 'expo-status-bar'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import {
  closePlayerSheetAction,
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  downloadProgressAtom,
  isBufferingAtom,
  isDownloadingAtom,
  isPlayerExpandedAtom,
  isPlayingAtom,
  openPlayerSheetAction,
  usePlayer,
} from 'entities/player'
import { CoverImage } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { showMenuAtom } from '../../model/showMenuAtom'
import { useBackgroundRecovery } from '../../model/useBackgroundRecovery'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { FullscreenContent } from '../FullscreenContent/FullscreenContent'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'
import { createStyles } from './styles'
import { useExpandablePlayerGesture } from './useExpandablePlayerGesture'

export const ExpandablePlayer = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const miniStyles = createMiniStyles(currentTheme, tabBarHeight)
  const styles = createStyles(currentTheme)

  const [audio] = useAtom(currentAudioAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [showMenu] = useAtom(showMenuAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)

  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
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
  } = useExpandAnimation(expanded, tabBarHeight)

  const { handleCloseFullscreen, handleMiniTap, miniPan, panGesture } = useExpandablePlayerGesture({
    close,
    disabled: showMenu,
    expanded,
    open,
    progress,
    screenHeight,
    tabBarHeight,
  })

  const onPlayPause = async () => (playing ? pause() : play())

  // After ≥5 min in background, Reanimated UI-thread desync can leave an opaque
  // gray container over the mini-player with dead touches. Remounting the
  // subtree via key forces fresh native views for gestures, images, and styles.
  // Issue #61.
  const recoveryKey = useBackgroundRecovery()

  if (!audio) return null

  return (
    <View key={recoveryKey} pointerEvents='box-none' style={StyleSheet.absoluteFill}>
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
          showSpinner={isBuffering}
          currentTheme={currentTheme}
          isDownloading={isCurrentAudioDownloading}
          downloadProgress={isCurrentAudioDownloading ? downloadProgress : 0}
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
            <CoverImage eager uri={audio.artwork} style={styles.backgroundImage} />
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
    </View>
  )
}
