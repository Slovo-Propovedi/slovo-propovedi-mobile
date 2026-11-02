import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useCallback, useMemo } from 'react'
import { type SermonShape, showToast } from 'shared/model'
import { PLAYLIST_SERMON_LIMIT_MESSAGE, togglePlaylistSermon } from '../localPlaylistMembership'
import { FAVORITES_PLAYLIST } from '../localPlaylists'
import { myPlaylistsAtom } from '../model'

/**
 * Признак «в избранном» и переключатель избранного для проповеди.
 *
 * «Избранные» — локальный плейлист (`FAVORITES_PLAYLIST`) в `myPlaylistsAtom`,
 * поэтому состояние читается из атома, а переключение идёт через
 * `togglePlaylistSermon` — тот же путь, что и у остальных поверхностей
 * (снапшот проповеди сохраняется, изменения персистятся).
 * Сердечко — это закладка, а не транспорт: снятие избранного никогда не
 * закрывает плеер. Полноэкранное сердечко живёт ВНУТРИ плеера, поэтому
 * удаление проповеди, которая сейчас играет из «Избранных», не должно
 * обрывать воспроизведение — переключение идёт с `suppressPlayerReset`.
 * @param sermon - Проповедь, для которой читаем/переключаем избранное; `null` — нет цели.
 * @returns `isFavorite` — проповедь уже в «Избранном»; `toggleFavorite` — переключатель
 * (no-op при `sermon === null`).
 */
export const useFavoriteSermon = (
  sermon: null | SermonShape,
): { isFavorite: boolean; toggleFavorite: () => void } => {
  const ctx = useCtx()
  const [playlists] = useAtom(myPlaylistsAtom)
  const showToastAction = useAction(showToast)

  const isFavorite = useMemo(
    () =>
      sermon !== null &&
      (playlists
        .find(playlist => playlist.id === FAVORITES_PLAYLIST.id)
        ?.sermonIds.includes(sermon.id) ??
        false),
    [playlists, sermon],
  )

  const toggleFavorite = useCallback(() => {
    if (sermon === null) return

    void togglePlaylistSermon(ctx, FAVORITES_PLAYLIST.id, sermon, !isFavorite, {
      suppressPlayerReset: true,
    }).then(outcome => {
      if (outcome === 'limit-reached') showToastAction(PLAYLIST_SERMON_LIMIT_MESSAGE)
    })
  }, [ctx, isFavorite, sermon, showToastAction])

  return { isFavorite, toggleFavorite }
}
