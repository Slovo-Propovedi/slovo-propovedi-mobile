import { useCallback } from 'react'
import { type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { INDENTS } from 'shared/ui/theme'
import { getNextSermonInfo } from '../../lib/getNextSermonInfo'
import { type createStyles } from '../ExpandablePlayer/styles'
import { type PlaylistMenuSlot } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { FullscreenSheets } from './FullscreenSheets'
import { HeaderOverlay } from './HeaderOverlay'
import { PlayerControlsSection } from './PlayerControlsSection'
import { PlayerEdgeFades } from './PlayerEdgeFades'
import { PlayerMiddleArea } from './PlayerMiddleArea'
import { useFullscreenHandlers } from './useFullscreenHandlers'
import { usePlayerKeyboardSeek } from './usePlayerKeyboardSeek'

interface FullscreenContentProps {
  fullStyle: AnimatedStyle<ViewStyle>
  onClose: () => void
  playlistMenuComponent?: PlaylistMenuSlot
  styles: ReturnType<typeof createStyles>
}

export const FullscreenContent = ({
  fullStyle,
  onClose,
  playlistMenuComponent,
  styles,
}: FullscreenContentProps) => {
  const insets = useSafeAreaInsets()
  const {
    audio,
    duration,
    handleCollapse,
    handleOpenPlaylist,
    handleToggleCache,
    handleTogglePlay,
    isCached,
    playlist,
    playlistSheetRef,
    position,
    seekTo,
    setShowDetails,
    setShowMenu,
    setShowPlaylist,
    setShowSoundSettings,
    showDetails,
    showMenu,
    showPlaylist,
    showSoundSettings,
    startSeek,
    stopSeek,
    tapSeek,
    visualState,
  } = useFullscreenHandlers()

  const handleCollapsePress = () => handleCollapse(onClose)

  // Stable identity so the memoized sheet skips re-renders on parent ticks.
  const handleClosePlaylist = useCallback(() => setShowPlaylist(false), [setShowPlaylist])
  const handleCloseSoundSettings = useCallback(
    () => setShowSoundSettings(false),
    [setShowSoundSettings],
  )

  usePlayerKeyboardSeek({
    collapsePlayer: handleCollapsePress,
    startSeek,
    stopSeek,
    tapSeek,
    togglePlay: handleTogglePlay,
  })

  if (!audio || !playlist) return null

  const nextSermon = getNextSermonInfo(playlist, audio.id)

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <HeaderOverlay
          styles={styles}
          currentAudioId={audio.id}
          hasNextSermon={nextSermon.hasNext}
          nextSermonTitle={nextSermon.title}
          collapseOnPan={handleCollapsePress}
          collapseOnTap={handleCollapsePress}
          insetsTop={insets.top + INDENTS.low}
          closePlaylistOnSwipe={() => showPlaylist && setShowPlaylist(false)}
        />
        <PlayerEdgeFades />
        <PlayerMiddleArea
          audio={audio}
          styles={styles}
          insetsTop={insets.top}
          showDetails={showDetails}
          onTogglePlay={handleTogglePlay}
          onCloseDetails={() => setShowDetails(false)}
        />
        <PlayerControlsSection
          audio={audio}
          seekTo={seekTo}
          styles={styles}
          duration={duration}
          isCached={isCached}
          playlist={playlist}
          position={position}
          showMenu={showMenu}
          stopSeek={stopSeek}
          startSeek={startSeek}
          setShowMenu={setShowMenu}
          visualState={visualState}
          onToggleCache={handleToggleCache}
          onOpenPlaylist={handleOpenPlaylist}
          onShowDetails={() => setShowDetails(true)}
          onOpenSoundSettings={() => setShowSoundSettings(true)}
        />
      </Animated.View>
      <FullscreenSheets
        playlist={playlist}
        showPlaylist={showPlaylist}
        closePlaylist={handleClosePlaylist}
        playlistSheetRef={playlistSheetRef}
        showSoundSettings={showSoundSettings}
        closeSoundSettings={handleCloseSoundSettings}
        playlistMenuComponent={playlistMenuComponent}
      />
    </>
  )
}
