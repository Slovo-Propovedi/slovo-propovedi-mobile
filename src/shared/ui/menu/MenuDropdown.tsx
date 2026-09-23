import { Ionicons } from '@expo/vector-icons'
import { type ComponentProps, type RefObject } from 'react'
import { StyleSheet, Text, type View } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PressableButton } from '../pressable-button'
import { AnchoredDropdown, type AnchorRect } from './AnchoredDropdown'

export interface MenuDropdownProps {
  anchor: AnchorRect | null
  anchorRef?: RefObject<null | View>
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

export const MenuDropdown = ({ anchor, anchorRef, items, onClose, visible }: MenuDropdownProps) => {
  const { currentTheme } = useTheme()

  // Esc handling lives in the AnchoredDropdown primitive (shared by all menus).
  return (
    <AnchoredDropdown
      anchor={anchor}
      onClose={onClose}
      visible={visible}
      anchorRef={anchorRef}
      menuStyle={[styles.menu, { backgroundColor: currentTheme.surface }]}
    >
      {items.map((item, index) => (
        <PressableButton
          disabled={item.disabled}
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
    boxShadow: '0px 0px 8px rgba(0,0,0,0.25)',
    elevation: 101,
    minWidth: MENU_MIN_WIDTH,
    zIndex: 101,
  },
})
