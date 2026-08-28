import { Ionicons } from '@expo/vector-icons'
import { type ComponentProps } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/anchored-dropdown'
import { type ThemeColors } from '../theme'
import { createTracksListStyles } from './styles'

export interface MenuAction {
  icon?: ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  text: string
}

export interface TracksListItemContextMenuProps {
  anchor: AnchorRect | null
  isCached: boolean
  isMenuOpen: boolean
  menuActions?: MenuAction[]
  onClose: () => void
  onToggleCache: () => void
  theme: ThemeColors
}

export const TracksListItemContextMenu = ({
  anchor,
  isCached,
  isMenuOpen,
  menuActions,
  onClose,
  onToggleCache,
  theme,
}: TracksListItemContextMenuProps) => {
  const tracksListStyles = createTracksListStyles(theme)

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
    <AnchoredDropdown
      anchor={anchor}
      onClose={onClose}
      visible={isMenuOpen}
      menuStyle={tracksListStyles.dropdownMenu}
    >
      {renderItems()}
    </AnchoredDropdown>
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
