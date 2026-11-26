import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { type TrackCacheVisualState } from 'entities/offline-cache'
import { type PlaybackRate, usePlaybackRate } from 'entities/player'
import { hapticLight } from 'shared/lib/haptics'
import { reportError } from 'shared/model/error-dialog'
import { useTheme } from 'shared/ui/theme'
import { playerMenuViewAtom } from '../../model/playerMenuViewAtom'
import { styles } from './PlayerMenu.styles'
import { PlayerMenuItems } from './PlayerMenuItems'
import { PlayerSpeedMenu } from './PlayerSpeedMenu'
import { useMenuRevealAnimation } from './useMenuRevealAnimation'

const BACKDROP_TEST_ID = 'player-menu-backdrop'
const WRAPPER_TEST_ID = 'player-menu-wrapper'

export const PlayerMenu = ({
  canRemoveFromPlaylist,
  isCached,
  onClose,
  onOpenSoundSettings,
  onRequestRemoveFromPlaylist,
  onShowDetails,
  onToggleCache,
  variant = 'sheet',
  visualState,
}: {
  canRemoveFromPlaylist: boolean
  isCached?: boolean
  onClose: () => void
  onOpenSoundSettings: () => void
  onRequestRemoveFromPlaylist?: () => void
  onShowDetails: () => void
  onToggleCache: () => void
  /** `sheet` — fullscreen popover with its own backdrop; `anchored` — content for an `AnchoredDropdown` portal. */
  variant?: 'anchored' | 'sheet'
  visualState: TrackCacheVisualState
}) => {
  const { currentTheme } = useTheme()
  const { rate, setPlaybackRate } = usePlaybackRate()
  const [view, setView] = useAtom(playerMenuViewAtom)
  const { backdropStyle, handleLayout, wrapperStyle } = useMenuRevealAnimation()

  // The menu view lives in a shared atom so the tour can open the speed page.
  // Reset it on unmount: the next menu open must start on the main page.
  useEffect(
    () => () => {
      setView('main')
    },
    [setView],
  )

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

  const handleRemoveFromPlaylistPress = () => {
    onRequestRemoveFromPlaylist?.()
    onClose()
  }

  const handleSpeedSelect = (selectedRate: PlaybackRate) => {
    void setPlaybackRate(selectedRate).catch(reportError)
    onClose()
  }

  const wrapperBaseStyle = variant === 'sheet' ? styles.menuWrapper : styles.menuWrapperAnchored

  return (
    <>
      {variant === 'sheet' && (
        <Animated.View testID={BACKDROP_TEST_ID} style={[styles.backdrop, backdropStyle]}>
          <Pressable
            tabIndex={-1}
            onPress={onClose}
            onPressIn={hapticLight}
            style={styles.backdropPressable}
          />
        </Animated.View>
      )}
      <Animated.View testID={WRAPPER_TEST_ID} style={[wrapperBaseStyle, wrapperStyle]}>
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
              onRemoveFromPlaylist={
                canRemoveFromPlaylist ? handleRemoveFromPlaylistPress : undefined
              }
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
