import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { type ComponentProps, Fragment, type ReactElement, type RefObject } from 'react'
import { StyleSheet, Text, type ViewInstance } from 'react-native'
import { PressableButton } from '../pressable-button/PressableButton'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'
import { AnchoredDropdown } from './AnchoredDropdown'
import { type AnchorRect } from './anchorRect'

export type MenuItem = IoniconMenuItem | MaterialMenuItem

// Family-discriminated so a Material Community glyph name never leaks into the
// Ionicons branch (and vice versa).
interface IoniconMenuItem extends MenuItemBase {
  icon?: ComponentProps<typeof Ionicons>['name']
  iconFamily?: 'ionicons'
}

interface MaterialMenuItem extends MenuItemBase {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name']
  iconFamily: 'material-community'
}

interface MenuItemBase {
  disabled?: boolean
  onPress: () => void
  text: string
}

const ICON_SIZE = 18
const ICON_MARGIN_RIGHT = 8
const MENU_MIN_WIDTH = 180

export const MenuDropdown = ({
  anchor,
  anchorRef,
  items,
  onClose,
  placement = 'above',
  renderItem,
  visible,
}: {
  anchor: AnchorRect | null
  anchorRef?: RefObject<null | ViewInstance>
  items: ReadonlyArray<MenuItem>
  onClose: () => void
  /** Side of the anchor the menu prefers to open on; defaults to `above`. */
  placement?: 'above' | 'below'
  /** Wraps each rendered row; falls back to the bare row when omitted. */
  renderItem?: (row: ReactElement, item: MenuItem) => ReactElement
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  // Esc handling lives in the AnchoredDropdown primitive (shared by all menus).
  return (
    <AnchoredDropdown
      anchor={anchor}
      onClose={onClose}
      visible={visible}
      anchorRef={anchorRef}
      placement={placement}
      menuStyle={[styles.menu, { backgroundColor: currentTheme.surface }]}
    >
      {items.map((item, index) => {
        const row = (
          <PressableButton
            disabled={item.disabled}
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
            {item.icon &&
              (item.iconFamily === 'material-community' ? (
                <MaterialCommunityIcons
                  size={ICON_SIZE}
                  name={item.icon}
                  style={styles.itemIcon}
                  color={currentTheme.text}
                />
              ) : (
                <Ionicons
                  size={ICON_SIZE}
                  name={item.icon}
                  style={styles.itemIcon}
                  color={currentTheme.text}
                />
              ))}
            <Text style={[styles.itemText, { color: currentTheme.text }]}>{item.text}</Text>
          </PressableButton>
        )

        return (
          <Fragment key={`${item.text}-${index}`}>
            {renderItem ? renderItem(row, item) : row}
          </Fragment>
        )
      })}
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
