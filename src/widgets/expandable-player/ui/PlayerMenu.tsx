import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'

interface PlayerMenuProps {
  onClose: () => void
  visible: boolean
}

export const PlayerMenu = ({ onClose, visible }: PlayerMenuProps) => (
  <Modal transparent visible={visible} animationType='fade'>
    <Pressable onPress={onClose} style={styles.menuOverlay}>
      <View style={styles.menuContainer}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Описание проповеди</Text>
        </Pressable>
        <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
          <Text style={styles.menuItemTextDisabled}>Добавить в плейлист</Text>
        </Pressable>
        <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
          <Text style={styles.menuItemTextDisabled}>Настройки звука</Text>
        </Pressable>
        <Pressable style={[styles.menuItem, styles.menuItemDisabled]}>
          <Text style={styles.menuItemTextDisabled}>Поделиться</Text>
        </Pressable>
      </View>
    </Pressable>
  </Modal>
)

const styles = StyleSheet.create({
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    minWidth: 200,
    padding: INDENTS.low,
  },
  menuItem: {
    padding: INDENTS.medium,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
  menuItemTextDisabled: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
  },
  menuOverlay: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-start',
    paddingRight: INDENTS.medium,
    paddingTop: 100,
  },
})
