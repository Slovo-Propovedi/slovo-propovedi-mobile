import { Modal, Pressable, Text, View } from 'react-native'
import { tracksListStyles } from './styles'

export interface TracksListItemContextMenuProps {
  isCached: boolean
  isMenuOpen: boolean
  menuHeight: number
  menuPosition: { x: number; y: number }
  onClose: () => void
  onMenuHeightChange: (height: number) => void
  onToggleCache: () => void
}

export const TracksListItemContextMenu = ({
  isCached,
  isMenuOpen,
  menuHeight,
  menuPosition,
  onClose,
  onMenuHeightChange,
  onToggleCache,
}: TracksListItemContextMenuProps) => {
  const handleLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height
    if (h !== menuHeight) onMenuHeightChange(h)
  }

  if (!isMenuOpen) return null

  return (
    <Modal visible transparent animationType='none' onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <View
          onLayout={handleLayout}
          style={[
            tracksListStyles.dropdownMenu,
            { left: menuPosition.x, position: 'absolute', top: menuPosition.y },
          ]}
        >
          <Pressable onPress={onToggleCache} style={tracksListStyles.contextMenuItem}>
            <Text style={tracksListStyles.contextMenuItemText}>
              {isCached ? 'Удалить из кеша' : 'Добавить в кеш'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

export default TracksListItemContextMenu
