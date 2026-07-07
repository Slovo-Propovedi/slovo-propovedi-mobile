import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { COLORS, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import { PlaylistCacheMenuItem } from './PlaylistCacheMenuItem'

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
  const { currentTheme } = useTheme()
  if (!visible) return null

  return (
    <Modal transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: currentTheme.surface,
              right: menuPosition.right,
              top: menuPosition.top,
            },
          ]}
        >
          <PlaylistCacheMenuItem
            onPress={onCacheAll}
            isDisabled={isCacheAllDisabled}
            icon={allCached ? 'check-circle-outline' : 'download-outline'}
            text={allCached ? 'Плейлист закеширован' : 'Закешировать все'}
          />

          <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.textMuted }]} />

          <PlaylistCacheMenuItem
            icon='delete-outline'
            onPress={onClearCache}
            text='Удалить из кеша все'
            isDisabled={isClearCacheDisabled}
            textColor={isClearCacheDisabled ? COLORS.disabled : undefined}
            iconColor={isClearCacheDisabled ? COLORS.disabled : currentTheme.text}
          />
        </View>
      </Pressable>
    </Modal>
  )
}

export default PlaylistCacheMenuDropdown

const styles = StyleSheet.create({
  dropdown: {
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
    height: 1,
    marginHorizontal: INDENTS.medium,
    opacity: 0.3,
  },
  overlay: { flex: 1 },
})
