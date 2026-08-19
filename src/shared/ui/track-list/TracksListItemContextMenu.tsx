import { Ionicons } from '@expo/vector-icons'
import { type ComponentProps } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { type ThemeColors } from '../theme'
import { createTracksListStyles } from './styles'

export interface MenuAction {
  icon?: ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  text: string
}

export interface TracksListItemContextMenuProps {
  isCached: boolean
  isMenuOpen: boolean
  menuActions?: MenuAction[]
  menuHeight: number
  menuPosition: { x: number; y: number }
  onClose: () => void
  onMenuHeightChange: (height: number) => void
  onToggleCache: () => void
  theme: ThemeColors
}

export const TracksListItemContextMenu = ({
  isCached,
  isMenuOpen,
  menuActions,
  menuHeight,
  menuPosition,
  onClose,
  onMenuHeightChange,
  onToggleCache,
  theme,
}: TracksListItemContextMenuProps) => {
  const tracksListStyles = createTracksListStyles(theme)

  const handleLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height
    if (h !== menuHeight) onMenuHeightChange(h)
  }

  if (!isMenuOpen) return null

  const renderItems = () => {
    if (menuActions)
      return menuActions.map((action, index) => (
        <Pressable
          accessibilityRole='button'
          key={`${action.text}-${index}`}
          style={tracksListStyles.contextMenuItem}
          onPress={() => {
            action.onPress()
            onClose()
          }}
        >
          <View style={localStyles.actionRow}>
            {action.icon && (
              <Ionicons
                size={18}
                name={action.icon}
                color={theme.text}
                style={localStyles.actionIcon}
              />
            )}
            <Text style={tracksListStyles.contextMenuItemText}>{action.text}</Text>
          </View>
        </Pressable>
      ))

    return (
      <Pressable
        onPress={onToggleCache}
        accessibilityRole='button'
        style={tracksListStyles.contextMenuItem}
      >
        <Text style={tracksListStyles.contextMenuItemText}>
          {isCached ? 'Удалить из кеша' : 'Добавить в кеш'}
        </Text>
      </Pressable>
    )
  }

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
          {renderItems()}
        </View>
      </Pressable>
    </Modal>
  )
}

const localStyles = StyleSheet.create({
  actionIcon: {
    marginRight: 8,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
