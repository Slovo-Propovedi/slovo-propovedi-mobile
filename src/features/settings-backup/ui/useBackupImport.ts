import { useAction } from '@reatom/npm-react'
import { useState } from 'react'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { applyImport } from '../lib/applyImport'
import { importViaFilePicker } from '../lib/fileIo'
import { parseBackupFile } from '../lib/parseBackupFile'
import { type BackupFile, type BackupImportMode } from '../model/backupPayload'
import { useFolderImport } from './useFolderImport'

interface PendingConfirmation {
  file: BackupFile
  mode: BackupImportMode
  onApplied?: () => void
}

/**
 * Импорт резервной копии: чтение файла, выбор режима и подтверждение смены URL.
 *
 * `applyBackup` — общий вход для обоих сценариев (ручной импорт и конфликт
 * автосинхронизации): принимает разобранный файл, спрашивает подтверждение при
 * смене URL и вызывает `onApplied` после успешного применения.
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
  const [pendingConfirmation, setPendingConfirmation] = useState<null | PendingConfirmation>(null)

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

  const folderImport = useFolderImport(folderUri, handleRawBackup, markFolderUnusable)

  const runApply = async ({ file, mode, onApplied }: PendingConfirmation) => {
    try {
      await apply(file.data, mode)
      notify('Данные восстановлены')
      scheduleAutoBackup()
      onApplied?.()
    } catch (error) {
      reportError(error, 'Не удалось применить резервную копию')
    } finally {
      setPendingFile(null)
      setPendingConfirmation(null)
    }
  }

  const applyBackup = async (file: BackupFile, mode: BackupImportMode, onApplied?: () => void) => {
    const nextServerUrl = file.data.settings?.serverUrl
    if (nextServerUrl && nextServerUrl !== serverUrl) {
      setPendingConfirmation({ file, mode, onApplied })
      return
    }

    await runApply({ file, mode, onApplied })
  }

  const applyPending = async (mode: BackupImportMode) => {
    if (!pendingFile) return
    await applyBackup(pendingFile, mode)
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
    ...folderImport,
    applyBackup,
    applyPending,
    cancelServerUrlChange: () => {
      setPendingFile(null)
      setPendingConfirmation(null)
    },
    confirmServerUrlChange: async () => {
      if (pendingConfirmation) await runApply(pendingConfirmation)
    },
    dismissPending: () => setPendingFile(null),
    importFromPicker,
    isDialogVisible: pendingFile !== null && pendingConfirmation === null,
    pendingServerUrl: pendingConfirmation?.file.data.settings?.serverUrl ?? null,
  }
}
