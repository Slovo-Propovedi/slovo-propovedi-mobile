import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { serverUrlAtom, showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { buildManualBackupFileName } from '../lib/backupFiles'
import { buildPayload } from '../lib/buildPayload'
import {
  exportViaFilePicker,
  folderExists,
  pickBackupFolder,
  supportsFolderSync,
  writeFile,
} from '../lib/fileIo'
import { isFolderPermissionLostError } from '../lib/fileIo/folderErrors'
import {
  backupAutosyncEnabledAtom,
  backupFolderUriAtom,
  clearBackupFolder,
  loadBackupFolder,
  setAutosyncEnabled,
  setBackupFolder,
} from '../model/backupFolder'
import { backupFileSchema } from '../model/backupPayload'
import { useAutoBackupSync } from './useAutoBackupSync'
import { useBackupImport } from './useBackupImport'
import { useFolderAvailability } from './useFolderAvailability'

/** Состояние и обработчики секции «Резервная копия» (экспорт/импорт/автосинхрон). */
export const useBackupSection = () => {
  const [folderUri] = useAtom(backupFolderUriAtom)
  const [autosyncEnabled] = useAtom(backupAutosyncEnabledAtom)
  const [serverUrl] = useAtom(serverUrlAtom)

  const loadFolder = useAction(loadBackupFolder)
  const saveFolder = useAction(setBackupFolder)
  const clearFolder = useAction(clearBackupFolder)
  const saveAutosync = useAction(setAutosyncEnabled)
  const notify = useAction(showToast)
  const scheduleAutoBackup = useAutoBackupSync()

  const { isFolderUsable, markFolderUnusable } = useFolderAvailability(folderUri)
  const importState = useBackupImport(folderUri, serverUrl, scheduleAutoBackup, markFolderUnusable)

  useEffect(() => {
    void loadFolder()
  }, [loadFolder])

  const chooseFolder = async () => {
    try {
      const picked = await pickBackupFolder(folderUri)
      if (picked) {
        await saveFolder(picked)
        scheduleAutoBackup()
        return
      }

      // Отмена/недоступная папка: сбрасываем невалидный путь, чтобы UI предложил
      // выбрать папку заново (useFolderAvailability уже отразит недоступность).
      if (folderUri && !(await folderExists(folderUri))) await clearFolder()
    } catch (error) {
      reportError(error, 'Не удалось выбрать папку')
    }
  }

  // Общая сборка и валидация payload; `null` — уже сообщено пользователю.
  const buildValidatedJson = async (): Promise<null | string> => {
    const validated = backupFileSchema.safeParse(await buildPayload())
    if (!validated.success) {
      reportError(validated.error, 'Не удалось собрать резервную копию')
      return null
    }

    return JSON.stringify(validated.data)
  }

  const exportBackup = async () => {
    try {
      const json = await buildValidatedJson()
      if (json === null) return

      await writeFile(folderUri, buildManualBackupFileName(new Date()), json)
      notify('Копия сохранена')
      scheduleAutoBackup()
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось экспортировать резервную копию')
    }
  }

  const exportFromPicker = async () => {
    try {
      const json = await buildValidatedJson()
      if (json === null) return

      await exportViaFilePicker(buildManualBackupFileName(new Date()), json)
      notify('Копия сохранена')
    } catch (error) {
      reportError(error, 'Не удалось экспортировать резервную копию')
    }
  }

  return {
    ...importState,
    autosyncEnabled,
    canFolderSync: supportsFolderSync(),
    chooseFolder,
    exportBackup,
    exportFromPicker,
    folderUri,
    isFolderUsable,
    toggleAutosync: (value: boolean) => void saveAutosync(value),
  }
}
