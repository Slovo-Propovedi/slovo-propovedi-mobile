import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

interface PlayerMenuProps {
  onClose: () => void
}

export const PlayerMenu = ({ onClose }: PlayerMenuProps) => (
  <>
    <Pressable onPress={onClose} style={styles.backdrop} />
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
  </>
)

const styles = StyleSheet.create({
  backdrop: {
    bottom: -999,
    left: -999,
    position: 'absolute',
    right: -999,
    top: -999,
    zIndex: 1,
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.middle,
    bottom: '100%',
    minWidth: 200,
    padding: INDENTS.low,
    position: 'absolute',
    right: 0,
    zIndex: 2,
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
})
