import { useRef, useState } from 'react'
import { Platform, type View } from 'react-native'
import { type AnchorRect } from 'shared/ui/menu'
import { PressableButton } from '../pressable-button'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { createTracksListStyles } from './styles'
import { TracksListItemContent } from './TracksListItemContent'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'
import { type TracksListItemProps } from './types'
import { useTrackItemCache } from './useTrackItemCache'

// Web: the row renders as <div role="link" tabindex=0> (RNW maps 'link' to the
// role attribute, no <a> tag) so Vimium hints work and Enter activates while
// Space scrolls — link semantics. Native keeps the button role.
const ROW_ACCESSIBILITY_ROLE = Platform.OS === 'web' ? 'link' : 'button'

export const TracksListItemBase = ({
  artwork,
  audioUrl,
  cacheTrigger: externalCacheTrigger,
  isAudioPlaying = false,
  isPlaying,
  menuActions,
  onPress,
  progress,
  style,
  subtitle,
  title,
}: TracksListItemProps) => {
  const { currentTheme } = useTheme()
  const tracksListStyles = createTracksListStyles(currentTheme)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const dotsButtonRef = useRef<View>(null)

  const {
    isCached,
    isCacheDisabled,
    isDownloading,
    isQueued,
    progressValue,
    toggleCache,
    visualState,
  } = useTrackItemCache(audioUrl, externalCacheTrigger)

  // The menu renders in a viewport-fixed Modal portal, so the anchor must be
  // measured in viewport coords. measure() returns page coords on web (offset
  // by scroll) and would fly the menu away on a scrolled page.
  const measureButton = () => {
    dotsButtonRef.current?.measureInWindow((x, y, width, height) =>
      setMenuAnchor({ height, width, x, y }),
    )
  }

  const handleToggleMenu = () => {
    if (!audioUrl) return
    if (!isMenuOpen) measureButton()
    setIsMenuOpen(!isMenuOpen)
  }

  const handleToggleCache = async () => {
    setIsMenuOpen(false)
    await toggleCache()
  }

  const handleItemPress = () => {
    if (isMenuOpen) setIsMenuOpen(false)
    onPress()
  }

  return (
    <>
      <PressableButton
        onPress={handleItemPress}
        onLongPress={handleToggleMenu}
        accessibilityRole={ROW_ACCESSIBILITY_ROLE}
        style={[
          style,
          tracksListStyles.itemContainer,
          isMenuOpen && tracksListStyles.itemContainerActive,
        ]}
      >
        <TracksListItemContent
          title={title}
          artwork={artwork}
          isCached={isCached}
          progress={progress}
          ref={dotsButtonRef}
          subtitle={subtitle}
          isQueued={isQueued}
          theme={currentTheme}
          isPlaying={isPlaying}
          isDownloading={isDownloading}
          progressValue={progressValue}
          dotsOnPress={handleToggleMenu}
          isAudioPlaying={isAudioPlaying}
        />
      </PressableButton>

      <TracksListItemContextMenu
        isCached={isCached}
        anchor={menuAnchor}
        isMenuOpen={isMenuOpen}
        menuActions={menuActions}
        visualState={visualState}
        onClose={handleToggleMenu}
        isCacheDisabled={isCacheDisabled}
        onToggleCache={handleToggleCache}
      />
    </>
  )
}
