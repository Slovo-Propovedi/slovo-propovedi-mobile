import { StyleSheet, View } from 'react-native'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/anchored-dropdown'
import { COLORS, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PlaylistCacheMenuItem } from './PlaylistCacheMenuItem'
import { PlaylistHistoryMenuItem } from './PlaylistHistoryMenuItem'

export interface PlaylistHeaderMenuDropdownProps {
  allCached: boolean
  anchor: AnchorRect | null
  canMarkAll: boolean
  canRemoveFromHistory: boolean
  isCacheAllDisabled: boolean
  isCaching: boolean
  isClearCacheDisabled?: boolean
  onCacheAll: () => void
  onClearCache: () => void
  onClose: () => void
  onMarkAll: () => void
  onRemoveFromHistory: () => void
  onStopCaching: () => void
  visible: boolean
}

export const PlaylistHeaderMenuDropdown = ({
  allCached,
  anchor,
  canMarkAll,
  canRemoveFromHistory,
  isCacheAllDisabled,
  isCaching,
  isClearCacheDisabled = false,
  onCacheAll,
  onClearCache,
  onClose,
  onMarkAll,
  onRemoveFromHistory,
  onStopCaching,
  visible,
}: PlaylistHeaderMenuDropdownProps) => {
  const { currentTheme } = useTheme()
  const showHistoryItems = canMarkAll || canRemoveFromHistory

  return (
    <AnchoredDropdown
      anchor={anchor}
      visible={visible}
      onClose={onClose}
      menuStyle={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
    >
      {isCaching ? (
        <PlaylistCacheMenuItem
          onPress={onStopCaching}
          icon='stop-circle-outline'
          text='Остановить кеширование'
        />
      ) : (
        <PlaylistCacheMenuItem
          onPress={onCacheAll}
          isDisabled={isCacheAllDisabled}
          icon={allCached ? 'check-circle-outline' : 'download-outline'}
          text={allCached ? 'Плейлист закеширован' : 'Закешировать все'}
        />
      )}

      <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.textMuted }]} />

      <PlaylistCacheMenuItem
        icon='delete-outline'
        onPress={onClearCache}
        text='Удалить из кеша все'
        isDisabled={isClearCacheDisabled}
        textColor={isClearCacheDisabled ? COLORS.disabled : undefined}
        iconColor={isClearCacheDisabled ? COLORS.disabled : currentTheme.text}
      />

      {showHistoryItems && (
        <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.textMuted }]} />
      )}
      {canMarkAll && (
        <PlaylistHistoryMenuItem
          onPress={onMarkAll}
          icon='checkmark-done'
          text='Пометить все прослушанными'
        />
      )}
      {canRemoveFromHistory && (
        <PlaylistHistoryMenuItem
          icon='trash-outline'
          onPress={onRemoveFromHistory}
          text='Удалить проповеди из истории'
        />
      )}
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
