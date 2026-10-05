import { type AxiosProgressEvent } from 'axios'
import { getErrorMessage } from '../lib/error-utils'
import { filesApi } from './generated'

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
 * Переводит событие прогресса axios в процент загрузки; без `total` отдаёт 0.
 * @param options - Необязательный колбэк прогресса загрузки.
 * @param event - Событие прогресса запроса axios.
 */
export const reportProgress = (options: UploadOptions, event: AxiosProgressEvent): void => {
  if (!options.onProgress) return

  const total = event.total ?? 0
  options.onProgress(total > 0 ? Math.round((event.loaded / total) * PROGRESS_MAX) : 0)
}

/**
 * Общий путь загрузки части файла на сервер (`POST /files`, multipart): generated
 * функция строит FormData сама, а ошибки нормализуются в сообщение.
 * @param file - Blob/File для multipart-части.
 * @param options - Необязательный колбэк прогресса загрузки.
 */
export const uploadFilePart = async (
  file: Blob | File,
  options: UploadOptions,
): Promise<UploadedFile> => {
  try {
    const response = await filesApi.getFiles().appControllerUploadFile(
      { file },
      {
        onUploadProgress: event => reportProgress(options, event),
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
