import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import { Pressable, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { INDENTS } from 'shared/ui/theme'
import { type createStyles } from '../ExpandablePlayer/styles'
import { PlaylistBottomSheet } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { DetailsOverlay } from './DetailsOverlay'
import { gradientStyles } from './gradients'
import { HeaderOverlay } from './HeaderOverlay'
import { PlayerControlsSection } from './PlayerControlsSection'
import { useFullscreenHandlers } from './useFullscreenHandlers'

interface FullscreenContentProps {
  fullStyle: AnimatedStyle<ViewStyle>
  onClose: () => void
  styles: ReturnType<typeof createStyles>
}

export const FullscreenContent = ({ fullStyle, onClose, styles }: FullscreenContentProps) => {
  const insets = useSafeAreaInsets()
  const {
    audio,
    currentDownloadProgress,
    duration,
    handleNextSermon,
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
  } = useFullscreenHandlers()

  const handleCollapsePress = () => {
    if (showPlaylist) {
      setShowPlaylist(false)
      return
    }
    onClose()
  }

  const closePlaylistOnSwipe = () => {
    if (showPlaylist) setShowPlaylist(false)
  }

  // Stable identity so the memoized sheet skips re-renders on parent ticks.
  const handleClosePlaylist = useCallback(() => setShowPlaylist(false), [setShowPlaylist])

  if (!audio) return null
  if (!playlist) return null

  const playlistList = playlist.sermons
  const currentIndex = playlistList.findIndex(t => t.id === audio.id)
  const nextSermon = playlistList[currentIndex + 1]
  const hasNextSermon = currentIndex >= 0 && currentIndex < playlistList.length - 1

  return (
    <>
      <Animated.View style={[styles.fullContainer, fullStyle]}>
        <HeaderOverlay
          styles={styles}
          hasNextSermon={hasNextSermon}
          onNextSermon={handleNextSermon}
          collapseOnPan={handleCollapsePress}
          collapseOnTap={handleCollapsePress}
          nextSermonTitle={nextSermon?.title}
          insetsTop={insets.top + INDENTS.low}
          closePlaylistOnSwipe={closePlaylistOnSwipe}
        />
        <LinearGradient
          pointerEvents='none'
          style={gradientStyles.topGradient}
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
        />
        <LinearGradient
          pointerEvents='none'
          style={gradientStyles.bottomGradient}
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
        />
        {showDetails ? (
          <DetailsOverlay
            audio={audio}
            styles={styles}
            insetsTop={insets.top}
            onClose={() => setShowDetails(false)}
          />
        ) : (
          <Pressable style={styles.spacer} onPress={() => void handleTogglePlay()} />
        )}
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
          onToggleCache={handleToggleCache}
          onOpenPlaylist={handleOpenPlaylist}
          onShowDetails={() => setShowDetails(true)}
          currentDownloadProgress={currentDownloadProgress}
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
