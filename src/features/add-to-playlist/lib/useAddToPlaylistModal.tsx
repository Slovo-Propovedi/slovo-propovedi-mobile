import { useCallback, useState } from 'react'
import { AddToPlaylistModal } from '../ui/AddToPlaylistModal'

/**
 * Держит состояние «Добавить в плейлист» для экрана: открывает модалку по
 * проповеди и возвращает её готовый элемент для рендера. Состояние живёт на
 * уровне экрана (не строки), поэтому в списке рендерится одна модалка, а не по
 * одной на каждую строку.
 *
 * Использование: `const { openAddToPlaylist, modal } = useAddToPlaylistModal()`,
 * затем `onAddToPlaylist: openAddToPlaylist` в меню и `{modal}` в разметке.
 */
export const useAddToPlaylistModal = () => {
  const [sermonId, setSermonId] = useState<null | string>(null)

  const openAddToPlaylist = useCallback((sermon: { id: string }) => {
    setSermonId(sermon.id)
  }, [])

  const closeAddToPlaylist = useCallback(() => setSermonId(null), [])

  return {
    modal: sermonId && (
      <AddToPlaylistModal visible sermon={{ id: sermonId }} onClose={closeAddToPlaylist} />
    ),
    openAddToPlaylist,
  }
}
