/* eslint-disable max-lines -- FIXME: refactor */
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CoverImage } from '../cover-image'
import { MovingText } from '../MovingText'
import { useTheme } from '../themed'
import { MENU_WIDTH, TITLE_ANIMATION_THRESHOLD } from './constants'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'
import { createTracksListStyles } from './styles'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'
import { type TracksListItemProps } from './types'
import { useTrackItemCache } from './useTrackItemCache'

export const TracksListItem = ({
  artwork,
  audioUrl,
  cacheTrigger: externalCacheTrigger,
  downloadingUrl,
  isAudioPlaying = false,
  isPlaying,
  onPress,
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
        <View style={tracksListStyles.albumArtContainer}>
          <CoverImage
            uri={artwork}
            style={[tracksListStyles.albumArt, isPlaying && tracksListStyles.albumArtPlaying]}
          />
          {isDownloading && (
            <View style={tracksListStyles.progressBarBackground}>
              <View
                style={[tracksListStyles.progressBarFill, { width: `${progressValue * 100}%` }]}
              />
            </View>
          )}
          {!isDownloading && (!isCached || isPlaying) && (
            <PlayingStatusOrChacheIcon
              theme={currentTheme}
              isPlaying={isPlaying}
              isAudioPlaying={isAudioPlaying}
            />
          )}
        </View>
        <View style={tracksListStyles.textContainer}>
          <MovingText
            text={title}
            animationThreshold={TITLE_ANIMATION_THRESHOLD}
            style={[tracksListStyles.title, isPlaying && tracksListStyles.titlePlaying]}
          />
          {subtitle && <Text style={tracksListStyles.subtitle}>{subtitle}</Text>}
        </View>
        <Pressable
          ref={dotsButtonRef}
          accessibilityRole='button'
          onPress={handleToggleMenu}
          testID='tracks-list-item-menu'
          style={tracksListStyles.dotsButton}
        >
          <MaterialCommunityIcons size={20} name='dots-vertical' color={currentTheme.textMuted} />
        </Pressable>
      </Pressable>

      <TracksListItemContextMenu
        isCached={isCached}
        theme={currentTheme}
        isMenuOpen={isMenuOpen}
        menuHeight={menuHeight}
        onClose={handleToggleMenu}
        menuPosition={menuPosition}
        onToggleCache={handleToggleCache}
        onMenuHeightChange={handleMenuHeightChange}
      />
    </>
  )
}
