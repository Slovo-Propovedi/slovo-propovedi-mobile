import { useAtom } from '@reatom/npm-react'
import { type StyleProp, View } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useExpandPlayerTourAction } from '../../lib/useExpandPlayerTourAction'
import { showMenuAtom } from '../../model/showMenuAtom'
import { useBackgroundRecovery } from '../../model/useBackgroundRecovery'
import { useContainerGeometryGuard } from '../../model/useContainerGeometryGuard'
import { useExpandAnimation } from '../../model/useExpandAnimation'
import { type PlaylistMenuSlot } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { CollapsedMiniPlayer } from './CollapsedMiniPlayer'
import { ContainerView, type NonGeometricStyle } from './ContainerView'
import { PlayerBackdrop } from './PlayerBackdrop'
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
    isBarCollapsed,
    isBuffering,
    isLight,
    isSearchFieldFocused,
    isTabBarMeasured,
    playing,
    playlist,
    tabBarHeight,
    togglePlay,
  } = useExpandablePlayerState()

  const [showMenu] = useAtom(showMenuAtom)
  const styles = createStyles(currentTheme)

  const {
    backdropStyle,
    backgroundImageStyle,
    barCollapsedTop,
    barExpandedTop,
    containerStyle,
    forceGeometryReapply,
    fullStyle,
    miniBarRestingStyle,
    miniBarStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    restingContainerStyle,
    screenHeight,
    screenWidth,
  } = useExpandAnimation(expanded, tabBarHeight)

  const gesture = useExpandablePlayerGesture({
    disabled: showMenu,
    expanded,
    progress,
    screenHeight,
    tabBarHeight,
  })

  useExpandPlayerTourAction({ expand: gesture.handleMiniTap, hasAudio: audio !== null })

  const recoveryKey = useBackgroundRecovery()

  const { modal, openAddToPlaylist } = useAddToPlaylistModal()

  const { onLayout: guardedContainerLayout } = useContainerGeometryGuard({
    barCollapsedTop,
    barExpandedTop,
    barProgress: progress,
    onMismatch: forceGeometryReapply,
  })

  if (!audio || !isTabBarMeasured) return null

  return (
    <View key={recoveryKey} style={styles.recoveryOverlay}>
      <PlayerBackdrop
        style={styles.backdrop}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        backdropStyle={backdropStyle}
      />
      {/* Focus hands the whole bottom row to the search pill; the player returns
          on blur without closing the search. */}
      {!expanded && !isSearchFieldFocused && (
        <CollapsedMiniPlayer
          audio={audio}
          playing={playing}
          isLight={isLight}
          playlist={playlist}
          miniStyle={miniStyle}
          onPlayPause={togglePlay}
          miniPan={gesture.miniPan}
          isBuffering={isBuffering}
          miniBarStyle={miniBarStyle}
          currentTheme={currentTheme}
          barCollapsed={isBarCollapsed}
          onPress={gesture.handleMiniTap}
          miniBarRestingStyle={miniBarRestingStyle}
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
        backgroundImageStyle={backgroundImageStyle}
        restingContainerStyle={restingContainerStyle}
        playlistMenuComponent={playlistMenuComponent}
        closeFullscreen={gesture.handleCloseFullscreen}
      />
      {modal}
    </View>
  )
}
