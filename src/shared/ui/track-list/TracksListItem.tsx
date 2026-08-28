import { memo, useRef, useState } from 'react'
import { Pressable, type View } from 'react-native'
import { type AnchorRect } from 'shared/ui/anchored-dropdown'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { createTracksListStyles } from './styles'
import { TracksListItemContent } from './TracksListItemContent'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'
import { type TracksListItemProps } from './types'
import { useTrackItemCache } from './useTrackItemCache'

export const TracksListItem = memo(
  ({
    artwork,
    audioUrl,
    cacheTrigger: externalCacheTrigger,
    downloadingUrl,
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

    const { isCached, isDownloading, progressValue, toggleCache } = useTrackItemCache(
      audioUrl,
      downloadingUrl,
      externalCacheTrigger,
    )

    const measureButton = () => {
      dotsButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) =>
        setMenuAnchor({ height, width, x: pageX, y: pageY }),
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
        <Pressable
          onPress={handleItemPress}
          testID='tracks-list-item'
          accessibilityRole='button'
          onLongPress={handleToggleMenu}
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
            theme={currentTheme}
            isPlaying={isPlaying}
            isDownloading={isDownloading}
            progressValue={progressValue}
            dotsOnPress={handleToggleMenu}
            isAudioPlaying={isAudioPlaying}
          />
        </Pressable>

        <TracksListItemContextMenu
          isCached={isCached}
          anchor={menuAnchor}
          theme={currentTheme}
          isMenuOpen={isMenuOpen}
          menuActions={menuActions}
          onClose={handleToggleMenu}
          onToggleCache={handleToggleCache}
        />
      </>
    )
  },
)
