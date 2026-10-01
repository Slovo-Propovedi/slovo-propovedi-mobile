import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { type PlaybackRate, usePlaybackRate } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { hapticLight } from 'shared/lib/haptics'
import { reportError } from 'shared/model/error-dialog'
import { useTheme } from 'shared/ui/theme'
import { styles } from './PlayerMenu.styles'
import { PlayerMenuItems } from './PlayerMenuItems'
import { PlayerSpeedMenu } from './PlayerSpeedMenu'
import { useMenuRevealAnimation } from './useMenuRevealAnimation'

export const PlayerMenu = ({
  audio,
  isCached,
  onAddToPlaylist,
  onClose,
  onOpenSoundSettings,
  onShowDetails,
  onToggleCache,
  visualState,
}: {
  audio: AudioPlayerData
  isCached?: boolean
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onClose: () => void
  onOpenSoundSettings: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  visualState: TrackCacheVisualState
}) => {
  const { currentTheme } = useTheme()
  const { rate, setPlaybackRate } = usePlaybackRate()
  const [view, setView] = useState<'main' | 'speed'>('main')
  const { backdropStyle, handleLayout, wrapperStyle } = useMenuRevealAnimation()

  const handleDetailsPress = () => {
    onShowDetails()
    onClose()
  }

  const handleSoundSettingsPress = () => {
    onOpenSoundSettings()
    onClose()
  }

  const handleToggleCache = () => {
    onToggleCache()
    onClose()
  }

  const handleAddToPlaylistPress = () => {
    onAddToPlaylist?.(audio)
    onClose()
  }

  const handleSpeedSelect = (selectedRate: PlaybackRate) => {
    void setPlaybackRate(selectedRate).catch(reportError)
    onClose()
  }

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          tabIndex={-1}
          onPress={onClose}
          onPressIn={hapticLight}
          style={styles.backdropPressable}
        />
      </Animated.View>
      <Animated.View style={[styles.menuWrapper, wrapperStyle]}>
        <View
          onLayout={handleLayout}
          style={[styles.menuContainer, { backgroundColor: currentTheme.surface }]}
        >
          {view === 'main' ? (
            <PlayerMenuItems
              rate={rate}
              isCached={isCached}
              visualState={visualState}
              onDetails={handleDetailsPress}
              onToggleCache={handleToggleCache}
              onShowSpeed={() => setView('speed')}
              onOpenSoundSettings={handleSoundSettingsPress}
              onAddToPlaylist={onAddToPlaylist ? handleAddToPlaylistPress : undefined}
            />
          ) : (
            <PlayerSpeedMenu
              currentRate={rate}
              onSelect={handleSpeedSelect}
              onBack={() => setView('main')}
            />
          )}
        </View>
      </Animated.View>
    </>
  )
}
