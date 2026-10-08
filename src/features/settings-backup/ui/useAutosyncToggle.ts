import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { buildValidatedPayloadJson } from '../lib/buildValidatedPayload'
import { listFiles, readFile, writeFile } from '../lib/fileIo'
import { isFolderPermissionLostError } from '../lib/fileIo/folderErrors'
import { parseBackupFile } from '../lib/parseBackupFile'
import { backupAutosyncEnabledAtom, setAutosyncEnabled } from '../model/backupFolder'
import { type BackupFile, type BackupImportMode } from '../model/backupPayload'
import { AUTO_BACKUP_FILE_NAME } from '../model/backupScalars'

/**
 * Включение автосинхронизации с учётом уже существующего автобэкапа.
 *
 * При включении, если в папке уже есть `slovo-backup-auto.json`, показывается
 * диалог: импортировать его (merge/replace) или перезаписать текущим состоянием.
 * Повреждённый файл предлагает только перезапись. Выключение — всегда сразу.
 * @param folderUri - Выбранная папка.
 * @param isFolderUsable - Доступна ли папка (иначе переключатель неактивен).
 * @param applyBackup - Общий импорт-пайплайн (`useBackupImport.applyBackup`).
 * @param markFolderUnusable - Переводит UI в состояние повторного выбора папки.
 * @param scheduleAutoBackup - Планировщик автосейва после включения.
 */
export const useAutosyncToggle = (
  folderUri: null | string,
  isFolderUsable: boolean,
  applyBackup: (file: BackupFile, mode: BackupImportMode, onApplied?: () => void) => Promise<void>,
  markFolderUnusable: () => void,
  scheduleAutoBackup: () => void,
) => {
  const [autosyncEnabled] = useAtom(backupAutosyncEnabledAtom)
  const [conflictFile, setConflictFile] = useState<{ file: BackupFile | null } | undefined>(
    undefined,
  )

  const saveAutosync = useAction(setAutosyncEnabled)
  const notify = useAction(showToast)

  const enableAutosync = async () => {
    await saveAutosync(true)
    scheduleAutoBackup()
  }

  const handleToggle = async (value: boolean) => {
    if (!value) {
      await saveAutosync(false)
      return
    }
    if (!folderUri || !isFolderUsable) return

    try {
      const names = await listFiles(folderUri)
      if (!names.includes(AUTO_BACKUP_FILE_NAME)) {
        await enableAutosync()
        return
      }

      const parsed = parseBackupFile(await readFile(folderUri, AUTO_BACKUP_FILE_NAME))
      setConflictFile({ file: parsed.status === 'ok' ? parsed.file : null })
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось прочитать авторезервную копию')
    }
  }

  const resolveWithImport = (mode: BackupImportMode) => {
    const file = conflictFile?.file
    setConflictFile(undefined)
    if (!file) return

    void applyBackup(file, mode, () => {
      void enableAutosync()
    })
  }

  const overwrite = async () => {
    setConflictFile(undefined)

    try {
      const json = await buildValidatedPayloadJson()
      if (json === null || !folderUri) return

      await writeFile(folderUri, AUTO_BACKUP_FILE_NAME, json)
      await enableAutosync()
      notify('Копия сохранена')
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось сохранить резервную копию')
    }
  }

  const hasImportableFile = conflictFile !== undefined && conflictFile.file !== null

  return {
    autosyncEnabled,
    canImportConflict: hasImportableFile,
    conflictVisible: conflictFile !== undefined,
    onDismissConflict: () => setConflictFile(undefined),
    onImportMerge: () => resolveWithImport('merge'),
    onImportReplace: () => resolveWithImport('replace'),
    onOverwrite: () => void overwrite(),
    toggleAutosync: (value: boolean) => void handleToggle(value),
  }
}
