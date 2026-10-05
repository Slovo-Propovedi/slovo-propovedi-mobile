import { type File } from 'expo-file-system'
import { uploadSermonFile } from 'shared/api'
import { downloadFileWithTimeout } from 'shared/lib/fs/downloadFileWithTimeout'
import { ImportSourceError } from '../sourceErrors'
import { createTempAudioFile, removeTemporaryFile } from '../tempAudioFile'
import { type DownloadAudio, type DownloadedAudio } from './types'

// Проповедь идёт час-полтора: таймаут нужен, чтобы зависший сервер не держал импорт вечно.
const DOWNLOAD_TIMEOUT_MS = 15 * 60 * 1000

const createDownloadedAudio = (destination: File, mimeType: string): DownloadedAudio => ({
  dispose: () => removeTemporaryFile(destination),
  upload: async onProgress => {
    // Скачивание могло завершиться без файла на диске — это не сбой загрузки,
    // а неготовый ресурс; иначе UI соврёт про «не удалось загрузить на сервер».
    if (!destination.exists) throw new ImportSourceError('service-unavailable')

    const uploaded = await uploadSermonFile(
      { mimeType, name: destination.name, uri: destination.uri },
      { onProgress },
    )

    return uploaded.fileUrl
  },
})

/**
 * Нативный путь: скачивает аудио во временный файл кэша и отдаёт объект, который
 * умеет загрузить этот файл на сервер и удалить его после. Ошибки скачивания
 * остаются сырыми — общий код импорта отображает их в «сервис недоступен».
 * @param input - Ссылка на аудио, имя файла и mime-тип.
 * @param onProgress - Процент скачивания 0–100.
 * @param signal - Отмена скачивания (например, размонтирование формы).
 */
export const downloadAudio: DownloadAudio = async (input, onProgress, signal) => {
  const destination = createTempAudioFile(input.fileName)

  // expo-file-system не перезаписывает существующий файл.
  removeTemporaryFile(destination)

  try {
    const downloaded = await downloadFileWithTimeout(
      input.audioUrl,
      destination,
      onProgress,
      DOWNLOAD_TIMEOUT_MS,
      signal,
    )
    // null возвращается только при паузе задачи — мы её не используем.
    if (!downloaded) throw new Error('Download was paused')

    return createDownloadedAudio(destination, input.mimeType)
  } catch (error) {
    removeTemporaryFile(destination)
    throw error
  }
}
