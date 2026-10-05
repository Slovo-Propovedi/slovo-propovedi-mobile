import { Platform } from 'react-native'
import { getErrorMessage } from '../lib/error-utils'
import { axiosInstance } from './axiosInstance'
import { type APITypes } from './generated'
import {
  reportProgress,
  type UploadedFile,
  uploadFilePart,
  type UploadOptions,
} from './uploadFilePart'

export interface PickedUploadAsset {
  mimeType?: string
  name: string
  size?: number
  uri: string
}

const FALLBACK_AUDIO_MIME_TYPE = 'audio/mp4'
const FALLBACK_MIME_TYPE = 'application/octet-stream'
const UPLOAD_URL = '/files'

/**
 * Веб-путь: документ-пикер отдаёт `blob:`-URI — читаем его через fetch и
 * оборачиваем в браузерный `File`, чтобы сервер получил корректное имя и тип
 * multipart-части (как в `uploadAudioBlob`).
 * @param asset - Выбранный документ (uri, имя, mime-тип).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
const uploadWebPickedFile = async (
  asset: PickedUploadAsset,
  options: UploadOptions,
): Promise<UploadedFile> => {
  const response = await fetch(asset.uri)
  const blob = await response.blob()
  const file = new File([blob], asset.name, { type: asset.mimeType ?? FALLBACK_MIME_TYPE })

  return uploadFilePart(file, options)
}

/**
 * Нативный путь: собираем классическую RN multipart-часть `{ uri, name, type }` и
 * шлём её напрямую через `axiosInstance` — сетевой слой RN сам выставляет
 * boundary, а интерцептор `dropBoundarylessMultipartHeader` чистит Content-Type.
 * @param asset - Выбранный документ (uri, имя, mime-тип).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
const uploadNativePickedFile = async (
  asset: PickedUploadAsset,
  options: UploadOptions,
): Promise<UploadedFile> => {
  const formData = new FormData()
  // RN FormData принимает файловую часть-дескриптор `{ uri, name, type }`, но
  // DOM-типизация `append` знает только `string | Blob` — приводим на границе
  // нативного модуля (см. docs/contracts/native-modules.md).
  formData.append('file', {
    name: asset.name,
    type: asset.mimeType ?? FALLBACK_MIME_TYPE,
    uri: asset.uri,
  } as unknown as Blob)

  try {
    const response = await axiosInstance.post<APITypes.IFileResponseDto>(UPLOAD_URL, formData, {
      onUploadProgress: event => reportProgress(options, event),
      timeout: 0,
    })

    return { fileName: response.data.fileName, fileUrl: response.data.fileUrl }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}

/**
 * Загружает выбранный документ на сервер (`POST /files`, multipart) с
 * прогрессом. На web пикер отдаёт `blob:`-URI (см. `uploadWebPickedFile`), на
 * native — файловый `uri` (см. `uploadNativePickedFile`).
 * @param asset - Выбранный документ (uri, имя, mime-тип, размер).
 * @param options - Необязательный колбэк прогресса загрузки.
 */
export const uploadSermonFile = (
  asset: PickedUploadAsset,
  options: UploadOptions = {},
): Promise<UploadedFile> =>
  Platform.OS === 'web'
    ? uploadWebPickedFile(asset, options)
    : uploadNativePickedFile(asset, options)

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
