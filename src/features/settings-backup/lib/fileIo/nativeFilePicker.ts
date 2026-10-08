import { getDocumentAsync } from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { hasUriProtocol } from 'shared/lib/app-icon'
import { reportError } from 'shared/model/error-dialog'

const SHARE_MIME_TYPE = 'application/json'
const JSON_UTI = 'public.json'
const BACKUP_MIME_TYPES = ['application/json', 'text/json']

// На Android экспорт/импорт идут через SAF-папку, поэтому picker-путь — iOS-only.
const assertIos = (operation: string): void => {
  if (Platform.OS !== 'ios') throw new Error(`${operation} доступен только на iOS`)
}

/**
 * Экспорт копии через системный share sheet (iOS): пользователь выбирает
 * «Сохранить в Файлы». Отмена шита не считается ошибкой — `shareAsync` просто
 * резолвится.
 * @param name - Имя файла копии.
 * @param json - Содержимое файла.
 */
export const exportViaFilePicker = async (name: string, json: string): Promise<void> => {
  assertIos('Экспорт через выбор файла')

  try {
    if (!(await Sharing.isAvailableAsync())) throw new Error('Системный обмен файлами недоступен')

    const file = new File(Paths.cache, name)
    file.write(json)
    await Sharing.shareAsync(file.uri, { mimeType: SHARE_MIME_TYPE, UTI: JSON_UTI })
  } catch (error) {
    reportError(error, 'Не удалось экспортировать резервную копию')
    throw error
  }
}

/**
 * Импорт копии через документ-пикер (iOS).
 * @returns Содержимое файла или `null`, если выбор отменён пользователем.
 */
export const importViaFilePicker = async (): Promise<null | string> => {
  assertIos('Импорт через выбор файла')

  const result = await getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: BACKUP_MIME_TYPES,
  })
  if (result.canceled) return null

  const uri = result.assets[0]?.uri
  if (!hasUriProtocol(uri)) throw new Error('Некорректный путь выбранного файла')

  try {
    return await new File(uri).text()
  } catch (error) {
    reportError(error, 'Не удалось прочитать резервную копию')
    throw error
  }
}
