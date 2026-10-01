import { action } from '@reatom/framework'
import { type SermonShape } from 'shared/model'
import { toPersistedLocalSermon } from './lib/sanitizeLocalPlaylistSermon'
import { type LocalPlaylistData } from './localPlaylists'
import { persistMyPlaylists } from './localPlaylistStorage'
import { myPlaylistsAtom } from './model'

const withSermons = (playlist: LocalPlaylistData, sermons: SermonShape[]): LocalPlaylistData => ({
  ...playlist,
  sermonIds: sermons.map(item => item.id),
  sermons,
})

const addSermonSnapshot = (playlist: LocalPlaylistData, sermon: SermonShape) =>
  withSermons(playlist, [...playlist.sermons, toPersistedLocalSermon(sermon)])

const removeSermonSnapshot = (playlist: LocalPlaylistData, sermonId: string) =>
  withSermons(
    playlist,
    playlist.sermons.filter(item => item.id !== sermonId),
  )

/**
 * Переключение принадлежности проповеди локальному плейлисту.
 *
 * Обновляет `myPlaylistsAtom` (добавляет/удаляет снапшот проповеди в `sermons`
 * плейлиста, «Избранные» включены) и персистит результат тем же путём, что и
 * reorder. Снапшот проходит санитизацию (`toPersistedLocalSermon`), чтобы
 * гарантированно проходить `sermonDataSchema` при чтении и быть рендерящимся
 * и проигрываемым офлайн. `sermonIds` остаются производными от `sermons`.
 * Чтение атома → вычисление `nextPlaylists` → коммит идут без `await` между
 * ними, поэтому конкурентные переключения не теряют изменения друг друга
 * (lost update). Неизвестный id плейлиста — no-op. Удаление отсутствующей
 * проповеди — no-op (идемпотентность). Запись в хранилище может отклониться
 * (сломанный нативный модуль, квота, …); такой отказ логируется, но атом уже
 * закоммичен — та же политика деградации, что и у `reorderMyPlaylists`.
 * @param playlistId - Идентификатор плейлиста, которому меняем принадлежность.
 * @param sermon - Полная проповедь (для добавления сохраняется её снапшот).
 * @param contained - `true` — добавить, `false` — удалить.
 */
export const togglePlaylistSermon = action(
  async (ctx, playlistId: string, sermon: SermonShape, contained: boolean) => {
    const playlists = ctx.get(myPlaylistsAtom)
    const target = playlists.find(playlist => playlist.id === playlistId)
    if (!target) return playlists

    const alreadyContained = target.sermonIds.includes(sermon.id)
    if (contained === alreadyContained) return playlists

    const nextPlaylists = playlists.map(playlist => {
      if (playlist.id !== playlistId) return playlist
      return contained
        ? addSermonSnapshot(playlist, sermon)
        : removeSermonSnapshot(playlist, sermon.id)
    })

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
