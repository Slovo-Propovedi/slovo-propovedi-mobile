import { useState } from 'react'
import { reportError } from 'shared/model/error-dialog'
import { type BackupFileOption, listBackupFileOptions } from '../lib/backupFiles'
import { listFiles, readFile } from '../lib/fileIo'
import { isFolderPermissionLostError } from '../lib/fileIo/folderErrors'

/**
 * Импорт из выбранной папки: собирает доступные файлы копий и, если их больше
 * одного, открывает диалог выбора; затем отдаёт содержимое в общий пайплайн
 * (`handleRawBackup`).
 * @param folderUri - Выбранная папка.
 * @param handleRawBackup - Разбор и постановка файла в общий пайплайн импорта.
 * @param markFolderUnusable - Переводит UI в состояние повторного выбора папки.
 */
export const useFolderImport = (
  folderUri: null | string,
  handleRawBackup: (raw: string) => void,
  markFolderUnusable: () => void,
) => {
  const [backupFileOptions, setBackupFileOptions] = useState<BackupFileOption[] | null>(null)

  const readAndHandle = async (fileName: string) => {
    try {
      handleRawBackup(await readFile(folderUri, fileName))
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось прочитать резервную копию')
    }
  }

  const importBackup = async () => {
    try {
      const options = listBackupFileOptions(await listFiles(folderUri))

      if (options.length === 0) {
        reportError(
          new Error('Файл резервной копии не найден'),
          'В папке нет файлов резервной копии',
        )
        return
      }
      if (options.length === 1) {
        await readAndHandle(options[0].fileName)
        return
      }

      setBackupFileOptions(options)
    } catch (error) {
      if (isFolderPermissionLostError(error)) markFolderUnusable()
      reportError(error, 'Не удалось прочитать резервную копию')
    }
  }

  return {
    backupFileOptions,
    dismissFileChooser: () => setBackupFileOptions(null),
    importBackup,
    selectBackupFile: async (fileName: string) => {
      setBackupFileOptions(null)
      await readAndHandle(fileName)
    },
  }
}
