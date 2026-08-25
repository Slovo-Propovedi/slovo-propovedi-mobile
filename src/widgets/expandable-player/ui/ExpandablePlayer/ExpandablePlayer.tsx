import { useAction, useAtom } from '@reatom/npm-react'
import { type StyleProp, StyleSheet, View } from 'react-native'
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
import { isTabBarMeasuredAtom, tabBarHeightAtom } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { showMenuAtom } from '../../model/showMenuAtom'
import { useBackgroundRecovery } from '../../model/useBackgroundRecovery'
import { useContainerGeometryGuard } from '../../model/useContainerGeometryGuard'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { ContainerView, type NonGeometricStyle } from './ContainerView'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'
import { createStyles } from './styles'
import { useExpandablePlayerGesture } from './useExpandablePlayerGesture'

export const ExpandablePlayer = ({ style }: { style?: StyleProp<NonGeometricStyle> }) => {
  const { currentTheme } = useTheme()

  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const [audio] = useAtom(currentAudioAtom)
  const [isTabBarMeasured] = useAtom(isTabBarMeasuredAtom)
  const [playing] = useAtom(isPlayingAtom)
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [showMenu] = useAtom(showMenuAtom)
  const [isBuffering] = useAtom(isBufferingAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)

  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl

  const miniStyles = createMiniStyles(currentTheme, tabBarHeight)
  const styles = createStyles(currentTheme)

  const { pause, play } = usePlayer()

  const open = useAction(openPlayerSheetAction)
  const close = useAction(closePlayerSheetAction)

  const {
    backdropStyle,
    backgroundImageStyle,
    collapsedRestingContainerStyle,
    containerStyle,
    forceGeometryReapply,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    restingContainerStyle,
    screenHeight,
    screenWidth,
  } = useExpandAnimation(expanded, tabBarHeight)

  const gesture = useExpandablePlayerGesture({
    close,
    disabled: showMenu,
    expanded,
    open,
    progress,
    screenHeight,
    tabBarHeight,
  })

  const onPlayPause = async () => (playing ? pause() : play())

  const recoveryKey = useBackgroundRecovery()

  const { onLayout: guardedContainerLayout } = useContainerGeometryGuard({
    expectedTop: collapsedRestingContainerStyle.top,
    onMismatch: forceGeometryReapply,
  })

  if (!audio || !isTabBarMeasured) return null

  return (
    <View key={recoveryKey} pointerEvents='box-none' style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents='none'
        style={[styles.backdrop, backdropStyle, { height: screenHeight, width: screenWidth }]}
      />
      {!expanded && (
        <MiniPlayer
          audio={audio}
          playing={playing}
          playlist={playlist}
          miniStyle={miniStyle}
          miniStyles={miniStyles}
          miniPan={gesture.miniPan}
          onPlayPause={onPlayPause}
          showSpinner={isBuffering}
          currentTheme={currentTheme}
          onPress={gesture.handleMiniTap}
          isDownloading={isCurrentAudioDownloading}
          downloadProgress={isCurrentAudioDownloading ? downloadProgress : 0}
        />
      )}
      <ContainerView
        audio={audio}
        style={style}
        styles={styles}
        expanded={expanded}
        fullStyle={fullStyle}
        currentTheme={currentTheme}
        containerStyle={containerStyle}
        panGesture={gesture.panGesture}
        onLayout={guardedContainerLayout}
        miniOverlayStyle={miniOverlayStyle}
        miniOverlay={miniStyles.miniOverlay}
        backgroundImageStyle={backgroundImageStyle}
        restingContainerStyle={restingContainerStyle}
        closeFullscreen={gesture.handleCloseFullscreen}
      />
    </View>
  )
}
