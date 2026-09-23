import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import { type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { INDENTS } from 'shared/ui/theme'
import { type createStyles } from '../ExpandablePlayer/styles'
import { PlaylistBottomSheet } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { gradientStyles } from './gradients'
import { HeaderOverlay } from './HeaderOverlay'
import { PlayerControlsSection } from './PlayerControlsSection'
import { PlayerMiddleArea } from './PlayerMiddleArea'
import { useFullscreenHandlers } from './useFullscreenHandlers'
import { usePlayerKeyboardSeek } from './usePlayerKeyboardSeek'

interface FullscreenContentProps {
  fullStyle: AnimatedStyle<ViewStyle>
  onClose: () => void
  styles: ReturnType<typeof createStyles>
}

export const FullscreenContent = ({ fullStyle, onClose, styles }: FullscreenContentProps) => {
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
    showDetails,
    showMenu,
    showPlaylist,
    startSeek,
    stopSeek,
    tapSeek,
    visualState,
  } = useFullscreenHandlers()

  const handleCollapsePress = () => handleCollapse(onClose)

  // Stable identity so the memoized sheet skips re-renders on parent ticks.
  const handleClosePlaylist = useCallback(() => setShowPlaylist(false), [setShowPlaylist])

  usePlayerKeyboardSeek({
    collapsePlayer: handleCollapsePress,
    startSeek,
    stopSeek,
    tapSeek,
    togglePlay: handleTogglePlay,
  })

  if (!audio || !playlist) return null

  const playlistList = playlist.sermons
  const currentIndex = playlistList.findIndex(t => t.id === audio.id)
  const nextSermon = playlistList[currentIndex + 1]
  const hasNextSermon = currentIndex >= 0 && currentIndex < playlistList.length - 1

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <HeaderOverlay
          styles={styles}
          currentAudioId={audio.id}
          hasNextSermon={hasNextSermon}
          collapseOnPan={handleCollapsePress}
          collapseOnTap={handleCollapsePress}
          nextSermonTitle={nextSermon?.title}
          insetsTop={insets.top + INDENTS.low}
          closePlaylistOnSwipe={() => {
            if (showPlaylist) setShowPlaylist(false)
          }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
          style={[gradientStyles.topGradient, { pointerEvents: 'none' }]}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={[gradientStyles.bottomGradient, { pointerEvents: 'none' }]}
        />
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
        />
      </Animated.View>
      {showPlaylist && (
        <PlaylistBottomSheet
          playlist={playlist}
          sheetRef={playlistSheetRef}
          onClose={handleClosePlaylist}
        />
      )}
    </>
  )
}
