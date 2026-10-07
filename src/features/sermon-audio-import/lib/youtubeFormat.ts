import { type ImportErrorCode } from './importTypes'
import { ImportSourceError } from './sourceErrors'

// Правила выбора формата InnerTube вынесены в чистый модуль без импорта
// youtubei.js: их проверяют тесты без сессии InnerTube, дешифровки и сети.

/** Формат аудиодорожки в терминах InnerTube (snake_case приходит из библиотеки). */
export interface YoutubeAudioFormat {
  audio_track?: {
    audio_is_default?: boolean
    display_name?: string
    id?: string
  }
  bitrate: number
  itag: number
  mime_type: string
}

/** Статус проигрываемости, который YouTube отдаёт для недоступного видео. */
export type YoutubePlayabilityStatus = 'ERROR' | 'LOGIN_REQUIRED' | 'OK' | 'UNPLAYABLE'

// itag 140 — аудио в AAC/mp4: играется нативно и в вебе, в отличие от opus/webm.
const PREFERRED_ITAG = 140
const PREFERRED_MIME_TYPE = 'mp4'

// youtubei.js бросает InnertubeError с текстом «Request to … failed with status
// code 403» — статус достаём из сообщения, чтобы отличить блокировку клиента от
// сетевого сбоя.
const HTTP_STATUS_PATTERN = /status code (\d{3})/

/**
 * HTTP-статус из ошибки youtubei.js, если он там есть.
 * @param error - Ошибка клиента InnerTube.
 * @returns Код ответа либо `undefined` для сетевых/прочих сбоев.
 */
export const readYoutubeHttpStatus = (error: unknown): number | undefined => {
  if (!(error instanceof Error)) return undefined

  const match = HTTP_STATUS_PATTERN.exec(error.message)

  return match ? Number(match[1]) : undefined
}

/**
 * Признак блокировки клиента InnerTube: 403 значит, что смена клиента может
 * помочь (PO-токен/политика), в отличие от сетевого сбоя.
 * @param error - Ошибка клиента InnerTube.
 */
export const isYoutubeForbiddenError = (error: unknown): boolean =>
  readYoutubeHttpStatus(error) === 403

/**
 * Код ошибки импорта для статуса проигрываемости видео.
 * @param status - Статус из `playability_status.status`.
 * @returns Код импорта либо `null`, когда видео можно качать.
 */
export const toImportErrorCode = (
  status: undefined | YoutubePlayabilityStatus,
): ImportErrorCode | null => {
  if (status === 'LOGIN_REQUIRED') return 'login-required'
  if (status !== undefined && status !== 'OK') return 'video-unavailable'

  return null
}

/**
 * Проверяет, что видео можно скачать: оно доступно без входа и не идёт в прямом
 * эфире. Отсутствующий статус проигрываемости допускаем — InnerTube иногда его не
 * присылает.
 * @param props - Данные видео, нужные для проверки.
 * @param props.isLive - Идёт ли прямая трансляция.
 * @param props.status - Статус проигрываемости.
 */
export const assertVideoIsDownloadable = ({
  isLive,
  status,
}: {
  isLive: boolean
  status: undefined | YoutubePlayabilityStatus
}): void => {
  const code = toImportErrorCode(status)
  if (code !== null) throw new ImportSourceError(code)
  if (isLive) throw new ImportSourceError('live')
}

// Оригинал опознаём по display_name («original», эвристика yt-dlp): id дорожки —
// числовой дискриминатор без смысла, а audio_is_default у YouTube может указывать
// на дубль. Отсутствие audio_track — однодорожечное (оригинальное) видео.
const isOriginalAudioTrack = (format: YoutubeAudioFormat): boolean =>
  !format.audio_track ||
  Boolean(format.audio_track.display_name?.toLowerCase().includes('original'))

/**
 * Выбирает аудиодорожку в AAC/mp4: сначала itag 140 (совместим с плеером), иначе
 * самый высокобитрейтовый mp4-формат. При itag 140 берётся первый — в ответе
 * бывают дубли. Приоритет отдаётся оригинальным дорожкам, а не дублям/ASR.
 * @param formats - Все форматы видео из InnerTube.
 * @returns Выбранный формат либо `null`, если mp4-аудио нет.
 */
export const pickAudioFormat = <T extends YoutubeAudioFormat>(formats: T[]): null | T => {
  const audioFormats = formats.filter(
    format =>
      format.mime_type.startsWith('audio/') && format.mime_type.includes(PREFERRED_MIME_TYPE),
  )

  const originalFormats = audioFormats.filter(isOriginalAudioTrack)
  const candidates = originalFormats.length > 0 ? originalFormats : audioFormats

  return (
    candidates.find(format => format.itag === PREFERRED_ITAG) ??
    [...candidates].sort((first, second) => second.bitrate - first.bitrate)[0] ??
    null
  )
}
