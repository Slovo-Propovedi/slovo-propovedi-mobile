import { Platform } from 'react-native'
import { buildAudioFileName } from './audioFileName'
import { downloadAudio } from './downloadAudio'
import { type DownloadedAudio } from './downloadAudio/types'
import {
  type ImportedSermonData,
  type ImportedSermonMetadata,
  type ImportErrorCode,
  type ImportPhaseProgress,
  type ImportSettings,
  type ResolvedAudio,
} from './importTypes'
import { resolveInvidiousAudio } from './invidiousSource'
import { parseVideoId } from './parseVideoId'
import { ImportSourceError } from './sourceErrors'
import { uploadWithRetry } from './uploadWithRetry'
import { resolveYoutubeAudio } from './youtubeSource'

const AUDIO_MIME_TYPE = 'audio/mp4'

// Скачивание, загрузка и источники, отдавшие не-JSON, — для админа это один
// и тот же «сервис недоступен».
const SERVICE_UNAVAILABLE: ImportErrorCode = 'service-unavailable'
const UPLOAD_FAILED: ImportErrorCode = 'upload-failed'

// На web InnerTube-источник недоступен (шимы и `eval` в браузере не поддержаны):
// даже сохранённый выбор «YouTube» уходит в Invidious, а не падает.
const resolveAudio = (settings: ImportSettings, videoId: string): Promise<ResolvedAudio> =>
  settings.source === 'invidious' || Platform.OS === 'web'
    ? resolveInvidiousAudio(settings.invidiousBaseUrl, videoId)
    : resolveYoutubeAudio(videoId)

const downloadResolvedAudio = async (
  resolved: ResolvedAudio,
  fileName: string,
  onPhase: (progress: ImportPhaseProgress) => void,
  signal: AbortSignal | undefined,
): Promise<DownloadedAudio> => {
  try {
    return await downloadAudio(
      { audioUrl: resolved.audioUrl, fileName, mimeType: AUDIO_MIME_TYPE },
      percent => onPhase({ percent, phase: 'download' }),
      signal,
    )
  } catch (error) {
    // Таймаут и обрыв сети — админу показываем «сервис недоступен», а не текст
    // сетевого стека; коды самого источника (видео удалено и т. п.) сохраняем.
    if (error instanceof ImportSourceError) throw error

    throw new ImportSourceError(SERVICE_UNAVAILABLE, error)
  }
}

const uploadDownloadedAudio = async (
  downloaded: DownloadedAudio,
  onPhase: (progress: ImportPhaseProgress) => void,
): Promise<string> => {
  try {
    // Сетевые обрывы повторяются внутри: размер и длительность попыток попадают
    // в финальное сообщение об ошибке для диалога.
    return await uploadWithRetry(
      () => downloaded.upload(percent => onPhase({ percent, phase: 'upload' })),
      downloaded.size,
    )
  } catch (error) {
    // Сеть/авторизация/формат на стороне сервера — для пользователя это одна
    // понятная ошибка вместо технического текста axios.
    if (error instanceof ImportSourceError) throw error

    // Причина уходит и в лог, и в toast: без неё «upload-failed» неотличим от
    // любой другой причины (например, multipart без boundary на web).
    console.error('[audio-import] upload failed', error, { sizeBytes: downloaded.size })

    throw new ImportSourceError(UPLOAD_FAILED, error)
  }
}

/**
 * Цикл импорта: разбор ссылки → метаданные и ссылка на аудио из выбранного
 * источника → (опционально) скачивание в кэш устройства (native) или в память
 * (web) → загрузка на сервер. Ресурс скачивания освобождается в любом случае;
 * конвертации нет — на сервер уходит исходный m4a.
 * @param props - Аргументы импорта.
 * @param props.onMetadata - Метаданные сразу после разбора ссылки, до скачивания.
 * @param props.onPhase - Колбэк прогресса по фазам скачивания и загрузки.
 * @param props.settings - Источник и адрес инстанса Invidious.
 * @param props.signal - Отмена импорта (например, размонтирование формы).
 * @param props.url - Ссылка или ID видео YouTube.
 * @param props.withAudio - Скачивать и загружать аудио; `false` — только метаданные.
 */
export const importAudio = async ({
  onMetadata,
  onPhase,
  settings,
  signal,
  url,
  withAudio,
}: {
  onMetadata?: (metadata: ImportedSermonMetadata) => void
  onPhase: (progress: ImportPhaseProgress) => void
  settings: ImportSettings
  signal?: AbortSignal
  url: string
  withAudio: boolean
}): Promise<ImportedSermonData> => {
  const videoId = parseVideoId(url)
  if (videoId === null) throw new ImportSourceError('parse')

  const resolved = await resolveAudio(settings, videoId)
  onMetadata?.({ description: resolved.description, title: resolved.title })

  if (!withAudio)
    return { audioUrl: null, description: resolved.description, title: resolved.title }

  const fileName = buildAudioFileName(resolved.title)
  let downloaded: DownloadedAudio | null = null

  try {
    downloaded = await downloadResolvedAudio(resolved, fileName, onPhase, signal)
    const audioUrl = await uploadDownloadedAudio(downloaded, onPhase)

    return { audioUrl, description: resolved.description, title: resolved.title }
  } finally {
    downloaded?.dispose()
  }
}
