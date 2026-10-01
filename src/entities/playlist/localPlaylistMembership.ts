import { action } from '@reatom/framework'
import { persistMyPlaylists } from './localPlaylistStorage'
import { myPlaylistsAtom } from './model'

/**
 * Переключение принадлежности проповеди локальному плейлисту.
 *
 * Обновляет `myPlaylistsAtom` (добавляет/удаляет `sermonId` в `sermonIds`
 * плейлиста, «Избранные» включены) и персистит результат тем же путём, что и
 * reorder. Чтение атома → вычисление `nextPlaylists` → коммит идут без `await`
 * между ними, поэтому конкурентные переключения не теряют изменения друг друга
 * (lost update). Неизвестный id плейлиста — no-op. Удаление отсутствующего
 * `sermonId` — no-op (идемпотентность). Запись в хранилище может отклониться
 * (сломанный нативный модуль, квота, …); такой отказ логируется, но атом уже
 * закоммичен — та же политика деградации, что и у `reorderMyPlaylists`.
 * @param playlistId - Идентификатор плейлиста, которому меняем принадлежность.
 * @param sermonId - Идентификатор проповеди.
 * @param contained - `true` — добавить, `false` — удалить.
 */
export const togglePlaylistSermon = action(
  async (ctx, playlistId: string, sermonId: string, contained: boolean) => {
    const playlists = ctx.get(myPlaylistsAtom)
    const target = playlists.find(playlist => playlist.id === playlistId)
    if (!target) return playlists

    const alreadyContained = target.sermonIds.includes(sermonId)
    if (contained === alreadyContained) return playlists

    const sermonIds = contained
      ? [...target.sermonIds, sermonId]
      : target.sermonIds.filter(id => id !== sermonId)
    const nextPlaylists = playlists.map(playlist =>
      playlist.id === playlistId ? { ...playlist, sermonIds } : playlist,
    )

    await ctx.schedule(() => {
      myPlaylistsAtom(ctx, nextPlaylists)
    })

    try {
      await persistMyPlaylists(nextPlaylists)
    } catch (error) {
      console.error('[togglePlaylistSermon] failed to persist membership:', error)
    }
    return nextPlaylists
  },
  'togglePlaylistSermon',
)
