import { reportError } from 'shared/model/error-dialog'
import {
  isFolderPickerSupported,
  listWebFiles,
  pickWebFolder,
  readWebFile,
  webFolderExists,
  webFolderLabel,
  writeWebFile,
} from './webDirectory'
import { downloadBackupFile, pickBackupFileText } from './webFallback'

/** На web папка переживает сессию только при поддержке File System Access API. */
export const supportsFolderSync = (): boolean => isFolderPickerSupported()

/**
 * Экспорт без папки (браузеры без File System Access API): скачивание файла.
 * @param name - Имя файла копии.
 * @param json - Содержимое файла.
 */
export const exportViaFilePicker = async (name: string, json: string): Promise<void> => {
  downloadBackupFile(name, json)
}

/** Импорт без папки: системный `<input type="file">`; `null` — пользователь отменил. */
export const importViaFilePicker = async (): Promise<null | string> => pickBackupFileText()

/**
 * Выбор папки поддержан не во всех браузерах; при отсутствии API возвращаем
 * `null` — вызывающий код переходит на фолбэк скачивания/выбора файла.
 * @param _previousUri - Предыдущая папка (на web не используется).
 */
export const pickBackupFolder = async (_previousUri?: null | string): Promise<null | string> => {
  if (!isFolderPickerSupported()) return null
  return pickWebFolder()
}

export const writeFile = async (
  folderUri: null | string,
  name: string,
  json: string,
): Promise<void> => {
  try {
    if (folderUri) {
      await writeWebFile(folderUri, name, json)
      return
    }

    downloadBackupFile(name, json)
  } catch (error) {
    reportError(error, 'Не удалось сохранить резервную копию')
    throw error
  }
}

export const readFile = async (folderUri: null | string, name: string): Promise<string> => {
  if (folderUri)
    try {
      return await readWebFile(folderUri, name)
    } catch (error) {
      reportError(error, 'Не удалось прочитать резервную копию')
      throw error
    }

  const text = await pickBackupFileText()
  if (text === null) throw new Error('Файл резервной копии не выбран')

  return text
}

export const listFiles = async (folderUri: null | string): Promise<string[]> => {
  if (!folderUri) return []

  try {
    return await listWebFiles(folderUri)
  } catch (error) {
    reportError(error, 'Не удалось прочитать содержимое папки резервных копий')
    throw error
  }
}

export const folderExists = async (folderUri: null | string): Promise<boolean> => {
  if (!folderUri) return false
  return webFolderExists()
}

export const folderLabel = (folderUri: null | string): string => webFolderLabel(folderUri)
