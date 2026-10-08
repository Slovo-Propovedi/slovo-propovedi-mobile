import { ctx } from 'shared/lib/reatom-ctx'
import { backupAutosyncEnabledAtom, backupFolderUriAtom } from '../model/backupFolder'
import { AUTO_BACKUP_FILE_NAME } from '../model/backupScalars'
import { buildPayload } from './buildPayload'
import { supportsFolderSync, writeFile } from './fileIo'

const performAutoBackup = async (): Promise<void> => {
  // Фоновый автосейв имеет смысл только там, где папка переживает сессию
  // (Android / web с File System Access API): на iOS грант папки — сессионный.
  if (!supportsFolderSync()) return

  const folderUri = ctx.get(backupFolderUriAtom)
  if (!ctx.get(backupAutosyncEnabledAtom) || !folderUri) return

  const payload = await buildPayload()
  await writeFile(folderUri, AUTO_BACKUP_FILE_NAME, JSON.stringify(payload))
}

// Сериализация записей: хвост promise-цепочки гарантирует, что параллельные
// flush не перезапишут `slovo-backup-auto.json` вразнобой (паттерн historyWriteQueue).
let autoBackupWriteQueue: Promise<void> = Promise.resolve()

/**
 * Пишет авторезервную копию в фоне, выстраивая вызовы в очередь.
 *
 * Ничего не делает, если платформа/папка/флаг не позволяют автосейв. Ошибки
 * логируются и не рвут цепочку.
 */
export const writeAutoBackup = (): Promise<void> => {
  autoBackupWriteQueue = autoBackupWriteQueue.then(performAutoBackup).catch(error => {
    console.warn('[settings-backup] auto backup failed:', error)
  })

  return autoBackupWriteQueue
}
