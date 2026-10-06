import { File, Paths } from 'expo-file-system'

/**
 * Временный файл аудио в кэше устройства: после загрузки на сервер он удаляется,
 * на диске остаётся лишь копия, нужная плееру.
 * @param fileName - Имя файла, построенное из заголовка видео (`buildAudioFileName`).
 */
export const createTempAudioFile = (fileName: string): File => new File(Paths.cache, fileName)

/**
 * Удаляет временный файл, не бросая ошибку: неудачное удаление не должно
 * превращать уже успешный импорт в провал.
 * @param file - Файл кэша, который мог остаться после скачивания.
 */
export const removeTemporaryFile = (file: File): void => {
  try {
    if (file.exists) file.delete()
  } catch {
    // Временный файл не удалился — это не повод проваливать импорт.
  }
}
