import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { type TrackToCache } from '../lib/PlaylistOfflineService'

export const PlaylistOfflineDialogs = ({
  cachedCount,
  cacheDialogVisible,
  clearDialogVisible,
  onAddAllToOfflineConfirm,
  onAddToOfflineCancel,
  onClearCacheConfirm,
  onClearCancel,
  tracksData,
}: {
  cachedCount: number
  cacheDialogVisible: boolean
  clearDialogVisible: boolean
  onAddAllToOfflineConfirm: () => void
  onAddToOfflineCancel: () => void
  onClearCacheConfirm: () => void
  onClearCancel: () => void
  tracksData: TrackToCache[]
}) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <ConfirmDialog
        cancelText='Отмена'
        visible={cacheDialogVisible}
        onCancel={onAddToOfflineCancel}
        confirmColor={currentTheme.primary}
        onConfirm={onAddAllToOfflineConfirm}
        title='Добавление плейлиста в офлайн'
        confirmText='Добавить весь плейлист в офлайн'
        message={`Добавить все треки (${tracksData.length}) в офлайн для прослушивания без интернета?`}
      />
      <ConfirmDialog
        cancelText='Отмена'
        title='Удаление офлайна'
        onCancel={onClearCancel}
        confirmText='Удалить всё'
        visible={clearDialogVisible}
        onConfirm={onClearCacheConfirm}
        confirmColor={currentTheme.primary}
        message={`Удалить ${cachedCount} треков из офлайн?`}
      />
    </>
  )
}
