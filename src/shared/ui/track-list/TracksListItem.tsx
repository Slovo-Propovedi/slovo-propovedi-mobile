import { memo, useRef, useState } from 'react'
import { Pressable, type View } from 'react-native'
import { useTheme } from '../themed'
import { MENU_WIDTH } from './constants'
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
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [menuHeight, setMenuHeight] = useState(44)
    const dotsButtonRef = useRef<View>(null)

    const { isCached, isDownloading, progressValue, toggleCache } = useTrackItemCache(
      audioUrl,
      downloadingUrl,
      externalCacheTrigger,
    )

    const measureButton = () => {
      dotsButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) =>
        setMenuPosition({ x: pageX + width - MENU_WIDTH, y: pageY - height - menuHeight - 5 }),
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

    const handleMenuHeightChange = (newHeight: number) => {
      setMenuHeight(newHeight)
      dotsButtonRef.current?.measure((_x, _y, width, buttonHeight, pageX, pageY) =>
        setMenuPosition({ x: pageX + width - MENU_WIDTH, y: pageY - buttonHeight - newHeight - 5 }),
      )
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
          theme={currentTheme}
          isMenuOpen={isMenuOpen}
          menuHeight={menuHeight}
          menuActions={menuActions}
          onClose={handleToggleMenu}
          menuPosition={menuPosition}
          onToggleCache={handleToggleCache}
          onMenuHeightChange={handleMenuHeightChange}
        />
      </>
    )
  },
)
