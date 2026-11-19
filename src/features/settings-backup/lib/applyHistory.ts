import { type Ctx } from '@reatom/framework'
import {
  clearProgressRecords,
  deriveProgressRecords,
  loadHistoryAction,
  readHistory,
  readProgressRecords,
  writeHistory,
  writeProgressRecords,
} from 'entities/listening-history'
import { type BackupImportData, type BackupImportMode } from '../model/backupPayload'
import { mergeHistory } from './mergeHistory'
import { mergeProgressRecords } from './mergeProgressRecords'

/**
 * Синхронизирует per-sermon хранилище прогресса (каталог обрезан до 100
 * записей, прогресс живёт отдельно): `replace` стирает старые записи и пишет
 * файловые + деривацию из каталога; `merge` побеждает по `updatedAt`. Следом
 * идущий loadHistoryAction гидратирует атом прогресса.
 * @param ctx - Reatom-контекст импорта.
 * @param data - Провалидированная схемой полезная нагрузка копии.
 * @param mode - Как обращаться с существующими данными.
 */
export const applyHistory = async (
  ctx: Ctx,
  data: BackupImportData,
  mode: BackupImportMode,
): Promise<void> => {
  if (!data.listeningHistory) return

  const importedRecords = data.sermonProgress ?? {}
  const derivedRecords = deriveProgressRecords(data.listeningHistory, importedRecords)

  if (mode === 'replace') {
    await clearProgressRecords()
    await writeProgressRecords({ ...importedRecords, ...derivedRecords })
    await writeHistory(data.listeningHistory)
  } else {
    const mergedRecords = mergeProgressRecords(await readProgressRecords(), {
      ...importedRecords,
      ...derivedRecords,
    })

    await writeProgressRecords(mergedRecords)
    await writeHistory(mergeHistory(await readHistory(), data.listeningHistory))
  }

  await loadHistoryAction(ctx)
}
