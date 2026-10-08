import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { serverUrlAtom, showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { buildManualBackupFileName } from '../lib/backupFiles'
import { buildValidatedPayloadJson } from '../lib/buildValidatedPayload'
import {
  exportViaFilePicker,
  folderExists,
  pickBackupFolder,
  supportsFolderSync,
  writeFile,
} from '../lib/fileIo'
import { isFolderPermissionLostError } from '../lib/fileIo/folderErrors'
import {
  backupFolderUriAtom,
  clearBackupFolder,
  loadBackupFolder,
  setBackupFolder,
} from '../model/backupFolder'
import { useAutoBackupSync } from './useAutoBackupSync'
import { useAutosyncToggle } from './useAutosyncToggle'
import { useBackupImport } from './useBackupImport'
import { useFolderAvailability } from './useFolderAvailability'

/** Состояние и обработчики секции «Резервная копия» (экспорт/импорт/автосинхрон). */
export const useBackupSection = () => {
  const [folderUri] = useAtom(backupFolderUriAtom)
  const [serverUrl] = useAtom(serverUrlAtom)

  const loadFolder = useAction(loadBackupFolder)
  const saveFolder = useAction(setBackupFolder)
  const clearFolder = useAction(clearBackupFolder)
  const notify = useAction(showToast)
  const scheduleAutoBackup = useAutoBackupSync()

  const { isFolderUsable, markFolderUnusable } = useFolderAvailability(folderUri)
  const importState = useBackupImport(folderUri, serverUrl, scheduleAutoBackup, markFolderUnusable)
  const autosyncState = useAutosyncToggle(
    folderUri,
    isFolderUsable,
    importState.applyBackup,
    markFolderUnusable,
    scheduleAutoBackup,
  )

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

  const exportBackup = async () => {
    try {
      const json = await buildValidatedPayloadJson()
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
      const json = await buildValidatedPayloadJson()
      if (json === null) return

      await exportViaFilePicker(buildManualBackupFileName(new Date()), json)
      notify('Копия сохранена')
    } catch (error) {
      reportError(error, 'Не удалось экспортировать резервную копию')
    }
  }

  return {
    ...importState,
    ...autosyncState,
    canFolderSync: supportsFolderSync(),
    chooseFolder,
    exportBackup,
    exportFromPicker,
    folderUri,
    isFolderUsable,
  }
}
