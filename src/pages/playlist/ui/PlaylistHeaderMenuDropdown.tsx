import { type RefObject } from 'react'
import { StyleSheet, View } from 'react-native'
import { AnchoredDropdown, type AnchorRect } from 'shared/ui/menu'
import { COLORS, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PlaylistHistoryMenuItem } from './PlaylistHistoryMenuItem'
import { PlaylistOfflineMenuItem } from './PlaylistOfflineMenuItem'
import { PlaylistShareMenuItem } from './PlaylistShareMenuItem'

export interface PlaylistHeaderMenuDropdownProps {
  allCached: boolean
  anchor: AnchorRect | null
  anchorRef?: RefObject<null | View>
  canMarkAll: boolean
  canRemoveFromHistory: boolean
  isAddAllToOfflineDisabled: boolean
  isCaching: boolean
  isClearCacheDisabled?: boolean
  onAddAllToOffline: () => void
  onClearCache: () => void
  onClose: () => void
  onMarkAll: () => void
  onRemoveFromHistory: () => void
  onShare: () => void
  onStopCaching: () => void
  visible: boolean
}

export const PlaylistHeaderMenuDropdown = ({
  allCached,
  anchor,
  anchorRef,
  canMarkAll,
  canRemoveFromHistory,
  isAddAllToOfflineDisabled,
  isCaching,
  isClearCacheDisabled = false,
  onAddAllToOffline,
  onClearCache,
  onClose,
  onMarkAll,
  onRemoveFromHistory,
  onShare,
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
      anchorRef={anchorRef}
      menuStyle={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
    >
      <PlaylistShareMenuItem onPress={onShare} text='Поделиться плейлистом' />

      <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.textMuted }]} />

      {isCaching ? (
        <PlaylistOfflineMenuItem
          onPress={onStopCaching}
          icon='stop-circle-outline'
          text='Остановить добавление в офлайн'
        />
      ) : (
        <PlaylistOfflineMenuItem
          onPress={onAddAllToOffline}
          isDisabled={isAddAllToOfflineDisabled}
          icon={allCached ? 'check-circle-outline' : 'cloud-download'}
          text={allCached ? 'Плейлист в офлайне' : 'Добавить все в офлайн'}
        />
      )}

      <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.textMuted }]} />

      <PlaylistOfflineMenuItem
        icon='delete-outline'
        onPress={onClearCache}
        text='Удалить из офлайн все'
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
    boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
    elevation: 8,
    minWidth: 180,
    paddingVertical: INDENTS.lowest,
  },
  dropdownDivider: {
    height: 1,
    marginHorizontal: INDENTS.medium,
    opacity: 0.3,
  },
})
