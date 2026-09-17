import { Ionicons } from '@expo/vector-icons'
import { type ComponentProps } from 'react'
import { Platform, StyleSheet, Text } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PressableButton } from '../pressable-button'
import { AnchoredDropdown, type AnchorRect } from './AnchoredDropdown'

export interface MenuDropdownProps {
  anchor: AnchorRect | null
  items: ReadonlyArray<MenuItem>
  onClose: () => void
  visible: boolean
}

export interface MenuItem {
  disabled?: boolean
  icon?: ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  text: string
}

const ICON_SIZE = 18
const ICON_MARGIN_RIGHT = 8
const MENU_MIN_WIDTH = 180

export const MenuDropdown = ({ anchor, items, onClose, visible }: MenuDropdownProps) => {
  const { currentTheme } = useTheme()

  // Esc behaves exactly like the backdrop/outside tap: it closes the menu.
  useEscapeKey({
    enabled: Platform.OS === 'web' && visible,
    onEscape: onClose,
  })

  return (
    <AnchoredDropdown
      anchor={anchor}
      onClose={onClose}
      visible={visible}
      menuStyle={[styles.menu, { backgroundColor: currentTheme.surface }]}
    >
      {items.map((item, index) => (
        <PressableButton
          key={`${item.text}-${index}`}
          style={[styles.item, item.disabled && styles.itemDisabled]}
          accessibilityState={item.disabled ? { disabled: true } : undefined}
          onPress={
            item.disabled
              ? undefined
              : () => {
                  item.onPress()
                  onClose()
                }
          }
        >
          {item.icon && (
            <Ionicons
              size={ICON_SIZE}
              name={item.icon}
              style={styles.itemIcon}
              color={currentTheme.text}
            />
          )}
          <Text style={[styles.itemText, { color: currentTheme.text }]}>{item.text}</Text>
        </PressableButton>
      ))}
    </AnchoredDropdown>
  )
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: INDENTS.medium,
  },
  itemDisabled: { opacity: 0.5 },
  itemIcon: {
    marginRight: ICON_MARGIN_RIGHT,
  },
  itemText: {
    fontSize: FONT_SIZES.base,
  },
  menu: {
    borderRadius: RADIUSES.middle,
    elevation: 101,
    minWidth: MENU_MIN_WIDTH,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 101,
  },
})
