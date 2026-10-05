import { File as ExpoFile } from 'expo-file-system'
import { getErrorMessage } from '../lib/error-utils'
import { filesApi } from './generated'

export interface PickedUploadAsset {
  mimeType?: string
  name: string
  size?: number
  uri: string
}

export interface UploadedFile {
  fileName: string
  fileUrl: string
}

export interface UploadOptions {
  /** Вызывается с процентом загрузки 0–100. */
  onProgress?: (percent: number) => void
}

const PROGRESS_MAX = 100
const FALLBACK_AUDIO_MIME_TYPE = 'audio/mp4'

/**
 * Общий путь загрузки части файла на сервер (`POST /files`, multipart): generated
 * функция строит FormData сама, а ошибки нормализуются в сообщение.
 * @param file - Blob/File для multipart-части.
 * @param options - Необязательный колбэк прогресса загрузки.
 */
const uploadFilePart = async (file: Blob | File, options: UploadOptions): Promise<UploadedFile> => {
  try {
    const response = await filesApi.getFiles().appControllerUploadFile(
      { file },
      {
        onUploadProgress: event => {
          if (!options.onProgress) return
          const total = event.total ?? 0
          const percent = total > 0 ? Math.round((event.loaded / total) * PROGRESS_MAX) : 0
          options.onProgress(percent)
        },
        // Большие аудиофайлы загружаются минутами: снимаем любой унаследованный
        // таймаут запроса, чтобы axios не оборвал передачу на середине.
        timeout: 0,
      },
    )

    return { fileName: response.fileName, fileUrl: response.fileUrl }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

/**
 * Загружает выбранный документ на сервер (`POST /files`, multipart) с
 * прогрессом. Файл оборачивается в `expo-file-system`'s `File` — он реализует
 * `Blob`, поэтому generated-функция принимает его типобезопасно, а RN FormData
 * читает из него `uri`/`type` на рантайме.
 * @param asset - Выбранный документ (uri, имя, mime-тип, размер).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
export const uploadSermonFile = async (
  asset: PickedUploadAsset,
  options: UploadOptions = {},
): Promise<UploadedFile> => uploadFilePart(new ExpoFile(asset.uri), options)

/**
 * Веб-путь загрузки: оборачивает скачанный аудио-Blob в браузерный `File` с
 * именем и mime-типом, чтобы сервер получил корректное имя multipart-части.
 * @param blob - Собранный в памяти аудио-Blob.
 * @param fileName - Имя файла на сервере (`.m4a`).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
export const uploadAudioBlob = async (
  blob: Blob,
  fileName: string,
  options: UploadOptions = {},
): Promise<UploadedFile> =>
  uploadFilePart(
    new File([blob], fileName, { type: blob.type || FALLBACK_AUDIO_MIME_TYPE }),
    options,
  )
