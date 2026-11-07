import { useCallback } from 'react'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { usePlayNewSermon } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'
import { buildOfflinePlaylist } from './offlinePlaylist'

export const OFFLINE_PLAYBACK_ERROR_MESSAGE = 'Не удалось воспроизвести офлайн-проповедь'

/**
 * Plays the whole offline collection as one queue, starting from its first
 * sermon. The header menu is an explicit "play all" action, so there is no
 * chooser and no dialog.
 * @param items - Offline screen items in screen order.
 */
export const usePlayAllOffline = (items: OfflineSermonItem[]) => {
  const playNewSermon = usePlayNewSermon()

  return useCallback(() => {
    const [firstItem] = items
    if (!firstItem) return

    void playNewSermon({ playlist: buildOfflinePlaylist(items), sermon: firstItem.sermon }).catch(
      error => reportError(error, OFFLINE_PLAYBACK_ERROR_MESSAGE),
    )
  }, [items, playNewSermon])
}
