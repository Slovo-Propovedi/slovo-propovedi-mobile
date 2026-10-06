import { useAction, useAtom } from '@reatom/npm-react'
import { type StyleProp, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { closePlayerSheetAction, openPlayerSheetAction } from 'entities/player'
import { showMenuAtom } from '../../model/showMenuAtom'
import { useBackgroundRecovery } from '../../model/useBackgroundRecovery'
import { useContainerGeometryGuard } from '../../model/useContainerGeometryGuard'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { type PlaylistMenuSlot } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { CollapsedMiniPlayer } from './CollapsedMiniPlayer'
import { ContainerView, type NonGeometricStyle } from './ContainerView'
import { createMiniStyles } from './miniStyles'
import { createStyles } from './styles'
import { useExpandablePlayerGesture } from './useExpandablePlayerGesture'
import { useExpandablePlayerState } from './useExpandablePlayerState'

export const ExpandablePlayer = ({
  playlistMenuComponent,
  style,
}: {
  playlistMenuComponent?: PlaylistMenuSlot
  style?: StyleProp<NonGeometricStyle>
}) => {
  const {
    audio,
    currentTheme,
    expanded,
    isBuffering,
    isTabBarMeasured,
    playing,
    playlist,
    tabBarHeight,
    togglePlay,
  } = useExpandablePlayerState()

  const [showMenu] = useAtom(showMenuAtom)
  const styles = createStyles(currentTheme)
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
  const miniStyles = createMiniStyles(currentTheme, tabBarHeight, screenWidth)

  const gesture = useExpandablePlayerGesture({
    close,
    disabled: showMenu,
    expanded,
    open,
    progress,
    screenHeight,
    tabBarHeight,
  })

  const recoveryKey = useBackgroundRecovery()

  const { modal, openAddToPlaylist } = useAddToPlaylistModal()

  const { onLayout: guardedContainerLayout } = useContainerGeometryGuard({
    expectedTop: collapsedRestingContainerStyle.top,
    onMismatch: forceGeometryReapply,
  })

  if (!audio || !isTabBarMeasured) return null

  return (
    <View key={recoveryKey} style={styles.recoveryOverlay}>
      <Animated.View
        style={[
          styles.backdrop,
          backdropStyle,
          {
            height: Math.floor(screenHeight),
            pointerEvents: 'none',
            width: Math.floor(screenWidth),
          },
        ]}
      />
      {!expanded && (
        <CollapsedMiniPlayer
          audio={audio}
          playing={playing}
          playlist={playlist}
          miniStyle={miniStyle}
          miniStyles={miniStyles}
          onPlayPause={togglePlay}
          miniPan={gesture.miniPan}
          isBuffering={isBuffering}
          currentTheme={currentTheme}
          onPress={gesture.handleMiniTap}
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
        onAddToPlaylist={openAddToPlaylist}
        miniOverlay={miniStyles.miniOverlay}
        backgroundImageStyle={backgroundImageStyle}
        restingContainerStyle={restingContainerStyle}
        playlistMenuComponent={playlistMenuComponent}
        closeFullscreen={gesture.handleCloseFullscreen}
      />
      {modal}
    </View>
  )
}
