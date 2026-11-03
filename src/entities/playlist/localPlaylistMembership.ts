import { action } from '@reatom/framework'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  resetPlaybackAction,
} from 'entities/player/@x/playlist'
import { type SermonShape } from 'shared/model'
import { toPersistedLocalSermon } from './lib/sanitizeLocalPlaylistSermon'
import { syncQueueAfterSermonRemoval } from './lib/syncQueueAfterSermonRemoval'
import { type LocalPlaylistData, MAX_CUSTOM_PLAYLIST_SERMONS } from './localPlaylists'
import { persistMyPlaylists } from './localPlaylistStorage'
import { myPlaylistsAtom } from './model'

/** Итог переключения принадлежности проповеди локальному плейлисту. */
type TogglePlaylistSermonOutcome = 'added' | 'limit-reached' | 'noop' | 'removed'

/** Сообщение тоста о достигнутом лимите проповедей в плейлисте. */
export const PLAYLIST_SERMON_LIMIT_MESSAGE = `В плейлисте максимум ${MAX_CUSTOM_PLAYLIST_SERMONS} проповедей`

// `sermonIds` is the authoritative membership list, updated directly: an imported
// playlist carries ids without snapshots, so re-deriving from `sermons` would drop those.
const addSermonSnapshot = (playlist: LocalPlaylistData, sermon: SermonShape): LocalPlaylistData => {
  const sermonIds = playlist.sermonIds.includes(sermon.id)
    ? playlist.sermonIds
    : [...playlist.sermonIds, sermon.id]

  return {
    ...playlist,
    sermonIds,
    sermons: [...playlist.sermons, toPersistedLocalSermon(sermon)],
  }
}

const removeSermonSnapshot = (
  playlist: LocalPlaylistData,
  sermonId: string,
): LocalPlaylistData => ({
  ...playlist,
  sermonIds: playlist.sermonIds.filter(id => id !== sermonId),
  sermons: playlist.sermons.filter(item => item.id !== sermonId),
})

/**
 * Переключение принадлежности проповеди локальному плейлисту.
 * Обновляет `myPlaylistsAtom` (добавляет/удаляет id в `sermonIds` и снапшот
 * проповеди в `sermons`, «Избранные» включены) и персистит результат тем же
 * путём, что и reorder. Снапшот проходит санитизацию (`toPersistedLocalSermon`),
 * чтобы гарантированно проходить `sermonDataSchema` при чтении и быть
 * рендерящимся и проигрываемым офлайн. `sermonIds` обновляются напрямую (id
 * дописывается при добавлении с дедупликацией и фильтруется при удалении), а не
 * выводятся заново из `sermons`, поэтому id-only участники импортированного
 * плейлиста (`{ sermonIds: ['a','b','c'], sermons: [] }`) не теряются.
 * Чтение атома → вычисление `nextPlaylists` → коммит идут без `await` между
 * ними, поэтому конкурентные переключения не теряют изменения друг друга
 * (lost update). Неизвестный id плейлиста — no-op. Удаление отсутствующей
 * проповеди — no-op (идемпотентность). Добавление сверх
 * `MAX_CUSTOM_PLAYLIST_SERMONS` — no-op с исходом `limit-reached` (атом и
 * хранилище не трогаются), чтобы плейлист не разросся за бюджет ссылки.
 * Запись в хранилище может отклониться (сломанный нативный модуль, квота, …);
 * такой отказ логируется, но атом уже закоммичен — та же политика деградации,
 * что и у `reorderMyPlaylists`.
 * Удаление проповеди, которая сейчас играет из этого же плейлиста
 * (`currentAudioAtom`/`currentPlaylistAtom`), закрывает плеер (`resetPlaybackAction`)
 * — единственная точка сброса для всех поверхностей удаления. Вызывающий может
 * подавить этот сброс через `options.suppressPlayerReset` — тогда он сам
 * оркестрирует закрытие плеера (например, предлагает продолжить в другом
 * плейлисте): принадлежность меняется, а `resetPlaybackAction` не вызывается.
 * Удаление НЕ текущей проповеди из играющего плейлиста обновляет контекст очереди
 * (`setCurrentPlaylistAction`) — боттомшит и next/prev видят удаление сразу.
 * @param playlistId - Идентификатор плейлиста, которому меняем принадлежность.
 * @param sermon - Полная проповедь (для добавления сохраняется её снапшот).
 * @param contained - `true` — добавить, `false` — удалить.
 * @param options - `suppressPlayerReset: true` — не закрывать плеер изнутри
 * (сброс на совести вызывающего).
 * @returns Исход операции: `added`/`removed` при изменении, `noop` — нечего
 * менять, `limit-reached` — добавление отклонено из-за лимита.
 */
export const togglePlaylistSermon = action(
  async (
    ctx,
    playlistId: string,
    sermon: SermonShape,
    contained: boolean,
    options?: { suppressPlayerReset?: boolean },
  ): Promise<TogglePlaylistSermonOutcome> => {
    const playlists = ctx.get(myPlaylistsAtom)
    const target = playlists.find(playlist => playlist.id === playlistId)
    if (!target) return 'noop'

    const alreadyContained = target.sermonIds.includes(sermon.id)
    if (contained === alreadyContained) return 'noop'

    if (contained && target.sermonIds.length >= MAX_CUSTOM_PLAYLIST_SERMONS) return 'limit-reached'

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

    if (contained) return 'added'

    // Удаление текущей проповеди из её плейлиста закрывает плеер (нотификейшн-бар
    // + миниплеер) независимо от поверхности (меню строки, меню плеера, модалка
    // «Добавить в плейлист»). Очередь умирает вместе с плеером.
    const isRemovingCurrentSermon =
      ctx.get(currentAudioAtom)?.id === sermon.id && ctx.get(currentPlaylistAtom)?.id === playlistId
    if (isRemovingCurrentSermon) {
      if (!options?.suppressPlayerReset) void resetPlaybackAction(ctx)
      return 'removed'
    }

    // Очередь плеера (боттомшит) следует за удалениями из играющего плейлиста.
    await syncQueueAfterSermonRemoval(ctx, playlistId, sermon.id)

    return 'removed'
  },
  'togglePlaylistSermon',
)
