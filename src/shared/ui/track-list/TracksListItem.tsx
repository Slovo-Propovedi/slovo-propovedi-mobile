import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { Image, Modal, Pressable, Text, View } from 'react-native'
import { cacheAudio, removeFromCache, useIsCached } from 'shared/lib/audio-cache'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { MovingText } from 'shared/ui/MovingText'
import { COLORS } from 'shared/ui/themed'
import type { TracksListItemProps } from './types'
import { MENU_WIDTH, TITLE_ANIMATION_THRESHOLD } from './constants'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'
import { tracksListStyles } from './styles'

export const TracksListItem = ({
  artist,
  artwork,
  audioUrl,
  downloadingUrl,
  isAudioPlaying = false,
  isPlaying,
  onPress,
  title,
}: TracksListItemProps) => {
  const [cacheTrigger, setCacheTrigger] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [menuHeight, setMenuHeight] = useState(44)
  const dotsButtonRef = useRef<View>(null)
  const prevDownloadingUrlRef = useRef<null | string | undefined>(null)
  const isCached = useIsCached(audioUrl ?? null, cacheTrigger)

  useEffect(() => {
    const wasThisAudioDownloading = prevDownloadingUrlRef.current === audioUrl
    if (wasThisAudioDownloading && downloadingUrl === null) setCacheTrigger(prev => prev + 1)
    prevDownloadingUrlRef.current = downloadingUrl
  }, [downloadingUrl, audioUrl])

  const measureButton = () => {
    dotsButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setMenuPosition({ x: pageX + width - MENU_WIDTH, y: pageY - height - menuHeight - 5 })
    })
  }

  const handleToggleMenu = () => {
    if (!audioUrl) return
    if (!isMenuOpen) measureButton()
    setIsMenuOpen(!isMenuOpen)
  }

  const handleToggleCache = async () => {
    setIsMenuOpen(false)
    if (!audioUrl) return
    try {
      isCached ? await removeFromCache(audioUrl) : await cacheAudio(audioUrl)
      setCacheTrigger(prev => prev + 1)
    } catch (error) {
      console.warn('[TracksListItem] Error toggling cache:', error)
    }
  }

  const handleItemPress = () => {
    if (isMenuOpen) setIsMenuOpen(false)
    onPress()
  }

  const renderMenu = () => (
    <Modal transparent animationType='none' visible={isMenuOpen} onRequestClose={handleToggleMenu}>
      <Pressable style={{ flex: 1 }} onPress={handleToggleMenu}>
        <View
          style={[
            tracksListStyles.dropdownMenu,
            { left: menuPosition.x, position: 'absolute', top: menuPosition.y },
          ]}
          onLayout={e => {
            const h = e.nativeEvent.layout.height
            if (h !== menuHeight) {
              setMenuHeight(h)
              dotsButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) =>
                setMenuPosition({ x: pageX + width - MENU_WIDTH, y: pageY - height - h - 5 }),
              )
            }
          }}
        >
          <Pressable onPress={handleToggleCache} style={tracksListStyles.contextMenuItem}>
            <Text style={tracksListStyles.contextMenuItemText}>
              {isCached ? 'Удалить из кеша' : 'Добавить в кеш'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )

  return (
    <Pressable
      onPress={handleItemPress}
      testID='tracks-list-item'
      onLongPress={handleToggleMenu}
      style={[tracksListStyles.itemContainer, isMenuOpen && tracksListStyles.itemContainerActive]}
    >
      <View style={tracksListStyles.albumArtContainer}>
        <Image
          source={{ uri: artwork || IMAGE_PLACEHOLDER }}
          style={[tracksListStyles.albumArt, isPlaying && tracksListStyles.albumArtPlaying]}
        />
        {(!isCached || isPlaying) && (
          <PlayingStatusOrChacheIcon isPlaying={isPlaying} isAudioPlaying={isAudioPlaying} />
        )}
      </View>
      <View style={tracksListStyles.textContainer}>
        <MovingText
          text={title}
          animationThreshold={TITLE_ANIMATION_THRESHOLD}
          style={[tracksListStyles.title, isPlaying && tracksListStyles.titlePlaying]}
        />
        {artist && <Text style={tracksListStyles.artist}>{artist}</Text>}
      </View>
      <Pressable
        ref={dotsButtonRef}
        onPress={handleToggleMenu}
        testID='tracks-list-item-menu'
        style={tracksListStyles.dotsButton}
      >
        <MaterialCommunityIcons size={20} name='dots-vertical' color={COLORS.textMuted} />
      </Pressable>
      {isMenuOpen && renderMenu()}
    </Pressable>
  )
}
