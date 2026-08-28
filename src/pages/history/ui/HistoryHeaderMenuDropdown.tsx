import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text } from 'react-native'
import { FONT_SIZES, RADIUSES, useTheme } from 'shared/ui/theme'

export interface HistoryHeaderMenuDropdownProps {
  menuPosition: { right: number; top: number }
  onClear: () => void
  onClose: () => void
  visible: boolean
}

export const HistoryHeaderMenuDropdown = ({
  menuPosition,
  onClear,
  onClose,
  visible,
}: HistoryHeaderMenuDropdownProps) => {
  const { currentTheme } = useTheme()
  if (!visible) return null

  return (
    <Modal transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable
          onPress={onClear}
          accessibilityRole='button'
          style={[
            styles.dropdown,
            {
              backgroundColor: currentTheme.surface,
              right: menuPosition.right,
              top: menuPosition.top,
            },
          ]}
        >
          <MaterialCommunityIcons
            size={18}
            name='delete-outline'
            color={currentTheme.text}
            style={styles.actionIcon}
          />
          <Text style={[styles.actionText, { color: currentTheme.text }]}>Очистить историю</Text>
        </Pressable>
      </Pressable>
    </Modal>
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
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    elevation: 8,
    flexDirection: 'row',
    minWidth: 180,
    paddingVertical: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  overlay: { flex: 1 },
})
