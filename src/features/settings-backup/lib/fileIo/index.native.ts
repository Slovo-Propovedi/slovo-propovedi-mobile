import { Directory, File } from 'expo-file-system'
import { Platform } from 'react-native'
import { hasUriProtocol } from 'shared/lib/app-icon'
import { reportError } from 'shared/model/error-dialog'
import { decodeFolderLabel } from './folderLabel'

export { exportViaFilePicker, importViaFilePicker } from './nativeFilePicker'

/**
 * Синхронизация через выбранную папку. Android — persistable SAF-грант; iOS
 * поддерживает только сессионный доступ, поэтому там папка не используется
 * (экспорт/импорт идут через share sheet и документ-пикер).
 */
export const supportsFolderSync = (): boolean => Platform.OS === 'android'

// Хранимый URI — недоверенный legacy-ввод: перед передачей в native-модуль
// проверяем схему (content:// тоже проходит), иначе `java.net.URL` бросит.
const requireFolderUri = (folderUri: null | string): string => {
  if (!hasUriProtocol(folderUri)) throw new Error('Некорректный путь папки резервных копий')
  return folderUri
}

export const pickBackupFolder = async (previousUri?: null | string): Promise<null | string> => {
  try {
    const directory = await Directory.pickDirectoryAsync(previousUri ?? undefined)
    return hasUriProtocol(directory.uri) ? directory.uri : null
  } catch (error) {
    // Отмена выбора на части платформ приходит как reject — это не ошибка.
    console.warn('[settings-backup] folder pick cancelled or failed:', error)
    return null
  }
}

export const writeFile = async (
  folderUri: null | string,
  name: string,
  json: string,
): Promise<void> => {
  try {
    new File(requireFolderUri(folderUri), name).write(json)
  } catch (error) {
    reportError(error, 'Не удалось сохранить резервную копию')
    throw error
  }
}

export const readFile = async (folderUri: null | string, name: string): Promise<string> => {
  try {
    return await new File(requireFolderUri(folderUri), name).text()
  } catch (error) {
    reportError(error, 'Не удалось прочитать резервную копию')
    throw error
  }
}

export const listFiles = async (folderUri: null | string): Promise<string[]> => {
  try {
    return new Directory(requireFolderUri(folderUri))
      .list()
      .filter(entry => entry instanceof File)
      .map(entry => entry.name)
  } catch (error) {
    reportError(error, 'Не удалось прочитать содержимое папки резервных копий')
    throw error
  }
}

export const folderExists = async (folderUri: null | string): Promise<boolean> => {
  if (!folderUri) return false

  try {
    return new Directory(folderUri).exists
  } catch (error) {
    console.warn('[settings-backup] folder access check failed:', error)
    return false
  }
}

export const folderLabel = (folderUri: null | string): string =>
  folderUri ? decodeFolderLabel(folderUri) : 'Папка не выбрана'
