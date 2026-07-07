import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

const ICON_SIZE = 18

export interface PlaylistCacheMenuDropdownProps {
  allCached: boolean
  isCacheAllDisabled: boolean
  isClearCacheDisabled?: boolean
  menuPosition: { right: number; top: number }
  onCacheAll: () => void
  onClearCache: () => void
  onClose: () => void
  visible: boolean
}

export const PlaylistCacheMenuDropdown = ({
  allCached,
  isCacheAllDisabled,
  isClearCacheDisabled = false,
  menuPosition,
  onCacheAll,
  onClearCache,
  onClose,
  visible,
}: PlaylistCacheMenuDropdownProps) => {
  if (!visible) return null

  return (
    <Modal transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <View style={[styles.dropdown, { right: menuPosition.right, top: menuPosition.top }]}>
          <Pressable
            onPress={onCacheAll}
            disabled={isCacheAllDisabled}
            style={[styles.dropdownItem, isCacheAllDisabled && styles.dropdownItemDisabled]}
          >
            <MaterialCommunityIcons
              size={ICON_SIZE}
              style={styles.dropdownIcon}
              color={isCacheAllDisabled ? COLORS.textMuted : COLORS.icon}
              name={allCached ? 'check-circle-outline' : 'download-outline'}
            />
            <Text
              style={[
                styles.dropdownItemText,
                isCacheAllDisabled && styles.dropdownItemTextDisabled,
              ]}
            >
              {allCached ? 'Плейлист закеширован' : 'Закешировать все'}
            </Text>
          </Pressable>

          <View style={styles.dropdownDivider} />

          <Pressable
            disabled={isClearCacheDisabled}
            style={[styles.dropdownItem, isClearCacheDisabled && styles.dropdownItemDisabled]}
            onPress={() => {
              if (isClearCacheDisabled) return
              onClearCache()
            }}
          >
            <MaterialCommunityIcons
              size={ICON_SIZE}
              name='delete-outline'
              style={styles.dropdownIcon}
              color={isClearCacheDisabled ? COLORS.disabled : COLORS.text}
            />
            <Text
              style={[styles.dropdownItemText, isClearCacheDisabled && { color: COLORS.disabled }]}
            >
              Удалить из кеша все
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

export default PlaylistCacheMenuDropdown

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUSES.low,
    elevation: 8,
    minWidth: 180,
    paddingVertical: INDENTS.lowest,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownDivider: {
    backgroundColor: COLORS.textMuted,
    height: 1,
    marginHorizontal: INDENTS.medium,
    opacity: 0.3,
  },
  dropdownIcon: { marginRight: INDENTS.low },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  dropdownItemDisabled: { opacity: 0.5 },
  dropdownItemText: { color: COLORS.text, fontSize: FONT_SIZES.base },
  dropdownItemTextDisabled: { color: COLORS.textMuted },
  overlay: { flex: 1 },
})
