import { type Ctx } from '@reatom/framework'
import {
  type LocalPlaylistData,
  PLAYLIST_SERMON_LIMIT_MESSAGE,
  togglePlaylistSermon,
} from 'entities/playlist'
import { type SermonShape, showToast } from 'shared/model'

const addMissingSermons = async (
  ctx: Ctx,
  target: LocalPlaylistData,
  sourceSermons: SermonShape[],
) => {
  const existingIds = new Set(target.sermonIds)
  for (const sermon of sourceSermons) {
    if (existingIds.has(sermon.id)) continue
    const outcome = await togglePlaylistSermon(ctx, target.id, sermon, true)
    if (outcome !== 'limit-reached') continue
    showToast(ctx, PLAYLIST_SERMON_LIMIT_MESSAGE)
    return
  }
}

const removeSourceSermons = async (
  ctx: Ctx,
  target: LocalPlaylistData,
  sourceSermons: SermonShape[],
) => {
  for (const sermon of sourceSermons) await togglePlaylistSermon(ctx, target.id, sermon, false)
}

/**
 * Применяет черновик пачки «все проповеди в плейлист» к изменившимся плейлистам.
 * Включённый плейлист добирает отсутствующие проповеди исходного списка (по
 * снапшотам), выключенный — теряет их все. Добавление останавливается на первом
 * исходе `limit-reached` с тостом о лимите — дальше этот плейлист не трогается.
 * @param ctx - Reatom-контекст.
 * @param args - Черновик, снапшот плейлистов и исходные проповеди.
 * @param args.changedValues - Черновик «id плейлиста → новое значение».
 * @param args.playlists - Снимок плейлистов на момент сохранения.
 * @param args.sourceSermons - Исходные проповеди (снапшоты для добавления).
 */
export const applyAllMembership = async (
  ctx: Ctx,
  {
    changedValues,
    playlists,
    sourceSermons,
  }: {
    changedValues: Record<string, boolean>
    playlists: LocalPlaylistData[]
    sourceSermons: SermonShape[]
  },
) => {
  for (const [playlistId, value] of Object.entries(changedValues)) {
    const target = playlists.find(playlist => playlist.id === playlistId)
    if (!target) continue
    if (value) await addMissingSermons(ctx, target, sourceSermons)
    else await removeSourceSermons(ctx, target, sourceSermons)
  }
}
