import { File } from 'expo-file-system'
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

/**
 * Загружает выбранный документ на сервер (`POST /files`, multipart) с
 * прогрессом. Файл оборачивается в `expo-file-system`'s `File` — он реализует
 * `Blob`, поэтому generated-функция принимает его типобезопасно, а RN FormData
 * читает из него `uri`/`type` на рантайме. Ошибки нормализуются в сообщение.
 * @param asset - Выбранный документ (uri, имя, mime-тип, размер).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
export const uploadSermonFile = async (
  asset: PickedUploadAsset,
  options: UploadOptions = {},
): Promise<UploadedFile> => {
  try {
    const file = new File(asset.uri)
    const response = await filesApi.getFiles().appControllerUploadFile(
      { file },
      {
        onUploadProgress: event => {
          if (!options.onProgress) return
          const total = event.total ?? 0
          const percent = total > 0 ? Math.round((event.loaded / total) * PROGRESS_MAX) : 0
          options.onProgress(percent)
        },
      },
    )

    return { fileName: response.fileName, fileUrl: response.fileUrl }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}
