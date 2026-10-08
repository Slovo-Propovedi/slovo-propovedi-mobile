import { action, type Ctx } from '@reatom/framework'
import { loadHistoryAction, readHistory, writeHistory } from 'entities/listening-history'
import {
  loadMyPlaylists,
  normalizeLocalPlaylist,
  persistMyPlaylists,
  persistSectionSettings,
  readStoredMyPlaylists,
  updateSectionSettings,
  withFavoritesFirst,
} from 'entities/playlist'
import { type BackupImportData, type BackupImportMode } from '../model/backupPayload'
import { applyPlayerScalars, applySettingsScalars, applyYouTubeImport } from './applyBackupScalars'
import { mergeHistory } from './mergeHistory'
import { mergePlaylists } from './mergePlaylists'

const applyHistory = async (
  ctx: Ctx,
  data: BackupImportData,
  mode: BackupImportMode,
): Promise<void> => {
  if (!data.listeningHistory) return

  const next =
    mode === 'replace'
      ? data.listeningHistory
      : mergeHistory(await readHistory(), data.listeningHistory)

  await writeHistory(next)
  await loadHistoryAction(ctx)
}

const applyPlaylists = async (
  ctx: Ctx,
  data: BackupImportData,
  mode: BackupImportMode,
): Promise<void> => {
  if (!data.myPlaylists) return

  const imported = data.myPlaylists.map(normalizeLocalPlaylist)
  const next =
    mode === 'replace'
      ? withFavoritesFirst(imported)
      : mergePlaylists(await readStoredMyPlaylists(), imported)

  await persistMyPlaylists(next)
  await loadMyPlaylists(ctx)
}

const applySectionSettings = async (ctx: Ctx, data: BackupImportData): Promise<void> => {
  if (!data.myPlaylistsSectionSettings) return

  // updateSectionSettings коммитит атом, persistSectionSettings пишет его в
  // хранилище — повторный loadSectionSettings читал бы то же самое из storage.
  await updateSectionSettings(ctx, data.myPlaylistsSectionSettings)
  await persistSectionSettings(ctx)
}

/**
 * Применяет разобранную резервную копию к состоянию приложения.
 *
 * `replace` пишет данные файла как есть (через владельческие пути записи),
 * `merge` сливает историю/плейлисты и накладывает скаляры только по
 * присутствующим полям. После записи владельческие load-экшены обновляют атомы.
 *
 * Порядок применения: сначала дешёвые скаляры, затем настройки секции и, в
 * последнюю очередь, история и плейлисты. Импорт не транзакционен — при ошибке
 * применяются только уже обработанные секции (см. Docs/features/settings-backup.md).
 * @param ctx - Reatom-контекст экшена.
 * @param data - Провалидированная схемой полезная нагрузка копии.
 * @param mode - Как обращаться с существующими данными.
 */
export const applyImport = action(async (ctx, data: BackupImportData, mode: BackupImportMode) => {
  await applySettingsScalars(ctx, data.settings)
  await applyPlayerScalars(ctx, data.player)
  await applyYouTubeImport(data.youtubeImport)
  await applySectionSettings(ctx, data)
  await applyHistory(ctx, data, mode)
  await applyPlaylists(ctx, data, mode)
}, 'applyImport')
