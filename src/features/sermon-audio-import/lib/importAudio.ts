import { type File } from 'expo-file-system'
import { uploadSermonFile } from 'shared/api'
import { downloadFileWithTimeout } from 'shared/lib/fs/downloadFileWithTimeout'
import {
  type ImportedSermonData,
  type ImportErrorCode,
  type ImportPhaseProgress,
  type ImportSettings,
  type ResolvedAudio,
} from './importTypes'
import { resolveInvidiousAudio } from './invidiousSource'
import { parseVideoId } from './parseVideoId'
import { ImportSourceError } from './sourceErrors'
import { createTempAudioFile, removeTemporaryFile } from './tempAudioFile'
import { resolveYoutubeAudio } from './youtubeSource'

const AUDIO_MIME_TYPE = 'audio/mp4'

// Проповедь идёт час-полтора: таймаут нужен, чтобы зависший сервер не держал импорт вечно.
const DOWNLOAD_TIMEOUT_MS = 15 * 60 * 1000

// Скачивание, загрузка и источники, отдавшие не-JSON, — для админа это один
// и тот же «сервис недоступен».
const SERVICE_UNAVAILABLE: ImportErrorCode = 'service-unavailable'

const resolveAudio = (settings: ImportSettings, videoId: string): Promise<ResolvedAudio> =>
  settings.source === 'invidious'
    ? resolveInvidiousAudio(settings.invidiousBaseUrl, videoId)
    : resolveYoutubeAudio(videoId)

const downloadAudio = async (
  resolved: ResolvedAudio,
  destination: File,
  onPhase: (progress: ImportPhaseProgress) => void,
  signal: AbortSignal | undefined,
): Promise<void> => {
  // expo-file-system не перезаписывает существующий файл.
  removeTemporaryFile(destination)

  try {
    const downloaded = await downloadFileWithTimeout(
      resolved.audioUrl,
      destination,
      percent => onPhase({ percent, phase: 'download' }),
      DOWNLOAD_TIMEOUT_MS,
      signal,
    )
    // null возвращается только при паузе задачи — мы её не используем.
    if (!downloaded) throw new ImportSourceError(SERVICE_UNAVAILABLE)
  } catch (error) {
    // Таймаут и обрыв сети приходят из expo-file-system своими ошибками: админу
    // показываем «сервис недоступен», а не текст сетевого стека.
    if (error instanceof ImportSourceError) throw error

    throw new ImportSourceError(SERVICE_UNAVAILABLE)
  }
}

const uploadAudio = async (
  destination: File,
  onPhase: (progress: ImportPhaseProgress) => void,
): Promise<string> => {
  try {
    const uploaded = await uploadSermonFile(
      { mimeType: AUDIO_MIME_TYPE, name: destination.name, uri: destination.uri },
      { onProgress: percent => onPhase({ percent, phase: 'upload' }) },
    )

    return uploaded.fileUrl
  } catch (error) {
    // Сеть/авторизация/формат на стороне сервера — для пользователя это одна
    // понятная ошибка вместо технического текста axios.
    if (error instanceof ImportSourceError) throw error

    throw new ImportSourceError('upload-failed')
  }
}

/**
 * Полный цикл импорта: разбор ссылки → метаданные и ссылка на аудио из
 * выбранного источника → скачивание в кэш устройства → загрузка на сервер.
 * Временный файл кэша удаляется в любом случае; конвертации нет — на сервер
 * уходит исходный m4a.
 * @param props - Аргументы импорта.
 * @param props.onPhase - Колбэк прогресса по фазам скачивания и загрузки.
 * @param props.settings - Источник и адрес инстанса Invidious.
 * @param props.signal - Отмена импорта (например, размонтирование формы).
 * @param props.url - Ссылка или ID видео YouTube.
 */
export const importAudio = async ({
  onPhase,
  settings,
  signal,
  url,
}: {
  onPhase: (progress: ImportPhaseProgress) => void
  settings: ImportSettings
  signal?: AbortSignal
  url: string
}): Promise<ImportedSermonData> => {
  const videoId = parseVideoId(url)
  if (videoId === null) throw new ImportSourceError('parse')

  const resolved = await resolveAudio(settings, videoId)
  const destination = createTempAudioFile(resolved.title)

  try {
    await downloadAudio(resolved, destination, onPhase, signal)
    const audioUrl = await uploadAudio(destination, onPhase)

    return { audioUrl, description: resolved.description, title: resolved.title }
  } finally {
    removeTemporaryFile(destination)
  }
}
