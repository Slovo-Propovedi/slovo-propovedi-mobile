import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text } from 'react-native'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/anchored-dropdown'
import { FONT_SIZES, RADIUSES, useTheme } from 'shared/ui/theme'

export interface HistoryHeaderMenuDropdownProps {
  anchor: AnchorRect | null
  onClear: () => void
  onClose: () => void
  visible: boolean
}

export const HistoryHeaderMenuDropdown = ({
  anchor,
  onClear,
  onClose,
  visible,
}: HistoryHeaderMenuDropdownProps) => {
  const { currentTheme } = useTheme()

  return (
    <AnchoredDropdown
      anchor={anchor}
      visible={visible}
      onClose={onClose}
      menuStyle={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
    >
      <Pressable onPress={onClear} style={styles.menuItem} accessibilityRole='button'>
        <MaterialCommunityIcons
          size={18}
          name='delete-outline'
          color={currentTheme.text}
          style={styles.actionIcon}
        />
        <Text style={[styles.actionText, { color: currentTheme.text }]}>Очистить историю</Text>
      </Pressable>
    </AnchoredDropdown>
  )
}

const styles = StyleSheet.create({
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: FONT_SIZES.base,
  },
  dropdown: {
    borderRadius: RADIUSES.low,
    elevation: 8,
    minWidth: 180,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
