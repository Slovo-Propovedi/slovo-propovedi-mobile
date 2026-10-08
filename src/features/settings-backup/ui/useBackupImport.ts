import { useAction } from '@reatom/npm-react'
import { useState } from 'react'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { applyImport } from '../lib/applyImport'
import { pickNewestManualBackupName } from '../lib/backupFiles'
import { importViaFilePicker, listFiles, readFile } from '../lib/fileIo'
import { isFolderPermissionLostError } from '../lib/fileIo/folderErrors'
import { parseBackupFile } from '../lib/parseBackupFile'
import { type BackupFile, type BackupImportMode } from '../model/backupPayload'
import { AUTO_BACKUP_FILE_NAME } from '../model/backupScalars'

/**
 * Импорт резервной копии: чтение файла, выбор режима и подтверждение смены URL.
 * @param folderUri - Выбранная папка (или `null` — без папки, через пикер).
 * @param serverUrl - Текущий URL сервера (для подтверждения смены).
 * @param scheduleAutoBackup - Планировщик фонового автосейва после импорта.
 * @param markFolderUnusable - Переводит UI в состояние повторного выбора папки при потере доступа.
 */
export const useBackupImport = (
  folderUri: null | string,
  serverUrl: string,
  scheduleAutoBackup: () => void,
  markFolderUnusable: () => void,
) => {
  const [pendingFile, setPendingFile] = useState<BackupFile | null>(null)
  const [pendingMode, setPendingMode] = useState<BackupImportMode | null>(null)
  const [pendingServerUrl, setPendingServerUrl] = useState<null | string>(null)

  const apply = useAction(applyImport)
  const notify = useAction(showToast)

  // Единый разбор недоверенного файла для обоих способов (папка и пикер).
  const handleRawBackup = (raw: string) => {
    const parsed = parseBackupFile(raw)

    if (parsed.status === 'newer-version') {
      reportError(
        new Error(`Версия файла: ${parsed.version}`),
        'Файл создан более новой версией приложения — обновите приложение',
      )
      return
    }
    if (parsed.status === 'invalid') {
      reportError(
        new Error('Повреждённый или чужой файл'),
        'Файл резервной копии не удалось прочитать',
      )
      return
    }

    setPendingFile(parsed.file)
  }

  const runImport = async (mode: BackupImportMode) => {
    if (!pendingFile) return

    try {
      await apply(pendingFile.data, mode)
      notify('Данные восстановлены')
      scheduleAutoBackup()
    } catch (error) {
      reportError(error, 'Не удалось применить резервную копию')
    } finally {
      setPendingFile(null)
      setPendingMode(null)
      setPendingServerUrl(null)
    }
  }

  const applyPending = async (mode: BackupImportMode) => {
    if (!pendingFile) return

    const nextServerUrl = pendingFile.data.settings?.serverUrl
    if (nextServerUrl && nextServerUrl !== serverUrl) {
      setPendingMode(mode)
      setPendingServerUrl(nextServerUrl)
      return
    }

    await runImport(mode)
  }

  const importBackup = async () => {
    try {
      const names = await listFiles(folderUri)
      const target = pickNewestManualBackupName(names) ?? AUTO_BACKUP_FILE_NAME
      handleRawBackup(await readFile(folderUri, target))
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось прочитать резервную копию')
    }
  }

  const importFromPicker = async () => {
    try {
      const raw = await importViaFilePicker()
      if (raw === null) return
      handleRawBackup(raw)
    } catch (error) {
      reportError(error, 'Не удалось прочитать резервную копию')
    }
  }

  return {
    applyPending,
    cancelServerUrlChange: () => {
      setPendingFile(null)
      setPendingMode(null)
      setPendingServerUrl(null)
    },
    confirmServerUrlChange: async () => {
      if (pendingMode) await runImport(pendingMode)
    },
    dismissPending: () => setPendingFile(null),
    importBackup,
    importFromPicker,
    isDialogVisible: pendingFile !== null && pendingServerUrl === null,
    pendingServerUrl,
  }
}
