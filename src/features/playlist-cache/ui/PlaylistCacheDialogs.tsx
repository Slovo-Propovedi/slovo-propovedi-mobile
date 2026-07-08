import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/themed'
import { type TrackToCache } from '../lib/PlaylistCacheService'

interface PlaylistCacheDialogsProps {
  cachedCount: number
  cacheDialogVisible: boolean
  clearDialogVisible: boolean
  onCacheAllConfirm: () => void
  onCacheCancel: () => void
  onClearCacheConfirm: () => void
  onClearCancel: () => void
  tracksData: TrackToCache[]
}

export const PlaylistCacheDialogs = ({
  cachedCount,
  cacheDialogVisible,
  clearDialogVisible,
  onCacheAllConfirm,
  onCacheCancel,
  onClearCacheConfirm,
  onClearCancel,
  tracksData,
}: PlaylistCacheDialogsProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <ConfirmDialog
        cancelText='Отмена'
        onCancel={onCacheCancel}
        visible={cacheDialogVisible}
        onConfirm={onCacheAllConfirm}
        title='Кеширование плейлиста'
        confirmColor={currentTheme.primary}
        confirmText='Закешировать весь плейлист'
        message={`Загрузить все треки (${tracksData.length}) для прослушивания без интернета?`}
      />
      <ConfirmDialog
        cancelText='Отмена'
        title='Удаление кеша'
        onCancel={onClearCancel}
        confirmText='Удалить всё'
        visible={clearDialogVisible}
        onConfirm={onClearCacheConfirm}
        confirmColor={currentTheme.primary}
        message={`Удалить ${cachedCount} закешированных треков из кеша?`}
      />
    </>
  )
}
