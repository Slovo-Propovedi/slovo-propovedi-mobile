import { StyleSheet, View } from 'react-native'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/anchored-dropdown'
import { COLORS, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PlaylistCacheMenuItem } from './PlaylistCacheMenuItem'

export interface PlaylistCacheMenuDropdownProps {
  allCached: boolean
  anchor: AnchorRect | null
  isCacheAllDisabled: boolean
  isClearCacheDisabled?: boolean
  onCacheAll: () => void
  onClearCache: () => void
  onClose: () => void
  visible: boolean
}

export const PlaylistCacheMenuDropdown = ({
  allCached,
  anchor,
  isCacheAllDisabled,
  isClearCacheDisabled = false,
  onCacheAll,
  onClearCache,
  onClose,
  visible,
}: PlaylistCacheMenuDropdownProps) => {
  const { currentTheme } = useTheme()

  return (
    <AnchoredDropdown
      anchor={anchor}
      visible={visible}
      onClose={onClose}
      menuStyle={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
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
    </AnchoredDropdown>
  )
}

const styles = StyleSheet.create({
  dropdown: {
    borderRadius: RADIUSES.low,
    elevation: 8,
    minWidth: 180,
    paddingVertical: INDENTS.lowest,
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
})
